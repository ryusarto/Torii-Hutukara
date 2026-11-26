/* Audit every live menu family and preserve native chapter/formation actions. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),out=path.join(root,'qa',v.versao),url=process.argv[2]||pathToFileURL(path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html')).href;
const saved=JSON.parse(fs.readFileSync(path.join(root,'qa/beta-1.10.1/CAMPAIGN_usina_RELOAD.json'))).save;
const report={checks:[],errors:[],limits:['Actual runtime with controlled chapter saves and menu actions.','Emulated mobile; no full human campaign or physical hardware.']};let browser;
(async()=>{browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--disable-gpu']});fs.mkdirSync(out,{recursive:true});
 for(const mobile of [false,true]){
 const context=await browser.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:800}}),page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));page.on('dialog',d=>d.accept());await page.goto(url+(mobile?(url.includes('?')?'&':'?')+'input=mobile':''),{waitUntil:'load',timeout:120000});await page.locator('#playtestEntry').waitFor({state:'detached'});
 await page.evaluate(saved=>{window.__screenSaved=saved;window.__screenPrepare=function(kind='c1'){
  if(Narrativa.historicoAberto())Narrativa.fecharHistorico();if(mode==='dialogue')Narrativa.pularCena();
  G=kind==='c1'||kind==='c2'?fresh():normalizeSave(copy(__screenSaved));buildMaps();menuPage10=menuOrigin10=null;mode='walk';battle=bossActor=null;keys={};touchDir={};attackHeld=false;C3.finalPending=false;
  if(kind==='c1'||kind==='c2'){G.flags.masks=G.flags.bass=G.flags.reveal=G.flags.voicesKatana=true;G.hp.alt=G.maxhp.alt||48;G.hp.katana=G.maxhp.katana||49;G.formation=['franco','ryuchi','alt'];}
  if(kind==='c3'){G.c3.complete=false;G.c3.started=true;}
  if(kind==='complete')G.c3.complete=true;
  // Unlocking several recruits at once is a fixture operation; settle the native migration before testing manual reserves.
  setArea(kind==='c1'?'city':kind==='c2'?'voices':kind==='c3'?'distortion_district':'last_torii',13.5,13.5,false);ToriiFluxo.fillFormation(G);transitionAlpha=0;$('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';updateHUD();updateMobileLayout121();updateMobileReadout121();
 };},saved);
 async function audit(name,kind,open,opts={}){
  await page.evaluate(kind=>__screenPrepare(kind),kind);await page.evaluate(open);await page.waitForTimeout(120);
  await page.evaluate(()=>{ToriiUI7.decorate();ToriiScreensV7.decorate()});
  const rootSelector=opts.history?'#leituraHistorico .lh-janela':'#overlayInner';
  const detail=await page.locator(rootSelector).evaluate(el=>{const r=el.getBoundingClientRect();const buttons=[...el.querySelectorAll('button')].filter(b=>getComputedStyle(b).display!=='none'&&!b.hidden);return{kind:el.dataset.ui7Screen,title:el.querySelector('h2')?.textContent,rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},screen:{w:innerWidth,h:innerHeight},scroll:el.scrollWidth,client:el.clientWidth,unskinned:buttons.filter(b=>!b.classList.contains('ui7-machine')&&!b.classList.contains('ui7-note')&&!b.hasAttribute('data-tl-control')).map(b=>b.id),buttons:buttons.length,heroCards:el.querySelectorAll('.ui7-hero-card').length}});
  assert(detail.buttons>0,name);assert.deepEqual(detail.unskinned,[],name+' old buttons');assert(detail.rect.left>=-1&&detail.rect.right<=detail.screen.w+1,name+' horizontal clipping '+JSON.stringify(detail));assert(detail.scroll<=detail.client+2,name+' internal overflow '+JSON.stringify(detail));
  if(opts.party)assert(detail.heroCards>=4,name+' roster');
  if(opts.shot)await page.screenshot({path:path.join(out,opts.shot+(mobile?'_mobile':'_pc')+'.png')});
  report.checks.push({name:(mobile?'Mobile':'PC')+' · '+name,passed:true,detail});console.log('OK · '+(mobile?'Mobile':'PC')+' · '+name);return detail;
 }
 await audit('Pause','c1',()=>openSystem());
 await audit('Characters, chapters 1–2','c1',()=>openParty(),{party:true,shot:'equipe_c1'});
 // Keep formation callbacks and the living-party guard intact.
 const ryuchi=page.locator('[data-member10="ryuchi"]');await (mobile?ryuchi.tap():ryuchi.click());await page.waitForFunction(()=>!partyMembers().includes('ryuchi'),null,{timeout:3000});await (mobile?ryuchi.tap():ryuchi.click());await page.waitForFunction(()=>partyMembers().includes('ryuchi'),null,{timeout:3000});
 await audit('Characters, chapter 3','c3',()=>openParty(),{party:true,shot:'equipe_c3'});
 const reserve=await page.locator('[data-c3member]').evaluateAll(bs=>bs.find(b=>!b.disabled&&b.textContent.includes('RESERVAR'))?.dataset.c3member);assert(reserve);await page.locator('[data-c3member="'+reserve+'"]').click();assert(!await page.evaluate(id=>partyMembers().includes(id),reserve));
 await audit('Chapter 1 completion','c1',()=>{G.flags.ending=true;endingScreen()},{shot:'fim_capitulo_1'});
 const continue2=page.getByRole('button',{name:/CONTINUAR.*CAPÍTULO 02/});await continue2.click();await page.evaluate(()=>{if(mode==='dialogue')Narrativa.pularCena()});assert(await page.evaluate(()=>G.chapter===2||['rain_station','voices'].includes(G.area)));
 await audit('Chapter 2 completion','c2',()=>{G.flags.voicesDone=true;voiceEnding()},{shot:'fim_capitulo_2'});await page.locator('#c3Continue').click();assert(await page.evaluate(()=>G.c3.started));
 await audit('Chapter 3 completion and postgame','complete',()=>PostGame.showEnding(),{shot:'fim_capitulo_3'});
 await audit('Map, chapter 1','c1',()=>openMap());await audit('Map, chapter 2','c2',()=>openMap());await audit('Map, chapter 3','c3',()=>openMap(),{shot:'mapa_c3'});
 await audit('Journal, chapter 1','c1',()=>openJournal());await audit('Journal, chapter 2','c2',()=>openJournal());await audit('Journal, chapter 3','c3',()=>openJournal(),{shot:'diario_c3'});
 await audit('Help','c1',()=>openHelp());await audit('Settings and accessibility','c1',()=>openSettings10(),{shot:'opcoes_completas'});
 await audit('Key binding settings','c1',()=>ToriiInterface6.openControls());
 await audit('Touch layout settings','c1',()=>TouchLayoutV1.openSettings(openSystem));
 await audit('Difficulty','c1',()=>ToriiDificuldade.escolher(()=>{}));
 await audit('Merchant','c1',()=>ToriiCura.openTapeShop('Mercado das Canções','Fitas para seguir viagem.'),{shot:'loja_fitas'});
 await audit('Ema choice','c1',()=>chooseDialogue('O que perguntar à Anciã?',[{label:'Sobre o viajante',value:'traveler',lines:[{who:'ema',t:'Ele já passou por aqui.'}]}]));
 await audit('Chapter 3 route choice','c3',()=>{G.c3.metMaia=false;C3.maia();Narrativa.pularCena()});
 await audit('Cassette decision','c3',()=>C3.chooseCassette());
 await audit('Four timbres','c3',()=>C3.openPhrase('post'));
 await audit('Lumi','c2',()=>{G.flags.lumiSong=false;openLumiPuzzle()});
 await audit('Reading history','c1',()=>{talk([{who:'franco',t:'Uma memória da viagem.'}]);Narrativa.abrirHistorico();ToriiScreensV7.history()},{history:true,shot:'historico_falas'});
 await audit('Defeat, chapter 1','c1',()=>showDefeat(),{shot:'derrota_c1'});
 await audit('Defeat, chapter 3','c3',()=>showDefeat(),{shot:'derrota_c3'});
 await audit('Travel between chapters','complete',()=>PostGame.openTravel());
 await audit('Dungeon briefing','complete',()=>PostGame.openBriefing(),{shot:'fenda_regras'});
 await audit('Dungeon resume','complete',()=>{PostGame.startDungeon(41);PostGame.showResume()});
 await audit('Dungeon suspend confirmation','complete',()=>{PostGame.startDungeon(41);PostGame.confirmSuspend()});
 await audit('Dungeon exit confirmation','complete',()=>{PostGame.startDungeon(41);PostGame.confirmExit()});
 await audit('Dungeon upgrades','complete',()=>{PostGame.startDungeon(41);const r=PostGame.run();r.wave=6;r.phase='rest';mode='walk';PostGame.showDraft()});
 await audit('Dungeon respite','complete',()=>{PostGame.startDungeon(41);const r=PostGame.run();r.wave=10;r.phase='rest';mode='walk';G.hp[G.active]-=10;PostGame.showDraft()});
 await audit('Dungeon results','complete',()=>{PostGame.startDungeon(41);PostGame.finishRun('defeat')},{shot:'fenda_resultado'});
 await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({passed:report.checks.length,errors:report.errors}));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,'UI_SCREEN_AUDIT_BROWSER.json'),JSON.stringify(report,null,2)+'\n');const end=setTimeout(()=>process.exit(process.exitCode||0),6000);try{await browser?.close()}finally{clearTimeout(end)}});
