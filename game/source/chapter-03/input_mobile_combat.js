/* Alpha 1.2.2: inputs belong to their devices; simulation belongs to the game tick.
 * Delta reference study: docs/DELTA_MOBILE_STUDY.md. Original browser implementation.
 */
const Input121={
  pad:[0,0],touch:[0,0],padRun:false,touchRun:false,padAttack:false,
  pointers:new Map(),stickPointer:null,stickOrigin:null,lastSource:'keyboard',
  mobile:false,controllerVisible:false,focused:true,roll:null,bufferUntil:0,
  recovery:0,game:null,wasCoop:false,lastArea:null
};
const CombatFeel121=Object.freeze({
  franco:{roll:.40,distance:2.36,cooldown:.85,grace:.23,recovery:.34,move:.40},
  ryuchi:{roll:.34,distance:2.93,cooldown:.64,grace:.22,recovery:.18,move:.82},
  alt:{roll:.36,distance:2.76,cooldown:.76,grace:.22,recovery:.35,move:.58},
  katana:{roll:.35,distance:2.70,cooldown:.72,grace:.22,recovery:.25,move:.66},
  synth:{roll:.39,distance:2.42,cooldown:.82,grace:.23,recovery:.31,move:.52},
  percussion:{roll:.38,distance:2.53,cooldown:.78,grace:.23,recovery:.30,move:.53}
});
function feel121(id){return CombatFeel121[id]||CombatFeel121.franco}
function canBody121(x,y){
  if(!current||!Number.isFinite(x)||!Number.isFinite(y))return false;
  const r=.29;
  return tileWalkable(current,x-r,y-r)&&tileWalkable(current,x+r,y-r)&&
    tileWalkable(current,x-r,y+r)&&tileWalkable(current,x+r,y+r);
}
function moveActor121(body,dx,dy,distance){
  if(!Number.isFinite(distance)||distance<=0)return false;
  const ox=body.x,oy=body.y,steps=Math.max(1,Math.ceil(distance/.075));
  for(let i=0;i<steps;i++){
    const nx=body.x+dx*distance/steps,ny=body.y+dy*distance/steps;
    if(canBody121(nx,body.y))body.x=nx;
    if(canBody121(body.x,ny))body.y=ny;
  }
  return Math.hypot(body.x-ox,body.y-oy)>1e-6;
}
function safeSpawn121(x,y){
  if(canBody121(x,y))return {x,y};
  for(let radius=.25;radius<=4;radius+=.25)for(let i=0;i<24;i++){
    const a=i*Math.PI/12,p={x:x+Math.cos(a)*radius,y:y+Math.sin(a)*radius};
    if(canBody121(p.x,p.y))return p;
  }
  return null;
}
function segmentFree121(a,b){
  const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(d/.12));
  for(let i=1;i<=n;i++)if(!canBody121(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;
  return true;
}
function pullRoute121(from,to){
  if(segmentFree121(from,to))return [{x:to.x,y:to.y}];
  const w=current.w,h=current.h,start=Math.floor(from.y)*w+Math.floor(from.x),
    goal=Math.floor(to.y)*w+Math.floor(to.x),queue=[start],parent=new Map([[start,null]]);
  for(let head=0;head<queue.length&&head<w*h;head++){
    const key=queue[head],x=key%w,y=Math.floor(key/w);
    if(key===goal)break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,nkey=ny*w+nx;
      if(nx<1||ny<1||nx>=w-1||ny>=h-1||parent.has(nkey)||!canBody121(nx+.5,ny+.5))continue;
      if(key===start&&!segmentFree121(from,{x:nx+.5,y:ny+.5}))continue;
      parent.set(nkey,key);queue.push(nkey);
    }
  }
  if(!parent.has(goal))return [];
  const path=[];let key=goal;
  while(key!==start&&key!==null){path.push({x:key%w+.5,y:Math.floor(key/w)+.5});key=parent.get(key)}
  path.reverse();path.push({x:to.x,y:to.y});
  while(path.length>1&&segmentFree121(from,path[1]))path.shift();
  return path;
}
// Reposition only on a real scene/load boundary. Distance never resets a position.
C3.syncCoop=function(force=false){
  if(!C3.coopActive())return;
  const c=C3.coop;
  if(force||c.area!==G.area||c.game!==G){
    const point=safeSpawn121(G.x-.65,G.y+.55)||safeSpawn121(G.x,G.y);
    if(!point)return;
    Object.assign(c,point,{area:G.area,game:G,dir:G.dir,dash:0,invuln:1,route:[],routeAt:0,lastGood:point,moving:false});
  }else if(!canBody121(c.x,c.y)){
    // A changed quest barrier or legacy invalid position must never require disconnecting.
    const point=c.lastGood&&canBody121(c.lastGood.x,c.lastGood.y)?c.lastGood:safeSpawn121(c.x,c.y);
    if(point)Object.assign(c,point,{dash:0,route:[],routeAt:0});
  }
};
C3.coopMove=function(pad,dt){
  const c=C3.coop;if(!C3.coopActive()||!activeModes10()||!Input121.focused){c.moving=false;return}
  C3.syncCoop();
  const ox=c.x,oy=c.y;let [dx,dy]=C3.padDirection(pad),n=Math.hypot(dx,dy);
  if(c.dash>0){[dx,dy]=c.dashDir||C3.coopVector();n=1}
  const distance=Math.hypot(c.x-G.x,c.y-G.y),running=C3.padPressed(pad,6)||C3.padPressed(pad,10)||n>.82;
  c.routeAt=(c.routeAt||0)-dt;c.pulling=distance>6.0;
  if(c.pulling){
    const targetKey=Math.floor(G.x)+','+Math.floor(G.y);
    if(c.routeAt<=0||c.routeGoal!==targetKey||!c.route?.length){c.route=pullRoute121(c,G);c.routeAt=.25;c.routeGoal=targetKey}
    while(c.route?.length&&Math.hypot(c.route[0].x-c.x,c.route[0].y-c.y)<.16)c.route.shift();
    const p=c.route?.[0];
    if(p){const px=p.x-c.x,py=p.y-c.y,pn=Math.hypot(px,py);dx=px/Math.max(.001,pn);dy=py/Math.max(.001,pn);n=1}
    else {dx=dy=0;n=0}
  }
  const f=feel121(C3.coopMember()),rollSpeed=f.distance/f.roll;
  const speed=c.pulling?Math.min(8.5,5.4+(distance-6)*1.6):c.dash>0?rollSpeed:(running?6.1:3.7)*(c.recovery>0?f.move:1);
  if(n>.06)moveActor121(c,dx,dy,speed*dt);
  c.moving=Math.hypot(c.x-ox,c.y-oy)>.001;c.running=running||c.pulling;
  if(c.moving){
    c.stride=(c.stride||0)+Math.hypot(c.x-ox,c.y-oy);
    if(Math.abs(dx)>Math.abs(dy))c.dir=dx<0?'left':'right';else c.dir=dy<0?'up':'down';
  }
  if(canBody121(c.x,c.y))c.lastGood={x:c.x,y:c.y};
};
const moveBodyBefore121=moveBody10;
moveBody10=function(dx,dy,distance,updateFacing=true){
  if(C3.coopActive()&&Input121.wasCoop&&Math.hypot(G.x-C3.coop.x,G.y-C3.coop.y)>7.6){
    const away=(G.x-C3.coop.x)*dx+(G.y-C3.coop.y)*dy;
    if(away>0)return false;
  }
  return moveBodyBefore121(dx,dy,distance,updateFacing);
};
const followerBefore121=getFollower;
getFollower=function(index){
  if(C3.coopActive()){
    C3.syncCoop();const others=partyMembers().filter(id=>id!==G.active);
    if(others[index]===C3.coopMember())return {x:C3.coop.x,y:C3.coop.y,dir:C3.coop.dir};
    return C3_gamepadFollowerBase(index);
  }
  return followerBefore121(index);
};

