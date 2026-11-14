/* TORII & HUTUKARA — Correções de fluxo e interface (playtest do autor).
 * 1. Fim do Capítulo 2 → Capítulo 3 contínuo: o cartão "Capítulo 02 concluído"
 *    segue sozinho para o Capítulo 3 (sem a opção de explorar, que deixava o
 *    jogador procurando o ponto de passagem na torre).
 * 2. Diálogo preso: atalhos de menu (J, M, I) durante uma fala abriam o menu
 *    por cima e, ao fechar, a caixa de diálogo ficava presa na tela.
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
window.ToriiFluxo={goToChapter3};
})();
