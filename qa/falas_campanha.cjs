/* Coleta as falas obrigatórias de uma campanha completa (robô do campaign_review).
 *   ROTA=usina|canal node qa/falas_campanha.cjs [build.html] [saida.json]
 * Grava quem fala, o texto, a área e se veio do narrador. Usado para medir o
 * narrador e o tamanho dos blocos de fala na Fase 4.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const input=process.argv[2]||path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html');
const out=process.argv[3]||path.join(root,'qa/narrativa/FALAS_'+(process.env.ROTA||'usina')+'.json');
const source=fs.readFileSync(path.join(root,'qa/pace_bot.cjs'),'utf8');
let code=source.slice(source.indexOf('function installBot(){'),source.lastIndexOf('\nmain().catch'));
const review=fs.readFileSync(path.join(root,'qa/campaign_review.cjs'),'utf8');
for(const m of review.matchAll(/^code=code\.replace\(.*$/gm))eval(m[0]);
const install=Function('return '+code)();
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
  const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]});try{localStorage.clear()}catch{}});
  await page.goto((/^(file|https?):/.test(input)?input:pathToFileURL(input).href)+'?semente=1234',{waitUntil:'load',timeout:180000});
  await page.evaluate(install);await page.evaluate(r=>window.__botOpts={run:true,cps:400,rota:r},process.env.ROTA||'usina');
  await page.locator('#startNew').click();await page.locator('#dif_historia').click();await page.evaluate(()=>__bot.begin('already'));
  let st;for(let n=0;n<900;n++){st=await page.evaluate(()=>__bot.run(120));if(st.done||st.stuck||st.time>1400)break}
  const lines=await page.evaluate(()=>window.__lines||[]);
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(lines,null,1)+'\n');
  const narr=lines.filter(l=>/NARRADOR/.test(l.quem||'')).length;
  console.log(JSON.stringify({done:!!st.done,stuck:st.stuck,falas:lines.length,narrador:narr,errors:errors.slice(0,3)}));
  await browser.close();if(!st.done||errors.length)process.exitCode=1;
})();
