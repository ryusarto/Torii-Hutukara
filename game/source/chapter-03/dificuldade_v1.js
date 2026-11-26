/* TORII & HUTUKARA — Fase 2: níveis de dificuldade e fases dos chefes.
 *
 * Três níveis, escolhidos ao começar (Nova jornada e inícios diretos) e
 * trocáveis em Menu → Sistema fora de combate:
 *   historia — o jogo de hoje, sem nenhuma mudança de combate.
 *   normal   — chefes com 2,5× de vida e três fases (o Viajante e o Arauto
 *              ganham a fase III); mais inimigos, tipos novos e encontros
 *              (encontros_v1.js); impacto no golpe (impacto_v1.js).
 *   dificil  — tudo do Normal, e os inimigos ganham padrões novos.
 *
 * O nível fica em G.difficulty (campo aditivo; saves sem ele são História).
 * A Fenda do pós-jogo tem regras próprias e não é afetada.
 * Ajuste fino: NIVEIS e AJUSTE_CHEFE. A meta do Normal (o bot simples perde de
 * 20% a 40% das lutas contra chefes) é medida por qa/dificuldade_bot.cjs.
 */
(function(){
'use strict';
const NIVEIS={
  historia:{nome:'Fácil',resumo:'Para aproveitar a história e explorar no seu ritmo, com combates mais tranquilos.',
    chefe:{vida:1,dano:1,fases:false,eco:false},inimigo:{vida:1,dano:1},extras:false,padroes:false,impacto:false},
  normal:{nome:'Médio',resumo:'Uma experiência equilibrada entre história, exploração e combate.',
    chefe:{vida:2.5,dano:1,fases:true,eco:false},inimigo:{vida:1,dano:1},extras:true,padroes:false,impacto:true},
  dificil:{nome:'Difícil',resumo:'Para quem busca um desafio maior, com inimigos mais exigentes e combates que pedem estratégia.',
    chefe:{vida:2.5,dano:1.2,fases:true,eco:true},inimigo:{vida:1.15,dano:1.15},extras:true,padroes:true,impacto:true},
};
const ORDEM=['historia','normal','dificil'];
// Ajuste por chefe nos níveis com fases. dano multiplica o dano que o chefe
// causa; cadencia3 multiplica a recarga entre ataques na fase III.
const AJUSTE_CHEFE={
  boss:{nome:'O VIAJANTE',dano:.8,cadencia3:.8,golpe3:'eco',rotulo3:'A MÁSCARA SE PARTE'},
  voice_boss:{nome:'ARAUTO',dano:.78,cadencia3:.85,golpe3:'cruz',rotulo3:'ESTÁTICA TOTAL'},
  c3_metronome:{nome:'O METRÔNOMO',dano:.9,cadencia3:.9,golpe3:'compasso',rotulo3:'SEM GRADE'},
  c3_silence:{nome:'O SILÊNCIO',dano:1.15,cadencia3:.9,golpe3:'vazio',rotulo3:'O VAZIO RESPONDE'},
};
const ROMANO=['','I','II','III','IV'];

function reconhecido(n){return typeof n==='string'&&ORDEM.includes(n)&&Object.hasOwn(NIVEIS,n)}
function nivel(g=typeof G!=='undefined'?G:null){const n=g?.difficulty;return reconhecido(n)?n:'historia'}
function cfg(g){return NIVEIS[nivel(g)]}
function naFenda(){try{return typeof PostGame!=='undefined'&&PostGame.active()}catch{return false}}
function ativo(){return nivel()!=='historia'&&!naFenda()}
function definir(n){if(!G||!reconhecido(n))return;G.difficulty=n;try{updateHUD()}catch{}}

// ---------------- avisos no chão (feitos em código) ----------------
// Quatro marcadores: círculo, faixa, cruz e cone. As quatro marcas do
// "compasso" acendem uma a uma até o golpe, para dar para contar o tempo.
const COR={perigo:'#ff5d8f',claro:'#ffd1de',cura:'#7cf0a8',invoca:'#c9a2ff',escudo:'#f5c66b'};
function compasso(x,y,k,cor,raio){
  // k: 0 → 1 (fração do tempo de aviso já passada)
  const marcas=4,acesas=Math.min(marcas,Math.floor(k*marcas+.0001));
  for(let i=0;i<marcas;i++){
    const a=-Math.PI/2+i*Math.PI/2,px=x+Math.cos(a)*(raio+7),py=y+Math.sin(a)*(raio*.55+5);
    ctx.globalAlpha=i<acesas?.95:.3;ctx.fillStyle=i<acesas?cor:'#2b1b2c';
    ctx.fillRect(Math.round(px)-3,Math.round(py)-3,6,6);
  }
}
function marcador(m,cam){
  const k=Math.max(0,Math.min(1,1-m.time/m.max)),cor=m.cor||COR.perigo;
  const x=m.x*T-cam.x,y=m.y*T-cam.y;
  ctx.save();ctx.lineWidth=2;ctx.strokeStyle=cor;
  const fundo=(a)=>{ctx.globalAlpha=a;ctx.fillStyle=cor};
  if(m.kind==='ring'){
    const r=m.r*T;fundo(.12+.18*k);ctx.beginPath();ctx.ellipse(x,y,r,r*.62,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.85;ctx.stroke();fundo(.35);ctx.beginPath();ctx.ellipse(x,y,r*k,r*.62*k,0,0,Math.PI*2);ctx.fill();
    compasso(x,y,k,cor,r);
  }else if(m.kind==='line'){
    const len=m.len*T,w=m.width*T;ctx.translate(x,y);ctx.rotate(m.angle);
    fundo(.12+.15*k);ctx.fillRect(0,-w/2,len,w);ctx.globalAlpha=.85;ctx.strokeRect(0,-w/2,len,w);
    fundo(.38);ctx.fillRect(0,-w/2,len*k,w);
    ctx.rotate(-m.angle);ctx.translate(-x,-y);compasso(x,y,k,cor,10);
  }else if(m.kind==='cross'){
    const len=m.len*T,w=m.width*T;
    for(const a of [0,Math.PI/2]){ctx.save();ctx.translate(x,y);ctx.rotate(a);fundo(.1+.16*k);ctx.fillRect(-len,-w/2,len*2,w);ctx.globalAlpha=.8;ctx.strokeRect(-len,-w/2,len*2,w);fundo(.34);ctx.fillRect(-len*k,-w/2,len*2*k,w);ctx.restore()}
    compasso(x,y,k,cor,14);
  }else if(m.kind==='cone'){
    const r=m.r*T;fundo(.12+.18*k);ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,m.angle-m.arc,m.angle+m.arc);ctx.closePath();ctx.fill();
    ctx.globalAlpha=.85;ctx.stroke();fundo(.36);ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r*k,m.angle-m.arc,m.angle+m.arc);ctx.closePath();ctx.fill();
    compasso(x,y,k,cor,12);
  }else if(m.kind==='donut'){
    const r=m.r*T,ri=m.inner*T;fundo(.12+.18*k);ctx.beginPath();ctx.ellipse(x,y,r,r*.62,0,0,Math.PI*2);ctx.ellipse(x,y,ri,ri*.62,0,0,Math.PI*2,true);ctx.fill('evenodd');
    ctx.globalAlpha=.85;ctx.stroke();compasso(x,y,k,cor,r);
  }
  ctx.restore();
}

// ---------------- perigos com aviso (chefes e inimigos novos) ----------------
const perigos=[];
function lutadores(){
  const out=[];if(!G)return out;
  if(G.hp[G.active]>0)out.push({x:G.x,y:G.y,p:1});
  try{if(C3.coopActive()&&G.hp[C3.coopMember()]>0)out.push({x:C3.coop.x,y:C3.coop.y,p:2})}catch{}
  return out;
}
function dentro(h,t){
  const dx=t.x-h.x,dy=t.y-h.y;
  if(h.kind==='ring')return Math.hypot(dx,dy)<h.r;
  if(h.kind==='donut'){const d=Math.hypot(dx,dy);return d<h.r&&d>h.inner}
  if(h.kind==='line'){const c=Math.cos(h.angle),s=Math.sin(h.angle),along=dx*c+dy*s,across=-dx*s+dy*c;return along>-.3&&along<h.len&&Math.abs(across)<h.width/2+.25}
  if(h.kind==='cross')return (Math.abs(dy)<h.width/2+.25&&Math.abs(dx)<h.len)||(Math.abs(dx)<h.width/2+.25&&Math.abs(dy)<h.len);
  if(h.kind==='cone'){const d=Math.hypot(dx,dy);if(d>h.r)return false;const a=Math.atan2(dy,dx);return Math.abs(Math.atan2(Math.sin(a-h.angle),Math.cos(a-h.angle)))<h.arc+.08}
  return false;
}
function perigo(h){
  const p={time:h.time??1,max:h.time??1,damage:6,area:G?.area,...h};
  perigos.push(p);if(perigos.length>40)perigos.shift();return p;
}
function resolverPerigo(h){
  if(h.dono&&h.dono.hp<=0&&!h.semDono)return;
  if(h.antes)try{h.antes(h)}catch(e){console.warn('fase2: perigo',e)}
  if(h.damage>0){
    // P2 antes de P1: a queda do líder pode promover o companheiro no mesmo golpe.
    for(const t of lutadores().sort((a,b)=>b.p-a.p))if(dentro(h,t)){
      if(t.p===2){try{C3.damageCoop(h.damage)}catch{}}else damageHero(h.damage,h);
    }
  }
  try{addCombatFX(h.x,h.y,h.kind==='ring'||h.kind==='donut'?'strike':'hit',Math.min(3,h.r||1.4))}catch{}
  if(h.depois)try{h.depois(h)}catch(e){console.warn('fase2: perigo',e)}
}
function tickPerigos(dt){
  for(let i=perigos.length-1;i>=0;i--){
    const h=perigos[i];
    if(h.area!==G?.area||mode!=='action'){perigos.splice(i,1);continue}
    if(h.atraso>0){h.atraso-=dt;continue}
    h.time-=dt;if(h.time<=0){perigos.splice(i,1);resolverPerigo(h)}
  }
}
function limparPerigos(){perigos.length=0}

// ---------------- chefes: vida, fases, transição e golpe da fase III ----------------
const C3_CHEFES=new Set(['c3_metronome','c3_silence']);
function faseChefe(e){
  if(C3_CHEFES.has(e.id))return e.phase||1;
  if(e.hp<e.max*.25)return 3;
  return e.hp<e.max*.5?2:1;
}
function prepararChefe(e){
  if(e.f2)return e.f2;
  const c=cfg();
  e.f2={nivel:nivel(),fase:faseChefe(e),pausa:0,imune:0,transicao:0,cdAntes:e.cd||0};
  // Mantém a proporção: na rota Usina o Silêncio já começa com 12% a menos.
  if(c.chefe.vida!==1&&e.max>0){const parte=e.hp/e.max;e.max=Math.round(e.max*c.chefe.vida);e.hp=Math.max(1,Math.round(e.max*parte))}
  try{updateActionHUD()}catch{}
  return e.f2;
}
function empurrar(e,dist){
  for(const t of lutadores()){
    const dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1;if(d>=dist)continue;
    moveActor121(t.p===1?G:C3.coop,dx/d,dy/d,dist-d);
  }
}
function transicao(e,fase){
  const a=AJUSTE_CHEFE[e.id]||{nome:'CHEFE'};
  e.f2.fase=fase;e.f2.pausa=1.25;e.f2.imune=1.55;e.f2.transicao=1.25;
  e.wind=0;e.tele09=null;
  try{if(C3_CHEFES.has(e.id))C3.hazards.length=0}catch{}
  hostileShots.length=0;limparPerigos();empurrar(e,3.2);
  act.invuln=Math.max(act.invuln||0,.6);
  try{toast(`${a.nome} · FASE ${ROMANO[fase]}${fase===3&&a.rotulo3?' · '+a.rotulo3:''}`)}catch{}
  try{addCombatFX(e.x,e.y,'pulse',4.2);addCombatFX(e.x,e.y,'spawn',3)}catch{}
  screenShake=Math.max(screenShake,.32);
  try{playTone(70,.5,'sawtooth',.08);setTimeout(()=>playTone(fase===3?196:147,.35,'triangle',.07),180)}catch{}
  (e.f2.log=e.f2.log||[]).push('fase'+fase);
}
function golpeFase3(e){
  const a=AJUSTE_CHEFE[e.id];if(!a)return;
  const dano=Math.max(6,Math.round((e.power||12)*.8));
  const alvos=lutadores();if(!alvos.length)return;
  if(a.golpe3==='eco'){
    for(const t of alvos)perigo({kind:'ring',x:t.x,y:t.y,r:1.55,time:.95,damage:dano,dono:e});
  }else if(a.golpe3==='cruz'){
    const t=alvos[0];perigo({kind:'cross',x:t.x,y:t.y,len:9,width:.85,time:1.05,damage:dano+2,dono:e});
  }else if(a.golpe3==='compasso'){
    for(const t of alvos)for(let i=0;i<2;i++)perigo({kind:'ring',x:t.x,y:t.y,r:1.35,time:.7,atraso:i*.55,damage:dano,dono:e});
  }else if(a.golpe3==='vazio'){
    const t=alvos[0];perigo({kind:'donut',x:t.x,y:t.y,r:3.1,inner:1.15,time:1.1,damage:dano+2,dono:e});
  }
  (e.f2.log=e.f2.log||[]).push('golpe3');
}
function ecoDificil(e){
  for(const t of lutadores())perigo({kind:'ring',x:t.x,y:t.y,r:1.25,time:1,damage:Math.max(5,Math.round((e.power||10)*.6)),dono:e});
}
function ataqueResolvido(e){
  const c=cfg();if(!c.chefe.fases)return;
  if(e.f2.fase>=3)golpeFase3(e);
  else if(c.chefe.eco&&e.f2.fase>=2)ecoDificil(e);
}

const updAntes=updateEnemy;
updateEnemy=function(e,dt,isBoss=false,...rest){
  if(!(isBoss&&e&&e===bossActor&&ativo()&&cfg().chefe.fases)){
    if(!isBoss&&e&&ativo()&&cfg().padroes)return padroesNovos(e,dt,isBoss,rest);
    return updAntes.call(this,e,dt,isBoss,...rest);
  }
  const f=prepararChefe(e);
  f.imune=Math.max(0,f.imune-dt);f.transicao=Math.max(0,f.transicao-dt);
  if(f.pausa>0){f.pausa-=dt;e.flash=Math.max(e.flash||0,.05);return}
  const antes={wind:e.wind||0,tele:!!e.tele09,haz:C3_CHEFES.has(e.id)?(C3.hazards||[]).length:0,cd:e.cd||0};
  const r=updAntes.call(this,e,dt,isBoss,...rest);
  if(e.hp<=0||bossActor!==e)return r;
  const fase=faseChefe(e);
  if(fase>f.fase){transicao(e,fase);return r}
  let resolveu=false;
  if(e.id==='voice_boss')resolveu=antes.tele&&!e.tele09;
  else if(C3_CHEFES.has(e.id))resolveu=antes.haz>0&&(C3.hazards||[]).length===0;
  else resolveu=antes.wind>0&&(e.wind||0)<=0;
  if(resolveu)ataqueResolvido(e);
  // Recarga recém-definida: mais curta na fase III.
  if((e.cd||0)>antes.cd+1e-6&&f.fase>=3)e.cd*=(AJUSTE_CHEFE[e.id]?.cadencia3||1);
  if(e.id==='voice_boss'&&f.fase>=3&&e.volley091>2.1)e.volley091=2.1;
  return r;
};

// Imune durante a transição de fase.
const hitAntes=hitEnemy;
hitEnemy=function(e,damage,...rest){
  if(e&&e.f2&&e.f2.imune>0&&ativo()){try{addCombatFX(e.x,e.y,'hit',.35)}catch{}return}
  return hitAntes.call(this,e,damage,...rest);
};

// Dano por nível (e ajuste fino por chefe).
const danoAntes=damageHero;
damageHero=function(dmg,from,...rest){
  if(ativo()&&from&&Number.isFinite(dmg)){
    const c=cfg();
    if(from===bossActor)dmg=dmg*c.chefe.dano*(AJUSTE_CHEFE[from.id]?.dano||1);
    else if(from.dono&&from.dono===bossActor)dmg=dmg*c.chefe.dano*(AJUSTE_CHEFE[from.dono.id]?.dano||1);
    // Tiros soltos durante a luta de chefe (leque do Arauto, chuva do Silêncio).
    else if(bossActor&&battle?.boss&&from.vx!==undefined)dmg=dmg*c.chefe.dano*(AJUSTE_CHEFE[bossActor.id]?.dano||1);
    else if(from.type&&from.hp!==undefined)dmg=dmg*c.inimigo.dano;
    // Arredondamento sorteado: a média é o valor exato, sem degraus de 1 ponto.
    const base=Math.floor(dmg);dmg=Math.max(1,base+(Math.random()<dmg-base?1:0));
  }
  return danoAntes.call(this,dmg,from,...rest);
};

// Inimigos comuns: mais vida no Difícil.
const hidratarAntes=hydrateEnemy;
hydrateEnemy=function(e,...rest){
  const novo=e&&e.hp===undefined;const r=hidratarAntes.call(this,e,...rest);
  if(novo&&e&&ativo()){const v=cfg().inimigo.vida;if(v!==1){e.max=e.hp=Math.round(e.hp*v)}e.f2nivel=nivel()}
  return r;
};

// ---------------- Difícil: padrões novos dos inimigos de sempre ----------------
const CORPO_A_CORPO=new Set(['hush','c3_echo','c3_drone']);
function padroesNovos(e,dt,isBoss,rest){
  const wind=e.wind||0,kind=e.windKind,tiros=hostileShots.length,batidas=(e.log||[]).length,retaliar=e.retaliate||0;
  const r=updAntes.call(this,e,dt,isBoss,...rest);
  if(!e||e.hp<=0)return r;
  // Sombra (orbe): leque de três.
  if(hostileShots.length>tiros&&(e.type==='whisper'||kind==='orb')){
    const s=hostileShots[hostileShots.length-1];if(s&&!s.f2){const a=Math.atan2(s.vy,s.vx),v=Math.hypot(s.vx,s.vy);
      for(const d of [-.32,.32])hostileShots.push({...s,vx:Math.cos(a+d)*v,vy:Math.sin(a+d)*v,f2:true});s.f2=true}
  }
  // Corpo a corpo: depois do golpe, às vezes avança em linha (aviso de 0,45 s).
  if(CORPO_A_CORPO.has(e.type)&&wind>0&&(e.wind||0)<=0&&kind==='swipe'&&!(e.f2avanco>0)){
    e.f2n=(e.f2n||0)+1;
    if(e.f2n%2===0){const t=lutadores()[0];if(t){const ang=Math.atan2(t.y-e.y,t.x-e.x);e.f2avanco=1.2;
      perigo({kind:'line',x:e.x,y:e.y,angle:ang,len:3.2,width:.9,time:.5,damage:e.power,dono:e,depois:h=>{
        for(let s=0;s<12;s++){const nx=e.x+Math.cos(ang)*.26,ny=e.y+Math.sin(ang)*.26;if(!tileWalkable(current,nx,ny))break;e.x=nx;e.y=ny}}})}}
  }
  if(e.f2avanco>0)e.f2avanco-=dt;
  // Metrônomo Menor: cada batida deixa um contratempo no lugar de quem luta.
  if(e.type==='compasso'&&(e.log||[]).length>batidas&&e.clock>1.6)
    for(const t of lutadores())if(Math.hypot(t.x-e.x,t.y-e.y)<6)perigo({kind:'ring',x:t.x,y:t.y,r:1.1,time:.8,damage:Math.round(e.power*.7),dono:e});
  // Eco Espelho: a onda devolvida também solta seis notas.
  if(e.type==='espelho'&&retaliar>0&&!(e.retaliate>0))
    for(let i=0;i<6;i++){const a=i*Math.PI/3;hostileShots.push({x:e.x,y:e.y,vx:Math.cos(a)*4.2,vy:Math.sin(a)*4.2,time:1.6,damage:Math.round(e.power*.8),f2:true})}
  // Abafador: o golpe abre um anel de abafamento logo depois.
  if(e.type==='abafador'&&wind>0&&(e.wind||0)<=0)
    perigo({kind:'ring',x:e.x,y:e.y,r:2.3,time:.6,damage:Math.round(e.power*.8),dono:e});
  return r;
}

// ---------------- laço, desenho e HUD ----------------
const updateAntes=update;
update=function(dt,...rest){
  const r=updateAntes.call(this,dt,...rest);
  if(G&&mode==='action'&&ativo())tickPerigos(Math.max(0,Math.min(dt||0,.1)));
  else if(perigos.length&&mode!=='overlay')limparPerigos();
  return r;
};
function desenharChao(){
  if(!G||!perigos.length)return;
  for(const h of perigos)if(h.area===G.area&&!(h.atraso>0))marcador(h,cam);
}
if(typeof BossChoreographyV2!=='undefined'&&typeof BossChoreographyV2.drawGround==='function'){
  const chaoAntes=BossChoreographyV2.drawGround.bind(BossChoreographyV2);
  BossChoreographyV2.drawGround=function(...a){const r=chaoAntes(...a);try{desenharChao()}catch{}return r};
}else{
  const camadaAntes=drawCombatLayer;drawCombatLayer=function(...a){const r=camadaAntes.apply(this,a);try{desenharChao()}catch{}return r};
}
// Fase III: brilho e rachaduras sobre o chefe; transição: anel e clarão.
function rachaduras(x,y,s){
  ctx.beginPath();
  for(let i=0;i<7;i++){let a=i*.9+.4,px=x,py=y;ctx.moveTo(px,py);
    for(let j=0;j<4;j++){a+=Math.sin(i*3.1+j*1.7)*.55;px+=Math.cos(a)*s*(.5+((i+j)%3)*.2);py+=Math.sin(a)*s*(.5+((i*j)%3)*.18);ctx.lineTo(px,py)}}
  ctx.stroke();
}
const camadaAntes=drawCombatLayer;
drawCombatLayer=function(...args){
  const r=camadaAntes.apply(this,args);
  try{
    const e=bossActor;if(!G||!e||!e.f2||!ativo())return r;
    const x=e.x*T-cam.x,y=e.y*T-cam.y-(C3_CHEFES.has(e.id)?58:44),t=tick||0;
    if(e.f2.transicao>0){
      const k=1-e.f2.transicao/1.25;ctx.save();ctx.globalAlpha=(1-k)*.85;ctx.strokeStyle='#fff3f7';ctx.lineWidth=4;
      ctx.beginPath();ctx.ellipse(x,y+40,30+k*170,(30+k*170)*.6,0,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=Math.max(0,.5-k)*.9;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,40+k*30,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    if(e.f2.fase>=3){
      ctx.save();ctx.globalCompositeOperation='lighter';const p=.55+.25*Math.sin(t*7);
      const g=ctx.createRadialGradient(x,y,4,x,y,70);g.addColorStop(0,`rgba(255,120,170,${.42*p})`);g.addColorStop(1,'rgba(255,60,120,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,70,0,Math.PI*2);ctx.fill();
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.55+.3*p;ctx.strokeStyle='#ffe2ec';ctx.lineWidth=2;rachaduras(x,y,13);
      ctx.restore();
    }
  }catch{}
  return r;
};
const hudAntes=updateActionHUD;
updateActionHUD=function(...args){
  const r=hudAntes.apply(this,args);
  try{if(G&&bossActor&&bossActor.f2&&ativo()&&!C3_CHEFES.has(bossActor.id)&&bossActor.f2.fase>=3){const el=$('actionEnemy');if(el&&!/FASE III/.test(el.textContent))el.textContent=/FASE II/.test(el.textContent)?el.textContent.replace(/FASE II\b/,'FASE III'):el.textContent+' · FASE III'}}catch{}
  return r;
};
// Saindo da luta, trocando de área ou voltando ao checkpoint: sem perigos pendentes.
for(const nome of ['setArea','showDefeat','finishBoss','newGame','continueGame']){
  const antes=window[nome];if(typeof antes!=='function')continue;
  window[nome]=function(...a){limparPerigos();return antes.apply(this,a)};
}
// Voltar ao checkpoint mantém o nível escolhido (o snapshot pode ser anterior à troca).
const restaurarAntes=restoreCheckpoint;
restoreCheckpoint=function(...a){const n=G?.difficulty;const r=restaurarAntes.apply(this,a);if(G&&n)G.difficulty=n;limparPerigos();return r};

// ---------------- escolha do nível ----------------
function escolher(pronto,origem='NOVA JORNADA'){
  const botoes=ORDEM.map(n=>menuButton10('dif_'+n,NIVEIS[n].nome+(n==='normal'?' · recomendado':''),NIVEIS[n].resumo)).join('');
  enterMenu10(pauseHeader10('Escolha a dificuldade',origem)+`<div class="menu-grid10">${botoes}${menuButton10('dif_voltar','Voltar','Retornar à tela inicial')}</div><p class="menu-note10">Você pode mudar a dificuldade nas opções, fora de combate.</p>`,'difficulty');
  for(const n of ORDEM)$('dif_'+n).onclick=()=>{closeOverlay();pronto(n)};
  $('dif_voltar').onclick=closeOverlay;
  try{$('dif_normal').focus()}catch{}
}
const iniciarAntes=init;
init=function(...a){
  const r=iniciarAntes.apply(this,a);
  const novo=$('startNew');
  if(novo)novo.onclick=()=>{if(safeLoad()&&!confirm('Começar uma nova jornada? O salvamento automático atual será substituído. Exporte antes se quiser guardá-lo.'))return;escolher(n=>{newGame();definir(n)})};
  return r;
};
if(typeof openTitleOptions10==='function'){
  const opcoesAntes=openTitleOptions10;
  openTitleOptions10=function(...a){
    const r=opcoesAntes.apply(this,a);
    const c3=$('previewC3'),c2=$('preview10');
    if(c3)c3.onclick=()=>escolher(n=>{C3.start(true);definir(n)},'CAPÍTULO 03');
    if(c2)c2.onclick=()=>escolher(n=>{startChapterTwoPreview();definir(n)},'CAPÍTULO 02');
    return r;
  };
}
// Menu → Sistema: trocar o nível fora de combate.
if(typeof openSettings10==='function'){
  const sistemaAntes=openSettings10;
  openSettings10=function(...a){
    const r=sistemaAntes.apply(this,a);
    try{
      const status=$('status10');if(!status||!G)return r;
      const linha=document.createElement('div');linha.className='row';
      const b=document.createElement('button');b.className='action';b.id='difficulty10';
      const emLuta=!!(battle||mode==='action'||bossActor);
      b.textContent='DIFICULDADE · '+NIVEIS[nivel()].nome.toUpperCase();b.disabled=emLuta;
      b.title=emLuta?'Troque fora de combate':NIVEIS[nivel()].resumo;
      b.onclick=()=>{const i=ORDEM.indexOf(nivel());definir(ORDEM[(i+1)%ORDEM.length]);save(true);openSettings10();
        const s=$('status10');if(s)s.textContent=NIVEIS[nivel()].nome+': '+NIVEIS[nivel()].resumo};
      linha.appendChild(b);
      // Acima das outras opções (Efeitos, Texto…), antes de Tela inicial e Voltar.
      const opcoes=$('motion10')?.parentNode;if(opcoes&&opcoes.parentNode){linha.className=opcoes.className;linha.style.marginBottom=getComputedStyle(opcoes).rowGap&&getComputedStyle(opcoes).rowGap!=='normal'?getComputedStyle(opcoes).rowGap:'10px';opcoes.parentNode.insertBefore(linha,opcoes)}else status.parentNode.insertBefore(linha,status);
    }catch(e){console.warn('fase2: menu',e)}
    return r;
  };
}

window.ToriiDificuldade={NIVEIS,ORDEM,AJUSTE_CHEFE,nivel,cfg,ativo,definir,escolher,perigo,perigos,limparPerigos,marcador,lutadores,faseChefe,COR};
})();
