/* Menu controls for keyboard, stick/D-pad and either cooperative controller.
 * The builder installs the early keydown bridge before legacy capture handlers.
 * Gameplay actions and musical shortcuts retain their original handlers. */
(function(){
'use strict';
const node=id=>document.getElementById(id),ROOT=document.documentElement;
const PAD_REPEAT_DELAY=360,PAD_REPEAT_RATE=135,KEY_REPEAT_RATE=95;
const heldPads=new Map();let firstControl=null,lastKeyAt=0,queued=false;
const visible=el=>{if(!el||el.closest('[hidden],.hidden'))return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
const editingLayout=()=>!!window.TouchLayoutV1?.editor;
const capturingBinding=()=>!!document.querySelector('.keymap6 .listening');
function scope(){
 if(editingLayout())return null;
 const history=node('leituraHistorico');if(visible(history))return history;
 if(typeof mode==='undefined')return null;
 if(mode==='overlay'&&visible(node('overlay')))return node('overlayInner');
 if(mode==='title'&&visible(node('start')))return node('start').querySelector('.ui7-title-menu nav')||node('start');
 return null;
}
function controls(root=scope()){
 if(!root)return [];
 return [...root.querySelectorAll('button,input:not([type="hidden"]),select,textarea,[data-key6],[data-pad6],a[href]')].filter(el=>visible(el)&&!el.matches(':disabled,[aria-disabled="true"]')&&(!el.hasAttribute('data-pad6')||typeof el.onclick==='function'));
}
function focused(){const root=scope(),active=document.activeElement;return root?.contains(active)?active:null}
function focus(el){if(!el)return null;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'});markFocus();return el}
function markFocus(){for(const el of document.querySelectorAll('.ui7-menu-active'))if(el!==document.activeElement)el.classList.remove('ui7-menu-active');const el=focused();if(el)el.classList.add('ui7-menu-active')}
function sync(){
 const root=scope(),list=controls(root);ROOT.classList.toggle('ui7-menu-controls',!!root);
 if(!root){firstControl=null;heldPads.clear();return}
 for(const el of list)if(el.hasAttribute('data-key6')||el.hasAttribute('data-pad6')){el.tabIndex=0;el.setAttribute('role','button');const id=el.dataset.key6||el.dataset.pad6,action=window.ToriiInterface6?.KeyMap.actions.find(a=>a.id===id);el.setAttribute('aria-label',(el.hasAttribute('data-key6')?'Alterar tecla de ':'Alterar botão de ')+(action?.label||id))}
 if(firstControl!==list[0]){firstControl=list[0]||null;heldPads.clear();if(typeof releaseAll121==='function')releaseAll121()}
 if(!capturingBinding()&&list.length&&!list.includes(document.activeElement))focus(list[0]);else markFocus();
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;sync()})}
function move(direction){const list=controls();if(!list.length)return false;let i=list.indexOf(document.activeElement);if(i<0)return !!focus(list[0]);return !!focus(list[(i+(direction<0?-1:1)+list.length)%list.length])}
function adjust(direction){
 const el=focused();if(!el)return false;
 if(el.matches('input[type="range"],input[type="number"]')){
  const min=Number(el.min||0),max=Number(el.max||100),step=el.step==='any'?1:Number(el.step||1),value=Math.max(min,Math.min(max,Number(el.value)+Math.sign(direction)*step));
  if(Number.isFinite(value)){el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}return true;
 }
 if(el.matches('select')){const options=[...el.options].filter(o=>!o.disabled),i=options.indexOf(el.selectedOptions[0]);if(options.length){el.value=options[(Math.max(0,i)+Math.sign(direction)+options.length)%options.length].value;el.dispatchEvent(new Event('change',{bubbles:true}))}return true}
 return false;
}
function confirm(){const list=controls(),el=list.includes(document.activeElement)?document.activeElement:focus(list[0]);if(!el)return false;if(el.matches('input[type="range"],input[type="number"],select,textarea,input[type="text"],input[type="search"]'))return true;el.click();schedule();return true}
function back(){
 const root=scope();if(!root)return false;
 if(root.id==='leituraHistorico'){Narrativa.fecharHistorico();schedule();return true}
 // Required choices and retry screens can only be left through their own actions.
 if(root.querySelector('#choiceGrid,#retryCheckpoint,[data-echo-card],[data-respite]'))return true;
 if(root.querySelector('[data-c3note]')&&C3.phraseOrigin==='final')return true;
 const ids=['postSuspendBack','postExitBack','keymapBack6','tlSettingsBackV1','ui7A11yBack','ui7TitleBack','dif_voltar','helpBack10','back10','backTitle10','lumiClose','c3PhraseCancel','c3MapClose','c3JournalClose','postBriefBack','postMapClose','shopClose','resume10'];
 let button=ids.map(node).find(el=>el&&root.contains(el)&&visible(el)&&!el.disabled);
 if(!button)button=controls(root).find(el=>el.tagName==='BUTTON'&&/^(?:[‹←]\s*)?(voltar|fechar|cancelar|retornar)(?:\b|\s|$)/i.test(el.textContent.trim()));
 if(button){button.click();schedule();return true}
 if(typeof menuPage10!=='undefined'&&menuPage10==='main'){closeOverlay();schedule();return true}
 // Never close an unknown panel or dispatch a gameplay dodge underneath it.
 return true;
}
function actionFor(key){
 const k=String(key).toLowerCase(),km=window.ToriiInterface6?.KeyMap;
 const matches=id=>{try{return String(km?.binding(id)||'').toLowerCase()===k}catch{return false}};
 if(key==='ArrowUp'||matches('up'))return 'up';if(key==='ArrowDown'||matches('down'))return 'down';if(key==='ArrowLeft'||matches('left'))return 'left';if(key==='ArrowRight'||matches('right'))return 'right';
 if(key==='Enter'||key===' '||matches('interact'))return 'confirm';if(key==='Escape'||matches('menu')||matches('dodge'))return 'back';return null;
}
function handleKey(e){
 // Native tuner arrows/Escape own their input before generic menu navigation.
 if(typeof Radio9!=='undefined'&&typeof Radio9.key==='function'&&Radio9.key(e))return true;
 const root=scope();if(!root||capturingBinding()||e.ctrlKey||e.metaKey||e.altKey)return false;
 const active=focused(),typing=active?.matches('textarea,input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="number"])');
 if(typing&&e.key!=='Escape'){e.stopImmediatePropagation();return true}
 // The recorded pitches retain their numeric shortcuts in the Lumi puzzle.
 if(root.querySelector('[data-vnote]')&&['1','2','3'].includes(e.key))return false;
 const action=actionFor(e.key);if(!action)return false;
 e.preventDefault();e.stopImmediatePropagation();
 if(e.repeat&&['confirm','back'].includes(action))return true;
 const now=performance.now();if(e.repeat&&now-lastKeyAt<KEY_REPEAT_RATE)return true;lastKeyAt=now;
 if(action==='back')return back();if(action==='confirm')return confirm();
 const direction=action==='left'||action==='up'?-1:1;
 if((action==='left'||action==='right')&&adjust(direction))return true;
 move(direction);return true;
}
function handlePad(pad){
 if(!scope()||capturingBinding())return false;sync();
 const [x,y]=C3.padDirection(pad),axis=Math.abs(x)>Math.abs(y)?x:y,vertical=Math.abs(y)>=Math.abs(x),sign=Math.abs(axis)>.55?Math.sign(axis):0,now=performance.now();
 let held=heldPads.get(pad.index);if(!held){held={sign:0,vertical:true,next:0};heldPads.set(pad.index,held)}
 if(sign&&(!held.sign||held.sign!==sign||held.vertical!==vertical||now>=held.next)){
  if(!vertical&&adjust(sign)){}else move(sign);
  held.next=now+(!held.sign||held.sign!==sign||held.vertical!==vertical?PAD_REPEAT_DELAY:PAD_REPEAT_RATE);held.sign=sign;held.vertical=vertical;
 }else if(Math.abs(axis)<.35){held.sign=0;held.next=0}
 if(C3.padEdge(pad,1)||C3.padEdge(pad,9))back();else if(C3.padEdge(pad,0))confirm();
 return true;
}
const priorMenuPad=C3.handleMenuPad;C3.handleMenuPad=function(pad){if(scope()){handlePad(pad);return}return priorMenuPad.apply(this,arguments)};
const priorPrimary=C3.handlePrimaryPad;C3.handlePrimaryPad=function(pad){if(scope()){handlePad(pad);return}return priorPrimary.apply(this,arguments)};
const priorSecond=C3.handleSecondPad;C3.handleSecondPad=function(pad){const root=scope();if(root&&C3.coopActive()){if(root.querySelector('#choiceGrid,[data-c3note],[data-vnote],#c3FirstPlant,#c3ArchiveTape'))return;handlePad(pad);return}return priorSecond.apply(this,arguments)};
for(const name of ['openOverlay','closeOverlay','enterMenu10']){const prior=window[name];if(typeof prior==='function')window[name]=function(...args){const result=prior.apply(this,args);schedule();return result}}
const priorInit=init;init=function(...args){const result=priorInit.apply(this,args);const style=document.createElement('style');style.textContent=`
.ui7 .ui7-menu-active{outline:2px solid #a8d3d1!important;outline-offset:2px;scroll-margin:12px}
.ui7 .keymap6 [role="button"]{cursor:pointer;border-radius:0;background:#242130;padding:6px 10px;color:#efd5a0}
.ui7 .keymap6 .ui7-menu-active{background:#4c3c40;color:#ffe7b0}
`;document.head.appendChild(style);for(const el of [node('overlayInner'),node('start')].filter(Boolean))new MutationObserver(schedule).observe(el,{childList:true,subtree:true});document.addEventListener('focusin',markFocus);sync();return result};
window.ToriiMenuControlsV7={scope,controls,focus,move,confirm,back,adjust,handleKey,handlePad,sync};
})();
