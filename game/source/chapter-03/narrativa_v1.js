/* TORII & HUTUKARA — Narrativa (Fase 4).
 * 1. Leitura: velocidade do texto, avanço automático, histórico de falas e
 *    pular cena. O texto completo fica sempre em #words (o efeito de digitação
 *    só esconde o fim com uma cor transparente), então testes e robôs que
 *    chamam advanceDialogue() continuam avançando uma fala por chamada.
 * 2. Narrador como cenário: falas marcadas com cena:true (EDICOES_DIALOGO.json)
 *    saem da caixa de diálogo e viram legenda no topo da tela, com efeito.
 * 3. Falas de combate e caminhada (barks) em balões sobre quem fala, sem
 *    parar o jogo. Os gatilhos vêm de uma leitura do estado a cada 150 ms,
 *    sem interceptar o combate. Sorteio próprio: não muda a sorte do jogo.
 * 4. Consequências: a primeira rota (Canal ou Usina) muda o rádio no Mar de
 *    Nuvens, a chegada à segunda rota, a luta contra O Silêncio e o epílogo.
 *    A pergunta feita à Anciã Ema volta no confronto final e no fim.
 * Dados: design/dialogo/NARRATIVA_FASE4.json (inserido pelo build_alpha.rb).
 */
const Narrativa=(()=>{
'use strict';
const DATA=__NARRATIVA_DATA__;
const PERS=DATA.personagens;
const store={
  get(k,d){try{const v=localStorage.getItem('torii_leitura_'+k);return v===null?d:JSON.parse(v)}catch{return d}},
  set(k,v){try{localStorage.setItem('torii_leitura_'+k,JSON.stringify(v))}catch{}}
};
const SPEEDS=[
  {id:'lento',rotulo:'LENTO',cps:26},
  {id:'normal',rotulo:'NORMAL',cps:45},
  {id:'rapido',rotulo:'RÁPIDO',cps:85},
  {id:'instantaneo',rotulo:'INSTANTÂNEO',cps:0}
];
const opts={
  vel:SPEEDS.some(s=>s.id===store.get('vel'))?store.get('vel'):'rapido',
  auto:store.get('auto',false)===true,
  barks:store.get('barks',true)!==false,
  freq:['pouca','normal','muita'].includes(store.get('freq'))?store.get('freq'):'normal'
};
const speed=()=>SPEEDS.find(s=>s.id===opts.vel)||SPEEDS[2];
const el=id=>document.getElementById(id);
const asLine=l=>typeof l==='string'?{who:'narrator',t:l}:l;
const NAMES={franco:'FRANCO, THE SIR!',ryuchi:'RYUCHI',alt:'FRANCO · ARQUEIRO',katana:'RYUCHI · KATANA',synth:'FRANCO · SINTETIZADOR',percussion:'RYUCHI · PERCUSSÃO',narrator:'NARRADOR',ema:'ANCIÃ EMA',silence:'O SILÊNCIO'};
const nameOf=who=>NAMES[who]||String(who||'').toUpperCase();

/* ---------- estilos ---------- */
const css=document.createElement('style');
css.textContent=`
#words .tw-rest{color:transparent}
.leitura-barra{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;justify-content:flex-end}
.leitura-barra button{font:inherit;font-size:11px;letter-spacing:.06em;min-height:30px;padding:4px 9px;border-radius:6px;border:1px solid #8a7290;background:#241c30cc;color:#f3e6d8;cursor:pointer}
.leitura-barra button[aria-pressed="true"]{background:#e6b36a;color:#22161c;border-color:#e6b36a}
.leitura-barra button:focus-visible{outline:2px solid #ffd58f;outline-offset:1px}
.mobile121 .leitura-barra button{min-height:36px;font-size:12px}
#leituraHistorico{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;background:#0b0912cc;padding:16px}
#leituraHistorico.hidden{display:none}
#leituraHistorico .lh-janela{width:min(640px,100%);max-height:min(82vh,720px);display:flex;flex-direction:column;background:#1c1626;border:1px solid #8a7290;border-radius:10px;color:#f3e6d8;box-shadow:0 12px 40px #000a}
#leituraHistorico header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid #4a3c52}
#leituraHistorico h2{margin:0;font-size:15px;letter-spacing:.1em}
#leituraHistorico .lh-lista{overflow:auto;padding:8px 14px;flex:1}
#leituraHistorico .lh-fala{padding:7px 0;border-bottom:1px solid #2f2639}
#leituraHistorico .lh-fala b{display:block;font-size:11px;letter-spacing:.08em;color:#e6b36a}
#leituraHistorico .lh-fala.pulada{opacity:.72}
#leituraHistorico .lh-fala.pulada b::after{content:' · PULADA';color:#a996b3}
#leituraHistorico .lh-fala.cena b{color:#a996b3}
#leituraHistorico .lh-opcoes{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px;border-top:1px solid #4a3c52}
#leituraHistorico button{font:inherit;font-size:12px;min-height:36px;padding:6px 10px;border-radius:6px;border:1px solid #8a7290;background:#2a2136;color:#f3e6d8;cursor:pointer}
#leituraHistorico button[aria-pressed="true"]{background:#e6b36a;color:#22161c;border-color:#e6b36a}
#leituraHistorico .lh-vazio{color:#a996b3;padding:16px 0}
#cenaLegenda{position:fixed;left:50%;transform:translateX(-50%);z-index:10010;max-width:min(560px,calc(100vw - 32px));padding:8px 16px;border-radius:8px;background:#0f0b16d9;color:#f6ead8;font-style:italic;text-align:center;font-size:15px;line-height:1.4;letter-spacing:.02em;pointer-events:none;opacity:0;transition:opacity .45s}
#cenaLegenda.visivel{opacity:1}
#cenaClarao{position:fixed;inset:0;z-index:10005;background:#fff8e8;opacity:0;pointer-events:none;transition:opacity .6s}
#barksCamada{position:fixed;inset:0;z-index:10004;pointer-events:none;overflow:hidden}
.bark{position:absolute;max-width:220px;padding:0;color:#fff7ea;font-size:13px;line-height:1.25;font-weight:600;text-align:center;letter-spacing:.01em;text-shadow:0 0 2px #0b0710,0 0 3px #0b0710,1px 1px 0 #0b0710,-1px 1px 0 #0b0710,1px -1px 0 #0b0710,-1px -1px 0 #0b0710,0 2px 6px #000c;transform:translate(-50%,-100%) translateY(6px);opacity:0;transition:opacity .25s,transform .35s ease-out;white-space:normal}
.bark.visivel{opacity:1;transform:translate(-50%,-100%)}
.bark b{display:block;font-size:10px;letter-spacing:.16em;color:var(--cor,#e6b36a);margin-bottom:1px}
.bark span{display:block}
.bark.radio{text-align:left;transform:translateY(6px)}
.bark.radio.visivel{transform:none}
.bark.radio b::before{content:'📻 '}
.mobile121 .bark{font-size:12px;max-width:180px}
@media (prefers-reduced-motion:reduce){.bark,.bark.visivel{transition:none;transform:translate(-50%,-100%)}.bark.radio,.bark.radio.visivel{transform:none}#cenaLegenda,#cenaClarao{transition:none}}
`;
document.head.appendChild(css);

/* ---------- histórico ---------- */
const HIST_MAX=300;
let historico=[];
try{const h=JSON.parse(sessionStorage.getItem('torii_leitura_historico'));if(Array.isArray(h))historico=h.slice(-HIST_MAX)}catch{}
function lembrar(quem,texto,tipo){
  if(!texto)return;
  historico.push({quem,texto,tipo:tipo||'',area:(typeof G!=='undefined'&&G&&G.area)||''});
  if(historico.length>HIST_MAX)historico.splice(0,historico.length-HIST_MAX);
  try{sessionStorage.setItem('torii_leitura_historico',JSON.stringify(historico))}catch{}
}

/* ---------- digitação ---------- */
const tw={timer:null,texto:'',inicio:0};
const digitando=()=>tw.timer!==null;
function pintar(n){
  const w=el('words');if(!w)return;
  const a=document.createElement('span');a.textContent=tw.texto.slice(0,n);
  const b=document.createElement('span');b.className='tw-rest';b.textContent=tw.texto.slice(n);
  w.replaceChildren(a,b);
}
function pararDigitacao(){if(tw.timer!==null){clearInterval(tw.timer);tw.timer=null}}
function completarDigitacao(){
  if(tw.timer===null)return;
  pararDigitacao();
  const w=el('words');if(w&&w.textContent===tw.texto)w.textContent=tw.texto;
  agendarAuto();
}
function digitar(texto){
  pararDigitacao();tw.texto=texto||'';
  const cps=speed().cps;
  if(!cps||!tw.texto){agendarAuto();return}
  tw.inicio=performance.now();pintar(0);
  tw.timer=setInterval(()=>{
    const w=el('words');
    // Outra camada trocou o texto: deixa como está.
    if(!w||mode!=='dialogue'||w.textContent!==tw.texto){pararDigitacao();return}
    const n=Math.floor((performance.now()-tw.inicio)/1000*cps);
    if(n>=tw.texto.length)completarDigitacao();else pintar(n);
  },30);
}

/* ---------- avanço automático ---------- */
let autoTimer=null;
function cancelarAuto(){if(autoTimer){clearTimeout(autoTimer);autoTimer=null}}
function agendarAuto(){
  cancelarAuto();
  if(!opts.auto||mode!=='dialogue')return;
  const n=(el('words')?.textContent||'').length;
  autoTimer=setTimeout(()=>{autoTimer=null;if(mode==='dialogue'&&!digitando()&&!historicoAberto())advanceDialogue()},1200+n*42);
}

/* ---------- quem chamou: jogador ou código ---------- */
// Um toque/tecla do jogador durante a digitação completa a fala em vez de
// pular para a próxima. Chamadas do código (robôs, cenas) sempre avançam.
// window.event é o evento que está sendo tratado agora (teclado, clique, toque).
const ENTRADAS=new Set(['keydown','keyup','click','pointerdown','pointerup','touchstart','touchend','mousedown','mouseup']);
const entradaJogador=()=>{const ev=window.event;return !!(ev&&ev.isTrusted&&ENTRADAS.has(ev.type))};
const padConfirmando=()=>{try{return [...(navigator.getGamepads?.()||[])].some(p=>p&&p.connected!==false&&p.id!=='Dungeon QA pad'&&p.buttons?.[0]?.pressed)}catch{return false}};

/* ---------- legendas de cenário ---------- */
const filaCena=[];let cenaOcupada=false;
function cenaEl(){
  let c=el('cenaLegenda');
  if(!c){c=document.createElement('div');c.id='cenaLegenda';c.setAttribute('role','status');c.setAttribute('aria-live','polite');document.body.appendChild(c)}
  return c;
}
function posicionarLegenda(c){
  const r=el('game')?.getBoundingClientRect();
  c.style.top=Math.max(12,(r?r.top:0)+14)+'px';
}
function mostrarCena(l){
  lembrar('CENA',l.t,'cena');
  filaCena.push(l);if(!cenaOcupada)proximaCena();
}
function proximaCena(){
  const l=filaCena.shift();if(!l){cenaOcupada=false;return}
  cenaOcupada=true;const c=cenaEl();c.textContent=l.t;posicionarLegenda(c);
  efeito(l.efeito);
  requestAnimationFrame?.(()=>c.classList.add('visivel'));c.classList.add('visivel');
  const dur=2200+l.t.length*45;
  setTimeout(()=>{c.classList.remove('visivel');setTimeout(proximaCena,450)},dur);
}
function efeito(nome){
  if(nome==='tremor'){try{screenShake=Math.max(screenShake||0,.35)}catch{}}
  if(nome==='clarao'){
    let f=el('cenaClarao');if(!f){f=document.createElement('div');f.id='cenaClarao';document.body.appendChild(f)}
    const leve=matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    f.style.opacity=leve?'.25':'.85';setTimeout(()=>{f.style.opacity='0'},leve?200:120);
  }
}

/* ---------- diálogo: envolve advanceDialogue uma vez ---------- */
const avancarAntes=advanceDialogue;
function depoisDaFala(){
  const t=el('words')?.textContent||'';
  lembrar(el('speaker')?.textContent||'',t);
  digitar(t);
}
advanceDialogue=function(...args){
  if(mode==='dialogue'&&digitando()&&(entradaJogador()||padConfirmando())){completarDigitacao();return}
  cancelarAuto();pararDigitacao();
  if(mode==='dialogue')while(dialogueQueue.length&&asLine(dialogueQueue[0])?.cena)mostrarCena(asLine(dialogueQueue.shift()));
  const r=avancarAntes.apply(this,args);
  if(mode==='dialogue')depoisDaFala();
  return r;
};
function pularCena(){
  if(mode!=='dialogue')return false;
  cancelarAuto();pararDigitacao();
  for(let guarda=0;mode==='dialogue'&&guarda<60;guarda++){
    for(const raw of dialogueQueue){const l=asLine(raw);if(l&&!l.cena)lembrar(nameOf(l.who),l.t,'pulada')}
    dialogueQueue=[];
    avancarAntes();
  }
  pararDigitacao();
  return true;
}

/* ---------- barra de leitura na caixa de diálogo ---------- */
function botao(rotulo,acao,titulo){
  const b=document.createElement('button');b.type='button';b.dataset.leitura=acao;b.textContent=rotulo;b.title=titulo;
  for(const tipo of ['click','pointerdown','keydown'])b.addEventListener(tipo,e=>{
    if(tipo==='keydown'&&!['Enter',' '].includes(e.key))return;
    e.stopPropagation();if(tipo!=='pointerdown'){e.preventDefault();executar(acao)}
  });
  return b;
}
function montarBarra(){
  const speech=document.querySelector('#dialogue .speech');
  if(!speech||speech.querySelector('.leitura-barra'))return;
  const barra=document.createElement('div');barra.className='leitura-barra';
  barra.append(
    botao(controlHint121('PULAR · P','PULAR'),'pular','Pular a cena (as falas ficam no histórico)'),
    botao(controlHint121('AUTO · O','AUTO'),'auto','Avanço automático'),
    botao('','vel','Velocidade do texto'),
    botao(controlHint121('HISTÓRICO · L','HISTÓRICO'),'historico','Histórico de falas')
  );
  speech.appendChild(barra);atualizarBarra();
}
function atualizarBarra(){
  for(const b of document.querySelectorAll('[data-leitura="auto"]'))b.setAttribute('aria-pressed',String(opts.auto));
  for(const b of document.querySelectorAll('[data-leitura="vel"]'))b.textContent='TEXTO: '+speed().rotulo+controlHint121(' · V','');
  for(const b of document.querySelectorAll('[data-leitura="barks"]'))b.setAttribute('aria-pressed',String(opts.barks));
  for(const b of document.querySelectorAll('[data-leitura="freq"]'))b.textContent='FREQUÊNCIA: '+opts.freq.toUpperCase();
}
function executar(acao){
  if(acao==='pular')pularCena();
  else if(acao==='auto'){opts.auto=!opts.auto;store.set('auto',opts.auto);atualizarBarra();if(opts.auto&&!digitando())agendarAuto();else if(!opts.auto)cancelarAuto();toast(opts.auto?'AVANÇO AUTOMÁTICO LIGADO':'AVANÇO AUTOMÁTICO DESLIGADO')}
  else if(acao==='vel'){const i=SPEEDS.findIndex(s=>s.id===opts.vel);opts.vel=SPEEDS[(i+1)%SPEEDS.length].id;store.set('vel',opts.vel);atualizarBarra();if(opts.vel==='instantaneo')completarDigitacao()}
  else if(acao==='historico')abrirHistorico();
  else if(acao==='barks'){opts.barks=!opts.barks;store.set('barks',opts.barks);atualizarBarra();if(!opts.barks)limparBarks()}
  else if(acao==='freq'){const f=['pouca','normal','muita'];opts.freq=f[(f.indexOf(opts.freq)+1)%3];store.set('freq',opts.freq);atualizarBarra()}
  else if(acao==='fechar')fecharHistorico();
}

/* ---------- janela de histórico ---------- */
const historicoAberto=()=>{const h=el('leituraHistorico');return !!h&&!h.classList.contains('hidden')};
let focoAntes=null,pausaAntes=null;
function abrirHistorico(){
  let h=el('leituraHistorico');
  if(!h){
    h=document.createElement('div');h.id='leituraHistorico';h.className='hidden';h.setAttribute('role','dialog');h.setAttribute('aria-modal','true');h.setAttribute('aria-labelledby','lhTitulo');
    const janela=document.createElement('div');janela.className='lh-janela';
    const header=document.createElement('header');const h2=document.createElement('h2');h2.id='lhTitulo';h2.textContent='HISTÓRICO DE FALAS';
    header.append(h2,botao(controlHint121('FECHAR · L','FECHAR'),'fechar','Fechar o histórico'));
    const lista=document.createElement('div');lista.className='lh-lista';lista.tabIndex=0;
    const op=document.createElement('div');op.className='lh-opcoes';
    op.append(botao('','vel','Velocidade do texto'),botao('AVANÇO AUTOMÁTICO','auto','Avanço automático'),botao('FALAS DE COMBATE','barks','Balões de fala durante o jogo'),botao('','freq','Frequência das falas de combate'));
    janela.append(header,lista,op);h.appendChild(janela);
    h.addEventListener('click',e=>{if(e.target===h)fecharHistorico();e.stopPropagation()});
    document.body.appendChild(h);
  }
  const lista=h.querySelector('.lh-lista');lista.replaceChildren();
  if(!historico.length){const p=document.createElement('p');p.className='lh-vazio';p.textContent='Nenhuma fala ainda.';lista.appendChild(p)}
  for(const f of historico){
    const d=document.createElement('div');d.className='lh-fala'+(f.tipo?' '+f.tipo:'');
    const b=document.createElement('b');b.textContent=f.quem||'—';const s=document.createElement('span');s.textContent=f.texto;
    d.append(b,s);lista.appendChild(d);
  }
  cancelarAuto();focoAntes=document.activeElement;
  // Fora do diálogo, o jogo pausa enquanto a janela está aberta.
  if(mode==='walk'){pausaAntes=mode;mode='overlay'}
  h.classList.remove('hidden');atualizarBarra();lista.scrollTop=lista.scrollHeight;
  h.querySelector('[data-leitura="fechar"]')?.focus();
}
function fecharHistorico(){
  const h=el('leituraHistorico');if(!h||h.classList.contains('hidden'))return;
  h.classList.add('hidden');try{focoAntes?.focus?.()}catch{}
  if(pausaAntes&&mode==='overlay'){mode=pausaAntes;try{keys={}}catch{}}pausaAntes=null;
  if(mode==='dialogue'&&!digitando())agendarAuto();
}
// Teclas: L histórico (sempre), P pular, O auto e V velocidade durante o diálogo.
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(historicoAberto()){
    if(k==='l'||e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();fecharHistorico();return}
    if(['tab','enter',' '].includes(k)||e.key===' ')return; // navegação nos botões da janela
    e.stopImmediatePropagation();return;
  }
  if(e.repeat)return;
  if(k==='l'&&typeof G!=='undefined'&&G&&['dialogue','walk','action'].includes(mode)){e.preventDefault();e.stopImmediatePropagation();if(mode==='action')toast('HISTÓRICO · DISPONÍVEL FORA DO COMBATE');else abrirHistorico();return}
  if(mode!=='dialogue')return;
  if(k==='p'){e.preventDefault();e.stopImmediatePropagation();executar('pular')}
  else if(k==='o'){e.preventDefault();e.stopImmediatePropagation();executar('auto')}
  else if(k==='v'){e.preventDefault();e.stopImmediatePropagation();executar('vel')}
},true);

