/* Real-build art regression in an isolated browser context.
 * node qa/musician_art.cjs URL (or staging testes/arte_musicos_browser.cjs)
 * Optional PLAYWRIGHT_CORE, CHROME_PATH, CDP_URL, ART_QA_OUTPUT.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),output=process.env.ART_QA_OUTPUT||path.join(root,'qa','MUSICIAN_BROWSER.json');
(async()=>{
 let browser,context;
 try{
 const executable=process.env.CHROME_PATH;
 browser=process.env.CDP_URL?await chromium.connectOverCDP(process.env.CDP_URL):
   await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 context=await browser.newContext({viewport:{width:1280,height:800}});
 const page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.requestAnimationFrame=()=>0;window.__pads=[];
  Object.defineProperty(navigator,'getGamepads',{value:()=>window.__pads});
  window.__pad=i=>({index:i,id:'Musician isolated QA '+i,connected:true,mapping:'standard',
    axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
 });
 await page.goto(process.argv[2]||'http://127.0.0.1:8767/',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>typeof MusicianArtV1!=='undefined');
 async function check(name,fn){const detail=await fn();checks.push({name,passed:true,detail});console.log('OK '+name)}
 async function arena(p1='synth',p2='percussion'){
  await page.evaluate(async({p1,p2})=>{
   G=fresh();G.active=p1;G.formation=[p1,p2];G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;
   G.c3.synthUnlocked=G.c3.percussionUnlocked=true;G.knownMembers=C3.unlockedRoster().slice();
   for(const id of [p1,p2])G.hp[id]=G.maxhp[id]=100;
   current=mk('forest',40,30,'grass');areas.forest=current;G.area='forest';G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];
   mode='walk';battle=null;bossActor=null;keys={};
   Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,dashCD:0,invuln:0,combo:0});
   C3.synthWave=0;C3.synthZones=[];C3.percussionGuard=0;
   resetMotion10();Input121.game=G;Input121.lastArea=G.area;C3.pad.previous.clear();
   window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;
   C3.coop.member=p2;C3.syncCoop(true);C3.coop.invuln=0;
   MusicianArtV1.reset();MusicianArtV1.setVariant('synth','unmasked');MusicianArtV1.setVariant('percussion','unmasked');
   $('start').classList.add('hidden');$('overlay').classList.add('hidden');
   $('dialogue').classList.add('hidden');$('cinema').style.display='none';cam.x=cam.y=0;
   await window.FinalAssetLoadingV1?.start();update(0);await window.FinalAssetLoadingV1?.ready();
  },{p1,p2});
 }
 await check('No musician atlases decoded on title screen',async()=>{
  const n=await page.evaluate(()=>Object.keys(MusicianArtV1.images).length);assert.equal(n,0);return n;
 });
 await check('All 208 directional variant sequences decode as eight nonempty RGBA frames',async()=>{
  const result=await page.evaluate(async()=>{
   const art=MusicianArtV1,canvas=document.createElement('canvas');canvas.width=canvas.height=256;
   const q=canvas.getContext('2d',{willReadFrequently:true});let sequences=0,frames=0;
   for(const animation of art.manifest.animations){
    const id=animation.hero==='franco_sintetizador'?'synth':animation.hero==='ryuchi_percussionista'?'percussion':null;
    if(!id)throw Error('Unknown musician ID '+animation.hero);
    const image=art.image(art.key(id,animation.variant,animation.state));await image.decode();
    if(image.naturalWidth!==2048||image.naturalHeight!==1024)throw Error('Wrong musician atlas dimensions');
    for(let frame=0;frame<8;frame++){
     q.clearRect(0,0,256,256);q.drawImage(image,frame*256,animation.row*256,256,256,0,0,256,256);
     const data=q.getImageData(0,0,256,256).data;
     if(data[3]||data[(256*256-1)*4+3])throw Error('Opaque frame corner');
     if(!data.some((v,i)=>i%4===3&&v>72))throw Error('Empty musician frame');
     frames++;
    }sequences++;
   }return {sequences,frames};
  });assert.equal(result.sequences,208);assert.equal(result.frames,1664);return result;
 });
 await check('Accepted P1/P2 actions retain separate identities and blocked buttons do not restart',async()=>{
  await arena();const result=await page.evaluate(()=>{
   attackAction();C3.coopAttack(window.__pads[1]);
   const records=MusicianArtV1.players.map(r=>({hero:r.hero,state:r.state}));
   const a=MusicianArtV1.players[0],b=MusicianArtV1.players[1];a.elapsed=.05;b.elapsed=.06;
   attackAction();C3.coopAttack(window.__pads[1]);
   const blocked=a===MusicianArtV1.players[0]&&b===MusicianArtV1.players[1]&&a.elapsed===.05&&b.elapsed===.06;
   act.cool=0;attackAction();const stage2=MusicianArtV1.players[0].state;
   act.cool=0;attackAction();return {records,blocked,stage2,stage3:MusicianArtV1.players[0].state};
  });assert.deepEqual(result.records,[{hero:'synth',state:'attack_1'},{hero:'percussion',state:'attack_1'}]);
  assert(result.blocked);assert.equal(result.stage2,'attack_2');assert.equal(result.stage3,'attack_3');return result;
 });
 await check('Real techniques and signatures animate without changing their acceptance rules',async()=>{
  const records=[];
  for(const hero of ['synth','percussion'])for(const [fn,state]of [['skillAction','skill'],['advancedSkill','advanced'],['duoAction','signature']]){
   await arena(hero,hero==='synth'?'percussion':'synth');
   const result=await page.evaluate(({fn})=>{
    G.resonance=100;window[fn]();const r=MusicianArtV1.players[0];if(!r)throw Error('Missing accepted musician action');
    r.elapsed=.05;window[fn]();return {hero:r.hero,state:r.state,duration:r.duration,same:r===MusicianArtV1.players[0],elapsed:r.elapsed};
   },{fn});assert.equal(result.hero,hero);assert.equal(result.state,state);assert(result.same);assert.equal(result.elapsed,.05);records.push(result);
  }return records;
 });
 await check('Defeat completes behind the existing retry overlay and holds the ground pose',async()=>{
  await arena();const result=await page.evaluate(async()=>{
   G.formation=['synth'];G.hp.synth=1;G.hp.percussion=0;C3.pad.pads=[];mode='action';act.invuln=0;
   await window.FinalAssetLoadingV1?.ready();
   await MusicianArtV1.image(MusicianArtV1.key('synth',MusicianArtV1.variant('synth'),'defeat')).decode();
   damageHero(999);
   const art=MusicianArtV1,defeatMode=mode,hasRetry=!!$('retryCheckpoint');
   update(.4);const middle=art.pose({style:'synth'},0,false);
   update(.9);const last=art.pose({style:'synth'},0,false);
   update(2);const held=art.pose({style:'synth'},0,false);
   G.hp.synth=20;update(0);return {defeatMode,hasRetry,middle,last,held,released:art.players[0]===null};
  });assert.equal(result.defeatMode,'overlay');assert(result.hasRetry);
  assert.equal(result.middle.state,'defeat');assert.equal(result.middle.frame,4);
  assert.equal(result.last.state,'defeat');assert.equal(result.last.frame,7);
  assert.equal(result.held.frame,7);assert(result.released);return result;
 });
 await check('Roll phase, direction and clock pause come from the existing controllers',async()=>{
  await arena();const result=await page.evaluate(()=>{
   act.dashCD=0;startRoll121();C3.coop.dashCD=0;C3.coopDodge(window.__pads[1]);
   const a=MusicianArtV1.pose({style:'synth',dir:'down'},0,true),b=MusicianArtV1.pose({style:'percussion',dir:'down'},1,true);
   const art=MusicianArtV1,clock=art.clock;
   mode='dialogue';update(.1);
   const paused=art.pose({style:'synth',dir:'down'},0,true);
   return {a,b,paused,frozen:art.clock===clock&&paused.state===a.state&&paused.frame===a.frame&&paused.direction===a.direction};
  });assert.equal(result.a.state,'roll');assert.equal(result.b.state,'roll');assert.equal(result.a.direction,'right');assert(result.frozen);return result;
 });
 await check('Mask API switches actor, NPC and portraits together for each musician',async()=>{
  await arena();const result=await page.evaluate(async()=>{
   const art=MusicianArtV1,results=[];
   for(const hero of ['synth','percussion'])for(const variant of ['unmasked','masked']){
    art.setVariant(hero,variant);G.active=hero;art.reset();C3.pad.pads=[];
    const image=art.image(art.key(hero,variant,'idle'));await image.decode();
    await window.FinalAssetLoadingV1?.ready();
    const calls=[],prior=ctx.drawImage;ctx.drawImage=function(...args){calls.push(args);return prior.apply(this,args)};
    try{
     drawActor({style:hero,dir:'down'},G.x*T,G.y*T,false);const actor=calls.at(-1)?.[0]===image;
     drawDetailedNPC({id:hero==='synth'?'c3_synth_npc':'c3_percussion_npc',dir:'left'},300,200);
     const npc=calls.at(-1)?.[0]===image;
     const portrait=portraitURI10(hero)===art.assets[art.key(hero,variant,'portrait_neutral')];
     results.push({hero,variant,actor,npc,portrait});
    }finally{ctx.drawImage=prior}
   }return results;
  });assert(result.every(r=>r.actor&&r.npc&&r.portrait));return result;
 });
 await check('Decoded musician cache remains at eight sheets',async()=>{
  const size=await page.evaluate(()=>Object.keys(MusicianArtV1.images).length);assert.ok(size<=8);return size;
 });
 await arena();await page.evaluate(async()=>{
  const art=MusicianArtV1;for(const hero of ['synth','percussion'])for(const variant of ['unmasked','masked']){
   const image=art.image(art.key(hero,variant,'idle'));await image.decode();
  }
  ctx.clearRect(0,0,768,432);ctx.fillStyle='#292437';ctx.fillRect(0,0,768,432);ctx.save();ctx.scale(2,2);
  for(const [i,hero] of ['synth','percussion'].entries())for(const [j,variant] of ['unmasked','masked'].entries()){
   art.setVariant(hero,variant);drawActor({style:hero,dir:'down',musicianNpc:true},70+i*120+j*50,145,false);
  }ctx.restore();
 });
 fs.mkdirSync(path.dirname(output),{recursive:true});
 await page.locator('canvas').first().screenshot({path:path.join(path.dirname(output),'MUSICIAN_ENGINE.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(output,JSON.stringify({passed:true,checks,browserErrors:errors,physicalControllersTested:false},null,2)+'\n');
 console.log('PASS '+checks.length+' checks');
 }finally{
  if(context)await context.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
 }
})().catch(e=>{console.error(e);process.exitCode=1});