function inputVector121(){
  if(!activeModes10())return [0,0];
  const x=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),
    y=(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0),n=Math.hypot(x,y);
  if(n)return [x/n,y/n];
  const p=Input121.pad,t=Input121.touch;return Math.hypot(...t)>.01?t:p;
}
function mergeInput121(){
  const [x,y]=inputVector121();
  touchDir.left=x<-.035;touchDir.right=x>.035;touchDir.up=y<-.035;touchDir.down=y>.035;
  runningTouch=Input121.touchRun||Input121.padRun;
  attackHeld=Input121.padAttack||[...Input121.pointers.values()].some(p=>p.action==='attack');
  if(G&&Math.hypot(x,y)>.04)G.aim091=[x/Math.hypot(x,y),y/Math.hypot(x,y)];
}
const moveGBefore121=moveG;
moveG=function(dx,dy,dt){
  if(!activeModes10())return false;
  const v=inputVector121(),n=Math.hypot(...v),f=feel121(G?.active);
  if(n>.01){dx=v[0];dy=v[1]}
  const scale=Input121.recovery>0?f.move:1;
  return moveGBefore121(dx*scale,dy*scale,dt);
};
combatInput10=function(){return inputVector121()};
combatDirection10=function(){
  const v=inputVector121(),n=Math.hypot(...v);
  if(n>.04)return [v[0]/n,v[1]/n];
  return G?.aim091||({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[G?.dir]||[0,1];
};
function startRoll121(){
  if(!combatAlive10()||!activeModes10()||Combat10.dashTime>0||Combat10.iaiTime>0||act.dashCD>0)return false;
  const f=feel121(G.active),d=combatDirection10();
  Input121.game=G;Input121.lastArea=G.area;
  G.dir=Math.abs(d[0])>Math.abs(d[1])?(d[0]<0?'left':'right'):(d[1]<0?'up':'down');
  Combat10.area=G.area;Combat10.active=G.active;Combat10.vx=Combat10.vy=0;Combat10.guard=0;
  Combat10.dashDir=[...d];Combat10.dashTime=f.roll;act.dash=f.roll;act.dashCD=f.cooldown;
  act.invuln=Math.max(act.invuln||0,f.grace);act.slash=0;Input121.recovery=0;
  Input121.roll={id:G.active,dir:G.dir,duration:f.roll,speed:f.distance/f.roll};
  Input121.bufferUntil=0;effect10('dash',G.x,G.y,d,.24,1,'#b2c9ce');playTone(430,.09,'triangle',.045);return true;
}
dodgeAction=function(){
  if(!G||!activeModes10())return false;
  if(startRoll121())return true;
  if(Combat10.dashTime<=0&&(act.dashCD||0)<.14)Input121.bufferUntil=tick+.14;
  return false;
};
const tickMotionBefore121=tickMotion10;
tickMotion10=function(dt){
  if(Input121.bufferUntil>tick&&Combat10.dashTime<=0&&(act.dashCD||0)<=0)startRoll121();
  if(Combat10.dashTime>0&&Input121.roll){
    const step=Math.min(dt,Combat10.dashTime),r=Input121.roll;
    moveBody10(Combat10.dashDir[0],Combat10.dashDir[1],r.speed*step,false);
    Combat10.dashTime=Math.max(0,Combat10.dashTime-dt);act.dash=Combat10.dashTime;
    G.moveSpeed10=r.speed;G.isRunning10=true;
    if(Combat10.dashTime===0){Combat10.vx=Combat10.vy=0;G.moveSpeed10=0;G.isRunning10=false;Input121.roll=null}
    return;
  }
  return tickMotionBefore121(dt);
};
const resetMotionBefore121=resetMotion10;
resetMotion10=function(...args){Input121.roll=null;Input121.bufferUntil=0;Input121.recovery=0;return resetMotionBefore121(...args)};
const attackBefore121=attackAction;
attackAction=function(){
  const before=act.cool||0,result=attackBefore121();
  if((act.cool||0)>before){const f=feel121(G.active);Input121.recovery=f.recovery;}
  return result;
};
C3.coopDodge=function(pad){
  const c=C3.coop;if(!C3.coopActive()||!activeModes10()||c.dashCD>0)return false;
  const f=feel121(C3.coopMember()),v=C3.padDirection(pad),n=Math.hypot(...v);
  c.dashDir=n>.08?[v[0]/n,v[1]/n]:C3.coopVector();c.rollDuration=f.roll;c.dash=f.roll;c.dashCD=f.cooldown;c.invuln=f.grace;
  C3.padPulse(pad,.12,.2,80);return true;
};
const coopAttackBefore121=C3.coopAttack;
C3.coopAttack=function(pad){
  if(!C3.coopActive()||C3.coop.dash>0||!combatAreas10.has(G.area))return;
  const before=C3.coop.cool;coopAttackBefore121(pad);
  if(C3.coop.cool>before){
    const f=feel121(C3.coopMember());C3.coop.recovery=f.recovery;
    C3.coop.cool=Math.max(C3.coop.cool,f.recovery);
  }
};
for(const action of ['coopSkill','coopAdvanced','coopSignature']){
  const previous=C3[action];
  C3[action]=function(pad){if(!C3.coopActive()||C3.coop.dash>0||!combatAreas10.has(G.area))return;return previous(pad)};
}
const actorBefore121=drawActor;
drawActor=function(p,x,y,moving=false){
  const c=C3.coop,p2=C3.coopActive()&&p.style===C3.coopMember()&&Math.abs(x-(c.x*T-cam.x))<2&&Math.abs(y-(c.y*T-cam.y))<2,
    r=p2&&c.dash>0?{left:c.dash,duration:c.rollDuration,dir:c.dir}:p.style===G?.active&&Input121.roll&&Combat10.dashTime>0?{left:Combat10.dashTime,...Input121.roll}:null;
  if(r){
    const image=C3.images.prebeta_roll,row=PB.heroRows[p.style];
    if(image?.complete&&image.naturalWidth&&row!==undefined){
      const frame=Math.min(5,Math.floor((1-r.left/r.duration)*6)),sw=image.naturalWidth/6,sh=image.naturalHeight/6;
      ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));if(r.dir==='left')ctx.scale(-1,1);
      ctx.drawImage(image,frame*sw,row*sh,sw,sh,-34,-57,68,68);ctx.restore();return;
    }
  }
  if(p2){
    const speed=G.moveSpeed10,running=G.isRunning10;G.moveSpeed10=c.moving?(c.running?6.1:3.7):0;G.isRunning10=c.running;
    try{return actorBefore121(p,x,y,c.moving)}finally{G.moveSpeed10=speed;G.isRunning10=running}
  }
  return actorBefore121(p,x,y,moving);
};

