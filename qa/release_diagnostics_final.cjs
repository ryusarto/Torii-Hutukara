'use strict';
// Verify optional local diagnostics against the shipped runtime and storage.
const {chromium,webkit}=require('playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.argv[2];if(!/^https?:/.test(url||''))throw Error('Pass an HTTP build URL');
const engine=process.env.BROWSER_ENGINE||'chromium',out=process.env.DIAGNOSTICS_FINAL_OUT||path.join(__dirname,'release-diagnostics','BROWSER.json');
const report={url,engine,injected:false,checks:[],errors:[]};let browser;
async function check(name,fn){const detail=await fn();report.checks.push({name,passed:true,detail});console.log('PASS '+name)}
(async()=>{
 browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('torii_hutukara_ritmo_v1','{"sessions":{}}');window.__diagnosticWrites=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,...args){if(k==='torii_hutukara_ritmo_v1')__diagnosticWrites++;return original.call(this,k,...args)}});
 await page.goto(url+(url.includes('?')?'&':'?')+'qa-extra=1&ritmo-off=1',{waitUntil:'load',timeout:180000});report.source=await page.evaluate(()=>TORII_PLAYTEST_BUILD.sourceSha256);if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.source,process.env.EXPECTED_SOURCE_SHA);
 await page.locator('#startNew').click();await page.locator('#dif_historia').click();await page.evaluate(()=>FinalAssetLoadingV1.ready());
 await page.waitForTimeout(5500);
 await check('Normal launch neither records nor writes diagnostic sessions',async()=>{const r=await page.evaluate(()=>({area:G.area,enabled:ToriiRitmo.enabled(),session:ToriiRitmo.current(),writes:__diagnosticWrites,debug:typeof window.__toriiAlphaDebug}));assert.equal(r.area,'studio');assert.equal(r.enabled,false);assert.equal(r.session,null);assert.equal(r.writes,0);assert.equal(r.debug,'undefined');return r});
 await check('Explicit diagnostics recover corrupt local data and record the real loop',async()=>{await page.evaluate(()=>ToriiRitmo.enable());await page.waitForTimeout(250);const r=await page.evaluate(()=>({enabled:ToriiRitmo.enabled(),total:ToriiRitmo.current().total,writes:__diagnosticWrites,sessions:ToriiRitmo.report().sessions.length,summary:ToriiRitmo.summary()}));assert(r.enabled&&r.total>0&&r.writes>0);assert.equal(r.sessions,1);assert.match(r.summary,/RELATÓRIO DE RITMO/);return r});
 await page.goto(url+(url.includes('?')?'&':'?')+'qa&ritmo',{waitUntil:'load',timeout:180000});
 await check('QA entry points and rhythm button require explicit URL options',async()=>{const r=await page.evaluate(()=>({debug:typeof window.__toriiAlphaDebug?.warp,enabled:ToriiRitmo.enabled(),button:!!document.getElementById('ritmoButton')}));assert.equal(r.debug,'function');assert(r.enabled&&r.button);return r});
 assert.deepEqual(report.errors,[]);
})().catch(e=>{report.failure=e.stack;process.exitCode=1;console.error(e)}).finally(async()=>{await browser?.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks.length,errors:report.errors,failure:report.failure||null}));});
