'use strict';
// Real event listeners, navigation, save lifecycle and Canvas commands. No
// production code is injected. Standard snapshots freeze RAF; cold startup
// observes the native loop without moving or teleporting the character.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const engines=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const url=process.argv[2],engine=process.env.BROWSER_ENGINE||'chromium',expectLeak=process.env.GUIDANCE_EXPECT_LEAK==='1',coldOnly=process.env.GUIDANCE_COLD_ONLY==='1';
if(!/^https?:/.test(url||''))throw Error('Pass an HTTP export URL');
if(!['chromium','webkit'].includes(engine))throw Error('BROWSER_ENGINE must be chromium or webkit');
const deviceScaleFactor=Number(process.env.GUIDANCE_DPR||1);
if(!Number.isFinite(deviceScaleFactor)||deviceScaleFactor<1||deviceScaleFactor>3)throw Error('GUIDANCE_DPR must be between1 and3');
const out=path.resolve(process.env.GUIDANCE_OUT||path.join(__dirname,'performance-v1','guidance-'+engine+'.json'));
const report={url,engine,expectLeak,deviceScaleFactor,method:'Installed browser event listeners and actual Canvas route/marker commands. Synthetic cancellable modified-key events exercise DOM handlers without invoking host OS shortcuts. Plain H also uses browser keyboard. No renderer replacement or production injection. Controlled browser execution, not physical MacBook/Safari certification.',checks:[],errors:[]};
let browser,page,host;
async function check(name,fn){try{const details=await fn();report.checks.push({name,passed:true,details});console.log('PASS '+name)}catch(e){report.checks.push({name,passed:false,failure:e.stack});console.error('FAIL '+name+' '+e.stack)}}
async function gameSurface(top){
 if(await top.locator('[data-open-game]').count()){
  const skip=top.locator('[data-skip]');if(await skip.isVisible())await skip.click();
  await top.locator('[data-open-game]').click();const element=await top.locator('[data-game-frame]').elementHandle(),frame=await element.contentFrame();
  if(!frame)throw Error('The real game iframe was not attached');
  await frame.waitForFunction(()=>!!window.ToriiInterface6&&typeof drawRoute==='function',null,{timeout:120000});return frame;
 }
 await top.waitForFunction(()=>!!window.ToriiInterface6&&typeof drawRoute==='function',null,{timeout:60000});return top;
}
function diagnostics(top,label){
 top.on('pageerror',e=>report.errors.push(label+': '+e.message));
 top.on('console',m=>{if(['error','warning'].includes(m.type()))(report.console||(report.console=[])).push({label,type:m.type(),text:m.text().slice(0,700),location:m.location()})});
 top.on('response',r=>{if(r.status()>=400)(report.httpErrors||(report.httpErrors=[])).push({label,url:r.url(),status:r.status()})});
 top.on('requestfailed',r=>(report.requestFailures||(report.requestFailures=[])).push({label,url:r.url(),error:r.failure()?.errorText}));
}
async function storageAndPermissions(surface){return surface.evaluate(async()=>{
 const probe=name=>{const key='__guidance_runtime_qa_'+Date.now();try{const s=window[name];s.setItem(key,'qa');const ok=s.getItem(key)==='qa';s.removeItem(key);return{available:ok}}catch(e){return{available:false,error:e.name+': '+e.message}}};
 let storageAccess=null;try{if(document.hasStorageAccess)storageAccess=await document.hasStorageAccess()}catch(e){storageAccess=e.name+': '+e.message}
 let gamepads;try{gamepads={available:true,count:[...navigator.getGamepads()].filter(Boolean).length}}catch(e){gamepads={available:false,error:e.name+': '+e.message}}
 const policy=document.permissionsPolicy||document.featurePolicy;
 return{origin:location.origin,embedded:self!==top,localStorage:probe('localStorage'),sessionStorage:probe('sessionStorage'),hasStorageAccess:storageAccess,gamepads,gamepadPolicy:policy?.allowsFeature?.('gamepad')??null,fullscreenEnabled:document.fullscreenEnabled,secureContext:isSecureContext,devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},canvas:typeof ctx!=='undefined'?{width:ctx.canvas.width,height:ctx.canvas.height}:null};
 })}
