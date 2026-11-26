/* T&H · controles de toque aprovados. A entrada continua em input_mobile_combat.js.
 * Coordenadas normalizadas independentes por orientação, sem alterar o save. */
(function(){
'use strict';
const KEY='torii_hutukara_touch_layout_v1',ROOT=document.documentElement;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),copy=v=>JSON.parse(JSON.stringify(v));
const definitions={
 portrait:{zones:{left:{x:12,y:448,w:148,h:240},right:{x:164,y:448,w:216,h:240}},controls:{
 stick:{x:20,y:556,w:112,h:112,zone:'left',label:'Mover'},heal:{x:23,y:463,w:78,h:44,zone:'left',label:'Fita'},
 interact:{x:166,y:453,w:80,h:44,zone:'right',label:'Ação'},attack:{x:302,y:587,w:70,h:76,zone:'right',label:'Ataque',pad:'triangle'},dodge:{x:233,y:615,w:58,h:65,zone:'right',label:'Rolar',pad:'circle'},skill:{x:314,y:514,w:58,h:65,zone:'right',label:'Técnica',pad:'square'},advanced:{x:251,y:458,w:58,h:65,zone:'right',label:'Téc. II',pad:'diamond'},signature:{x:186,y:520,w:58,h:65,zone:'right',label:'Especial',pad:'diamond'},switch:{x:168,y:604,w:58,h:65,zone:'right',label:'Trocar',pad:'circle'}}},
 landscape:{zones:{left:{x:12,y:145,w:180,h:233},right:{x:590,y:124,w:242,h:254}},controls:{
 stick:{x:24,y:230,w:108,h:108,zone:'left',label:'Mover'},switch:{x:146,y:305,w:46,h:56,zone:'left',label:'Trocar',pad:'circle'},attack:{x:741,y:275,w:70,h:76,zone:'right',label:'Ataque',pad:'triangle'},dodge:{x:663,y:320,w:52,h:56,zone:'right',label:'Rolar',pad:'circle'},skill:{x:772,y:178,w:50,h:56,zone:'right',label:'Técnica',pad:'square'},advanced:{x:704,y:141,w:50,h:56,zone:'right',label:'Téc. II',pad:'diamond'},signature:{x:629,y:224,w:50,h:56,zone:'right',label:'Especial',pad:'diamond'},interact:{x:686,y:236,w:50,h:44,zone:'right',label:'Ação'},heal:{x:598,y:306,w:46,h:44,zone:'right',label:'Fita'}}}
};
let installed=false,editor=null,settingsBack=null,safeProbe=null,lastOrientation='';
function read(){
 let data={};try{data=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
 const clean={version:1,opacity:clamp(Number.isFinite(data.opacity)?data.opacity:.72,.25,.85)};
 for(const o of ['portrait','landscape']){clean[o]={};for(const id of Object.keys(definitions[o].controls)){const p=data[o]?.[id];if(Number.isFinite(p?.u)&&Number.isFinite(p?.v))clean[o][id]={u:clamp(p.u,0,1),v:clamp(p.v,0,1)}}}
 return clean;
}
function write(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch{return false}}
function defaults(o){const d=definitions[o],p={};for(const [id,c]of Object.entries(d.controls)){const z=d.zones[c.zone];p[id]={u:(c.x-z.x)/(z.w-c.w),v:(c.y-z.y)/(z.h-c.h)}}return p}
function viewport(){const v=window.visualViewport;return{w:v?.width||innerWidth,h:v?.height||innerHeight}}
function safe(){if(!safeProbe)return{top:0,right:0,bottom:0,left:0};const s=getComputedStyle(safeProbe);return Object.fromEntries(['top','right','bottom','left'].map(k=>[k,parseFloat(s['padding'+k[0].toUpperCase()+k.slice(1)])||0]))}
/* Pure geometry also used by QA. Insets are in CSS pixels, never game pixels. */
function geometry(o,w,h,insets={top:0,right:0,bottom:0,left:0}){
 const d=definitions[o],s=insets,availW=Math.max(1,w-s.left-s.right),availH=Math.max(1,h-s.top-s.bottom),portrait=o==='portrait';
 const deckH=h<=640?204:224;
 const scale=portrait?Math.min((availW-24)/368,(deckH-12)/240):Math.min(1.15,(availH-80)/254,(availW-40)/450);
 const zones={},controls={};
 if(portrait){const left=s.left+(availW-368*scale)/2;zones.left={x:left,y:h-s.bottom-8-240*scale,w:148*scale,h:240*scale};zones.right={x:left+152*scale,y:zones.left.y,w:216*scale,h:240*scale}}
 else{zones.left={x:s.left+12,y:h-s.bottom-12-233*scale,w:180*scale,h:233*scale};zones.right={x:w-s.right-12-242*scale,y:h-s.bottom-12-254*scale,w:242*scale,h:254*scale}}
 for(const[id,c]of Object.entries(d.controls))controls[id]={...c,w:Math.max(44,c.w*scale),h:Math.max(44,c.h*scale)};
 return{o,w,h,scale,zones,controls};
}
function positions(o,g,saved=read()[o]){
 const normalized={...defaults(o),...saved},p={};for(const[id,c]of Object.entries(g.controls)){const z=g.zones[c.zone],n=normalized[id];p[id]={x:z.x+clamp(n.u,0,1)*Math.max(0,z.w-c.w),y:z.y+clamp(n.v,0,1)*Math.max(0,z.h-c.h)}}
 // A corrupt, obsolete or manually edited layout must never hide another input.
 if(Object.keys(p).some(id=>collides(id,p[id],p,g)))return positionsDefault(o,g);
 return p;
}
function positionsDefault(o,g){const p={},n=defaults(o);for(const[id,c]of Object.entries(g.controls)){const z=g.zones[c.zone];p[id]={x:z.x+n[id].u*Math.max(0,z.w-c.w),y:z.y+n[id].v*Math.max(0,z.h-c.h)}}return p}
function normalize(g,p){return Object.fromEntries(Object.entries(p).map(([id,v])=>{const c=g.controls[id],z=g.zones[c.zone];return[id,{u:clamp((v.x-z.x)/Math.max(1,z.w-c.w),0,1),v:clamp((v.y-z.y)/Math.max(1,z.h-c.h),0,1)}]}))}
function collides(id,p,all,g){const a=g.controls[id];return Object.entries(all).some(([other,q])=>{if(other===id)return false;const b=g.controls[other];return p.x<q.x+b.w-.5&&p.x+a.w>q.x+.5&&p.y<q.y+b.h-.5&&p.y+a.h>q.y+.5})}
function release(){if(typeof releaseAll121==='function')releaseAll121();else if(typeof releaseTouch121==='function')releaseTouch121()}
function place(node,p,c,fixed=true){for(const[k,v]of Object.entries({position:fixed?'fixed':'absolute',left:p.x+'px',top:p.y+'px',right:'auto',bottom:'auto',width:c.w+'px',height:c.h+'px',minHeight:'44px',margin:'0',transform:'none'}))node.style.setProperty(k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v,'important')}
function draw(node,c,o){
 const canvas=node.querySelector('canvas[data-ui7-pad]');if(!canvas)return;canvas.dataset.transparent=String(o==='landscape');
 if(window.ToriiUI7?.drawPad){window.ToriiUI7.drawPad(canvas,c.pad||'square',node.dataset.symbol||'',o==='landscape');return}
 canvas.width=64;canvas.height=56;const x=canvas.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle=o==='landscape'?'#291f2b66':'#302733';x.strokeStyle='#b99466';x.lineWidth=2;x.fillRect(5,3,54,48);x.strokeRect(5,3,54,48);x.fillStyle='#f5dbb0';x.font='bold 19px monospace';x.textAlign='center';x.fillText(node.dataset.symbol||'♪',32,34);
}
const symbols={attack:'attack',dodge:'dodge',skill:'tech',advanced:'tech2',signature:'super',switch:'switch'};
function decorate(node,id,clone=false){
 const c=definitions.portrait.controls[id];node.classList.add('tl-control-v1');node.dataset.tlControl=id;
 if(id==='stick'){if(clone)node.innerHTML='<span class="tl-stick-core"></span>';return}
 const hint=clone?null:node.querySelector('.mobileActionState121');node.replaceChildren();
 if(c.pad){const canvas=document.createElement('canvas');canvas.width=64;canvas.height=56;canvas.dataset.ui7Pad=c.pad;canvas.dataset.symbol=symbols[id]||id;node.dataset.symbol=symbols[id]||id;node.appendChild(canvas)}
 else{node.classList.add('tl-rect-v1');if(id==='heal'&&window.ToriiUI7?.icon)node.insertAdjacentHTML('beforeend',window.ToriiUI7.icon('tape','tl-tape-v1'))}
 const text=document.createElement('span');text.className='tl-label-v1';text.textContent=c.label;node.appendChild(text);if(hint)node.appendChild(hint);
}
function layout(){
 const deck=document.getElementById('mobileDeck121');if(!installed||!deck)return;
 const v=viewport(),o=v.w>v.h?'landscape':'portrait',g=geometry(o,v.w,v.h,safe()),p=positions(o,g);ROOT.style.setProperty('--tl-opacity',String(read().opacity));
 const mobile=ROOT.classList.contains('mobile121');ROOT.classList.toggle('touch-layout-v1',mobile);ROOT.classList.toggle('tl-world-v1',!!(typeof G!=='undefined'&&G&&mode!=='title'));
 if(!mobile)return;
 for(const[id,c]of Object.entries(g.controls)){const node=id==='stick'?document.getElementById('mobileStick121'):deck.querySelector(`[data-mobile-action="${id}"]`);if(node){place(node,p[id],c);draw(node,c,o)}}
 const s=safe();for(const[action,x]of [['pause',v.w-s.right-100],['full',v.w-s.right-52]]){const b=deck.querySelector(`[data-mobile-action="${action}"]`);if(b)place(b,{x,y:s.top+8},{w:44,h:44})}
 const readout=document.getElementById('mobileReadout121'),charge=document.getElementById('mobileCharge121');if(readout){readout.style.left=(s.left+12)+'px';readout.style.top=(s.top+10)+'px'}if(charge){charge.style.left=(s.left+12)+'px';charge.style.top=(s.top+31)+'px'}const goal=document.getElementById('mobileGoal121');if(goal){goal.style.left=(s.left+12)+'px';goal.style.top=(s.top+52)+'px'}
 if(o!==lastOrientation){lastOrientation=o;release()}
 if(editor)renderEditor();
 return{orientation:o,geometry:g,positions:p};
}
const CSS=`
html.touch-layout-v1 #mobileDeck121{border-radius:3px;border:2px solid #77583e;background:linear-gradient(90deg,#312831,#382a30 48%,#28242d);box-shadow:inset 0 0 0 2px #151924;overflow:visible;padding:0;pointer-events:none;gap:0}
html.touch-layout-v1:not(.landscape121) #mobileDeck121{height:var(--touch-deck-height,224px);width:100%;box-sizing:border-box;align-self:stretch}
html.touch-layout-v1 #mobileLeft121,html.touch-layout-v1 #mobileRight121,html.touch-layout-v1 .mobileTools121,html.touch-layout-v1 .mobileActions121{display:block;position:static;min-height:0;width:auto;height:auto;padding:0;pointer-events:none}
html.touch-layout-v1 #mobileLeft121>small{display:none}html.touch-layout-v1 #mobileGoal121{display:-webkit-box!important;position:fixed;max-width:calc(100vw - 125px);max-height:28px;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical;text-align:left;font:10px/13px monospace;color:#e6d4af;text-shadow:1px 1px #101320;background:#151b24b0;padding:1px 4px;pointer-events:none}html.touch-layout-v1:not(.tl-world-v1) #mobileDeck121{visibility:hidden!important}
html.touch-layout-v1 #mobileDeck121 button.tl-control-v1,html.touch-layout-v1 #mobileStick121{box-sizing:border-box;pointer-events:auto;touch-action:none;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;padding:0!important;color:#f9e2b7;display:flex!important;flex-direction:column;align-items:center;justify-content:flex-start;gap:0;text-shadow:1px 1px #101320;font:700 9px monospace;overflow:visible;user-select:none;-webkit-user-select:none}
html.touch-layout-v1 .tl-control-v1 canvas,.tl-editor-v1 .tl-control-v1 canvas{image-rendering:pixelated;display:block;width:100%;height:calc(100% - 12px);object-fit:contain;pointer-events:none}
html.touch-layout-v1 .tl-control-v1 .tl-label-v1,.tl-editor-v1 .tl-label-v1{line-height:12px;font:700 9px/12px monospace;white-space:nowrap;color:#f5dfb5;pointer-events:none}
html.touch-layout-v1 .tl-control-v1 .mobileActionState121{position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);font:700 8px/9px monospace;white-space:nowrap;color:#e7ca9b;pointer-events:none;letter-spacing:-.2px}
html.touch-layout-v1 .tl-control-v1[data-ready="locked"] canvas{filter:grayscale(.85);opacity:.48}html.touch-layout-v1 .tl-control-v1[data-ready="cooldown"] canvas{opacity:.65}html.touch-layout-v1 .tl-control-v1.pressed canvas{filter:brightness(1.45);transform:translateY(2px)}
html.touch-layout-v1 #mobileDeck121 button.tl-control-v1.tl-rect-v1,.tl-editor-v1 button.tl-control-v1.tl-rect-v1{border:2px solid #9c7950!important;background:#30252ee8!important;box-shadow:inset 0 0 0 2px #171a23!important;justify-content:center;flex-direction:row;gap:3px}
.tl-tape-v1{width:24px;height:24px;object-fit:contain;image-rendering:pixelated;pointer-events:none}
html.touch-layout-v1 #mobileStick121,.tl-editor-v1 .tl-control-v1[data-tl-control="stick"]{border:3px solid #8b795a!important;border-radius:50%!important;background:radial-gradient(circle,#22232b66 55%,#9b85652e 57%,#161b2470 65%)!important;box-shadow:inset 0 0 0 2px #222831!important}
html.touch-layout-v1 #mobileKnob121,.tl-editor-v1 .tl-stick-core{position:absolute;width:42%;height:42%;border:2px solid #c9b18b;border-radius:50%;background:#6b615a80;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:inset 0 0 0 3px #282631;pointer-events:none}
html.touch-layout-v1 .stickArrows121{display:none}html.touch-layout-v1 #mobileReadout121{display:block!important;position:fixed!important;max-width:calc(100vw - 125px);font:700 11px/16px monospace;text-align:left;color:#f7e2b8;text-shadow:1px 1px #101320;background:#171b25b8;padding:1px 5px;border-left:2px solid #a78959;pointer-events:none;z-index:2}
html.touch-layout-v1 #mobileCharge121{position:fixed!important;width:auto;display:block!important;background:#171b25b8;padding:0 5px;font:700 10px/15px monospace;pointer-events:none;z-index:2}html.touch-layout-v1 #mobileCharge121[hidden]{display:none!important}html.touch-layout-v1 #mobileCharge121 meter{display:none!important}
html.touch-layout-v1 #mobileDeck121 .mobileTools121 button{pointer-events:auto;background:#211f2bb8!important;color:#f5dfb5;border:1px solid #a78959;border-radius:2px;padding:0;font:700 9px monospace}
html.touch-layout-v1:not(.physical121) #tapeButton,html.touch-layout-v1:not(.physical121) #vitals092{display:none!important}
html.touch-layout-v1.landscape121 #mobileDeck121{border:0;background:none;box-shadow:none}
html.touch-layout-v1.landscape121 #mobileDeck121 .tl-control-v1{opacity:var(--tl-opacity,.72)}html.touch-layout-v1.landscape121 #mobileDeck121 .tl-control-v1.pressed{opacity:1;background:transparent!important}
html.touch-layout-v1.physical121 #mobileDeck121{display:none!important}
html.tl-editing-v1 #mobileDeck121{visibility:hidden!important;pointer-events:none!important}html.tl-editing-v1 #mobileDeck121 *{pointer-events:none!important}
html.tl-editing-v1 #overlay{background:#111622df!important}html.tl-editing-v1 #overlayInner{position:fixed!important;inset:0!important;max-width:none!important;width:100%!important;height:100%!important;max-height:none!important;padding:0!important;border:0!important;background:none!important;overflow:hidden!important;box-shadow:none!important}
.tl-editor-v1{position:fixed;inset:0;color:#f5dfb5;font:12px monospace;touch-action:none;z-index:3}.tl-editor-head-v1{position:absolute;z-index:5;top:max(8px,env(safe-area-inset-top));left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));display:flex;gap:8px;align-items:center;flex-wrap:wrap}.tl-editor-head-v1 strong{flex:1;min-width:130px}.tl-editor-head-v1 button{min-width:62px;min-height:44px;font:700 11px monospace;padding:4px 9px;color:#ffe2b0;background:#332932;border:2px solid #a78553;border-radius:2px}.tl-editor-stage-v1{position:absolute;transform-origin:0 0;overflow:hidden;box-shadow:0 0 0 1px #8b785252;background:#151c2677}.tl-editor-zone-v1{position:absolute;box-sizing:border-box;border:1px dashed #ad9c6f;background:#9a875b15;pointer-events:none}.tl-editor-zone-v1 span{position:absolute;top:2px;left:4px;font:8px monospace;color:#aa9b7f}.tl-editor-v1 .tl-control-v1{position:absolute;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;border:0;padding:0;background:none;color:#f5dfb5;font:9px monospace;touch-action:none;cursor:grab}.tl-editor-v1 .tl-rect-v1{display:flex}.tl-editor-v1 .tl-control-v1.tl-selected-v1{outline:2px solid #54ddd5;outline-offset:2px}.tl-editor-v1 .tl-control-v1.tl-collision-v1{outline-color:#ff737f;background:#ff334433}.tl-editor-notice-v1{position:absolute;left:12px;right:12px;top:68px;font:10px monospace;text-align:center;color:#e2d0ad;pointer-events:none}.tl-editor-status-v1{position:absolute;z-index:5;bottom:max(8px,env(safe-area-inset-bottom));left:10%;right:10%;text-align:center;font:11px monospace;color:#ffe8a9;background:#19212bdd;pointer-events:none}.tl-settings-v1 input{min-height:44px;max-width:100%}.tl-settings-v1 label{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.tl-settings-v1 button{min-height:44px}
`;
function install(){
 if(installed||!document.getElementById('mobileDeck121'))return;installed=true;
 const style=document.createElement('style');style.id='touch-layout-v1-style';style.textContent=CSS;document.head.appendChild(style);
 safeProbe=document.createElement('div');safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';document.body.appendChild(safeProbe);
 const deck=document.getElementById('mobileDeck121'),heal=document.createElement('button');heal.type='button';heal.dataset.mobileAction='heal';heal.setAttribute('aria-label','Usar fita de cura');deck.querySelector('.mobileActions121').appendChild(heal);
 for(const id of Object.keys(definitions.portrait.controls)){const node=id==='stick'?document.getElementById('mobileStick121'):deck.querySelector(`[data-mobile-action="${id}"]`);if(node)decorate(node,id)}
 const pause=deck.querySelector('[data-mobile-action="pause"]');if(pause)pause.textContent='Ⅱ PAUSA';
 layout();
}
function notice(text){const node=document.getElementById('tlEditorStatusV1');if(node)node.textContent=text}
function endEditor(){const back=editor?.back;editor=null;ROOT.classList.remove('tl-editing-v1');release();layout();if(back)back()}
function openEditor(o,back){
 o=o==='landscape'?'landscape':'portrait';release();
 editor={orientation:o,draft:copy(read()[o]),back:back||(()=>openSettings(settingsBack)),drag:null,geometry:null,positions:null,scale:1};
 // Suspend legacy menu navigation while the editor owns keyboard focus.
 // The game stays in overlay mode; the previous menu origin is preserved.
 if(typeof enterMenu10==='function')enterMenu10('<div id="touchLayoutEditorV1" class="tl-editor-v1"></div>','main');else return;
 if(typeof menuPage10!=='undefined')menuPage10=null;
 ROOT.classList.add('tl-editing-v1');
 const shell=document.getElementById('touchLayoutEditorV1');shell.innerHTML='<div class="tl-editor-head-v1"><strong>Posição dos botões</strong><button type="button" id="tlEditorCancelV1">Voltar</button><button type="button" id="tlEditorResetV1">Padrão</button><button type="button" id="tlEditorSaveV1">Salvar</button></div><div class="tl-editor-notice-v1">'+(o==='portrait'?'Vertical':'Horizontal')+' · Arraste dentro das áreas marcadas.</div><div id="tlEditorStageV1" class="tl-editor-stage-v1"></div><div class="tl-editor-status-v1" id="tlEditorStatusV1" role="status"></div>';
 document.getElementById('tlEditorCancelV1').onclick=endEditor;
 document.getElementById('tlEditorResetV1').onclick=()=>{editor.draft={};renderEditor();notice('Padrão restaurado. Salve para aplicar.')};
 document.getElementById('tlEditorSaveV1').onclick=()=>{if(editor.drag)return;const data=read();data[o]=normalize(editor.geometry,editor.positions);if(!write(data)){notice('Não foi possível salvar neste navegador.');return}endEditor()};
 renderEditor();document.getElementById('tlEditorCancelV1').focus();
}
function renderEditor(){
 if(!editor)return;const stage=document.getElementById('tlEditorStageV1');if(!stage)return;
 if(editor.drag){editor.draft=normalize(editor.geometry,editor.drag.before);editor.drag=null;release()}
 const v=viewport(),o=editor.orientation,s=safe(),same=(v.w>v.h)===(o==='landscape');
 const w=same?v.w:(o==='portrait'?Math.min(v.w,v.h):Math.max(v.w,v.h)),h=same?v.h:(o==='portrait'?Math.max(v.w,v.h):Math.min(v.w,v.h));
 const scale=Math.min((v.w-s.left-s.right-12)/w,(v.h-s.top-s.bottom-100)/h),g=geometry(o,w,h,same?s:{top:0,right:0,bottom:0,left:0});
 editor.geometry=g;editor.positions=positions(o,g,editor.draft);editor.scale=scale;stage.replaceChildren();stage.style.cssText=`width:${w}px;height:${h}px;left:${(v.w-w*scale)/2}px;top:${s.top+86}px;transform:scale(${scale})`;
 for(const [id,z]of Object.entries(g.zones)){const node=document.createElement('div');node.className='tl-editor-zone-v1';node.style.cssText=`left:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px`;node.innerHTML='<span>'+(id==='left'?'MOVIMENTO / APOIO':'AÇÕES')+'</span>';stage.appendChild(node)}
 for(const[id,c]of Object.entries(g.controls)){
  const node=document.createElement('button');node.type='button';node.setAttribute('aria-label','Reposicionar '+c.label);decorate(node,id,true);place(node,editor.positions[id],c,false);draw(node,c,o);stage.appendChild(node);
  node.addEventListener('pointerdown',e=>{if(editor.drag)return;e.preventDefault();e.stopPropagation();node.setPointerCapture(e.pointerId);editor.drag={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,origin:{...editor.positions[id]},before:copy(editor.positions)};node.classList.add('tl-selected-v1')});
  node.addEventListener('pointermove',e=>{const d=editor?.drag;if(!d||d.id!==id||d.pointer!==e.pointerId)return;e.preventDefault();const z=g.zones[c.zone],p={x:clamp(d.origin.x+(e.clientX-d.x)/editor.scale,z.x,z.x+z.w-c.w),y:clamp(d.origin.y+(e.clientY-d.y)/editor.scale,z.y,z.y+z.h-c.h)};editor.positions[id]=p;place(node,p,c,false);node.classList.toggle('tl-collision-v1',collides(id,p,editor.positions,g))});
  const end=e=>{const d=editor?.drag;if(!d||d.id!==id||d.pointer!==e.pointerId)return;if(e.type==='pointercancel'||e.type==='lostpointercapture'||collides(id,editor.positions[id],editor.positions,g)){editor.positions[id]=d.origin;place(node,d.origin,c,false);notice(e.type==='pointercancel'?'Movimento cancelado.':'Essa posição está ocupada.')}editor.draft=normalize(g,editor.positions);editor.drag=null;node.classList.remove('tl-selected-v1','tl-collision-v1')};
  node.addEventListener('pointerup',end);node.addEventListener('pointercancel',end);node.addEventListener('lostpointercapture',end);
  node.addEventListener('keydown',e=>{const moves={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]};if(!moves[e.key])return;e.preventDefault();e.stopImmediatePropagation();const z=g.zones[c.zone],old=editor.positions[id],m=moves[e.key],p={x:clamp(old.x+m[0],z.x,z.x+z.w-c.w),y:clamp(old.y+m[1],z.y,z.y+z.h-c.h)};if(collides(id,p,editor.positions,g))return notice('Essa posição está ocupada.');editor.positions[id]=p;editor.draft=normalize(g,editor.positions);place(node,p,c,false)});
 }
}
function openSettings(back){
 if(typeof back==='function')settingsBack=back;release();const amount=Math.round(read().opacity*100);
 if(typeof enterMenu10!=='function')return;
 enterMenu10('<div class="tl-settings-v1"><div class="eyebrow">CONTROLES DE TOQUE</div><h2>Posição dos botões</h2><p>Arraste os botões dentro do espaço de cada grupo. Cada orientação tem sua própria posição.</p><div class="row"><button class="action" id="tlPortraitV1">EDITAR VERTICAL</button><button class="action" id="tlLandscapeV1">EDITAR HORIZONTAL</button></div><label>Visibilidade horizontal <input id="tlOpacityV1" aria-label="Visibilidade horizontal" type="range" min="25" max="85" value="'+amount+'"><output id="tlOpacityValueV1">'+amount+'%</output></label><p class="tiny">A configuração fica neste aparelho e não altera o salvamento da jornada.</p><div class="row"><button class="action strong" id="tlSettingsBackV1">VOLTAR</button></div></div>','settings');
 document.getElementById('tlPortraitV1').onclick=()=>openEditor('portrait');document.getElementById('tlLandscapeV1').onclick=()=>openEditor('landscape');
 document.getElementById('tlSettingsBackV1').onclick=()=>{release();if(settingsBack)settingsBack();else if(window.ToriiUI7?.openTitleSettings)window.ToriiUI7.openTitleSettings();else if(typeof closeOverlay==='function')closeOverlay()};
 document.getElementById('tlOpacityV1').oninput=e=>{const data=read();data.opacity=Number(e.target.value)/100;if(!write(data))return;document.getElementById('tlOpacityValueV1').textContent=e.target.value+'%';ROOT.style.setProperty('--tl-opacity',String(data.opacity))};
 window.ToriiUI7?.paint(document.getElementById('overlayInner'));
}
if(typeof updateMobileReadout121==='function'){const before=updateMobileReadout121;updateMobileReadout121=function(){const result=before.apply(this,arguments);ROOT.classList.toggle('tl-world-v1',!!(typeof G!=='undefined'&&G&&mode!=='title'));const button=document.querySelector('#mobileDeck121 [data-mobile-action="heal"]');if(button){const n=typeof G!=='undefined'&&G?G.potions||0:0,label=button.querySelector('.tl-label-v1');if(label)label.textContent='Fita ×'+n;button.dataset.ready=n?'ready':'locked';button.setAttribute('aria-label','Usar fita de cura · '+n+' disponíveis')}return result}}
if(typeof mobileAction121==='function'){const before=mobileAction121;mobileAction121=function(action){if(editor)return;if(action==='heal'){window.ToriiCura?.useTape();return}return before.apply(this,arguments)}}
if(typeof updateMobileLayout121==='function'){const before=updateMobileLayout121;updateMobileLayout121=function(){const result=before.apply(this,arguments);layout();return result}}
if(typeof closeOverlay==='function'){const before=closeOverlay;closeOverlay=function(){if(editor){endEditor();return}return before.apply(this,arguments)}}
if(typeof openSettings10==='function'){const before=openSettings10;openSettings10=function(){const result=before.apply(this,arguments);const inner=document.getElementById('overlayInner');if(inner&&!document.getElementById('tlSettingsEntryV1')){const b=document.createElement('button');b.type='button';b.id='tlSettingsEntryV1';b.className='action';b.textContent='POSIÇÃO DOS BOTÕES';b.onclick=()=>openSettings(()=>openSettings10());const target=inner.querySelector('.menu-grid10,.row')||inner;target.appendChild(b)}return result}}
if(typeof init==='function'){const before=init;init=function(){const result=before.apply(this,arguments);install();return result}}
// This listener runs after legacy capture, which is suspended with menuPage10=null.
// It handles Escape before bubble listeners and allows native Tab navigation.
window.addEventListener?.('keydown',e=>{if(!editor)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();endEditor();return}if(e.key==='Tab'){e.stopImmediatePropagation();return}if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();const active=document.activeElement;if(active?.tagName==='BUTTON')active.click()}},true);
window.TouchLayoutV1={key:KEY,openEditor,openSettings,layout,install,read,settings:read,positions:(o,w,h)=>{const v=viewport();const g=geometry(o,w||v.w,h||v.h,safe());return positions(o,g)},geometry,defaults,normalize,collides,definition:definitions,get editor(){return editor?{orientation:editor.orientation,positions:copy(editor.positions),geometry:copy(editor.geometry),draft:copy(editor.draft)}:null}};
})();
