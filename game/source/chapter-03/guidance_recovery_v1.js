/* Keep campaign directions local, and let an existing save restore its trail.
 * The waiting boss is scenery: it owns no HP, AI, interaction or collision. */
(function(){
'use strict';
function passage(objective,from,gate){
 const blocked=gate.need&&!gate.need(),label=C3.labels[gate.to]?.[0]||areaLabels()[gate.to]?.[0]||gate.to;
 return {...objective,area:from,x:gate.x,y:gate.y,name:'PASSAGEM · '+label,
  hint:blocked?(gate.blocked||'Esta passagem ainda precisa ser liberada.'):'Siga a trilha luminosa para a próxima área.'};
}
C3.nav=function(){
 const objective=C3.objective();if(objective.area===G.area)return objective;
 // Include return paths to earlier chapters. If an old save lacks a gate
 // prerequisite, point at that passage and explain it instead of losing the
 // current-area marker. The gate itself still enforces its original rule.
 for(const openOnly of [true,false]){
  const queue=[G.area],parents=new Map([[G.area,null]]);
  for(let i=0;i<queue.length&&!parents.has(objective.area);i++){
   const id=queue[i];for(const gate of areas[id]?.gates||[]){
    if(!areas[gate.to]||parents.has(gate.to)||openOnly&&gate.need&&!gate.need())continue;
    parents.set(gate.to,{from:id,gate});queue.push(gate.to);
   }
  }
  if(!parents.has(objective.area))continue;
  let next=objective.area;while(parents.get(next)&&parents.get(next).from!==G.area)next=parents.get(next).from;
  const step=parents.get(next);if(step)return passage(objective,G.area,step.gate);
 }
 // A removed destination in a legacy save must still leave an explicit cue.
 return {...objective,area:G.area,x:G.x,y:G.y,hint:objective.hint||'Consulte a jornada no menu para escolher a próxima passagem.'};
};
const previousMarker=drawGuideMarker;drawGuideMarker=function(...args){
 const essential=G?.c3?.started&&!G.c3.complete&&((G.area==='cloud_terrace'&&!G.c3.metronomeDone)||(G.area==='silence_core'&&!G.c3.silenceDone));
 if(G?.guidance!==false||!essential)return previousMarker.apply(this,args);
 return guideBefore10.apply(this,args);
};
function preview(){
 const area=areas.cloud_terrace;if(!area||area.props.some(p=>p.type==='c3_metronome_waiting'))return;
 area.props.push({type:'c3_metronome_waiting',x:15,y:10});
}
const previousBuild=buildMaps;buildMaps=function(...args){const result=previousBuild.apply(this,args);preview();return result};
const waitingBoss={id:'c3_metronome'};
const previousProp=drawProp;drawProp=function(p,cx,cy){
 if(p.type!=='c3_metronome_waiting')return previousProp.apply(this,arguments);
 if(G?.c3?.metronomeDone||bossActor?.id==='c3_metronome')return;
 // EnemyArt's neutral frame is static for this passive record. The prop's
 // sort foot is y+.5. Its waiting position keeps the complete sprite inside
 // the entrance camera; the existing combat spawn remains unchanged.
 EnemyArtV1.draw(Math.round((p.x+.5)*T-cx),Math.round((p.y+.5)*T-cy),'boss',waitingBoss);
};
const previousSystem=openSystem;openSystem=function(...args){
 const result=previousSystem.apply(this,args),resume=$('resume10');
 if(G?.guidance!==false||!resume||$('guidanceRecover'))return result;
 const button=document.createElement('button');button.id='guidanceRecover';button.className='action';button.textContent='REATIVAR ORIENTAÇÃO';
 button.onclick=()=>{G.guidance=true;routeCache.key='';save(true);updateHUD();closeOverlay()};
 resume.parentElement.insertBefore(button,resume);return result;
};
// Combat saves intentionally restore the checkpoint's gameplay snapshot.
// Guidance is a current player preference, so carry it into that snapshot
// before the existing save code selects it. No combat/progression data moves.
const previousSave=save;save=function(...args){
 if(G?.checkpoint?.snapshot)G.checkpoint.snapshot.guidance=G.guidance!==false;
 return previousSave.apply(this,args);
};
preview();window.GuidanceRecoveryV1={preview};
})();
