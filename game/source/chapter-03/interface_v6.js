/* TORII & HUTUKARA — Fase 6: interface, mobile e acessibilidade.
 *
 * 1. Menus por cima do diálogo: com um menu aberto, a caixa de diálogo fica escondida.
 * 2. Fila de avisos: um aviso por vez, num lugar fixo (zona de avisos, no alto e ao
 *    centro, entre as colunas do HUD). Com menu ou diálogo abertos, os avisos esperam;
 *    quando um diálogo ou cena começa, avisos velhos de combate são descartados.
 * 3. Zonas do HUD: o objetivo no celular deitado sai de cima do analógico, o objetivo no
 *    celular em pé mostra até 3 linhas, e o aliado não fica desenhado em cima do líder.
 * 4. Mapa de teclas e botões editável (menu Sistema → Controles). As dicas na tela
 *    (rodapé, técnicas, interação) são geradas a partir dele.
 * 5. Acessibilidade: avisos de ataque em âmbar (modo daltônico), pista visual da batida
 *    e batida tolerante.
 */
(function(){
'use strict';
const STORE='torii_hutukara_interface_v6';
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE))||{}}catch{return {}}};
const write=v=>{try{localStorage.setItem(STORE,JSON.stringify(v))}catch{}};
const visible=el=>!!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
const overlayOpen=()=>visible(document.getElementById('overlay'));
const dialogueOpen=()=>visible(document.getElementById('dialogue'))||(typeof mode!=='undefined'&&['dialogue','cinema'].includes(mode));

const style=document.createElement('style');
style.textContent=`
html.ov6-open #dialogue{visibility:hidden!important}
#toast.toast6{position:fixed!important;transform:none!important;z-index:10050!important;text-align:center;box-sizing:border-box;white-space:normal}
.keymap6{display:grid;grid-template-columns:1fr auto auto;gap:6px 10px;align-items:center;margin:8px 0}
.keymap6 b{font:13px monospace;color:#ffdda3;min-width:64px;text-align:center;border:1px solid #e6bc8888;padding:4px 8px}
.keymap6 .listening{background:#e6bc8833}
#mobileGoal121.goal6,#mobileObjective.goal6{display:-webkit-box!important;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:normal!important;text-overflow:ellipsis;max-height:none!important;height:auto!important;font-size:12px!important;line-height:1.3!important}
`;
document.head.appendChild(style);

/* ---------------- 1. Menu acima do diálogo ---------------- */
function syncOverlayFlag(){document.documentElement.classList.toggle('ov6-open',overlayOpen())}
for(const name of ['enterMenu10','closeOverlay','openSystem']){if(typeof window[name]!=='function')continue;const before=window[name];window[name]=function(...a){const r=before.apply(this,a);syncOverlayFlag();return r}}
new MutationObserver(()=>{syncOverlayFlag();Toasts.pump()}).observe(document.getElementById('overlay')||document.body,{attributes:true,attributeFilter:['class','style']});

