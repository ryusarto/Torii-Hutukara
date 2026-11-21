/* Observational prewarm diagnostic: native RAF, entry idle200ms, target PNG latency150ms.
 * MUSICIAN_COLD_STRICT=1 additionally fails on any omitted native-RAF pose.
 * No module replacement, no record/frame edits, no build/repository writes.
 */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const hitchMs=Math.max(0,Math.min(500,Number(process.env.MUSICIAN_COLD_HITCH_MS)||0));
const output=process.env.COLD_ATLAS_OUTPUT||path.join(__dirname,'PREWARM_FRIO_200MS.json');
(async()=>{
 let browser;const cases=[];
 try{
  browser=process.env.CDP_URL?await chromium.connectOverCDP(process.env.CDP_URL):
   await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  for(const cache of ['entry_200ms'])for(const hero of ['synth','percussion'])for(const variant of ['unmasked','masked'])
  for(const latencyMs of [150]){
   const context=await browser.newContext({viewport:{width:960,height:640}}),page=await context.newPage();
   const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.addInitScript(()=>Object.defineProperty(navigator,'getGamepads',{value:()=>[]}));
    await page.goto(process.argv[2]||'http://127.0.0.1:8767/',{waitUntil:'load',timeout:120000});
    await page.waitForFunction(()=>typeof MusicianArtV1!=='undefined');
    const titleCache=await page.evaluate(()=>Object.keys(MusicianArtV1.images).length);
    const actionUrl=await page.evaluate(({hero,variant})=>new URL(MusicianArtV1.assets[MusicianArtV1.key(hero,variant,'attack_1')],document.baseURI).href,{hero,variant});
    if(latencyMs)await page.route(actionUrl,async route=>{
     const start=Date.now();await new Promise(resolve=>setTimeout(resolve,latencyMs));
     network.push({url:route.request().url(),extraLatencyMs:Date.now()-start});await route.continue();
    });
    else page.on('request',request=>{if(request.url()===actionUrl)network.push({url:actionUrl,extraLatencyMs:0})});
    const setup=await page.evaluate(async({hero,variant,cache})=>{
     G=fresh();G.active=hero;G.formation=[hero];G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;
     G.c3.started=G.c3.synthUnlocked=G.c3.percussionUnlocked=true;G.hp[hero]=G.maxhp[hero]=100;
     current=mk('power_plant',40,30,'grass');G.area='power_plant';G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];
     const target=hydrateEnemy({id:'cold-atlas-target',type:'hush',x:G.x+1,y:G.y});
     target.hp=target.max=999999;target.stun=target.cd=999;current.enemies.push(target);
     mode='action';menuOpen=false;battle={boss:false,id:'field'};bossActor=null;keys={};
     Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,dashCD:0,invuln:0,combo:0,comboTime:0});
     C3.synthWave=0;C3.synthZones=[];C3.percussionGuard=0;G.resonance=100;projectiles=[];hostileShots=[];
     resetMotion10();Input121.game=G;Input121.lastArea=G.area;Input121.focused=true;Input121.wasCoop=false;
     C3.pad.pads=[];C3.pad.previous.clear();window.__prewarmEntry=performance.now();MusicianArtV1.reset();MusicianArtV1.setVariant(hero,variant);
     $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');
     $('cinema').style.display='none';
     const art=MusicianArtV1,key=art.key(hero,variant,'attack_1');
     const idle=art.image(art.key(hero,variant,'idle'));await idle.decode();
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     await new Promise(resolve=>setTimeout(resolve,Math.max(0,200-(performance.now()-window.__prewarmEntry))));
     return {entryWaitRequestedMs:200,entryWaitMs:performance.now()-window.__prewarmEntry,idleKey:art.key(hero,variant,'idle'),actionKey:key,actionAbsent:!art.images[key],actionReady:!!(art.images[key]?.complete&&art.images[key]?.naturalWidth),cacheSize:Object.keys(art.images).length,
      metadata:typeof ToriiPlaytest!=='undefined'?{version:ToriiPlaytest.version,sourceSha:ToriiPlaytest.sourceSha256}:null};
    },{hero,variant,cache});
    const result=await page.evaluate(async({hero,variant,hitchMs})=>{
     const art=MusicianArtV1,actionKey=art.key(hero,variant,'attack_1'),idleKey=art.key(hero,variant,'idle');
     const previous=ctx.drawImage,timeline=[],start=performance.now(),startTick=tick;
     let image=null,loaded=null,decoded=null,decodeError=null,actionEnded=null,hitch=null;
     const rafIntervals=[];let lastRaf=null,probeRunning=true;
     const probe=now=>{if(!probeRunning)return;if(lastRaf!==null)rafIntervals.push(now-lastRaf);lastRaf=now;requestAnimationFrame(probe)};requestAnimationFrame(probe);
     const stamp=()=>({wallMs:performance.now()-start,gameMs:(tick-startTick)*1000,elapsed:art.players[0]?.elapsed??null});
     ctx.drawImage=function(...args){
      const actual=args[0],key=actual===image?actionKey:actual===art.images[idleKey]?idleKey:null;
      if(key){const point=stamp();timeline.push({...point,key,uri:actual.currentSrc||actual.src,frame:args[1]/256,row:args[2]/256});}
      const result=previous.apply(this,args);
      if(key===actionKey&&args[1]/256===2&&hitchMs&&!hitch){
       const start=performance.now();hitch={frame:2,requestedMs:hitchMs};
       while(performance.now()-start<hitchMs){}
       hitch.actualMs=performance.now()-start;
      }
      return result;
     };
     try{
      attackAction();const record=art.players[0];
      if(record?.state!=='attack_1')throw Error('Real first attack was rejected');
      image=art.images[actionKey];if(!image)throw Error('Accepted action did not request atlas');
      image.addEventListener('load',()=>{loaded=stamp()},{once:true});
      image.decode().then(()=>{decoded=stamp()},error=>{decodeError=error.message});
      if(image.complete&&image.naturalWidth)loaded=stamp();
      // Observe real elapsed/RAF; no update calls, no timeline or frame assignments.
      const observe=()=>{if(!actionEnded&&record.elapsed>=record.duration)actionEnded=stamp();};
      const timer=setInterval(observe,5);
      await new Promise(resolve=>setTimeout(resolve,900));clearInterval(timer);probeRunning=false;observe();
      const actionFrames=timeline.filter(p=>p.key===actionKey),idleDuring=timeline.filter(p=>p.key===idleKey&&p.elapsed<record.duration);
      return {duration:record.duration,accepted:true,loaded,decoded,decodeError,actionEnded,timeline,rafIntervals,hitch,
       firstActionDraw:actionFrames[0]||null,visibleFrames:[...new Set(actionFrames.map(p=>p.frame))],
       actionDrawCount:actionFrames.length,idleWhileActionCount:idleDuring.length,
       entireActionInvisible:actionFrames.length===0,cacheSize:Object.keys(art.images).length};
     }finally{ctx.drawImage=previous}
    },{hero,variant,hitchMs});
    cases.push({hero,variant,cache,latencyMs,titleCache,...setup,...result,network,errors});
    console.log(JSON.stringify({hero,variant,cache,latencyMs,duration:result.duration,decodeWallMs:result.decoded?.wallMs,
     decodeElapsed:result.decoded?.elapsed,firstDrawMs:result.firstActionDraw?.wallMs,visibleFrames:result.visibleFrames,
     entireActionInvisible:result.entireActionInvisible,idleWhileActionCount:result.idleWhileActionCount}));
   }finally{await context.close()}
  }
  const result={cases,injectedMainThreadHitchMs:hitchMs,method:'native RAF and actual attackAction/drawEnv/drawActor; only target PNG request delayed; no module or frame substitution',
   conclusion:{entryCases:cases.length,complete:cases.filter(c=>c.visibleFrames.length===8).length,
    incomplete:cases.filter(c=>c.visibleFrames.length<8).length,invisible:cases.filter(c=>c.entireActionInvisible).length}};
  result.contractPassed=cases.length===4&&cases.every(c=>!c.actionAbsent&&c.titleCache===0&&c.cacheSize<=8&&c.accepted&&!c.decodeError&&c.errors.length===0);
  result.passed=cases.length===4&&cases.every(c=>c.titleCache===0&&c.cacheSize<=8&&c.visibleFrames.join(',')==='0,1,2,3,4,5,6,7'&&c.errors.length===0);
  result.strictAll8=result.passed;
  fs.writeFileSync(output,JSON.stringify(result,null,2));
  if(!result.contractPassed||(process.env.MUSICIAN_COLD_STRICT==='1'&&!result.passed))throw Error('Prewarm diagnostic '+JSON.stringify(cases.map(c=>({hero:c.hero,variant:c.variant,frames:c.visibleFrames,errors:c.errors}))));
 }catch(error){if(!fs.existsSync(output))fs.writeFileSync(output,JSON.stringify({cases,passed:false,contractPassed:false,fatal:error.stack},null,2));console.error(error);process.exitCode=1}
 finally{if(browser)await browser.close()}
})();
