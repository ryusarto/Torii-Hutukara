/* Observe the existing persistence result without selecting or copying saves.
 * Combat checkpoints, cloud recovery and expedition saves keep their owners. */
(function(){
'use strict';
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
function validShape(source){
 if(!object(source))return false;
 // Missing fields still belong to the existing migrations. Present fields
 // used as lists must be lists before a load can replace the current session.
 for(const name of ['discovered','defeated','formation','knownMembers','progressionRoster']){
  const value=source[name];
  if(value!==undefined&&(!Array.isArray(value)||value.some(id=>typeof id!=='string')))return false;
 }
 for(const name of ['flags','hp','maxhp','xp','levels','choices','c3']){
  const value=source[name];
  if(value!==undefined&&value!==null&&!object(value))return false;
 }
 return true;
}
const previousNormalize=normalizeSave;
normalizeSave=function(raw){
 if(!validShape(raw?.progress||raw))return null;
 let result;
 try{result=previousNormalize.apply(this,arguments)}catch{return null}
 if(!result||!validShape(result))return null;
 const snapshot=result.checkpoint?.snapshot;
 if(snapshot){
  // A corrupt optional checkpoint must not take a valid campaign down with
  // it. Validate the snapshot through the same migrations without its nested
  // checkpoint; restoring already supplies the outer checkpoint explicitly.
  let valid=false;
  if(validShape(snapshot))try{
   const restored=previousNormalize({...snapshot,checkpoint:null});
   valid=!!restored&&validShape(restored);
  }catch{}
  if(!valid)result.checkpoint=null;
 }
 return result;
};
let game=null,ok=null,failures=0,episode=false,saving=0;
function observe(result,notify){
 if(!G)return result;
 if(G!==game){game=G;ok=null;episode=false}
 // An expedition deliberately skips some autosaves. Undefined is no write,
 // rather than a failed write, and must not erase the last known result.
 if(result===true){ok=true;episode=false}
 else if(result===false){
  ok=false;
  if(!episode){
   episode=true;failures++;
   if(notify)toast('NÃO FOI POSSÍVEL SALVAR NESTE NAVEGADOR. USE EXPORTAR PARA GUARDAR UMA CÓPIA.');
  }
 }
 return result;
}
const previousSave=save;
save=function(silent=false){
 let result;saving++;
 try{result=previousSave.apply(this,arguments)}finally{saving--}
 return observe(result,silent);
};
// Wave checkpoints and pagehide persist expeditions directly. Observe those
// results too, without duplicating a notification from the outer save call.
const previousPersist=PostGame.persist;
PostGame.persist=function(...args){
 const result=previousPersist.apply(this,args);
 return saving?result:observe(result,true);
};
window.SaveReliabilityV1={status:()=>({ok:game===G?ok:null,reason:game===G&&ok===false?'storage':null,failures})};
})();