function fixture(){
 let scope=null,calls=null,tracing=false,frames=[];
 let monitor={loops:0,nativeRAF:0,longGaps:0,maxGap:0,lastLoop:null,lastRAF:null,error:null};
 if(typeof loop==='function'){
  const original=loop,observed=function(time){
   if(tracing){const gap=monitor.lastLoop===null?0:time-monitor.lastLoop;monitor.loops++;monitor.lastLoop=time;monitor.maxGap=Math.max(monitor.maxGap,gap);if(gap>=50)monitor.longGaps++}
   try{return original(time)}catch(e){if(tracing)monitor.error={name:e.name,message:e.message,stack:e.stack};throw e}
  };observed.prev=original.prev;loop=observed;
 }
 function rafObserver(time){if(tracing){monitor.nativeRAF++;monitor.lastRAF=time}requestAnimationFrame(rafObserver)}requestAnimationFrame(rafObserver);
 const blank=()=>({routeInvocations:0,markerInvocations:0,route:{commands:0,rects:0,labels:[],alpha:null},marker:{commands:0,rects:0,labels:[],alpha:null}});
 const shown=id=>{const e=$(id),s=e&&getComputedStyle(e);return !!e&&!e.hidden&&!e.classList.contains('hidden')&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0};
 const state=()=>({area:G?.area,x:G?.x,y:G?.y,guidance:G?.guidance,mode,cinema:shown('cinema'),dialogue:shown('dialogue'),loading:shown('finalAssetLoadingV1'),words:$('words')?.textContent,gate:window.FinalAssetLoadingV1?.snapshot()||null});
 const route=drawRoute,marker=drawGuideMarker;
 drawRoute=function(...args){const old=scope;scope='route';if(calls)calls.routeInvocations++;try{return route.apply(this,args)}finally{scope=old}};
 drawGuideMarker=function(...args){const old=scope;scope='marker';if(calls)calls.markerInvocations++;try{return marker.apply(this,args)}finally{scope=old}};
 for(const name of ['fillRect','strokeRect','fillText','fill','stroke']){const original=ctx[name];ctx[name]=function(...args){if(calls&&scope){calls[scope].commands++;calls[scope].alpha=ctx.globalAlpha;if(name==='fillRect')calls[scope].rects++;if(name==='fillText')calls[scope].labels.push(String(args[0]));}return original.apply(this,args)}}
 const environment=drawEnv;
 drawEnv=function(...args){
  if(!tracing||calls||!G)return environment.apply(this,args);
  calls=blank();try{return environment.apply(this,args)}finally{
   const frame={...state(),...calls,routeSteps:routeCache.steps?.length||0,time:performance.now()};
   // Keep native frames from the beginning, including the first ready walk.
   if(frames.length<600||frames.at(-1)?.mode!==frame.mode||frames.at(-1)?.gate?.loading!==frame.gate?.loading)frames.push(frame);calls=null;
  }
 };
 async function ready(){
  if(window.FinalAssetLoadingV1)await FinalAssetLoadingV1.ready();
  else {await CenariosV2.ready();await EnvironmentDepthV1.ready();await WorldPolishV1.ready();for(const id of partyMembers()){const art=ProtagonistArtV5.supports(id)?ProtagonistArtV5:NinjaArcherArtV1.supports(id)?NinjaArcherArtV1:MusicianArtV1;const key=art===MusicianArtV1?art.key(id,art.variant(id),'idle'):id+'_idle';await art.image(key).decode()}}
 }
 async function settle(){await ready();for(let i=0;i<12&&mode==='dialogue';i++){Narrativa.pularCena();await ready()}$('cinema').style.display='none';transitionAlpha=0;screenShake=0;return{mode,area:G?.area,guidance:G?.guidance}}
 function position(){
  const target=navigationTarget();if(target.area!==G.area)throw Error('Fixture target not in current area: '+JSON.stringify(target));
  let best=null;
  for(let y=2;y<current.h-2;y++)for(let x=2;x<current.w-2;x++){
   if(!canBody121(x+.5,y+.5))continue;G.x=x+.5;G.y=y+.5;routeCache.key='';
   const n=getRoute().length;if(n>=9&&n<=20){best={x:G.x,y:G.y,n};break}
  }
  if(!best)throw Error('No reachable real guidance route in '+G.area);
  G.x=best.x;G.y=best.y;trail=[];mode='walk';menuPage10=menuOrigin10=null;resetMotion10();releaseAll121();
  cam.x=current.w*T<VW?(current.w*T-VW)/2:ClubStage.cameraX(CanalViolin.cameraX(clamp(G.x*T-VW/2,0,current.w*T-VW)));
  cam.y=current.h*T<VH?(current.h*T-VH)/2:ClubStage.cameraY(clamp(G.y*T-VH/2,0,current.h*T-VH));
  routeCache.key='';updateHUD();return{...best,target:navigationTarget()};
 }
 async function probe(){await ready();calls={routeInvocations:0,markerInvocations:0,route:{commands:0,rects:0,labels:[]},marker:{commands:0,rects:0,labels:[]}};const state={area:G.area,x:G.x,y:G.y,guidance:G.guidance};drawEnv();const result={...calls,routeSteps:getRoute().length,target:navigationTarget().name,state,after:{area:G.area,x:G.x,y:G.y,guidance:G.guidance},canvas:{width:ctx.canvas.width,height:ctx.canvas.height},mode,gate:window.FinalAssetLoadingV1?.snapshot()||null};calls=null;return result}
 async function modified(modifier,remapped=false){
  releaseAll121();G.guidance=true;const before={guidance:G.guidance,cool:act.cool,mode};
  const flags={metaKey:false,ctrlKey:false,altKey:false,[modifier]:true};
  const down=new KeyboardEvent('keydown',{key:'h',code:'KeyH',bubbles:true,cancelable:true,...flags});document.body.dispatchEvent(down);
  const afterDown={guidance:G.guidance,cool:act.cool,mode,keys:{h:keys.h,j:keys.j}};
  const up=new KeyboardEvent('keyup',{key:'h',code:'KeyH',bubbles:true,cancelable:true,...flags});document.body.dispatchEvent(up);
  const result={modifier,remapped,before,afterDown,after:{guidance:G.guidance,cool:act.cool,mode,keys:{h:keys.h,j:keys.j}},defaultPrevented:{keydown:down.defaultPrevented,keyup:up.defaultPrevented}};
  result.draw=await probe();releaseAll121();G.guidance=true;return result;
 }
 window.GuidanceRuntimeQA={ready,settle,position,probe,modified,startTrace(){tracing=true;frames=[];monitor={loops:0,nativeRAF:0,longGaps:0,maxGap:0,lastLoop:null,lastRAF:null,error:null}},trace(){return{state:state(),frames:frames.slice(),monitor:{...monitor}}},stopTrace(){tracing=false;return{state:state(),frames:frames.slice(),monitor:{...monitor}}}};
}
function visible(result,on=true){
 assert.deepEqual(result.after,result.state,'Drawing changed navigation state');
 assert.equal(result.gate?.loading||false,false,'Scene was not ready');
 assert(result.routeInvocations>0&&result.markerInvocations>0,'Guidance renderer was not reached');
 if(on){assert(result.routeSteps>=9,'Expected a real reachable route');assert(result.route.rects>0,'Ground trail issued no actual Canvas rectangles');assert(result.marker.commands>0&&result.marker.labels.includes(result.target),'Target mark/name issued no actual Canvas commands')}
 else {assert.equal(result.routeSteps,0);assert.equal(result.route.commands,0);assert.equal(result.marker.commands,0)}
 return result;
}
async function coldOpening(profile){
 const asset=await page.evaluate(()=>ProtagonistArtV5.assets.franco_idle);
 const gameURL=page.url();
 const data=/^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(asset);
 const replacement=new URL('__guidance_cold_franco_idle__',gameURL).href;
 const heldURL=data?replacement:new URL(asset,gameURL).href;
 let release,requested,closed=false,rewriteCount=0,environment=null;
 const hold=new Promise(r=>{release=r}),requestedPromise=new Promise(r=>{requested=r});
 const network=[],context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor,serviceWorkers:'block'});
 const coldHost=await context.newPage();let cold;diagnostics(coldHost,'cold '+profile);
 // A fresh context has no browser/storage cache; installing routing also
 // disables HTTP caching. Only the original image bytes are delayed. For an
 // embedded data URI, replace its asset URL in the HTML response and serve
 // those exact bytes at the controlled URL, without changing runtime code.
 await context.route('**/*',async route=>{
  const request=route.request(),address=request.url();
  try{
   if(data&&profile==='slow-image'&&request.isNavigationRequest()&&address===gameURL){
    const response=await route.fetch(),body=await response.text();rewriteCount=body.split(asset).length-1;
    if(!rewriteCount)throw Error('Embedded asset token not present in served HTML');
    const headers={...response.headers(),'cache-control':'no-store'};delete headers['content-length'];
    return route.fulfill({response,headers,body:body.split(asset).join(replacement)});
   }
   if(profile==='slow-image'&&address===heldURL){
    network.push({event:'image-held',url:address,time:Date.now()});requested();await hold;
    network.push({event:'image-released',time:Date.now()});
    if(data)return route.fulfill({status:200,contentType:data[1],headers:{'cache-control':'no-store'},body:data[2]?Buffer.from(data[3],'base64'):Buffer.from(decodeURIComponent(data[3]))});
    const response=await route.fetch();return route.fulfill({response,headers:{...response.headers(),'cache-control':'no-store'}});
   }
   if(profile==='slow-image'&&request.resourceType()==='image')await new Promise(r=>setTimeout(r,35));
   return route.continue();
  }catch(error){if(!closed){report.errors.push('cold request: '+error.message);await route.abort('failed').catch(()=>{})}}
 });
 const shot=async stage=>{if(process.env.GUIDANCE_COLD_SHOTS!=='1')return null;const file=out.replace(/\.json$/,'')+'-'+profile+'-'+stage+'.jpg';fs.mkdirSync(path.dirname(file),{recursive:true});await coldHost.screenshot({path:file,type:'jpeg',quality:72});return file};
 const fixed=s=>{assert.equal(s.area,'studio');assert.equal(s.x,12.5);assert.equal(s.y,10.5);assert.equal(s.guidance,true)};
 const painted=frame=>{fixed(frame);assert(frame.route.commands>0&&frame.route.rects>0,'Native opening frame omitted the ground trail');assert(frame.marker.commands>0&&frame.marker.labels.includes('Mesa de produção'),'Native opening frame omitted the target mark');assert(frame.route.alpha>0&&frame.marker.alpha>0,'Guidance commands were transparent')};
 try{
  // Retain native RAF and gamepad APIs here: this is the real first startup,
  // including cross-origin iframe permissions and Safari storage restrictions.
  console.log('COLD OPEN '+profile);await coldHost.goto(url,{waitUntil:'domcontentloaded',timeout:180000});cold=await gameSurface(coldHost);console.log('COLD FRAME READY '+profile+' '+cold.url());
  environment={topURL:coldHost.url(),frameURL:cold.url(),build:await cold.evaluate(()=>window.TORII_PLAYTEST_BUILD||null),storage:await storageAndPermissions(cold)};
  await cold.evaluate(fixture);await cold.evaluate(()=>GuidanceRuntimeQA.startTrace());
  await cold.locator('#startNew').click();await cold.locator('#dif_normal').click();await cold.waitForFunction(()=>!!G);
  const phases=[];
  if(profile==='slow-image'){
   let timer;await Promise.race([requestedPromise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Cold image was not requested')),15000)})]).finally(()=>clearTimeout(timer));
   await coldHost.waitForTimeout(350);
   const pending=await cold.evaluate(()=>GuidanceRuntimeQA.trace());fixed(pending.state);
   if(pending.state.gate){assert.equal(pending.state.gate.loading,true);assert(pending.monitor.loops>0&&pending.monitor.nativeRAF>0,'The loading gate stopped the native loop');assert.equal(pending.monitor.error,null);assert(pending.frames.every(f=>f.route.commands===0&&f.marker.commands===0),'Gate presented a partially loaded native frame')}
   phases.push({stage:'image-pending',...pending,screenshot:await shot('pending')});release();
  }else release();
  await cold.waitForFunction(()=>!!G&&(!window.FinalAssetLoadingV1||!FinalAssetLoadingV1.busy()),null,{timeout:60000});
  if(await cold.evaluate(()=>!!window.FinalAssetLoadingV1))await cold.evaluate(()=>FinalAssetLoadingV1.ready());
  await cold.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const dialogue=await cold.evaluate(()=>GuidanceRuntimeQA.trace());fixed(dialogue.state);assert.equal(dialogue.state.mode,'dialogue');
  const firstReady=dialogue.frames.find(f=>!f.gate?.loading&&f.route.commands>0);assert(firstReady,'No native ready frame during the opening dialogue');painted(firstReady);
  phases.push({stage:'opening-dialogue',state:dialogue.state,firstReady,monitor:dialogue.monitor,screenshot:await shot('dialogue')});
  const lines=[];
  for(let i=0;i<20&&await cold.evaluate(()=>mode==='dialogue');i++){
   lines.push(await cold.evaluate(()=>({words:$('words').textContent,queue:dialogueQueue.length,mode,x:G.x,y:G.y})));
   await coldHost.keyboard.press('Enter');await coldHost.waitForTimeout(70);
  }
  await cold.waitForFunction(()=>mode==='walk',null,{timeout:15000});
  await cold.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const final=await cold.evaluate(()=>GuidanceRuntimeQA.stopTrace()),firstWalk=final.frames.find(f=>f.mode==='walk'&&!f.gate?.loading);
  assert(firstWalk,'No first native walk frame recorded');painted(firstWalk);fixed(final.state);assert.equal(final.state.mode,'walk');assert.equal(final.state.cinema,false);assert.equal(final.state.dialogue,false);assert.equal(final.state.loading,false);
  const walks=final.frames.filter(f=>f.mode==='walk'&&!f.gate?.loading);for(const frame of walks)painted(frame);
  phases.push({stage:'first-walk',state:final.state,firstWalk,nativeWalkFrames:walks.length,monitor:final.monitor,screenshot:await shot('walk')});
  assert.equal(final.monitor.error,null,'Native game loop threw an error');assert(final.monitor.loops>0&&final.monitor.nativeRAF>0,'Native RAF/game loop did not run');
  // Reproduce the reported recovery path through the actual in-game menu,
  // retaining the untouched spawn and this context's own disposable save.
  await coldHost.keyboard.press('Escape');await cold.locator('#ui7PauseTitle').click();
  assert.equal(await cold.evaluate(()=>mode),'title');await cold.evaluate(()=>GuidanceRuntimeQA.startTrace());
  await cold.locator('#startContinue').click();await cold.waitForFunction(()=>mode==='walk'&&(!window.FinalAssetLoadingV1||!FinalAssetLoadingV1.busy()),null,{timeout:60000});
  await cold.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const continued=await cold.evaluate(()=>GuidanceRuntimeQA.stopTrace()),continuedWalk=continued.frames.find(f=>f.mode==='walk'&&!f.gate?.loading);
  assert(continuedWalk,'No native walk after title/Continue');painted(continuedWalk);fixed(continued.state);assert.equal(continued.monitor.error,null);
  phases.push({stage:'title-continue',state:continued.state,firstWalk:continuedWalk,monitor:continued.monitor,screenshot:await shot('continued')});
  return{profile,environment,cache:'Fresh context; HTTP cache disabled by Playwright routing',assetTransport:data?'HTML asset URL substitution, identical image bytes':'Original HTTP image URL',rewriteCount,network,phases,lines,nativeFrames:final.frames,monitor:final.monitor};
 }catch(error){
  let state;try{state=await (cold||coldHost).evaluate(()=>window.GuidanceRuntimeQA?.trace()||{mode:typeof mode!=='undefined'?mode:null,body:document.body?.innerText.slice(0,1800)})}catch(e){state={unavailable:e.message}}
  (report.coldFailures||(report.coldFailures=[])).push({profile,environment,network,state,screenshot:await shot('failure').catch(()=>null)});throw error;
 }finally{release();closed=true;await context.close()}
}
(async()=>{
 const executablePath=engine==='webkit'?process.env.WEBKIT_PATH:process.env.CHROME_PATH;
 browser=await engines[engine].launch({headless:true,...(executablePath?{executablePath}:{})});
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor});host=await context.newPage();diagnostics(host,'reference');host.on('dialog',d=>d.accept());
 if(!coldOnly)await host.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 console.log('OPEN '+url);await host.goto(url,{waitUntil:'domcontentloaded',timeout:180000});console.log('TOP DOM READY');page=await gameSurface(host);console.log('GAME FRAME READY '+page.url());await page.evaluate(fixture);
 report.source={...await page.evaluate(()=>({build:window.TORII_PLAYTEST_BUILD||null,userAgent:navigator.userAgent})),topURL:host.url(),frameURL:page.url(),storage:await storageAndPermissions(page)};
 if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.source.build?.sourceSha256,process.env.EXPECTED_SOURCE_SHA);
 if(!coldOnly){
 await check('Initial title and save defaults retain explicit guidance choice',async()=>{const r=await page.evaluate(()=>({mode,game:G,fresh:fresh().guidance,legacy:normalizeSave({...fresh(),guidance:undefined}).guidance,off:normalizeSave({...fresh(),guidance:false}).guidance}));assert.equal(r.mode,'title');assert.equal(r.game,null);assert.equal(r.fresh,true);assert.equal(r.legacy,true);assert.equal(r.off,false);return r});
 await check('Normal new game draws real ground trail and target mark',async()=>{await page.locator('#startNew').click();await page.locator('#dif_normal').click();await page.waitForFunction(()=>!!G);await page.evaluate(()=>GuidanceRuntimeQA.settle());assert.equal(await page.evaluate(()=>G.guidance),true);const p=await page.evaluate(()=>GuidanceRuntimeQA.position());return{position:p,draw:visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()))}});
 await check(expectLeak?'Approved baseline reproduces Cmd+H Ctrl+H Alt+H hiding both guides':'Cmd+H Ctrl+H Alt+H leave guidance and browser defaults untouched',async()=>{const rows=[];for(const modifier of ['metaKey','ctrlKey','altKey']){const r=await page.evaluate(m=>GuidanceRuntimeQA.modified(m),modifier);rows.push(r);visible(r.draw,!expectLeak);if(!expectLeak){assert.equal(r.afterDown.guidance,true,modifier+' toggled guidance');assert.equal(r.afterDown.cool,r.before.cool);assert.equal(r.afterDown.mode,r.before.mode);assert.notEqual(r.afterDown.keys.h,true);assert.deepEqual(r.defaultPrevented,{keydown:false,keyup:false})}}if(expectLeak)assert(rows.some(r=>r.afterDown.guidance!==r.before.guidance),'Baseline did not reproduce modified-H leak');return rows});
 await check('Plain H toggles actual trail and mark off and back on',async()=>{await host.keyboard.press('h');assert.equal(await page.evaluate(()=>G.guidance),false);const off=visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()),false);await host.keyboard.press('h');assert.equal(await page.evaluate(()=>G.guidance),true);return{off,on:visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()))}});
 await check(expectLeak?'Approved baseline demonstrates remapped modified-H leakage':'Remapped H ignores modifiers on both keydown and keyup',async()=>{await page.evaluate(()=>ToriiInterface6.KeyMap.set('attack','h'));const rows=[];for(const modifier of ['metaKey','ctrlKey','altKey']){const r=await page.evaluate(m=>GuidanceRuntimeQA.modified(m,true),modifier);rows.push(r);if(!expectLeak){assert.equal(r.afterDown.guidance,true);assert.equal(r.afterDown.cool,r.before.cool);assert.notEqual(r.afterDown.keys.j,true);assert.deepEqual(r.defaultPrevented,{keydown:false,keyup:false})}}await page.evaluate(()=>ToriiInterface6.KeyMap.reset());return rows});
 await check('Pause resume retains visible guidance',async()=>{await page.evaluate(()=>openSystem());await page.locator('#resume10').click();return visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()))});
 await check('Return to title and Continue retain real guidance',async()=>{await page.evaluate(()=>openSystem());await page.locator('#ui7PauseTitle').click();assert.equal(await page.evaluate(()=>mode),'title');await page.locator('#startContinue').click();await page.evaluate(()=>GuidanceRuntimeQA.settle());return visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()))});
 await check('Resize preserves real route and mark',async()=>{const rows=[];for(const size of [{width:1470,height:956},{width:820,height:1180},{width:1280,height:800}]){await host.setViewportSize(size);rows.push({size,draw:visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()))})}return rows});
 await check('Explicit guidance=false persists through save title Continue',async()=>{await host.keyboard.press('h');assert.equal(await page.evaluate(()=>G.guidance),false);visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()),false);await page.evaluate(()=>openSystem());await page.locator('#ui7PauseTitle').click();await page.locator('#startContinue').click();await page.evaluate(()=>GuidanceRuntimeQA.settle());assert.equal(await page.evaluate(()=>G.guidance),false);const off=visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()),false);await host.keyboard.press('h');return{off,on:visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()))}});
 for(const chapter of [2,3])await check('Chapter '+chapter+' draws real guidance after native chapter entry',async()=>{await page.evaluate(c=>c===2?startChapterTwoPreview():C3.start(true),chapter);await page.evaluate(()=>GuidanceRuntimeQA.settle());await page.evaluate(()=>{G.guidance=true});const position=await page.evaluate(()=>GuidanceRuntimeQA.position());return{position,draw:visible(await page.evaluate(()=>GuidanceRuntimeQA.probe()))}});
 }
 if(process.env.GUIDANCE_COLD!=='0')for(const profile of ['cold-network','slow-image'])await check('Cold native first start without moving: '+profile,()=>coldOpening(profile));
 assert.deepEqual(report.errors,[],'Runtime page errors');assert(report.checks.length>0);assert.equal(report.checks.filter(c=>!c.passed).length,0,'Guidance runtime checks failed');console.log('PASS '+engine+' '+report.checks.length+' checks');
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{report.passed=report.checks.filter(c=>c.passed).length;report.failed=report.checks.length-report.passed;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');await browser?.close()});