/* ---------------- 2. Fila de avisos ---------------- */
const Toasts={
  queue:[],current:null,timer:0,seenDialogue:false,log:[],
  recent(){return this.log.slice(-12)},
  duration(text){return Math.min(3200,Math.max(1700,1200+String(text).length*28))},
  push(text){
    text=String(text??'');if(!text)return;this.log.push(text);if(this.log.length>40)this.log.shift();
    if(this.current&&this.current.text===text){this.current.until=performance.now()+this.duration(text);return}
    if(this.queue.some(q=>q.text===text))return;
    this.queue.push({text,at:performance.now()});if(this.queue.length>4)this.queue.splice(0,this.queue.length-4);
    this.pump();
  },
  el(){return document.getElementById('toast')},
  hide(){const el=this.el();if(el)el.classList.add('hidden');this.current=null},
  clear(){this.queue.length=0;this.hide()},
  blocked(){return overlayOpen()||dialogueOpen()},
  pump(){
    const now=performance.now();
    if(this.current&&now>=this.current.until)this.hide();
    if(this.blocked()){if(this.current)this.hide();return}
    if(this.current||!this.queue.length)return;
    const item=this.queue.shift();if(now-item.at>8000)return this.pump();
    const el=this.el();if(!el)return;
    el.textContent=item.text;el.classList.remove('hidden');el.classList.add('toast6');
    this.current={text:item.text,until:now+this.duration(item.text)};Zones.placeToast();
  }
};
// Substitui o aviso direto do jogo; o resto do código continua chamando toast().
if(typeof toastTimeout!=='undefined')try{clearTimeout(toastTimeout)}catch{}
toast=function(t){Toasts.push(t)};
setInterval(()=>Toasts.pump(),120);
// Diálogo ou cena começando: avisos de combate antigos não interessam mais.
new MutationObserver(()=>{const open=dialogueOpen();if(open&&!Toasts.seenDialogue){const now=performance.now();Toasts.queue=Toasts.queue.filter(q=>now-q.at<600);Toasts.hide()}Toasts.seenDialogue=open}).observe(document.getElementById('dialogue')||document.body,{attributes:true,attributeFilter:['class','style']});
if(typeof talk==='function'){const talkBefore=talk;talk=function(...args){Toasts.queue.length=0;Toasts.hide();return talkBefore.apply(this,args)}}

/* ---------------- 3. Zonas do HUD ---------------- */
const rect=sel=>{const el=typeof sel==='string'?document.querySelector(sel):sel;if(!el||!visible(el))return null;const r=el.getBoundingClientRect();return r.width&&r.height?r:null};
const Zones={
  // Zona de avisos: no alto, ao centro do quadro do jogo, entre a coluna da esquerda
  // (área e vida) e a da direita (menu e fita). No celular em pé, a faixa acima do quadro.
  placeToast(){
    const el=Toasts.el(),hud=rect('#hud');if(!el||!hud)return;
    const vw=innerWidth,left=[rect('#vitals092'),rect('.location')].filter(Boolean),right=[...document.querySelectorAll('#tapeButton,.hudbuttons button')].map(rect).filter(Boolean);
    const leftEdge=Math.max(hud.left,...left.map(r=>r.right))+10,rightEdge=Math.min(hud.right,...right.map(r=>r.left))-10;
    let width=rightEdge-leftEdge,top=hud.top+10,x=leftEdge;
    if(hud.top>=46&&innerHeight>innerWidth){width=vw-16;x=8;top=Math.max(6,(hud.top-40)/2)} // em pé: faixa livre acima do quadro
    else if(width<200){width=Math.min(hud.width-20,420);x=hud.left+(hud.width-width)/2;const below=Math.max(...left.map(r=>r.bottom),hud.top);top=below+8}
    const badge=rect('#playtestEntry');if(badge&&badge.left<x+width&&badge.right>x&&badge.bottom>top-4)top=badge.bottom+6; // selo de entrada do site (4 s)
    el.style.left=Math.round(x)+'px';el.style.top=Math.round(top)+'px';el.style.width=Math.round(width)+'px';el.style.maxWidth=Math.round(width)+'px';el.style.right='auto';el.style.bottom='auto';
  },
  // Celular deitado: o objetivo vai para a coluna da esquerda, abaixo da vida e acima do analógico.
  layout(){
    const quest=document.querySelector('.questline'),stick=rect('#mobileLeft121'),vit=rect('#vitals092');
    // Celular deitado com o objetivo já no painel do analógico: não repete no HUD.
    const deckGoal=['#mobileGoal121','#mobileObjective'].map(rect).find(Boolean);
    if(quest&&stick&&deckGoal&&innerWidth>innerHeight){quest.style.display='none';quest.dataset.zone6='oculto'}
    else if(quest){
      if(quest.dataset.zone6==='oculto'){quest.style.display='';delete quest.dataset.zone6}
      if(stick&&vit&&innerWidth>innerHeight){const room=stick.top-vit.bottom-12;Object.assign(quest.style,{position:'fixed',left:Math.round(vit.left)+'px',top:Math.round(vit.bottom+6)+'px',bottom:'auto',right:'auto',maxWidth:Math.round(Math.max(150,Math.min(260,(rect('#mobileRight121')?.left||innerWidth)-vit.left-20)))+'px',maxHeight:Math.max(30,room)+'px',overflow:'hidden'});quest.dataset.zone6='esquerda'}
      else if(quest.dataset.zone6){for(const k of ['position','left','top','bottom','right','maxWidth','maxHeight','overflow'])quest.style[k]='';delete quest.dataset.zone6}
    }
    // Celular deitado: a barra de combate fica entre o analógico e os botões.
    const bar=document.getElementById('actionHUD'),right=rect('#mobileRight121');
    for(const el of bar?[bar.querySelector('.action-label')].filter(Boolean):[]){
      if(stick&&right&&innerWidth>innerHeight){const set=(k,v)=>el.style.setProperty(k,v,'important');set('position','fixed');set('left',Math.round(stick.right+8)+'px');set('right','auto');set('bottom','6px');set('width',Math.max(120,Math.round(right.left-stick.right-16))+'px');set('max-width','none');set('box-sizing','border-box');el.dataset.zone6='meio'}
      else if(el.dataset.zone6){for(const k of ['position','left','right','bottom','width','max-width','box-sizing'])el.style.removeProperty(k);delete el.dataset.zone6}}
    for(const id of ['mobileGoal121','mobileObjective']){const el=document.getElementById(id);if(el)el.classList.add('goal6')}
    if(Toasts.current)this.placeToast();
  }
};
addEventListener('resize',()=>Zones.layout());setInterval(()=>Zones.layout(),500);

