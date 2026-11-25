/* Chrome mobile, cache frio e rede 4G simulada.
 * node qa/carregamento_site.cjs [url] [evidencia.json] [url de comparação]
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const [url='http://127.0.0.1:8794/',out,baseline]=process.argv.slice(2);
const mbps=Number(process.env.MBPS||12),rttMs=Number(process.env.RTT||70),windowMs=16000;

async function measure(browser,url){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',res=>{if(res.status()>=400)errors.push(res.status()+' '+res.url())});
  const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:rttMs,downloadThroughput:mbps*125000,uploadThroughput:3*125000});
  const transfers=[],requested=new Map();
  cdp.on('Network.requestWillBeSent',e=>requested.set(e.requestId,e.request.url));
  cdp.on('Network.loadingFinished',e=>{if(/^https?:/.test(requested.get(e.requestId)||''))transfers.push({url:requested.get(e.requestId),bytes:e.encodedDataLength,at:performance.now()})});
  const started=performance.now();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#startNew').waitFor({state:'visible'});
  const titleMs=Math.round(performance.now()-started),titleBytes=transfers.reduce((n,r)=>n+r.bytes,0);
  await page.locator('#startNew').tap();
  await page.locator('#dif_historia').tap();
  const enterWalk=page.waitForFunction(()=>{
   if(mode==='dialogue')advanceDialogue();
   return mode==='walk'&&G?.area==='studio';
  },null,{polling:250,timeout:25000}).then(()=>Math.round(performance.now()-started));
  const studioWalkMs=await enterWalk;
  const studioArt=page.waitForFunction(()=>{
   const hero=ProtagonistArtV5.images.franco_idle;
   return hero?.complete&&hero.naturalWidth>0&&['sofa_vertical','plant_potted'].every(key=>{
    const image=WorldPolishV1.images[key];
    return image?.complete&&image.naturalWidth>0;
   });
  },null,{polling:250,timeout:35000}).then(()=>Math.round(performance.now()-started));
  await page.waitForTimeout(Math.max(0,windowMs-(performance.now()-started)));
  const used=transfers.filter(r=>r.at-started<=windowMs);
  const state=await page.evaluate(()=>({version:window.ToriiPlaytest?.version,sourceSha256:window.ToriiPlaytest?.sourceSha256,
   area:G.area,mobile:Input121.mobile,c3Started:!!C3.deferredStarted,media:window.ToriiMedia?.stats()}));
  return {url,titleMs,titleBytes,studioWalkMs,studioArtMs:await studioArt,windowMs,
   bytes:used.reduce((n,r)=>n+r.bytes,0),requests:used.length,errors,...state,
   largest:used.sort((a,b)=>b.bytes-a.bytes).slice(0,10).map(({url,bytes})=>({url,bytes}))};
 }finally{await context.close()}
}

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  const samples=[];
  for(const input of [baseline,url].filter(Boolean))samples.push(await measure(browser,input));
  const result={network:{mbps,rttMs},samples};
  if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
  const build=samples.at(-1);
  assert.deepEqual(build.errors,[]);
  assert.equal(build.area,'studio');
  assert(build.mobile);
  assert(!build.c3Started);
  assert(build.titleMs<5000);
  if(baseline)assert(build.bytes<samples[0].bytes,'A transferência inicial deve cair');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
