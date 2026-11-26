/* Per-enemy HUD regression on the actual build. Controlled actor fixtures, not a
 * campaign/hardware playtest. Damage uses the real hitEnemy action. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),out=path.join(root,'qa',v.versao);
const input=process.argv[2]||pathToFileURL(path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html')).href;
fs.mkdirSync(out,{recursive:true});let browser;const report={method:'Actual runtime render with controlled actor fixtures; animation loop disabled to isolate DOM/canvas geometry. Real hitEnemy for damage/death. No human/hardware playtest.',checks:[],errors:[]};
async function run(name,fn){const details=await fn();report.checks.push({name,passed:true,details});console.log('OK · '+name)}
async function init(page){await page.evaluate(()=>{G=fresh();G.flags.masks=G.flags.bass=true;buildMaps();setArea('forest',20.5,21.5,false);$('start').classList.add('hidden');$('dialogue').classList.add('hidden');$('overlay').classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';menuOrigin10=menuPage10=null;mode='walk';transitionAlpha=0;current.enemies=[['meter_a','hush',15.5],['meter_b','whisper',20.5],['meter_c','c3_drone',25.5]].map(([id,type,x])=>hydrateEnemy({id,type,x,y:22.5}));window.__healthFixtures=current.enemies.slice();updateHUD();drawEnv()});await page.waitForTimeout(120);await page.evaluate(()=>drawEnv())}
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
 for(const device of ['PC','mobile','landscape']){
  const context=await browser.newContext(device==='PC'?{viewport:{width:1280,height:800}}:{viewport:device==='mobile'?{width:390,height:844}:{width:844,height:390},isMobile:true,hasTouch:true});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(device+': '+e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0});await page.goto(device!=='PC'?input+(input.includes('?')?'&':'?')+'input=mobile':input,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.ToriiEnemyHealthV7);await page.locator('#playtestEntry').waitFor({state:'detached'});await init(page);if(device!=='PC'){await page.evaluate(()=>{updateMobileLayout121();updateMobileReadout121();drawEnv()});assert(await page.evaluate(()=>Input121.mobile))}
  await run(device+' · three enemies have separate compact meters above the native heads',async()=>{
   const rows=await page.evaluate(()=>{drawEnv();const r=$('game').getBoundingClientRect();return ToriiEnemyHealthV7.snapshot().map(row=>({...row,sy:r.height/$('game').height}))});assert.equal(rows.length,3);assert.deepEqual(rows.map(x=>x.id),['meter_a','meter_b','meter_c']);for(const row of rows){assert(row.width<80&&row.height<=12);assert(row.top+row.height<(row.y-row.head)*row.sy)}assert.equal(await page.locator('#actionHUD .action-label').evaluate(n=>getComputedStyle(n).display),'none');await page.screenshot({path:path.join(out,'inimigos_vida_'+device.toLowerCase()+'.png')});return rows;
  });
  await run(device+' · real damage updates only the victim meter',async()=>{
   const before=await page.evaluate(()=>ToriiEnemyHealthV7.snapshot().map(r=>({id:r.id,hp:r.hp})));await page.evaluate(()=>{hitEnemy(__healthFixtures[1],7,0,0);drawEnv()});const after=await page.evaluate(()=>ToriiEnemyHealthV7.snapshot().map(r=>({id:r.id,hp:r.hp})));assert.equal(after[1].hp,before[1].hp-7);assert.equal(after[0].hp,before[0].hp);assert.equal(after[2].hp,before[2].hp);return after;
  });
  await run(device+' · meters follow enemy movement and camera with no edge pinning',async()=>{
   const before=await page.evaluate(()=>ToriiEnemyHealthV7.snapshot().find(x=>x.id==='meter_a'));await page.evaluate(()=>{__healthFixtures[0].x+=1.5;G.x+=2;drawEnv()});const after=await page.evaluate(()=>ToriiEnemyHealthV7.snapshot().find(x=>x.id==='meter_a'));assert(after.left!==before.left);const error=await page.evaluate(()=>{const r=$('game').getBoundingClientRect(),row=ToriiEnemyHealthV7.snapshot().find(x=>x.id==='meter_a'),node=document.querySelector('[data-enemy-id="meter_a"]'),box=node.getBoundingClientRect();return Math.abs(box.x+box.width/2-(r.x+row.x*r.width/$('game').width))});assert(error<1.1);await page.evaluate(()=>{__healthFixtures[0].x=400;drawEnv()});assert.equal(await page.locator('[data-enemy-id="meter_a"]').count(),0);return{error};
  });
  await run(device+' · death removes only that actor and menus hide world meters',async()=>{
   await page.evaluate(()=>{hitEnemy(__healthFixtures[2],99999,0,0);drawEnv()});assert.equal(await page.locator('[data-enemy-id="meter_c"]').count(),0);assert.equal(await page.locator('[data-enemy-id="meter_b"]').count(),1);await page.evaluate(()=>{openSystem();drawEnv()});assert(await page.locator('#enemyHealthLayerV7').isHidden());await page.evaluate(()=>{closeOverlay();drawEnv()});assert(await page.locator('#enemyHealthLayerV7').isVisible());
  });
  await run(device+' · all four bosses have a large fixed screen meter and no head meter',async()=>{
   const rows=[];for(const id of ['boss','voice_boss','c3_metronome','c3_silence']){await page.evaluate(id=>{current.enemies=[];bossActor={id,type:'boss',x:G.x+3,y:G.y+2,hp:170,max:340,wind:0,stun:999,flash:0,phase:1};battle={boss:true,id};mode='action';drawEnv()},id);await page.waitForTimeout(100);await page.evaluate(()=>drawEnv());const row=await page.evaluate(()=>ToriiEnemyHealthV7.snapshot());assert.equal(row.length,1);assert.equal(row[0].id,id);assert.equal(row[0].boss,true);assert.equal(row[0].ratio,.5);assert.equal(row[0].presentation,'boss-screen');assert(row[0].width>150&&row[0].height>=50);assert.equal(await page.locator('.enemy-health-v7[data-boss="true"]').count(),0);const box=await page.locator('#bossHealthV10').boundingBox(),canvas=await page.locator('#game').boundingBox();assert(box.x>=canvas.x&&box.x+box.width<=canvas.x+canvas.width+1);assert(box.y>=canvas.y&&box.y+box.height<=canvas.y+canvas.height+1);rows.push(row[0]);}await page.screenshot({path:path.join(out,'chefe_vida_'+device.toLowerCase()+'.png')});return rows;
  });
  await run(device+' · boss and ordinary enemies keep distinct meters and HP updates',async()=>{
   await page.evaluate(()=>{bossActor.hp=85;current.enemies=[hydrateEnemy({id:'boss_add',type:'hush',x:G.x-2,y:G.y+2})];drawEnv()});
   assert.equal(await page.locator('.enemy-health-v7').count(),1);assert.equal(await page.locator('#bossHealthV10').isVisible(),true);assert.equal(await page.evaluate(()=>ToriiEnemyHealthV7.bossSnapshot().ratio),.25);
   const before=await page.evaluate(()=>JSON.stringify({G,act,boss:bossActor.hp}));await page.evaluate(()=>{for(let i=0;i<10;i++)drawEnv()});assert.equal(await page.evaluate(()=>JSON.stringify({G,act,boss:bossActor.hp})),before);
   await page.evaluate(()=>{openSystem();drawEnv()});assert(await page.locator('#bossHealthV10').isHidden());await page.evaluate(()=>{closeOverlay();drawEnv()});assert(await page.locator('#bossHealthV10').isVisible());
   await page.evaluate(()=>{bossActor.hp=0;drawEnv()});assert(await page.locator('#bossHealthV10').isHidden());
  });
  await run(device+' · changing map removes stale meters and actor references',async()=>{await page.evaluate(()=>{setArea('studio',10.5,12.5,false);transitionAlpha=0;drawEnv()});assert.equal(await page.locator('.enemy-health-v7').count(),0);assert.deepEqual(await page.evaluate(()=>ToriiEnemyHealthV7.snapshot()),[])});
  await context.close();
 }
 assert.deepEqual(report.errors,[]);
})().catch(e=>{report.fatal=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'ENEMY_HEALTH_BROWSER.json'),JSON.stringify(report,null,2)+'\n')});