// Personagens são mais altos que uma casa: aliado logo acima ou abaixo do líder cobre o
// corpo dele. Nesse caso, o aliado dá um passo para o lado (se houver chão livre).
let leaderAt={x:NaN,y:NaN,t:0};
// Só com o líder parado (há 0,25 s) e fora do co-op: andando, o rastro já separa todos.
function unstack(p,i){if(!G||(typeof C3!=='undefined'&&C3.coopActive?.()))return p;const now=typeof tick==='number'?tick:performance.now()/1000;if(Math.hypot(leaderAt.x-G.x,leaderAt.y-G.y)>.001||!(now>=leaderAt.t))leaderAt={x:G.x,y:G.y,t:now};if(now-leaderAt.t<.25)return p;const dx=p.x-G.x,dy=p.y-G.y;if(Math.abs(dx)>=.7||Math.abs(dy)>=1.5)return p;const side=(i%2?-1:1)*(dx<0?-1:1)||1;for(const s of [side,-side]){const x=G.x+s*.8,y=p.y;if(typeof canBody121!=='function'||canBody121(x,y))return{...p,x}}return p}
// Aliado sem rastro suficiente (logo após trocar de área) ficava em cima do líder.
if(typeof getFollower==='function'){const followerBefore=getFollower;getFollower=function(i){if(!G||(typeof C3!=='undefined'&&C3.coopActive?.()))return followerBefore(i);const p=followerBefore(i)&&unstack(followerBefore(i),i);if(!p)return p;const want=.85*(i+1);if(Math.hypot(p.x-G.x,p.y-G.y)<want*.6){const d=G.aim091||({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[G.dir]||[0,1],n=Math.hypot(d[0],d[1])||1,x=G.x-d[0]/n*want,y=G.y-d[1]/n*want;if(typeof canBody121!=='function'||canBody121(x,y))return{x,y,dir:p.dir||G.dir};const sx=G.x+d[1]/n*want,sy=G.y-d[0]/n*want;return{x:sx,y:sy,dir:p.dir||G.dir}}return p}}

/* ---------------- 4. Mapa de teclas e botões ---------------- */
// Cada ação tem a tecla que o jogo entende (canon). Uma tecla escolhida pelo jogador é
// traduzida para essa tecla antes de chegar ao jogo. Trocar uma ação para uma tecla já
// usada troca as duas de lugar.
const ACTIONS=[
  {id:'up',label:'Mover para cima',canon:'w'},{id:'left',label:'Mover para a esquerda',canon:'a'},{id:'down',label:'Mover para baixo',canon:'s'},{id:'right',label:'Mover para a direita',canon:'d'},
  {id:'interact',label:'Interagir · avançar diálogo',canon:'e',pad:0},{id:'attack',label:'Atacar',canon:'j',pad:2},{id:'skill',label:'Técnica',canon:'z',pad:4},{id:'skill2',label:'Técnica II',canon:'x',pad:5},
  {id:'dodge',label:'Esquiva',canon:'q',pad:1},{id:'super',label:'Especial',canon:'k',pad:7},{id:'switch',label:'Trocar personagem',canon:'c',pad:3},{id:'tape',label:'Usar fita',canon:'r'},
  {id:'map',label:'Mapa',canon:'m'},{id:'party',label:'Equipe',canon:'i'},{id:'journal',label:'Diário',canon:'n'},{id:'history',label:'Histórico de falas',canon:'l'},{id:'menu',label:'Menu',canon:'Escape',pad:9}
];
const PAD_NAMES={0:'A / ✕',1:'B / ○',2:'X / □',3:'Y / △',4:'LB / L1',5:'RB / R1',6:'LT / L2',7:'RT / R2',8:'Select',9:'Start',10:'L3',11:'R3'};
const keyName=k=>({' ':'Espaço',Escape:'Esc',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Enter:'Enter',Tab:'Tab',Shift:'Shift'})[k]||String(k).toUpperCase();
const KeyMap={
  actions:ACTIONS,
  binding(id){const a=ACTIONS.find(x=>x.id===id);return (read().keys||{})[id]||a.canon},
  padBinding(id){const a=ACTIONS.find(x=>x.id===id);const p=(read().pads||{})[id];return p??a.pad},
  label(id){return keyName(this.binding(id))},
  translate(k){
    const keys=read().keys||{};if(!Object.keys(keys).length)return null;
    for(const a of ACTIONS){if(this.binding(a.id).toLowerCase?.()===k.toLowerCase()||this.binding(a.id)===k)return a.canon}
    return null;
  },
  set(id,key){
    const v=read(),keys=v.keys||{},a=ACTIONS.find(x=>x.id===id),old=this.binding(id);
    const other=ACTIONS.find(x=>x.id!==id&&this.binding(x.id).toLowerCase()===String(key).toLowerCase());
    if(other)keys[other.id]=old;keys[id]=key;
    for(const x of ACTIONS)if(keys[x.id]===x.canon)delete keys[x.id];
    v.keys=keys;write(v);refreshHints();return true;
  },
  setPad(id,index){
    const v=read(),pads=v.pads||{},a=ACTIONS.find(x=>x.id===id),old=this.padBinding(id);
    const other=ACTIONS.find(x=>x.id!==id&&x.pad!==undefined&&this.padBinding(x.id)===index);
    if(other)pads[other.id]=old;pads[id]=index;
    for(const x of ACTIONS)if(pads[x.id]===x.pad)delete pads[x.id];
    v.pads=pads;write(v);return true;
  },
  reset(){const v=read();delete v.keys;delete v.pads;write(v);refreshHints()}
};
// Teclado: tradução na captura, antes de qualquer tratador do jogo.
let capturing=null;
for(const type of ['keydown','keyup'])addEventListener(type,e=>{
  if(e.__km6)return;
  if(capturing&&type==='keydown'){e.preventDefault();e.stopImmediatePropagation();const f=capturing;capturing=null;f(e);return}
  const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
  const canon=KeyMap.translate(e.key);if(!canon||canon===e.key||canon===e.key.toLowerCase())return;
  e.preventDefault();e.stopImmediatePropagation();
  const ev=new KeyboardEvent(type,{key:canon,code:e.code,repeat:e.repeat,bubbles:true,cancelable:true});ev.__km6=true;(document.body||document).dispatchEvent(ev);
},true);
// Diário: o J virou ataque durante o jogo; o diário fica na tecla N.
addEventListener('keydown',e=>{if(e.repeat)return;if(e.key.toLowerCase()==='n'&&typeof mode!=='undefined'&&['walk','action'].includes(mode)&&typeof openJournal==='function'){e.preventDefault();openJournal()}});
// Controle: botões remapeados chegam ao jogo nos índices originais.
try{
  const nav=navigator,original=nav.getGamepads?.bind(nav);
  if(original)Object.defineProperty(nav,'getGamepads',{configurable:true,value:()=>{const list=original();const pads=read().pads||{};if(!Object.keys(pads).length)return list;return Array.from(list||[],p=>{if(!p)return p;const buttons=Array.from(p.buttons);for(const a of ACTIONS)if(a.pad!==undefined)buttons[a.pad]=p.buttons[KeyMap.padBinding(a.id)]||buttons[a.pad];return{index:p.index,id:p.id,connected:p.connected,mapping:p.mapping,axes:p.axes,buttons,timestamp:p.timestamp}})}});
}catch{}

// Dicas na tela geradas do mapa: rodapé, técnicas no painel de vida e tecla de interação.
const TECH_LETTERS={Q:'dodge',Z:'skill',X:'skill2',K:'super'};
function refreshHints(){
  const foot=document.querySelector('.footer > div');
  if(foot){const L=id=>KeyMap.label(id),move=['up','left','down','right'].map(L).join('');foot.innerHTML=`<span>DESKTOP:</span> ${move==='WASD'?'WASD / SETAS':move} mover · ${L('interact')} interagir · ${L('attack')} atacar · ${L('skill')}/${L('skill2')} técnicas · ${L('dodge')} esquiva · ${L('super')} especial · ${L('switch')} trocar · ${L('map')} mapa · ${L('party')} equipe · ${L('journal')} diário · ${L('menu')} menu`}
  for(const span of document.querySelectorAll('#vitals092 .tech-row10 span')){const m=span.textContent.match(/^([QZXK]|\S{1,6}) ([●·].*)$/);if(!m)continue;const id=span.dataset.km6||TECH_LETTERS[m[1]];if(!id)continue;span.dataset.km6=id;const want=KeyMap.label(id)+' '+m[2];if(span.textContent!==want)span.textContent=want}
  for(const [id,act] of [['bMap','map'],['bJournal','journal'],['bParty','party'],['bMenu','menu']]){const el=document.getElementById(id);if(!el)continue;const t=el.textContent,want=t.replace(/\[[^\]]*\]|· ESC$/,m=>m.startsWith('[')?'['+KeyMap.label(act)+']':'· '+KeyMap.label(act).toUpperCase());if(want!==t)el.textContent=want}
  const L=id=>KeyMap.label(id),hint=document.getElementById('actionHint');
  if(hint){const want=`${L('attack')} · ATACAR   ${L('skill')} / ${L('skill2')} · TÉCNICAS   ${L('dodge')} · ESQUIVA   ${L('switch')} · TROCAR   ${L('super')} · ESPECIAL`;if(hint.textContent!==want)hint.textContent=want}
  const skillLine=document.getElementById('actionSkill');if(skillLine){const t=skillLine.textContent,want=t.replace(/(^|· )([ZXK])(?= )/g,(m,pre,l)=>pre+L({Z:'skill',X:'skill2',K:'super'}[l]));if(want!==t)skillLine.textContent=want}
  const b=document.querySelector('#prompt b');if(b&&b.textContent!==KeyMap.label('interact'))b.textContent=KeyMap.label('interact');
}
for(const name of ['updateHUD','updateActionHUD']){if(typeof window[name]!=='function')continue;const before=window[name];window[name]=function(...a){const r=before.apply(this,a);try{refreshHints()}catch{}return r}}
setInterval(()=>{try{refreshHints()}catch{}},400);

function openControls(){
  const v=read(),rows=ACTIONS.map(a=>`<span>${a.label}</span><b data-key6="${a.id}">${KeyMap.label(a.id)}</b><b data-pad6="${a.id}">${a.pad===undefined?'—':PAD_NAMES[KeyMap.padBinding(a.id)]||KeyMap.padBinding(a.id)}</b>`).join('');
  enterMenu10(`<div class="eyebrow">SISTEMA · CONTROLES</div><h2>Teclas e botões</h2><p>Toque numa tecla ou botão e aperte o novo. Se já estiver em uso, os dois trocam de lugar. As dicas na tela seguem esta lista.</p><div class="keymap6"><span></span><small>TECLADO</small><small>CONTROLE</small>${rows}</div><div class="row"><button class="action" id="keymapReset6">RESTAURAR PADRÃO</button><button class="action strong" id="keymapBack6">VOLTAR</button></div>`,'settings');
  for(const el of document.querySelectorAll('[data-key6]'))el.onclick=()=>{el.textContent='…';el.classList.add('listening');capturing=e=>{if(e.key!=='Escape'||el.dataset.key6==='menu')KeyMap.set(el.dataset.key6,e.key.length===1?e.key.toLowerCase():e.key);openControls()}};
  for(const el of document.querySelectorAll('[data-pad6]')){const a=ACTIONS.find(x=>x.id===el.dataset.pad6);if(a.pad===undefined)continue;el.onclick=()=>{el.textContent='…';el.classList.add('listening');waitPad(index=>{KeyMap.setPad(a.id,index);openControls()})}}
  $('keymapReset6').onclick=()=>{KeyMap.reset();openControls()};$('keymapBack6').onclick=()=>openSettings10();
}
function waitPad(done){const start=performance.now(),raw=()=>Array.from((Object.getOwnPropertyDescriptor(Navigator.prototype,'getGamepads')?.value||navigator.getGamepads).call(navigator)||[]);const was=new Set();for(const p of raw())if(p)p.buttons.forEach((b,i)=>b.pressed&&was.add(p.index+':'+i));const tick=()=>{if(performance.now()-start>8000)return openControls();for(const p of raw())if(p)for(let i=0;i<p.buttons.length;i++)if(p.buttons[i].pressed&&!was.has(p.index+':'+i))return done(i);requestAnimationFrame(tick)};requestAnimationFrame(tick)}

/* ---------------- 5. Acessibilidade ---------------- */
const A11y={
  get colorblind(){return !!read().colorblind},get beatCue(){return !!read().beatCue},get tolerant(){return !!read().tolerant},
  toggle(k){const v=read();v[k]=!v[k];write(v);return v[k]}
};
// Modo daltônico: os avisos de ataque (vermelhos e rosados no canvas) viram âmbar.
const cbCache=new Map();
function cbColor(c){
  if(typeof c!=='string')return c;let hit=cbCache.get(c);if(hit!==undefined)return hit;let r,g,b,a='';
  let m=c.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i);if(m){r=parseInt(m[1],16);g=parseInt(m[2],16);b=parseInt(m[3],16);a=m[4]||''}
  else if((m=c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/))){r=+m[1];g=+m[2];b=+m[3];a=m[4]}
  if(r===undefined){cbCache.set(c,c);return c}
  const max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max?(max-min)/max:0;let out=c;
  if(sat>.35&&max>110&&r===max&&g<r*.72&&b<r*.92){const k=max/255;const R=Math.round(255*k),G2=Math.round(185*k),B=Math.round(40*k);out=a.length===2?'#'+[R,G2,B].map(v=>v.toString(16).padStart(2,'0')).join('')+a:a?`rgba(${R},${G2},${B},${a})`:`rgb(${R},${G2},${B})`}
  cbCache.set(c,out);return out;
}
for(const prop of ['strokeStyle','fillStyle']){const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,prop);if(!d?.set)continue;Object.defineProperty(CanvasRenderingContext2D.prototype,prop,{configurable:true,get:d.get,set(v){d.set.call(this,A11yFlags.colorblind&&(typeof mode==='undefined'||mode==='action')?cbColor(v):v)}})}
const A11yFlags={colorblind:A11y.colorblind};
// Pista visual da batida: um anel que se fecha sobre cada metrônomo até a batida.
const BEAT=1.6;
function drawBeatCues(){
  if(!A11y.beatCue||typeof current==='undefined'||!current?.enemies)return;
  for(const e of current.enemies){if(e.type!=='compasso'||e.hp<=0||e.clock===undefined)continue;const period=BEAT*(A11y.tolerant?1.33:1),t=(e.clock%BEAT)/BEAT,x=e.x*T-cam.x,y=e.y*T-cam.y-34,k=1-t;
    ctx.save();ctx.strokeStyle='#7fe0ff';ctx.lineWidth=3;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x,y,6+18*k,0,Math.PI*2);ctx.stroke();ctx.fillStyle=t>.62?'#ffd23f':'#7fe0ff';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.restore()}
  if(typeof bossActor!=='undefined'&&bossActor&&bossActor.wind>0){const x=bossActor.x*T-cam.x,y=bossActor.y*T-cam.y-70;ctx.save();ctx.fillStyle='#ffd23f';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#120f1c';const s='● '+bossActor.wind.toFixed(1)+'s';ctx.strokeText(s,x,y);ctx.fillText(s,x,y);ctx.restore()}
}
if(typeof drawEnv==='function'){const drawBefore=drawEnv;drawEnv=function(...a){const r=drawBefore.apply(this,a);try{A11yFlags.colorblind=A11y.colorblind;drawBeatCues()}catch{}return r}}
// Batida tolerante: o metrônomo bate um terço mais devagar, os avisos dos padrões do
// chefe e dos perigos duram 30% mais, e o contratempo perfeito da Percussão fica mais largo.
let lastGuard=0;
if(typeof update==='function'){const updateBefore=update;update=function(dt,...a){const r=updateBefore.call(this,dt,...a);try{if(A11y.tolerant&&typeof current!=='undefined'&&current?.enemies){for(const e of current.enemies)if(e.type==='compasso'&&e.clock!==undefined&&e.hp>0)e.clock-=dt*.25;const g=C3?.percussionGuard||0;if(g>lastGuard+.01)C3.percussionGuard=g*1.6;lastGuard=C3?.percussionGuard||0}}catch{}return r}}
if(typeof C3!=='undefined'&&typeof C3.castPattern==='function'){const castBefore=C3.castPattern;C3.castPattern=function(e,kind){const before=C3.hazards.length,r=castBefore.call(this,e,kind);if(A11y.tolerant){for(const h of C3.hazards.slice(before)){if(h.time)h.time*=1.3;if(h.max)h.max*=1.3}if(e?.wind)e.wind*=1.3}return r}}
if(typeof PostGame!=='undefined'){Object.defineProperty(PostGame,'HAZARD_WARN',{configurable:true,get(){return A11y.tolerant?1.7:1.3}})}