/* ---------- controle: Y histórico, X auto, Select pular ---------- */
const padAntes=new Map();
function lerControles(){
  let pads=[];try{pads=[...(navigator.getGamepads?.()||[])]}catch{}
  for(const p of pads){
    if(!p||p.id==='Dungeon QA pad')continue;
    const antes=padAntes.get(p.index)||[];const agora=p.buttons.map(b=>!!b.pressed);padAntes.set(p.index,agora);
    const borda=i=>agora[i]&&!antes[i];
    if(historicoAberto()){if(borda(1)||borda(3))fecharHistorico();continue}
    if(mode!=='dialogue')continue;
    if(borda(3))abrirHistorico();else if(borda(2))executar('auto');else if(borda(8))executar('pular');
  }
}

/* =================== FALAS DE COMBATE (barks) =================== */
// Sorteio próprio (mulberry32), separado de Math.random.
let semente=(()=>{try{return(ToriiSorte.semente()^0x9e3779b9)>>>0}catch{return 0x2545f491}})();
const sorte=()=>{semente=(semente+0x6d2b79f5)>>>0;let t=semente;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
const sacos=new Map();
function tirar(chave,lista){
  if(!lista||!lista.length)return null;
  let s=sacos.get(chave);
  if(!s||!s.length){s=lista.map((_,i)=>i);for(let i=s.length-1;i>0;i--){const j=Math.floor(sorte()*(i+1));[s[i],s[j]]=[s[j],s[i]]}sacos.set(chave,s)}
  return lista[s.pop()];
}
const FREQ={pouca:1.8,normal:1,muita:.6};
const B={ultimo:-1e9,ultimaConversa:-1e9,prev:null,andandoDesde:0,ativos:[],pendentes:[],visto:new Set(),areaPrev:null};
const agora=()=>typeof tick==='number'?tick:performance.now()/1000;
function membros(){
  try{const m=partyMembers().slice();if(typeof C3!=='undefined'&&C3.coopActive?.()){const c=C3.coopMember?.();if(c&&!m.includes(c))m.push(c)}return m.filter(id=>PERS[id])}catch{return[]}
}
function posicao(id){
  try{
    if(id===G.active)return G;
    if(typeof C3!=='undefined'&&C3.coopActive?.()&&id===C3.coopMember?.())return C3.coop;
    const outros=partyMembers().filter(x=>x!==G.active);const i=outros.indexOf(id);
    if(i>=0&&typeof getFollower==='function')return getFollower(i);
  }catch{}
  return null;
}
function camada(){
  let c=el('barksCamada');
  if(!c){c=document.createElement('div');c.id='barksCamada';c.setAttribute('aria-hidden','true');document.body.appendChild(c)}
  return c;
}
function preencher(texto,ferido){
  const lider=PERS[G?.active]?.apelido||'Franco';
  return texto.replace(/\{nome\}/g,PERS[ferido]?.apelido||lider).replace(/\{lider\}/g,lider);
}
function falar(quem,texto,atraso=0){
  const item={quem,texto,em:performance.now()+atraso};
  B.pendentes.push(item);
}
function exibir(item){
  const radio=item.quem==='radio'||!PERS[item.quem];
  if(!podeFalar(radio))return;
  if(!radio&&inFenda()&&/\bfitas?\b/i.test(item.texto))return;
  if(!radio&&!membros().includes(item.quem))return;
  const c=camada();const d=document.createElement('div');d.className='bark'+(radio?' radio':'');
  const cor=radio?'#b9d36f':PERS[item.quem].cor;d.style.setProperty('--cor',cor);
  const b=document.createElement('b');b.textContent=radio?(item.nome||'RÁDIO'):PERS[item.quem].nome;
  const s=document.createElement('span');s.textContent=item.texto;d.append(b,s);c.appendChild(d);
  const dur=2300+item.texto.length*55;
  const bark={el:d,quem:item.quem,radio,fim:performance.now()+dur};
  B.ativos=B.ativos.filter(a=>{if(a.quem===item.quem){a.el.remove();return false}return true});
  B.ativos.push(bark);posicionarTodos();
  setTimeout(()=>d.classList.add('visivel'),16);
  setTimeout(()=>{d.classList.remove('visivel');setTimeout(()=>{d.remove();B.ativos=B.ativos.filter(a=>a!==bark)},260)},dur);
  B.contagem=(B.contagem||0)+1;
}
// Pés do personagem até um pouco acima da cabeça, em pixels do mundo.
const ALTURA_CABECA=60;
function posicionar(a){
  const canvas=el('game');if(!canvas)return;
  const r=canvas.getBoundingClientRect();
  if(a.radio){
    const idx=B.ativos.filter(x=>x.radio).indexOf(a);
    a.el.style.left=(r.left+10)+'px';a.el.style.top=(r.top+52+Math.max(0,idx)*54)+'px';return;
  }
  if(Input121.mobile&&mode==='action'){a.el.style.display='none';return}
  const p=posicao(a.quem);if(!p){a.el.style.display='none';return}
  const sx=r.left+((p.x*T-cam.x)/VW)*r.width,sy=r.top+((p.y*T-cam.y-ALTURA_CABECA)/VH)*r.height;
  const fora=sx<r.left-20||sx>r.right+20||sy<r.top-40||sy>r.bottom;
  a.el.style.display=fora?'none':'';
  const meia=Math.min(95,(a.el.offsetWidth||150)/2);
  a.el.style.left=Math.max(meia+6,Math.min(innerWidth-meia-6,sx))+'px';
  a.el.style.top=Math.max(40,sy)+'px';
}
// Posiciona todos e empurra para cima o balão que encostaria em outro.
function posicionarTodos(){
  const postos=[];
  for(const a of B.ativos){
    posicionar(a);if(a.radio||a.el.style.display==='none')continue;
    let top=parseFloat(a.el.style.top)||0;const left=parseFloat(a.el.style.left)||0;
    const w=a.el.offsetWidth||150,h=a.el.offsetHeight||40;
    for(let i=0;i<4;i++){
      const bate=postos.find(o=>Math.abs(o.left-left)<(o.w+w)/2+4&&top>o.top-o.h-4&&top-h<o.top+4);
      if(!bate)break;top=bate.top-bate.h-6;
    }
    a.el.style.top=Math.max(h+8,top)+'px';postos.push({left,top,w,h});
  }
}
function limparBarks(){for(const a of B.ativos)a.el.remove();B.ativos=[];B.pendentes=[]}
// O rádio das consequências aparece mesmo com as falas de combate desligadas.
const inFenda=()=>typeof PostGame!=='undefined'&&PostGame.active();
function podeFalar(radio=false){
  // During mobile combat, leave the playfield to attacks and threats.
  if(!radio&&typeof Input121!=='undefined'&&Input121.mobile&&mode==='action')return false;
  return (opts.barks||radio)&&typeof G!=='undefined'&&G&&['walk','action'].includes(mode)&&!historicoAberto()&&!(typeof CloudWorldV1!=='undefined'&&CloudWorldV1.fall);
}
// Uma fala solta de alguém da formação.
function solta(gatilho,quem,ferido){
  const m=membros();if(!m.length)return false;
  const id=quem&&m.includes(quem)?quem:m[Math.floor(sorte()*m.length)];
  const fenda=inFenda();
  let lista=DATA.falas[gatilho]?.[id];
  if(fenda)lista=lista?.filter(line=>!/\bfitas?\b/i.test(line));
  const t=tirar(gatilho+':'+id+(fenda?':fenda':''),lista);if(!t)return false;
  falar(id,preencher(t,ferido));return true;
}
// Uma conversa entre versões presentes (2 ou 3).
function conversa(gatilho,area){
  const m=new Set(membros());
  const opcoes=DATA.conversas.map((c,i)=>({c,i})).filter(({c})=>c.gatilho===gatilho&&(!c.areas||c.areas.includes(area))&&c.falas.every(([w])=>m.has(w))&&(!c.precisa||c.precisa.every(w=>m.has(w))));
  if(!opcoes.length)return false;
  // Conversas ainda não vistas primeiro.
  const novas=opcoes.filter(o=>!B.visto.has(o.i));const pool=novas.length?novas:opcoes;
  const {c,i}=pool[Math.floor(sorte()*pool.length)];B.visto.add(i);
  let t=0;for(const [w,txt] of c.falas){falar(w,preencher(txt),t);t+=1300+txt.length*40}
  return true;
}
function radio(linhas,nome){
  let t=0;for(const [w,txt] of linhas){if(w==='radio')B.pendentes.push({quem:'radio',nome,texto:txt,em:performance.now()+t});else falar(w,txt,t);t+=2100+txt.length*50}
}
function estado(){
  const hp={},max={};for(const id of membros()){hp[id]=G.hp?.[id]??0;max[id]=G.maxhp?.[id]||1}
  const vivos=(current?.enemies||[]).filter(e=>e.hp>0).length;
  let niveis=0;for(const v of Object.values(G.levels||{}))niveis+=Number(v)||0;
  return {mode,area:G.area,active:G.active,vivos,hp,max,pot:G.potions||0,res:G.resonance||0,boss:(typeof bossActor!=='undefined'&&bossActor)?bossActor.id:null,fase:(typeof bossActor!=='undefined'&&bossActor)?bossActor.phase||1:0,niveis};
}
function pode(espaco){return agora()-B.ultimo>=espaco*FREQ[opts.freq]}
function marcarFala(){B.ultimo=agora()}
function avaliar(){
  if(!podeFalar(true)){B.prev=null;return}
  const s=estado(),p=B.prev;B.prev=s;
  if(s.mode==='walk'&&(!p||p.mode!=='walk'))B.andandoDesde=agora();
  if(!p)return;
  consequenciasArea(s,p);
  if(!opts.barks)return;
  const m=membros();
  // Chefe aparece ou muda de fase: sempre fala.
  if(s.boss&&s.boss!==p.boss){if(pode(2)){(sorte()<.45&&conversa('chefe'))||solta('chefe');marcarFala()}return}
  if(s.boss&&p.boss===s.boss&&s.fase!==p.fase){if(pode(2)){solta('fase');marcarFala()}return}
  // Começo de luta.
  if(s.mode==='action'&&p.mode!=='action'&&!s.boss){if(pode(4)&&sorte()<.75){solta('inicio');marcarFala()}return}
  // Fim de luta.
  if(p.mode==='action'&&s.mode==='walk'&&s.vivos===0){if(pode(3)&&sorte()<.9){(sorte()<.5&&conversa('vitoria'))||solta('vitoria');marcarFala();B.andandoDesde=agora()}return}
  // Perigo: alguém caiu abaixo de 30%.
  for(const id of m){
    const antes=p.hp[id]/p.max[id],depois=s.hp[id]/s.max[id];
    if(depois>0&&depois<.3&&antes>=.3&&pode(3)){
      const outros=m.filter(x=>x!==id);
      if(outros.length&&sorte()<.5){(sorte()<.4&&conversa('perigo'))||solta('socorro',outros[Math.floor(sorte()*outros.length)],id)}else solta('perigo',id);
      marcarFala();return;
    }
  }
  // Dano forte.
  for(const id of m){if(p.hp[id]-s.hp[id]>=s.max[id]*.2&&s.hp[id]>0&&pode(5)&&sorte()<.55){solta('dano',id);marcarFala();return}}
  if(s.pot<p.pot&&pode(4)&&sorte()<.7){solta('cura',s.active);marcarFala();return}
  if(p.res-s.res>=30&&pode(3)){solta('super',s.active);marcarFala();return}
  if(s.active!==p.active&&pode(4)&&sorte()<.65){solta('troca',s.active);marcarFala();return}
  if(s.niveis>p.niveis&&pode(2)){solta('nivel');marcarFala();return}
  if(s.mode==='action'&&s.vivos<p.vivos&&pode(6)&&sorte()<.35){solta('abate');marcarFala();return}
  // Chegada numa área nova.
  if(s.area!==p.area&&s.mode==='walk'){
    if(pode(3)&&(conversa('area',s.area)||(sorte()<.3&&solta('chegada'))))marcarFala();
    B.andandoDesde=agora();return;
  }
  // Caminhada tranquila: conversa entre versões.
  // Falas rápidas espalhadas: a cada ~18 s de caminhada alguém fala; troca
  // de duas falas no máximo a cada ~30 s, fala solta no intervalo.
  if(s.mode==='walk'&&agora()-B.andandoDesde>=18*FREQ[opts.freq]&&pode(7)){
    const vezDeConversa=agora()-B.ultimaConversa>=30*FREQ[opts.freq];
    if(vezDeConversa&&conversa('andando'))B.ultimaConversa=agora();else solta('andando');
    marcarFala();B.andandoDesde=agora();
  }
}
function despachar(){
  const t=performance.now();
  const prontos=B.pendentes.filter(i=>i.em<=t);B.pendentes=B.pendentes.filter(i=>i.em>t);
  for(const i of prontos)exibir(i);
}
function ciclo(){
  try{lerControles()}catch{}
  try{montarBarra()}catch{}
  try{avaliar();despachar()}catch(e){if(!ciclo.avisou){ciclo.avisou=true;console.warn('Narrativa:',e)}}
}
setInterval(ciclo,150);
function quadro(){try{posicionarTodos();const c=el('cenaLegenda');if(c&&cenaOcupada)posicionarLegenda(c)}catch{}requestAnimationFrame(quadro)}
try{requestAnimationFrame(quadro)}catch{}

/* =================== CONSEQUÊNCIAS =================== */
const escolhas=()=>{if(!G.choices)G.choices={};return G.choices};
const primeiraRota=()=>{const r=G?.c3?.firstDestination;return r==='usina'||r==='canal'?r:null};
const ROTA=DATA.consequencias.rota,EMA=DATA.consequencias.ema;
function consequenciasArea(s,p){
  if(s.area===p.area)return;
  const r=primeiraRota();if(!r)return;const c=escolhas();
  if(s.area==='cloud_sea'&&!c.f4Nuvens){c.f4Nuvens=r;radio(ROTA[r].nuvens,ROTA[r].aliado);marcarFala()}
  const segunda=r==='usina'?'sky_canal':'power_plant',feita=r==='usina'?G.c3.usinaDone:G.c3.canalDone;
  if(s.area===segunda&&feita&&!c.f4Segunda){c.f4Segunda=r;radio(ROTA[r].segunda,ROTA[r].aliado);marcarFala()}
}
// Luta contra O Silêncio: quem foi ajudado primeiro ajuda de volta.
if(typeof C3!=='undefined'&&typeof C3.spawnSilence==='function'){
  const spawnAntes=C3.spawnSilence;
  C3.spawnSilence=function(...args){
    const r=spawnAntes.apply(this,args);
    try{
      const rota=primeiraRota();
      if(rota&&typeof bossActor!=='undefined'&&bossActor&&bossActor.id==='c3_silence'){
        const c=escolhas();
        if(rota==='usina'){bossActor.hp=Math.round(bossActor.hp*.88);bossActor.f4Usina=true}
        else if(!c.f4Suprimentos){G.potions=(G.potions||0)+2;c.f4Suprimentos=true}
        toast(ROTA[rota].chefe);
        setTimeout(()=>radio(ROTA[rota].chefeFala,ROTA[rota].aliado),2600);
      }
    }catch(e){console.warn('Narrativa: consequência da rota',e)}
    return r;
  };
}
// Cenas: a Ema no confronto e no fim; o aliado da rota no epílogo.
if(typeof C3!=='undefined'&&typeof C3.scene==='function'){
  const cenaAntes=C3.scene;
  C3.scene=function(id,fim,...rest){
    try{
      const ema=G?.choices?.ema,e=EMA[ema];
      if(id==='C3_023'&&e){const f=fim;return cenaAntes.call(this,id,()=>talk(e.confronto.map(l=>({...l})),f),...rest)}
      if(id==='C3_026'){
        const extra=[...(e?e.final:[]),...((ROTA[primeiraRota()]||{}).final||[])].map(l=>({...l}));
        if(extra.length)return talk(extra,()=>cenaAntes.call(this,id,fim,...rest));
      }
    }catch(err){console.warn('Narrativa: cena',err)}
    return cenaAntes.call(this,id,fim,...rest);
  };
}

return Object.freeze({
  opcoes:()=>({...opts}),
  definir(chave,valor){if(chave in opts){opts[chave]=valor;store.set({vel:'vel',auto:'auto',barks:'barks',freq:'freq'}[chave],valor);atualizarBarra()}},
  digitando,completarDigitacao,pularCena,abrirHistorico,fecharHistorico,historicoAberto,
  historico:()=>historico.slice(),
  legendaAtiva:()=>cenaOcupada,
  ciclo,
  barks:()=>({contagem:B.contagem||0,ativos:B.ativos.map(a=>({quem:a.quem,texto:a.el.textContent,radio:a.radio})),pendentes:B.pendentes.length}),
  forcar(gatilho,quem){return gatilho.startsWith('conversa:')?conversa(gatilho.slice(9)):solta(gatilho,quem)},
  despachar:()=>{B.pendentes.forEach(i=>i.em=0);despachar()},
  dados:DATA
});
})();