/* Authored boss pacing: telegraph -> resolution -> punish window.
 * REA study established separate selection/preparation/end stages in the reference;
 * these timings and attacks belong to Torii, not to the inspected game.
 */
const hazardsBefore121=C3.updateHazards;
C3.updateHazards=function(dt,enemy){
  const hadPattern=C3.hazards.length>0;hazardsBefore121(dt,enemy);
  if(hadPattern&&!C3.hazards.length&&bossActor===enemy&&!C3.finalPending){
    enemy.recovery121=enemy.phase===3?.68:.88;
    enemy.stun=Math.max(enemy.stun||0,enemy.recovery121);enemy.cd=Math.max(enemy.cd||0,enemy.recovery121);
  }
};
const enemyBefore121=updateEnemy;
updateEnemy=function(enemy,dt,boss=false){
  if(enemy)enemy.recovery121=Math.max(0,(enemy.recovery121||0)-dt);
  return enemyBefore121(enemy,dt,boss);
};
const castBefore121=C3.castPattern;
C3.castPattern=function(enemy,kind){
  if(kind===enemy.lastPattern121){
    const pool=enemy.id==='c3_silence'&&C3.bossPattern.length?C3.bossPattern:['ring','cross','fan','pulse'];
    kind=pool.find(next=>next!==kind)||kind;
  }
  enemy.lastPattern121=kind;enemy.targetTurn121=(enemy.targetTurn121||0)+1;
  if(C3.coopActive()&&enemy.targetTurn121%2===0){
    const x=G.x,y=G.y;G.x=C3.coop.x;G.y=C3.coop.y;
    try{return castBefore121(enemy,kind)}finally{G.x=x;G.y=y}
  }
  return castBefore121(enemy,kind);
};
const combatLayerBefore121=drawCombatLayer;
drawCombatLayer=function(){
  combatLayerBefore121();if(!bossActor||!(bossActor.recovery121>0))return;
  const x=bossActor.x*T-cam.x,y=bossActor.y*T-cam.y-92;
  ctx.save();ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle='#a5efdd';ctx.fillText('ABERTURA · CONTRA-ATAQUE',x,y);ctx.restore();
};

