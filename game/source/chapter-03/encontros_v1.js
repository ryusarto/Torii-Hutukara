/* TORII & HUTUKARA — Fase 2: inimigos novos e encontros.
 *
 * Só existem nos níveis Normal e Difícil (ToriiDificuldade.cfg().extras).
 * No nível História o mapa, a contagem e o comportamento dos inimigos ficam
 * iguais aos de hoje.
 *
 * Seis tipos novos, dois por capítulo, com papéis diferentes:
 *   C1 tambor_escudo     escudo   bloqueia golpes de frente; abre depois de bater
 *   C1 flautim_atirador  atirador mantém distância, mira (linha) e dispara
 *   C2 coro_curador      curador  canaliza e cura os aliados por perto; bater interrompe
 *   C2 maestro_invocador invocador chama Nós menores; caindo ele, eles caem
 *   C3 muralha_estatica  escudo   escudo de frente e investida em linha; tonta depois
 *   C3 antena_feedback   atirador feixe longo com aviso; dá para sair da faixa
 * Arte: usam as poses de enemies/v1 com cor, aura e símbolo próprios até
 * chegarem os atlas dedicados (lista de assets da Fase 2).
 *
 * Encontros (ENCONTROS): emboscadas, arenas trancadas e uma "onda de Silêncio"
 * no meio de cada capítulo. Cada um acontece uma vez por jornada
 * (G.fase2.feitos); perder volta ao checkpoint e o encontro pode recomeçar.
 */
