/* Real production animation hooks, fixture simulation reused from existing QA.
 * Rule/render-call checks only: no browser, physical hardware or perceived-fluency claim. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let count=0;
function check(name,fn){fn();count++;console.log('OK · '+name)}
function harness(file,kind){
 let code=fs.readFileSync(path.join(__dirname,file),'utf8').split('let checks=0;')[0];
 if(kind==='boss'){
  const v2=JSON.parse(fs.readFileSync(path.join(root,'assets/boss-animations/v2/manifest.json'))),v3=JSON.parse(fs.readFileSync(path.join(root,'assets/boss-animations/v3/manifest.json'))),manifest={...v2,clips:{...v2.clips,...v3.clips}};
  code=code.replace(/^const manifest=.*;$/m,'const manifest='+JSON.stringify(manifest)+';').replace(/^const assets=.*;$/m,'const assets='+JSON.stringify(Object.fromEntries(Object.values(manifest.clips).map(e=>[e.atlas,'data:fixture'])))+';').replace('this.naturalWidth=1024;this.naturalHeight=512','this.naturalWidth=2560;this.naturalHeight=1280');
  code+=';globalThis.factory=setup;globalThis.makeBoss=boss;';
 }else{
  code=code.replace("const keys=['pulse','static','scrap','void'];","const keys=['pulse','static','scrap','void','aim','projectile'];");code+=';globalThis.factory=fixture;';
 }
 const scope={require,__dirname,console};vm.runInNewContext(code,scope,{filename:file});return scope;
}
const bossHarness=harness('boss_choreography_unit.cjs','boss'),fxHarness=harness('boss_ground_fx_unit.cjs','fx');
check('V7 contains32 sequences,16 real drawings each, stable spatial cycles and4k atlases',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,'assets/protagonistas/v7-locomocao/manifest.json'))),proof=JSON.parse(fs.readFileSync(path.join(root,'assets/protagonistas/v7-locomocao/VALIDACAO.json')));assert.equal(m.animations.length,32);assert.equal(proof.newDrawings,256);assert(proof.checks.every(c=>c.uniqueFrames===16&&c.newFootRange[0]>=c.referenceFootRange[0]-1&&c.newFootRange[1]<=c.referenceFootRange[1]+1));
 for(const a of m.animations){assert.equal(a.frames,16);assert.equal(a.playFrames,16);assert.equal(a.closureFrame,0);assert.equal(a.frameSources.filter(f=>f.kind==='authored-v7').length,8);assert.equal(new Set(a.frameDurationsMs).size,1);assert.equal(a.strideDistance,a.state==='run'?3.172:8/3.6);const png=fs.readFileSync(path.join(root,'assets/protagonistas/v7-locomocao',a.atlas));assert.equal(png.readUInt32BE(16),4096);assert.equal(png.readUInt32BE(20),2048);assert.equal(png[25],6)}
});
check('First boss real movement selects directional walk cells without modifying movement or damage',()=>{
 const s=bossHarness.factory(),e=bossHarness.makeBoss();s.bossActor=e;s.G.x=19;s.G.y=10;const before=e.x;s.updateEnemy(e,.06,true);assert(e.x>before);const body=JSON.stringify(e),hits=s.hits.length;const art=s.BossChoreographyV2,r=art.walks.get(e);assert(r.moving);assert.equal(r.row,3);assert(art.drawActor(e.x*24,e.y*24,'boss',e),JSON.stringify({pose:art.walkPose(e),entry:art.manifest.clips.boss_walk,im:art.images.boss_walk,keys:Object.keys(art.assets)}));assert.equal(s.draws.at(-1)[2],3*320);assert.equal(JSON.stringify(e),body);assert.equal(s.hits.length,hits);
});
check('Walk does not animate a stationary body, teleport charge or stun; real casting retains priority',()=>{
 const s=bossHarness.factory(),e=bossHarness.makeBoss();s.bossActor=e;const a=s.BossChoreographyV2;a.sync();a.observeTravel(e,{x:e.x,y:e.y});assert.equal(a.walkPose(e),null);e.x+=4;a.observeTravel(e,{x:e.x-4,y:e.y});assert.equal(a.walkPose(e),null);e.stun=1;e.x+=.02;a.observeTravel(e,{x:e.x-.02,y:e.y});assert.equal(a.walkPose(e),null);e.stun=0;e.wind=.5;e.windKind='ring';a.begin(e,{kind:'ring',remaining:.5});assert(a.drawActor(10,20,'boss',e));assert.equal(s.draws.at(-1)[2],0);
});
check('Walk records reset with area/reload and pause cannot progress the cosmetic clock',()=>{
 const s=bossHarness.factory(),e=bossHarness.makeBoss();s.bossActor=e;const a=s.BossChoreographyV2;a.sync();e.x+=.05;a.observeTravel(e,{x:e.x-.05,y:e.y});const phase=a.walks.get(e).phase,pose=JSON.stringify(a.walkPose(e));s.mode='overlay';s.update(.2);assert.equal(a.walks.get(e).phase,phase);assert.equal(JSON.stringify(a.walkPose(e)),pose);assert(a.drawActor(e.x*24,e.y*24,'boss',e));s.G={...s.G,area:'other'};a.sync();assert.equal(a.walks.get(e),undefined);
});
check('All eight projectile cells draw and orientation follows real velocity; draw never mutates shots',()=>{
 const s=fxHarness.factory('c3_silence');s.ctx.translate=(...args)=>s.calls.push({kind:'translate',args});s.ctx.rotate=(...args)=>s.calls.push({kind:'rotate',args});const shot={x:8,y:6,vx:0,vy:-2,type:'c3_shot',time:2,damage:16},before=JSON.stringify(shot),frames=new Set();
 for(let i=0;i<8;i++){s.fx.clock=i*.070001;assert(s.fx.drawProjectile(shot));const draw=s.calls.filter(c=>c.kind==='image').at(-1);frames.add(draw.args[1]+','+draw.args[2]);assert.equal(s.calls.filter(c=>c.kind==='rotate').at(-1).args[0],-Math.PI/2)}assert.equal(frames.size,8);assert.equal(JSON.stringify(shot),before);assert.equal(s.damage,0);
});
check('Missing projectile artwork delegates to legacy; reduced motion holds a sprite and pause freezes time',()=>{
 const s=fxHarness.factory('c3_silence');s.ctx.translate=()=>{};s.ctx.rotate=()=>{};const p={x:8,y:6,vx:2,vy:0,type:'c3_shot'};s.fx.images.projectile.complete=false;assert.equal(s.fx.drawProjectile(p),false);s.fx.images.projectile.complete=true;s.BossChoreographyV2.reduced=()=>true;for(const t of [.05,.4,2]){s.fx.clock=t;assert(s.fx.drawProjectile(p));const d=s.calls.filter(c=>c.kind==='image').at(-1);assert.equal(d.args[1],0);assert.equal(d.args[2],0)}s.mode='overlay';const time=s.fx.clock;s.fx.step(.2);assert.equal(s.fx.clock,time);
});
check('Aim textures preserve collision clipping and original contour callbacks',()=>{
 const s=fxHarness.factory('c3_silence'),g={kind:'disk',x:10,y:10,r:3.7};s.BossChoreographyV2.paint(g,.75,false);const drawn=s.calls.filter(c=>c.kind==='image');assert(drawn.some(c=>c.args[0]===s.fx.images.aim));assert(s.calls.some(c=>c.kind==='clip'));assert.equal(s.paintCalls,1);assert.equal(s.damage,0);
});
console.log(JSON.stringify({passed:count,method:'Production functions in NodeVM + RGBA/manifest contracts. Browser fluency/engine validation belongs to root.'}));
