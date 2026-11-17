/* Geometry regression for the scenario-art pass; no browser or dependencies.
 * node qa/cenarios_v2_routes.cjs <before/MAPAS.json> <after/MAPAS.json>
 * Writes the report to stdout; failures set exit status 1.
 * Snapshots must be exported after C3.start(true), before opening either C3 route.
 * Tile-center BFS and the real .29 four-corner body radius do not execute
 * callbacks, gate predicates, gamepad input, boss AI or a physical playthrough.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const EXPECTED_AREAS = [
  'studio','corridor','chamber','city','forest','ruins',
  'rain_station','voices','tape_market','bento_shop','celina_home','radio9','voice_roofs','voice_tower',
  'sky_terminal','distortion_district','contratempo','power_plant','sky_canal','ciro_workshop','sky_lift',
  'cloud_sea','cloud_terrace','last_torii','silence_core'
];
const RADIUS=.29, INTERACTION=1.9;
const key=(x,y)=>`${x},${y}`;
const xy=value=>value.split(',').map(Number);
const isRing=(a,x,y)=>x===1||x===a.w-2||y===1||y===a.h-2;
const clone=data=>JSON.parse(JSON.stringify(data));
// Six explicit alignments accepted for the district's visible doors. All other
// fields (including destination IDs, blocked text and ordering) must stay exact.
const PORTAL_ALIGNMENTS = [
  {area:'distortion_district',to:'contratempo',before:{x:15,y:20},after:{x:13.5,y:16.5}},
  {area:'distortion_district',to:'ciro_workshop',before:{x:28,y:16},after:{x:25.5,y:12.5}},
  {area:'distortion_district',to:'power_plant',before:{x:56,y:14},after:{x:55.5,y:12.5}},
  {area:'contratempo',to:'distortion_district',before:{tx:15.5,ty:21.5},after:{tx:13.5,ty:17.5}},
  {area:'ciro_workshop',to:'distortion_district',before:{tx:28.5,ty:17.5},after:{tx:25.5,ty:13.5}},
  {area:'power_plant',to:'distortion_district',before:{tx:55.5,ty:15.5},after:{tx:55.5,ty:13.5}}
];
const canonicalGate=gate=>Object.fromEntries(Object.entries(gate).sort(([a],[b])=>a.localeCompare(b)));
function expectedPortals(area){
  const expected=clone(area.gates),alignments=PORTAL_ALIGNMENTS.filter(p=>p.area===area.id),invalidBaseline=[];
  for(const alignment of alignments){
    const matching=expected.filter(g=>g.to===alignment.to);
    if(matching.length!==1||!Object.entries(alignment.before).every(([field,value])=>matching[0][field]===value)){
      invalidBaseline.push(alignment);continue;
    }
    Object.assign(matching[0],alignment.after);
  }
  return {expected:expected.map(canonicalGate),alignments,invalidBaseline};
}
function readSnapshot(file){
  const raw=JSON.parse(fs.readFileSync(file,'utf8')),maps=Array.isArray(raw)?raw:raw.maps||raw.areas;
  if(!Array.isArray(maps))throw Error('Snapshot must contain an array of maps: '+file);
  return maps;
}
function prepare(source){const a=clone(source);a.blockedSet=new Set(a.blocked);a.nodeCache=null;return a;}
function walkable(a,x,y){
  const ix=Math.floor(x),iy=Math.floor(y);
  if(ix<1||iy<1||ix>=a.w-1||iy>=a.h-1)return false;
  // C3.start(true) sets bridge=true and fogCleared11=true. Historical bridge
  // tiles are an explicit engine override; other solids come from the snapshot.
  if(a.id==='forest'&&ix>=32&&ix<=35&&iy>=19&&iy<=23)return true;
  const type=a.tiles[iy]?.[ix];
  return !a.blockedSet.has(key(ix,iy))&&!!type&&type!=='void'&&type!=='water';
}
function bodyFits(a,x,y){return [-RADIUS,RADIUS].every(dx=>[-RADIUS,RADIUS].every(dy=>walkable(a,x+dx,y+dy)));}
function nodes(a){
  if(a.nodeCache)return a.nodeCache;
  const result=new Set();
  for(let y=1;y<a.h-1;y++)for(let x=1;x<a.w-1;x++)if(bodyFits(a,x+.5,y+.5))result.add(key(x,y));
  return a.nodeCache=result;
}
function bfs(a,start){
  const valid=nodes(a),first=key(Math.floor(start[0]),Math.floor(start[1])),distances=new Map();
  if(!bodyFits(a,...start)||!valid.has(first))return distances;
  distances.set(first,0);const queue=[first];
  for(let i=0;i<queue.length;i++){
    const current=queue[i],[x,y]=xy(current);
    for(const next of [key(x-1,y),key(x+1,y),key(x,y-1),key(x,y+1)]){
      if(valid.has(next)&&!distances.has(next)){distances.set(next,distances.get(current)+1);queue.push(next);}
    }
  }
  return distances;
}
function reachableTargets(a,entry,targets){
  const distances=bfs(a,entry),result={};
  for(const [name,target]of Object.entries(targets)){
    let shortest=Infinity;
    for(const [position,steps]of distances){const [x,y]=xy(position);if(Math.hypot(x+.5-target[0],y+.5-target[1])<INTERACTION)shortest=Math.min(shortest,steps);}
    result[name]={reachable:Number.isFinite(shortest),minCenterSteps:Number.isFinite(shortest)?shortest:null};
  }
  return result;
}
function fill(a,x,y,w,h,type){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){a.tiles[yy][xx]=type;a.blockedSet.delete(key(xx,yy));}a.nodeCache=null;}
function physicalStates(source){
  const maps=new Map(source.map(a=>[a.id,prepare(a)])),result=[];
  let a=maps.get('power_plant');
  for(const opened of [false,true]){
    if(opened)fill(a,16,9,3,11,'c3_metal');
    result.push({area:a.id,state:opened?'usinaGate=true':'usinaGate=false',entry:[3.5,21.5],targets:reachableTargets(a,[3.5,21.5],{lock:[15,17],sequencer:[33,12],returnGate:[3,21]})});
  }
  a=maps.get('sky_canal');
  for(const opened of [false,true]){
    if(opened)fill(a,17,10,7,5,'c3_bridge');
    result.push({area:a.id,state:opened?'canalPath=true':'canalPath=false',entry:[4.5,12.5],targets:reachableTargets(a,[4.5,12.5],{violin:[14,12],rescue:[37,12],returnGate:[3,12]})});
  }
  a=maps.get('cloud_sea');
  for(const state of ['none','A','A+platform','A+platform+B']){
    if(state==='A')fill(a,18,20,7,6,'c3_cloud');
    if(state==='A+platform')fill(a,32,14,7,5,'c3_platform');
    if(state==='A+platform+B')fill(a,45,8,6,6,'c3_cloud');
    result.push({area:a.id,state,entry:[5.5,26.5],targets:reachableTargets(a,[5.5,26.5],{A:[17,23],platform:[31,17],B:[44,11],endGatePhysicalApproach:[54,7],returnGate:[4,28]})});
  }
  return result;
}
function arrivals(source){
  const maps=new Map(source.map(a=>[a.id,prepare(a)])),result=[];
  for(const from of source)for(const gate of from.gates){const destination=maps.get(gate.to);result.push({from:from.id,to:gate.to,point:[gate.tx,gate.ty],bodyValid:!!destination&&bodyFits(destination,gate.tx,gate.ty)});}
  return result;
}
function analyzeSnapshots(before,after){
  const checks=[],record=(name,passed,detail)=>checks.push({name,passed:!!passed,detail});
  const expected=[...EXPECTED_AREAS].sort(),beforeIds=before.map(a=>a.id).sort(),afterIds=after.map(a=>a.id).sort();
  record('All 25 authored maps are present once in both snapshots',JSON.stringify(beforeIds)===JSON.stringify(expected)&&JSON.stringify(afterIds)===JSON.stringify(expected),{before:beforeIds,after:afterIds});
  if(checks.some(c=>!c.passed))return {passed:false,checks};
  const oldMaps=new Map(before.map(a=>[a.id,prepare(a)])),newMaps=new Map(after.map(a=>[a.id,prepare(a)])),changes=[];
  for(const id of EXPECTED_AREAS){
    const old=oldMaps.get(id),current=newMaps.get(id);
    record('Map dimensions preserved: '+id,old.w===current.w&&old.h===current.h,{before:[old.w,old.h],after:[current.w,current.h]});
    const oldNodes=nodes(old),newNodes=nodes(current),removed=[...oldNodes].filter(k=>!newNodes.has(k)),added=[...newNodes].filter(k=>!oldNodes.has(k));
    changes.push({area:id,beforeWalkableCenters:oldNodes.size,afterWalkableCenters:newNodes.size,removed,added});
    record('Walkable footprint '+(id==='cloud_sea'?'changes only on the excess outer ring':'preserved')+': '+id,id==='cloud_sea'?added.length===0&&removed.every(p=>isRing(old,...xy(p))):removed.length===0&&added.length===0,{removedCenters:removed.length,addedCenters:added.length});
    const portalContract=expectedPortals(old);
    record('Portal fields match the six explicit alignments only: '+id,portalContract.invalidBaseline.length===0&&JSON.stringify(portalContract.expected)===JSON.stringify(current.gates.map(canonicalGate)),{portals:current.gates.length,approvedAlignments:portalContract.alignments,invalidBaseline:portalContract.invalidBaseline});
  }
  const oldArrivals=arrivals(before),newArrivals=arrivals(after);
  record('Every map has at least one incoming authored transition',EXPECTED_AREAS.every(id=>newArrivals.some(a=>a.to===id)),{maps:25});
  record('All incoming spawn points fit the .29-tile body before and after',oldArrivals.every(a=>a.bodyValid)&&newArrivals.every(a=>a.bodyValid),{beforeTransitions:oldArrivals.length,afterTransitions:newArrivals.length,invalidBefore:oldArrivals.filter(a=>!a.bodyValid),invalidAfter:newArrivals.filter(a=>!a.bodyValid)});
  const cloud=newMaps.get('cloud_sea'),remainingRing=[...nodes(cloud)].filter(p=>isRing(cloud,...xy(p)));
  record('No walkable centers remain on the unintended cloud perimeter ring',remainingRing.length===0,{remaining:remainingRing});
  const beforeStates=physicalStates(before),afterStates=physicalStates(after);
  const expectedTargets=[
    {lock:true,sequencer:false,returnGate:true},{lock:true,sequencer:true,returnGate:true},
    {violin:true,rescue:false,returnGate:true},{violin:true,rescue:true,returnGate:true},
    {A:true,platform:false,B:false,endGatePhysicalApproach:false,returnGate:true},
    {A:true,platform:true,B:false,endGatePhysicalApproach:false,returnGate:true},
    {A:true,platform:true,B:true,endGatePhysicalApproach:false,returnGate:true},
    {A:true,platform:true,B:true,endGatePhysicalApproach:true,returnGate:true}
  ];
  afterStates.forEach((state,index)=>{
    const required=expectedTargets[index],mismatches=Object.entries(required).filter(([target,wanted])=>state.targets[target]?.reachable!==wanted).map(([target,wanted])=>({target,expected:wanted,actual:state.targets[target]?.reachable}));
    record('Physical route state: '+state.area+' / '+state.state,mismatches.length===0,{targets:state.targets,mismatches});
  });
  record('Usina and Canal route reachability is unchanged by the art pass',afterStates.slice(0,4).every((state,index)=>Object.entries(state.targets).every(([name,target])=>target.reachable===beforeStates[index].targets[name].reachable)),{states:4});
  return {passed:checks.every(c=>c.passed),passedChecks:checks.filter(c=>c.passed).length,totalChecks:checks.length,
    method:'Offline tile-center BFS with radius .29 corner checks; eight applyWorld-equivalent physical states; C3 preview bridge override. No event callbacks or conditional gate predicates executed.',
    conditionalGateFlagsTested:false,physicalControllersTested:false,
    assumptions:['Snapshots exported from C3.start(true) before C3 route completion.','Flauta delivery and quests are not modified by this test.','Cloud end-gate reachability is a physical approach test, not proof that its predicate allows chapter progression.'],
    portalAlignments:PORTAL_ALIGNMENTS,checks,walkableChanges:changes,arrivals:newArrivals,beforeStates,afterStates};
}
if(require.main===module){
  if(process.argv.length!==4){console.error('Usage: node qa/cenarios_v2_routes.cjs <before/MAPAS.json> <after/MAPAS.json>');process.exitCode=1;}
  else try{
    const report=analyzeSnapshots(readSnapshot(process.argv[2]),readSnapshot(process.argv[3]));
    report.files={before:path.resolve(process.argv[2]),after:path.resolve(process.argv[3])};
    console.log(JSON.stringify(report,null,2));console.error(`${report.passed?'PASS':'FAIL'} · ${report.passedChecks||0}/${report.totalChecks||report.checks.length} geometry checks`);
    if(!report.passed)process.exitCode=1;
  }catch(error){console.error(error.stack);process.exitCode=1;}
}
module.exports={readSnapshot,analyzeSnapshots,bodyFits,physicalStates};
