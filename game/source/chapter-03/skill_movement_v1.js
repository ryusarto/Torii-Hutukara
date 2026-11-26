/* Collision-safe skill movement. Gameplay values and action callbacks stay in
 * their original modules; the builder redirects only Ryuchi's legacy warp step.
 * Recovery is restricted to nearby, center-walkable overlap from old saves. */
(function(){
'use strict';
let game=null,area=null,map=null,lastGood=null;
const log=[];
const finite=body=>body&&Number.isFinite(body.x)&&Number.isFinite(body.y);
const cloudActive=()=>typeof CloudWorldV1!=='undefined'&&CloudWorldV1.active();
function session(){if(game!==G||area!==G?.area||map!==current){game=G;area=G?.area;map=current;lastGood=null}}
function remember(){session();if(finite(G)&&canBody121(G.x,G.y))lastGood={x:G.x,y:G.y}}
function centerPathFree(from,to){const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(distance/.025));for(let i=0;i<=steps;i++)if(!tileWalkable(current,from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps))return false;return true}
function localSafe(from){
 // An old sonic endpoint still has its center on floor, but one side overlaps
 // a solid tile by < .29. Never cross a blocked center or seek another room.
 for(let r=.025;r<=.75001;r+=.025)for(let i=0;i<64;i++){
  const angle=i*Math.PI/32,point={x:from.x+Math.cos(angle)*r,y:from.y+Math.sin(angle)*r};
  if(canBody121(point.x,point.y)&&centerPathFree(from,point))return point;
 }
 if(lastGood&&Math.hypot(lastGood.x-from.x,lastGood.y-from.y)<=.75&&canBody121(lastGood.x,lastGood.y)&&centerPathFree(from,lastGood))return{...lastGood};
 return null;
}
function recover(reason='tick',allowMenu=false){
 if(!G||!current||current.id!==G.area||!finite(G)||!(G.hp?.[G.active]>0)||cloudActive()||!(activeModes10()||allowMenu&&mode==='overlay'))return false;
 session();if(canBody121(G.x,G.y)){remember();return false}
 // Solid-center scripted placements, void/falls and scene transitions are not
 // this legacy overlap: leave their established checkpoint/scene owners alone.
 if(!tileWalkable(current,G.x,G.y))return false;
 const before={x:G.x,y:G.y},point=localSafe(before);if(!point)return false;
 G.x=point.x;G.y=point.y;Combat10.vx=Combat10.vy=0;Combat10.dashTime=Combat10.iaiTime=0;
 act.dash=0;Input121.roll=null;Input121.bufferUntil=0;G.moveSpeed10=0;G.isRunning10=false;
 trail=[];lastStep=0;lastGood={...point};log.push({reason,area:G.area,before,after:{...point}});if(log.length>12)log.shift();return true;
}
function warpStep(body,dx,dy,distance){
 if(!activeModes10()||!finite(body)||!Number.isFinite(distance)||distance<=0||!Number.isFinite(dx)||!Number.isFinite(dy))return false;
 const length=Math.hypot(dx,dy);if(length<1e-7)return false;dx/=length;dy/=length;
 // Cloud movement owns void entry and falling. Do not turn this skill into
 // flight or repair a character out of a deliberate fall.
 if(cloudActive())return body===G?moveBody10(dx,dy,distance,false):moveActor121(body,dx,dy,distance);
 if(body===G)recover('skill');if(!canBody121(body.x,body.y))return false;
 const before={x:body.x,y:body.y},steps=Math.max(1,Math.ceil(distance/.07));
 for(let i=0;i<steps;i++){
  const x=body.x+dx*distance/steps,y=body.y+dy*distance/steps;
  if(!canBody121(x,y))break;body.x=x;body.y=y;
 }
 const moved=Math.hypot(body.x-before.x,body.y-before.y)>1e-7;
 if(moved&&body===G){lastStep=0;trail.unshift({x:G.x,y:G.y,dir:G.dir});if(trail.length>180)trail.length=180;remember()}
 return moved;
}
const beforeUpdate=update;
update=function(...args){recover('update');const result=beforeUpdate.apply(this,args);if(G&&current&&activeModes10()&&!cloudActive())remember();return result};
for(const name of ['attackAction','skillAction','advancedSkill','duoAction','dodgeAction']){
 const before=window[name];if(typeof before!=='function')continue;
 window[name]=function(...args){recover(name);return before.apply(this,args)};
}
for(const name of ['save','exportSave','setCheckpoint']){
 const before=window[name];if(typeof before!=='function')continue;
 window[name]=function(...args){recover(name,name!=='setCheckpoint');return before.apply(this,args)};
}
window.SkillMovementV1={warpStep,recover,localSafe,snapshot:()=>({lastGood:lastGood&&{...lastGood},repairs:log.map(x=>({...x,before:{...x.before},after:{...x.after}}))})};
})();