// Physical controllers never mutate touch-owned input. Polling does not move actors.
C3.handlePrimaryPad=function(pad){
  Input121.pad=C3.padDirection(pad);Input121.padRun=C3.padPressed(pad,6)||C3.padPressed(pad,10)||Math.hypot(...Input121.pad)>.82;
  Input121.padAttack=C3.padPressed(pad,2)&&!!G&&activeModes10();mergeInput121();
  if(C3.padEdge(pad,9)&&G){if(mode==='overlay')closeOverlay();else if(activeModes10())openSystem();return}
  if(!G||['title','overlay'].includes(mode))return C3.handleMenuPad(pad);
  if(mode==='rhythm'){
    [0,2,3].forEach((b,i)=>{if(C3.padEdge(pad,b))rhythmPush(i)});return;
  }
  if(mode==='dialogue'){if(C3.padEdge(pad,0))advanceDialogue();return}
  if(!activeModes10())return;
  if(C3.padEdge(pad,0))interact();
  if(C3.padEdge(pad,1))dodgeAction();
  if(C3.padEdge(pad,3))switchHero();
  if(C3.padEdge(pad,4))skillAction();if(C3.padEdge(pad,5))advancedSkill();if(C3.padEdge(pad,7))duoAction();
};
C3.handleSecondPad=function(pad){
  if(!C3.coopActive())return;
  if(C3.padEdge(pad,9)&&G){if(mode==='overlay')closeOverlay();else if(activeModes10())openSystem();return}
  if(mode==='dialogue'){if(C3.padEdge(pad,0))advanceDialogue();return}
  if(!activeModes10())return;
  if(C3.padEdge(pad,0)&&Math.hypot(C3.coop.x-G.x,C3.coop.y-G.y)<2.2)interact();
  if(C3.padPressed(pad,2))C3.coopAttack(pad);
  if(C3.padEdge(pad,1))C3.coopDodge(pad);
  if(C3.padEdge(pad,4))C3.coopSkill(pad);if(C3.padEdge(pad,5))C3.coopAdvanced(pad);
  if(C3.padEdge(pad,7))C3.coopSignature(pad);if(C3.padEdge(pad,3))C3.cycleCoop();
};
C3.pollControllers=function(now){
  let pads=[];try{pads=[...(navigator.getGamepads?.()||[])].filter(p=>p&&p.connected!==false).sort((a,b)=>a.index-b.index)}catch(_){}
  const oldCount=C3.pad.pads.length;C3.pad.pads=pads;
  if(Input121.focused){
    if(pads[0])C3.handlePrimaryPad(pads[0]);
    else {Input121.pad=[0,0];Input121.padRun=false;Input121.padAttack=false;mergeInput121()}
    if(pads[1])C3.handleSecondPad(pads[1]);
  }
  for(const p of pads)C3.pad.previous.set(p.index,p.buttons.map(b=>!!b.pressed));
  for(const index of C3.pad.previous.keys())if(!pads.some(p=>p.index===index))C3.pad.previous.delete(index);
  if(oldCount!==pads.length)updateMobileLayout121();
  if(now-(C3.pad.statusAt||0)>300){C3.pad.statusAt=now;C3.updatePadStatus();updateMobileReadout121()}
  C3.pad.raf=requestAnimationFrame(C3.pollControllers);
};
const updateBefore121=update;
update=function(dt){
  if(!G)return updateBefore121(dt);
  if(!activeModes10()){releaseAll121();G.moveSpeed10=0;G.isRunning10=false;}
  const boundary=Input121.game!==G||Input121.lastArea!==G.area;
  if(boundary){Input121.game=G;Input121.lastArea=G.area;Input121.roll=null;Input121.recovery=0;C3.coop.area=''}
  mergeInput121();const coop=C3.coopActive();
  if(coop){C3.syncCoop(!Input121.wasCoop);if(activeModes10())C3.coopMove(C3.pad.pads[1],Math.min(dt,.06))}
  Input121.wasCoop=coop;
  if(activeModes10())Input121.recovery=Math.max(0,Input121.recovery-dt);
  const result=updateBefore121(dt);
  if(coop&&activeModes10()){C3.coop.recovery=Math.max(0,(C3.coop.recovery||0)-dt);C3.updateCoopCombat(dt)}
  return result;
};