(function(){
'use strict';
const D=window.ToriiDificuldade;if(!D){console.warn('fase2: dificuldade ausente');return}
const extras=()=>D.ativo()&&D.cfg().extras;
const dificil=()=>D.ativo()&&D.cfg().padroes;

// ---------------- tipos ----------------
const TIPOS={
  tambor_escudo:{nome:'Tambor-Escudo',papel:'escudo',vida:92,dano:9,base:'hush',cor:'#f5c66b',matiz:35,
    dica:'ESCUDO DE FRENTE · ATAQUE PELAS COSTAS OU LOGO DEPOIS DO GOLPE DELE'},
  flautim_atirador:{nome:'Flautim Atirador',papel:'atirador',vida:52,dano:8,base:'whisper',cor:'#9fe36b',matiz:80,
    dica:'MIRA ANTES DE ATIRAR · SAIA DA LINHA E CHEGUE PERTO'},
  coro_curador:{nome:'Coro de Reparo',papel:'curador',vida:62,dano:5,base:'espelho',cor:'#7cf0a8',matiz:-60,
    dica:'CURA OS ALIADOS · BATA NELE DURANTE O CANTO PARA INTERROMPER'},
  maestro_invocador:{nome:'Maestro Oco',papel:'invocador',vida:84,dano:7,base:'abafador',cor:'#c9a2ff',matiz:40,
    dica:'CHAMA NÓS MENORES · DERRUBE O MAESTRO E ELES SE DESFAZEM'},
  muralha_estatica:{nome:'Muralha de Estática',papel:'escudo',vida:124,dano:12,base:'abafador',cor:'#ffb36b',matiz:-25,
    dica:'ESCUDO E INVESTIDA EM LINHA · DEPOIS DE CORRER ELA FICA TONTA'},
  antena_feedback:{nome:'Antena de Feedback',papel:'atirador',vida:72,dano:11,base:'compasso',cor:'#6be4ff',matiz:150,
    dica:'FEIXE LONGO COM AVISO · SAIA DA FAIXA E VÁ ATÉ ELA'},
};
for(const [k,v] of Object.entries(TIPOS))enemyInfo[k]={name:v.nome,hp:v.vida,power:v.dano};

// ---------------- inimigos fixos a mais (Normal e Difícil) ----------------
// [área, id, x, y, tipo, condição opcional]. O jogo procura o chão livre mais próximo.
const frenteC3=g=>!!(g.c3&&(g.c3.usinaDone||g.c3.canalDone));
const EXTRAS=[
  // Capítulo 1
  ['forest','f2_forest_flautim_a',13,18,'flautim_atirador'],
  ['forest','f2_forest_tambor_a',25,24,'tambor_escudo'],
  ['forest','f2_forest_flautim_b',44,25,'flautim_atirador'],
  ['forest','f2_forest_tambor_b',53,15,'tambor_escudo'],
  ['forest','f2_forest_hush',47,9,'hush'],
  ['ruins','f2_ruins_tambor',12,23,'tambor_escudo'],
  // Longe da arena do Viajante (39,18): a luta do chefe é só dele.
  ['ruins','f2_ruins_flautim_a',20,8,'flautim_atirador'],
  ['ruins','f2_ruins_flautim_b',14,28,'flautim_atirador'],
  // Capítulo 2
  ['voices','f2_voices_coro_praca',38,31,'coro_curador'],
  ['voices','f2_voices_coro_mercado',19,25,'coro_curador'],
  ['voices','f2_voices_maestro',31,12,'maestro_invocador'],
  ['voices','f2_voices_flautim',52,24,'flautim_atirador'],
  ['voices','f2_voices_tambor',14,30,'tambor_escudo'],
  ['voice_roofs','f2_roofs_maestro',29,7,'maestro_invocador'],
  ['voice_roofs','f2_roofs_coro',24,16,'coro_curador'],
  // Capítulo 3 (no Distrito, só depois da primeira frente, como as patrulhas)
  ['distortion_district','f2_district_muralha',28,31,'muralha_estatica',frenteC3],
  ['distortion_district','f2_district_antena',20,38,'antena_feedback',frenteC3],
  ['distortion_district','f2_district_coro',49,29,'coro_curador',frenteC3],
  ['power_plant','f2_plant_muralha',9,8,'muralha_estatica'],
  ['power_plant','f2_plant_antena',12,4,'antena_feedback'],
  ['power_plant','f2_plant_coro',31,18,'coro_curador'],
  ['sky_canal','f2_canal_antena',6,20,'antena_feedback'],
  ['sky_canal','f2_canal_maestro',11,5,'maestro_invocador'],
  ['sky_canal','f2_canal_muralha',36,20,'muralha_estatica'],
  // Mar de Nuvens fica sem tipos novos: feixe e investida em passarela estreita
  // com queda fatal seriam injustos.
];
const EXTRA_POR_ID=new Map(EXTRAS.map(e=>[e[1],e]));

// ---------------- encontros ----------------
// tipo: emboscada (surgem ao redor de quem passa), arena (trancada até limpar),
// onda (onda de Silêncio: arena com três ondas, no meio do capítulo).
const ENCONTROS=[
  {id:'c1_emboscada_ponte',tipo:'emboscada',area:'forest',x:41,y:20,r:2.8,quando:g=>g.flags.bridge,
    ondas:[['hush','hush','flautim_atirador']]},
  {id:'c1_onda_silencio',tipo:'onda',area:'forest',x:50,y:21,r:3,raio:6.5,quando:g=>g.flags.bridge,
    ondas:[['hush','hush','whisper'],['tambor_escudo','flautim_atirador','hush'],['hush','whisper','compasso','tambor_escudo']]},
  {id:'c1_arena_ruinas',tipo:'arena',area:'ruins',x:27,y:20,r:3,raio:6.5,quando:g=>!g.flags.boss,
    ondas:[['hush','flautim_atirador','hush'],['tambor_escudo','whisper','compasso']]},
  {id:'c2_emboscada_mercado',tipo:'emboscada',area:'voices',x:30,y:20,r:2.8,quando:g=>!!(g.flags.relayMarket||g.flags.relayPlaza),
    ondas:[['hush','whisper','maestro_invocador']]},
  {id:'c2_onda_silencio',tipo:'onda',area:'voices',x:38,y:37,r:3.2,raio:6.5,quando:g=>!!(g.flags.relayMarket||g.flags.relayPlaza),
    ondas:[['hush','whisper','espelho'],['coro_curador','hush','hush','flautim_atirador'],['maestro_invocador','tambor_escudo','whisper','abafador']]},
  {id:'c2_arena_telhados',tipo:'arena',area:'voice_roofs',x:27,y:21,r:3,raio:6,quando:g=>!!g.flags.fogCleared11,
    ondas:[['hush','whisper','coro_curador'],['maestro_invocador','tambor_escudo','espelho']]},
  {id:'c3_onda_silencio',tipo:'onda',area:'distortion_district',x:30,y:27,r:3.6,raio:7,quando:g=>frenteC3(g)&&!g.c3.metronomeDone,
    ondas:[['c3_echo','c3_echo','antena_feedback'],['muralha_estatica','coro_curador','c3_drone'],['maestro_invocador','muralha_estatica','antena_feedback','c3_echo']]},
  {id:'c3_emboscada_usina',tipo:'emboscada',area:'power_plant',x:27,y:6,r:2.8,quando:g=>!!g.c3?.usinaGate,
    ondas:[['c3_echo','c3_drone','antena_feedback']]},
  {id:'c3_arena_canal',tipo:'arena',area:'sky_canal',x:8,y:8,r:3,raio:6,quando:g=>!!g.c3?.metMaia&&!g.c3?.canalDone,
    ondas:[['c3_echo','antena_feedback','c3_echo'],['muralha_estatica','coro_curador','c3_drone']]},
];

// ---------------- utilidades ----------------
function livre(a,x,y,sep=.45){
  return tileWalkable(a,x,y)&&tileWalkable(a,x-sep,y)&&tileWalkable(a,x+sep,y)&&tileWalkable(a,x,y-sep)&&tileWalkable(a,x,y+sep);
}
function chaoLivre(a,x,y,raio=10){
  const ocupado=(px,py)=>[...(a.events||[]),...(a.npcs||[]),...(a.gates||[])].some(o=>Math.hypot(o.x-px,o.y-py)<2.4);
  for(let r=0;r<raio;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const px=Math.floor(x+dx)+.5,py=Math.floor(y+dy)+.5;
    if(px<1||py<1||px>=a.w-1||py>=a.h-1)continue;
    if(livre(a,px,py)&&!ocupado(px,py))return [px,py];
  }
  return null;
}
function lutadores(){return D.lutadores()}
function maisPerto(e){return lutadores().sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0]||null}
function andar(e,tx,ty,v,dt,parar=0){
  const d=Math.hypot(tx-e.x,ty-e.y);if(d<=parar||d<.01)return d;
  const nx=e.x+(tx-e.x)/d*v*dt,ny=e.y+(ty-e.y)/d*v*dt;
  if(tileWalkable(current,nx,ny)){e.x=nx;e.y=ny}else if(tileWalkable(current,nx,e.y))e.x=nx;else if(tileWalkable(current,e.x,ny))e.y=ny;
  return d;
}
function fugir(e,t,v,dt){const a=Math.atan2(e.y-t.y,e.x-t.x);andar(e,e.x+Math.cos(a)*3,e.y+Math.sin(a)*3,v,dt)}
function golpear(e,raio,dano){
  for(const t of lutadores().sort((a,b)=>b.p-a.p))if(Math.hypot(t.x-e.x,t.y-e.y)<raio){
    if(t.p===2){try{C3.damageCoop(dano)}catch{}}else damageHero(dano,e);
  }
}
const vistos=new Set();
function apresentar(e){const t=TIPOS[e.type];if(!t||vistos.has(e.type))return;vistos.add(e.type);try{toast(`NOVO ECO · ${t.nome.toUpperCase()} · ${t.dica}`)}catch{}}
function girar(e,alvo,vel,dt){
  const d=Math.atan2(Math.sin(alvo-e.face),Math.cos(alvo-e.face));
  e.face+=Math.max(-vel*dt,Math.min(vel*dt,d));
}
function vivos(){try{return enemyActors().filter(e=>e.hp>0)}catch{return []}}

// ---------------- comportamento ----------------
function atualizarNovo(e,dt){
  if(!e||e.hp<=0)return;
  e.flash=Math.max(0,(e.flash||0)-dt);e.stun=Math.max(0,(e.stun||0)-dt);e.cd=Math.max(0,(e.cd||0)-dt);
  if(e.f2surge>0){e.f2surge-=dt;e.emerge091=Math.max(0,e.f2surge/.9);return}
  e.f2aberto=Math.max(0,(e.f2aberto||0)-dt);e.f2tonto=Math.max(0,(e.f2tonto||0)-dt);
  if(e.face===undefined)e.face=0;
  const t=maisPerto(e);if(!t)return;
  const d=Math.hypot(t.x-e.x,t.y-e.y),ang=Math.atan2(t.y-e.y,t.x-e.x);
  if(d<7.5)apresentar(e);
  if(e.stun>0||e.f2tonto>0){e.wind=0;return}
  // Durante a luta contra um chefe, os tipos novos esperam (a luta é dele).
  if(bossActor&&battle?.boss){e.wind=0;return}
  // e.wind só dá a pose de preparo; canto e chamado contam o próprio tempo.
  if(e.wind>0&&!(e.f2canto>0)&&!(e.f2chamar>0)){e.wind-=dt;if(e.wind<=0)e.wind=0;return}
  const P=TIPOS[e.type],dif=dificil();
  switch(e.type){
    case 'tambor_escudo':{
      girar(e,ang,dif?3.4:2.2,dt);
      if(d<2&&e.cd<=0){
        e.wind=.75;e.windKind='swipe';e.cd=dif?1.6:2;
        const golpe=()=>D.perigo({kind:'cone',x:e.x,y:e.y,angle:e.face,r:2.3,arc:.95,time:.75,damage:e.power,dono:e,cor:D.COR.escudo,depois:()=>{e.f2aberto=1.35}});
        golpe();if(dif)D.perigo({kind:'cone',x:e.x,y:e.y,angle:e.face,r:2.6,arc:.75,time:.75,atraso:.5,damage:e.power,dono:e,cor:D.COR.escudo});
      }else andar(e,t.x,t.y,1.25,dt,1.3);
      break}
    case 'muralha_estatica':{
      girar(e,ang,dif?3:1.9,dt);
      if(d<1.9&&e.cd<=0){
        e.wind=.8;e.windKind='swipe';e.cd=1.9;
        D.perigo({kind:'cone',x:e.x,y:e.y,angle:e.face,r:2.4,arc:1,time:.8,damage:e.power,dono:e,cor:D.COR.escudo,depois:()=>{e.f2aberto=1.2}});
      }else if(d>2.4&&d<6.5&&e.cd<=0){
        const len=Math.min(7,d+1.6),a=e.face=ang;e.wind=.9;e.windKind='charge';e.cd=dif?2.6:3.4;
        D.perigo({kind:'line',x:e.x,y:e.y,angle:a,len,width:1.15,time:.9,damage:e.power+2,dono:e,cor:D.COR.escudo,
          antes:h=>{for(let s=0;s<Math.ceil(len/.25);s++){const nx=e.x+Math.cos(a)*.25,ny=e.y+Math.sin(a)*.25;if(!tileWalkable(current,nx,ny))break;e.x=nx;e.y=ny}},
          depois:()=>{e.f2tonto=dif?1.1:1.6;e.f2aberto=dif?1.1:1.6;try{addCombatFX(e.x,e.y,'strike',1.6)}catch{}}});
      }else andar(e,t.x,t.y,1.05,dt,1.4);
      break}
    case 'flautim_atirador':{
      e.face=ang;
      if(e.cd<=0&&d<9){
        e.wind=.7;e.windKind='orb';e.cd=dif?1.9:2.4;const a=ang;
        D.perigo({kind:'line',x:e.x,y:e.y,angle:a,len:Math.min(9,d+2),width:.35,time:.7,damage:0,dono:e,cor:'#d8ff9a',
          depois:()=>{for(const off of (dif?[-.22,0,.22]:[0]))hostileShots.push({x:e.x,y:e.y,vx:Math.cos(a+off)*9,vy:Math.sin(a+off)*9,time:1.3,damage:e.power,f2:true});
            try{playTone(880,.06,'square',.03)}catch{}}});
      }else if(d<3.6)fugir(e,t,2.2,dt);
      else if(d>7)andar(e,t.x,t.y,1.9,dt);
      break}
    case 'antena_feedback':{
      e.face=ang;
      if(e.cd<=0&&d<10){
        e.wind=1;e.windKind='orb';e.cd=dif?2.4:3.1;
        const feixe=a=>D.perigo({kind:'line',x:e.x,y:e.y,angle:a,len:12,width:.8,time:1,damage:e.power,dono:e,cor:'#7fe9ff'});
        feixe(ang);if(dif){feixe(ang+.42);feixe(ang-.42)}
      }else if(d<3)fugir(e,t,1.5,dt);
      else if(d>7.5)andar(e,t.x,t.y,.7,dt);
      break}
    case 'coro_curador':{
      if(e.f2canto>0){
        e.f2canto-=dt;e.wind=Math.max(.01,e.f2canto);e.windKind='ring';
        if(e.f2canto<=0){e.wind=0;e.cd=dif?3.6:4.6;
          for(const a of vivos())if(a!==e&&Math.hypot(a.x-e.x,a.y-e.y)<5.5&&a.hp<a.max){
            const cura=Math.round(a.max*(dif?.35:.25));a.hp=Math.min(a.max,a.hp+cura);try{addCombatFX(a.x,a.y,'xp',1)}catch{}
            window.dispatchEvent(new CustomEvent('torii:cura-inimigo',{detail:{x:a.x,y:a.y,valor:cura}}))}
          try{playTone(660,.18,'sine',.05);playTone(990,.22,'sine',.03)}catch{}
        }
        break;
      }
      const feridos=vivos().filter(a=>a!==e&&Math.hypot(a.x-e.x,a.y-e.y)<5.5&&a.hp<a.max);
      if(e.cd<=0&&feridos.length){e.f2canto=1.15;e.wind=1.15;e.windKind='ring';e.f2hpCanto=e.hp;
        D.perigo({kind:'ring',x:e.x,y:e.y,r:5.5,time:1.15,damage:0,dono:e,cor:D.COR.cura});break}
      if(d<1.5&&e.cd<=0){e.cd=1.4;golpear(e,1.5,e.power)}
      else if(d<3.2)fugir(e,t,2,dt);
      else{const amigo=vivos().filter(a=>a!==e).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];if(amigo)andar(e,amigo.x,amigo.y,1.6,dt,2.2)}
      break}
    case 'maestro_invocador':{
      e.f2chamados=(e.f2chamados||[]).filter(id=>vivos().some(a=>a.id===id));
      const max=dif?4:3,limite=dif?8:6;
      if(e.f2chamar>0){e.f2chamar-=dt;e.wind=Math.max(.01,e.f2chamar);e.windKind='ring';
        if(e.f2chamar<=0){e.wind=0;e.cd=dif?4.4:6;chamar(e,2);}break}
      if(e.cd<=0&&e.f2chamados.length<max&&(e.f2total||0)<limite&&d<9){e.f2chamar=1.3;e.wind=1.3;
        D.perigo({kind:'ring',x:e.x,y:e.y,r:1.8,time:1.3,damage:0,dono:e,cor:D.COR.invoca});break}
      if(d<3.6)fugir(e,t,1.7,dt);else if(d>6.5)andar(e,t.x,t.y,1.4,dt);
      break}
  }
}
function chamar(e,n){
  const a=current;if(!a)return;
  const tipo=['distortion_district','power_plant','sky_canal','cloud_sea','cloud_terrace'].includes(G.area)?'c3_echo':'hush';
  for(let i=0;i<n;i++){
    const ang=Math.random()*Math.PI*2,p=chaoLivre(a,e.x+Math.cos(ang)*1.6,e.y+Math.sin(ang)*1.6,4);if(!p)continue;
    e.f2total=(e.f2total||0)+1;const id=`${e.id}_m${e.f2total}`;
    enemy(a,id,p[0],p[1],tipo);const m=hydrateEnemy(a.enemies[a.enemies.length-1]);
    m.max=m.hp=Math.round(m.hp*.55);m.power=Math.max(4,Math.round(m.power*.6));m.f2chamado=e.id;m.f2temp=true;m.emerge091=1;m.f2surge=.9;
    (e.f2chamados=e.f2chamados||[]).push(id);try{addCombatFX(p[0],p[1],'spawn',1.4)}catch{}
  }
  try{toast('O MAESTRO CHAMA NÓS MENORES')}catch{}
}

