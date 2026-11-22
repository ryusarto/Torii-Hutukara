/* Meta de dificuldade da Fase 2, medida pelo bot simples.
 *   node qa/dificuldade_bot.cjs [lutasPorChefe=10] [níveis=normal,historia]
 * O bot é o mesmo jogador simples da jogada automática (qa/pace_bot.cjs):
 * vai até o inimigo mais perto, bate, esquiva quando vê um preparo de perto,
 * usa fita de cura abaixo de 35% e às vezes solta uma técnica.
 * Cada luta começa do estado real da campanha no Normal, gravado pela
 * jogada automática na primeira vez que cada chefe apareceu
 * (qa/dificuldade/ESTADOS_CHEFES.json).
 *
 * Meta: no Normal o bot perde de 20% a 40% das lutas contra chefes.
 * Fora da faixa, o CI avisa (anotação ::warning) sem reprovar o PR;
 * META_ESTRITA=1 transforma o aviso em falha.
 * Grava qa/dificuldade/META.json e META.txt.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const build=process.env.BUILD||path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html');
const url=/^(file|https?):/.test(build)?build:pathToFileURL(build).href;
const N=Number(process.argv[2]||10);
const NIVEIS=(process.argv[3]||'normal,historia').split(',');
const FAIXA=[.2,.4];
const out=path.join(root,'qa/dificuldade');fs.mkdirSync(out,{recursive:true});
const estados=JSON.parse(fs.readFileSync(path.join(out,'ESTADOS_CHEFES.json'),'utf8'));
const CHEFES=[['boss','O Viajante'],['voice_boss','Arauto'],['c3_metronome','O Metrônomo'],['c3_silence','O Silêncio']];

function instalar(){
  const DT=1/60;let t=2e4;
  // Simula sem desenhar (o combate vive em update); DESENHAR=1 usa o laço completo.
  const desenhar=!!window.__desenhar;const frame=()=>{t+=DT*1000;if(desenhar)loop(t);else{tick+=DT;update(DT)}};
  const keysDir=['w','a','s','d','shift'];
  const press=d=>{for(const k of keysDir)keys[k]=d.includes(k)};
  function steer(tx,ty){
    const dx=tx-G.x,dy=ty-G.y,d=['shift'];
    if(dx>.15)d.push('d');else if(dx<-.15)d.push('a');if(dy>.15)d.push('s');else if(dy<-.15)d.push('w');press(d);
  }
  let derrota=false;const derrotaAntes=showDefeat;showDefeat=function(...a){derrota=true;return derrotaAntes.apply(this,a)};
  function preparar(id,registro,nivel){
    derrota=false;try{closeOverlay()}catch{}
    if(bossActor){bossActor=null;battle=null}
    G=normalizeSave(copy(registro.estado));buildMaps();G.difficulty=nivel;
    for(const k in G.maxhp)if(G.maxhp[k])G.hp[k]=G.maxhp[k];
    G.potions=Math.max(G.potions||0,registro.estado.potions||0);
    setArea(registro.area,registro.x,registro.y,false);
    for(let i=0;i<200&&mode==='dialogue';i++)advanceDialogue();try{closeOverlay()}catch{}
    mode='walk';hostileShots.length=0;projectiles.length=0;
    if(id==='boss')spawnBossFight();else if(id==='voice_boss')spawnVoiceBoss();
    else if(id==='c3_metronome')C3.spawnMetronome();else if(id==='c3_silence')C3.spawnSilence();
    for(let i=0;i<200&&mode==='dialogue';i++)advanceDialogue();
    return bossActor;
  }
  function lutar(id,registro,nivel,maxSeg){
    const alvo=preparar(id,registro,nivel);if(!alvo)return {erro:'chefe não apareceu'};
    let tempo=0,attackCd=0,interactCd=0,fitas=0;const equipe=()=>Object.keys(G.maxhp).filter(k=>G.maxhp[k]&&partyMembers().includes(k));
    const vida0=equipe().reduce((a,k)=>a+G.hp[k],0);
    while(tempo<maxSeg){
      if(derrota)break;
      if(alvo.hp<=0||(id==='c3_silence'&&C3.finalPending))break;
      if(mode==='dialogue'){advanceDialogue();continue}
      if(mode==='overlay'&&!bossActor)break;
      tempo+=DT;attackCd-=DT;interactCd-=DT;
      if(mode==='action'){
        try{const f=fighterName();if(G.potions>0&&G.hp[f]<G.maxhp[f]*.35&&window.ToriiCura&&interactCd<=0){interactCd=1.3;ToriiCura.useTape();fitas++}}catch{}
        let foes=[];try{foes=enemyActors().filter(e=>e.hp>0)}catch{}
        if(bossActor&&bossActor.hp>0)foes.push(bossActor);
        if(foes.length){foes.sort((a,b)=>Math.hypot(a.x-G.x,a.y-G.y)-Math.hypot(b.x-G.x,b.y-G.y));const e=foes[0],d=Math.hypot(e.x-G.x,e.y-G.y);
          if(e.wind>0&&d<2.2&&attackCd<0){dodgeAction();attackCd=.3}
          else if(d>1.6)steer(e.x,e.y);
          else{press([]);G.aim091=[(e.x-G.x)/d,(e.y-G.y)/d];if(attackCd<0){attackAction();attackCd=.28;if(Math.random()<.08)skillAction()}}}
        else press([]);
      }else press([]);
      frame();
    }
    press([]);
    const venceu=!derrota&&(alvo.hp<=0||(id==='c3_silence'&&!!C3.finalPending));
    const vida1=equipe().reduce((a,k)=>a+Math.max(0,G.hp[k]),0);
    const r={venceu,tempo:+tempo.toFixed(1),vidaChefe:Math.max(0,alvo.hp),max:alvo.max,fases:alvo.f2?alvo.f2.fase:(alvo.phase||1),
      danoEquipe:Math.round(100*(1-vida1/Math.max(1,vida0))),fitas,esgotou:!venceu&&!derrota};
    if(bossActor){bossActor=null;battle=null}C3.finalPending=false;derrota=false;try{closeOverlay()}catch{}
    return r;
  }
  window.__meta={lutar};
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
  const resultado={build:v.versao,data:new Date().toISOString(),lutasPorChefe:N,faixa:FAIXA,niveis:{}};
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}});const erros=[];page.on('pageerror',e=>erros.push(e.message));
    await page.addInitScript(()=>{try{localStorage.clear()}catch{};window.requestAnimationFrame=()=>0});
    await page.goto(url+(url.includes('?')?'&':'?')+'semente=2026',{waitUntil:'load',timeout:180000});
    if(process.env.DESENHAR)await page.evaluate(()=>{window.__desenhar=true});
    await page.evaluate(instalar);
    // AJUSTE='{"boss":0.8}' testa outro dano por chefe sem gerar a build de novo.
    if(process.env.AJUSTE)await page.evaluate(j=>{for(const [id,d] of Object.entries(JSON.parse(j)))ToriiDificuldade.AJUSTE_CHEFE[id].dano=d},process.env.AJUSTE);
    for(const nivel of NIVEIS){
      const porChefe={};
      for(const [id,nome] of CHEFES){
        if(!estados[id]){porChefe[id]={nome,erro:'sem estado gravado'};continue}
        const lutas=[];
        for(let i=0;i<N;i++){
          const r=await page.evaluate(([id,reg,nivel])=>window.__meta.lutar(id,reg,nivel,420),[id,estados[id],nivel]);
          lutas.push(r);
        }
        const derrotas=lutas.filter(l=>!l.venceu).length;
        const media=k=>+(lutas.reduce((a,l)=>a+(l[k]||0),0)/lutas.length).toFixed(1);
        porChefe[id]={nome,lutas:lutas.length,derrotas,taxa:+(derrotas/lutas.length).toFixed(2),tempoMedio:media('tempo'),
          tempoVitoria:+(lutas.filter(l=>l.venceu).reduce((a,l)=>a+l.tempo,0)/Math.max(1,lutas.filter(l=>l.venceu).length)).toFixed(1),
          vidaChefe:lutas[0]?.max,danoEquipe:media('danoEquipe'),fitas:media('fitas'),esgotou:lutas.filter(l=>l.esgotou).length,lutasDetalhe:lutas};
        console.log(`${nivel.padEnd(8)} ${nome.padEnd(13)} derrotas ${derrotas}/${lutas.length} · vitória em ${porChefe[id].tempoVitoria}s · vida ${porChefe[id].vidaChefe}`);
      }
      const todas=Object.values(porChefe).filter(c=>c.lutas);
      const total=todas.reduce((a,c)=>a+c.lutas,0),derrotas=todas.reduce((a,c)=>a+c.derrotas,0);
      resultado.niveis[nivel]={taxa:+(derrotas/Math.max(1,total)).toFixed(3),derrotas,lutas:total,chefes:porChefe};
    }
    resultado.erros=erros;
  }finally{await browser.close()}
  const n=resultado.niveis.normal;
  const linhas=[`META DE DIFICULDADE · ${resultado.build} · ${resultado.data}`,`Bot simples, ${N} lutas por chefe, a partir do estado real da campanha.`,''];
  for(const [nivel,r] of Object.entries(resultado.niveis)){
    linhas.push(`${nivel.toUpperCase()} · derrotas ${r.derrotas}/${r.lutas} (${Math.round(r.taxa*100)}%)`);
    for(const c of Object.values(r.chefes))linhas.push(`  ${c.nome.padEnd(13)} ${c.erro||`${c.derrotas}/${c.lutas} derrotas · vitória média em ${c.tempoVitoria}s · vida ${c.vidaChefe} · equipe perdeu ${c.danoEquipe}% · ${c.fitas} fitas`}`);
    linhas.push('');
  }
  let ok=true;
  if(n){ok=n.taxa>=FAIXA[0]&&n.taxa<=FAIXA[1];linhas.push(`Meta do Normal (${FAIXA[0]*100}%–${FAIXA[1]*100}% de derrotas): ${ok?'DENTRO':'FORA'} (${Math.round(n.taxa*100)}%).`)}
  resultado.dentroDaMeta=ok;
  fs.writeFileSync(path.join(out,'META.json'),JSON.stringify(resultado,null,1)+'\n');
  fs.writeFileSync(path.join(out,'META.txt'),linhas.join('\n')+'\n');
  console.log(linhas.join('\n'));
  if(resultado.erros?.length){console.error('Erros na página:',resultado.erros.slice(0,5));process.exitCode=1}
  if(n&&!ok){
    console.log(`::warning title=Meta de dificuldade fora da faixa::No Normal o bot simples perdeu ${Math.round(n.taxa*100)}% das lutas contra chefes (meta ${FAIXA[0]*100}%–${FAIXA[1]*100}%). Ajuste AJUSTE_CHEFE em game/source/chapter-03/dificuldade_v1.js.`);
    if(process.env.META_ESTRITA)process.exitCode=1;
  }
})().catch(e=>{console.error(e);process.exitCode=1});
