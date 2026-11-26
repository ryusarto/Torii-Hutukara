/* Beta 1.24 musical interfaces, using the approved Ressonâncias presentation.
 * Presentation only: native controls, audio sessions, outcomes and saves remain owned
 * by Radio9, PlantSequencer, LumiMelody and the in-world puzzle modules. */
(function(){
'use strict';
if(window.ToriiNewGamesUIV7)return;
const node=id=>document.getElementById(id),ui=()=>window.ToriiUI7;
const worldIds=['bridgeMessage','clubStageMessage','canalViolin','finalEchoes'];
const padHeld=new Map();let queued=false,ready=false,resizeObserver=null;
function frame(element,type){
 if(!element||!ui())return;
 element.classList.add('ui7-machine');
 if(!element.querySelector(':scope > .ui7-skin'))element.insertAdjacentHTML('afterbegin',ui().skin(type));
}
function decorate(){
 const outer=node('overlayInner');if(!outer||!ui())return;
 const game=outer.querySelector('#radioTuner,#plantSequencer,#lumiMelody');
 outer.classList.toggle('ui7-new-game-window',!!game);
 if(game){
  const kind=game.id==='radioTuner'?'radio':game.id==='plantSequencer'?'plant':'lumi';
  game.dataset.ui7NewGame=kind;game.classList.add('ui7-new-game');
  // Only stable display containers receive canvases. The native sequencer rewrites
  // slot contents after every choice; its waveforms and original buttons stay intact.
  frame(game.querySelector('.radio-display'),'inner');
  frame(game.querySelector('.plant-board'),'deck');
  ui().paint(outer);
 }else padHeld.clear();
 for(const id of worldIds)node(id)?.classList.add('ui7-new-world');
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate()})}
function activeRadio(){return !!node('radioTuner')&&window.ToriiMenuControlsV7?.scope()?.contains(node('radioTuner'))}
function radioPad(pad){
 if(!activeRadio()||!pad||typeof C3==='undefined')return false;
 const [x,y]=C3.padDirection(pad),horizontal=Math.abs(x)>.55&&Math.abs(x)>Math.abs(y);
 if(!horizontal){padHeld.delete(pad.index);return false}
 const sign=Math.sign(x),now=performance.now();let held=padHeld.get(pad.index);
 if(!held||held.sign!==sign||now>=held.next){
  const first=!held||held.sign!==sign;
  const button=node(sign<0?'radioDown':'radioUp');if(button&&!button.disabled)button.click();
  held={sign,next:now+(first?360:135)};padHeld.set(pad.index,held);
 }
 // Horizontal input changes the tuning dial; vertical input retains ordinary menu
 // focus. Confirm/cancel still work during a held horizontal direction.
 const controls=window.ToriiMenuControlsV7;
 if(C3.padEdge(pad,1)||C3.padEdge(pad,9))controls.back();else if(C3.padEdge(pad,0))controls.confirm();
 return true;
}
function installPad(){
 for(const name of ['handleMenuPad','handlePrimaryPad','handleSecondPad']){
  const previous=C3[name];if(typeof previous!=='function')continue;
  C3[name]=function(pad){
   const allowed=name!=='handleSecondPad'||C3.coopActive();
   if(allowed&&radioPad(pad))return;
   return previous.apply(this,arguments);
  };
 }
}
const previousInit=init;init=function(...args){
 const result=previousInit.apply(this,args);if(ready)return result;ready=true;
 const style=document.createElement('style');style.id='ui7NewGamesStyle';style.textContent=__UI7_NEW_GAMES_CSS__;document.head.appendChild(style);
 const overlay=node('overlayInner');
 if(overlay)new MutationObserver(schedule).observe(overlay,{childList:true,subtree:true});
 // These are the only observed roots. Native status strings update freely without
 // DOM replacement or a whole-document observer on the gameplay frame.
 const frameNode=node('frame');
 if(frameNode||overlay){resizeObserver=new ResizeObserver(schedule);if(frameNode)resizeObserver.observe(frameNode);if(overlay)resizeObserver.observe(overlay)}
 if(typeof C3!=='undefined')installPad();decorate();return result;
};
window.ToriiNewGamesUIV7={decorate,refresh:schedule,radioPad};
})();
