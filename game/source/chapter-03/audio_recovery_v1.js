/* Recover an already enabled audio session on player input. Music retries are
 * explicit, limited to the selected track, and never advance a game clock. */
(function(){
'use strict';
const RETRY_INTERVAL=2000,retryAt=new Map();
let resumeTask=null,resumeContext=null,enableIntent=0;
let retries=0,throttled=0,resumes=0,resumeFailures=0;
const focused=()=>!document.hidden&&(typeof Input121==='undefined'||Input121.focused!==false);
const gesture=event=>!!event?.isTrusted&&['keydown','pointerdown','touchend'].includes(event.type)&&
 !event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.altKey;
function resume(){
 const context=AC;
 if(audioMuted||!audioEnabled||!context||!focused())return Promise.resolve(false);
 if(context.state==='running')return Promise.resolve(true);
 if(!['suspended','interrupted'].includes(context.state))return Promise.resolve(false);
 if(resumeTask&&resumeContext===context)return resumeTask;
 resumeContext=context;resumes++;
 let request;
 try{request=context.resume()}catch{resumeFailures++;return Promise.resolve(false)}
 const task=Promise.resolve(request).then(async()=>{
  if(AC!==context)return false;
  // A mute chosen while resume was pending remains authoritative.
  if(audioMuted||!audioEnabled){
   if(context.state==='running')try{await context.suspend()}catch{}
   return false;
  }
  if(context.state!=='running')return false;
  soundscape();return true;
 }).catch(()=>{resumeFailures++;return false}).finally(()=>{
  if(resumeTask===task){resumeTask=null;resumeContext=null}
 });
 resumeTask=task;return task;
}
function retrySelected(){
 if(audioMuted||!audioEnabled||!focused())return false;
 const id=albumTrack11();
 if(!id||!Object.hasOwn(ALBUM11,id)||!Music11.failed.has(id)||Music11.pending.has(id))return false;
 const now=performance.now(),last=retryAt.get(id);
 // One new attempt per explicit reactivation, at most once per two seconds.
 // A failed retry remains on the established synthesised fallback.
 if(last!==undefined&&now-last<RETRY_INTERVAL){throttled++;return false}
 retryAt.set(id,now);retries++;Music11.failed.delete(id);soundscape();return true;
}
function handleGesture(event){
 if(!gesture(event)||audioMuted||!audioEnabled||!AC||!focused())return false;
 if(!['suspended','interrupted'].includes(AC.state))return false;
 resume();return true;
}
const previousEnable=enableAudio;
enableAudio=function(...args){
 const result=previousEnable.apply(this,args);
 if(!audioMuted&&audioEnabled&&(enableIntent||gesture(window.event)))resume();
 return result;
};
const previousToggle=toggleAudio121;
toggleAudio121=function(...args){
 const reactivating=audioMuted;let result;
 if(reactivating)enableIntent++;
 try{result=previousToggle.apply(this,args)}finally{if(reactivating)enableIntent--}
 if(reactivating&&!audioMuted){retrySelected();resume()}
 return result;
};
const previousStart=startAlbum11;
startAlbum11=function(id,...args){
 const before=Music11.source,result=previousStart.call(this,id,...args);
 if(Music11.source&&Music11.source!==before&&Music11.id===id)retryAt.delete(id);
 return result;
};
for(const type of ['keydown','pointerdown','touchend'])window.addEventListener(type,handleGesture,{capture:true,passive:true});
window.AudioRecoveryV1={handleGesture,
 snapshot:()=>({resumePending:!!resumeTask,retries,throttled,resumes,resumeFailures})};
})();
