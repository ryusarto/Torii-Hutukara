/* Cosmetic integration contract. No browser/visual acceptance claimed. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game/source/chapter-03/boss_ground_fx_v1.js'),'utf8');
const keys=['pulse','static','scrap','void'];
const manifest={cell:256,columns:4,clips:Object.fromEntries(keys.map(k=>[k,{atlas:k+'.png'}]))};
const assets=Object.fromEntries(keys.map(k=>[k+'.png','data:image/png;base64,fixture']));
function fixture(id='c3_metronome'){
  const calls=[],stack=[];
  const ctx={globalAlpha:1,save(){stack.push(this.globalAlpha)},restore(){this.globalAlpha=stack.pop()},
    drawImage(...args){calls.push({kind:'image',args,alpha:this.globalAlpha,
      shadow:[this.shadowColor,this.shadowBlur,this.shadowOffsetX,this.shadowOffsetY]})}};
  for(const method of ['beginPath','arc','rect','moveTo','lineTo','closePath','clip'])ctx[method]=function(...args){calls.push({kind:method,args})};
  const s={console,Math,Object,Array,Number,WeakMap,Set,ctx,calls,
    G:{area:'arena'},mode:'action',bossActor:{id,hp:100,x:10,y:10},
    cam:{x:0,y:0},T:24,VW:768,VH:432,current:{w:200,h:200},rings092:[],
    paintCalls:0,paintAlphas:[],groundCalls:0,emitterCalls:0,fireCalls:0,releaseCalls:0,damage:0,baseUpdates:0,
    Image:class{constructor(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=512;}}
  };
  s.window=s;s.update=()=>{s.baseUpdates++};
  const a={records:new WeakMap(),reduced:()=>false,
    cancelled:e=>!s.G||e!==s.bossActor||!(e?.hp>0)||(e.id==='c3_silence'&&s.C3.finalPending),
    geometry:h=>h.kind==='ring'||h.kind==='rain'?{kind:'disk',x:h.x,y:h.y,r:h.r}:
      h.kind==='pulse'?{kind:'annulus',x:h.x,y:h.y,r:h.r,inner:h.inner}:
      h.kind==='fan'?{kind:'sector',x:h.x,y:h.y,r:h.r,angle:h.angle,arc:h.arc}:{...h},
    begin(e){const before=this.records.get(e);this.records.set(e,{serial:(before?.serial||0)+1,released:false})},
    release(e,spec){s.releaseCalls++;let r=this.records.get(e);if(!r){this.begin(e);r=this.records.get(e)}if(r.released)return;r.released=true;r.execution=spec;return 'release-original';},
    paint(){s.paintCalls++;s.paintAlphas.push(ctx.globalAlpha);return 'paint-original'},
    drawEmitter(){s.emitterCalls++;return 'emitter-original'},
    drawHazard(h){if(h.kind==='chase'||h.kind==='orbit')return this.drawEmitter(h);return this.paint(this.geometry(h),.6,!!h.fired)},
    shapes:[],drawGround(){s.groundCalls++;for(const h of s.C3.hazards)this.drawHazard(h);for(const shape of this.shapes)this.paint(shape.g,shape.progress,shape.released);return 'ground-original'}
  };
  s.BossChoreographyV2=a;s.C3={hazards:[],finalPending:false,
    fireHazard(h,e){s.fireCalls++;if(h.fired)return;h.fired=true;s.damage+=h.damage||10;a.release(e,{kind:h.kind,x:h.x,y:h.y});return 'fire-original'}};
  vm.createContext(s);
  vm.runInContext(source.replace('__BOSS_GROUND_FX_ASSETS__',JSON.stringify(assets)).replace('__BOSS_GROUND_FX_MANIFEST__',JSON.stringify(manifest)),s);
  s.fx=s.BossGroundFXV1;s.fx.sync();return s;
}
let checks=0;
function test(name,fn){fn();checks++;console.log('ok - '+name)}
const hazard=(kind='ring')=>({kind,x:10,y:11,r:3.7,width:.8,angle:.4,arc:.72,inner:2.45,max:1.18,time:.17,trigger:.17,damage:12,fired:false});
function images(s){return s.calls.filter(c=>c.kind==='image')}

test('original contour and ground callbacks run once; active event is not redrawn as residue',()=>{
  const s=fixture(),h=hazard();s.C3.hazards.push(h);s.C3.fireHazard(h,s.bossActor);
  assert.equal(s.damage,12);assert.equal(s.fx.effects.length,1);
  const before=JSON.stringify(h);assert.equal(s.BossChoreographyV2.drawGround(),'ground-original');
  assert.equal(s.paintCalls,1);assert.equal(s.groundCalls,1);assert.equal(images(s).length,1);
  assert.equal(JSON.stringify(h),before);assert.equal(s.damage,12);
  assert.equal(s.BossChoreographyV2.paint({kind:'disk',x:1,y:2,r:2},.3,false),'paint-original');
  assert.equal(s.paintCalls,2);
});

test('all four clips resolve and eight frames use a 4x2 atlas',()=>{
  for(const [id,key] of [['boss','pulse'],['voice_boss','static'],['c3_metronome','scrap'],['c3_silence','void']]){
    const s=fixture(id),fx=s.fx;assert(fx.image(key));
    assert.deepEqual([0,.4,.8].map(p=>fx.frame(p,null)),[0,1,2]);
    const f=fx.event(s.bossActor,{kind:'disk',x:1,y:2,r:1});
    assert.deepEqual([0,.091,.181,.271,.361].map(t=>{fx.clock=t;return fx.frame(0,f)}),[3,4,5,6,7]);
    fx.drawClipped(f.geometry,key,7,.3);
    const d=images(s).at(-1).args;assert.deepEqual(d.slice(1,5),[768,256,256,256]);
  }
});

test('clip paths preserve ground coordinates, sector and annulus/wave holes',()=>{
  const s=fixture(),fx=s.fx;
  for(const g of [{kind:'disk',x:2,y:3,r:2},{kind:'sector',x:2,y:3,r:3,angle:.4,arc:.72},
    {kind:'annulus',x:2,y:3,r:6.2,inner:2.45},{kind:'wave',x:2,y:3,r:5},
    {kind:'cross',x:2,y:3,width:.8},{kind:'lanes',x:2,y:3},
    {kind:'charge',x:2,y:3,points:[{x:2.38,y:3},{x:2.76,y:3}]}]){
    const before=JSON.stringify(g);s.calls.length=0;assert.equal(fx.drawClipped(g,'scrap',3,.3),true);
    assert.equal(s.calls.filter(c=>c.kind==='clip').length,1);assert.equal(JSON.stringify(g),before);
    assert(s.calls.find(c=>c.kind==='clip').args[0]==='nonzero');
    const arcs=s.calls.filter(c=>c.kind==='arc');
    if(g.kind==='disk')assert.deepEqual(arcs[0].args.slice(0,3),[48,72,48]);
    if(g.kind==='annulus'||g.kind==='wave'){
      assert.equal(arcs[1].args[5],true);
      assert.equal(arcs[1].args[2],(g.kind==='wave'?4.45:2.45)*24);
    }
    if(g.kind==='sector')assert.equal(arcs[0].args[3],g.angle-g.arc);
    if(g.kind==='charge')assert.equal(arcs.length,2);
  }
});

test('cross and lane stamping is visible-viewport bounded and never exceeds 128 per ground pass',()=>{
  const s=fixture('voice_boss');s.current.w=s.current.h=10000;
  s.BossChoreographyV2.shapes=Array.from({length:6},()=>({g:{kind:'lanes',x:10,y:10},progress:.4,released:false}));
  const before=JSON.stringify(s.current);s.BossChoreographyV2.drawGround();
  assert(images(s).length>0&&images(s).length<=128);assert.equal(JSON.stringify(s.current),before);
  assert(images(s).every(c=>c.args[7]===3.2*24&&c.args[8]===3.2*24));
});

test('each rain hazard creates one effect, duplicate fire and C3 release do not create another',()=>{
  const s=fixture('c3_silence');const list=Array.from({length:7},(_,i)=>({...hazard('rain'),x:10+i*.2,r:1.02}));
  s.C3.hazards=list;
  for(const h of list){s.C3.fireHazard(h,s.bossActor);s.C3.fireHazard(h,s.bossActor)}
  assert.equal(s.fx.effects.length,7);assert.equal(s.damage,84);
  assert(list.every(h=>s.fx.hazardEvents.get(h)));
});

test('legacy releases are observed once per serial and their paint is not duplicated',()=>{
  const s=fixture('boss'),a=s.BossChoreographyV2,e=s.bossActor,spec={kind:'ring',x:10,y:10};
  a.begin(e);a.release(e,spec);a.release(e,spec);assert.equal(s.fx.effects.length,1);
  a.shapes=[{g:{kind:'disk',x:10,y:10,r:3.5},progress:1,released:true}];a.drawGround();
  assert.equal(images(s).length,1);assert.equal(s.paintCalls,1);
  a.begin(e);a.release(e,spec);assert.equal(s.fx.effects.length,2);
});

test('chase/orbit add only a small clipped muzzle and preserve original emitter guides',()=>{
  for(const kind of ['chase','orbit']){
    const s=fixture('c3_silence'),h=hazard(kind);s.C3.hazards=[h];
    s.BossChoreographyV2.drawGround();assert.equal(s.emitterCalls,1);
    assert.equal(s.paintCalls,0);assert.equal(images(s).length,1);
    assert.equal(s.calls.find(c=>c.kind==='arc').args[2],.65*24);
    s.C3.fireHazard(h,s.bossActor);s.calls.length=0;s.BossChoreographyV2.drawGround();
    assert.equal(images(s).length,1);assert.equal(s.fx.effects[0].geometry.r,.65);
  }
});

test('residue lasts .45 after hazard removal, has no new danger fill/contour and pause freezes it',()=>{
  const s=fixture(),h=hazard();s.C3.hazards=[h];s.C3.fireHazard(h,s.bossActor);
  s.C3.hazards=[];s.fx.sync();s.fx.step(.20);s.calls.length=0;s.BossChoreographyV2.drawGround();
  assert.equal(s.paintCalls,0);assert.equal(images(s).length,1);assert(images(s)[0].alpha<.20);
  const clock=s.fx.clock;s.mode='overlay';s.update(10);assert.equal(s.fx.clock,clock);assert.equal(s.fx.effects.length,1);
  s.mode='action';s.fx.step(.26);assert.equal(s.fx.effects.length,0);
});

test('wave texture clips the actual moving band, freezes last geometry only after ring removal',()=>{
  const s=fixture('voice_boss'),wave={x:10,y:10,r:3,delay:0};s.rings092=[wave];
  const a=s.BossChoreographyV2;a.shapes=[{g:{kind:'wave',x:10,y:10,r:3},progress:1,released:true}];a.drawGround();
  assert.equal(s.fx.effects.length,1);assert.equal(s.fx.effects[0].wave,wave);
  wave.r=4;a.shapes[0].g.r=4;s.calls.length=0;a.drawGround();assert.equal(s.fx.effects.length,1);
  assert.equal(s.fx.effects[0].geometry.r,4);assert.equal(images(s).length,1);
  s.rings092=[];a.shapes=[];s.fx.sync();s.fx.step(.1);s.calls.length=0;a.drawGround();
  assert.equal(images(s).length,1);assert.equal(s.fx.effects[0].geometry.r,4);
});

test('actor/game/area/reset/death/final cancellation clears only cosmetic state',()=>{
  for(const transition of ['game','area','retry','death','final']){
    const s=fixture('c3_silence'),h=hazard();s.C3.hazards=[h];s.C3.fireHazard(h,s.bossActor);
    const before=JSON.stringify(h),damage=s.damage;
    if(transition==='game')s.G={...s.G};if(transition==='area')s.G.area='other';
    if(transition==='retry')s.bossActor={...s.bossActor};if(transition==='death')s.bossActor.hp=0;
    if(transition==='final')s.C3.finalPending=true;s.fx.sync();
    assert.equal(s.fx.effects.length,0,transition);assert.equal(JSON.stringify(h),before);assert.equal(s.damage,damage);
  }
});

test('reduced motion uses stable frames/lower opacity; missing art retains original contour',()=>{
  const s=fixture(),a=s.BossChoreographyV2;a.reduced=()=>true;
  assert.equal(s.fx.frame(.1,null),1);assert.equal(s.fx.frame(.9,null),1);
  const f=s.fx.event(s.bossActor,{kind:'disk',x:1,y:1,r:1});assert.equal(s.fx.frame(0,f),5);
  a.paint({kind:'disk',x:1,y:1,r:1},.8,false);assert.equal(images(s).at(-1).alpha,.10);
  s.fx.images.scrap.complete=false;s.calls.length=0;
  assert.equal(a.paint({kind:'disk',x:1,y:1,r:1},.8,false),'paint-original');assert.equal(images(s).length,0);
  assert.equal(s.paintCalls,2);
});

test('impact visibility and residue fade use exact opacity, then stop after .45 without a danger redraw',()=>{
  for(const [id,impact] of [['c3_metronome',.75],['c3_silence',.85]]){
    const s=fixture(id),h=hazard();s.C3.hazards=[h];s.C3.fireHazard(h,s.bossActor);
    s.BossChoreographyV2.drawGround();assert.equal(images(s).at(-1).alpha,impact);
    s.C3.hazards=[];s.fx.sync();s.calls.length=0;s.BossChoreographyV2.drawGround();
    assert.equal(images(s).at(-1).alpha,.30);
    const count=s.paintCalls;s.fx.step(.225);s.calls.length=0;s.BossChoreographyV2.drawGround();
    assert.equal(images(s).at(-1).alpha,.15);assert.equal(s.paintCalls,count);
    s.fx.step(.226);s.calls.length=0;s.BossChoreographyV2.drawGround();
    assert.equal(s.fx.effects.length,0);assert.equal(images(s).length,0);assert.equal(s.paintCalls,count);
  }
});

test('only loaded released sprites dim the original paint; prep and missing-art fallback remain full opacity',()=>{
  const s=fixture(),a=s.BossChoreographyV2,g={kind:'disk',x:1,y:2,r:3};
  a.paint(g,.8,false);a.paint(g,1,true);
  assert.deepEqual(s.paintAlphas,[1,.5]);assert.equal(s.ctx.globalAlpha,1);
  s.fx.images.scrap.complete=false;a.paint(g,1,true);assert.equal(s.paintAlphas.at(-1),1);
  assert.equal(s.paintCalls,3);
  s.fx.images.scrap.complete=true;s.calls.length=0;s.fx.drawClipped(g,'scrap',4,.75);
  assert.deepEqual(images(s)[0].shadow,['#20171dcc',0,1,1]);
});

test('cross and lane stamps are centered on their real axes with one deduplicated crossing',()=>{
  const s=fixture(),fx=s.fx,g={kind:'cross',x:10.25,y:9.5,width:.8};
  const centers=()=>images(s).map(c=>({x:(c.args[5]+s.cam.x+c.args[7]/2)/24,y:(c.args[6]+s.cam.y+c.args[8]/2)/24}));
  fx.drawClipped(g,'scrap',4,.75);
  const cross=centers();assert(cross.length>0&&cross.length<=128);
  assert(cross.every(p=>Math.abs(p.x-g.x)<1e-10||Math.abs(p.y-g.y)<1e-10));
  assert.equal(cross.filter(p=>Math.abs(p.x-g.x)<1e-10&&Math.abs(p.y-g.y)<1e-10).length,1);
  s.calls.length=0;fx.drawClipped({kind:'lanes',x:g.x,y:g.y},'static',4,.75);
  const lanes=centers();assert(lanes.length>0&&lanes.length<=128);
  assert(lanes.every(p=>[-4,0,4].some(dx=>Math.abs(p.x-g.x-dx)<1e-10)));
});
console.log(`${checks} ground FX unit checks passed; no gameplay/visual acceptance claimed.`);
