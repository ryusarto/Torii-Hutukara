/* Laboratório de combate: chefes (sorteio × padrão × misto) e inimigos novos.
 *   node qa/combat_lab.cjs [lutasPorCaso=8]
 * Grava qa/combate/RESULTADOS.json e RESULTADOS.txt.
 * Jogador "reativo" só desvia ao ver o aviso; "aprendiz" conhece a sequência
 * esperada e se posiciona antes (mede se o padrão recompensa quem aprende).
 */
const fs=require('node:fs');const path=require('node:path');
let chromium;try{({chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core'))}catch{({chromium}=require('playwright'))}
const root=path.resolve(__dirname,'..');
const pt=JSON.parse(fs.readFileSync(path.join(root,'web/playtest/build.json'),'utf8'));
const mp=path.join(root,pt.manifest);const build=path.join(path.dirname(mp),JSON.parse(fs.readFileSync(mp,'utf8')).output.file);
const N=Number(process.argv[2]||8);const ONLY=process.argv[3]?process.argv[3].split(','):null;const out=path.join(__dirname,'combate');fs.mkdirSync(out,{recursive:true});

function lab(){
  const DT=1/60;let t=5000;
  const frame=()=>{t+=DT*1000;loop(t)};
  const team=()=>(G.formation&&G.formation.length?G.formation:['franco','ryuchi']).filter(k=>G.maxhp[k]);
  const hpSum=()=>team().reduce((a,k)=>a+Math.max(0,G.hp[k]),0);
  function press(dirs){for(const k of ['w','a','s','d','shift'])keys[k]=dirs.includes(k)}
  function steerTo(x,y){const dx=x-G.x,dy=y-G.y,d=[];if(dx>.2)d.push('d');else if(dx<-.2)d.push('a');if(dy>.2)d.push('s');else if(dy<-.2)d.push('w');press(d);return Math.hypot(dx,dy)}
  function spot(x,y){return tileWalkable(current,x,y)&&tileWalkable(current,x+.3,y)&&tileWalkable(current,x-.3,y)}
  // Posição segura contra um ataque de chefe conhecido.
  function safeSpot(e,kind){
    const a=Math.atan2(G.y-e.y,G.x-e.x);const cand=[];
    if(kind==='ring'||kind==='pulse')for(let k=0;k<8;k++){const r=e.type==='boss'?4.4:3.0;cand.push([e.x+Math.cos(a+k*.8)*r,e.y+Math.sin(a+k*.8)*r])}
    else if(kind==='cross')for(const k of [.785,2.36,3.93,5.5]){cand.push([e.x+Math.cos(k)*3,e.y+Math.sin(k)*3])}
    else if(kind==='fan')for(const s of [1.6,-1.6,2.4,-2.4]){cand.push([e.x+Math.cos(a+s)*2.6,e.y+Math.sin(a+s)*2.6])}
    else for(const s of [1.57,-1.57]){cand.push([G.x+Math.cos(a+s)*2.4,G.y+Math.sin(a+s)*2.4])}
    const ok=cand.filter(([x,y])=>spot(x,y));if(!ok.length)return null;
    ok.sort((p,q)=>Math.hypot(p[0]-G.x,p[1]-G.y)-Math.hypot(q[0]-G.x,q[1]-G.y));return ok[0];
  }
  function fight(e,profile,maxSec){
    let time=0,cd=0,taken=[],last=hpSum(),skillTry=0,warnAge=0,lastWarnKey=null,anticipated=false;const start=last;const REACT=.35;
    while(time<maxSec){
      if(mode==='dialogue'){advanceDialogue();continue}
      if(mode!=='action'){if(e.hp<=0)break;if(mode==='overlay')break;}
      const foe=e;const d=Math.hypot(foe.x-G.x,foe.y-G.y);cd-=DT;skillTry-=DT;
      const metroSeq=foe.id==='c3_metronome'?(foe.phase===1?['ring','cross','fan']:['cross','pulse','ring','fan']):null;
      const expect=metroSeq&&window.ToriiCombate.MODE.mode!=='sorteio'?metroSeq[(foe.patternIndex||0)%metroSeq.length]:foe.pat?((window.ToriiCombate.MODE.mode==='sorteio')?(foe.phase===2?'charge':'ring'):(window.ToriiCombate.BOSS_PATTERNS[foe.id]||{})[foe.phase===2?2:1]?.[foe.pat.i%((window.ToriiCombate.BOSS_PATTERNS[foe.id]||{})[foe.phase===2?2:1]||[1]).length]):null;
      // Reação humana: o aviso só é "visto" depois de REACT segundos, a menos que o aprendiz tenha previsto certo.
      const warnKey=foe.tele09?('t'+foe.tele09.type+foe.tele09.x):(foe.wind>0?('w'+foe.windKind+(foe.log?foe.log.length:0)):null);
      if(warnKey!==lastWarnKey){lastWarnKey=warnKey;warnAge=0;const actual=foe.tele09?foe.tele09.type:foe.windKind;anticipated=profile==='aprendiz'&&warnKey&&actual===window.__expected}
      if(warnKey)warnAge+=DT;
      const seesWarn=warnKey&&(anticipated||warnAge>=REACT);
      if(foe.tele09&&seesWarn){const a=foe.tele09;let tx,ty;
        if(a.type==='lanes'){tx=[a.x+2,a.x-2,a.x+6,a.x-6].find(x=>spot(x,G.y))??G.x;ty=G.y}else{const ang=Math.atan2(G.y-a.y,G.x-a.x);tx=a.x+Math.cos(ang)*3.4;ty=a.y+Math.sin(ang)*3.4}
        steerTo(tx,ty);frame();time+=DT;const now=hpSum();if(now<last)taken.push([+time.toFixed(2),last-now]);last=now;if(foe.hp<=0||now<=0)break;continue}
      const arautoNext=foe.id==='voice_boss'?(window.ToriiCombate.MODE.mode==='sorteio'?'lanes':(((foe.step09||0)+1)%2?'lanes':'feedback')):null;
      window.__expected=arautoNext||expect;
      if(foe.tele09&&!seesWarn){if(Math.hypot(foe.x-G.x,foe.y-G.y)>1.7)steerTo(foe.x,foe.y);else press([]);frame();time+=DT;const now=hpSum();if(now<last)taken.push([+time.toFixed(2),last-now]);last=now;if(foe.hp<=0||now<=0)break;continue}
      const warn=foe.wind>0&&seesWarn;
      if(warn){
        const kind=warn?foe.windKind:expect;const s=safeSpot(foe,kind);
        if(s){const dd=steerTo(s[0],s[1]);if(warn&&dd>1.2&&cd<0&&foe.wind<.35){dodgeAction();cd=.5}}else press([]);
      }else if(d>1.7)steerTo(foe.x,foe.y);
      else{press([]);G.aim091=[(foe.x-G.x)/d,(foe.y-G.y)/d];if(cd<0){attackAction();cd=.3}if(skillTry<0){skillTry=1;try{skillAction()}catch{}}}
      frame();time+=DT;
      const now=hpSum();if(now<last)taken.push([+time.toFixed(2),last-now]);last=now;
      if(foe.hp<=0||now<=0)break;
    }
    press([]);
    const total=taken.reduce((a,x)=>a+x[1],0);let spike=0;
    for(const [ti] of taken){const w=taken.filter(x=>x[0]>=ti&&x[0]<ti+4).reduce((a,x)=>a+x[1],0);spike=Math.max(spike,w)}
    const log=e.log||[];let streak=0,cur=0;for(let i=0;i<log.length;i++){cur=i&&log[i]===log[i-1]?cur+1:1;streak=Math.max(streak,cur)}
    return {win:e.hp<=0,time:+time.toFixed(1),taken:total,takenPct:Math.round(100*total/start),spike,attacks:log.length,streak,varied:e.pat?e.pat.varied:null,seq:log.slice(0,14).join(' ')};
  }
  function heal(){for(const k in G.maxhp)if(G.maxhp[k])G.hp[k]=G.maxhp[k];act.invuln=0}
  const setups={
    viajante(){newGame();while(mode==='dialogue')advanceDialogue();G.flags.bass=true;G.formation=['franco','ryuchi'];heal();setArea('ruins',35.4,18.5,false);spawnBossFight();return bossActor},
    torre(){startChapterTwoPreview();while(mode==='dialogue')advanceDialogue();setArea('voice_tower',13.5,16.5,false);spawnVoiceBoss();return bossActor},
    metronomo(){C3.start(true);while(mode==='dialogue')advanceDialogue();setArea('cloud_terrace',15.5,14.5,false);while(mode==='dialogue')advanceDialogue();C3.spawnMetronome();return bossActor},
  };
  window.__lab={
    boss(name,modeName,profile){window.ToriiCombate.MODE.mode=modeName;const e=setups[name]();for(let i=0;i<30;i++)frame();return fight(e,profile,150)},
    enemy(type){
      C3.start(true);while(mode==='dialogue')advanceDialogue();setArea('distortion_district',30.5,20.5,false);while(mode==='dialogue')advanceDialogue();heal();
      const a=current;const id='lab_'+type+'_'+Math.random().toString(36).slice(2,6);
      enemy(a,id,G.x+3,G.y,type);const e=hydrateEnemy(a.enemies.at(-1));window.__mutedBlocks=0;
      for(let i=0;i<20;i++)frame();
      const r=fight(e,'reativo',60);
      const beats=type==='compasso'?(e.log||[]).filter(x=>typeof x==='number'):[];
      const gaps=beats.slice(1).map((b,i)=>+(b-beats[i]).toFixed(2));
      return {...r,seq:undefined,beatGaps:gaps.slice(0,8),retaliations:type==='espelho'?(e.log||[]).filter(x=>x==='onda').length:undefined,mutedBlocks:type==='abafador'?window.__mutedBlocks:undefined};
    }
  };
}

async function run(){
  const browser=await chromium.launch();const errors=[];
  const page=async()=>{const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(()=>{window.requestAnimationFrame=()=>0});
    await p.goto('file://'+build,{waitUntil:'load'});await p.evaluate(()=>{try{localStorage.clear()}catch{}});await p.evaluate(lab);return p};
  const results={bosses:{},enemies:{}};
  const cases=[];
  for(const boss of ['viajante','torre','metronomo'].filter(b=>!ONLY||ONLY.includes(b)))for(const m of (boss==='metronomo'?['padrao','misto','sorteio']:['sorteio','padrao','misto']))for(const prof of ['reativo','aprendiz'])cases.push([boss,m,prof]);
  for(const [boss,m,prof] of cases){
    const rows=await Promise.all(Array.from({length:N},async()=>{const p=await page();try{return await p.evaluate(a=>window.__lab.boss(...a),[boss,m,prof])}catch(e){return {error:e.message.slice(0,120)}}finally{await p.close()}}));
    (results.bosses[boss]=results.bosses[boss]||{})[m+'/'+prof]=rows;
    const ok=rows.filter(r=>!r.error);const mean=k=>ok.length?ok.reduce((a,r)=>a+r[k],0)/ok.length:0;const sd=k=>{const m_=mean(k);return Math.sqrt(ok.reduce((a,r)=>a+(r[k]-m_)**2,0)/Math.max(1,ok.length))};
    console.log(`${boss.padEnd(9)} ${m.padEnd(7)} ${prof.padEnd(8)} vitórias ${ok.filter(r=>r.win).length}/${rows.length} · dano ${mean('takenPct').toFixed(0)}% ±${sd('takenPct').toFixed(0)} · pico4s ${mean('spike').toFixed(0)} (máx ${Math.max(0,...ok.map(r=>r.spike))}) · tempo ${mean('time').toFixed(0)}s · repetição máx ${Math.max(0,...ok.map(r=>r.streak))}${rows.some(r=>r.error)?' · ERROS '+rows.filter(r=>r.error).length:''}`);
  }
  for(const type of ['compasso','espelho','abafador'].filter(b=>!ONLY||ONLY.includes(b))){
    const rows=[];for(let i=0;i<Math.max(3,Math.ceil(N/2));i++){const p=await page();try{rows.push(await p.evaluate(t=>window.__lab.enemy(t),type))}catch(e){rows.push({error:e.message.slice(0,160)})}await p.close()}
    results.enemies[type]=rows;
    const ok=rows.filter(r=>!r.error);
    console.log(`${type.padEnd(9)} vitórias ${ok.filter(r=>r.win).length}/${rows.length} · dano ${(ok.reduce((a,r)=>a+r.takenPct,0)/Math.max(1,ok.length)).toFixed(0)}% · tempo ${(ok.reduce((a,r)=>a+r.time,0)/Math.max(1,ok.length)).toFixed(0)}s`+(type==='compasso'?` · intervalos ${JSON.stringify(ok[0]?.beatGaps)}`:type==='espelho'?` · ondas devolvidas ${ok.map(r=>r.retaliations).join(',')}`:` · técnicas abafadas ${ok.map(r=>r.mutedBlocks).join(',')}`)+(rows.some(r=>r.error)?' · ERRO '+rows.find(r=>r.error).error:''));
  }
  results.errors=[...new Set(errors)].slice(0,10);
  fs.writeFileSync(path.join(out,'RESULTADOS.json'),JSON.stringify(results,null,1));
  if(results.errors.length)console.log('ERROS DE PÁGINA:',results.errors);
  await browser.close();
}
run().catch(e=>{console.error(e);process.exit(1)});
