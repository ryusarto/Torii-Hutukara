'use strict';
// CI defaults to explicit DOM lifecycle fixtures. LIFECYCLE_NATIVE=1 uses an
// isolated headed Chrome process and real tab/window events, without Playwright
// focus emulation. Neither mode certifies OS sleep or physical gamepad behavior.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),native=process.env.LIFECYCLE_NATIVE==='1';
const out=path.resolve(process.env.LIFECYCLE_OUTPUT_DIR||path.join(root,'qa',version.versao,'lifecycle')),url=process.argv[2]||'http://127.0.0.1:8894/';
const report={url,mode:native?'native-browser-events':'emulated-dom-lifecycle',method:native?'Owned Chrome CLI profile, connectOverCDP(noDefaults:true), native tabs/windows and trusted focus/visibility events. Gamepad API data is emulated; no user browser/app or OS-sleep control.':'Headless browser; document visibility/focus values and DOM events are explicitly emulated to exercise installed handlers. Native timers and game actions remain installed. This is not OS/browser-tab lifecycle certification.',checks:[],errors:[]};
let browser,context,page,other,visibleWindow,chromeProcess,profile,browserCdp;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function launch(){
 const macChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',executable=process.env.CHROME_PATH||(fs.existsSync(macChrome)?macChrome:chromium.executablePath());
 if(!native){browser=await chromium.launch({executablePath:executable,headless:true});context=await browser.newContext({viewport:{width:1280,height:800}});return}
 profile=fs.mkdtempSync(path.join(os.tmpdir(),'torii-lifecycle-'));let log='';
 chromeProcess=spawn(executable,['--user-data-dir='+profile,'--remote-debugging-port=0','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-sync','--window-size=1280,900','about:blank'],{stdio:['ignore','ignore','pipe']});
 chromeProcess.stderr.on('data',data=>{if(log.length<1500)log+=String(data)});
 const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;i<200&&!fs.existsSync(portFile);i++)await wait(50);
 if(!fs.existsSync(portFile))throw Error('Owned Chrome CDP endpoint unavailable: '+log);
 const port=Number(fs.readFileSync(portFile,'utf8').split('\n')[0]);browser=await chromium.connectOverCDP('http://127.0.0.1:'+port,{noDefaults:true});context=browser.contexts()[0];browserCdp=await browser.newBrowserCDPSession();
}
function init(emulated){
 window.__lifecyclePads=[];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>__lifecyclePads});
 window.__lifecycleEvents=[];window.__lastHiddenAt=null;window.__lastShownAt=null;
 const actualHidden=Object.getOwnPropertyDescriptor(Document.prototype,'hidden').get.bind(document),actualFocus=document.hasFocus.bind(document);
 window.__lifecycleActual=()=>({hidden:actualHidden(),hasFocus:actualFocus()});
 if(emulated){
  const state={hidden:false,focused:true};
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>state.hidden});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>state.hidden?'hidden':'visible'});document.hasFocus=()=>state.focused;
  window.__setLifecycle=kind=>{
   if(kind==='focused'){if(state.hidden){state.hidden=false;document.dispatchEvent(new Event('visibilitychange'))}state.focused=true;dispatchEvent(new Event('focus'))}
   else{state.focused=false;dispatchEvent(new Event('blur'));if(kind==='hidden'&&!state.hidden){state.hidden=true;document.dispatchEvent(new Event('visibilitychange'))}}
  };
 }
 const record=event=>{const row={type:event.type,isTrusted:event.isTrusted,time:performance.now(),hidden:document.hidden,hasFocus:document.hasFocus()};__lifecycleEvents.push(row);if(__lifecycleEvents.length>80)__lifecycleEvents.shift();if(event.type==='visibilitychange'){if(document.hidden)__lastHiddenAt=row.time;else __lastShownAt=row.time}};
 for(const name of ['blur','focus','pagehide','pageshow'])addEventListener(name,record);for(const name of ['visibilitychange','freeze','resume'])document.addEventListener(name,record);
}
function install(){
 const pad=index=>({index,id:'Lifecycle regression pad '+index,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
 window.__lifePulses=[];window.__lifeTarget=null;window.__lifeEnds=0;window.__lifeUI=0;window.__lifeProgress=0;window.__lifeRelease=0;window.__lifeCastAt=0;
 const pulse=C3.percussionPulse;C3.percussionPulse=function(...args){__lifePulses.push({args,time:performance.now(),hidden:document.hidden,focused:Input121.focused,mode});return pulse.apply(this,args)};
 window.LifecycleQA={
  async ready(){await FinalAssetLoadingV1.ready();const gate=FinalAssetLoadingV1.snapshot();if(gate.loading||gate.error)throw Error('Scene gate not ready: '+JSON.stringify(gate))},
  async arena(hero='franco'){
   await this.ready();G=fresh();Object.assign(G.flags,{bass:true,masks:true,reveal:true,voicesKatana:true,bridge:true});Object.assign(G.c3,{synthUnlocked:true,percussionUnlocked:true});G.knownMembers=C3.unlockedRoster().slice();G.formation=[hero,hero==='franco'?'ryuchi':'franco'];G.active=hero;G.difficulty='normal';
   for(const id of C3.progressionIds){G.xp[id]=10000;G.hp[id]=G.maxhp[id]=500}C3.ensureProgression(G);buildMaps();setArea('forest',10.5,12.5,false);current=areas.forest=mk('forest',44,36,'grass');current.enemies=[];bossActor=battle=null;C3.hazards=[];C3.synthZones=[];C3.finalPending=false;projectiles=[];hostileShots=[];combatFX.length=0;Special11.fields=[];Special11.traces=[];
   G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];G.resonance=100;releaseAll121();keys={};touchDir={};menuOpen=false;companionCooldown=999;resetMotion10();Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,invuln:0,dash:0,dashCD:0});
   __lifecyclePads=[pad(0),pad(1)];C3.pad.pads=__lifecyclePads;C3.pad.previous.clear();Object.assign(C3.coop,{member:G.formation[1],area:'',cool:0,skill:0,advanced:0,signature:0,dash:0,dashCD:0,recovery:0,invuln:0,hit:0,contact:999});Object.assign(Input121,{focused:document.hasFocus(),wasCoop:false,game:G,lastArea:G.area,pad:[0,0],touch:[0,0]});C3.syncCoop(true);
   for(const id of ['start','dialogue','overlay','toast'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';transitionAlpha=screenShake=0;mode='action';battle={id:'lifecycle-fixture',boss:false};
   const enemy=hydrateEnemy({id:'lifecycle-target',type:'hush',x:G.x+2,y:G.y});enemy.hp=enemy.max=10000;enemy.cd=enemy.stun=999;current.enemies=[enemy];__lifeTarget=enemy;
   await FinalAssetLoadingV1.start({force:true});await this.ready();update(0);await this.ready();engage();Narrativa.definir('auto',false);Narrativa.definir('vel','instantaneo');__lifePulses=[];__lifeEnds=__lifeUI=__lifeProgress=__lifeRelease=0;
  },
  dialogue(){talk([{who:'franco',t:'Primeira fala controlada para a revisão de foco.'},{who:'ryuchi',t:'Segunda fala controlada para a revisão de foco.'},{who:'franco',t:'Última fala controlada para a revisão de foco.'}],()=>{__lifeEnds++})},
  button(seat,index,pressed){__lifecyclePads[seat].buttons[index]={pressed,value:pressed?1:0}},
  snapshot(){return{at:performance.now(),hidden:document.hidden,focused:document.hasFocus(),inputFocused:Input121.focused,actual:__lifecycleActual(),active:G?.active,area:G?.area,mode,menu:menuOpen,queue:dialogueQueue.length,words:$('words').textContent,auto:Narrativa.opcoes().auto,history:Narrativa.historicoAberto(),ended:__lifeEnds,keys:Object.keys(keys).filter(key=>keys[key]),pad:[...Input121.pad],touch:[...Input121.touch],attack:attackHeld,pointers:Input121.pointers.size,p1:{x:G?.x,y:G?.y,hp:G?.hp?.[G?.active],skillX:act.skillX},p2:{x:C3.coop.x,y:C3.coop.y,cool:C3.coop.cool},targetHP:__lifeTarget?.hp,pulses:__lifePulses.map(p=>({...p})),castAt:__lifeCastAt,hiddenAt:__lastHiddenAt,shownAt:__lastShownAt,ui:__lifeUI,progressJobs:__lifeProgress,releases:__lifeRelease,progress:JSON.stringify({flags:G?.flags,c3:G?.c3,xp:G?.xp,shards:G?.shards,potions:G?.potions}),events:__lifecycleEvents.slice(-8)}}
 };
}
async function state(){return page.evaluate(()=>LifecycleQA.snapshot())}
async function focus(kind){
 if(!native){await page.evaluate(kind=>__setLifecycle(kind),kind);return}
 if(kind==='focused')await page.bringToFront();
 else if(kind==='hidden')await other.bringToFront();
 else{
  if(!visibleWindow){const info=await(await context.newCDPSession(page)).send('Target.getTargetInfo'),win=await browserCdp.send('Browser.getWindowForTarget',{targetId:info.targetInfo.targetId});await browserCdp.send('Browser.setWindowBounds',{windowId:win.windowId,bounds:{left:0,top:50,width:1000,height:750}});const opened=context.waitForEvent('page');await browserCdp.send('Target.createTarget',{url:'about:blank#lifecycle-owned-window',newWindow:true,left:1040,top:80,width:420,height:600});visibleWindow=await opened;await visibleWindow.waitForLoadState('domcontentloaded')}
  await visibleWindow.bringToFront();
 }
 await wait(150);const s=await state();assert.equal(s.hidden,kind==='hidden','Native visibility transition was not established');assert.equal(s.focused,kind==='focused','Native focus transition was not established');assert.equal(s.inputFocused,kind==='focused');
}
async function arena(hero){await focus('focused');await page.evaluate(hero=>LifecycleQA.arena(hero),hero)}
async function check(name,fn){if(process.env.LIFECYCLE_ONLY&&!new RegExp(process.env.LIFECYCLE_ONLY,'i').test(name))return;try{const detail=await fn();report.checks.push({name,passed:true,detail});console.log('PASS '+name)}catch(error){report.checks.push({name,passed:false,error:error.stack});console.error('FAIL '+name+' '+error.message)}}
function assertReadingUntouched(before,after){assert.equal(after.mode,'dialogue');assert.equal(after.queue,before.queue);assert.equal(after.words,before.words);assert.equal(after.ended,0);assert.equal(after.auto,false);assert.equal(after.history,false);assert.equal(after.progress,before.progress)}
(async()=>{
 fs.mkdirSync(out,{recursive:true});await launch();report.browser=browser.version();await context.addInitScript(init,!native);page=context.pages()[0]||await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url,{waitUntil:'load',timeout:180000});report.build=await page.evaluate(()=>window.TORII_PLAYTEST_BUILD);assert.match(report.build?.sourceSha256||'',/^[a-f0-9]{64}$/);if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.build.sourceSha256,process.env.EXPECTED_SOURCE_SHA);await page.evaluate(install);report.environment=await page.evaluate(()=>({userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],canvas:[VW,VH]}));
 if(native){other=await context.newPage();await other.goto('about:blank')}
 for(const absence of ['hidden','visible-blur'])for(const seat of [0,1])for(const [action,index]of [['skip',8],['AUTO',2],['history',3]])await check('P'+(seat+1)+' '+action+' ignores '+absence+' input and held return, accepts one fresh press',async()=>{
  await arena();await page.evaluate(()=>LifecycleQA.dialogue());const before=await state();await focus(absence);await page.evaluate(({seat,index})=>LifecycleQA.button(seat,index,true),{seat,index});await wait(native&&absence==='hidden'?1400:420);const hidden=await state();assert.equal(hidden.hidden,absence==='hidden');assert.equal(hidden.inputFocused,false);assertReadingUntouched(before,hidden);await focus('focused');await wait(420);const returnedHeld=await state();assertReadingUntouched(before,returnedHeld);
  await page.evaluate(({seat,index})=>LifecycleQA.button(seat,index,false),{seat,index});await wait(320);await page.evaluate(({seat,index})=>LifecycleQA.button(seat,index,true),{seat,index});await wait(320);const fresh=await state();await page.evaluate(({seat,index})=>LifecycleQA.button(seat,index,false),{seat,index});
  if(action==='skip')assert.equal(fresh.ended,1);if(action==='AUTO')assert.equal(fresh.auto,true);if(action==='history')assert.equal(fresh.history,true);return{before,hidden,returnedHeld,fresh};
 });
 await check('Visible blur releases held P1/P2 input and fresh controls work after focus returns',async()=>{
  await arena();await page.keyboard.down('d');await page.evaluate(()=>{__lifecyclePads[1].axes=[1,0];LifecycleQA.button(1,2,true)});await wait(160);const held=await state();await focus('visible-blur');const blurred=await state();assert.equal(blurred.hidden,false);assert.equal(blurred.inputFocused,false);assert.deepEqual(blurred.keys,[]);assert.deepEqual(blurred.pad,[0,0]);assert.equal(blurred.attack,false);assert.equal(blurred.pointers,0);await page.keyboard.up('d');await page.evaluate(()=>{__lifecyclePads[1].axes=[0,0];LifecycleQA.button(1,2,false)});await focus('focused');await wait(100);const neutral=await state();await page.keyboard.down('d');await page.evaluate(()=>{__lifecyclePads[1].axes=[1,0];LifecycleQA.button(1,2,true)});await wait(180);const fresh=await state();await page.keyboard.up('d');await page.evaluate(()=>{__lifecyclePads[1].axes=[0,0];LifecycleQA.button(1,2,false)});assert(fresh.p1.x>neutral.p1.x+.04&&fresh.p2.x>neutral.p2.x+.04);assert(fresh.p2.cool>0);return{held,blurred,neutral,fresh};
 });
 await check('Hidden tab preserves remaining percussion intervals while UI and progression jobs continue',async()=>{
  await arena('percussion');await page.evaluate(()=>{__lifeCastAt=performance.now();advancedSkill();FinalAssetLoadingV1.schedule(()=>__lifeUI++,70);FinalAssetLoadingV1.scheduleProgress(()=>__lifeProgress++,90)});await wait(35);await focus('hidden');const hiddenStart=await state();assert.equal(hiddenStart.pulses.length,1,'Hidden transition must occur between the first and second native pulse');await wait(native?1400:350);const hidden=await state();assert.equal(hidden.pulses.length,1);assert.equal(hidden.targetHP,hiddenStart.targetHP);assert.equal(hidden.ui,1);assert.equal(hidden.progressJobs,1);await focus('focused');await wait(380);const resumed=await state();assert.equal(resumed.pulses.length,3);assert.deepEqual(resumed.pulses.map(p=>p.args[0]),[2.4,3.65,4.9]);assert(resumed.pulses.every(p=>!p.hidden));const remaining2=Math.max(0,145-(hiddenStart.hiddenAt-hiddenStart.castAt)),remaining3=Math.max(0,290-(hiddenStart.hiddenAt-hiddenStart.castAt)),second=resumed.pulses[1].time-resumed.shownAt,third=resumed.pulses[2].time-resumed.shownAt;assert(second>=remaining2-30&&third>=remaining3-30,'Combat callbacks did not preserve remaining time');assert(resumed.pulses[2].time-resumed.pulses[1].time>=remaining3-remaining2-35,'Combat pulses caught up together');return{hiddenStart,hidden,resumed,remaining2,remaining3,second,third};
 });
 await check('Visible unfocused combat releases keep running without automatic pause',async()=>{
  await arena('percussion');await focus('visible-blur');const before=await state();await page.evaluate(()=>{__lifeCastAt=performance.now();advancedSkill()});await wait(390);const after=await state();assert.equal(after.hidden,false);assert.equal(after.inputFocused,false);assert.equal(after.pulses.length,3);assert(after.targetHP<before.targetHP);return{before,after};
 });
 await check('Manual pause survives hidden/foreground transitions and releases only after explicit resume',async()=>{
  await arena('percussion');await page.evaluate(async()=>{__lifeCastAt=performance.now();advancedSkill();await new Promise(resolve=>setTimeout(resolve,35));openSystem()});await wait(70);const before=await state();assert.equal(before.pulses.length,1);await focus('hidden');await wait(native?1200:350);const hidden=await state();await focus('focused');await wait(320);const returned=await state();for(const s of [hidden,returned]){assert.equal(s.mode,'overlay');assert.equal(s.pulses.length,1);assert.equal(s.targetHP,before.targetHP);assert.equal(s.p1.skillX,before.p1.skillX);assert.equal(s.progress,before.progress)}await page.keyboard.press('Escape');await wait(400);const resumed=await state();assert.equal(resumed.pulses.length,3);return{before,hidden,returned,resumed};
 });
 for(const boundary of ['hero','area','game','defeat'])await check('Hidden combat job is cancelled at '+boundary+' boundary',async()=>{
  await arena();await page.evaluate(()=>FinalAssetLoadingV1.scheduleCombat(()=>__lifeRelease++,220));await focus('hidden');const changed=await page.evaluate(async boundary=>{const previousGame=G,previousHero=G.active,previousArea=G.area;if(boundary==='hero')slotSwitch(2);else if(boundary==='area')setArea('city',29.5,33.5,false);else if(boundary==='game'){G=fresh();buildMaps();setArea('studio',12.5,10.5,false)}else G.hp[G.active]=0;await FinalAssetLoadingV1.ready();return boundary==='hero'?G.active!==previousHero:boundary==='area'?G.area!==previousArea:boundary==='game'?G!==previousGame:G.hp[previousHero]===0},boundary);assert(changed,'Requested cancellation boundary was not established');await wait(260);const hidden=await state();await focus('focused');await wait(260);const returned=await state();assert.equal(hidden.releases,0);assert.equal(returned.releases,0);return{hidden,returned};
 });
 report.passed=report.checks.filter(c=>c.passed).length;report.failed=report.checks.length-report.passed;assert.deepEqual(report.errors,[]);if(report.failed)process.exitCode=1;
})().catch(error=>{report.failure=error.stack;process.exitCode=1;console.error(error)}).finally(async()=>{try{await browser?.close()}finally{if(chromeProcess&&chromeProcess.exitCode===null){chromeProcess.kill('SIGTERM');for(let i=0;i<30&&chromeProcess.exitCode===null&&chromeProcess.signalCode===null;i++)await wait(50)}if(profile)fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100})}report.browserClosed=true;fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,native?'NATIVE.json':'BROWSER.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,source:report.build?.sourceSha256,mode:report.mode,browserClosed:true}));});
