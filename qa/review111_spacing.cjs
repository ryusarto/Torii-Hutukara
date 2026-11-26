/* Actual district map builders + authored atlas rectangles + depth facade API.
 * Geometry/route evidence only; composition and mobile perception need browser QA. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const runtime=read('game/source/chapter-03/chapter3_runtime.js'),base=read('game/source/base/torii-core.html');
function section(s,a,b){const start=s.indexOf(a),end=s.indexOf(b,start+a.length);assert(start>=0&&end>start,a);return s.slice(start,end)}
const helpers=section(base,'function mk(','function house('),walkable=section(base,'function tileWalkable(','function moveG(');
const district=section(runtime,"  a=C3.boundary(mk('distortion_district'","  a=C3.room('contratempo'");
const cenarioObject=section(read('game/source/chapter-03/cenarios_v2.js'),'const CenariosV2={','\n};')+'\n};';
const desertObject=section(read('game/source/chapter-03/cenarios_deserto_v1.js'),'const CenariosDesertoV1={','\n};')+'\n};';
const manifest=JSON.parse(read('assets/cenarios/v2/manifest.json')),desert=JSON.parse(read('assets/cenarios/deserto-v1/manifest.json'));
for(const group of ['items','sheets','backgrounds'])manifest[group]={...manifest[group],...desert[group]};manifest.theme='deserto-v1';
function fixture(layout=district){
 const s={console,Math,Number,Object,Array,Map,Set,areas:{},T:24,VW:768,VH:432,cam:{x:0,y:0},G:{area:'distortion_district',flags:{},c3:{}},C3:{AREAS:['distortion_district'],coopActive:()=>false},routeCache:{key:''},ctx:{globalAlpha:1,draws:[],save(){},restore(){},drawImage(...args){this.draws.push(args)}},drawTile(){},drawProp(){},Image:class{constructor(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=1024;}},current:null};s.window=s;
 vm.createContext(s);vm.runInContext(helpers+'\n'+walkable+'\n'+section(runtime,'C3.boundary=function(','\n')+'\nlet a;\n'+layout+'\nglobalThis.map=a;',s);
 vm.runInContext(cenarioObject.replace('__CENARIOS_V2_MANIFEST__',JSON.stringify(manifest)).replace('__CENARIOS_V2_ASSETS__','{}')+'\n'+desertObject+'\n'+read('game/source/chapter-03/environment_depth_v1.js').replace('__ENVIRONMENT_VOLUME_ASSETS__','{}').replace('__ENVIRONMENT_VOLUME_MANIFEST__','{}'),s);
 s.current=s.map;vm.runInContext('CenariosV2.installMaps();globalThis.desert=CenariosDesertoV1;',s);return s;
}
function volume(s,p){
 const b=s.EnvironmentDepthV1.facade(p);if(b)return{p,x:b.x,y:b.y,right:b.x+b.w+b.depth+2,bottom:b.bottom+3,w:b.w,h:b.h,depth:b.depth};
 if(p.type!=='c3_elevator')return null;
 // The elevator is an authored landmark without an extruded facade. Measure
 // its actual sprite() output using the same desert binding and source atlas.
 const binding=s.desert.binding(p);s.ctx.draws.length=0;
 vm.runInContext('globalThis.cenario=CenariosV2;',s);
 assert(s.cenario.sprite(binding.item,(p.x+.5)*24,(p.y+.65)*24,...binding.display));
 const draw=s.ctx.draws.at(-1),[x,y,w,h]=draw.slice(-4);return{p,x,y,right:x+w,bottom:y+h,w,h,depth:0};
}
function separation(a,b){const dx=Math.max(0,a.x-b.right,b.x-a.right),dy=Math.max(0,a.y-b.bottom,b.y-a.bottom);return Math.hypot(dx,dy)}
function overlaps(a,b){return a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y}
function canBody(s,x,y){return [-.29,.29].every(dx=>[-.29,.29].every(dy=>s.tileWalkable(s.map,x+dx,y+dy)))}
function reachable(s,start){const q=[start],seen=new Set([start.join(',')]);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,key=xx+','+yy;if(!seen.has(key)&&canBody(s,xx+.5,yy+.5)){seen.add(key);q.push([xx,yy])}}}return seen}
const results=[];function check(name,fn){const detail=fn();results.push({name,passed:true,detail});console.log('OK · '+name)}
const s=fixture(),houses=s.map.props.filter(p=>p.type==='c3_house'),facades=s.map.props.map(p=>volume(s,p)).filter(Boolean);
check('Actual 2.5D facade bounds have no overlap after removing decorative backdrop houses',()=>{const pairs=[];for(let i=0;i<facades.length;i++)for(let j=i+1;j<facades.length;j++){assert(!overlaps(facades[i],facades[j]),facades[i].p.type+' '+facades[i].p.x+'/'+facades[i].p.y+' overlaps '+facades[j].p.type+' '+facades[j].p.x+'/'+facades[j].p.y);pairs.push({a:[facades[i].p.type,facades[i].p.x,facades[i].p.y],b:[facades[j].p.type,facades[j].p.x,facades[j].p.y],gap:separation(facades[i],facades[j])})}assert(pairs.every(p=>p.gap>=24),'one full tile of visual breathing room, including the lift landmark');return{buildings:facades.length,minGap:Math.min(...pairs.map(p=>p.gap))}});
check('Removed residences release their own footprints without erasing venue collision',()=>{assert.equal(houses.length,4);for(const [x,y]of [[7,5],[19,4]])assert(s.tileWalkable(s.map,x+.5,y+.5),x+','+y);for(const [x,y]of [[13,12],[25,8]])assert(!s.tileWalkable(s.map,x+.5,y+.5));for(const p of houses)for(let y=p.y-5;y<p.y;y++)for(let x=p.x-3;x<p.x+4;x++)assert(s.map.blocked.has(x+','+y));return{residences:houses.map(p=>[p.x,p.y]),restoredTileSamples:[[7,5],[19,4]]}});
check('District retains installed V2 entry points, mission gates, NPCs and map bounds',()=>{assert.deepEqual([s.map.w,s.map.h],[64,44]);assert.deepEqual(Array.from(s.map.gates,g=>g.to).sort(),['sky_terminal','contratempo','power_plant','sky_canal','ciro_workshop','sky_lift'].sort());for(const [id,x,y]of [['contratempo',13.5,16.5],['ciro_workshop',25.5,12.5],['power_plant',55.5,12.5]]){const g=s.map.gates.find(v=>v.to===id);assert.deepEqual([g.x,g.y],[x,y]);}assert.equal(s.map.npcs.find(n=>n.id==='c3_resident').x,42);assert.equal(s.map.npcs.find(n=>n.id==='c3_resident_b').y,31);for(const b of facades){assert(b.x>=24&&b.right<=(s.map.w-1)*24);assert(b.y>=0&&b.bottom<=(s.map.h-1)*24)}return{gates:s.map.gates.length,npcs:s.map.npcs.length}});
check('Full-radius movement can reach all existing district entrances from the terminal',()=>{const seen=reachable(s,[5,37]);const gates=s.map.gates.map(g=>({to:g.to,x:g.x,y:g.y,reachable:seen.has(Math.floor(g.x)+','+Math.floor(g.y))}));for(const g of gates)assert(g.reachable,g.to+' unreachable');for(const n of s.map.npcs)assert(seen.has(Math.floor(n.x)+','+Math.floor(n.y)),n.id+' unreachable');return{reachableCells:seen.size,gates}});
check('Only removed house cells become walkable; retained architecture keeps every collider',()=>{
 const old=fixture(district.replace('[[44,8],[54,22],[7,27],[45,39]]','[[9,9],[21,8],[44,8],[54,22],[7,27],[45,39]]'));
 const removed=old.map.props.filter(p=>p.type==='c3_house'&&!houses.some(n=>n.x===p.x&&n.y===p.y));
 const freed=[...old.map.blocked].filter(key=>!s.map.blocked.has(key));assert(freed.length>50);
 for(const key of s.map.blocked)assert(old.map.blocked.has(key),'unchanged layout must not add new invisible walls');
 for(const key of freed){const [x,y]=key.split(',').map(Number);assert(removed.some(p=>x>=p.x-Math.floor(p.w/2)&&x<p.x-Math.floor(p.w/2)+p.w&&y>=p.y-p.h&&y<p.y),key+' outside removed house');assert(canBody(s,x+.5,y+.5),key+' not usable by the actual body radius');}
 return{freedCollisionCells:freed.length,retainedCollisionCells:s.map.blocked.size};
});
check('Before/after proof removes the concrete club/workshop overlaps rather than shrinking art',()=>{const oldLayout=district.replace('[[44,8],[54,22],[7,27],[45,39]]','[[9,9],[21,8],[44,8],[54,22],[7,27],[45,39]]'),old=fixture(oldLayout),before=old.map.props.map(p=>volume(old,p)).filter(Boolean),collisions=[];for(let i=0;i<before.length;i++)for(let j=i+1;j<before.length;j++)if(overlaps(before[i],before[j]))collisions.push([before[i].p.type,before[j].p.type]);assert(collisions.length>=2);for(const p of houses){const oldP=old.map.props.find(q=>q.type===p.type&&q.x===p.x&&q.y===p.y);assert.deepEqual(JSON.stringify(volume(s,p)),JSON.stringify(volume(old,oldP)))}return{oldResidences:6,newResidences:houses.length,oldOverlaps:collisions}});
console.log(JSON.stringify({passed:results.length,results,method:'Node VM real district builders + installed CenariosV2 portals, actual desert atlas rectangles/sprite output and production facade geometry; no build/Chrome/hardware.'},null,2));
