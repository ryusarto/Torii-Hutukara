/* TORII & HUTUKARA — Correções de fluxo e interface (playtest do autor).
 * 1. Fim do Capítulo 2 → Capítulo 3 contínuo: o cartão "Capítulo 02 concluído"
 *    segue sozinho para o Capítulo 3 (sem a opção de explorar, que deixava o
 *    jogador procurando o ponto de passagem na torre).
 * 2. Diálogo preso: atalhos de menu (J, M, I) durante uma fala abriam o menu
 *    por cima e, ao fechar, a caixa de diálogo ficava presa na tela.
 * 3. Luta presa: se o integrante ativo não fazia parte da formação (ex.: save
 *    com formação vazia, completada ao carregar), os golpes não causavam dano
 *    e a derrota nunca acontecia. Agora o ativo é sempre alguém da formação.
 * 4. Formação congelada: salvar e recarregar no Capítulo 1 fixava a formação em
 *    Franco e Ryuchi, e quem entrava depois (Arqueiro, Katana...) ficava de
 *    fora — o Arauto virava uma parede com 2 integrantes. Agora quem entra no
 *    grupo ocupa uma vaga livre (até 3).
 */
(function(){
// ---------- 1. Capítulo 2 → Capítulo 3 ----------
const AUTO_SECONDS=5;
let autoTimer=null;
function goToChapter3(){if(autoTimer){clearInterval(autoTimer);autoTimer=null}if(G&&G.c3&&G.c3.started)return;closeOverlay();C3.start(false)}
voiceEnding=function(){
  try{C3.applyWorld()}catch{}
  openOverlay(`<div class="eyebrow">CAPÍTULO 02 · CONCLUÍDO</div><h2>A máscara abriu o Lado B</h2><p>O Silêncio recua antes de desaparecer. Ele promete voltar — e as máscaras respondem antes que alguém consiga persegui-lo.</p><p>A frequência envolve o grupo e revela uma cidade acima das nuvens.</p><div class="stat"><span>Próximo capítulo</span><b>O SOM QUE AINDA NÃO EXISTE</b></div><div class="row"><button class="action strong" id="c3Continue">ATRAVESSAR AGORA · <span id="c3Countdown">${AUTO_SECONDS}</span></button></div>`);
  const btn=document.getElementById('c3Continue');btn.onclick=goToChapter3;try{btn.focus()}catch{}
  let left=AUTO_SECONDS;if(autoTimer)clearInterval(autoTimer);
  autoTimer=setInterval(()=>{left--;const c=document.getElementById('c3Countdown');if(c)c.textContent=String(Math.max(0,left));if(left<=0)goToChapter3()},1000);
};
// Se o cartão for fechado de outro jeito (Esc), a travessia acontece mesmo assim.
const closeBeforeFlow=closeOverlay;
closeOverlay=function(...args){
  const wasEnding=!!document.getElementById('c3Countdown');
  const r=closeBeforeFlow.apply(this,args);
  if(wasEnding&&autoTimer&&G&&!(G.c3&&G.c3.started)){setTimeout(goToChapter3,0)}
  // 2b. Se um menu abriu por cima de uma fala, a fala volta a responder.
  const box=document.getElementById('dialogue');
  if(box&&!box.classList.contains('hidden')&&mode!=='dialogue'&&mode!=='overlay')mode='dialogue';
  return r;
};
// Saves antigos parados depois do Arauto (antes do Capítulo 3) seguem direto.
const continueBeforeFlow=continueGame;
continueGame=function(...args){
  const r=continueBeforeFlow.apply(this,args);
  try{if(G&&G.flags&&G.flags.voicesDone&&!(G.c3&&G.c3.started))setTimeout(()=>{if(mode==='walk')voiceEnding()},600)}catch{}
  return r;
};

// ---------- 2. Atalhos de menu durante diálogos ----------
const MENU_KEYS=new Set(['j','m','i','J','M','I']);
addEventListener('keydown',e=>{
  if(mode==='dialogue'&&MENU_KEYS.has(e.key)){e.preventDefault();e.stopImmediatePropagation()}
},true);
// ---------- 3. Integrante ativo sempre dentro da formação ----------
function fixActive(){
  if(!G||!G.formation||!G.formation.length)return false;
  const team=G.formation.filter(k=>G.maxhp&&G.maxhp[k]);if(!team.length)return false;
  if(team.includes(G.active))return false;
  G.active=team.find(k=>G.hp[k]>0)||team[0];
  try{updateHUD();if(mode==='action')updateActionHUD()}catch{}
  return true;
}
let activeTimer=0;
const updateBeforeFlow=update;
update=function(dt,...rest){activeTimer+=dt||0;if(activeTimer>.25){activeTimer=0;try{fixActive()}catch{}}return updateBeforeFlow.call(this,dt,...rest)};
const normalizeBeforeFlow=normalizeSave;
normalizeSave=function(...args){const g=normalizeBeforeFlow.apply(this,args);try{if(g&&g.formation&&g.formation.length&&!g.formation.includes(g.active))g.active=g.formation.find(k=>g.hp&&g.hp[k]>0)||g.formation[0]}catch{}return g};

// ---------- 4. Recrutados entram na formação se houver vaga ----------
function available(g){const out=['franco','ryuchi'];const f=g.flags||{},c=g.c3||{};
  if(f.reveal)out.push('alt');if(f.voicesKatana)out.push('katana');if(c.synthUnlocked)out.push('synth');if(c.percussionUnlocked)out.push('percussion');
  return out.filter(k=>g.maxhp&&g.maxhp[k])}
function fillFormation(g){
  if(!g||!Array.isArray(g.formation)||!g.formation.length)return false;
  const avail=available(g),known=new Set(g.knownMembers||[]);
  // Primeira vez (saves antigos): quem já estava disponível e fora conta como "novo".
  const fresh=avail.filter(k=>!g.formation.includes(k)&&(!g.knownMembers||!known.has(k)));
  let changed=false;
  for(const k of fresh){if(g.formation.length>=3)break;g.formation.push(k);changed=true}
  g.knownMembers=avail;
  return changed;
}
let fillTimer=0;
const updateFillBefore=update;
update=function(dt,...rest){fillTimer+=dt||0;if(fillTimer>.5){fillTimer=0;try{if(fillFormation(G)){try{updateHUD()}catch{}}}catch{}}return updateFillBefore.call(this,dt,...rest)};
const normalizeFillBefore=normalizeSave;
normalizeSave=function(...args){const g=normalizeFillBefore.apply(this,args);try{fillFormation(g)}catch{}return g};

window.ToriiFluxo={goToChapter3,fixActive,fillFormation};
})();
