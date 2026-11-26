'use strict';
// Real-runtime loading barriers, fault injection and pinned-final-art contracts.
// These checks do not claim physical-device FPS or human gameplay validation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const outputDirectory=process.env.FINAL_ASSET_OUTPUT_DIR||path.join(root,'qa',version.versao,'final-assets');
const input=process.argv[2]||pathToFileURL(path.join(root,'game/builds',version.versao,'TORII_HUTUKARA_'+version.sufixo+'.html')).href;
const report={input,checks:[],errors:[],method:'Isolated Chromium; actual runtime, controlled decode/failure and keyboard input. No physical hardware testing.'};let browser,page;
async function check(name,fn){const detail=await fn();report.checks.push({name,passed:true,detail});console.log('OK · '+name)}
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>window.__controlledGatePad?[window.__controlledGatePad]:[]})});
 await page.goto(input,{waitUntil:'load',timeout:180000});await page.waitForFunction(()=>window.FinalAssetLoadingV1);
 report.source=await page.evaluate(async ()=>window.TORII_PLAYTEST_BUILD?.sourceSha256||null);
 if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.source,process.env.EXPECTED_SOURCE_SHA);
 await check('setArea stays synchronous while first presentation waits for final-art decode',async()=>{
  const r=await page.evaluate(async ()=>{
   const image=ProtagonistArtV5.image('franco_idle'),original=image.decode.bind(image),complete=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'complete').get;
   window.__finalIdleReleased=false;Object.defineProperty(image,'complete',{configurable:true,get(){return __finalIdleReleased&&complete.call(image)}});
   window.__releaseFinalIdle=null;image.decode=()=>new Promise((resolve,reject)=>{window.__releaseFinalIdle=()=>{__finalIdleReleased=true;return original().then(resolve,reject)}});
   G=fresh();G.formation=['franco','ryuchi'];buildMaps();mode='walk';$('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('hud').style.display='block';
   setArea('studio',12.5,10.5,false);
   window.__decodeOriginal=original;window.__decodeImage=image;
   return{area:G.area,mode,loading:FinalAssetLoadingV1.busy()};
  });assert.equal(r.area,'studio');assert.equal(r.mode,'walk');assert(r.loading);await page.waitForFunction(()=>typeof __releaseFinalIdle==='function');return r;
 });
 await check('Loading freezes simulation, drawing, native-loop tick and gameplay input',async()=>{
  const before=await page.evaluate(async ()=>({save:JSON.stringify(G),tick,art:ProtagonistArtV5.clock,music:MusicianArtV1.clock,fx:HeroAttackFX.clock}));
  const r=await page.evaluate(async ()=>{
   window.__loadingActions=0;const previous=interact;interact=()=>{__loadingActions++};window.__restoreInteract=()=>{interact=previous};
   const gateBefore=FinalAssetLoadingV1.snapshot();let draws=0;const draw=ctx.drawImage;ctx.drawImage=()=>{draws++};
   try{update(.2);drawEnv();loop(1000);loop(1040)}finally{ctx.drawImage=draw}
   return{draws,save:JSON.stringify(G),tick,art:ProtagonistArtV5.clock,music:MusicianArtV1.clock,fx:HeroAttackFX.clock,gateBefore,gateAfter:FinalAssetLoadingV1.snapshot(),loopSource:loop.toString()};
  });await page.keyboard.press('e');assert.equal(await page.evaluate(async ()=>__loadingActions),0);await page.evaluate(async ()=>__restoreInteract());
  assert.equal(r.draws,0);for(const k of Object.keys(before))assert.equal(r[k],before[k],k+' '+JSON.stringify({before:r.gateBefore,after:r.gateAfter,loop:r.loopSource}));return{draws:r.draws,gameplayActions:0,clocksUnchanged:true};
 });
 await check('Releasing decode resumes with final idle and cached scene does not reopen loading',async()=>{
  await page.evaluate(async ()=>__releaseFinalIdle());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());
  const r=await page.evaluate(async ()=>{
   __decodeImage.decode=__decodeOriginal;delete __decodeImage.complete;const generation=FinalAssetLoadingV1.snapshot().generation;
   drawEnv();setArea('studio',G.x,G.y,false);
   return{busy:FinalAssetLoadingV1.busy(),sameGeneration:generation===FinalAssetLoadingV1.snapshot().generation,area:G.area};
  });assert.equal(r.busy,false);assert(r.sameGeneration);return r;
 });
 await check('Final idle sheets survive action-cache churn for all three art families',async()=>{
  const r=await page.evaluate(async ()=>{
   const rows=[];
   for(const [art,hero,variant]of [[ProtagonistArtV5,'franco',null],[NinjaArcherArtV1,'alt',null],[MusicianArtV1,'synth','unmasked']]){
    const key=state=>art===MusicianArtV1?art.key(hero,variant,state):hero+'_'+state;
    const idle=art.image(key('idle'));
    for(const state of ['walk','run','roll','attack_1','attack_2','attack_3','skill','advanced','signature','hurt','defeat'])art.image(key(state));
    rows.push({hero,sameIdle:art.image(key('idle'))===idle,cache:art.recent.length});
   }return rows;
  });assert(r.every(x=>x.sameIdle&&x.cache<=8),JSON.stringify(r));return r;
 });
 await check('An asset failure remains visible and retry decodes the repaired resource',async()=>{
  await page.evaluate(async ()=>{
   window.__failedFinalImage=new Image();__failedFinalImage.src='data:image/png;base64,invalid';
   FinalAssetLoadingV1.start({force:true,extra:[{image:__failedFinalImage,label:'injected test asset'}]});
  });await page.waitForFunction(()=>!!FinalAssetLoadingV1.snapshot().error);
  const failed=await page.evaluate(async ()=>({loading:FinalAssetLoadingV1.busy(),failed:FinalAssetLoadingV1.snapshot().failed,visible:!document.getElementById('finalAssetLoadingV1').hidden,retry:!document.querySelector('#finalAssetLoadingV1 button').hidden}));
  assert(failed.loading&&failed.visible&&failed.retry);assert(failed.failed.includes('injected test asset'));
  await page.evaluate(async ()=>{__failedFinalImage.src=ProtagonistArtV5.assets.franco_idle});
  await page.locator('#finalAssetLoadingV1 button').click();await page.evaluate(async ()=>FinalAssetLoadingV1.ready());
  assert.equal(await page.evaluate(async ()=>FinalAssetLoadingV1.busy()),false);assert.equal(await page.evaluate(async ()=>FinalAssetLoadingV1.snapshot().error),null);return failed;
 });
 await check('Decoded final characters never invoke historical playable atlases',async()=>{
  const r=await page.evaluate(async ()=>{
   const old=new Set([actorAtlas,maskedActorAtlas,...Object.values(animate10),C3.images.actors,C3.images.prebeta_roll,C3.images.prebeta_run_v2].filter(Boolean));
   const native=ctx.drawImage;let finals=0;ctx.drawImage=function(image,...args){if(old.has(image))throw Error('Historical playable atlas rendered');finals++;return native.call(this,image,...args)};
   try{drawActor({style:'franco',dir:'down'},200,200,false);drawActor({style:'ryuchi',dir:'down'},260,200,false)}finally{ctx.drawImage=native}
   return{draws:finals};
  });assert(r.draws>=2);return r;
 });
 await check('Reading pauses its visible character count and retains automatic-advance remaining time',async()=>{
  await page.evaluate(async ()=>{
   window.__holdReading=()=>{window.__releaseReading=null;const im=new Image();im.src=ProtagonistArtV5.assets.franco_idle;let released=false;const native=im.decode.bind(im),complete=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'complete').get;
    Object.defineProperty(im,'complete',{get:()=>released&&complete.call(im)});im.decode=()=>new Promise((resolve,reject)=>{window.__releaseReading=()=>{released=true;return native().then(resolve,reject)}});
    return FinalAssetLoadingV1.start({force:true,extra:[{image:im,label:'reading pause'}]});
   };
   Narrativa.definir('auto',false);Narrativa.definir('vel','lento');talk([{who:'franco',t:'Uma frase suficientemente longa para medir a pausa sem terminar a digitação.'},{who:'ryuchi',t:'A fala seguinte permanece na fila.'}]);
  });await page.waitForTimeout(180);
  const before=await page.evaluate(async ()=>({visible:$('words').querySelector('span').textContent.length,queue:JSON.stringify(dialogueQueue),options:Narrativa.opcoes()}));
  await page.evaluate(async ()=>{__holdReading()});await page.waitForFunction(()=>typeof __releaseReading==='function');await page.waitForTimeout(300);
  await page.evaluate(async ()=>{
   window.__controlledGatePad={id:'Torii loader reading test',index:7,connected:true,buttons:Array.from({length:16},()=>({pressed:false})),axes:[0,0,0,0]};
   for(const button of [3,2,8]){__controlledGatePad.buttons[button].pressed=true;Narrativa.ciclo()}
  });
  assert.equal(await page.evaluate(async ()=>Narrativa.historicoAberto()),false);assert.deepEqual(await page.evaluate(async ()=>Narrativa.opcoes()),before.options);
  assert.equal(await page.evaluate(async ()=>$('words').querySelector('span').textContent.length),before.visible);
  assert.equal(await page.evaluate(async ()=>JSON.stringify(dialogueQueue)),before.queue);
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());await page.evaluate(async ()=>Narrativa.ciclo());await page.waitForTimeout(150);
  assert.equal(await page.evaluate(async ()=>Narrativa.historicoAberto()),false);assert.deepEqual(await page.evaluate(async ()=>Narrativa.opcoes()),before.options);await page.evaluate(async ()=>{__controlledGatePad=null});
  assert((await page.evaluate(async ()=>$('words').querySelector('span').textContent.length))>before.visible);
  assert.deepEqual(await page.evaluate(async ()=>Narrativa.opcoes()),before.options);
  await page.evaluate(async ()=>{Narrativa.pularCena();Narrativa.definir('vel','instantaneo');Narrativa.definir('auto',true);talk([{who:'franco',t:'A.'},{who:'ryuchi',t:'B.'}])});
  await page.waitForTimeout(350);await page.evaluate(async ()=>{__holdReading()});await page.waitForTimeout(1300);
  assert.equal(await page.evaluate(async ()=>$('words').textContent),'A.');
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());await page.waitForTimeout(150);
  assert.equal(await page.evaluate(async ()=>$('words').textContent),'A.','must preserve the remaining auto delay');
  await page.waitForFunction(()=>$('words').textContent==='B.',null,{timeout:1600,polling:30});
  await page.evaluate(async ()=>{Narrativa.definir('auto',false);Narrativa.pularCena()});return{typingPaused:true,queuePreserved:true,preferencesPreserved:true,remainingAutomaticDelayPreserved:true};
 });
 await check('Three advanced percussion releases preserve order, positions and remaining delays across loading',async()=>{
  await page.evaluate(require('./hero_attack_fixture.cjs'));
  const r=await page.evaluate(async()=>{
   const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),saved={game:G,current,forest:areas.forest,mode,tick},nativePulse=C3.percussionPulse;
   const run=async pause=>{
    await heroAttackArena('percussion');areas.forest=current;await FinalAssetLoadingV1.start();
    const events=[];let ticker=null,pauseDuration=0,remainingBefore=null,remainingDuring=null,resumedAt=null;
    C3.percussionPulse=function(...args){events.push({at:performance.now(),x:G.x,y:G.y,args});return nativePulse.apply(this,args)};
    const waitCount=count=>new Promise((resolve,reject)=>{const limit=setTimeout(()=>{clearInterval(timer);reject(Error('Missing percussion release '+count))},2500),timer=setInterval(()=>{if(events.length>=count){clearInterval(timer);clearTimeout(limit);resolve()}},5)});
    try{
     loop.prev=performance.now();ticker=setInterval(()=>loop(performance.now()),16);
     const started=performance.now();advancedSkill();await sleep(25);G.x+=1;
     if(pause){
      __holdReading();const pausedAt=performance.now();remainingBefore=C3.percussionMotion.until-tick;
      await sleep(420);remainingDuring=C3.percussionMotion.until-tick;
      if(events.length!==1)throw Error('Combat timer ran under loading');
      __releaseReading();await FinalAssetLoadingV1.ready();resumedAt=performance.now();pauseDuration=resumedAt-pausedAt;
     }
     await waitCount(2);G.x+=1;await waitCount(3);
     return{events:events.map((event,index)=>({...event,at:event.at-started-(pause&&index>0?pauseDuration:0)})),remainingBefore,remainingDuring,secondAfterResume:pause?events[1].at-resumedAt:null};
    }finally{clearInterval(ticker);C3.percussionPulse=nativePulse}
   };
   try{return{baseline:await run(false),paused:await run(true)}}finally{areas.forest=saved.forest;G=saved.game;current=saved.current;mode=saved.mode;tick=saved.tick;await FinalAssetLoadingV1.start()}
  });
  assert.equal(r.baseline.events.length,3);assert.equal(r.paused.events.length,3);
  for(let i=0;i<3;i++){assert.deepEqual(r.paused.events[i].args,r.baseline.events[i].args);assert.equal(r.paused.events[i].x,r.baseline.events[i].x);assert.equal(r.paused.events[i].y,r.baseline.events[i].y);assert(Math.abs(r.paused.events[i].at-r.baseline.events[i].at)<85,JSON.stringify(r))}
  assert(Math.abs(r.paused.remainingBefore-r.paused.remainingDuring)<.000001);assert(r.paused.secondAfterResume>70&&r.paused.secondAfterResume<240,JSON.stringify(r));return r;
 });
 await check('Combat barks retain appearance, duration, fade and queued conversation order under loading',async()=>{
  await page.evaluate(async()=>{
   window.__barkFormation=G.formation;G.formation=['franco','alt'];mode='walk';Narrativa.definir('barks',true);
   await FinalAssetLoadingV1.start();Narrativa.ciclo();
   Narrativa.abrirHistorico();document.querySelector('[data-leitura="barks"]').click();Narrativa.definir('barks',true);Narrativa.fecharHistorico();
  });
  const before=await page.evaluate(async ()=>{
   Narrativa.forcar('conversa:andando');Narrativa.ciclo();
   const active=[...document.querySelectorAll('#barksCamada .bark')].at(-1);window.__pausedBark=active;
   const line=active?.querySelector('span')?.textContent;window.__expectedBarkReply=Narrativa.dados.conversas.find(c=>c.falas[0][1]===line)?.falas[1][1];
   const state=Narrativa.barks();__holdReading();return{state,text:active?.textContent,visible:active?.classList.contains('visivel'),reply:__expectedBarkReply};
  });
  assert(before.text&&before.reply);assert.equal(before.state.pendentes,1);assert.equal(before.visible,false);
  await page.waitForTimeout(100);assert.equal(await page.evaluate(async ()=>__pausedBark.classList.contains('visivel')),false,'appearance delay must pause');
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());
  await page.waitForFunction(()=>__pausedBark.classList.contains('visivel'),null,{polling:10});
  await page.waitForTimeout(80);await page.evaluate(async ()=>{__holdReading()});await page.waitForTimeout(5055);
  const held=await page.evaluate(async ()=>{Narrativa.ciclo();Narrativa.despachar();return{state:Narrativa.barks(),visible:__pausedBark.classList.contains('visivel'),connected:__pausedBark.isConnected,text:__pausedBark.textContent}});
  assert(held.visible&&held.connected);assert.equal(held.text,before.text);assert.deepEqual(held.state,before.state,'busy evaluation/dispatch must retain the conversation queue');
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());await page.waitForTimeout(200);
  assert.equal(await page.evaluate(async ()=>Narrativa.barks().pendentes),before.state.pendentes,'queued delay must retain its remaining time');
  await page.waitForFunction(()=>Narrativa.barks().pendentes<1,null,{timeout:6000,polling:10});
  assert.equal(await page.evaluate(async ()=>Narrativa.barks().contagem),before.state.contagem+1,'second conversation line must be delivered once');
  assert(await page.evaluate(async ()=>Narrativa.barks().ativos.some(a=>a.texto.includes(__expectedBarkReply))),'conversation reply order must be preserved');
  await page.waitForFunction(()=>!__pausedBark.classList.contains('visivel'),null,{timeout:5000,polling:10});
  await page.evaluate(async ()=>{__holdReading()});await page.waitForTimeout(400);assert(await page.evaluate(async ()=>__pausedBark.isConnected),'fade must pause before removing its balloon');
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());
  await page.waitForFunction(()=>!__pausedBark.isConnected,null,{timeout:700,polling:10});
  await page.evaluate(async()=>{G.formation=__barkFormation;await FinalAssetLoadingV1.start()});return{appearancePaused:true,displayPaused:true,fadePaused:true,pendingOrderPreserved:true,noDispatchDuring5055msGate:true};
 });
 await check('Caption display and fade retain their remaining times under loading',async()=>{
  await page.evaluate(async ()=>talk([{who:'narrator',t:'A.',cena:true},{who:'franco',t:'A legenda deve permanecer visível.'}]));await page.waitForTimeout(100);
  await page.evaluate(async ()=>{__holdReading()});await page.waitForTimeout(2600);
  assert(await page.evaluate(async ()=>Narrativa.legendaAtiva()&&document.getElementById('cenaLegenda').classList.contains('visivel')));
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());await page.waitForTimeout(150);
  assert(await page.evaluate(async ()=>document.getElementById('cenaLegenda').classList.contains('visivel')));
  await page.waitForFunction(()=>!document.getElementById('cenaLegenda').classList.contains('visivel'),null,{timeout:2800,polling:10});
  await page.evaluate(async ()=>{__holdReading()});await page.waitForTimeout(700);assert(await page.evaluate(async ()=>Narrativa.legendaAtiva()));
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());await page.waitForTimeout(100);assert(await page.evaluate(async ()=>Narrativa.legendaAtiva()));
  await page.waitForFunction(()=>!Narrativa.legendaAtiva(),null,{timeout:800,polling:10});await page.evaluate(async ()=>Narrativa.pularCena());return{displayPaused:true,fadePaused:true};
 });
 await check('Keyboard retry owns Enter and Tab above an already open pause menu',async()=>{
  await page.evaluate(async ()=>{openSystem();window.__retryAbovePause=new Image();__retryAbovePause.src='data:image/png;base64,invalid';FinalAssetLoadingV1.start({force:true,extra:[{image:__retryAbovePause,label:'keyboard retry'}]})});
  await page.waitForFunction(()=>!!FinalAssetLoadingV1.snapshot().error,null,{polling:10});
  await page.keyboard.press('Tab');assert(await page.evaluate(async ()=>!!document.activeElement?.closest('#finalAssetLoadingV1')));
  await page.keyboard.press('e');assert(await page.evaluate(async ()=>FinalAssetLoadingV1.busy()));
  await page.evaluate(async ()=>{__retryAbovePause.src=ProtagonistArtV5.assets.franco_idle});await page.keyboard.press('Enter');await page.evaluate(async ()=>FinalAssetLoadingV1.ready());
  const state=await page.evaluate(async ()=>({busy:FinalAssetLoadingV1.busy(),mode,paused:!!document.getElementById('resume10')}));assert.deepEqual(state,{busy:false,mode:'overlay',paused:true});await page.evaluate(async ()=>closeOverlay());return state;
 });
 await check('Chapter-two transition countdown retains its full remaining second across loading',async()=>{
  await page.evaluate(async ()=>{voiceEnding();__holdReading()});await page.waitForTimeout(2250);
  assert.equal(await page.locator('#c3Countdown').textContent(),'5');
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());await page.waitForTimeout(150);assert.equal(await page.locator('#c3Countdown').textContent(),'5');
  await page.waitForFunction(()=>document.getElementById('c3Countdown').textContent==='4',null,{timeout:1400,polling:20});
  await page.evaluate(async ()=>{const was=G.c3.started;G.c3.started=true;ToriiFluxo.goToChapter3();G.c3.started=was;closeOverlay()});return{pausedCount:5,resumedCount:4};
 });
 await check('A failed run-sheet record retries without resetting spatial animation state',async()=>{
  const r=await page.evaluate(async()=>{
   const meta=RunStrideV1.manifest.heroes.katana,cell=meta.cell;
   let failed,accepted;
   try{meta.cell=cell+1;failed=RunStrideV1.image('katana');accepted=await failed.ready}finally{meta.cell=cell}
   const before=JSON.stringify(RunStrideV1.snapshot()),replacement=RunStrideV1.retry('katana'),ready=await replacement.ready;
   return{failed:!accepted&&failed.failed,replaced:replacement!==failed,ready:!!ready&&!!replacement.bitmap,sameState:JSON.stringify(RunStrideV1.snapshot())===before};
  });assert.deepEqual(r,{failed:true,replaced:true,ready:true,sameState:true});return r;
 });
 await check('Replacing G during a caption, bark and gate clears old UI without resetting new-game reading',async()=>{
  await page.evaluate(async ()=>{
   mode='walk';Narrativa.definir('barks',true);Narrativa.forcar('andando','franco');Narrativa.despachar();
   talk([{who:'narrator',t:'Legenda do jogo anterior.',cena:true},{who:'franco',t:'Fala do jogo anterior.'},{who:'ryuchi',t:'Fila antiga.'}]);__holdReading();
  });await page.waitForFunction(()=>typeof __releaseReading==='function',null,{polling:10});
  const old=await page.evaluate(async ()=>({caption:Narrativa.legendaAtiva(),barks:Narrativa.barks().ativos.length,busy:FinalAssetLoadingV1.busy()}));assert(old.caption&&old.barks>0&&old.busy);
  await page.evaluate(async()=>{
   window.__releaseOldGame=__releaseReading;G=fresh();buildMaps();setArea('studio',12.5,10.5,false);await FinalAssetLoadingV1.ready();
  });
  const cleared=await page.evaluate(async ()=>({caption:Narrativa.legendaAtiva(),barks:Narrativa.barks().ativos.length,pending:Narrativa.barks().pendentes,queue:dialogueQueue.length,hidden:$('dialogue').classList.contains('hidden')}));
  assert.deepEqual(cleared,{caption:false,barks:0,pending:0,queue:0,hidden:true});await page.evaluate(async ()=>__releaseOldGame());await page.waitForTimeout(350);
  assert.equal(await page.evaluate(async ()=>Narrativa.legendaAtiva()),false);
  await page.evaluate(async ()=>{talk([{who:'narrator',t:'Legenda do novo jogo.',cena:true},{who:'franco',t:'Fala nova.'}]);__holdReading()});
  await page.waitForFunction(()=>typeof __releaseReading==='function',null,{polling:10});await page.waitForTimeout(100);
  assert(await page.evaluate(async ()=>Narrativa.legendaAtiva()&&$('words').textContent==='Fala nova.'));
  await page.evaluate(async ()=>__releaseReading());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());assert(await page.evaluate(async ()=>Narrativa.legendaAtiva()&&$('words').textContent==='Fala nova.'));
  await page.evaluate(async ()=>Narrativa.pularCena());return{oldGameUiCleared:true,oldGateCannotRestoreUi:true,sameGameReadingPreserved:true};
 });
 await check('Cold last-torii reserves are final-ready before drawing a party of Franco, Ryuchi and Arqueiro',async()=>{
  const initial=await page.evaluate(async ()=>{
   G=fresh();Object.assign(G.flags,{reveal:true,voicesKatana:true,masks:true});Object.assign(G.c3,{started:true,complete:true,toriiSeen:true});G.formation=['franco','ryuchi','alt'];G.active='franco';buildMaps();
   const image=NinjaArcherArtV1.image('katana_idle'),decode=image.decode.bind(image),complete=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'complete').get;
   window.__reserveImage=image;window.__reserveDecode=decode;window.__reserveReleased=false;
   Object.defineProperty(image,'complete',{configurable:true,get:()=>__reserveReleased&&complete.call(image)});
   image.decode=()=>new Promise((resolve,reject)=>{window.__releaseReserve=()=>{__reserveReleased=true;return decode().then(resolve,reject)}});
   mode='walk';setArea('last_torii',13.5,13.5,false);return{busy:FinalAssetLoadingV1.busy(),resources:FinalAssetLoadingV1.snapshot().resources,reserve:current.npcs.find(n=>n.postHero==='katana')?.id};
  });assert(initial.reserve);assert(initial.busy);assert(initial.resources.includes('katana:idle'));
  await page.waitForFunction(()=>typeof __releaseReserve==='function',null,{polling:10});await page.evaluate(async ()=>__releaseReserve());await page.evaluate(async ()=>FinalAssetLoadingV1.ready());
  const drawn=await page.evaluate(async ()=>{
   __reserveImage.decode=__reserveDecode;delete __reserveImage.complete;const before=FinalAssetLoadingV1.snapshot().generation;drawEnv();
   return{busy:FinalAssetLoadingV1.busy(),sameGeneration:before===FinalAssetLoadingV1.snapshot().generation,decoded:__reserveImage.complete&&__reserveImage.naturalWidth>0};
  });assert(drawn.decoded&&drawn.sameGeneration&&!drawn.busy);return{reserve:initial.reserve,...drawn};
 });
 await check('Normal new-game opening reaches the approved studio on desktop and touch mobile',async()=>{
  const rows=[];
  for(const mobile of [false,true]){
   const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
   const opening=await context.newPage();opening.on('pageerror',e=>report.errors.push((mobile?'mobile':'desktop')+': '+e.message));
   await opening.addInitScript(()=>{localStorage.clear();sessionStorage.clear();Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
   await opening.goto(input,{waitUntil:'load',timeout:180000});
   if(mobile)await opening.locator('#startNew').tap();else await opening.locator('#startNew').click();
   if(mobile)await opening.locator('#dif_normal').tap();else await opening.locator('#dif_normal').click();
   await opening.waitForFunction(()=>!!G&&G.area==='studio',null,{timeout:30000});
   await opening.evaluate(async ()=>FinalAssetLoadingV1.ready());
   const state=await opening.evaluate(async ()=>({area:G.area,difficulty:G.difficulty,mode,busy:FinalAssetLoadingV1.busy(),error:FinalAssetLoadingV1.snapshot().error,words:$('words').textContent,franco:ProtagonistArtV5.image('franco_idle').complete&&ProtagonistArtV5.image('franco_idle').naturalWidth>0,ryuchi:ProtagonistArtV5.image('ryuchi_idle').complete&&ProtagonistArtV5.image('ryuchi_idle').naturalWidth>0,overflow:document.documentElement.scrollWidth>innerWidth,source:window.TORII_PLAYTEST_BUILD?.sourceSha256||null}));
   assert.equal(state.area,'studio');assert.equal(state.difficulty,'normal');assert.equal(state.busy,false);assert.equal(state.error,null);assert(state.franco&&state.ryuchi);assert(state.words.length>0);assert.equal(state.overflow,false);
   if(process.env.EXPECTED_SOURCE_SHA)assert.equal(state.source,process.env.EXPECTED_SOURCE_SHA);
   const directory=outputDirectory;fs.mkdirSync(directory,{recursive:true});await opening.screenshot({path:path.join(directory,mobile?'opening-mobile.png':'opening-desktop.png')});
   rows.push({mobile,...state});await context.close();
  }
  return rows;
 });
 assert.deepEqual(report.errors,[]);console.log('PASS · '+report.checks.length);
})().catch(error=>{report.failure=error.stack;console.error(error);process.exitCode=1}).finally(async()=>{
 const out=outputDirectory;fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'BROWSER.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();
});
