/* Revisão v7 · correções da crítica da Beta 1.15.0.
 * Carregado por último. Cada bloco cita o problema que resolve.
 */
'use strict';
const RevisaoV7=(()=>{
const R={version:1};

/* ---------- 1. Queda no Mar de Nuvens ----------
 * Antes: cair era derrota e restaurava o último gravador (no Distrito), desfazendo a
 * abertura do Elevador. Agora a queda devolve o corpo à última borda firme e custa 25%
 * da vida de quem caiu. Só vira derrota se não sobrar ninguém de pé. Ao entrar nas nuvens
 * com o elevador aberto, o jogo grava um ponto de retorno ali. */
R.FALL_COST=.25;
if(typeof CloudWorldV1!=='undefined'){
  CloudWorldV1.stepFall=function(dt){
    const f=this.fall;if(!f)return;
    f.elapsed=Math.min(f.duration,f.elapsed+dt);
    if(f.elapsed+1e-7<f.duration)return;
    Object.assign(f.body,f.safe);this.fall=null;this.followers.clear();
    const hero=f.hero,max=G.maxhp[hero]||G.hp[hero]||1;
    G.hp[hero]=Math.max(0,Math.round((G.hp[hero]||0)-max*R.FALL_COST));
    if(f.coop){if(G.hp[hero]<=0&&typeof C3.coopDown==='function')C3.coopDown();mode='walk';return}
    if(G.hp[hero]<=0){
      const next=partyMembers().find(id=>id!==hero&&G.hp[id]>0);
      if(!next){showDefeat();return}
      G.active=next;
    }
    if(typeof trail!=='undefined'){trail.length=0}
    act.invuln=Math.max(act.invuln||0,1);mode='walk';
    try{updateHUD();save()}catch{}
    toast(G.hp[hero]>0?'A NUVEM DEVOLVEU VOCÊS À BORDA · −'+Math.round(max*R.FALL_COST)+' DE VIDA':'QUEM CAIU PRECISA DESCANSAR · OUTRO MÚSICO ASSUME');
  };
}
R.cloudCheckpoint=function(){
  if(!G?.c3?.started||G.c3.complete)return;
  if(G.area==='cloud_sea'&&G.c3.liftOpen&&!G.c3.metronomeSeen&&G.checkpoint?.area!=='cloud_sea'&&G.checkpoint?.area!=='cloud_terrace'){
    setCheckpoint('c3_clouds','cloud_sea',G.x,G.y,true);
  }
};
const setAreaV7=setArea;
setArea=function(...args){const r=setAreaV7.apply(this,args);try{R.cloudCheckpoint()}catch{}return r};

/* ---------- 2. Falas soltas e rádio ----------
 * Antes: a camada de falas ficava acima de tudo; uma fala iniciada em combate continuava
 * por cima do menu, da composição final e da tela de fim. O rádio aparecia sobre o
 * quadro de vida. Agora a camada some fora de exploração/combate e o rádio fica abaixo
 * da coluna da esquerda. */
const css=document.createElement('style');css.id='revisaoV7Css';
css.textContent=`
html.r7-quiet #barksCamada{visibility:hidden!important}
html.r7-menu #cenaLegenda{visibility:hidden!important}
#overlay .notes{flex-wrap:wrap}
#overlay .notes .note{width:auto;min-width:86px;height:auto;min-height:76px;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 10px;line-height:1}
#overlay .notes .note small{display:block;font-size:11px;letter-spacing:.08em;white-space:nowrap}
#barksCamada .bark.radio{top:var(--r7top,52px)!important;left:var(--r7left,10px)!important;max-width:min(260px,40vw)}
`;
document.head.appendChild(css);
R.quiet=function(){
  const ov=document.getElementById('overlay'),dlg=document.getElementById('dialogue'),cin=document.getElementById('cinema');
  const open=e=>e&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none';
  return !G||!['walk','action'].includes(mode)||open(ov)||open(dlg)||(cin&&cin.style.display&&cin.style.display!=='none');
};
R.placeRadio=function(){
  const list=[...document.querySelectorAll('#barksCamada .bark.radio')];if(!list.length)return;
  const game=document.getElementById('game')?.getBoundingClientRect();if(!game)return;
  let top=game.top+52,left=game.left+10;
  for(const sel of ['.location','#vitals092','#mobileLeft121']){
    const e=document.querySelector(sel);if(!e)continue;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;
    const r=e.getBoundingClientRect();if(r.width<4||r.left>game.left+game.width/2)continue;top=Math.max(top,r.bottom+8);left=Math.max(left,r.left)}
  // Celular em pé: a coluna esquerda pode terminar fora do quadro; o rádio sobe para o topo do quadro.
  if(top>game.bottom-60)top=game.top+8;
  list.forEach((e,i)=>{e.style.setProperty('--r7top',(top+i*58)+'px');e.style.setProperty('--r7left',left+'px')});
};
R.frame=function(){
  const q=R.quiet();document.documentElement.classList.toggle('r7-quiet',!!q);
  const ov=document.getElementById('overlay');document.documentElement.classList.toggle('r7-menu',!!ov&&!ov.classList.contains('hidden'));
  R.placeRadio();R.placeCaption();
};
/* ---------- 5. Legenda do narrador × avisos ----------
 * Antes: as duas usavam a mesma faixa no topo do quadro e se sobrepunham (início de chefe,
 * Usina). Agora a legenda desce para logo abaixo do aviso enquanto ele estiver na tela. */
R.placeCaption=function(){
  const c=document.getElementById('cenaLegenda'),t=document.getElementById('toast');if(!c)return;
  const tv=t&&!t.classList.contains('hidden')&&getComputedStyle(t).display!=='none'&&t.getBoundingClientRect().height>2;
  if(tv){const r=t.getBoundingClientRect();c.style.setProperty('top',Math.round(r.bottom+6)+'px','important');c.dataset.r7='abaixo'}
  else if(c.dataset.r7){c.style.removeProperty('top');delete c.dataset.r7;const g=document.getElementById('game')?.getBoundingClientRect();c.style.top=Math.max(12,(g?g.top:0)+14)+'px'}
};
setInterval(()=>{try{R.placeCaption()}catch{}},150);
const updateV7=update;
update=function(...a){const r=updateV7.apply(this,a);try{R.frame()}catch{}return r};
for(const name of ['enterMenu10','openOverlay','closeOverlay','openSystem','talk','showCinema']){
  if(typeof window[name]!=='function')continue;const before=window[name];
  window[name]=function(...a){const r=before.apply(this,a);try{R.frame()}catch{}return r};
}

/* ---------- 4. Grupo encavalado ----------
 * Antes: os seguidores ficavam a 0,85 casa um do outro no rastro; com sprites de
 * ~1,5 casa de largura, os três se cobriam, parados ou andando, e escondiam inimigos.
 * Agora: andando, 1,3 casa entre cada um no rastro; parados, o grupo abre em leque atrás
 * do líder (um de cada lado). As posições deslizam até o lugar, sem saltos. Co-op e
 * Mar de Nuvens (borda) mantêm as regras próprias. */
R.SPACING=1.45;R.IDLE_AFTER=.3;R.SLIDE=7;
const facing=()=>{const a=G.aim091;if(a&&Math.hypot(a[0],a[1])>.1){const n=Math.hypot(a[0],a[1]);return [a[0]/n,a[1]/n]}return ({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[G.dir]||[0,1]};
function trailPoint(dist){
  let d=0,prev={x:G.x,y:G.y,dir:G.dir};
  for(const p of (typeof trail!=='undefined'?trail:[])){const seg=Math.hypot(p.x-prev.x,p.y-prev.y);if(seg>1e-4&&d+seg>=dist){const t=(dist-d)/seg;return {x:prev.x+(p.x-prev.x)*t,y:prev.y+(p.y-prev.y)*t,dir:p.dir||prev.dir}}d+=seg;prev=p}
  return null;
}
function free(x,y){
  try{if(typeof CloudWorldV1!=='undefined'&&CloudWorldV1.active()&&CloudWorldV1.voidAt(x,y))return false}catch{}
  try{return typeof canBody121==='function'?canBody121(x,y):tileWalkable(current,x,y)}catch{return true}
}
const still={x:NaN,y:NaN,t:0,area:null,fresh:true};const shown=new Map();
function formationSlot(i,f){
  // Sprites têm ~1,4 casa de largura e ~2 de altura: olhando para os lados, o grupo fica em
  // fila atrás do líder; olhando para cima/baixo, fica lado a lado (nunca empilhado na vertical).
  const horiz=Math.abs(f[0])>=Math.abs(f[1]);let cands;
  if(horiz){const sx=-Math.sign(f[0])||-1,st=(i%2?1:-1)*.3;cands=[[sx*1.5*(i+1),st],[sx*1.5*(i+1),-st],[0,(i%2?1:-1)*2.1],[sx*1.5*(i+1),st*4]]}
  else{const sy=-Math.sign(f[1])||-1,side=(i%2?1:-1),row=Math.floor(i/2);cands=[[side*1.5,sy*(.35+row*1.6)],[-side*1.5,sy*(.35+row*1.6)],[side*1.5,sy*(1.9+row*1.6)],[0,sy*(2.1+row*1.6)]]}
  for(const [dx,dy] of cands){const x=G.x+dx,y=G.y+dy;if(free(x,y)&&shownClear(x,y,i))return {x,y,dir:G.dir}}
  return null;
}
function shownClear(x,y,i){for(const [j,p] of shown)if(j<i&&p&&Math.hypot(p.tx-x,p.ty-y)<.9)return false;return true}
if(typeof getFollower==='function'){
  const followerV7=getFollower;
  getFollower=function(i){
    const base=followerV7(i);
    if(!G||!base)return base;
    if(typeof C3!=='undefined'&&C3.coopActive?.())return base;
    const now=typeof tick==='number'?tick:performance.now()/1000;
    if(still.area!==G.area){still.area=G.area;shown.clear();still.fresh=true;still.x=G.x;still.y=G.y}
    if(Math.hypot(still.x-G.x,still.y-G.y)>.02){still.x=G.x;still.y=G.y;still.t=now;still.fresh=false}
    // Logo depois de entrar numa área não há rastro: o grupo já nasce em formação.
    const idle=still.fresh||now-still.t>=R.IDLE_AFTER||!(typeof trail!=='undefined'&&trail.length);
    let target=null;
    if(idle)target=formationSlot(i,facing());
    if(!target){const p=trailPoint(R.SPACING*(i+1));if(p&&free(p.x,p.y))target=p}
    if(!target)target=base;
    let s=shown.get(i);
    if(!s||still.fresh||Math.hypot(s.x-target.x,s.y-target.y)>4){s={x:target.x,y:target.y,t:now,tx:target.x,ty:target.y};shown.set(i,s)}
    if(now!==s.t){const dt=Math.max(0,Math.min(.1,now-s.t)),k=Math.min(1,dt*R.SLIDE);s.x+=(target.x-s.x)*k;s.y+=(target.y-s.y)*k;s.t=now}
    s.tx=target.x;s.ty=target.y;
    return {x:s.x,y:s.y,dir:target.dir||base.dir||G.dir};
  };
}

/* ---------- 6. Nomes dos personagens ----------
 * Antes: "Franco · arco", "Franco A.", "Ryuchi · katana", "KATANA", "SYNTH", "PERCU" e "???"
 * conviviam. Agora cada versão tem um nome curto único (HUD, falas soltas) e um nome
 * completo (menus e caixa de diálogo): Franco Arqueiro, Ryuchi Katana, Franco
 * Sintetizador e Ryuchi Percussionista. */
R.SHORT={franco:'Franco',ryuchi:'Ryuchi',alt:'Arqueiro',katana:'Katana',synth:'Sintetizador',percussion:'Percussão'};
R.FULL={franco:'Franco',ryuchi:'Ryuchi',alt:'Franco Arqueiro',katana:'Ryuchi Katana',synth:'Franco Sintetizador',percussion:'Ryuchi Percussionista'};
try{Object.assign(names09,R.SHORT)}catch{}
try{Object.assign(labels10,{alt:R.FULL.alt,katana:R.FULL.katana,synth:R.FULL.synth,percussion:R.FULL.percussion})}catch{}
try{Object.assign(C3.names,{synth:R.FULL.synth,percussion:R.FULL.percussion})}catch{}
try{Object.assign(PostGame.names,R.FULL)}catch{}
// Caixa de diálogo: "???" vira Franco Arqueiro depois da revelação; "KATANA" ganha o nome completo.
let revealAtTalk=false;
const talkV7=talk;
talk=function(...a){revealAtTalk=!!G?.flags?.reveal;return talkV7.apply(this,a)};
R.speaker=function(){
  const sp=document.getElementById('speaker');if(!sp)return;const t=sp.textContent.trim();
  const map={'KATANA':'RYUCHI KATANA','RYUCHI DA KATANA':'RYUCHI KATANA','FRANCO · ARQUEIRO':'FRANCO ARQUEIRO','O ARQUEIRO':'FRANCO ARQUEIRO'};
  if(t==='???'&&revealAtTalk)sp.textContent='FRANCO ARQUEIRO';
  else if(map[t])sp.textContent=map[t];
};
const advanceV7=advanceDialogue;
advanceDialogue=function(...a){const r=advanceV7.apply(this,a);try{R.speaker();R.touchHints();R.mobileDialogue()}catch{}return r};

/* ---------- 7. Celular ----------
 * Antes: o diálogo mostrava "ESPAÇO / ENTER", "PULAR · P", "AUTO · O"... numa tela de toque;
 * em pé, a caixa de diálogo cobria metade da cena enquanto os controles ficavam parados
 * embaixo; deitado, os botões translúcidos e o objetivo ficavam sobre a cena do diálogo.
 * Agora: dicas de toque; em pé, o diálogo ocupa o lugar dos controles; deitado, os
 * controles somem enquanto alguém fala. */
css.textContent+=`
html.r7-talk-landscape #mobileLeft121,html.r7-talk-landscape #mobileRight121,html.r7-talk-landscape #mobileGoal121,html.r7-talk-landscape #mobileObjective{visibility:hidden!important}
html.r7-talk-portrait #mobileLeft121,html.r7-talk-portrait #mobileRight121{visibility:hidden!important}
`;
R.touchHints=function(){
  if(!document.documentElement.classList.contains('mobile121'))return;
  const c=document.querySelector('#dialogue .continue');if(c&&c.textContent!=='▼ TOQUE PARA CONTINUAR')c.textContent='▼ TOQUE PARA CONTINUAR';
  for(const b of document.querySelectorAll('#dialogue .leitura-barra button')){const t=b.textContent.replace(/ · [A-Z]$/,'');if(t!==b.textContent)b.textContent=t}
};
R.mobileDialogue=function(){
  const h=document.documentElement,d=document.getElementById('dialogue');if(!d)return;
  const mobile=h.classList.contains('mobile121'),talking=mode==='dialogue'&&!d.classList.contains('hidden');
  const portrait=innerHeight>innerWidth;
  h.classList.toggle('r7-talk-landscape',mobile&&talking&&!portrait);
  const deck=document.querySelector('#mobileLeft121')?.parentElement?.getBoundingClientRect(),game=document.getElementById('game')?.getBoundingClientRect();
  const move=mobile&&talking&&portrait&&deck&&game&&deck.top>game.bottom-4&&deck.height>120;
  h.classList.toggle('r7-talk-portrait',!!move);
  if(move){const top=Math.round(game.bottom+8);d.style.setProperty('top',top+'px','important');d.style.setProperty('bottom','auto','important');d.style.setProperty('max-height',Math.max(140,innerHeight-top-8)+'px','important');d.style.setProperty('overflow','auto','important');d.dataset.r7='deck'}
  else if(d.dataset.r7){for(const k of ['top','bottom','max-height','overflow'])d.style.removeProperty(k);delete d.dataset.r7}
};
setInterval(()=>{try{R.touchHints();R.mobileDialogue()}catch{}},120);
if(typeof updateMobileLayout121==='function'){const layoutV7=updateMobileLayout121;updateMobileLayout121=function(...a){const r=layoutV7.apply(this,a);try{R.mobileDialogue()}catch{}return r}}

/* ---------- 8. Ajustes menores ----------
 * a) Porta de volta: ao chegar por uma porta, o grupo aparecia em cima da porta de volta e
 *    um Enter devolvia à área anterior. A porta de volta só responde depois de um passo.
 * b) Objetivo repetido no PC: a faixa do celular (#mobileObjective) aparecia embaixo do
 *    quadro além do objetivo do HUD. No PC fica só o do HUD.
 * c) Calabouço: o objetivo dizia "Escolha uma melhoria" mesmo nas ondas sem escolha.
 * d) Calabouço: as cartas de melhoria tinham larguras diferentes e quebravam em 2+1.
 * e) Calabouço: as ondas 1 a 3 batiam como as seguintes; quem chega sem prática caía na
 *    onda 3. Agora o dano dos ecos começa em 65% e chega ao normal na onda 4. */
css.textContent+=`
html.desktop121 #mobileObjective{display:none!important}
#overlay .row:has(> [data-echo-card]){display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr));gap:10px;align-items:stretch;margin-bottom:12px}
#overlay .row > [data-echo-card]{width:auto!important;min-width:0;height:100%;margin:0}
`;
const arrival={prev:null,x:NaN,y:NaN};
const setAreaGate=setArea;
setArea=function(id,...rest){const prev=G?.area;const r=setAreaGate.call(this,id,...rest);if(G&&prev&&prev!==G.area){arrival.prev=prev;arrival.x=G.x;arrival.y=G.y}return r};
if(typeof nearestInteraction==='function'){
  const nearV7=nearestInteraction;
  nearestInteraction=function(...a){const n=nearV7.apply(this,a);
    if(n&&n.type==='gate'&&n.value?.to===arrival.prev&&Math.hypot(G.x-arrival.x,G.y-arrival.y)<.8)return null;
    if(n&&arrival.prev&&Math.hypot(G.x-arrival.x,G.y-arrival.y)>=.8)arrival.prev=null;
    return n};
}
R.EARLY_WAVES=[.65,.8,.9];
if(typeof PostGame!=='undefined'){
  const profileV7=PostGame.profile;
  PostGame.profile=function(wave,...a){const p=profileV7.call(this,wave,...a);const k=R.EARLY_WAVES[Math.max(1,wave)-1];if(k&&p)p.power*=k;return p};
  const hudV7=PostGame.hud;
  PostGame.hud=function(...a){const r0=hudV7.apply(this,a);try{if(this.active()){const r=this.run();if(r.phase==='rest'&&!this.draftDue(r)){const q=document.getElementById('quest');if(q)q.textContent='ONDA '+r.wave+' · Respire, a próxima onda já vem'}}}catch{}return r0};
}

window.RevisaoV7=R;
return R;
})();