const updAntes=updateEnemy;
updateEnemy=function(e,dt,isBoss=false,...rest){
  if(!isBoss&&e&&TIPOS[e.type])return atualizarNovo(e,dt);
  if(!isBoss&&e&&e.f2surge>0){e.f2surge-=dt;e.emerge091=Math.max(0,e.f2surge/.9);e.flash=Math.max(0,(e.flash||0)-dt);return}
  return updAntes.call(this,e,dt,isBoss,...rest);
};

// Escudo de frente, canto interrompido e chamados que caem com o maestro.
function bloqueia(e){
  if(!(e.type==='tambor_escudo'||e.type==='muralha_estatica')||e.f2aberto>0||e.f2tonto>0||e.f2surge>0)return false;
  const t=maisPerto(e);if(!t)return false;
  const a=Math.atan2(t.y-e.y,t.x-e.x);
  return Math.abs(Math.atan2(Math.sin(a-(e.face||0)),Math.cos(a-(e.face||0))))<1.2;
}
let avisoEscudo=0;
const hitAntes=hitEnemy;
hitEnemy=function(e,damage,stun,knock,...rest){
  if(e&&TIPOS[e.type]&&e.hp>0){
    if(e.f2surge>0)return;
    if(bloqueia(e)){
      damage=Math.max(1,Math.round(damage*.15));stun=.02;knock=0;e.f2bloqueou=(e.f2bloqueou||0)+1;
      try{playTone(1320,.05,'square',.04);addCombatFX(e.x+Math.cos(e.face)*.6,e.y+Math.sin(e.face)*.6,'hit',.5)}catch{}
      window.dispatchEvent(new CustomEvent('torii:bloqueio',{detail:{x:e.x,y:e.y}}));
      if(performance.now()-avisoEscudo>2500){avisoEscudo=performance.now();try{toast('ESCUDO · CONTORNE OU ESPERE O GOLPE DELE')}catch{}}
    }else if(e.type==='tambor_escudo'||e.type==='muralha_estatica'){
      window.dispatchEvent(new CustomEvent('torii:abertura',{detail:{x:e.x,y:e.y}}));
    }
    if(e.type==='coro_curador'&&e.f2canto>0){e.f2canto=0;e.wind=0;e.cd=2.2;stun=Math.max(stun||0,.6);
      for(let i=D.perigos.length-1;i>=0;i--)if(D.perigos[i].dono===e)D.perigos.splice(i,1);try{toast('CURA INTERROMPIDA')}catch{}}
    if(e.type==='maestro_invocador'&&e.f2chamar>0&&damage>=8){e.f2chamar=0;e.wind=0;e.cd=2.5;
      for(let i=D.perigos.length-1;i>=0;i--)if(D.perigos[i].dono===e)D.perigos.splice(i,1)}
  }
  const r=hitAntes.call(this,e,damage,stun,knock,...rest);
  if(e&&e.hp<=0){
    if(e.type==='maestro_invocador'){
      for(const m of current?.enemies||[])if(m.f2chamado===e.id&&m.hp>0){m.hp=0;try{addCombatFX(m.x,m.y,'spawn',1.2)}catch{}limparTemporario(m)}
    }
    if(e.f2temp)limparTemporario(e);
  }
  return r;
};
function limparTemporario(m){
  // Chamados e inimigos de encontro não ficam no save: saem do mapa ao cair.
  if(G?.defeated){const i=G.defeated.lastIndexOf(m.id);if(i>=0)G.defeated.splice(i,1)}
  const a=current;if(a)a.enemies=a.enemies.filter(x=>x!==m);
}

