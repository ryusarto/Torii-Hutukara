'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--disable-gpu']});const out='qa/beta-1.25.0/ui7-new-games';const results=[];
try{for(const device of [{name:'pc',width:1280,height:800},{name:'vertical',width:390,height:844,mobile:true},{name:'horizontal',width:844,height:390,mobile:true}]){
 const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:!!device.mobile,hasTouch:!!device.mobile}),page=await context.newPage();page.setDefaultTimeout(15000);
 await page.goto(process.argv[2]+(device.mobile?'&input=mobile':''),{waitUntil:'load'});await page.locator('#playtestEntry').waitFor({state:'detached'});
 if(process.env.INJECT_CSS==='1')await page.addStyleTag({content:fs.readFileSync('game/source/chapter-03/ui7_new_games_v1.css','utf8')});
 await page.evaluate(()=>{G=fresh();buildMaps();G.c3=G.c3||{};G.c3.started=true;mode='walk';setArea('power_plant',13.5,13.5,false);$('start').classList.add('hidden');Input121.focused=true;window.__finish124=false;PlantSequencer.open(()=>window.__finish124=true)});
 await page.locator('#plantReference').click();
 const order=await page.evaluate(()=>{const profile=el=>[...el.querySelectorAll('.plant-wave i')].map(i=>i.style.getPropertyValue('--level')).join('');const pieces=[...document.querySelectorAll('[data-plant-beat]')];return [...document.querySelectorAll('#plantReferenceSteps li')].map(el=>pieces.findIndex(p=>profile(p)===profile(el)))});
 for(const n of order)await page.keyboard.press(String(n+1));await page.waitForTimeout(80);
 const metrics=await page.evaluate(()=>{const root=$('overlayInner').getBoundingClientRect(),board=$('plantSequencer').querySelector('.plant-board'),footer=$('plantSequencer').querySelector('.plant-actions').getBoundingClientRect();return {root:{top:root.top,bottom:root.bottom},footer:{top:footer.top,bottom:footer.bottom},board:{height:board.clientHeight,scroll:board.scrollHeight},viewport:innerHeight,buttons:[...document.querySelectorAll('.plant-actions button')].map(b=>({id:b.id,h:b.getBoundingClientRect().height}))}});
 assert(metrics.footer.top>=metrics.root.top&&metrics.footer.bottom<=metrics.root.bottom+1,JSON.stringify(metrics));assert(metrics.root.bottom<=metrics.viewport+1);assert(metrics.buttons.every(b=>b.h>=44));
 await page.screenshot({path:path.join(out,'plant_'+device.name+'.png')});await page.locator('#plantApply').click();assert(await page.evaluate(()=>__finish124));
 results.push({device:device.name,metrics});console.log('OK',device.name,JSON.stringify(metrics));await context.close();
}fs.writeFileSync(path.join(out,'plant-layout-report.json'),JSON.stringify({passed:true,injected:process.env.INJECT_CSS==='1',results},null,2)+'\n')}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
