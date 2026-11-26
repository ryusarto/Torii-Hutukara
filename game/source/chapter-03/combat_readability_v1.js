/* Original pixel atlas for phase-2 attacks and the first silent rift.
 * Presentation only. The source simulation retains every clock, hitbox and save.
 * Builder routes its private marcador(h,cam) through ground(h), with legacy fallback.
 */
(function(){
'use strict';
const manifest=__COMBAT_READABILITY_MANIFEST__,source=__COMBAT_READABILITY_ASSET__;
const image=new Image();image.src=source;
const groundRift=new Image();groundRift.src=__GROUND_RIFT_ASSET__;
const riftReady=()=>groundRift.complete&&groundRift.naturalWidth>0;
const D=window.ToriiDificuldade;
const alive=e=>!e||e.hp===undefined||e.hp>0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let game=null,area=null,clock=0,records=new WeakMap(),shots=new WeakMap(),releases=[],phaseBursts=new WeakMap();
let textureBudget=96,detailBudget=160;
const counters={ground:0,release:0,projectile:0,actor:0,portal:0,portalFallback:0,texture:0};
const coverage={
 boss_echo:'pulse_mask',boss_phase3:'pulse_mask',voice_boss_echo:'ring_echo',voice_boss_phase3:'cross_static',
 c3_metronome_echo:'pulse_gear',c3_metronome_phase3:'pulse_gear',c3_silence_echo:'void_crown',c3_silence_phase3:'void_crown',
 hard_melee_advance:'line_lunge',hard_compasso_counter:'pulse_gear',hard_abafador_ring:'pulse_mute',
 hard_whisper_fan:'mirror_note',hard_espelho_notes:'mirror_note',tambor_escudo:'cone_drum',muralha_estatica:'cone_iron',
 muralha_charge:'line_lunge',flautim_aim:'flute_bolt',flautim_shot:'flute_bolt',antena_feedback:'beam_feedback',
 coro_curador:'heal_chord',maestro_invocador:'summon_knot',summoned_appearance:'summon_knot',phase_transition:'phase_shatter',
 resident_compasso:'pulse_gear',resident_espelho:'ring_echo',resident_abafador:'pulse_mute',
 silence_gate_dormant:'portal_dormant',silence_gate_ready:'portal_ready',silence_gate_spent:'portal_spent'};
const ready=()=>image.complete&&image.naturalWidth===manifest.cell*manifest.columns;
const reduced=()=>typeof BossChoreographyV2!=='undefined'?BossChoreographyV2.reduced():!!G?.options10?.reducedMotion;
function reset(){game=G;area=G?.area;clock=0;records=new WeakMap();shots=new WeakMap();releases=[];phaseBursts=new WeakMap()}
function sync(){if(game!==G||area!==G?.area)reset();releases=releases.filter(r=>r.area===G?.area&&clock-r.at<.48&&alive(r.h.dono))}
function choose(h){
 const owner=h?.dono,kind=h?.kind,type=owner?.type,id=owner?.id;
 if(type==='coro_curador')return'heal_chord';if(type==='maestro_invocador')return'summon_knot';
 if(kind==='cross')return'cross_static';if(kind==='donut')return'void_crown';
 if(kind==='line')return type==='antena_feedback'?'beam_feedback':type==='flautim_atirador'?'flute_bolt':'line_lunge';
 if(kind==='cone')return type==='muralha_estatica'?'cone_iron':'cone_drum';
 if(id==='boss')return'pulse_mask';if(id==='voice_boss')return'ring_echo';if(id==='c3_metronome'||type==='compasso')return'pulse_gear';
 if(id==='c3_silence')return'void_crown';if(type==='abafador')return'pulse_mute';return'ring_echo';
}
function stamp(key,frame,x,y,size=40,angle=0,alpha=1){
 const entry=manifest.clips[key];if(!entry||!ready())return false;
 const c=manifest.cell,pivot=entry.pivot||[c/2,c/2];frame=clamp(Math.floor(frame),0,entry.frames-1);
 ctx.save();try{ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,frame*c,entry.row*c,c,c,-pivot[0]*size/c,-pivot[1]*size/c,size,size);
 }finally{ctx.restore()}return true;
}
function geometry(h){
 const shape=h.kind,r=Math.max(.05,Number(h.r)||1),width=Number(h.width)||1,len=Number(h.len)||1;
 const p=new Path2D();
 if(shape==='ring')p.arc(0,0,r*T,0,Math.PI*2);
 else if(shape==='donut'){p.arc(0,0,r*T,0,Math.PI*2);p.closePath();p.moveTo((Number(h.inner)||0)*T,0);p.arc(0,0,(Number(h.inner)||0)*T,0,Math.PI*2,true);p.closePath()}
 else if(shape==='line')p.rect(-.3*T,-(width/2+.25)*T,(len+.3)*T,(width+.5)*T);
 else if(shape==='cross'){p.rect(-len*T,-(width/2+.25)*T,len*2*T,(width+.5)*T);p.rect(-(width/2+.25)*T,-len*T,(width+.5)*T,len*2*T)}
 else if(shape==='cone'){const arc=(Number(h.arc)||.8)+.08;p.moveTo(0,0);p.arc(0,0,r*T,-arc,arc);p.closePath()}
 else return null;
 return p;
}
function bounds(h){
 if(h.kind==='line')return{x:-.3*T,y:-(h.width/2+.25)*T,w:(h.len+.3)*T,h:(h.width+.5)*T};
 if(h.kind==='cross')return{x:-h.len*T,y:-h.len*T,w:h.len*2*T,h:h.len*2*T};
 const r=(h.r||1)*T;return{x:-r,y:-r,w:r*2,h:r*2};
}
function color(key,h){
 if((h.damage||0)>0&&window.ToriiInterface6?.A11y.colorblind)return'#e0b46b';
 return {heal_chord:'#89b99a',summon_knot:'#ad99b7',beam_feedback:'#8fbec0',flute_bolt:'#b8c88e',cross_static:'#cf8f9c',void_crown:'#ad9cbc',pulse_mute:'#a99bbb'}[key]||'#ddb47e';
}
function textureKey(key){return key==='cross_static'||key==='ring_echo'?'static':['pulse_gear','cone_iron','beam_feedback'].includes(key)?'scrap':['void_crown','pulse_mute','summon_knot'].includes(key)?'void':'pulse'}
function texture(h,key,frame,released){
 if(typeof BossGroundFXV1==='undefined')return;
 const tex=textureKey(key),entry=BossGroundFXV1.manifest.clips?.[tex],im=BossGroundFXV1.image(tex);if(!entry||!im?.complete||!im.naturalWidth)return;
 const c=entry.cell||256,cols=entry.columns||4,b=bounds(h),tile=96,rows=Math.max(1,Math.ceil(b.h/tile)),columns=Math.max(1,Math.ceil(b.w/tile));
 ctx.save();try{ctx.globalAlpha*=released?.56:.18;
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){if(j*columns+i>=36||textureBudget<=0)break;textureBudget--;ctx.drawImage(im,(frame%cols)*c,Math.floor(frame/cols)*c,c,c,b.x+i*tile,b.y+j*tile,tile,tile);counters.texture++}
 }finally{ctx.restore()}
}
function marks(h,k,ink){
 const r=h.kind==='line'?12:Math.min(74,(h.r||1)*T+8),lit=Math.min(4,Math.floor(k*4+.00001));
 ctx.save();try{for(let i=0;i<4;i++){const a=-Math.PI/2+i*Math.PI/2;ctx.fillStyle=i<lit?ink:'#28232d';ctx.globalAlpha=i<lit?.95:.5;ctx.fillRect(Math.round(Math.cos(a)*r)-2,Math.round(Math.sin(a)*r)-2,5,5)}}finally{ctx.restore()}
}
function detail(h,key,frame,released){
 const x=h.x*T-cam.x,y=h.y*T-cam.y,angle=(h.kind==='line'||h.kind==='cone')?h.angle||0:0;
 ctx.save();try{ctx.translate(x,y);ctx.rotate(angle);const path=geometry(h);if(!path)return;ctx.clip(path,h.kind==='donut'?'evenodd':'nonzero');
  texture(h,key,frame,released);
  const sprite=(xx,yy,size,a=0)=>{if(detailBudget--<=0)return;stamp(key,frame,xx,yy,size,a,released?.98:.85)};
  if(h.kind==='line'){
   const n=Math.max(1,Math.min(7,Math.ceil(h.len/1.8)));for(let i=0;i<n;i++)sprite((i+.5)*h.len*T/n,0,key==='flute_bolt'?28:46);
  }else if(h.kind==='cross'){
   for(const d of [-.75,-.4,.4,.75]){sprite(d*h.len*T,0,38);sprite(0,d*h.len*T,38,Math.PI/2)}
  }else if(h.kind==='cone'){
   sprite(Math.min(1.1,h.r*.45)*T,0,42);for(const a of [-.6,.6])sprite(Math.cos(a)*h.r*T*.7,Math.sin(a)*h.r*T*.7,32,a);
  }else if(h.kind==='donut'){
   const radius=((h.inner||0)+h.r)*.5*T;for(let i=0;i<8;i++){const a=i*Math.PI/4; sprite(Math.cos(a)*radius,Math.sin(a)*radius,34,a)}
  }else{
   const radius=(h.r||1)*T*(released?.62:.58),n=h.r>3?8:4;
   sprite(0,0,Math.min(52,(h.r||1)*T*1.2));for(let i=0;i<n;i++){const a=i*2*Math.PI/n;sprite(Math.cos(a)*radius,Math.sin(a)*radius,h.r>3?38:28,a)}
  }
 }finally{ctx.restore()}
}
function ground(h,released=false,age=0){
 if(window.EnemySkillFXV1?.ground(h,released,age,false))return true;
 if(!h||!ready()||!G||h.area!==undefined&&h.area!==G.area||h.atraso>0||!alive(h.dono)||!['walk','action'].includes(mode))return false;
 const path=geometry(h);if(!path)return false;const key=choose(h),k=released?1:clamp(1-h.time/h.max,0,1),frame=reduced()?(released?5:2):released?Math.min(7,4+Math.floor(age/.12)):Math.min(3,Math.floor(k*4));
 const x=h.x*T-cam.x,y=h.y*T-cam.y,ink=color(key,h),aim=h.kind==='line'&&!(h.damage>0);
 ctx.save();try{
  ctx.translate(x,y);if(h.kind==='line'||h.kind==='cone')ctx.rotate(h.angle||0);
  ctx.lineWidth=released?3:2;ctx.strokeStyle=ink;ctx.fillStyle=ink;
  if(aim)ctx.setLineDash([4,5]);
  ctx.globalAlpha=released?Math.max(0,.27-age*.42):aim?.025:.045+k*.075;ctx.fill(path,h.kind==='donut'?'evenodd':'nonzero');
  ctx.globalAlpha=released?Math.max(0,.95-age*1.5):.8;ctx.stroke(path);ctx.setLineDash([]);

 }finally{ctx.restore()}
 detail(h,key,frame,released);if(!released){ctx.save();try{ctx.translate(x,y);if(h.kind==='line'||h.kind==='cone')ctx.rotate(h.angle||0);marks(h,k,ink)}finally{ctx.restore()}}if(released)counters.release++;else counters.ground++;
 if(!records.has(h))records.set(h,{key,at:clock});return true;
}
function release(h,newShots=[]){const copy={...h};window.EnemySkillFXV1?.release(copy,newShots);releases.push({h:copy,at:clock,area:G.area});if(releases.length>48)releases.shift()}
function tagShots(before){
 for(const p of hostileShots){if(before.has(p)||shots.has(p)||!p.f2)continue;
  const owner=(current?.enemies||[]).filter(e=>alive(e)&&Math.hypot(e.x-p.x,e.y-p.y)<1).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  shots.set(p,owner?.type==='flautim_atirador'?'flute_bolt':'mirror_note');
 }
}
function projectile(p,base,self){
 if(window.EnemySkillFXV1?.projectile(p,shots.get(p)))return true;
 if(!p?.f2||!ready())return base.call(self,p);
 const key=shots.get(p)||'mirror_note',f=reduced()?2:Math.floor(clock/.075)%8;
 stamp(key,f,p.x*T-cam.x,p.y*T-cam.y,key==='flute_bolt'?40:34,Math.atan2(p.vy||0,p.vx||0));counters.projectile++;return true;
}
function actor(x,y,e){
 if(!e||!G||!alive(e)||!['walk','action'].includes(mode))return;
 const ownSkillFX=window.EnemySkillFXV1?.actor(x,y,e);
 if(!ready())return;
 if(e.f2surge>0&&!ownSkillFX){const k=clamp(1-e.f2surge/.9,0,1);stamp('summon_knot',reduced()?2:Math.min(7,Math.floor(k*8)),x,y,64,0,.85);counters.actor++}
 const type=e.type,cast=!ownSkillFX&&typeof ToriiEncontros!=='undefined'&&ToriiEncontros.TIPOS[type]&&!window.EnemyVariantArtV2?.ownsCast(e);
 if(cast){
  const active=D?.perigos.find(h=>h.dono===e&&!(h.atraso>0));
  const key=active?choose(active):e.f2canto>0?'heal_chord':e.f2chamar>0?'summon_knot':null;
  if(key){const k=active?clamp(1-active.time/active.max,0,1):.5;stamp(key,reduced()?2:Math.floor(k*4),x+Math.cos(e.face||0)*14,y-42,40);counters.actor++}
 }
 const at=phaseBursts.get(e);if(at!==undefined&&clock-at<.48){stamp('phase_shatter',reduced()?5:4+Math.floor((clock-at)/.12),x,y-38,104,0,1-(clock-at));counters.actor++}
}
function portal(p,cx,cy){
 if(p?.type!=='silenceGate'||!G)return false;
 const spent=!!G.flags.boss,active=!spent&&G.flags.ruinA&&G.flags.ruinB,x=(p.x+.5)*T-cx,y=(p.y+.65)*T-cy,w=2*T,h=T;
 ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.globalAlpha=spent?.7:1;
  ctx.filter=spent?'grayscale(.8) brightness(.66)':active?'none':'saturate(.5) brightness(.74)';
  if(riftReady())ctx.drawImage(groundRift,Math.round(x-w/2),Math.round(y-h/2),Math.round(w),Math.round(h));
  else{ctx.filter='none';ctx.fillStyle='#292333';ctx.strokeStyle='#8b7372';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,w*.46,h*.38,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle=active?'#82aaa2':'#62505c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-w*.29,y+h*.08);ctx.lineTo(x-w*.1,y-h*.08);ctx.lineTo(x+w*.07,y+h*.04);ctx.lineTo(x+w*.3,y-h*.07);ctx.stroke();counters.portalFallback++}
  ctx.filter='none';
  // Light stays inside the existing planar footprint. It is cosmetic only.
  if(active&&!reduced()){const a=.025+.025*Math.sin(clock*2.5);ctx.globalAlpha=a;ctx.fillStyle='#b49ac3';ctx.beginPath();ctx.ellipse(x,y,w*.28,h*.23,0,0,Math.PI*2);ctx.fill()}
  if(!spent){const f=reduced()?0:Math.floor(clock/.14)%8;ctx.translate(x,y);ctx.scale(1,.5);if(G.flags.ruinA)stamp('sigil_pulse',f,-w*.36,0,20);if(G.flags.ruinB)stamp('sigil_timbre',f,w*.36,0,20)}
 }finally{ctx.restore()}
 counters.portal++;return true;
}
const updateBefore=update;
update=function(dt,...args){
 sync();const active=G&&['walk','action'].includes(mode),before=[...(D?.perigos||[])],beforeShots=new Set(hostileShots||[]),actors=[...(current?.enemies||[]),...(bossActor?[bossActor]:[])],phase=actors.map(e=>[e,e.f2?.transicao||0]);
 const result=updateBefore.call(this,dt,...args);sync();if(active&&['walk','action'].includes(mode))clock+=Math.max(0,Math.min(Number(dt)||0,.1));
 const after=new Set(D?.perigos||[]);
 if(mode==='action')for(const h of before)if(!after.has(h)&&h.area===G.area&&h.time<=0&&!(h.atraso>0)&&alive(h.dono))release(h,(hostileShots||[]).filter(p=>!beforeShots.has(p)));
 tagShots(beforeShots);for(const[e,old]of phase)if((e.f2?.transicao||0)>old)phaseBursts.set(e,clock);
 return result;
};
// Three resident mechanics predate D.perigos. Observe their original timers;
// the decorative records never enter the danger array or deal damage.
function residentWarning(e){
 if(!e||!alive(e))return null;
 let time=0,max=0,r=0;
 if(e.type==='compasso'&&e.wind>0){time=e.wind;max=.6;r=2.6}
 else if(e.type==='espelho'&&e.retaliate>0){time=e.retaliate;max=.8;r=2}
 else if(e.type==='abafador'&&e.wind>0){time=e.wind;max=.7;r=1.9}
 return r?{kind:'ring',x:e.x,y:e.y,r,time,max,damage:1,dono:e,area:G?.area}:null;
}
const enemyBefore=updateEnemy;
updateEnemy=function(e,dt,isBoss=false,...args){
 const warning=!isBoss&&residentWarning(e),beat=e?.log?.length||0,retaliate=e?.retaliate||0;
 const result=enemyBefore.call(this,e,dt,isBoss,...args);
 if(!isBoss&&warning&&alive(e)&&mode==='action'){
  const fired=e.type==='compasso'&&(e.log?.length||0)>beat||e.type==='espelho'&&retaliate>0&&!(e.retaliate>0)||e.type==='abafador'&&!(e.wind>0);
  if(fired)release({...warning,time:0});
 }
 return result;
};
const groundBefore=BossChoreographyV2.drawGround;
BossChoreographyV2.drawGround=function(...args){textureBudget=96;detailBudget=160;const result=groundBefore.apply(this,args);sync();if(G&&['walk','action'].includes(mode)){for(const e of current?.enemies||[]){const h=residentWarning(e);if(h)ground(h)}for(const r of releases)ground(r.h,true,clock-r.at)}if(G)for(const p of current?.props||[])if(p.type==='silenceGate')portal(p,cam.x,cam.y);return result};
// Functional edge and a few identity fragments remain readable above foliage.
// Textures stay on the floor; no opaque fill is painted over actors.
function foreground(h,released=false,age=0){
 if(window.EnemySkillFXV1?.ground(h,released,age,true))return;
 if(!h||h.atraso>0||!alive(h.dono)||h.area!==undefined&&h.area!==G.area)return;
 const path=geometry(h);if(!path)return;const key=choose(h),k=released?1:clamp(1-h.time/h.max,0,1),aim=h.kind==='line'&&!(h.damage>0),ink=color(key,h);
 const frame=reduced()?(released?5:2):released?Math.min(7,4+Math.floor(age/.12)):Math.min(3,Math.floor(k*4));
 ctx.save();try{ctx.translate(h.x*T-cam.x,h.y*T-cam.y);if(h.kind==='line'||h.kind==='cone')ctx.rotate(h.angle||0);
  ctx.globalAlpha=released?Math.max(0,1-age*1.8):.96;
  if(aim)ctx.setLineDash([4,7]);ctx.strokeStyle='#211c28';ctx.lineWidth=5;ctx.stroke(path);ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke(path);ctx.setLineDash([]);
  ctx.save();try{ctx.clip(path,h.kind==='donut'?'evenodd':'nonzero');const spr=(x,y,a=0)=>stamp(key,frame,x,y,aim?32:46,a,released?.95:.9);
   if(h.kind==='line'){spr(h.len*T*.5,0);if(!aim)spr(h.len*T*.8,0)}
   else if(h.kind==='cone')spr(h.r*T*.65,0);
   else if(h.kind==='cross'){spr(h.len*T*.7,0);spr(0,-h.len*T*.7,Math.PI/2)}
   else if(h.kind==='donut'){const r=((h.inner||0)+h.r)*.5*T;spr(r,0);spr(-r,0,Math.PI)}
   else{spr(h.r*T*.65,0);spr(-h.r*T*.65,0,Math.PI)}
  }finally{ctx.restore()}
  if(!released)marks(h,k,ink);
 }finally{ctx.restore()}
}
const foregroundBefore=drawCombatLayer;drawCombatLayer=function(...args){const r=foregroundBefore.apply(this,args);if((!ready()&&!window.EnemySkillFXV1)||!G||!['walk','action'].includes(mode))return r;for(const h of D?.perigos||[])foreground(h);for(const e of current?.enemies||[]){const h=residentWarning(e);if(h)foreground(h)}for(const x of releases)foreground(x.h,true,clock-x.at);return r};
const creatureBefore=drawCreature;drawCreature=function(x,y,kind,e,...args){const result=creatureBefore.call(this,x,y,kind,e,...args);actor(x,y,e);return result};
const shotBefore=BossGroundFXV1.drawProjectile;BossGroundFXV1.drawProjectile=function(p){return projectile(p,shotBefore,this)};
const propBefore=drawProp;drawProp=function(p,cx,cy,...args){if(p?.type==='silenceGate')return;return propBefore.call(this,p,cx,cy,...args)};
window.addEventListener('torii:cura-inimigo',e=>{const p=e.detail;if(p&&G&&!window.EnemySkillFXV1?.heal(p))release({kind:'ring',x:p.x,y:p.y,r:.8,time:0,max:.2,damage:0,area:G.area,dono:{type:'coro_curador'}})});
window.CombatReadabilityV1={manifest,image,groundRift,riftReady,coverage,ready,ground,portal,choose,geometry,stamp,reset,
 snapshot:()=>({ready:ready(),riftReady:riftReady(),riftState:G?.flags.boss?'spent':G?.flags.ruinA&&G?.flags.ruinB?'ready':'dormant',clock,area,counters:{...counters},releases:releases.map(r=>({key:choose(r.h),kind:r.h.kind,age:clock-r.at})),coverage:{...coverage}})};
})();
