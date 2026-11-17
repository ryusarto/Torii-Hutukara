/* Verify the standalone asset viewer. Run with its PREVIA.html URL. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
(async()=>{
 const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),output=path.join(root,'qa',version.versao);
 const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9237'),context=await browser.newContext({viewport:{width:1100,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(process.argv[2]||'http://127.0.0.1:8768/PREVIA.html');let count=0;
 for(const hero of ['katana','alt'])for(const state of ['idle','walk','run','roll','attack_1','attack_2','attack_3','skill','advanced','signature','hurt','defeat'])for(const direction of ['down','left','up','right']){
   await page.selectOption('#hero',hero);await page.selectOption('#state',state);await page.selectOption('#direction',direction);
   await page.waitForFunction(()=>image.complete&&image.naturalWidth===2304);count++;
 }
 await page.click('#replay');await page.click('#pause');const before=await page.locator('#info').textContent();await page.waitForTimeout(150);assert.equal(before,await page.locator('#info').textContent());
 await page.click('#step');await page.waitForTimeout(50);assert.notEqual(before,await page.locator('#info').textContent());
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:path.join(output,'PREVIA_MOBILE.png'),fullPage:true});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'PREVIA_RESULTS.json'),JSON.stringify({passed:true,combinations:count,pause:true,step:true,mobileLayout:true,errors},null,2)+'\n');
 await context.close();await browser.close();console.log('Preview passed: '+count+' combinations');
})().catch(e=>{console.error(e);process.exitCode=1});
