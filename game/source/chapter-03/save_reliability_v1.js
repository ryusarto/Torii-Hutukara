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
const numericFields=['x','y','shards','potions','resonance','totalSeconds','started','spawn','chapter','version','moveSpeed10'];
function number(value){
 // Legacy null scalars behaved as zero in the game's arithmetic/defaults.
 if(value===null)return 0;
 if(typeof value==='string'){
  value=value.trim();
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value))return null;
  value=Number(value);
 }
 return typeof value==='number'&&Number.isFinite(value)?value:null;
}
function prepare(source){
 if(!validShape(source))return null;
 const result={...source};
 for(const name of numericFields)if(Object.hasOwn(source,name)&&source[name]!==undefined){
  const value=number(source[name]);if(value===null)return null;result[name]=value;
 }
 if(object(source.checkpoint)){
  const checkpoint={...source.checkpoint};
  for(const name of ['x','y'])if(Object.hasOwn(checkpoint,name)&&checkpoint[name]!==null)checkpoint[name]=number(checkpoint[name]);
  result.checkpoint=checkpoint;
 }
 return result;
}
function usable(source){
 if(!validShape(source)||typeof source.area!=='string'||!Object.hasOwn(areas,source.area))return false;
 for(const name of numericFields)if(Object.hasOwn(source,name)&&
  (typeof source[name]!=='number'||!Number.isFinite(source[name])))return false;
 // The existing migrations own HP/XP/level recovery and limits. Verify their
 // final values rather than replacing those established rules or extra keys.
 for(const map of ['hp','maxhp','xp','levels'])for(const hero of C3.progressionIds){
  const value=source[map]?.[hero];if(typeof value!=='number'||!Number.isFinite(value))return false;
 }
 return true;
}
const previousNormalize=normalizeSave;
normalizeSave=function(raw){
 const prepared=prepare(raw?.progress||raw);if(!prepared)return null;
 let result;
 try{result=previousNormalize(raw?.progress?{...raw,progress:prepared}:prepared)}catch{return null}
 if(!result||!usable(result))return null;
 if(result.checkpoint&&(typeof result.checkpoint.area!=='string'||!Object.hasOwn(areas,result.checkpoint.area)))result.checkpoint=null;
 const snapshot=result.checkpoint?.snapshot;
 if(snapshot){
  // A corrupt optional checkpoint must not take a valid campaign down with
  // it. Validate the snapshot through the same migrations without its nested
  // checkpoint; restoring already supplies the outer checkpoint explicitly.
  let valid=false;
  const preparedSnapshot=prepare(snapshot);
  if(preparedSnapshot)try{
   const restored=previousNormalize({...preparedSnapshot,checkpoint:null});
   valid=!!restored&&usable(restored);
  }catch{}
  if(!valid)result.checkpoint=null;else result.checkpoint.snapshot=preparedSnapshot;
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
