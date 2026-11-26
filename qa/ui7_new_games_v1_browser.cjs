/* Runtime integration check using native puzzle sessions and original controls.
 * Controlled saves/opening shortcuts are fixtures, not full campaign playthroughs. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const url=process.argv[2],out=process.argv[3]||'/private/tmp/torii-ui124-qa';
if(!url)throw Error('Pass the integrated build HTTP URL.');
const report={url,injectedCSS:process.env.UI7_INJECT_CSS==='1',checks:[],errors:[],limits:['Native runtime with controlled puzzle states; not a complete human campaign.','Mobile viewport/touch emulation and synthetic controller input; no physical device.']};
let browser;
(async()=>{
 fs.mkdirSync(out,{recursive:true});browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--disable-gpu']});
 report.browser=browser.version();
 for(const device of [{name:'pc',width:1280,height:800},{name:'vertical',width:390,height:844,mobile:true},{name:'horizontal',width:844,height:390,mobile:true}]){
  if(process.env.UI7_DEVICE&&device.name!==process.env.UI7_DEVICE)continue;
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:!!device.mobile,hasTouch:!!device.mobile}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(device.name+': '+e.message));page.setDefaultTimeout(15000);
  await page.goto(url+(device.mobile?(url.includes('?')?'&':'?')+'input=mobile':''),{waitUntil:'load',timeout:120000});
  await page.locator('#playtestEntry').waitFor({state:'detached'});
  if(!report.build){const response=await page.request.get(new URL('build-info.json',url).href);const build=await response.json();report.build={version:build.version,sourceSha256:build.sourceSha256,builtAt:build.builtAt};assert(report.build.sourceSha256.startsWith(new URL(url).searchParams.get('ui')),'expected exported source hash');}
  await page.waitForFunction(()=>!!window.ToriiNewGamesUIV7,null,{polling:50});
  if(process.env.UI7_INJECT_CSS==='1')await page.addStyleTag({content:fs.readFileSync('game/source/chapter-03/ui7_new_games_v1.css','utf8')});
  await page.evaluate(()=>{
   window.__ui124Prepare=function(area){
    if(mode==='dialogue')Narrativa.pularCena();
    closeOverlay();G=fresh();buildMaps();menuPage10=menuOrigin10=null;mode='walk';battle=bossActor=null;keys={};touchDir={};attackHeld=false;Input121.focused=true;
    G.c3=G.c3||{};G.c3.started=true;G.c3.complete=false;
    setArea(area,13.5,13.5,false);transitionAlpha=0;$('start').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';
    updateHUD();updateMobileLayout121();updateMobileReadout121();
   };
  });
  async function audit(kind,selector){
   await page.waitForTimeout(120);
   const metrics=await page.locator('#overlayInner').evaluate(root=>{
    const rect=root.getBoundingClientRect(),game=root.querySelector('.ui7-new-game');
    return {game:game?.dataset.ui7NewGame,left:rect.left,right:rect.right,viewport:innerWidth,width:root.clientWidth,scroll:root.scrollWidth,theme:document.querySelector('#ui7NewGamesStyle')?.sheet?.cssRules.length,enabled:[...game.querySelectorAll('button')].filter(b=>!b.disabled&&!b.hidden).length};
   });
   assert.equal(metrics.game,kind);assert(metrics.theme>40);assert(metrics.left>=-1&&metrics.right<=metrics.viewport+1,JSON.stringify(metrics));assert(metrics.scroll<=metrics.width+2,JSON.stringify(metrics));assert(metrics.enabled>0);
   await page.screenshot({path:path.join(out,kind+'_'+device.name+'.png')});
   report.checks.push({device:device.name,kind,metrics});console.log('OK',device.name,kind);
  }
  await page.evaluate(()=>{__ui124Prepare('radio9');G.flags.voicesCoupler=true;current.events.find(e=>e.id==='radioReceiver').doit()});
  await page.waitForSelector('#radioTuner');await audit('radio');
  const frequency=await page.locator('#radioChannel').textContent();await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('#radioChannel').textContent(),frequency,'radio native keyboard dial');
  const padFrequency=await page.locator('#radioChannel').textContent();
  assert(await page.evaluate(()=>ToriiNewGamesUIV7.radioPad({index:77,axes:[1,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))})));
  assert.notEqual(await page.locator('#radioChannel').textContent(),padFrequency,'radio controller dial');
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');assert(await page.locator('#radioTuner').evaluate(el=>el.classList.contains('radio-locked')));assert(await page.locator('#radioSend').isEnabled());report.checks.push({device:device.name,radioStableNative:true});
  await page.keyboard.press('Escape');assert(await page.locator('#overlay').evaluate(el=>el.classList.contains('hidden')),'radio native close');
  await page.evaluate(()=>{__ui124Prepare('power_plant');window.__plant124Finished=false;PlantSequencer.open(()=>{window.__plant124Finished=true})});
  await page.waitForSelector('#plantSequencer');assert(await page.locator('#plantReferenceSteps').evaluate(el=>el.hidden));assert(await page.locator('#plantApply').isDisabled());
  await page.locator('#plantReference').click();assert(!await page.locator('#plantReferenceSteps').evaluate(el=>el.hidden));
  const order=await page.evaluate(()=>{const profile=el=>[...el.querySelectorAll('.plant-wave i')].map(i=>i.style.getPropertyValue('--level')).join('');const pieces=[...document.querySelectorAll('[data-plant-beat]')];return [...document.querySelectorAll('#plantReferenceSteps li')].map(el=>pieces.findIndex(p=>profile(p)===profile(el)))});
  assert(order.every(i=>i>=0));
  // Keyboard shortcuts still enter native pieces after the UI adapter decorates.
  await page.keyboard.press(String(order[0]+1));assert(await page.locator('[data-plant-slot="0"]').isEnabled());
  await page.locator('[data-plant-slot="0"]').click();assert(await page.locator('[data-plant-slot="0"]').isDisabled());
  for(const piece of order)await page.keyboard.press(String(piece+1));
  assert(await page.locator('#plantApply').isEnabled());assert(await page.locator('#plantListen').isEnabled());
  await audit('plant');await page.locator('#plantListen').click();await page.locator('#plantApply').click();assert(await page.evaluate(()=>__plant124Finished),'native sequencer result callback');
  await page.evaluate(()=>{__ui124Prepare('voices');G.flags.lumiSong=false;openLumiPuzzle()});
  await page.waitForSelector('#lumiMelody');assert(await page.locator('#lumiHint').evaluate(el=>el.hidden));assert(await page.locator('#lumiFinish').evaluate(el=>el.hidden));
  await page.locator('#lumiShow').click();assert(!await page.locator('#lumiHint').evaluate(el=>el.hidden));
  await audit('lumi');
  const pitches=await page.evaluate(()=>{const buttons=[...document.querySelectorAll('[data-vnote]')];return $('lumiHint').textContent.split('→').map(n=>buttons.findIndex(b=>b.getAttribute('aria-label').startsWith(n.trim()))+1)});
  assert(pitches.length>0&&pitches.every(i=>i>=1&&i<=3));for(const key of pitches)await page.keyboard.press(String(key));
  assert(!await page.locator('#lumiFinish').evaluate(el=>el.hidden),'native completion action');
  assert(await page.locator('[data-vnote]').first().isDisabled());await page.locator('#lumiClose').click();
  async function worldAudit(kind,rootId,stage='ready'){
   await page.waitForTimeout(40);
   const detail=await page.locator('#'+rootId).evaluate(el=>{const r=el.getBoundingClientRect(),f=document.getElementById('frame').getBoundingClientRect(),s=getComputedStyle(el);return {visible:!el.hidden&&s.display!=='none',text:el.textContent.trim(),left:r.left,right:r.right,top:r.top,bottom:r.bottom,frame:{left:f.left,right:f.right,top:f.top,bottom:f.bottom},border:s.borderRadius,font:s.fontFamily,scroll:el.scrollWidth,width:el.clientWidth,pointerEvents:s.pointerEvents,controls:[...document.querySelectorAll('[data-mobile-action]')].filter(b=>{const c=getComputedStyle(b),r=b.getBoundingClientRect();return !b.closest('[hidden],.hidden')&&c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0}).map(b=>{const c=b.getBoundingClientRect();return {action:b.dataset.mobileAction,left:c.left,right:c.right,top:c.top,bottom:c.bottom,overlap:r.left<c.right&&r.right>c.left&&r.top<c.bottom&&r.bottom>c.top}})}});
   assert(detail.visible,kind+' '+stage);assert(detail.text);assert.equal(detail.border,'0px');assert(detail.left>=detail.frame.left-2&&detail.right<=detail.frame.right+2,JSON.stringify(detail));assert(detail.scroll<=detail.width+2,JSON.stringify(detail));assert.equal(detail.pointerEvents,'none');if(device.name==='horizontal')assert.deepEqual(detail.controls.filter(b=>b.overlap),[],kind+' '+stage+' control intersection '+JSON.stringify(detail));
   if(kind==='final'&&device.name==='horizontal'){detail.noteCells=await page.locator('#finalEchoNotes li').evaluateAll(cells=>cells.map(c=>({text:c.textContent,width:c.clientWidth,scroll:c.scrollWidth,whiteSpace:getComputedStyle(c).whiteSpace})));assert(detail.noteCells.every(c=>c.scroll<=c.width+1&&c.whiteSpace==='nowrap'),'final note label overflow '+JSON.stringify(detail.noteCells));}
   await page.screenshot({path:path.join(out,kind+'_'+stage+'_'+device.name+'.png')});report.checks.push({device:device.name,kind,stage,detail});
  }
  await page.evaluate(()=>{__ui124Prepare('forest');G.flags.bass=true;G.flags.bridge=false;G.x=27.75;G.y=21.25;BridgePuzzle.step(0)});await worldAudit('bridge','bridgeMessage');
  await page.evaluate(()=>{for(const note of BridgePuzzle.sequence){const station=BridgePuzzle.stations[note-1];current.events.find(e=>e.id===station.id).doit()}BridgePuzzle.step(.6)});
  assert(await page.evaluate(()=>G.flags.bridge));await worldAudit('bridge','bridgeMessage','result');
  await page.evaluate(()=>{__ui124Prepare('sky_canal');G.flags.violin11=true;G.c3.canalPath=false;G.x=14;G.y=12;CanalViolin.step(0)});await worldAudit('canal','canalViolin');
  await page.evaluate(()=>{keys.e=true;CanalViolin.begin();CanalViolin.step(1.2)});assert(await page.locator('#canalViolinMeter').evaluate(el=>el.value>.45&&el.value<.8));await worldAudit('canal','canalViolin','holding');
  await page.evaluate(()=>CanalViolin.step(1.3));assert(await page.evaluate(()=>G.c3.canalPath));await worldAudit('canal','canalViolin','result');await page.evaluate(()=>{keys={}});
  await page.evaluate(()=>{__ui124Prepare('contratempo');G.c3.usinaDone=G.c3.canalDone=true;G.c3.clubPhraseDone=false;G.x=14;G.y=11;ClubStage.step(0)});await worldAudit('club','clubStageMessage');
  await page.evaluate(()=>ClubStage.listen());await page.waitForTimeout(40);await page.evaluate(()=>{for(let i=0;i<6;i++)ClubStage.step(.7);for(const beat of ClubStage.motif){const station=ClubStage.stations.find(s=>s.id===beat.id);current.events.find(e=>e.id===station.event).doit()}ClubStage.step(0)});await worldAudit('club','clubStageMessage','result');
  await page.evaluate(()=>{__ui124Prepare('silence_core');G.c3.silenceDone=false;G.c3.finalRecovered=0;FinalEchoes.step(0)});await worldAudit('final','finalEchoes');
  await page.evaluate(()=>{const beat=ClubStage.motif[FinalEchoes.missing[0]],echo=FinalEchoes.echoes.find(e=>e.instrument===beat.id);current.events.find(e=>e.id===echo.id).doit();FinalEchoes.step(0)});assert(await page.evaluate(()=>G.c3.finalRecovered===1));await worldAudit('final','finalEchoes','recovered');
  const worlds=await page.evaluate(()=>['bridgeMessage','clubStageMessage','canalViolin','finalEchoes'].map(id=>({id,exists:!!$(id),themed:$(id)?.classList.contains('ui7-new-world')})));
  assert(worlds.every(row=>row.exists&&row.themed),JSON.stringify(worlds));
  report.checks.push({device:device.name,nativeInputAndOutcomes:true,worlds});await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
})().catch(error=>{report.failure=error.stack;process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');if(browser)await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);console.log(JSON.stringify(report));process.exit(process.exitCode||0)});
