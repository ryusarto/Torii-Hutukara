/* Mede o carregamento do site com rede de celular simulada (4G: 12 Mbps, 70 ms).
 *   node qa/carregamento_site.cjs http://127.0.0.1:8771/ [saida.json]
 * Marca: tela de título pronta, e estúdio com todas as imagens que ele desenha carregadas.
 * Falha se houver erro de página, se o título passar de LIMITE_TITULO_S (padrão 5 s)
 * ou se o estúdio não ficar completo.
 */
'use strict';
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8771/',out=process.argv[3];
const MBPS=Number(process.env.MBPS||12),RTT=Number(process.env.RTT||70),LIMIT=Number(process.env.LIMITE_TITULO_S||5);
(async()=>{
  const browser=await chromium.launch();const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await ctx.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:RTT,downloadThroughput:MBPS*125000,uploadThroughput:3*125000});
  let bytes=0;cdp.on('Network.loadingFinished',e=>{bytes+=e.encodedDataLength});
  await page.addInitScript(()=>{window.__created=new Set();const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,get(){return d.get.call(this)},set(v){const m=String(v).match(/media\/[0-9a-f]{64}\.[a-z0-9]+/);if(m)__created.add(m[0]);d.set.call(this,v)}})});
  const t0=Date.now();const at=()=>((Date.now()-t0)/1000);
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:600000});
  await page.locator('#startNew').waitFor({state:'visible',timeout:600000});
  const title={s:at(),mb:bytes/1e6};
  await page.locator('#startNew').click();
  await page.locator('#dif_historia').click();
  // Arquivos usados no título e no estúdio (web/playtest/media_priority.json), pelo nome
  // no site (o build-info.json liga o nome novo ao original). Mede quando chegou o último.
  const info=await (await fetch(new URL('build-info.json',url))).json();
  const prio=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../web/playtest/media_priority.json'),'utf8'));
  const back=new Map(Object.entries(info.assets).map(([file,a])=>[a.from||file,file]));
  const need=prio.ordem.filter(f=>['titulo','studio'].includes(prio.area[f])).map(f=>back.get(f)).filter(Boolean);
  await page.evaluate(l=>window.__limite=l,Number(process.env.LIMITE_ESTUDIO_MS||600000));
  const studio=await page.evaluate(async need=>{const t=performance.now();for(;;){
    if(typeof mode!=='undefined'&&mode==='dialogue'&&typeof advanceDialogue==='function')advanceDialogue();
    const done=new Map(performance.getEntriesByType('resource').filter(e=>e.responseEnd>0).map(e=>[new URL(e.name).pathname.replace(/^.*\/(media\/)/,'$1'),e.responseEnd]));
    // Só conta o que o jogo de fato criou nesta abertura (o resto do estúdio nasce mais tarde).
        if(!window.__walk&&typeof mode!=='undefined'&&mode==='walk'&&G.area==='studio')window.__walk=performance.now();
    if(window.__walk&&performance.now()-window.__walk>4000&&!window.__need){window.__need=need.filter(f=>f.endsWith('.mp3')?done.has(f):window.__created.has(f));}
    if(window.__need&&window.__need.every(f=>done.has(f))){need=window.__need;return{files:need.length,de:24,lastMs:Math.round(Math.max(...need.map(f=>done.get(f))))}}
    if(performance.now()-t>Number(window.__limite||600000))return{timeout:true,files:need.length,missing:need.filter(f=>!done.has(f))};
    await new Promise(r=>setTimeout(r,200))}},need);
  studio.s=studio.lastMs/1000;studio.mb=bytes/1e6;
  const result={url,network:{mbps:MBPS,rttMs:RTT},title,studio,media:await page.evaluate(()=>window.ToriiMedia?ToriiMedia.stats():null),errors};
  console.log(JSON.stringify(result));if(out)fs.writeFileSync(out,JSON.stringify(result,null,1)+'\n');
  await browser.close();if(errors.length||studio.timeout||title.s>LIMIT)process.exitCode=1;
})();
