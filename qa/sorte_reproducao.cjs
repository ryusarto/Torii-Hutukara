/* A mesma semente reproduz a mesma campanha (Fase 0).
 *   node qa/sorte_reproducao.cjs [build.html]
 * Joga a campanha inteira com o robô (rota usina) duas vezes com ?semente=1234 e uma
 * com ?semente=99, e compara o save final, o número de sorteios e as lutas.
 * Também grava a taxa de derrota do robô (derrotas por luta de chefe e por área).
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const input=process.argv[2]||path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html');
const base=/^(file|https?):/.test(input)?input:pathToFileURL(input).href;
const source=fs.readFileSync(path.join(root,'qa/pace_bot.cjs'),'utf8');
let code=source.slice(source.indexOf('function installBot(){'),source.lastIndexOf('\nmain().catch'));
// Mesmas regras do qa/campaign_review.cjs (o robô que zera a campanha no CI).
const review=fs.readFileSync(path.join(root,'qa/campaign_review.cjs'),'utf8');
for(const m of review.matchAll(/^code=code\.replace\(.*$/gm))eval(m[0]);
const install=Function('return '+code)();
async function campaign(browser,seed){
  const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]});try{localStorage.clear()}catch{}});
  await page.goto(base+(base.includes('?')?'&':'?')+'semente='+seed,{waitUntil:'load',timeout:180000});
  await page.evaluate(install);await page.evaluate(()=>{
    // Decoding audio depends on wall time, while this test compares simulation ticks.
    // The puzzles remain playable through their visual cues.
    audioMuted=true;
    window.__botOpts={run:true,cps:400,rota:'usina'};
  });
  // Conta derrotas: o jogo chama gameOver/derrota ao zerar a equipe.
  await page.evaluate(()=>{window.__derrotas=[];for(const name of ['showDefeat']){if(typeof window[name]==='function'){const f=window[name];window[name]=function(...a){__derrotas.push({area:G.area,boss:!!(window.bossActor||current.enemies?.some(e=>e.boss))});return f.apply(this,a)}}}});
  await page.locator('#startNew').click();await page.locator('#dif_historia').click();await page.evaluate(()=>__bot.begin('already'));
  let st;for(let n=0;n<900;n++){st=await page.evaluate(()=>__bot.run(120));if(st.done||st.stuck||st.time>1400)break}
  const result=await page.evaluate(()=>({seed:ToriiSorte.semente(),fixa:ToriiSorte.fixa(),usos:ToriiSorte.usos(),
    save:JSON.stringify({hp:G.hp,xp:G.xp,levels:G.levels,defeated:[...G.defeated].sort(),potions:G.potions,shards:G.shards,resonance:G.resonance,area:G.area}),derrotas:window.__derrotas}));
  await page.close();return{...result,done:!!st.done,stuck:st.stuck,time:Math.round(st.time),errors};
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
  try{
    const a=await campaign(browser,1234),b=await campaign(browser,1234),c=await campaign(browser,99);
    const report={build:path.basename(input),a,b,c,checks:{
      sementeAplicada:a.seed===1234&&a.fixa,
      mesmaSementeMesmoJogo:a.save===b.save&&a.usos===b.usos&&a.time===b.time,
      sementeDiferenteSorteiosDiferentes:c.usos!==a.usos||c.save!==a.save,
      campanhaCompleta:a.done&&b.done&&c.done,
      semErros:!a.errors.length&&!b.errors.length&&!c.errors.length}};
    report.taxaDerrotaRobo={campanhas:3,derrotas:a.derrotas.length+b.derrotas.length+c.derrotas.length,porCampanha:+((a.derrotas.length+b.derrotas.length+c.derrotas.length)/3).toFixed(2)};
    const out=path.join(root,'qa/sorte');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'REPRODUCAO.json'),JSON.stringify(report,null,1)+'\n');
    console.log(JSON.stringify({checks:report.checks,usos:[a.usos,b.usos,c.usos],tempo:[a.time,b.time,c.time],derrotas:report.taxaDerrotaRobo,errors:[...a.errors,...b.errors,...c.errors].slice(0,3)}));
    if(Object.values(report.checks).some(x=>!x))process.exitCode=1;
  }finally{await browser.close()}
})();
