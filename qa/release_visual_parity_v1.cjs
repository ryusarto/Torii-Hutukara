'use strict';
// Exact game-canvas comparison between the approved release and a candidate.
// Fixtures control seed/time/state and await existing final artwork on both
// sides; no pixel tolerance, masks, resizing or artwork replacement is used.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const baselineURL=process.argv[2],candidateURL=process.argv[3];
if(!/^https?:/.test(baselineURL||'')||!/^https?:/.test(candidateURL||''))throw Error('Pass approved baseline URL and candidate URL');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.VISUAL_PARITY_OUT||path.join(root,'qa/performance-v1/visual-parity'));
fs.mkdirSync(out,{recursive:true});
const report={baselineURL,candidateURL,method:'Exact RGBA from game canvas. Deterministic seed, fixed wall clock and fixture animation clocks; requestAnimationFrame frozen. Baseline explicitly decodes its existing final assets, candidate additionally awaits FinalAssetLoadingV1. No artwork normalization, pixel tolerance or region masks. Simulation state must remain unchanged by draw; approved camera interpolation/shake is compared exactly before and after on both builds. Controlled snapshots, not human/hardware playtest.',sources:{},cases:[],errors:[]};
let browser;
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const simulationState=text=>{const {camera,screenShake,...simulation}=JSON.parse(text);return JSON.stringify(simulation)};
function fixture(){
 const directions={down:[0,1],left:[-1,0],up:[0,-1],right:[1,0]},heroes=['franco','ryuchi','alt','katana','synth','percussion'];
 const pause=()=>new Promise(r=>setTimeout(r,0)),decodedSources=new WeakMap();
 async function decoded(image,label){
  if(!image)return;if(typeof image.getContext==='function')return;
  if(typeof image.decode!=='function'||!image.src)return;
  // Reusing a decoded object is equivalent to the runtime's readiness cache;
  // changed src or a replacement Image always requires a fresh decode.
  if(decodedSources.get(image)!==image.src){await image.decode();decodedSources.set(image,image.src)}for(let i=0;image.edgePending&&i<100;i++)await pause();
  if(!image.complete||!image.naturalWidth||image.edgePending)throw Error('Final image not ready: '+label);
 }
 function artFor(id){return ProtagonistArtV5.supports(id)?ProtagonistArtV5:NinjaArcherArtV1.supports(id)?NinjaArcherArtV1:MusicianArtV1.supports(id)?MusicianArtV1:null}
 async function warmHero(id,states=['idle','walk','run','roll'],npc=false){
  const art=artFor(id);if(!art)return;const variant=art===MusicianArtV1?art.variant(id):G.flags.masks?'masked':'unmasked';
  for(const state of states){const key=art===MusicianArtV1?art.key(id,variant,state):id+'_'+state;if(art.assets[key])await decoded(art.image(key),id+'/'+state)}
  if(!npc){const run=RunStrideV1.image(id);if(!(await run.ready)||!run.bitmap)throw Error('Run bitmap unavailable: '+id);await decoded(HeroAttackBody.sheet(id,HeroAttackBody.variant(id,{variant})),id+'/contact');HeroAttackFX.v3Ready(id);await decoded(HeroAttackFX.v3Images[id],id+'/effects')}
 }
 async function readiness(spec){
  C3.loadDeferredImages();await CenariosV2.ready();await EnvironmentDepthV1.ready();await WorldPolishV1.ready();await CloudWorldV1.ready();
  for(const [name,pool]of [['base',images],['environment',envSprites],['chapter',C3.images]])for(const [id,image]of Object.entries(pool||{}))await decoded(image,name+'/'+id);
  for(const [id,image]of [['terrain',terrain10],['props',props10],['world',worldTilesImage],['environment',ENV092],['actors',atlas091],['city',NPC092],['station',stationProps11]])await decoded(image,id);
  for(const id of partyMembers()){
   const art=artFor(id),states=['idle','walk','run','roll'];const record=art?.players?.[0];
   if(record?.hero===id&&record.state&&!states.includes(record.state))states.push(record.state);
   await warmHero(id,states);
  }
  for(const n of current.npcs||[]){
   const id=n.postReserve?n.postHero:{c3_synth_npc:'synth',c3_percussion_npc:'percussion',c3_alt_final:'alt',c3_katana_final:'katana'}[n.id];
   if(id)await warmHero(id,MusicianArtV1.supports(id)?['idle','performance','attack_1']:['idle','walk','run','roll'],true);
   const appearance=NpcLifeV1.appearance(n);if(appearance?.ready)appearance.ready(n);
  }
  if(typeof NpcGesturesV1!=='undefined'){NpcGesturesV1.ready();await decoded(NpcGesturesV1.image,'npc/gestures')}
  if(typeof C3AmbientGesturesV2!=='undefined'){C3AmbientGesturesV2.ready();await decoded(C3AmbientGesturesV2.image,'npc/ambient')}
  for(const enemy of [...(current.enemies||[]),bossActor].filter(Boolean)){
   if(window.EnemyVariantArtV2?.supports(enemy))await decoded(EnemyVariantArtV2.image(enemy.type),'enemy/'+enemy.type);
   else {const id=EnemyArtV1.key(enemy.type,enemy);if(EnemyArtV1.supports(id))await decoded(EnemyArtV1.image(id),'enemy/'+id)}
  }
  await decoded(CombatReadabilityV1.groundRift,'portal');await decoded(CombatReadabilityV1.image,'combat/readability');
  if(window.FinalAssetLoadingV1){await FinalAssetLoadingV1.start({force:true});await FinalAssetLoadingV1.ready();if(FinalAssetLoadingV1.busy())throw Error('Candidate readiness did not settle: '+JSON.stringify(FinalAssetLoadingV1.snapshot()))}
 }
 function clocks(){
  tick=12.375;EnvironmentAtmosphereV1.clock=3.125;EnvironmentAtmosphereV1.game=G;EnvironmentAtmosphereV1.area=G.area;
  for(const art of [ProtagonistArtV5,NinjaArcherArtV1,MusicianArtV1]){art.reset();art.clock=3.125}
  EnemyArtV1.reset();EnemyArtV1.clock=3.125;BossChoreographyV2.reset();BossGroundFXV1.reset();
  if(window.EnemyVariantArtV2?.reset)EnemyVariantArtV2.reset();if(window.EnemySkillFXV1?.reset)EnemySkillFXV1.reset();
  HeroAttackFX.sync();HeroAttackFX.clock=3.125;HeroAttackFX.events=[];HeroAttackBody.playback=new WeakMap();HeroAttackBody.followerCast=null;
  CloudWorldV1.reset();CloudWorldV1.clock=3.125;
  NpcLifeV1.sync();for(const n of current.npcs||[]){const s=NpcLifeV1.state(n);if(s){s.clock=3.125;s.age=.25;s.moving=false;s.frame=0}}
 }
 // Initialize the camera at the base renderer's exact target, including the
 // approved canal/club framing; draw interpolation should then be a no-op.
 function centerCamera(){cam.x=current.w*T<VW?(current.w*T-VW)/2:ClubStage.cameraX(CanalViolin.cameraX(clamp(coopCamera123('x')*T-VW/2,0,current.w*T-VW)));cam.y=!C3.coopActive()&&bossActor?.id==='voice_boss'?12*T-VH/2:current.h*T<VH?(current.h*T-VH)/2:ClubStage.cameraY(clamp(coopCamera123('y')*T-VH/2,0,current.h*T-VH))}
 function essential(){return JSON.stringify({game:G,area:current.id,tiles:current.tiles,blocked:[...current.blocked].sort(),props:current.props,npcs:current.npcs.map(n=>({id:n.id,x:n.x,y:n.y})),enemies:current.enemies.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y,hp:e.hp,max:e.max})),camera:{x:cam.x,y:cam.y},screenShake,walkable:canBody121(G.x,G.y),cooldowns:{cool:act.cool,dash:act.dash,dashCD:act.dashCD,skill:act.skill,skillX:act.skillX,duo:act.duo},tick})}
 function reset(spec){
  ToriiSorte.semear(913357);G=fresh();G.started=1770000000000;G.totalSeconds=0;G.chapter=3;
  const complete=spec.progress!=='initial',hero=spec.hero||'franco';
  Object.assign(G.flags,{bass:true,reveal:true,voicesKatana:true,voicesDone:true,ending:complete,roots:complete,bridge:complete,masks:!!spec.masked});
  Object.assign(G.c3,{started:true,complete,synthUnlocked:complete||hero==='synth',percussionUnlocked:complete||hero==='percussion',usinaGate:complete,usinaDone:complete,canalPath:complete,canalDone:complete,windFlute:complete,horizonDrum:complete,liftOpen:complete,clubPhraseDone:complete,cloudPathA:complete,cloudPathB:complete,cloudPlatform:complete,metronomeDone:complete,silenceDone:complete});
  G.knownMembers=heroes.slice();G.formation=spec.kind==='hero'?[hero]:['franco','ryuchi','alt'];G.party3=true;G.active=hero;G.difficulty='normal';G.resonance=100;G.potions=9;
  for(const id of heroes){G.hp[id]=G.maxhp[id]=1000;G.levels[id]=5;G.xp[id]=0}
  MusicianArtV1.setVariant('synth',spec.masked?'masked':'unmasked');MusicianArtV1.setVariant('percussion',spec.masked?'masked':'unmasked');
  C3.pad.pads=[];C3.pad.previous.clear();C3.coop.member=null;Input121.focused=true;Input121.wasCoop=false;
  buildMaps();
  if(spec.kind==='hero'){areas.forest=mk('forest',40,30,'grass');areas.forest.enemies=[];areas.forest.npcs=[];areas.forest.props=[]}
  setArea(spec.area||'forest',10.5,12.5,false);
  if(spec.kind==='map'){
   const desiredX=current.w*T<=VW?current.w/2:(spec.cameraX+VW/2)/T,desiredY=current.h*T<=VH?current.h/2:(spec.cameraY+VH/2)/T;
   // Controlled camera coverage may place the fixture actor on a blocked cell;
   // walkability and collision geometry are compared, not silently normalized.
   G.x=desiredX;G.y=desiredY;
  }
  menuPage10=menuOrigin10=null;mode=spec.kind==='hero'?'action':'walk';battle=spec.kind==='hero'?{boss:false,id:'parity'}:null;bossActor=null;keys={};touchDir={};trail=[];projectiles=[];hostileShots=[];combatFX.length=0;Combat10.effects=[];Special11.traces=[];Special11.fields=[];
  C3.hazards=[];C3.synthZones=[];C3.percussionGuard=0;C3.synthWave=0;C3.finalPending=false;resetMotion10();
  Object.assign(act,{cool:0,dash:0,dashCD:0,skill:0,skillX:0,duo:0,hit:0,combo:0,comboTime:0,invuln:0,slash:0,slashDir:'down'});Input121.game=G;Input121.lastArea=G.area;Input121.roll=null;Input121.recovery=0;
  G.dir=spec.direction||'down';G.aim091=directions[G.dir].slice();G.isRunning10=false;G.moveSpeed10=0;stride10=0;lastStep=1;transitionAlpha=screenShake=0;menuOpen=false;
  for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';
  clocks();centerCamera();
 }
 async function prepare(spec){
  reset(spec);await readiness(spec);clocks();
  if(spec.kind==='hero'){
   if(['walk','run'].includes(spec.pose)){
    G.isRunning10=spec.pose==='run';G.moveSpeed10=G.isRunning10?6.1:3.7;
    const old={hero:G.active,x:G.x,y:G.y},before=RunStrideV1.capture(),[dx,dy]=directions[G.dir];
    moveBody10(dx,dy,.23,true);const distance=Math.hypot(G.x-old.x,G.y-old.y);if(distance<.1)throw Error('Movement fixture did not move');
    stride10=distance;lastStep=0;ProtagonistArtV5.advanceLocomotion([old,null]);RunStrideV1.advance(before);
   }else if(spec.pose==='roll'){
    dodgeAction();if(!Input121.roll)throw Error('Roll fixture was rejected');Combat10.dashTime=Input121.roll.duration*.5;
   }else if(spec.pose==='attack'||spec.pose==='skill'){
    const enemy=hydrateEnemy({id:'parity_target',type:'hush',x:G.x+G.aim091[0]*1.1,y:G.y+G.aim091[1]*1.1});enemy.hp=enemy.max=900;current.enemies=[enemy];
    if(spec.pose==='attack')attackAction();else skillAction();
    const art=artFor(G.active),record=art.players[0];if(!record||record.hero!==G.active)throw Error('Action fixture was rejected: '+spec.pose+'/'+G.active);
    await readiness(spec);
    record.elapsed=record.duration*spec.phase;art.clock=3.125+record.elapsed;HeroAttackBody.playback=new WeakMap();
    const event=HeroAttackFX.events.find(e=>e.art?.hero===G.active);if(!event)throw Error('Action effect missing');HeroAttackFX.clock=event.start+event.duration*spec.phase;
   }
  }
  centerCamera();await readiness(spec);return {area:G.area,x:G.x,y:G.y,mask:G.flags.masks,formation:partyMembers(),gate:window.FinalAssetLoadingV1?.snapshot()||null};
 }
 async function capture(){
  if(window.FinalAssetLoadingV1)await FinalAssetLoadingV1.ready();
  const before=essential();drawEnv();
  if(window.FinalAssetLoadingV1?.busy())throw Error('Drawing encountered an unprepared resource: '+JSON.stringify({gate:FinalAssetLoadingV1.snapshot(),npcs:current.npcs.map(n=>({id:n.id,spriteKey:n.spriteKey})),ninja:Object.fromEntries(Object.entries(NinjaArcherArtV1.images).map(([k,v])=>[k,{complete:v.complete,width:v.naturalWidth}]))}));
  const after=essential(),d=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data;
  let binary='';for(let i=0;i<d.length;i+=32768)binary+=String.fromCharCode(...d.subarray(i,i+32768));
  return{before,after,rgba:btoa(binary),width:ctx.canvas.width,height:ctx.canvas.height,position:{x:G.x,y:G.y},camera:{x:cam.x,y:cam.y}};
 }
 window.ReleaseParityV1={prepare,capture,meta:()=>({build:window.TORII_PLAYTEST_BUILD||window.ToriiPlaytest||null,maps:Object.values(areas).map(a=>({id:a.id,w:a.w,h:a.h})),viewport:{w:VW,h:VH},gate:!!window.FinalAssetLoadingV1})};
}
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 async function open(url,side){const context=await browser.newContext({viewport:{width:1280,height:800}});const page=await context.newPage();page.on('pageerror',e=>report.errors.push({side,message:e.message}));await page.addInitScript(()=>{requestAnimationFrame=()=>0;Date.now=()=>1770000000000;let random=913357;Math.random=()=>((random=(Math.imul(random,1664525)+1013904223)>>>0)/4294967296);Object.defineProperty(navigator,'getGamepads',{value:()=>[]});const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options)}});await page.goto(url,{waitUntil:'load',timeout:180000});await page.waitForFunction(()=>typeof CenariosV2!=='undefined'&&typeof HeroAttackFX!=='undefined'&&typeof RunStrideV1!=='undefined',null,{timeout:60000});await page.evaluate(fixture);return{page,context,meta:await page.evaluate(()=>ReleaseParityV1.meta())}}
 const before=await open(baselineURL,'baseline'),after=await open(candidateURL,'candidate');report.sources={baseline:before.meta,candidate:after.meta};
 assert.deepEqual(after.meta.maps,before.meta.maps,'Map inventory or dimensions changed');assert.equal(before.meta.maps.length,25,'Expected all 25 approved maps');assert.deepEqual(after.meta.viewport,before.meta.viewport,'Logical viewport changed');
 const specs=[],positions=(size,view)=>{if(size<=view)return[0];const a=[];for(let v=0;v<size-view;v+=view-48)a.push(v);if(a.at(-1)!==size-view)a.push(size-view);return a};
 for(const progress of ['initial','complete'])for(const a of before.meta.maps)for(const cameraY of positions(a.h*24,before.meta.viewport.h))for(const cameraX of positions(a.w*24,before.meta.viewport.w))specs.push({id:`map_${progress}_${a.id}_${cameraX}_${cameraY}`,kind:'map',area:a.id,progress,masked:progress==='complete',cameraX,cameraY});
 for(const hero of ['franco','ryuchi','alt','katana','synth','percussion'])for(const masked of ['alt','katana'].includes(hero)?[false]:[false,true]){
  for(const direction of ['down','left','up','right'])for(const pose of ['idle','walk','run','roll'])specs.push({id:`hero_${hero}_${masked?'masked':'unmasked'}_${direction}_${pose}`,kind:'hero',area:'forest',progress:'complete',hero,masked,direction,pose});
  for(const [pose,direction]of [['attack','right'],['skill','up']])for(const phase of [.15,.45,.85])specs.push({id:`hero_${hero}_${masked?'masked':'unmasked'}_${direction}_${pose}_${phase}`,kind:'hero',area:'forest',progress:'complete',hero,masked,direction,pose,phase});
 }
 const selected=process.env.VISUAL_PARITY_CASES?JSON.parse(process.env.VISUAL_PARITY_CASES):null;
 for(const spec of specs.filter(s=>!selected||selected.some(q=>s.id.includes(q)))){
  console.log('CHECK '+spec.id);let row={...spec};
  try{
   const [preparedA,preparedB]=await Promise.all([before.page.evaluate(s=>ReleaseParityV1.prepare(s),spec),after.page.evaluate(s=>ReleaseParityV1.prepare(s),spec)]);
   const [a,b]=await Promise.all([before.page.evaluate(()=>ReleaseParityV1.capture()),after.page.evaluate(()=>ReleaseParityV1.capture())]);
   const pixelsA=Buffer.from(a.rgba,'base64'),pixelsB=Buffer.from(b.rgba,'base64');let channels=0,pixels=0,maxDelta=0,firstDiff=null;
   for(let i=0;i<Math.max(pixelsA.length,pixelsB.length);i+=4){let changed=false;for(let c=0;c<4;c++){const n=i+c;if(pixelsA[n]!==pixelsB[n]){channels++;changed=true;maxDelta=Math.max(maxDelta,Math.abs((pixelsA[n]||0)-(pixelsB[n]||0)));if(!firstDiff)firstDiff={x:Math.floor(i/4)%a.width,y:Math.floor(i/4/a.width),before:[...pixelsA.subarray(i,i+4)],after:[...pixelsB.subarray(i,i+4)]}}}if(changed)pixels++}
   const invariantA=simulationState(a.before)===simulationState(a.after),invariantB=simulationState(b.before)===simulationState(b.after),crossBefore=a.before===b.before,crossAfter=a.after===b.after;
   row={...row,passed:!channels&&a.width===b.width&&a.height===b.height&&invariantA&&invariantB&&crossBefore&&crossAfter,rgba:{changedPixels:pixels,changedChannels:channels,maxDelta,firstDiff,baselineSHA256:digest(pixelsA),candidateSHA256:digest(pixelsB)},state:{baselineSimulationUnchanged:invariantA,candidateSimulationUnchanged:invariantB,baselineCamera:{before:JSON.parse(a.before).camera,after:JSON.parse(a.after).camera},candidateCamera:{before:JSON.parse(b.before).camera,after:JSON.parse(b.after).camera},baselineShake:{before:JSON.parse(a.before).screenShake,after:JSON.parse(a.after).screenShake},candidateShake:{before:JSON.parse(b.before).screenShake,after:JSON.parse(b.after).screenShake},crossBeforeEqual:crossBefore,crossAfterEqual:crossAfter,baselineBeforeSHA256:digest(a.before),baselineAfterSHA256:digest(a.after),candidateBeforeSHA256:digest(b.before),candidateAfterSHA256:digest(b.after)},baseline:{position:a.position,camera:a.camera,width:a.width,height:a.height},candidate:{position:b.position,camera:b.camera,width:b.width,height:b.height},readiness:{baseline:preparedA.gate,candidate:preparedB.gate}};
   if(!row.passed){
    for(const [side,page,state]of [['baseline',before.page,a],['candidate',after.page,b]]){const png=await page.evaluate(()=>$('game').toDataURL('image/png'));fs.writeFileSync(path.join(out,spec.id+'_'+side+'.png'),Buffer.from(png.split(',')[1],'base64'));fs.writeFileSync(path.join(out,spec.id+'_'+side+'_state.json'),JSON.stringify({before:JSON.parse(state.before),after:JSON.parse(state.after)},null,2))}
    console.error('FAIL '+spec.id+' '+JSON.stringify({rgba:row.rgba,state:row.state}));
   }
  }catch(e){row.passed=false;row.failure=e.stack;console.error('FAIL '+spec.id+' '+e.stack)}
  report.cases.push(row);report.passed=report.cases.filter(r=>r.passed).length;report.failed=report.cases.length-report.passed;fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');
  if(!row.passed&&process.env.VISUAL_PARITY_STOP_FIRST==='1')break;
 }
 assert(report.cases.length,'No cases selected');assert.equal(report.failed,0,report.failed+' visual/state cases differ');assert.deepEqual(report.errors,[]);console.log('PASS · '+JSON.stringify({cases:report.cases.length,maps:before.meta.maps.length,sources:{baseline:before.meta.build?.sourceSha256,candidate:after.meta.build?.sourceSha256}}));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n')});