function releaseTouch121(){
  Input121.pointers.clear();Input121.stickPointer=null;Input121.stickOrigin=null;
  Input121.touch=[0,0];Input121.touchRun=false;
  const knob=$('mobileKnob121');if(knob)knob.style.transform='translate(-50%,-50%)';
  document.querySelectorAll('#mobileDeck121 .pressed').forEach(b=>b.classList.remove('pressed'));
  mergeInput121();
}
function releaseAll121(){Input121.pad=[0,0];Input121.padRun=false;Input121.padAttack=false;keys={};C3.coop.dash=0;C3.coop.moving=false;releaseTouch121();resetMotion10()}
const overlayBefore121=openOverlay;
openOverlay=function(...args){releaseTouch121();return overlayBefore121(...args)};
function mobileStick121(e){
  if(!activeModes10())return;
  const s=Input121.stickOrigin;if(!s)return;
  const dx=e.clientX-s.x,dy=e.clientY-s.y,r=s.radius,n=Math.hypot(dx,dy),m=Math.min(1,n/r),value=m<.14?0:(m-.14)/.86;
  Input121.touch=n?[dx/n*value,dy/n*value]:[0,0];Input121.touchRun=m>.88;
  $('mobileKnob121').style.transform=`translate(calc(-50% + ${n?dx/n*m*r:0}px),calc(-50% + ${n?dy/n*m*r:0}px))`;
  mergeInput121();
}
function mobileAction121(action){
  if(action==='pause'){if(G&&activeModes10())openSystem();return}
  if(action==='full'){const app=$('app');if(!document.fullscreenElement)app.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.();return}
  if(action==='interact'){if(mode==='dialogue')advanceDialogue();else interact();return}
  if(!G||!activeModes10())return;
  ({attack:attackAction,dodge:dodgeAction,skill:skillAction,advanced:advancedSkill,signature:duoAction,switch:switchHero})[action]?.();
}
function bindMobile121(deck){
  deck.addEventListener('contextmenu',e=>e.preventDefault());
  deck.addEventListener('pointerdown',e=>{
    const target=e.target.closest('[data-mobile-action],#mobileStick121');if(!target)return;
    e.preventDefault();enableAudio();Input121.lastSource='touch';
    if(target.id==='mobileStick121'){
      if(!activeModes10())return;
      if(Input121.stickPointer!==null)return;
      Input121.stickPointer=e.pointerId;const box=target.getBoundingClientRect();
      Input121.stickOrigin={x:box.left+box.width/2,y:box.top+box.height/2,radius:box.width*.32};
      Input121.pointers.set(e.pointerId,{action:'stick'});mobileStick121(e);
    }else{
      const action=target.dataset.mobileAction;Input121.pointers.set(e.pointerId,{action,target});target.classList.add('pressed');mobileAction121(action);mergeInput121();
    }
    target.setPointerCapture?.(e.pointerId);
  },{passive:false});
  deck.addEventListener('pointermove',e=>{if(e.pointerId===Input121.stickPointer){e.preventDefault();mobileStick121(e)}},{passive:false});
  const release=e=>{
    const p=Input121.pointers.get(e.pointerId);if(!p)return;
    Input121.pointers.delete(e.pointerId);
    if(e.pointerId===Input121.stickPointer){Input121.stickPointer=null;Input121.stickOrigin=null;Input121.touch=[0,0];Input121.touchRun=false;$('mobileKnob121').style.transform='translate(-50%,-50%)'}
    if(p.target&&![...Input121.pointers.values()].some(x=>x.target===p.target))p.target.classList.remove('pressed');
    mergeInput121();
  };
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>deck.addEventListener(name,release));
}
function updateMobileReadout121(){
  if(!Input121.mobile)return;
  const readout=$('mobileReadout121');if(!readout)return;
  const id=G?.active,goal=$('questText')?.textContent||$('mobileObjective')?.textContent||$('quest')?.textContent||'';
  readout.textContent=G?(labels10[id]||id)+' · ♥ '+(G.hp[id]||0)+'/'+(G.maxhp[id]||0):'TORII & HUTUKARA';
  const hint=$('mobileGoal121');if(hint)hint.textContent=goal.replace(/^✦\s*/,'').slice(0,150);
}
function updateMobileLayout121(){
  const query=new URLSearchParams(location.search),forced=query.get('input'),mobile=forced==='mobile'||forced!=='desktop'&&(
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&(matchMedia('(pointer:coarse)').matches||/Macintosh/.test(navigator.userAgent)));
  const changed=Input121.mobile!==mobile;Input121.mobile=mobile;
  document.documentElement.classList.toggle('mobile121',mobile);
  document.documentElement.classList.toggle('desktop121',!mobile);
  const physical=C3.pad.pads.length>0&&!Input121.controllerVisible;
  document.documentElement.classList.toggle('physical121',mobile&&physical);
  document.documentElement.classList.toggle('hasGamepad121',mobile&&C3.pad.pads.length>0);
  const toggle=$('showTouch121');if(toggle)toggle.textContent=Input121.controllerVisible?'OCULTAR TOQUE':'CONTROLES DE TOQUE';
  const vv=window.visualViewport,w=vv?.width||innerWidth,h=vv?.height||innerHeight;
  document.documentElement.style.setProperty('--mobile-height',h+'px');
  document.documentElement.classList.toggle('landscape121',w>h);
  const portrait=mobile&&w<=h,newWidth=portrait?512:768,newHeight=portrait?480:432;
  if(VW!==newWidth||VH!==newHeight){
    VW=newWidth;VH=newHeight;const canvas=$('game');canvas.width=VW;canvas.height=VH;
    ctx.imageSmoothingEnabled=false;releaseTouch121();
  }
  document.documentElement.style.setProperty('--game-ratio',VW+'/'+VH);
  document.documentElement.style.setProperty('--game-aspect',String(VW/VH));
  if(changed)releaseTouch121();updateMobileReadout121();
}
function installMobile121(){
  if($('mobileDeck121'))return;
  const style=document.createElement('style');style.textContent=MOBILE_CSS121;document.head.appendChild(style);
  const deck=document.createElement('section');deck.id='mobileDeck121';deck.setAttribute('aria-label','Controle de toque Torii & Hutukara');
  deck.innerHTML=`<div id="mobileLeft121"><div id="mobileReadout121"></div><div id="mobileGoal121"></div><div id="mobileStick121" role="group" aria-label="Analógico virtual: mover; borda para correr"><span class="stickArrows121">＋</span><span id="mobileKnob121"></span></div><small>MOVER · BORDA PARA CORRER</small></div><div id="mobileRight121"><div class="mobileTools121"><button data-mobile-action="pause" aria-label="Pausar jogo">☰ PAUSA</button><button data-mobile-action="full" aria-label="Tela cheia">⛶</button></div><div class="mobileActions121"><button data-mobile-action="skill">TÉCNICA</button><button data-mobile-action="advanced">TÉCNICA II</button><button data-mobile-action="signature">ESPECIAL</button><button data-mobile-action="attack" class="attack121">ATACAR</button><button data-mobile-action="dodge" class="dodge121">ROLAR</button><button data-mobile-action="interact" class="interact121">AÇÃO</button><button data-mobile-action="switch" class="switch121">TROCAR PERSONAGEM</button></div></div>`;
  $('app').appendChild(deck);bindMobile121(deck);
  const toggle=document.createElement('button');toggle.id='showTouch121';toggle.textContent='CONTROLES DE TOQUE';toggle.onclick=()=>{Input121.controllerVisible=!Input121.controllerVisible;updateMobileLayout121()};$('app').appendChild(toggle);
  window.addEventListener('resize',()=>{releaseTouch121();updateMobileLayout121()});
  window.visualViewport?.addEventListener('resize',updateMobileLayout121);
  window.addEventListener('orientationchange',releaseTouch121);
  window.addEventListener('blur',()=>{Input121.focused=false;releaseAll121()});
  window.addEventListener('focus',()=>{Input121.focused=true});
  document.addEventListener('visibilitychange',()=>{Input121.focused=!document.hidden;if(document.hidden)releaseAll121()});
  updateMobileLayout121();
}
const MOBILE_CSS121=`
#mobileDeck121,#showTouch121{display:none}html.desktop121 #touch{display:none!important}
html.mobile121,html.mobile121 body{height:100%;width:100%;overflow:hidden;overscroll-behavior:none}
.mobile121 #app{height:var(--mobile-height,100dvh);min-height:0;width:100%;display:grid;grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) 258px;padding:max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));gap:8px;overflow:hidden}
.mobile121 .brandbar,.mobile121 .footer,.mobile121 #touch,.mobile121 #mobileObjective{display:none!important}
.mobile121 #frame{grid-row:1;width:100%;height:auto;max-height:100%;aspect-ratio:var(--game-ratio,16/9);align-self:center;border-width:1px;box-shadow:0 0 0 2px #49354d;overflow:hidden}
.mobile121 #game{object-fit:contain}.mobile121 #frame:before,.mobile121 #frame:after{display:none}
.mobile121 #mobileDeck121{grid-row:2;display:grid;grid-template-columns:43% 57%;gap:8px;min-height:0;background:linear-gradient(140deg,#242137,#10131e);border:1px solid #8c799866;border-radius:22px;padding:8px;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
#mobileLeft121{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-width:0}
#mobileReadout121{font:700 11px monospace;color:#f3deb4;min-height:14px;text-align:center}
#mobileGoal121{font:10px/1.3 monospace;color:#d1c7d7;max-height:28px;overflow:hidden;width:100%;text-align:center}
#mobileLeft121 small{font:8px monospace;color:#a6b9cb;text-align:center}
#mobileStick121{width:136px;height:136px;border:2px solid #8bb8c36b;border-radius:50%;position:relative;touch-action:none;background:radial-gradient(circle,#43506577,#111a2a);box-shadow:inset 0 2px 16px #050813;flex-shrink:0}
.stickArrows121{position:absolute;inset:0;display:grid;place-items:center;color:#68798d;font:110px/1 monospace;pointer-events:none}
#mobileKnob121{position:absolute;left:50%;top:50%;width:62px;height:62px;transform:translate(-50%,-50%);border:2px solid #c6cedc88;background:radial-gradient(circle at 35% 25%,#78879b,#2d3549);border-radius:50%;box-shadow:0 4px 7px #0008;pointer-events:none}
#mobileRight121{display:flex;flex-direction:column;justify-content:center;gap:8px;min-width:0}.mobileTools121{display:flex;justify-content:space-between;gap:8px}
#mobileDeck121 button,#showTouch121{min-height:44px;touch-action:none;color:#f5e6ce;background:#383044;border:1px solid #b9a5b485;border-radius:14px;font:700 10px monospace;user-select:none;-webkit-user-select:none;padding:4px}
.mobileTools121 button{flex:1;min-height:34px!important}.mobileActions121{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.mobileActions121 button{height:56px}.mobileActions121 .attack121{background:#955964!important;border-color:#f3abb7!important}.mobileActions121 .dodge121{background:#365a79!important;border-color:#85c6e9!important}.mobileActions121 .interact121{background:#38685e!important;border-color:#a3dac7!important}.switch121{grid-column:1/-1;height:40px!important}
#mobileDeck121 .pressed{filter:brightness(1.4);transform:translateY(2px);box-shadow:inset 0 2px 6px #0007}
.mobile121 #dialogue{position:fixed;inset:auto 8px calc(274px + env(safe-area-inset-bottom)) 8px;max-height:48%;min-height:0;overflow:auto;padding:8px;gap:8px;z-index:10020}
.mobile121 .portrait{min-width:52px;width:64px;height:80px;object-fit:cover}.mobile121 .words{font-size:15px;line-height:1.35}.mobile121 .speaker{font-size:10px}.mobile121 .continue{font-size:9px}
.mobile121 #overlay,.mobile121 #rhythm{position:fixed;inset:0;z-index:10030;padding:max(10px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));overflow:auto}
.mobile121 #overlayInner,.mobile121 .rhythmBox{max-height:94%;width:100%;padding:14px!important;overflow:auto}.mobile121 .window p{font-size:14px}.mobile121 .action{min-height:44px;font-size:12px;padding:10px}
.mobile121 #vitals092{top:36px;left:5px;width:128px;font-size:8px;padding:3px 5px}.mobile121 #vitals092 .reserve{font-size:7px}.mobile121 #vitals092 .tech-row10{display:none}
.mobile121 .hud-top{padding:4px}.mobile121 .location{padding:4px 6px;max-width:74%;max-height:32px}.mobile121 .location h3{font-size:10px}.mobile121 .location small{font-size:7px}.mobile121 .hudbuttons{max-width:25%}.mobile121 #bMenu{font-size:9px;min-height:28px;padding:4px}
.mobile121 #actionHUD{width:39%;left:auto!important;right:4px!important;bottom:4px!important;font-size:8px}.mobile121 .action-label{padding:3px;min-width:0}.mobile121 #actionSkill,.mobile121 #actionXP,.mobile121 .action-party{display:none}.mobile121 .guidechip{font-size:8px;bottom:5px!important;max-width:60%}.mobile121 .prompt{font-size:9px;bottom:4px;padding:5px}
.mobile121 #start h1{font-size:24px}.mobile121 #start img{height:42px}.mobile121 #start .menuButton{min-height:38px;padding:8px;font-size:12px}.mobile121 #start .sub{font-size:9px}.mobile121 #start .version{margin-top:5px;font-size:8px}.mobile121 #toast{position:fixed;left:8px;right:8px;top:8px;transform:none;font-size:11px;z-index:10040}.mobile121 #gamepadStatus{font-size:9px;bottom:3px}
.mobile121.landscape121 #app{grid-template-columns:142px minmax(0,1fr) 184px;grid-template-rows:1fr;gap:8px}
.mobile121.landscape121 #frame{grid-column:2;grid-row:1}.mobile121.landscape121 #mobileDeck121{display:contents}
.mobile121.landscape121 #mobileLeft121{grid-column:1;grid-row:1}.mobile121.landscape121 #mobileRight121{grid-column:3;grid-row:1}
.mobile121.landscape121 #mobileStick121{width:126px;height:126px}.mobile121.landscape121 #mobileKnob121{width:56px;height:56px}
.mobile121.landscape121 #dialogue{left:154px;right:196px;bottom:16px;max-height:84%}.mobile121.landscape121 #dialogue .portrait{width:52px;min-width:42px;height:68px}.mobile121.landscape121 .words{font-size:14px}
.mobile121.physical121 #app{display:flex;justify-content:center}.mobile121.physical121 #frame{width:min(100%,calc((var(--mobile-height) - 48px)*var(--game-aspect)));max-height:calc(var(--mobile-height) - 48px)}
.mobile121.physical121 #mobileDeck121,.mobile121.physical121 #mobileLeft121,.mobile121.physical121 #mobileRight121{display:none!important}.mobile121 #showTouch121{display:none}.mobile121.hasGamepad121 #showTouch121{display:block;position:fixed;bottom:max(6px,env(safe-area-inset-bottom));right:8px;min-height:30px;font-size:9px;padding:6px 10px;z-index:9999}
.mobile121.physical121 #dialogue{left:12px;right:12px;bottom:45px;max-height:65%}
@media(max-height:430px){.mobile121.landscape121 #mobileStick121{width:108px;height:108px}.mobile121.landscape121 .mobileActions121 button{height:48px}.mobile121.landscape121 .switch121{height:36px!important}.mobile121.landscape121 #mobileGoal121{font-size:9px}.mobile121.landscape121 #mobileReadout121{font-size:10px}}
`;

