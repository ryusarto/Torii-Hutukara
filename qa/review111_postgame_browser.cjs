/* Complete-runtime attack regression after the real campaign save.
 * Keyboard, real touch and simulated pad; fresh/reload/FileReader import, six
 * leaders. Enemy positioning is a controlled fixture; HP/damage/kills/score use
 * game actions. This is not a human campaign or physical controller test. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),progress=JSON.parse(fs.readFileSync(path.join(root,'qa/beta-1.10.1/CAMPAIGN_usina_RELOAD.json'))).save;
const input=process.argv[2]||path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html'),url=/^(file|https?):/.test(input)?input:pathToFileURL(input).href,out=path.join(root,'qa/screenshots-local/review-111');fs.mkdirSync(out,{recursive:true});
const report={version:v.numero,url,checks:[],errors:[],method:'Actual complete runtime, original completed-campaign save, real keyboard/touch and simulated pad; fixtures place one enemy in front. No direct damage/HP bypass. Not human/hardware validation.'};let browser;
function install(original){
 window.Review111={
  prepare(hero,bass){G=normalizeSave(copy(original));buildMaps();G.formation=[hero];G.active=hero;G.flags.bass=bass;menuOrigin10=menuPage10=null;mode='walk';keys={};touchDir={};attackHeld=false;__pads=[];C3.pad.pads=[];Input121.wasCoop=false;C3.coop.member=null;setArea('last_torii',13.5,13.5,false);for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';PostGame.startDungeon(42);},
  target(){const e=current.enemies[0];if(!e||e.hp<=0)throw Error('No living arena target');e.x=G.x+1.35;e.y=G.y;G.dir='right';G.aim091=[1,0];window.__reviewEnemy=e;resetMotion10();act.cool=act.dashCD=0;companionCooldown=999;Input121.focused=true;return{area:G.area,mode,ready:combatReady10(),hp:e.hp,score:PostGame.run().score,hero:G.active,bass:G.flags.bass,complete:G.c3.complete};},
  step(){let frames=0;while(__reviewEnemy.hp>0&&PostGame.active()&&frames++<600){const e=__reviewEnemy,dx=e.x-G.x,dy=e.y-G.y,d=Math.max(.001,Math.hypot(dx,dy));G.aim091=[dx/d,dy/d];G.dir=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';keys.w=d>1.7&&dy<-.15;keys.s=d>1.7&&dy>.15;keys.a=d>1.7&&dx<-.15;keys.d=d>1.7&&dx>.15;tick+=1/60;update(1/60);}keys.w=keys.s=keys.a=keys.d=false;return{frames,hp:__reviewEnemy.hp,active:PostGame.active(),area:G.area,score:PostGame.run()?.score,kills:PostGame.run()?.kills,hero:G.active,ready:combatReady10()};}
 };
}
(async()=>{browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});for(const device of ['keyboard','touch','pad']){
 const context=await browser.newContext(device==='touch'?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1280,height:800}}),page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__pads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>__pads})});await page.goto(url,{waitUntil:'load',timeout:120000});if(!report.build)report.build=await page.evaluate(()=>window.TORII_PLAYTEST_BUILD||null);await page.evaluate(install,progress);
 if(device==='keyboard'){
  await page.evaluate(()=>{Review111.prepare('franco',true);PostGame.finishRun();closeOverlay();PostGame.openTravel()});const chapters=await page.locator('[data-post-area]').evaluateAll(bs=>bs.map(b=>({area:b.dataset.postArea,text:b.textContent})));assert.deepEqual(chapters.map(c=>c.area),['city','voices','distortion_district']);assert.equal(await page.locator('#postDungeon').count(),1);report.checks.push({name:'Exactly chapter1/2/3 and dungeon destinations',passed:true,chapters});
 }
 for(const persistence of ['fresh','reload','import']){const rows=[];
  for(const hero of ['franco','ryuchi','alt','katana','synth','percussion']){
   await page.evaluate(({hero,bass})=>Review111.prepare(hero,bass),{hero,bass:persistence!=='import'});
   if(persistence==='reload'){await page.evaluate(()=>save(true));await page.reload({waitUntil:'load'});await page.evaluate(install,progress);await page.evaluate(()=>continueGame());}
   if(persistence==='import'){await page.evaluate(()=>{const serialized=JSON.stringify({progress:copy(G)});G=fresh();buildMaps();importSave(new File([serialized],'campaign-expedition.json',{type:'application/json'}))});await page.waitForFunction(h=>PostGame.active()&&G.active===h,hero,{polling:50});}
   const before=await page.evaluate(()=>Review111.target());assert(before.ready&&before.mode==='action',JSON.stringify({device,persistence,hero,before}));assert.equal(before.hero,hero);
   let cdp;
   if(device==='keyboard')await page.keyboard.down('j');
   else if(device==='touch'){cdp=await context.newCDPSession(page);const box=await page.locator('[data-mobile-action="attack"]').boundingBox();assert(box);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:box.x+box.width/2,y:box.y+box.height/2}]});}
   else await page.evaluate(()=>{const pad={index:0,id:'Review111 simulated pad',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:18},(_,i)=>({pressed:i===2,value:i===2?1:0}))};__pads=[pad];C3.pad.pads=__pads;C3.handlePrimaryPad(pad)});
   const after=await page.evaluate(()=>Review111.step());
   if(device==='keyboard')await page.keyboard.up('j');else if(device==='touch'){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()}else await page.evaluate(()=>{__pads=[];C3.pad.pads=[];Input121.padAttack=false;mergeInput121()});
   assert(after.active&&after.hp===0&&after.kills>=1&&after.score>before.score,JSON.stringify({device,persistence,hero,before,after}));rows.push({hero,before,after});
  }
  report.checks.push({name:device+' attacks after '+persistence,passed:true,rows});console.log('OK · '+device+' / '+persistence+' / six leaders');
 }
 await context.close();
}assert.deepEqual(report.errors,[]);console.log(JSON.stringify({passed:report.checks.length,actualCombatCases:54,errors:report.errors}));
})().catch(e=>{report.fatal=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'POSTGAME_BROWSER.json'),JSON.stringify(report,null,2)+'\n')});
