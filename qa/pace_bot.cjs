/* Jogada automática para medir o ritmo (Fase 1).
 *   node qa/pace_bot.cjs [newGame|chapter2|chapter3] [minutosDeJogoMax]
 * Lê a build atual (web/playtest/build.json), joga seguindo o objetivo do
 * próprio jogo e grava o relatório do medidor em qa/ritmo/.
 * O tempo do jogo corre mais rápido que o real (quadros simulados).
 * Perfis (variável PERFIL): rapido = corre e lê 20 car/s; tipico = anda e lê 14 car/s.
 */
const fs=require('node:fs');const path=require('node:path');
let chromium;try{({chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core'))}catch{({chromium}=require('playwright'))}
const root=path.resolve(__dirname,'..');
const pt=JSON.parse(fs.readFileSync(path.join(root,'web/playtest/build.json'),'utf8'));
const manifestPath=path.join(root,pt.manifest);const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const build=path.join(path.dirname(manifestPath),manifest.output.file);
const start=process.argv[2]||'newGame';const maxMinutes=Number(process.argv[3]||120);
// Perfil: 'rapido' (corre, lê 20 car/s) ou 'tipico' (anda, lê 14 car/s).
const profile=process.env.PERFIL||'rapido';const opts=profile==='tipico'?{run:false,cps:14}:{run:true,cps:20};
const outDir=path.join(__dirname,'ritmo');fs.mkdirSync(outDir,{recursive:true});

async function main(){
  const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__realRAF=window.requestAnimationFrame;window.requestAnimationFrame=()=>0});
  await page.goto('file://'+build,{waitUntil:'load'});
  await page.evaluate(()=>{try{localStorage.clear()}catch{}});
  await page.evaluate(installBot);await page.evaluate(o=>{window.__botOpts=o},opts);
  await page.evaluate(s=>window.__bot.begin(s),start);
  const log=[];let lastLog=0;
  for(;;){
    const st=await page.evaluate(()=>window.__bot.run(3600)); // 60 s de jogo por lote
    if(st.events.length)log.push(...st.events);
    if(st.time-lastLog>=300){lastLog=st.time;console.log(`${(st.time/60).toFixed(1)} min · ${st.area} · ${st.mode} · ${st.objective}`)}
    if(st.done||st.stuck||st.time>maxMinutes*60){console.log(st.done?'FIM DA JORNADA':st.stuck?'PRESO: '+st.stuck:'LIMITE DE TEMPO');break}
  }
  const summary=await page.evaluate(()=>window.ToriiRitmo.summary());
  const report=await page.evaluate(()=>window.ToriiRitmo.report());
  const tag=start+'-'+profile+'-'+pt.version;
  const lines=await page.evaluate(()=>window.__lines||[]);fs.writeFileSync(path.join(outDir,`falas-${tag}.json`),JSON.stringify(lines,null,1));
  fs.writeFileSync(path.join(outDir,`bot-${tag}.txt`),summary+'\n\nEVENTOS DO ROBÔ\n'+log.join('\n')+(errors.length?'\n\nERROS\n'+errors.join('\n'):'')+'\n');
  fs.writeFileSync(path.join(outDir,`bot-${tag}.json`),JSON.stringify(report,null,1));
  console.log(summary);if(errors.length)console.log('ERROS:',errors.slice(0,5));
  await browser.close();
}

// Roda dentro da página.
function installBot(){
  const DT=1/60;let rhythmTime=0,t=1000,clock=0,readWait=0,lastWords='',attackCd=0,stuckObj='',stuckSince=0,interactCd=0,lastPos=null,noMove=0,events=[],wander=null,doneFlag=false;
  const say=m=>events.push(`[${(clock/60).toFixed(1)} min] ${m}`);
  const held=new Set();
  const press=(dirs)=>{for(const k of ['w','a','s','d','shift'])keys[k]=dirs.includes(k);};
  const release=()=>press([]);
  function bfs(a,sx,sy,gx,gy){
    const w=a.w,h=a.h,S=[Math.floor(sx),Math.floor(sy)],goal=[Math.floor(gx),Math.floor(gy)];
    const ok=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&tileWalkable(a,x+.5,y+.5);
    const q=[S],seen=new Map([[S.join(','),null]]);let found=null;
    for(let i=0;i<q.length&&i<20000;i++){const [x,y]=q[i];if(Math.abs(x-goal[0])+Math.abs(y-goal[1])<=1){found=[x,y];break}
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&ok(nx,ny)){seen.set(k,[x,y]);q.push([nx,ny])}}}
    if(!found)return null;const path=[];let c=found;while(c){path.push(c);c=seen.get(c.join(','))}return path.reverse();
  }
  function steer(tx,ty){
    let path=bfs(current,G.x,G.y,tx,ty),nx=tx,ny=ty;
    if(path&&path.length>2){const p=path[Math.min(2,path.length-1)];nx=p[0]+.5;ny=p[1]+.5}
    const dx=nx-G.x,dy=ny-G.y,dirs=(window.__botOpts||{run:true}).run?['shift']:[];
    if(dx>.15)dirs.push('d');else if(dx<-.15)dirs.push('a');
    if(dy>.15)dirs.push('s');else if(dy<-.15)dirs.push('w');
    press(dirs);return Math.hypot(tx-G.x,ty-G.y);
  }
  function aliveEnemies(){let list=[];try{list=enemyActors().filter(e=>e.hp>0)}catch{}
    if(typeof bossActor!=='undefined'&&bossActor&&bossActor.hp>0)list.push(bossActor);
    try{if(window.C3&&C3.boss&&C3.boss.hp>0)list.push(C3.boss)}catch{}return list}
  function handleOverlay(){
    const ov=document.getElementById('overlay');if(!ov||ov.classList.contains('hidden'))return closeOverlay();
    const buttons=[...ov.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent!==null);
    const text=ov.innerText.slice(0,80).replace(/\s+/g,' ');
    // puzzles conhecidos (solução que uma pessoa leria na tela)
    const vnotes=ov.querySelectorAll('[data-vnote]');
    if(vnotes.length){const seq=[0,2,0];window.__lumiStep=(window.__lumiStep||0);const n=seq[window.__lumiStep%3];window.__lumiStep++;
      const b=ov.querySelector(`[data-vnote="${n}"]`);say('Puzzle Lumi → nota '+n);b.click();return}
    // derrota: voltar ao checkpoint
    const retry=buttons.find(b=>/checkpoint|tentar|continuar|voltar ao/i.test(b.textContent));
    if(/derrot|caiu|silêncio venceu|game over/i.test(ov.innerText)&&retry){say('Derrota → '+retry.textContent.trim());retry.click();return}
    // escolhas/puzzles: clicar opções não usadas até fechar
    const pick=buttons.find(b=>!b.__botClicked&&!/fechar|voltar|sair|cancel|exportar|importar|apagar|menu/i.test(b.textContent));
    if(pick){pick.__botClicked=true;say('Overlay "'+text+'" → '+pick.textContent.trim().slice(0,40));pick.click();return}
    say('Overlay sem opção útil, fechando: '+text);closeOverlay();
  }
  function frame(){
    clock+=DT;t+=DT*1000;attackCd-=DT;interactCd-=DT;
    if(mode!=='rhythm')rhythmTime=0;
    if(mode==='dialogue'){release();const w=document.getElementById('words').textContent;
      if(w!==lastWords){lastWords=w;(window.__lines||(window.__lines=[])).push({min:+(clock/60).toFixed(2),area:G.area,etapa:(()=>{try{return objectiveData().text}catch{return '?'}})(),quem:document.getElementById('speaker').textContent,texto:w});readWait=.6+w.length/((window.__botOpts||{cps:20}).cps);if(clock-stuckSince>120&&!(window.__seen||(window.__seen=new Set())).has(w)){window.__seen.add(w);say('Fala (preso): '+w.slice(0,140))}}
      readWait-=DT;if(readWait<=0){lastWords='';advanceDialogue()}}
    else if(mode==='overlay'){release();if(interactCd<=0){interactCd=.8;handleOverlay()}}
    else if(mode==='rhythm'){release();rhythmTime+=DT;if(rhythmTime>2.2&&interactCd<=0){interactCd=.55;try{rhythmPush(targetPattern[rhythmInput.length])}catch(e){say('Ritmo: '+e.message)}}}
    else if(mode==='action'){
      const foes=aliveEnemies();
      if(foes.length){foes.sort((a,b)=>Math.hypot(a.x-G.x,a.y-G.y)-Math.hypot(b.x-G.x,b.y-G.y));const e=foes[0];const d=Math.hypot(e.x-G.x,e.y-G.y);
        if(e.wind>0&&d<2.2&&attackCd<0){dodgeAction();attackCd=.3}
        else if(d>1.6)steer(e.x,e.y);else{release();G.aim091=[(e.x-G.x)/d,(e.y-G.y)/d];if(attackCd<0){attackAction();attackCd=.28;if(Math.random()<.08)skillAction()}}}
      else steer(G.x+Math.sin(clock),G.y+Math.cos(clock));
    }
    else if(mode==='walk'){
      const o=navigationTarget();const d=o&&o.area===G.area?steer(o.x,o.y):99;
      if(d<1.6&&interactCd<=0){const near=nearestInteraction();const v=near&&near.value;const onTarget=v&&Math.hypot(v.x-o.x,v.y-o.y)<1.3;
        if(onTarget||d<.45){interactCd=.7;release();interact()}}
      const pos=G.area+Math.round(G.x*4)+','+Math.round(G.y*4);if(pos===lastPos)noMove+=DT;else noMove=0;lastPos=pos;
      if(noMove>3&&interactCd<=0){interactCd=1;interact()}
    }
    loop(t);
  }
  window.__bot={
    begin(s){if(s==='chapter2')startChapterTwoPreview();else if(s==='chapter3')C3.start(true);else newGame();say('Início: '+s)},
    run(n){events=[];let stuck=null;
      for(let i=0;i<n;i++){frame();
        const obj=(()=>{try{return objectiveData().text}catch{return '?'}})();
        if(obj!==stuckObj){stuckObj=obj;stuckSince=clock;say('Objetivo: '+obj)}
        if(clock-stuckSince>480){stuck=`objetivo parado há 8 min: "${obj}" em ${G.area} (${G.x.toFixed(1)},${G.y.toFixed(1)}) modo ${mode}`;break}
        const fin=(G.c3&&G.c3.complete)||(G.flags&&G.flags.c3Complete);if(fin){doneFlag=true;break}
      }
      let objective='?';try{objective=objectiveData().text}catch{}
      return {time:clock,area:G&&G.area,mode,objective,events,stuck,done:doneFlag};
    }
  };
}
main().catch(e=>{console.error(e);process.exit(1)});