// Landscape uses real positioned elements: no display:contents touch target tree.
const LANDSCAPE_CSS122=`
.mobile121.landscape121 #app{display:block;padding:0;gap:0}
.mobile121.landscape121 #frame{position:fixed;inset:0;width:100%;height:100%;max-height:none;aspect-ratio:auto;border:0;box-shadow:none}
.mobile121.landscape121 #mobileDeck121{display:block;position:fixed;inset:0;z-index:10010;background:none;border:0;border-radius:0;padding:0;pointer-events:none}
.mobile121.landscape121 #mobileLeft121{position:absolute;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));width:140px;pointer-events:none}
.mobile121.landscape121 #mobileRight121{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));width:210px;pointer-events:none}
.mobile121.landscape121 #mobileStick121,.mobile121.landscape121 #mobileDeck121 button{pointer-events:auto;touch-action:none;background:#15223655!important;border-color:#e9e4de80!important;box-shadow:none;opacity:.72}
.mobile121.landscape121 #mobileKnob121{background:#9caec055;box-shadow:none}
.mobile121.landscape121 #mobileReadout121,.mobile121.landscape121 #mobileGoal121,.mobile121.landscape121 #mobileLeft121 small{display:none}
.mobile121.landscape121 #mobileDeck121 button.pressed{opacity:1;background:#526b8d99!important}
.mobile121.landscape121 #dialogue{left:8px;right:8px;bottom:8px;max-height:90%;z-index:10020}
.mobile121.landscape121.physical121 #mobileDeck121{display:none!important}
`;
function musicChallenge122(){return mode==='rhythm'||!!document.querySelector('#overlay .voice-note-grid,#overlay .notes,#overlay #c3PhraseProgress')&&!document.getElementById('overlay').classList.contains('hidden')}
const soundscapeBefore122=soundscape;
soundscape=function(){if(musicChallenge122()){stopAlbum11(.04);return}return soundscapeBefore122()};
const startAlbumBefore122=startAlbum11;
startAlbum11=function(...args){if(musicChallenge122())return;return startAlbumBefore122(...args)};
const rhythmBefore122=openRhythm;
openRhythm=function(...args){releaseAll121();stopAlbum11(.04);return rhythmBefore122(...args)};
const talkBefore122=talk;
talk=function(...args){releaseAll121();if(G){G.moveSpeed10=0;G.isRunning10=false}return talkBefore122(...args)};

const initBefore121=init;
init=function(){
  initBefore121();installMobile121();const landscapeStyle=document.createElement('style');landscapeStyle.textContent=LANDSCAPE_CSS122;document.head.appendChild(landscapeStyle);
  document.title='Torii & Hutukara · Alpha 1.2.2 · Mobile & Co-op';
  const version=document.querySelector('#start .version');if(version)version.textContent='ALPHA 1.2.2 · MOBILE & CO-OP';
  const build=document.querySelector('.brandbar .build');if(build)build.innerHTML='TORII & HUTUKARA<br>ALPHA 1.2.2 · MOBILE & CO-OP';
};
