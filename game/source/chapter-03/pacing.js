/* TORII & HUTUKARA — Ritmo (Fases 3 e 4).
 * - Mais encontros no caminho principal dos três capítulos.
 * - Patrulhas no Distrito da Distorção que voltam a cada nova passagem.
 * - Capítulo 3: Mazza e Colli levam a Flauta ao Contratempo, eliminando a
 *   ida e volta até a oficina (que continua aberta como visita opcional).
 * Tudo por dados: para desfazer um encontro, tire-o de ENCOUNTERS.
 */
(function(){
// [área, id, x, y, tipo] — posições aproximadas; o jogo procura o chão livre mais próximo.
const ENCOUNTERS=[
  // Capítulo 1: primeiro combate no corredor, antes das máscaras.
  ['corridor','p4_corridor_hush',20,9,'hush'],
  ['forest','p4_forest_path_a',9,22,'hush'],
  ['forest','p4_forest_path_b',26,20,'whisper'],
  ['forest','p4_forest_east',40,19,'hush'],
  ['ruins','p4_ruins_entry',10,17,'hush'],
  ['ruins','p4_ruins_mid',22,18,'whisper'],
  ['ruins','p4_ruins_gate',35,16,'hush'],
  // Capítulo 2: caminho da estação até a praça e o mercado.
  ['voices','p4_voices_west',12,24,'hush'],
  ['voices','p4_voices_center',28,30,'whisper'],
  ['voices','p4_voices_market',22,14,'hush'],
  ['voice_roofs','p4_roofs_end',30,18,'whisper'],
  // Capítulo 3: travessias e aproximação do elevador.
  ['sky_canal','p4_canal_entry',10,13,'c3_echo'],
  ['power_plant','p4_plant_entry',10,15,'c3_echo'],
  ['cloud_sea','p4_cloud_mid',33,22,'c3_echo'],
];
// Patrulhas do Distrito: reaparecem ao voltar, no máximo uma vez por minuto.
// Ficam a mais de 8 passos das portas e dos checkpoints do Distrito.
const PATROLS=[
  ['distortion_district','p4_patrol_center',36,25,'c3_echo'],
  ['distortion_district','p4_patrol_east',44,21,'c3_echo'],
];
const PATROL_COOLDOWN=60;
// Inimigos acrescentados do Capítulo 3 são versões menores (ecos menores):
// enchem o caminho sem virar parede de dificuldade.
const WEAK_IDS=new Set(['p4_canal_entry','p4_plant_entry','p4_cloud_mid',...PATROLS.map(p=>p[1])]);
const WEAK={hp:.55,power:.6};

function freeSpot(a,x,y){
  const busy=(px,py)=>[...(a.events||[]),...(a.npcs||[]),...(a.gates||[])].some(o=>Math.hypot(o.x-px,o.y-py)<2.6);
  for(let r=0;r<10;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const px=Math.floor(x+dx)+.5,py=Math.floor(y+dy)+.5;
    if(px<1||py<1||px>=a.w-1||py>=a.h-1)continue;
    if(tileWalkable(a,px,py)&&tileWalkable(a,px-.4,py)&&tileWalkable(a,px+.4,py)&&tileWalkable(a,px,py-.4)&&tileWalkable(a,px,py+.4)&&!busy(px,py))return [px,py];
  }
  return null;
}
function place(list){
  for(const [areaId,id,x,y,type] of list){
    const a=areas[areaId];if(!a||a.enemies.some(e=>e.id===id))continue;
    const spot=freeSpot(a,x,y);if(spot)enemy(a,id,spot[0],spot[1],type);
  }
}
const buildBeforePacing=buildMaps;
buildMaps=function(...args){const r=buildBeforePacing.apply(this,args);try{place(ENCOUNTERS);place(PATROLS)}catch(e){console.warn('ritmo: encontros',e)}return r};

const hydrateBeforePacing=hydrateEnemy;
hydrateEnemy=function(e,...rest){const fresh=e&&e.hp===undefined;const r=hydrateBeforePacing.call(this,e,...rest);
  if(fresh&&e&&WEAK_IDS.has(e.id)){e.max=e.hp=Math.round(e.hp*WEAK.hp);e.power=Math.max(4,Math.round(e.power*WEAK.power));e.weak=true}
  return r};

// Reaparecimento das patrulhas (só depois de conhecer o Belga e antes do fim).
const patrolIds=new Set(PATROLS.map(p=>p[1]));
let lastPatrolReset=-1e9,restoring=false;
// Depois de uma derrota as patrulhas não reaparecem (evita ciclo de derrotas).
const restoreBeforePacing=restoreCheckpoint;
restoreCheckpoint=function(...args){restoring=true;try{return restoreBeforePacing.apply(this,args)}finally{restoring=false}};
const setAreaBeforePacing=setArea;
setArea=function(id,...rest){
  if(id==='distortion_district'&&!restoring&&G&&G.c3&&G.c3.metMaia&&!G.c3.complete&&G.totalSeconds-lastPatrolReset>=PATROL_COOLDOWN){
    lastPatrolReset=G.totalSeconds;
    G.defeated=G.defeated.filter(d=>!patrolIds.has(d));
    for(const e of areas.distortion_district?.enemies||[])if(patrolIds.has(e.id)){delete e.hp;if(e.homeX!==undefined){e.x=e.homeX;e.y=e.homeY}}
  }
  const r=setAreaBeforePacing.call(this,id,...rest);
  relocateFluteKeepers();
  return r;
};
// Patrulhas só depois da primeira frente concluída: a chegada ao Distrito fica limpa.
const actorsBeforePacing=enemyActors;
enemyActors=function(){const list=actorsBeforePacing();if(G&&G.area==='distortion_district'&&!(G.c3&&(G.c3.usinaDone||G.c3.canalDone)))return list.filter(e=>!patrolIds.has(e.id));return list};

// ---------- Capítulo 3: a Flauta chega ao Contratempo ----------
const fluteAtClub=()=>G&&G.c3&&G.c3.usinaDone&&G.c3.canalDone&&!G.c3.windFlute;
const CLUB_SPOTS={c3_ciro:[18,12],c3_nara:[10,11]};
const homes={};
function relocateFluteKeepers(){
  if(typeof C3==='undefined'||!areas.contratempo||!areas.ciro_workshop)return;
  for(const id of Object.keys(CLUB_SPOTS)){
    const inShop=areas.ciro_workshop.npcs.find(n=>n.id===id),inClub=areas.contratempo.npcs.find(n=>n.id===id);
    const npcObj=inShop||inClub;if(!npcObj)continue;
    if(!homes[id])homes[id]={x:npcObj.x,y:npcObj.y,say:npcObj.say};
    if(fluteAtClub()&&inShop){
      areas.ciro_workshop.npcs=areas.ciro_workshop.npcs.filter(n=>n!==npcObj);
      const s=freeSpot(areas.contratempo,...CLUB_SPOTS[id])||CLUB_SPOTS[id];npcObj.x=s[0];npcObj.y=s[1];
      npcObj.say=()=>C3.getFlute();areas.contratempo.npcs.push(npcObj);
    }else if(!fluteAtClub()&&inClub&&G.area!=='contratempo'){
      areas.contratempo.npcs=areas.contratempo.npcs.filter(n=>n!==npcObj);
      Object.assign(npcObj,homes[id]);areas.ciro_workshop.npcs.push(npcObj);
    }
  }
}
if(typeof C3!=='undefined'&&typeof C3.objective==='function'){
  const objectiveBeforePacing=C3.objective;
  C3.objective=function(...args){
    if(fluteAtClub()){const m=areas.contratempo?.npcs.find(n=>n.id==='c3_ciro');
      return {text:'Encontre Mazza e Colli no Contratempo.',hint:'Eles trouxeram a Flauta dos Ventos até o clube.',area:'contratempo',x:m?m.x:18,y:m?m.y:12,name:'Mazza e Colli'}}
    const o=objectiveBeforePacing.apply(this,args);
    if(o&&G.area==='contratempo'&&o.text==='Volte ao Contratempo e comece uma música.')return {...o,text:'Comece uma música no palco do Contratempo.'};
    return o;
  };
}
// Cada etapa grande do Capítulo 3 levanta quem caiu (30% da vida). O resto da
// recuperação fica com fitas de cura e gravadores (healing.js).
const MILESTONES=['usinaDone','canalDone','windFlute','clubPhraseDone','liftOpen','metronomeDone'];
let healedFor=new Set(),seeded=false;
const reseed=()=>{healedFor=new Set();seeded=false};
function healOnMilestones(){
  if(!G||!G.c3)return;
  const done=MILESTONES.filter(k=>G.c3[k]);
  // Primeira leitura (jogo carregado ou capítulo iniciado): só registra o que já estava feito.
  if(!seeded){done.forEach(k=>healedFor.add(k));seeded=true;return}
  const fresh=done.filter(k=>!healedFor.has(k));if(!fresh.length)return;
  fresh.forEach(k=>healedFor.add(k));
  // Decisão do autor: só quem caiu volta, com 30% da vida.
  let raised=0;for(const id of Object.keys(G.maxhp||{}))if(G.maxhp[id]&&G.hp[id]<=0){G.hp[id]=Math.max(1,Math.round(G.maxhp[id]*.3));raised++}
  if(raised)try{toast('A CIDADE VOLTA A TOCAR · QUEM CAIU SE LEVANTA');updateHUD()}catch{}
}
const updateBeforePacing=update;
let healTimer=0;
update=function(dt,...rest){const r=updateBeforePacing.call(this,dt,...rest);healTimer+=dt||0;if(healTimer>.5){healTimer=0;try{healOnMilestones()}catch{}}return r};
for(const name of ['newGame','continueGame','startChapterTwoPreview']){const before=window[name];if(typeof before==='function')window[name]=function(...args){reseed();return before.apply(this,args)}}
if(typeof C3!=='undefined'&&typeof C3.start==='function'){const before=C3.start;C3.start=function(...args){reseed();return before.apply(this,args)}}
// Derrota volta o estado; a cura daquela etapa pode acontecer de novo ao refazê-la.
const restoreHealBefore=restoreCheckpoint;
restoreCheckpoint=function(...args){const r=restoreHealBefore.apply(this,args);reseed();return r};

// Correção (bug antigo da 1.0): um projétil que derrota o último inimigo
// encerra a luta, a lista de projéteis é esvaziada no meio do laço e o
// jogo lia um item inexistente, travando o loop. Agora cada passo confere
// se o projétil ainda existe.
for(const name of ['tickFriendlyShots10','tickHostileShots10']){
  const original=window[name];if(typeof original!=='function')continue;
  window[name]=function(dt,...rest){
    const list=name==='tickFriendlyShots10'?projectiles:hostileShots;
    if(list.some(p=>!p))for(let i=list.length-1;i>=0;i--)if(!list[i])list.splice(i,1);
    try{return original.call(this,dt,...rest)}
    catch(e){if(e instanceof TypeError){const l=name==='tickFriendlyShots10'?projectiles:hostileShots;for(let i=l.length-1;i>=0;i--)if(!l[i])l.splice(i,1);return}throw e}
  };
}

window.ToriiRitmoMapa={ENCOUNTERS,PATROLS,relocateFluteKeepers};
})();
