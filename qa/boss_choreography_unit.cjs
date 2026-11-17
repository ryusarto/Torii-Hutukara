/* Unit checks against real damage predicates, plus presentation state/delegation.
 * Does not constitute browser/gameplay or visual acceptance.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const runtime=fs.readFileSync(path.join(root,'game/source/chapter-03/chapter3_runtime.js'),'utf8');
const base=fs.readFileSync(path.join(root,'game/source/base/TORII_HUTUKARA_1_1_2_TRILHAS.html'),'utf8');
const choreography=fs.readFileSync(path.join(root,'game/source/chapter-03/boss_choreography_v2.js'),'utf8');
const fireLine=runtime.split('\n').findIndex(line=>line.startsWith('C3.fireHazard=function(h,e)'));
assert(fireLine>=0,'production damage function found');
const fire=runtime.split('\n').slice(fireLine).join('\n').split('\nC3.updateHazards=')[0];
const cast=runtime.split('\n').find(line=>line.startsWith('C3.castPattern=function(e,kind)'));
assert(cast,'production cast function found');
const enemyStart=base.indexOf('function updateEnemy(e,dt,isBoss=false){');
const enemyEnd=base.indexOf('\nfunction updateAction(',enemyStart);
assert(enemyStart>=0&&enemyEnd>enemyStart,'production traveler function found');
const legacy=base.slice(enemyStart,enemyEnd);
const arauto=base.split('\n').find(line=>line.startsWith('const enemy08=updateEnemy;updateEnemy='));
const echoStart=base.indexOf('const enemyPrev092=updateEnemy;updateEnemy=');
const echoEnd=base.indexOf('\nconst updatePrev092=',echoStart);
assert(arauto&&echoStart>=0&&echoEnd>echoStart,'production Arauto functions found');
const echo=base.slice(echoStart,echoEnd);
const waveUpdate=base.split('\n').find(line=>line.startsWith('const updatePrev092=update;update=function(dt)'));
assert(waveUpdate,'production double-wave update found');
const keys=['boss_cast','boss_charge','voice_boss_cast','c3_metronome_cast','c3_silence_cast'];
const manifest={cell:256,columns:4,pivot:[128,224],clips:Object.fromEntries(keys.map(key=>[key,{atlas:key+'.png',height:256}]))};
const assets=Object.fromEntries(keys.map(key=>[key+'.png','data:image/png;base64,fixture']));

function setup(withArt=true){
  const draws=[],arcs=[],rects=[];
  const ctx=new Proxy({drawImage(...args){draws.push(args)},arc(...args){arcs.push(args)},
    fillRect(...args){rects.push({args,color:this.fillStyle})}},
    {get(o,key){return key in o?o[key]:()=>{};},set(o,key,value){o[key]=value;return true;}});
  const s={console,Math,Set,WeakMap,Number,Object,Array,Infinity,
    G:{area:'ruins',x:0,y:0,options10:{},active:'franco',hp:{franco:100}},mode:'action',bossActor:null,
    current:{w:50,h:40},cam:{x:0,y:0},T:24,ctx,draws,arcs,rects,hostileShots:[],
    rings092:[],hits:[],effects:[],tileWalkable:()=>true,
    damageHero(d,e){s.hits.push({damage:d,source:e?.id})},
    addCombatFX(...a){s.effects.push(a)},toast(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    screenShake:0,
    C3:{hazards:[],finalPending:false,patternLabels:{}},
    Image:class{constructor(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=512;}},
    matchMedia:()=>({matches:false}),
    EnemyArtV1:{draw(){return 'static-fallback'}},
    drawCombatLayer(){return 'combat-result'}
  };
  s.window=s;
  vm.createContext(s);
  vm.runInContext(fire+'\n'+cast+'\n'+legacy+'\n'+arauto+'\n'+echo+'\nfunction update(dt){if(mode==="action"&&bossActor)updateEnemy(bossActor,dt,true);}\n'+waveUpdate,s);
  if(withArt)vm.runInContext(choreography.replace('__BOSS_ANIMATION_ASSETS__',JSON.stringify(assets)).replace('__BOSS_ANIMATION_MANIFEST__',JSON.stringify(manifest)),s);
  return s;
}
const boss=(id='boss')=>({id,x:10,y:10,hp:200,max:340,phase:1,cd:1,wind:0,stun:0,flash:0,chargeX:1,chargeY:0,facing:0});
let checks=0;
function check(name,fn){fn();checks++;console.log('ok - '+name)}

check('all five area geometries match real C3 damage predicates across boundary samples',()=>{
  const s=setup(),e=boss('c3_silence');s.bossActor=e;
  for(const kind of ['ring','cross','fan','rain','pulse']){
    const h={kind,x:10,y:10,r:kind==='rain'?1.02:5.8,inner:2.45,width:.80,angle:.36,arc:.72,damage:16,phase:2};
    const g=s.BossChoreographyV2.geometry(h);
    const points=[];
    for(let x=3;x<=17;x+=.37)for(let y=3;y<=17;y+=.43)points.push([x,y]);
    for(const r of [h.r,h.inner,h.width])for(const d of [-1e-7,0,1e-7])points.push([10+r+d,10]);
    for(const [x,y] of points){
      s.G.x=x;s.G.y=y;s.hits=[];
      s.C3.fireHazard({...h,fired:false},e);
      assert.equal(s.BossChoreographyV2.contains(g,x,y),s.hits.length>0,`${kind}: ${x},${y}`);
    }
  }
});

check('projectile emission is not circular area damage; live chase aim captured only at release',()=>{
  for(const kind of ['chase','orbit']){
    const s=setup(),e=boss('c3_silence');s.bossActor=e;
    s.G.x=12;s.G.y=10;s.C3.castPattern(e,kind);
    const h=s.C3.hazards[0];s.G.x=10;s.G.y=13;
    s.C3.fireHazard(h,e);
    assert.equal(s.hits.length,0);assert.equal(s.hostileShots.length,kind==='chase'?5:12);
    assert.equal(s.BossChoreographyV2.contains(s.BossChoreographyV2.geometry(h),10,10),false);
    assert.equal(s.BossChoreographyV2.emissions.get(h).aim,Math.PI/2);
    if(kind==='chase'){assert(Math.abs(s.hostileShots[2].vx)<1e-10);assert(s.hostileShots[2].vy>0);}
  }
});

check('fire hook releases C3 at the actual damage instant, while wind is still positive',()=>{
  const s=setup(),e=boss('c3_metronome');s.bossActor=e;s.C3.castPattern(e,'ring');
  const a=s.BossChoreographyV2,h=s.C3.hazards[0];
  assert.equal(a.pose(e).frame,0);
  h.time=h.trigger;e.wind=.17;s.C3.fireHazard(h,e);
  assert.equal(a.pose(e).frame,4);assert.equal(e.wind,.17);assert.equal(h.fired,true);
  a.clock+=.09;assert.equal(a.pose(e).frame,5);
  a.clock+=.08;assert.equal(a.pose(e).frame,6);
  a.clock+=.08;assert.equal(a.pose(e).frame,7);
  a.clock+=.08;assert.equal(a.pose(e),null);
});

check('rain cluster discharges once per cast without restarting clip for each drop',()=>{
  const s=setup(),e=boss('c3_silence');s.bossActor=e;s.C3.castPattern(e,'rain');
  const a=s.BossChoreographyV2;s.C3.fireHazard(s.C3.hazards[0],e);
  const first=a.record(e).releaseAt;a.clock+=.04;s.C3.fireHazard(s.C3.hazards[1],e);
  assert.equal(a.record(e).releaseAt,first);
});

check('traveler corridor prediction and actual instant charge agree, including blocked route',()=>{
  for(const obstacle of [false,true]){
    const s=setup();s.tileWalkable=(_a,x)=>!obstacle||x<11.3;
    const e=boss();Object.assign(e,{wind:.01,windKind:'charge',cd:0});s.bossActor=e;
    const origin={x:e.x,y:e.y},predicted=s.BossChoreographyV2.previewCharge(e);
    s.updateEnemy(e,.02,true);
    assert.equal(e.x,predicted.at(-1).x);assert.equal(e.y,predicted.at(-1).y);
    const r=s.BossChoreographyV2.record(e);
    assert.equal(r.execution.points.length,11);
    assert.equal(r.execution.x,origin.x);assert.equal(e.wind,0);
    assert(e.x-origin.x<4.19);
  }
});

check('traveler simulation/damage/state are unchanged by the presentation wrapper',()=>{
  for(const kind of ['ring','fan','charge']){
    const plain=setup(false),decorated=setup(true);
    for(const s of [plain,decorated]){
      const e=boss();Object.assign(e,{wind:.01,windKind:kind,cd:0});s.bossActor=e;
      s.G.x=11;s.G.y=10;s.updateEnemy(e,.02,true);
    }
    assert.equal(JSON.stringify(decorated.bossActor),JSON.stringify(plain.bossActor));
    assert.deepEqual(decorated.hits,plain.hits);
  }
});

check('pause freezes cosmetic clock; new game, area, retry and final phase cancel old states',()=>{
  const s=setup(),a=s.BossChoreographyV2,e=boss('c3_silence');s.bossActor=e;s.C3.castPattern(e,'ring');
  const before=a.clock;s.mode='overlay';s.update(.5);assert.equal(a.clock,before);
  s.mode='action';s.bossActor=boss('c3_silence');a.sync();assert.equal(a.records.get(e),undefined);
  s.C3.castPattern(s.bossActor,'fan');s.C3.finalPending=true;assert.equal(a.pose(s.bossActor),null);a.sync();assert.equal(a.records.get(s.bossActor),undefined);
  s.C3.finalPending=false;s.C3.castPattern(s.bossActor,'ring');s.G={...s.G};a.sync();assert.equal(a.records.get(s.bossActor),undefined);
  s.C3.castPattern(s.bossActor,'ring');s.G.area='another';a.sync();assert.equal(a.records.get(s.bossActor),undefined);
});

check('clip draws at the ground pivot; missing art and non-bosses retain static fallback',()=>{
  const s=setup(),e=boss('c3_metronome');s.bossActor=e;s.C3.castPattern(e,'ring');
  assert.equal(s.EnemyArtV1.draw(240,240,'boss',e),true);
  const d=s.draws.at(-1);assert.equal(d[6],240-224);assert.equal(d[5],240-128);
  assert.equal(s.EnemyArtV1.draw(0,0,'hush',{id:'common',hp:2}), 'static-fallback');
  s.BossChoreographyV2.images.c3_metronome_cast.complete=false;
  assert.equal(s.EnemyArtV1.draw(240,240,'boss',e),'static-fallback');
});

check('all eight clip frames are selectable and reduced motion keeps a stable preparation pose',()=>{
  const s=setup(),e=boss('c3_metronome');s.bossActor=e;s.C3.castPattern(e,'ring');
  const a=s.BossChoreographyV2,h=s.C3.hazards[0],r=a.record(e);
  const frames=[];for(const fraction of [1,.74,.49,.24]){h.time=h.trigger+r.total*fraction;frames.push(a.pose(e).frame);}
  h.time=h.trigger;s.C3.fireHazard(h,e);for(const t of [0,.09,.17,.25]){a.clock=r.releaseAt+t;frames.push(a.pose(e).frame);}
  assert.deepEqual(frames,[0,1,2,3,4,5,6,7]);
  s.C3.castPattern(e,'ring');s.G.options10.reducedMotion=true;assert.equal(a.pose(e).frame,3);
});

check('traveler stun freezes preparation via original wind; recovery is not a hurt animation',()=>{
  const s=setup(),e=boss();Object.assign(e,{wind:.86,windKind:'ring',stun:.50});s.bossActor=e;
  const a=s.BossChoreographyV2;a.begin(e,a.snapshot(e));
  const frame=a.pose(e).frame;s.update(.10);assert.equal(e.wind,.86);assert.equal(a.pose(e).frame,frame);
  e.stun=0;s.update(.50);assert.equal(a.pose(e).frame,2);
  // C3 recovery uses stun too. It must not turn frame 4 into the static hurt pose.
  s.bossActor=boss('c3_metronome');s.C3.castPattern(s.bossActor,'ring');s.C3.fireHazard(s.C3.hazards.at(-1),s.bossActor);
  s.bossActor.stun=.88;s.bossActor.recovery121=.88;assert.equal(a.pose(s.bossActor).frame,4);
  a.clock+=.4;assert.equal(a.pose(s.bossActor).frame,7);
  s.bossActor.recovery121=0;assert.equal(a.pose(s.bossActor),null);
});

check('actual Arauto telegraph locks at creation and animation releases with damage, not later',()=>{
  const s=setup(),e=boss('voice_boss');s.bossActor=e;e.cd=0;
  s.G.x=12;s.G.y=10;s.updateEnemy(e,.01,true);
  const a=s.BossChoreographyV2;assert.equal(e.tele09.x,12);assert.equal(a.pose(e).frame,0);
  s.G.x=13;s.updateEnemy(e,1.2,true);assert.equal(e.tele09,null);
  assert.equal(a.pose(e).frame,4);assert.equal(a.record(e).execution.x,12);
});

check('actual Arauto double-wave release preserves two ring emissions and their delay',()=>{
  const s=setup(),e=boss('voice_boss');s.bossActor=e;e.echoWarning092=.01;
  e.hp=100;e.phase=2;e.volley091=.01;
  s.updateEnemy(e,.02,true);
  assert.equal(s.rings092.length,2);assert.equal(s.rings092[0].r,.7);
  assert.equal(s.rings092[1].delay,.72);
  assert.equal(s.BossChoreographyV2.pose(e).frame,4);
  assert.equal(s.hostileShots.length,0);
  assert.equal(s.BossChoreographyV2.record(e).execution.kind,'double_wave');
  assert.equal(s.BossChoreographyV2.record(e).serial,1);
});

check('actual phase-II Arauto volley animates at three-shot emission without adding preparation',()=>{
  const s=setup(),e=boss('voice_boss');s.bossActor=e;
  e.hp=100;e.phase=2;e.volley091=.01;e.cd=1;s.G.x=12;s.G.y=10;
  s.updateEnemy(e,.02,true);
  const a=s.BossChoreographyV2,r=a.record(e);
  assert.equal(s.hostileShots.length,3);assert.equal(e.tele09,undefined);
  assert.equal(r.execution.kind,'volley');assert.equal(a.pose(e).frame,4);
  assert.equal(s.hits.length,0);assert.equal(e.volley091,2.6);
  assert.equal(s.hostileShots[1].vx,5);assert.equal(s.hostileShots[1].vy,0);
  const serial=r.serial,releaseAt=r.releaseAt;
  s.updateEnemy(e,.02,true);assert.equal(a.record(e).serial,serial);assert.equal(a.record(e).releaseAt,releaseAt);
  a.clock+=.09;assert.equal(a.pose(e).frame,5);
});

check('ground shapes have no legacy -12 offset, annulus leaves its inner zone safe',()=>{
  const s=setup(),e=boss('c3_silence');s.bossActor=e;
  s.C3.drawHazard({kind:'pulse',x:10,y:11,r:6.2,inner:2.45,max:1.22,time:.5,trigger:.17});
  assert(s.arcs.some(a=>a[0]===240&&a[1]===264&&a[2]===6.2*24));
  assert(!s.BossChoreographyV2.contains({kind:'annulus',x:10,y:11,r:6.2,inner:2.45},10,11));
  assert(s.BossChoreographyV2.contains({kind:'wave',x:0,y:0,r:5},5.54,0));
  assert(!s.BossChoreographyV2.contains({kind:'wave',x:0,y:0,r:5},5.56,0));
});

check('old finalPending never hides other bosses, and generic 320px atlas contract draws',()=>{
  const s=setup(),e=boss('boss');s.bossActor=e;s.C3.finalPending=true;e.wind=.60;e.windKind='fan';
  const a=s.BossChoreographyV2;a.begin(e,a.snapshot(e));
  assert.equal(a.cancelled(e),false);
  a.manifest.cell=320;a.manifest.pivot=[160,280];
  a.manifest.clips.boss_cast={atlas:'boss_cast.png',scale:.5};
  a.images.boss_cast={complete:true,naturalWidth:1280,naturalHeight:640};
  assert.equal(s.EnemyArtV1.draw(240,240,'boss',e),true);
  const d=s.draws.at(-1);assert.equal(d[5],160);assert.equal(d[6],100);
  assert.equal(d[7],160);assert.equal(d[8],160);
});

check('reduced motion retains stationary countdown pips without the animated center arc',()=>{
  const s=setup(),a=s.BossChoreographyV2;s.G.options10.reducedMotion=true;
  a.paint({kind:'disk',x:3,y:4,r:3.5},.60,false);
  assert.equal(s.rects.length,5);
  assert.equal(s.rects.filter(r=>r.color==='#fff2ce').length,3);
  assert(!s.arcs.some(a=>a[2]===6));
  const before=JSON.stringify(s.rects.map(r=>r.args));s.rects.length=0;
  a.paint({kind:'disk',x:3,y:4,r:3.5},.80,false);
  assert.equal(JSON.stringify(s.rects.map(r=>r.args)),before);
  assert.equal(s.rects.filter(r=>r.color==='#fff2ce').length,4);
});

check('second real Arauto wave restarts discharge exactly once without changing delays or 14 damage',()=>{
  const decorated=setup(),plain=setup(false);
  for(const s of [decorated,plain]){
    const e=boss('voice_boss');s.bossActor=e;e.hp=100;e.phase=2;e.echoWarning092=.01;e.volley091=99;e.cd=99;
    s.G.x=e.x+1.2;s.G.y=e.y;
    s.damageHero=function(d){s.hits.push(d);s.G.hp.franco-=d;};
    s.update(.02);
  }
  const a=decorated.BossChoreographyV2,e=decorated.bossActor;
  assert.equal(a.record(e).serial,1);assert.equal(a.pose(e).frame,4);
  const delayed=decorated.rings092[1];assert.equal(delayed.delay,.72);
  decorated.mode='overlay';decorated.update(.5);assert.equal(delayed.delay,.72);assert.equal(a.record(e).serial,1);decorated.mode='action';
  let second=false;
  for(let i=0;i<50;i++){
    decorated.update(.02);plain.update(.02);
    if(!second&&delayed.delay<=0){
      second=true;assert.equal(a.record(e).serial,2);assert.equal(a.pose(e).frame,4);
      assert.equal(a.record(e).execution.kind,'double_wave');
    }
    assert.equal(a.record(e).serial,second?2:1);
    assert.equal(JSON.stringify(decorated.rings092),JSON.stringify(plain.rings092));
  }
  assert(second);assert.deepEqual(decorated.hits,[14,14]);assert.deepEqual(decorated.hits,plain.hits);
  assert.equal(decorated.G.hp.franco,plain.G.hp.franco);
});
console.log(`${checks} choreography unit checks passed; no visual/gameplay acceptance claimed.`);
