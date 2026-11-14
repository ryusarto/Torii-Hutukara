/* TORII & HUTUKARA — Padrões de chefe e inimigos musicais (Fase 3, parte 2).
 *
 * Chefes: cada fase segue uma sequência que dá para aprender, com uma chance
 * de variação (RNG) para não ficar mecânico. Nunca o mesmo ataque 3x seguidas.
 *   window.ToriiCombate.mode = 'misto' (padrão + RNG, usado no jogo),
 *                              'padrao' (sem variação) ou 'sorteio' (como era).
 *
 * Inimigos novos (arte reaproveitada, cor e aura próprias):
 *   compasso — Metrônomo Menor: ataca sempre no mesmo tempo. Bata entre as batidas.
 *   espelho  — Eco Espelho: depois de 2 golpes seguidos devolve uma onda. Bata e saia.
 *   abafador — Abafador: dentro da aura, as técnicas (Z, X, K) ficam abafadas.
 */
(function(){
const MODE={mode:'misto',variation:.2};

// ---------------- chefes ----------------
const BOSS_PATTERNS={
  boss:{1:['ring','fan','fan','ring'],2:['charge','fan','ring','charge','ring']},        // Viajante (Cap. 1)
};
const BASE_KINDS=['ring','fan','charge'];
const LABELS={ring:'◆ ONDA AO REDOR',fan:'◆ LEQUE À FRENTE',charge:'◆ INVESTIDA'};
const C3_VARIATION={c3_metronome:{phase:3,chance:.25,pool:['ring','cross','fan','pulse']},c3_silence:{phase:1,chance:.15,pool:['ring','cross','fan','rain','chase','pulse','orbit']}};

// Planeja o próximo ataque uma vez e o mantém pendente até ele sair de fato
// (o chefe só ataca com o jogador por perto).
function planNext(e){
  e.pat=e.pat||{i:0,history:[],varied:0};
  if(e.pat.pending&&e.pat.pendingPhase===e.phase)return e.pat.pending;
  const seq=(BOSS_PATTERNS[e.id]||BOSS_PATTERNS.boss)[e.phase===2?2:1];
  let kind,fromSeq=false;
  if(MODE.mode==='sorteio')kind=e.phase===2?(Math.random()<.4?'charge':Math.random()<.5?'ring':'fan'):(Math.random()<.5?'ring':'fan');
  else{
    kind=seq[e.pat.i%seq.length];fromSeq=true;
    if(MODE.mode==='misto'&&Math.random()<MODE.variation){const pool=(e.phase===2?BASE_KINDS:['ring','fan']).filter(k=>k!==kind);kind=pool[Math.floor(Math.random()*pool.length)];e.pat.pendingVaried=true}
    const h=e.pat.history;if(h.length>=2&&h[h.length-1]===kind&&h[h.length-2]===kind)kind=BASE_KINDS.find(k=>k!==kind&&(e.phase===2||k!=='charge'));
  }
  e.pat.pending=kind;e.pat.pendingPhase=e.phase;e.pat.pendingFromSeq=fromSeq;
  return kind;
}
function commit(e,actual){
  const p=e.pat;if(!p)return;
  if(p.pendingFromSeq)p.i++;if(p.pendingVaried)p.varied++;
  p.history.push(actual);if(p.history.length>40)p.history.shift();
  p.pending=null;p.pendingVaried=false;p.pendingFromSeq=false;
}
// Valores que fazem a decisão original (Math.random) escolher o ataque desejado.
const FORCE={1:{ring:[.1],fan:[.9]},2:{charge:[.1],ring:[.9,.1],fan:[.9,.9]}};

const updateBeforePatterns=updateEnemy;
updateEnemy=function(e,dt,isBoss=false,...rest){
  if(e&&NEW_TYPES[e.type]&&!isBoss)return updateNewEnemy(e,dt);
  if(isBoss&&e&&e.id==='voice_boss')return updateArauto.call(this,e,dt,isBoss,...rest);
  if(!(isBoss&&e&&e.id==='boss'))return updateBeforePatterns.call(this,e,dt,isBoss,...rest);
  const wasWind=e.wind>0;
  // Momento de decisão: sem preparo em andamento e recarga zerada.
  let restore=null;
  if(!wasWind&&(e.cd||0)-dt<=0&&!(e.stun>0)){
    const phase=e.hp<e.max*.5?2:(e.phase||1);e.phase=phase;
    const kind=planNext(e);const queue=[...FORCE[phase===2?2:1][kind]];
    const real=Math.random;restore=()=>{Math.random=real};
    Math.random=()=>queue.length?queue.shift():real();
  }
  let r;try{r=updateBeforePatterns.call(this,e,dt,isBoss,...rest)}finally{if(restore)restore()}
  if(!wasWind&&e.wind>0){
    commit(e,e.windKind);
    try{toast(LABELS[e.windKind]||'◆ ATAQUE')}catch{}
    e.log=(e.log||[]);e.log.push(e.windKind);
  }
  return r;
};
// Arauto (Cap. 2): já alternava "faixas" e "círculo" em ordem fixa.
// Agora, com 20% de chance, o próximo ataque troca — nunca 3 iguais seguidos.
const ARAUTO_EXTRA=[.14,.17];
function updateArauto(e,dt,isBoss,...rest){
  const had=!!e.tele09;
  const r=updateBeforePatterns.call(this,e,dt,isBoss,...rest);
  if(!had&&e.tele09){
    e.log=e.log||[];e.pat=e.pat||{varied:0};
    // Aviso um pouco mais longo: o original (1,08 s / 0,78 s) não dava tempo de reação a quem joga pela primeira vez.
    e.tele09.time+=e.phase===2?ARAUTO_EXTRA[1]:ARAUTO_EXTRA[0];
    let type=e.tele09.type;
    if(MODE.mode!=='padrao'){const chance=MODE.mode==='sorteio'?.5:MODE.variation;if(Math.random()<chance){type=type==='lanes'?'feedback':'lanes';e.pat.varied++}}
    const h=e.log;if(h.length>=2&&h[h.length-1]===type&&h[h.length-2]===type)type=type==='lanes'?'feedback':'lanes';
    if(type!==e.tele09.type){e.tele09.type=type;try{toast(type==='lanes'?'ARAUTO · SAIA DAS FAIXAS VERMELHAS':'ARAUTO · AFASTE-SE DO CÍRCULO')}catch{}}
    h.push(type);
  }
  return r;
}

// Metrônomo (fixo) e Silêncio (fixo por tentativa) ganham variação controlada.
if(typeof C3!=='undefined'&&typeof C3.castPattern==='function'){
  const castBeforePatterns=C3.castPattern;
  C3.castPattern=function(e,kind,...rest){
    const v=C3_VARIATION[e&&e.id];
    if(v&&MODE.mode!=='padrao'&&(e.phase||1)>=v.phase){
      const chance=MODE.mode==='sorteio'?1:v.chance;
      if(Math.random()<chance){const pool=v.pool.filter(k=>k!==kind);kind=pool[Math.floor(Math.random()*pool.length)]}
    }
    e.log=(e.log||[]);const h=e.log;
    if(v&&h.length>=2&&h[h.length-1]===kind&&h[h.length-2]===kind){const pool=v.pool.filter(k=>k!==kind);kind=pool[0]}
    const r=castBeforePatterns.call(this,e,kind,...rest);
    h.push(e.lastPattern121||kind); // registra o ataque que de fato saiu
    return r;
  };
}

// ---------------- inimigos musicais ----------------
const NEW_TYPES={
  compasso:{name:'Metrônomo Menor',hp:70,power:9,base:'hush',color:'#f1ca87',hint:'ATACA SEMPRE NO MESMO TEMPO · BATA ENTRE AS BATIDAS'},
  espelho:{name:'Eco Espelho',hp:60,power:6,base:'whisper',color:'#7de6ee',hint:'DEPOIS DE DOIS GOLPES SEGUIDOS ELE DEVOLVE UMA ONDA · BATA E SAIA'},
  abafador:{name:'Abafador',hp:85,power:7,base:'hush',color:'#b07cf0',hint:'DENTRO DA AURA, AS TÉCNICAS FICAM ABAFADAS'},
};
for(const [k,v] of Object.entries(NEW_TYPES))enemyInfo[k]={name:v.name,hp:v.hp,power:v.power};
const BEAT=1.6,MUTE_R=3.2;
const seen=new Set();
function introduce(e){if(seen.has(e.type))return;seen.add(e.type);try{toast(`NOVO ECO · ${NEW_TYPES[e.type].name.toUpperCase()} · ${NEW_TYPES[e.type].hint}`)}catch{}}
function moveToward(e,tx,ty,speed,dt,stopAt){const d=Math.hypot(tx-e.x,ty-e.y);if(d<=stopAt)return d;const nx=e.x+(tx-e.x)/d*speed*dt,ny=e.y+(ty-e.y)/d*speed*dt;if(tileWalkable(current,nx,ny)){e.x=nx;e.y=ny}else if(tileWalkable(current,nx,e.y))e.x=nx;else if(tileWalkable(current,e.x,ny))e.y=ny;return d}
function updateNewEnemy(e,dt){
  if(!e||e.hp<=0)return;
  e.flash=Math.max(0,(e.flash||0)-dt);e.stun=Math.max(0,(e.stun||0)-dt);e.cd=Math.max(0,(e.cd||0)-dt);
  const d=Math.hypot(G.x-e.x,G.y-e.y);
  if(d<7)introduce(e);
  if(e.type==='compasso'){
    // Relógio próprio: prepara 0,6 s antes de cada batida e acerta na batida, sempre.
    e.clock=(e.clock||0)+dt;const t=e.clock%BEAT;
    e.wind=t>BEAT-.6?BEAT-t:0;e.windKind='ring';
    if(e.lastBeat!==Math.floor(e.clock/BEAT)){e.lastBeat=Math.floor(e.clock/BEAT);if(e.clock>BEAT&&d<2.6&&!(e.stun>0))damageHero(e.power,e);try{addCombatFX(e.x,e.y,'warning',2.6)}catch{}(e.log=e.log||[]).push(+e.clock.toFixed(2))}
    if(!(e.stun>0))moveToward(e,G.x,G.y,1.15,dt,1.4);
    return;
  }
  if(e.type==='espelho'){
    // Devolve uma onda depois de 2 golpes em até 2 s; aviso de 0,8 s; 2,5 s de folga entre ondas.
    e.mirrorCd=Math.max(0,(e.mirrorCd||0)-dt);e.hits=(e.hits||[]).filter(h=>e.clock-h<2);e.clock=(e.clock||0)+dt;
    if(e.hp<(e.lastHp??e.hp))e.hits.push(e.clock);
    e.lastHp=e.hp;
    if(!(e.retaliate>0)&&e.mirrorCd<=0&&e.hits.length>=2){e.retaliate=.8;e.hits=[];try{addCombatFX(e.x,e.y,'warning',2)}catch{}}
    if(e.retaliate>0){e.retaliate-=dt;e.wind=Math.max(0,e.retaliate);e.windKind='ring';if(e.retaliate<=0){e.mirrorCd=2.5;if(Math.hypot(G.x-e.x,G.y-e.y)<2)damageHero(e.power,e);(e.log=e.log||[]).push('onda');try{addCombatFX(e.x,e.y,'strike',2)}catch{}}return}
    if(e.stun>0)return;
    if(d<1.6&&e.cd<=0){e.cd=1.1;damageHero(e.power,e);(e.log=e.log||[]).push('golpe')}
    moveToward(e,G.x,G.y,2.3,dt,1.2);
    return;
  }
  if(e.type==='abafador'){
    if(e.stun>0)return;
    if(e.wind>0){e.wind-=dt;if(e.wind<=0){if(Math.hypot(G.x-e.x,G.y-e.y)<1.9)damageHero(e.power,e);e.cd=1.4}return}
    if(d<1.8&&e.cd<=0){e.wind=.7;e.windKind='swipe';try{addCombatFX(e.x,e.y,'warning',1.6)}catch{}}
    moveToward(e,G.x,G.y,1.0,dt,1.3);
  }
}
// Abafador: técnicas bloqueadas dentro da aura.
function muted(){if(!G||!current)return false;try{return enemyActors().some(e=>e.type==='abafador'&&(e.hp===undefined||e.hp>0)&&Math.hypot(G.x-e.x,G.y-e.y)<MUTE_R)}catch{return false}}
let muteToastAt=0;
for(const name of ['skillAction','advancedSkill','duoAction']){
  const before=window[name];if(typeof before!=='function')continue;
  window[name]=function(...args){if(mode==='action'&&muted()){if(performance.now()-muteToastAt>1500){muteToastAt=performance.now();toast('TÉCNICAS ABAFADAS · SAIA DA AURA OU USE O ATAQUE BÁSICO')}window.__mutedBlocks=(window.__mutedBlocks||0)+1;return}return before.apply(this,args)};
}
// Desenho: arte existente + aura/cor própria.
const drawBeforePatterns=drawCreature;
drawCreature=function(x,y,kind,entity,...rest){
  const t=NEW_TYPES[kind];if(!t)return drawBeforePatterns.call(this,x,y,kind,entity,...rest);
  try{
    ctx.save();ctx.globalAlpha=.22+.12*Math.sin((tick||0)*6);ctx.fillStyle=t.color;
    const r=kind==='abafador'?MUTE_R*T:kind==='compasso'?2.6*T*(entity&&entity.wind>0?1:.55):1.2*T;
    ctx.beginPath();ctx.ellipse(x,y+6,r,r*.55,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }catch{}
  drawBeforePatterns.call(this,x,y,t.base,entity,...rest);
  try{ctx.save();ctx.strokeStyle=t.color;ctx.lineWidth=2;ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(x,y-34,6+(entity&&entity.wind>0?3:0),0,Math.PI*2);ctx.stroke();ctx.restore()}catch{}
};
window.ToriiCombate={MODE,BOSS_PATTERNS,NEW_TYPES,muted};
})();
