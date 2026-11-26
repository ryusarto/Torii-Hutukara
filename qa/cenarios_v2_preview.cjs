const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await (process.env.CHROME_PATH?chromium.launch({executablePath:process.env.CHROME_PATH,headless:true}):chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9238')),context=await browser.newContext({viewport:{width:1000,height:900}}),page=await context.newPage(),errors=[];
try{page.on('pageerror',e=>errors.push(e.message));await page.goto(process.argv[2]||'http://127.0.0.1:8769/PREVIA.html');
 const names=await page.locator('#item option').evaluateAll(options=>options.map(o=>o.value));assert.equal(names.length,126);
 for(const name of names){await page.selectOption('#item',name);await page.waitForFunction(name=>document.querySelector('#info').textContent.startsWith(name+' ·'),name)}
 await page.selectOption('#item','cloud_top_a');await page.click('#repeat');await page.waitForFunction(()=>document.querySelector('#info').textContent.startsWith('cloud_top_a ·'));
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 const out=path.join(__dirname,'cenarios-v2');await page.screenshot({path:path.join(out,'PREVIA_MOBILE.png'),fullPage:true});fs.writeFileSync(path.join(out,'PREVIA_RESULTS.json'),JSON.stringify({passed:true,items:names.length,repeat3x3:true,mobilePreview:true,browserErrors:errors},null,2)+'\n');console.log('PASS ·126 sprite selections and mobile preview');
}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
