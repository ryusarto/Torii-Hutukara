/* Original dedicated bodies for the six encounter variants. Presentation only.
 * The encounter renderer calls draw() before its former proxy/aura path;
 * outer health/FX wrappers continue receiving the original actor unchanged.
 */
(function(){
'use strict';
const manifest=__ENEMY_VARIANT_V2_MANIFEST__,assets=__ENEMY_VARIANT_V2_ASSETS__,images={};
let game=null,area=null,clock=0,records=new WeakMap();
const stats={draws:0,fallbacks:0,casts:0};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const typeOf=e=>typeof e==='string'?e:e?.type;
const supports=e=>Object.hasOwn(manifest.enemies,typeOf(e));
function image(type){if(!images[type]&&assets[type]){const im=new Image();im.src=assets[type];images[type]=im}return images[type]}
function ready(e){const t=typeOf(e),m=manifest.enemies[t],im=m&&image(t);return !!(im?.complete&&im.naturalWidth===m.atlasSize[0]&&im.naturalHeight===m.atlasSize[1])}
function reset(){game=G;area=G?.area;clock=0;records=new WeakMap()}
function sync(){if(game!==G||area!==G?.area)reset()}
function record(e){let r=records.get(e);if(!r){const seed=String(e.id||e.type).split('').reduce((a,c)=>a+c.charCodeAt(0),0);r={windMax:Math.max(0,e.wind||0,e.f2canto||0,e.f2chamar||0),attackAt:-Infinity,attackUntil:-Infinity,state:null,stateAt:clock,seed};records.set(e,r)}return r}
function reduced(){return !!G?.options10?.reducedMotion||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}
function facing(e){
 const m=manifest.enemies[e.type],a=Number.isFinite(e.face)?e.face:Math.PI/2;
 if(m.shield){const x=Math.cos(a),y=Math.sin(a);return Math.abs(x)>=Math.abs(y)?x>=0?'right':'left':y>=0?'down':'up'}
 if(e.type==='flautim_atirador')return Math.cos(a)<0?'left':'right';
 return'down';
}
function pose(e){
 if(!supports(e))return null;sync();const r=record(e),m=manifest.enemies[e.type];
 const wind=Math.max(e.wind||0,e.f2canto||0,e.f2chamar||0),hurt=e.flash>0||e.stun>0;
 let state=hurt?'hurt':wind>0?'prepare':r.attackUntil>clock?'attack':m.shield&&(e.f2aberto>0||e.f2tonto>0)?'open':'idle';
 if(state!==r.state){r.state=state;r.stateAt=clock}
 let frame=0,row=manifest.states.indexOf(state);
 if(state==='prepare'){r.windMax=Math.max(r.windMax,wind);frame=Math.min(7,Math.floor(clamp(1-wind/Math.max(.001,r.windMax),0,1)*8))}
 else if(state==='attack')frame=Math.min(7,Math.floor(clamp((clock-r.attackAt)/.3,0,1)*8));
 else if(state==='hurt')frame=Math.min(7,Math.floor((clock-r.stateAt)/.065));
 else if(state==='open'){row=manifest.states.indexOf(m.openPose.state);frame=m.openPose.frame}
 else frame=Math.floor(clock/.14+r.seed)%8;
 if(reduced())frame=state==='prepare'?3:state==='attack'?4:state==='hurt'?3:state==='open'?m.openPose.frame:0;
 const direction=facing(e),face=m.facings[direction]||m.facings.down;
 return{type:e.type,state,frame,row:face.row+Math.max(0,row),direction,flipX:!!face.flipX,loaded:ready(e)};
}
function fallback(x,y,m,e){
 // A decoded, bounded native enemy is a load-error fallback only. It never
 // changes actor dimensions or paints the former role symbols/aura.
 if(typeof EnemyArtV1!=='undefined'){
  const proxy={type:m.legacyBase,wind:e.wind,flash:e.flash,stun:e.stun,emerge091:e.emerge091};
  EnemyArtV1.draw(x,y,m.legacyBase,proxy);
 }
 stats.fallbacks++;
}
function draw(x,y,kind,e){
 const type=e?.type||kind,m=manifest.enemies[type];if(!m||!e)return false;
 if(!Number.isFinite(x)||!Number.isFinite(y))return true;
 const p=pose(e);if(!p?.loaded){fallback(x,y,m,e);return true}
 const im=images[type],c=manifest.cell,scale=m.drawSize/c,[px,py]=manifest.pivot;
 ctx.save();try{
  ctx.imageSmoothingEnabled=false;if(e.emerge091>0)ctx.globalAlpha*=Math.max(.1,1-e.emerge091);
  ctx.translate(Math.round(x),Math.round(y));if(p.flipX)ctx.scale(-1,1);
  ctx.drawImage(im,p.frame*c,p.row*c,c,c,Math.round(-px*scale),Math.round(-py*scale),Math.round(c*scale),Math.round(c*scale));
 }finally{ctx.restore()}
 stats.draws++;if(p.state==='prepare'||p.state==='attack')stats.casts++;return true;
}
function headHeight(e){const m=manifest.enemies[typeOf(e)];return m?m.headHeight:null}
function ownsCast(e){return supports(e)&&ready(e)}
const enemyBefore=updateEnemy;
updateEnemy=function(e,dt,isBoss=false,...args){
 if(isBoss||!supports(e))return enemyBefore.call(this,e,dt,isBoss,...args);
 sync();const r=record(e),beforeWind=Math.max(e.wind||0,e.f2canto||0,e.f2chamar||0),beforeCd=e.cd||0,bossHold=!!(bossActor&&battle?.boss);
 const result=enemyBefore.call(this,e,dt,isBoss,...args);
 const afterWind=Math.max(e.wind||0,e.f2canto||0,e.f2chamar||0);
 if(beforeWind<=0&&afterWind>0)r.windMax=afterWind;
 // encontros_v1 explicitly zeroes wind and returns while its boss holds AI.
 // That cancellation is not a cast; actual danger releases are observed below.
 const resolved=beforeWind>0&&afterWind<=0&&!bossHold;
 const choirMelee=e.type==='coro_curador'&&beforeWind<=0&&afterWind<=0&&beforeCd<=0&&e.cd>0;
 if((resolved||choirMelee)&&e.hp>0&&!(e.stun>0)&&!(e.flash>0)&&mode==='action'){
  r.attackAt=clock;r.attackUntil=clock+.3;
 }
 return result;
};
const beforeUpdate=update;
update=function(dt,...args){
 sync();const oldArea=G?.area,beforeHazards=[...(window.ToriiDificuldade?.perigos||[])];if(G&&['walk','action'].includes(mode))clock+=Math.max(0,Math.min(Number(dt)||0,.1));
 // Load before an enemy enters the camera, not at its first attack. No canvas
 // readback/whole-atlas scan is ever performed by the renderer or HUD API.
 if(G)for(const e of current?.enemies||[])if(supports(e)&&Math.hypot(e.x-G.x,e.y-G.y)<20)ready(e);
 const result=beforeUpdate.call(this,dt,...args);sync();
 const remaining=new Set(window.ToriiDificuldade?.perigos||[]);
 if(G?.area===oldArea&&mode==='action')for(const h of beforeHazards){const e=h.dono;
  if(!remaining.has(h)&&h.time<=0&&!(h.atraso>0)&&h.area===G.area&&supports(e)&&e.hp>0&&!(e.stun>0)&&!(e.flash>0)){
   const r=record(e);r.attackAt=clock;r.attackUntil=clock+.3;
  }
 }
 return result;
};
window.EnemyVariantArtV2={manifest,assets,images,supports,image,ready,draw,pose,facing,headHeight,ownsCast,reset,
 snapshot:()=>({clock,area,stats:{...stats},decoded:Object.keys(images).filter(t=>ready(t))})};
})();
