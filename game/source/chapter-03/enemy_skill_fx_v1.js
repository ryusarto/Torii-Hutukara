/* Dedicated raster motion FX for six encounter enemies. Presentation only.
 * The native danger/projectile callbacks own release, collisions and damage.
 * Ground material is drawn once; foreground keeps only the functional edge.
 */
(function(){
'use strict';
const manifest=__ENEMY_SKILL_FX_MANIFEST__,assets=__ENEMY_SKILL_FX_ASSETS__,images={};
const TYPES=new Set(['tambor_escudo','flautim_atirador','coro_curador','maestro_invocador','muralha_estatica','antena_feedback']);
const KEYS={tambor_escudo:'tambor',flautim_atirador:'flautim',coro_curador:'coro',maestro_invocador:'maestro',muralha_estatica:'muralha',antena_feedback:'antena'};
const COLORS={tambor:'#d5ac70',flautim:'#b6ca90',coro:'#8fbc9d',maestro:'#ad98bc',muralha:'#c99c75',muralha_charge:'#c99c75',antena:'#9dc8c2'};
const MAX_STAMPS=64,MAX_EFFECTS=28;
const RELEASE_HOLD=.18,RELEASE_FADE=.27,RELEASE_LIFE=.45;
const FLUTE_BODY=Object.freeze({width:72,height:56});
// Art registration measured on the frozen flight frames. The bright collision
// core, not the transparent cell centre, must stay on the simulated shot.
const FLUTE_CORE_PIVOTS={3:[98,68],4:[102,66],5:[104,66]};
// Fixed ground bases measured on the upright source sequences: Coro frames
// 0..3 end at105; emerge reaches90 at rupture (92 includes loose sparks).
// These are sequence registration anchors, never per-frame bbox centering.
const REGISTERED_PIVOTS={coro:[64,105],maestro:[64,105],maestro_emerge:[64,90]};
let game=null,area=null,clock=0,budget=MAX_STAMPS,effects=[],releaseLog=[],shotRecords=new WeakMap(),released=new WeakMap(),nativeFxBefore=null,nativeActorsBefore=null,nativeUpdateDt=0,hiddenLegacyRings=new WeakSet(),hiddenLegacySources=new WeakMap();
const stats={stamps:0,ground:0,warnings:0,projectile:0,muzzle:0,heal:0,emerge:0,melee:0,impacts:0,collisionCores:0,fallback:0,skipped:0,dropped:0,releases:0,legacyRingsTagged:0};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const active=()=>!!G&&['walk','action'].includes(mode);
const alive=e=>!e||e.hp===undefined||e.hp>0;
const reduced=()=>typeof BossChoreographyV2!=='undefined'?BossChoreographyV2.reduced():!!G?.options10?.reducedMotion;
const supports=e=>TYPES.has(typeof e==='string'?e:e?.type);
function image(key){const e=manifest.clips?.[key];if(!e)return null;const file=e.atlas||e.file||key;if(!images[file]){const im=new Image();im.src=assets[file]||assets[key]||'';images[file]=im}return images[file]}
function ready(key){const e=manifest.clips?.[key],im=e&&image(key),c=e?.cell||manifest.cell||128,cols=e?.columns||manifest.columns||4,rows=Math.ceil((e?.frames||8)/cols)+(e?.rowOffset||0);return !!(im?.complete&&im.naturalWidth>=cols*c&&im.naturalHeight>=rows*c)}
async function preload(){await Promise.all(Object.keys(manifest.clips||{}).map(async key=>{const im=image(key);if(im?.decode)try{await im.decode()}catch{}}));return readyAll()}
function readyAll(){return Object.keys(manifest.clips||{}).every(ready)}
function reset(){game=G;area=G?.area;clock=0;effects=[];releaseLog=[];shotRecords=new WeakMap();released=new WeakMap();hiddenLegacyRings=new WeakSet();hiddenLegacySources=new WeakMap();budget=MAX_STAMPS}
function sync(){if(game!==G||area!==G?.area)reset();effects=effects.filter(e=>e.area===G?.area&&clock-e.at<e.life&&alive(e.owner));releaseLog=releaseLog.filter(e=>clock-e.at<1)}
function select(h){if(!supports(h?.dono))return null;return h.dono.type==='muralha_estatica'&&h.kind==='line'?'muralha_charge':KEYS[h.dono.type]}
function stamp(key,frame,x,y,w,h=w,angle=0,alpha=1,critical=false,pivotOverride=null){
 if(budget<=0||(!critical&&budget<=16)){stats.skipped++;return false}if(!ready(key)){stats.fallback++;return false}
 if(![x,y,w,h,angle,alpha].every(Number.isFinite)||w<=0||h<=0)return false;
 if(x+w<-32||x-w>VW+32||y+h<-32||y-h>VH+32)return true;
 const e=manifest.clips[key],im=image(key),c=e.cell||manifest.cell||128,cols=e.columns||manifest.columns||4,p=pivotOverride||REGISTERED_PIVOTS[key]||e.pivot||[c/2,c/2];frame=clamp(Math.floor(frame),0,(e.frames||8)-1);
 ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.globalAlpha*=clamp(alpha,0,1);
  ctx.drawImage(im,(frame%cols)*c,((e.rowOffset||0)+Math.floor(frame/cols))*c,c,c,-p[0]*w/c,-p[1]*h/c,w,h);
 }finally{ctx.restore()}budget--;stats.stamps++;return true;
}
function releaseAlpha(age){return age<0||age>=RELEASE_LIFE?0:age<=RELEASE_HOLD?1:1-(age-RELEASE_HOLD)/RELEASE_FADE}
function frame(age,preparation=false,progress=0){
 if(reduced())return preparation?1:4;
 if(preparation)return clamp(Math.floor(progress*3),0,2);
 return age<RELEASE_HOLD?3+Math.min(1,Math.floor(Math.max(0,age)/.09)):5+clamp(Math.floor((age-RELEASE_HOLD)/.09),0,2);
}
function warning(h,progress){
 const path=window.CombatReadabilityV1?.geometry(h);if(!path)return;
 const key=select(h),ink=(h.damage||0)>0&&window.ToriiInterface6?.A11y.colorblind?'#e0b46b':COLORS[key]||COLORS.muralha;
 ctx.save();try{ctx.translate(h.x*T-cam.x,h.y*T-cam.y);if(h.kind==='line'||h.kind==='cone')ctx.rotate(h.angle||0);
  // No flood fill, repeated rune or full-area texture during preparation.
  ctx.globalAlpha=h.damage>0?.70:.38;ctx.lineWidth=h.damage>0?1.8:1.2;ctx.strokeStyle=ink;
  if(!(h.damage>0))ctx.setLineDash([4,6]);ctx.stroke(path);ctx.setLineDash([]);
  // A short bright edge follows the native wind progress, not a second timer.
  if(h.damage>0&&progress>.65){ctx.globalAlpha=.24;ctx.lineWidth=3;ctx.stroke(path)}
 }finally{ctx.restore()}stats.warnings++;
}
function ground(h,isRelease=false,age=0,foreground=false){
 const key=select(h);if(!key)return false;sync();
 if(!active()||h.atraso>0||h.area!==undefined&&h.area!==G.area||!alive(h.dono))return true;
 const k=isRelease?1:clamp(1-h.time/Math.max(.001,h.max||h.time||1),0,1);
 if(foreground){if(!isRelease)warning(h,k);return true}
 // The body owns wind-up. Material only bursts at actual resolution.
 if(!isRelease)return true;
 // A flute aim line is harmless; only the actual moving shot gets its FX.
 if(key==='flautim')return true;
 const path=window.CombatReadabilityV1?.geometry(h);if(!path)return true;
 const envelope=releaseAlpha(age),alpha=envelope<=0?0:reduced()?.72:envelope,f=frame(age),x=h.x*T-cam.x,y=h.y*T-cam.y;
 if(alpha<=0)return true;
 ctx.save();try{ctx.translate(x,y);if(h.kind==='line'||h.kind==='cone')ctx.rotate(h.angle||0);ctx.clip(path,h.kind==='donut'?'evenodd':'nonzero');
  if(h.kind==='cone'){
   const r=h.r*T,entry=manifest.clips[key],cell=entry?.cell||manifest.cell||128,b=entry?.contentBounds||[0,0,cell,cell],pivot=entry?.pivot||[cell/2,cell/2];
   const spanX=Math.max(1,b[2]-b[0]),spanY=Math.max(1,b[3]-b[1]),halfY=r*Math.sin(Math.min(Math.PI/2,Math.abs(h.arc||.8)));
   // The exported transparent cell is not the attack footprint. Fit the fixed
   // union content bounds to the native sector once for the whole sequence;
   // do not resize/recenter each phase. Native geometry still clips every pixel.
   const w=r*cell/spanX,height=2*halfY*cell/spanY,cx=r*(pivot[0]-b[0])/spanX,cy=-halfY+2*halfY*(pivot[1]-b[1])/spanY;
   stamp(key,f,cx,cy,w,height,0,alpha*.98);
  }else if(key==='antena'){
   const clip=manifest.clips[key],cell=clip?.cell||manifest.cell||128,b=clip?.contentBounds||[0,0,cell,cell],span=Math.max(1,b[2]-b[0]);
   // Normalize the sequence's fixed transparent X gutters, not individual
   // frames. Internal gaps and frame motion remain intact; native path clips
   // the material to the real beam from muzzle to terminal.
   const w=h.len*T*cell/span,pivotX=clip?.pivot?.[0]??cell/2,cx=h.len*T*(pivotX-b[0])/span;
   const spanY=Math.max(1,b[3]-b[1]),height=T*cell/spanY;
   // A tile-high useful filament, rather than a tile-high transparent cell.
   // Keep the authored beam axis on y=0; only its fixed outer gutters scale.
   stamp(key,f,cx,0,w,height,0,alpha*.98);
  }else if(key==='muralha_charge'){
   const terminal=released.get(h),distance=terminal?Math.min(h.len,Math.hypot(terminal.x-h.x,terminal.y-h.y)):0;
   // The dust trail stops at the actor's actual post-collision endpoint.
   if(distance>.08){const entry=manifest.clips[key],cell=entry?.cell||manifest.cell||128,b=entry?.contentBounds||[0,0,cell,cell],height=T*1.1*cell/Math.max(1,b[3]-b[1]);stamp(key,f,distance*T*.5,0,distance*T,height,0,alpha*.96);}
  }else if(key==='coro'){
   // Healing recipients get their own short upward burst from the real event.
   stamp(key,f,0,-8,58,76,0,alpha*.82);
  }else if(key==='maestro')stamp(key,f,0,-4,72,76,0,alpha*.96);
 }finally{ctx.restore()}stats.ground++;return true;
}
function tagFreshDecoration(kind,x,y,r,source,agedBy=0){
 if(!nativeFxBefore)return;
 const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8;
 for(let i=combatFX.length-1;i>=0;i--){const f=combatFX[i];
  if(!f||nativeFxBefore.has(f)||hiddenLegacyRings.has(f)||f.kind!==kind||!near(f.x,x)||!near(f.y,y)||!near(f.r,r)||!near(f.max,.36)||!(near(f.time,.36)||(agedBy>0&&near(f.time,.36-agedBy))))continue;
  hiddenLegacyRings.add(f);hiddenLegacySources.set(f,{...source,observedNativeAge:.36-f.time,area:G?.area});stats.legacyRingsTagged++;return;
 }
}
function tagNativeReleaseRing(h,key){
 // resolverPerigo adds exactly this generic decoration after native damage.
 // Identity/freshness + all emitted parameters distinguish it from other hits.
 tagFreshDecoration(h.kind==='ring'||h.kind==='donut'?'strike':'hit',h.x,h.y,Math.min(3,h.r||1.4),{key,ownerId:h.dono?.id||null,source:'native-danger-release-decoration'});
}
function tagNativeSecondaryDecorations(h,key){
 const e=h.dono;if(!nativeActorsBefore)return;
 if(key==='maestro'&&e.id)for(const minion of current?.enemies||[]){
  // A pre-existing called node, or any unrelated new actor, cannot qualify.
  if(nativeActorsBefore.objects.has(minion)||nativeActorsBefore.ids.has(minion.id)||minion.f2chamado!==e.id||!(minion.f2surge>0)||!(minion.hp>0))continue;
  // Native AI creates this before the frame's combatFX tick; the danger
  // release callback runs afterwards. Accept only its exact one-step age.
  tagFreshDecoration('spawn',minion.x,minion.y,1.4,{key:'maestro_emerge',ownerId:e.id||null,recipientId:minion.id||null,source:'native-maestro-minion-spawn-decoration',nativeFrameDt:nativeUpdateDt},nativeUpdateDt);
 }
 if(key==='muralha_charge'&&(e.f2tonto||0)>(nativeActorsBefore.tonto.get(e)||0)){
  // The terminal callback has actually applied its native recovery window.
  tagFreshDecoration('strike',e.x,e.y,1.6,{key,ownerId:e.id||null,source:'native-charge-terminal-decoration'});
 }
}
function release(h,newShots=[]){
 const key=select(h);if(!key)return false;sync();
 if(!active()||h.atraso>0||!alive(h.dono))return true;
 const e=h.dono;tagNativeReleaseRing(h,key);tagNativeSecondaryDecorations(h,key);released.set(h,{x:e.x,y:e.y});releaseLog.push({key,source:'native-danger-release',at:clock,life:RELEASE_LIFE,area:G.area,ownerId:e.id||null,x:h.x,y:h.y,endpointX:e.x,endpointY:e.y});if(releaseLog.length>32)releaseLog.shift();stats.releases++;
 if(key==='flautim')for(const p of newShots||[])if(p?.f2&&!shotRecords.has(p)&&Math.hypot(p.x-e.x,p.y-e.y)<.8){shotRecords.set(p,{at:clock,owner:e.id});}
 if(key==='muralha_charge')burst('muralha_charge',e.x,e.y,{angle:h.angle||0,life:RELEASE_LIFE,w:74,h:56,kind:'charge-impact',source:'native-charge-endpoint',owner:e,ownerId:e.id||null});
 return true;
}
function projectile(p,legacyKey){
 const record=shotRecords.get(p);if(!record)return false;sync();if(!active())return true;
 const entry=manifest.clips.flautim,flightFrames=entry?.flightFrames||[3,4,5],pivots=entry?.flightCorePivots||FLUTE_CORE_PIVOTS;
 const angle=Math.atan2(p.vy||0,p.vx||0),f=reduced()?(flightFrames[1]??flightFrames[0]):flightFrames[Math.floor(Math.max(0,clock-record.at)/.07)%flightFrames.length];
 if(!stamp('flautim',f,p.x*T-cam.x,p.y*T-cam.y,FLUTE_BODY.width,FLUTE_BODY.height,angle,.99,true,pivots[f]||entry?.coreAnchor)){ctx.save();try{ctx.translate(Math.round(p.x*T-cam.x),Math.round(p.y*T-cam.y));ctx.rotate(angle);ctx.fillStyle='#bfd5a0';ctx.fillRect(-3,-1,6,3);ctx.fillStyle='#eef0cc';ctx.fillRect(1,-1,2,2);}finally{ctx.restore()}stats.collisionCores++;}stats.projectile++;return true;
}
function burst(key,x,y,extra={}){
 if(!Number.isFinite(x)||!Number.isFinite(y))return;
 effects.push({key,x,y,at:clock,area:G?.area,life:RELEASE_LIFE,w:52,h:52,angle:0,kind:key,...extra});
 if(effects.length>MAX_EFFECTS){effects.shift();stats.dropped++}
}
function heal(p){if(!p||!G)return false;sync();if(!active())return true;image('coro');burst('coro',p.x,p.y,{w:62,h:82,kind:'heal',source:'real-heal-event',rise:15,layer:'overlay'});stats.heal++;return true}
function actor(x,y,e){
 if(!e||!G)return false;sync();
 const summoned=!!e.f2chamado&&e.f2surge>0,own=supports(e);if(!own&&!summoned)return false;
 if(!active()||!alive(e))return true;
 if(summoned){const k=clamp(1-e.f2surge/.9,0,1),f=reduced()?4:Math.min(7,Math.floor(k*8));stamp('maestro_emerge',f,x,y-7,64,84,0,.96);stats.emerge++}
 if(own){const wind=Math.max(e.wind||0,e.f2canto||0,e.f2chamar||0);if(wind>0){
   const hazards=window.ToriiDificuldade?.perigos||[],h=hazards.find(h=>h.dono===e&&!(h.atraso>0));
   if(h){const key=select(h),k=clamp(1-h.time/Math.max(.001,h.max||1),0,1),directional=['tambor','flautim','muralha','muralha_charge','antena'].includes(key),a=h.angle||0;
    // Small material gathering at the weapon, never a floating role icon.
    stamp(key,frame(0,true,k),x+(directional?Math.cos(a)*12:0),y-(directional?18:6)+(directional?Math.sin(a)*7:0),directional?34:30,directional?28:38,directional?a:0,.65);stats.muzzle++;
   }
  }}
 return true;
}
function paintEffects(overlay=false){
 sync();if(!active())return;
 for(const e of effects){if((e.layer==='overlay')!==overlay)continue;const age=clock-e.at,k=clamp(age/e.life,0,1),a=reduced()?.72:releaseAlpha(age);
  ctx.save();try{
   if(e.clip){const p=window.CombatReadabilityV1?.geometry(e.clip);if(p){ctx.translate(e.clip.x*T-cam.x,e.clip.y*T-cam.y);ctx.clip(p);ctx.translate(-(e.clip.x*T-cam.x),-(e.clip.y*T-cam.y))}}
   stamp(e.key,frame(age),e.x*T-cam.x,e.y*T-cam.y-(e.rise||0)*k,e.w,e.h,e.angle,a);
  }finally{ctx.restore()}
 }
}
function contact(p){if(!shotRecords.has(p))return;burst('flautim_impact',p.x,p.y,{w:52,h:52,life:RELEASE_LIFE,layer:'overlay',kind:'projectile-contact',source:'native-projectile-contact',ownerId:shotRecords.get(p).owner||null});stats.impacts++}
// Observe native removals. No inferred distant endpoint or effect on a clear.
if(typeof tickHostileShots10==='function'){
 const beforeTick=tickHostileShots10;tickHostileShots10=function(dt,...args){
  const before=(hostileShots||[]).filter(p=>p&&shotRecords.has(p));const oldArea=G?.area;
  const result=beforeTick.call(this,dt,...args);
  if(active()&&oldArea===G.area)for(const p of before)if(!hostileShots.includes(p)&&p.time>0){
   const n=Math.max(1,Math.ceil(Math.hypot(p.vx,p.vy)*(Number(dt)||0)/.22)),nx=p.x+p.vx*(Number(dt)||0)/n,ny=p.y+p.vy*(Number(dt)||0)/n;
   const heroContact=Math.hypot(p.x-G.x,p.y-G.y)<.68,wallContact=!tileWalkable(current,nx,ny);
   if(heroContact||wallContact)contact(p);
  }
  return result;
 };
}
if(typeof C3!=='undefined'&&typeof C3.updateCoopCombat==='function'){
 const beforeCoop=C3.updateCoopCombat;C3.updateCoopCombat=function(...args){
  const c=C3.coop,before=(hostileShots||[]).filter(p=>p&&shotRecords.has(p)&&c&&Math.hypot(p.x-c.x,p.y-c.y)<.68),oldArea=G?.area;
  const result=beforeCoop.apply(this,args);if(active()&&oldArea===G.area)for(const p of before)if(!hostileShots.includes(p)&&p.time>0)contact(p);return result;
 };
}
const enemyBefore=updateEnemy;updateEnemy=function(e,dt,isBoss=false,...args){
 const melee=!isBoss&&e?.type==='coro_curador'&&!(e.f2canto>0)&&!(e.wind>0)&&(e.cd||0)<=dt&&!(e.stun>dt)&&!(bossActor&&battle?.boss);
 const result=enemyBefore.call(this,e,dt,isBoss,...args);
 if(melee&&active()&&mode==='action'&&e.hp>0&&e.cd>dt&&!(e.wind>0)&&!(e.f2canto>0)){
  const targets=window.ToriiDificuldade?.lutadores?.()||[{x:G.x,y:G.y}],t=targets.slice().sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  const a=t?Math.atan2(t.y-e.y,t.x-e.x):e.face||0;
  burst('coro_melee',e.x+Math.cos(a)*.65,e.y+Math.sin(a)*.65,{w:60,h:44,angle:a,life:RELEASE_LIFE,kind:'coro-melee',source:'native-melee-cooldown',owner:e,ownerId:e.id||null,clip:{kind:'ring',x:e.x,y:e.y,r:1.5}});stats.melee++;
 }
 return result;
};
const updateBefore=update;update=function(dt,...args){
 sync();if(active())clock+=Math.max(0,Math.min(Number(dt)||0,.1));
 if(G)for(const e of current?.enemies||[])if(supports(e)&&Math.hypot(e.x-G.x,e.y-G.y)<20){ready(KEYS[e.type]);if(e.type==='maestro_invocador')ready('maestro_emerge');}
 const previous=nativeFxBefore,previousActors=nativeActorsBefore,previousDt=nativeUpdateDt;nativeUpdateDt=Math.max(0,Number(dt)||0);nativeFxBefore=new Set(combatFX||[]);
 const actors=current?.enemies||[];nativeActorsBefore={objects:new Set(actors),ids:new Set(actors.map(e=>e.id)),tonto:new WeakMap(actors.map(e=>[e,e.f2tonto||0]))};
 try{return updateBefore.call(this,dt,...args)}finally{nativeFxBefore=previous;nativeActorsBefore=previousActors;nativeUpdateDt=previousDt;sync()}

};
const groundBefore=BossChoreographyV2.drawGround;BossChoreographyV2.drawGround=function(...args){const r=groundBefore.apply(this,args);paintEffects();return r};
const combatBefore=drawCombatLayer;drawCombatLayer=function(...args){
 const original=combatFX;if(!original.some(f=>f&&hiddenLegacyRings.has(f))){const result=combatBefore.apply(this,args);paintEffects(true);return result;}
 const visible=original.filter(f=>!f||!hiddenLegacyRings.has(f));combatFX=visible;let result;
 try{result=combatBefore.apply(this,args)}finally{
  // Native drawing is normally pure. Preserve any foreign effect a delegate
  // legitimately appends during paint, while restoring the original array.
  const known=new Set(original);for(const f of combatFX||[])if(!known.has(f)){original.push(f);known.add(f)}
  combatFX=original;
 }
 paintEffects(true);return result;
};
const drawBefore=drawEnv;drawEnv=function(...args){budget=MAX_STAMPS;return drawBefore.apply(this,args)};
window.EnemySkillFXV1={manifest,assets,images,supports,select,image,ready,readyAll,preload,ground,release,projectile,actor,heal,reset,
 snapshot:()=>({clock,area,releaseStyle:{hold:RELEASE_HOLD,fade:RELEASE_FADE,total:RELEASE_LIFE},flightStyle:{...FLUTE_BODY,frames:manifest.clips.flautim?.flightFrames||[3,4,5],corePivots:manifest.clips.flautim?.flightCorePivots||FLUTE_CORE_PIVOTS},budget,maxStamps:MAX_STAMPS,maxEffects:MAX_EFFECTS,stats:{...stats},hiddenLegacyRings:(combatFX||[]).filter(f=>f&&hiddenLegacyRings.has(f)).map(f=>({...hiddenLegacySources.get(f),kind:f.kind,x:f.x,y:f.y,r:f.r,time:f.time})),effects:effects.map(e=>({key:e.key,kind:e.kind,layer:e.layer||'ground',source:e.source||e.kind,ownerId:e.ownerId||null,x:e.x,y:e.y,area:e.area,start:e.at,duration:e.life,life:e.life,age:clock-e.at,frame:frame(clock-e.at)})),recentReleases:releaseLog.map(e=>({...e,age:clock-e.at})),emergences:(current?.enemies||[]).filter(e=>e.f2chamado&&e.f2surge>0).map(e=>({key:'maestro_emerge',source:'native-minion-spawn',ownerId:e.f2chamado,id:e.id,x:e.x,y:e.y,area:G?.area,phase:clamp(1-e.f2surge/.9,0,1)})),shots:(hostileShots||[]).filter(p=>shotRecords.has(p)).map(p=>({key:'flautim',x:p.x,y:p.y,ownerId:shotRecords.get(p).owner,owner:shotRecords.get(p).owner,start:shotRecords.get(p).at,age:clock-shotRecords.get(p).at,area:G?.area})),decoded:Object.keys(manifest.clips||{}).filter(ready)})};
})();