// ---------------- presença por nível ----------------
function colocarExtras(){
  for(const [areaId,id,x,y,tipo] of EXTRAS){
    const a=areas[areaId];if(!a||a.enemies.some(e=>e.id===id))continue;
    const p=chaoLivre(a,x,y);if(p)enemy(a,id,p[0],p[1],tipo);
  }
}
const mapasAntes=buildMaps;
buildMaps=function(...a){const r=mapasAntes.apply(this,a);try{colocarExtras()}catch(e){console.warn('fase2: extras',e)}return r};
const atoresAntes=enemyActors;
enemyActors=function(...a){
  const lista=atoresAntes.apply(this,a);
  if(!lista.length)return lista;
  const ok=extras();
  return lista.filter(e=>{
    if(e.f2temp)return ok;
    const x=EXTRA_POR_ID.get(e.id);if(!x)return true;
    return ok&&(!x[5]||x[5](G));
  });
};

// ---------------- encontros em andamento ----------------
let atual=null,tentativa=0;
function estado(){G.fase2=G.fase2||{feitos:{}};G.fase2.feitos=G.fase2.feitos||{};return G.fase2}
function feito(id){return !!G?.fase2?.feitos?.[id]}
function cancelar(){
  if(!atual)return;
  const a=areas[atual.def.area];
  if(a)a.enemies=a.enemies.filter(e=>!atual.ids.includes(e.id));
  if(G?.defeated)G.defeated=G.defeated.filter(id=>!atual.ids.includes(id));
  atual=null;
}
// Chão alcançável a partir do centro (ou de quem foi emboscado), sem atravessar
// parede; nas arenas, dentro da barreira. Assim todo inimigo dá para alcançar.
function regiao(a,cx,cy,raio){
  const ok=(x,y)=>x>=0&&y>=0&&x<a.w&&y<a.h&&tileWalkable(a,x+.5,y+.5)&&Math.hypot(x+.5-cx,y+.5-cy)<=raio;
  const s=[Math.floor(cx),Math.floor(cy)],vistos=new Set([s.join(',')]),fila=[s];
  for(let i=0;i<fila.length;i++){const [x,y]=fila[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!vistos.has(k)&&ok(nx,ny)){vistos.add(k);fila.push([nx,ny])}}}
  return vistos;
}
function lugarNoEncontro(a,def,cx,cy,x,y){
  const raio=prende(def)?(def.raio||6)-.9:6;const reg=regiao(a,cx,cy,raio);
  let melhor=null,dist=1e9;
  for(const k of reg){const [tx,ty]=k.split(',').map(Number),px=tx+.5,py=ty+.5;
    if(!livre(a,px,py)||Math.hypot(px-cx,py-cy)<2)continue;
    const d=Math.hypot(px-x,py-y);if(d<dist){dist=d;melhor=[px,py]}}
  return melhor;
}
function surgir(def,onda){
  const a=areas[def.area],ondas=def.ondas,lista=ondas[onda];const ids=[];
  const cx=def.tipo==='emboscada'?G.x:def.x,cy=def.tipo==='emboscada'?G.y:def.y;
  lista.forEach((tipo,i)=>{
    const ang=(i/lista.length)*Math.PI*2+onda*.7+(def.tipo==='emboscada'?Math.atan2(cy-def.y,cx-def.x)+.4:0);
    const dist=def.tipo==='emboscada'?3.8:Math.min(4.2,(def.raio||6)-1.6);
    const p=lugarNoEncontro(a,def,cx,cy,cx+Math.cos(ang)*dist,cy+Math.sin(ang)*dist);if(!p)return;
    const id=`f2e_${def.id}_${tentativa}_${onda}_${i}`;enemy(a,id,p[0],p[1],tipo);
    const e=hydrateEnemy(a.enemies[a.enemies.length-1]);e.f2temp=true;e.f2encontro=def.id;e.f2surge=.9;e.emerge091=1;
    try{addCombatFX(p[0],p[1],'spawn',1.5)}catch{}ids.push(id);
  });
  atual.ids.push(...ids);atual.onda=onda;atual.vivos=ids;
}
function comecar(def){
  tentativa++;atual={def,ids:[],onda:0,vivos:[],pausa:0};
  surgir(def,0);
  const n=def.ondas.length;
  try{
    if(def.tipo==='emboscada')toast('EMBOSCADA · ELES ESTAVAM ESPERANDO O SILÊNCIO');
    else if(def.tipo==='onda')toast(`ONDA DE SILÊNCIO · RESISTA A ${n} ONDAS · A SAÍDA SE FECHA`);
    else toast(`ARENA TRANCADA · ${n} ONDAS · LIMPE PARA SAIR`);
  }catch{}
  try{playTone(def.tipo==='onda'?62:98,.6,'sawtooth',.07)}catch{}
  try{engage()}catch{}
  window.dispatchEvent(new CustomEvent('torii:encontro',{detail:{id:def.id,tipo:def.tipo,fase:'inicio'}}));
}
function concluir(){
  const def=atual.def;estado().feitos[def.id]=true;
  const premio=def.tipo==='onda'?12:def.tipo==='arena'?7:4;G.shards=(G.shards||0)+premio;
  if(def.tipo==='onda'){G.potions=Math.min(9,(G.potions||0)+1)}
  if(G?.defeated)G.defeated=G.defeated.filter(id=>!atual.ids.includes(id));
  atual=null;
  try{toast(def.tipo==='onda'?`A ONDA PASSOU · +${premio} FRAGMENTOS · +1 FITA`:`CAMINHO LIVRE · +${premio} FRAGMENTOS`);updateHUD()}catch{}
  try{playTone(392,.25,'triangle',.06);setTimeout(()=>playTone(523,.3,'triangle',.06),160)}catch{}
  window.dispatchEvent(new CustomEvent('torii:encontro',{detail:{id:def.id,tipo:def.tipo,fase:'fim'}}));
}
function prende(def){return def.tipo==='arena'||def.tipo==='onda'}
function trancar(def){
  for(const t of lutadores()){
    const dx=t.x-def.x,dy=t.y-def.y,d=Math.hypot(dx,dy);if(d<=def.raio)continue;
    const nx=def.x+dx/d*(def.raio-.05),ny=def.y+dy/d*(def.raio-.05);
    if(t.p===1){if(tileWalkable(current,nx,ny)){G.x=nx;G.y=ny}}else{try{C3.coop.x=nx;C3.coop.y=ny}catch{}}
  }
}
function podeComecar(){
  // Também no meio de uma luta de campo: a emboscada soma inimigos à briga.
  return (mode==='walk'||mode==='action')&&!bossActor&&!battle?.boss&&extras()&&C3.combatUnlocked()&&combatAreas10.has(G.area);
}
function tickEncontros(dt){
  if(!G)return;
  if(atual){
    const def=atual.def;
    if(G.area!==def.area||!extras()){cancelar();return}
    if(prende(def))trancar(def);
    const a=areas[def.area];
    atual.vivos=atual.vivos.filter(id=>a.enemies.some(e=>e.id===id&&e.hp>0)&&!G.defeated.includes(id));
    if(atual.vivos.length){
      // Inimigo vivo e jogador andando: a luta continua. Onda parada por muito
      // tempo (inimigo preso atrás de algo): os que sobraram vêm para perto.
      if(mode==='walk')try{engage()}catch{}
      atual.parado=(atual.parado||0)+dt;
      if(atual.parado>40){atual.parado=0;for(const e of a.enemies)if(atual.vivos.includes(e.id)){const p=lugarNoEncontro(a,def,G.x,G.y,G.x+2,G.y);if(p){e.x=p[0];e.y=p[1]}}}
    }else{
      atual.parado=0;
      if(atual.onda+1<def.ondas.length){
        atual.pausa+=dt;
        if(atual.pausa>1.1){atual.pausa=0;surgir(def,atual.onda+1);try{toast(`ONDA ${atual.onda+1}/${def.ondas.length}`);engage()}catch{}}
      }else concluir();
    }
    return;
  }
  if(!podeComecar())return;
  for(const def of ENCONTROS){
    if(def.area!==G.area||feito(def.id))continue;
    try{if(!def.quando(G))continue}catch{continue}
    if(Math.hypot(G.x-def.x,G.y-def.y)<def.r){comecar(def);break}
  }
}
const updateAntes=update;
update=function(dt,...rest){
  const r=updateAntes.call(this,dt,...rest);
  try{tickEncontros(Math.max(0,Math.min(dt||0,.1)))}catch(e){console.warn('fase2: encontro',e)}
  return r;
};
for(const nome of ['setArea','restoreCheckpoint','newGame','continueGame','startChapterTwoPreview']){
  const antes=window[nome];if(typeof antes!=='function')continue;
  window[nome]=function(...a){cancelar();return antes.apply(this,a)};
}
if(typeof C3!=='undefined'&&typeof C3.start==='function'){const antes=C3.start;C3.start=function(...a){cancelar();return antes.apply(this,a)}}
// O combate não termina enquanto houver onda pendente.
// Desenho: barreira da arena, escurecimento da onda e marca de surgimento.
const camadaAntes=drawCombatLayer;
drawCombatLayer=function(...args){
  const r=camadaAntes.apply(this,args);
  try{
    if(!G)return r;
    for(const e of current?.enemies||[])if(e.f2surge>0&&e.hp>0){
      D.marcador({kind:'ring',x:e.x,y:e.y,r:.9,time:e.f2surge,max:.9,cor:'#ff8fb8'},cam);
    }
    if(atual&&prende(atual.def)&&atual.def.area===G.area){
      const def=atual.def,x=def.x*T-cam.x,y=def.y*T-cam.y,R=def.raio*T,t=tick||0;
      ctx.save();
      if(def.tipo==='onda'){ctx.globalAlpha=.16+.04*Math.sin(t*2);ctx.fillStyle='#1c0b25';ctx.fillRect(0,0,VW,VH)}
      for(let i=0;i<28;i++){const a=i/28*Math.PI*2,px=x+Math.cos(a)*R,py=y+Math.sin(a)*R*.62;
        ctx.globalAlpha=.55+.35*Math.sin(t*5+i);ctx.fillStyle=def.tipo==='onda'?'#c46bff':'#ff6f9f';
        ctx.fillRect(Math.round(px)-2,Math.round(py)-14,4,14)}
      ctx.globalAlpha=.4;ctx.strokeStyle=def.tipo==='onda'?'#c46bff':'#ff6f9f';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,R,R*.62,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  }catch{}
  return r;
};
// Desenho dos tipos novos: pose de enemies/v1 com cor, aura e símbolo do papel.
const filtro='filter' in CanvasRenderingContext2D.prototype;
const desenhoAntes=drawCreature;
drawCreature=function(x,y,kind,entity,...rest){
  const t=TIPOS[kind]||TIPOS[entity?.type];
  if(!t)return desenhoAntes.call(this,x,y,kind,entity,...rest);
  const e=entity||{};
  try{ctx.save();ctx.globalAlpha=.25+.1*Math.sin((tick||0)*5);ctx.fillStyle=t.cor;ctx.beginPath();ctx.ellipse(x,y+4,22,9,0,0,Math.PI*2);ctx.fill();ctx.restore()}catch{}
  ctx.save();
  if(filtro)ctx.filter=`hue-rotate(${t.matiz}deg) saturate(1.25)${e.f2tonto>0?' brightness(1.35)':''}`;
  // Direto na arte de enemies/v1: o desenho dos tipos musicais (aura do
  // Abafador, anel do Metrônomo) diria uma mecânica que este inimigo não tem.
  try{
    const proxy={wind:e.wind,flash:e.flash,stun:e.stun,emerge091:e.emerge091,type:t.base};
    if(!(typeof EnemyArtV1!=='undefined'&&EnemyArtV1.draw(x,y,t.base,proxy)))desenhoAntes.call(this,x,y,'hush',proxy,...rest);
  }finally{ctx.restore()}
  try{
    ctx.save();ctx.lineWidth=3;ctx.strokeStyle=t.cor;ctx.fillStyle=t.cor;
    if(t.papel==='escudo'){
      const a=e.face||0,aberto=e.f2aberto>0||e.f2tonto>0;ctx.globalAlpha=aberto?.3:.9;
      ctx.beginPath();ctx.ellipse(x,y-22,28,30,0,a-1.1,a+1.1);ctx.stroke();
      if(!aberto){ctx.globalAlpha=.25;ctx.beginPath();ctx.moveTo(x,y-22);ctx.ellipse(x,y-22,28,30,0,a-1.1,a+1.1);ctx.closePath();ctx.fill()}
    }else if(t.papel==='curador'){
      ctx.globalAlpha=.9;ctx.fillRect(x-2,y-62,4,12);ctx.fillRect(x-6,y-58,12,4);
      if(e.f2canto>0){ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(x,y-30,30+8*Math.sin((tick||0)*10),0,Math.PI*2);ctx.stroke()}
    }else if(t.papel==='invocador'){
      ctx.globalAlpha=.85;ctx.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*4/5+(tick||0)*(e.f2chamar>0?3:.6);const px=x+Math.cos(a)*9,py=y-60+Math.sin(a)*9;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.stroke();
    }else if(t.papel==='atirador'){
      ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x,y-60,6,0,Math.PI*2);ctx.stroke();ctx.fillRect(x-1,y-70,2,6);ctx.fillRect(x-1,y-54,2,6);ctx.fillRect(x-10,y-61,6,2);ctx.fillRect(x+4,y-61,6,2);
    }
    if(e.f2tonto>0){ctx.globalAlpha=.9;ctx.fillStyle='#fff6c8';for(let i=0;i<3;i++){const a=(tick||0)*6+i*2.1;ctx.fillRect(x+Math.cos(a)*14-2,y-70+Math.sin(a)*4,4,4)}}
    ctx.restore();
  }catch{}
};

window.ToriiEncontros={TIPOS,EXTRAS,ENCONTROS,atual:()=>atual,feito,cancelar,chaoLivre,livre};
})();