// Menu Sistema: Controles e as três opções, ao lado de "Texto maior".
if(typeof openSettings10==='function'){const settingsBefore=openSettings10;openSettings10=function(...args){const r=settingsBefore.apply(this,args);try{
  const anchor=document.getElementById('bigText10')||document.getElementById('motion10');if(anchor&&!document.getElementById('controls6')){
    const make=(id,label,on)=>{const b=document.createElement('button');b.className='action';b.id=id;b.textContent=label;if(on)b.onclick=on;return b};
    const opt=(id,key,on,off)=>{const b=make(id,read()[key]?on:off);b.setAttribute('aria-pressed',String(!!read()[key]));b.onclick=()=>{const v=A11y.toggle(key);b.textContent=v?on:off;b.setAttribute('aria-pressed',String(v));A11yFlags.colorblind=A11y.colorblind};return b};
    const list=[make('controls6','CONTROLES · TECLAS E BOTÕES',openControls),opt('colorblind6','colorblind','AVISOS EM ÂMBAR · LIGADO','AVISOS EM ÂMBAR · DESLIGADO'),opt('beatCue6','beatCue','PISTA DA BATIDA · LIGADA','PISTA DA BATIDA · DESLIGADA'),opt('tolerant6','tolerant','BATIDA TOLERANTE · LIGADA','BATIDA TOLERANTE · DESLIGADA')];
    let at=anchor;for(const b of list){at.insertAdjacentElement('afterend',b);at=b}
  }}catch{}return r}}

refreshHints();syncOverlayFlag();
window.ToriiInterface6={Toasts,Zones,KeyMap,A11y,openControls,refreshHints};
})();
