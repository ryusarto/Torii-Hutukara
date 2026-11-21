/* Production render contracts in Node/VM. Recorded geometry is not visual/FPS QA. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const depthSource=fs.readFileSync(path.join(root,'game/source/chapter-03/environment_depth_v1.js'),'utf8');
const atmosphereSource=fs.readFileSync(path.join(root,'game/source/chapter-03/environment_atmosphere_v1.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/environment-volume/v1/manifest.json'),'utf8'));
function canvas(calls,label){
 const stack=[],q={globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'#000',strokeStyle:'#000',lineWidth:1};
 q.save=()=>stack.push([q.globalAlpha,q.globalCompositeOperation,q.fillStyle,q.strokeStyle,q.lineWidth]);
 q.restore=()=>{assert(stack.length,'unbalanced canvas restore');[q.globalAlpha,q.globalCompositeOperation,q.fillStyle,q.strokeStyle,q.lineWidth]=stack.pop()};
 for(const kind of ['fillRect','clearRect','drawImage','beginPath','rect','clip','transform','moveTo','lineTo','closePath','fill','stroke','arc','fillText'])q[kind]=(...args)=>calls.push({kind,args,label,alpha:q.globalAlpha,color:q.fillStyle,composite:q.globalCompositeOperation});
 for(const kind of ['createLinearGradient','createRadialGradient'])q[kind]=(...args)=>{calls.push({kind,args,label});return {addColorStop:(...stops)=>calls.push({kind:'colorStop',args:stops,label})}};
 q.depth=()=>stack.length;return q;
}
function fixture(area='studio'){
 const calls=[],ctx=canvas(calls,'world'),s={console,Math,Object,Number,Array,Set,Map,JSON,ctx,T:24,VW:768,VH:432,cam:{x:0,y:0},mode:'walk',menuOpen:false,tick:0,oldProps:0,oldTiles:0,updates:0};
 s.G={area,x:12,y:10,active:'franco',flags:{masks:true},c3:{},formation:['franco','ryuchi'],options10:{}};
 s.current={id:area,w:40,h:30,props:[],npcs:[],gates:[],events:[],blocked:new Set(),tiles:Array.from({length:30},()=>Array(40).fill('wood'))};
 s.Image=class{constructor(){this.complete=false;this.naturalWidth=768;this.naturalHeight=768}decode(){this.complete=true;return Promise.resolve()}};
 s.C3={coopActive:()=>false,coopMember:()=> 'ryuchi',coop:{x:13,y:10}};
 s.Input121={mobile:false};s.CloudWorldV1={fall:null};s.tileWalkable=()=>true;
 s.partyMembers=()=>s.G.formation;s.getFollower=()=>({x:11.5,y:10.5});
 s.drawProp=()=>{s.oldProps++;return 'prop'};s.drawTile=()=>{s.oldTiles++;return 'tile'};s.drawTree=()=> 'tree';s.update=()=>{s.updates++;return 'update'};
 s.CenariosV2={itemFor:()=>null,available:()=>null,material:()=>false};
 s.document={createElement(){const q=canvas(calls,'mask');return {width:0,height:0,getContext:()=>q}}};s.window=s;
 vm.createContext(s);vm.runInContext(depthSource.replace('__ENVIRONMENT_VOLUME_ASSETS__','{}').replace('__ENVIRONMENT_VOLUME_MANIFEST__',JSON.stringify(manifest)),s);vm.runInContext(atmosphereSource,s);s.calls=calls;s.depth=s.EnvironmentDepthV1;s.light=s.EnvironmentAtmosphereV1;return s;
}
const state=s=>JSON.stringify({G:s.G,current:{...s.current,blocked:[...s.current.blocked]},coop:s.C3.coop});
let passed=0;
function test(name,fn){fn();passed++;console.log('OK · '+name)}
test('all authored interiors expose neutral lighting while keeping their surface recipes',()=>{
 const s=fixture();for(const id of [...Object.keys(s.depth.profiles),'cloud_sea','endless_echo']){const p=s.depth.lightingProfile(id);assert.equal(p.ambient,1,id);assert.equal(p.lights.length,0,id);assert.equal(s.light.profile(id).ambient,1);assert.equal(s.light.profile(id).lights.length,0)}
 assert.equal(Object.keys(s.depth.profiles).length,13);assert.equal(s.depth.profile('contratempo').style,'club');
});
test('chapter-three facades receive a wider side and raised foundation at the original base',()=>{
 const s=fixture('distortion_district');for(const type of ['c3_house','c3_club','c3_workshop','c3_machine']){const p={type,x:10,y:12},b=s.depth.facade(p);assert(b.depth>=18&&b.depth<=32);assert.equal(b.foundation,8);assert.equal(b.bottom,12.65*24);const before=state(s);s.depth.drawVolume(b,0,0);assert.equal(state(s),before);assert(s.calls.some(c=>c.kind==='lineTo'&&c.args[0]>b.x+b.w));}
});
test('chapter-three side and roof sample approved rust materials in a clipped tilted plane',()=>{
 const s=fixture('distortion_district'),b=s.depth.facade({type:'c3_house',x:10,y:12});const materials=[];s.CenariosV2.material=(name,...args)=>{materials.push({name,args});return true};const before=state(s);s.depth.drawVolume(b,0,0);assert(materials.some(v=>v.name==='paineis_parede'));assert(materials.some(v=>v.name==='metal_industrial'));assert(materials.length<40);assert(s.calls.some(c=>c.kind==='clip'));assert(s.calls.some(c=>c.kind==='transform'&&c.args[1]<0));assert.equal(state(s),before);assert.equal(s.ctx.depth(),0);
});
test('the added C3 side fades behind P1/P2 without applying a second fade to its facade',()=>{
 const s=fixture('distortion_district'),p={type:'c3_house',x:10,y:12},b=s.depth.facade(p);s.G.x=(b.x+b.w+b.depth*.5)/24;s.G.y=(b.bottom-25)/24;assert.equal(s.depth.occlusionAlpha(p,b),1);assert.equal(s.depth.volumeAlpha(b),.48);s.G.x=1;assert.equal(s.depth.volumeAlpha(b),1);s.C3.coopActive=()=>true;s.C3.coop={x:(b.x+b.w+b.depth*.5)/24,y:(b.bottom-25)/24};assert.equal(s.depth.volumeAlpha(b),.48);
});
test('furniture and industry get physical footprints while rugs and wall graphics stay flat',()=>{
 const s=fixture('power_plant');for(const type of ['table','chair','bed','kitchen','shelf','tools','c3_machine','c3_bench','c3_crates','c3_bar','c3_workbench','voiceWorkbench','radioConsole']){const b=s.depth.body({type,x:8,y:9});assert(b&&b.w>0&&b.d>0&&b.h>0,type);assert.equal(b.y,9.65*24)}
 for(const p of [{type:'c3_machine',flat:true},{type:'env2_prop',item:'tapete_palco',w:100,h:40},{type:'env2_prop',item:'acoustic_wallpanel',w:74,h:70},{type:'env2_prop',item:'crossing_horizontal',w:72,h:48}])assert.equal(s.depth.body({x:8,y:9,...p}),null);
});
test('studio sofa and potted plant use their actual floor pivot, not their old top position',()=>{
 const s=fixture();const sofa=s.depth.body({type:'sofa',x:2,y:6,worldGroundY:12}),plant=s.depth.body({type:'plant',x:20,y:6});assert.equal(sofa.x,3.5*24);assert.equal(sofa.y,12*24);assert.equal(plant.y,7*24);assert.equal(s.depth.sortY({type:'sofa',x:2,y:6,worldGroundY:12}),12);
});
test('new prop bases remain under the unchanged sprite and restore canvas state',()=>{
 const s=fixture('power_plant'),p={type:'c3_machine',x:8,y:9},before=state(s);s.ctx.globalAlpha=.7;s.ctx.fillStyle='#abc';assert.equal(s.drawProp(p,0,0),'prop');assert.equal(s.oldProps,1);assert(s.calls.some(c=>c.kind==='fill'));assert.equal(s.ctx.globalAlpha,.7);assert.equal(s.ctx.fillStyle,'#abc');assert.equal(s.ctx.depth(),0);assert.equal(state(s),before);
});
test('contact shadows remain short and centred under the actual ground pivot',()=>{
 const s=fixture();s.G.formation=['franco'];s.light.drawContacts();const points=s.calls.filter(c=>c.kind==='moveTo'||c.kind==='lineTo').map(c=>c.args),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);assert.equal(s.calls.filter(c=>c.kind==='fill').length,1);assert(Math.max(...xs)-Math.min(...xs)<=14);assert(Math.max(...ys)-Math.min(...ys)<=4);assert(Math.abs((Math.max(...xs)+Math.min(...xs))/2-s.G.x*24)<=1);assert(Math.abs((Math.max(...ys)+Math.min(...ys))/2-(s.G.y*24+1))<=1);assert(s.calls.filter(c=>c.kind==='fill').every(c=>c.composite==='source-over'&&c.alpha<=.16));
});
test('props, live NPCs and both player bodies retain only discreet ground contact',()=>{
 const s=fixture();s.current.props=[{type:'table',x:12,y:6},{type:'c3_crates',x:20,y:7}];s.current.npcs=[{id:'c3_npc',x:10,y:8}];s.C3.coopActive=()=>true;const bodies=s.light.shadowBodies();assert(bodies.some(b=>b.kind==='actor'&&b.x===s.G.x*24));assert(bodies.some(b=>b.kind==='actor'&&b.x===s.C3.coop.x*24));assert(bodies.some(b=>b.kind==='actor'&&b.x===10*24));assert(bodies.some(b=>b.kind==='legs'));const before=state(s);s.light.drawGround();assert(s.calls.some(c=>c.kind==='fill'));assert(s.calls.filter(c=>c.kind==='fill').every(c=>c.composite==='source-over'&&c.alpha<=.16));assert(!s.calls.some(c=>/Gradient|drawImage|fillRect/.test(c.kind)));assert.equal(state(s),before);
});
test('moving an NPC changes its physical shadow pivot, and falling actors do not cast on the void',()=>{
 const s=fixture();s.G.formation=['franco'];const n={id:'c3_local',x:10,y:8};s.current.npcs=[n];let b=s.light.shadowBodies().find(b=>b.x===240&&b.kind==='actor');assert(b);n.x=11;b=s.light.shadowBodies().find(b=>b.x===264&&b.kind==='actor');assert(b);s.CloudWorldV1.fall={body:s.G};assert(!s.light.shadowBodies().some(b=>b.x===s.G.x*24&&b.y===s.G.y*24));
});
test('disconnecting a falling P2 cannot restore a ground shadow through its new follower object',()=>{
 const s=fixture('cloud_sea');s.G.formation=['franco','ryuchi','synth'];s.C3.coop={x:15,y:12};s.C3.coopActive=()=>false;s.CloudWorldV1.fall={body:s.C3.coop,hero:'ryuchi',coop:true};let requests=0;s.getFollower=index=>{requests++;return index===0?{x:15,y:12}:{x:11,y:11}};const bodies=s.light.shadowBodies();assert(!bodies.some(b=>b.x===15*24&&b.y===12*24));assert(bodies.some(b=>b.x===11*24&&b.y===11*24));assert.equal(bodies.length,2);assert.equal(requests,1);
});
test('the lighting compatibility hook paints nothing even when lamp props and old profiles exist',()=>{
 const s=fixture();s.current.props=Array.from({length:100},(_,i)=>({type:'c3_lamp',x:i,y:3}));s.G.c3.smallLight=true;s.depth.lightingProfile=()=>{throw Error('obsolete light profile must not be sampled')};s.document.createElement=()=>{throw Error('a lighting mask must never be allocated')};const before=state(s);s.light.drawLighting();assert.equal(s.calls.length,0);assert.equal(s.light.profile().ambient,1);assert.equal(s.light.profile().lights.length,0);s.light.drawGround();assert(!s.calls.some(c=>c.kind==='drawImage'||c.kind.includes('Gradient')||c.composite==='screen'||c.composite==='multiply'));assert.equal(state(s),before);
});
test('facades retain a tight contact band without a long directional ground shadow',()=>{
 const s=fixture('distortion_district'),p={type:'c3_house',x:10,y:12},b=s.depth.facade(p);s.current.props=[p];s.depth.drawGround();assert.equal(s.calls.filter(c=>c.kind==='fill').length,1);const ys=s.calls.filter(c=>c.kind==='moveTo'||c.kind==='lineTo').map(c=>c.args[1]);assert(Math.max(...ys)-Math.min(...ys)<=5);assert(Math.min(...ys)>=Math.round(b.bottom)-2);assert(Math.max(...ys)<=Math.round(b.bottom)+4);
});
test('off-screen geometry and mobile contact work remain bounded',()=>{
 const s=fixture('power_plant');s.Input121.mobile=true;s.current.props=Array.from({length:200},(_,i)=>({type:'c3_machine',x:8+i%8,y:8+i%4}));s.current.npcs=Array.from({length:200},()=>({x:10,y:10}));assert(s.light.shadowBodies().length<=48);s.current.props=[{type:'c3_machine',x:1000,y:1000}];assert.equal(s.depth.shadowBodies().length,0);s.light.drawGround();assert(s.calls.filter(c=>c.kind==='fill').length<=48);assert(!s.calls.some(c=>c.kind==='drawImage'||c.kind.includes('Gradient')||c.composite==='screen'));
});
test('reduced motion keeps contact and dust static, and menus freeze the cosmetic clock',()=>{
 const s=fixture('distortion_district');s.G.options10.reducedMotion=true;s.light.drawGround();const first=JSON.stringify(s.calls);s.calls.length=0;s.light.clock=100;s.light.drawGround();assert.equal(JSON.stringify(s.calls),first);s.mode='overlay';s.light.step(.1);assert.equal(s.light.clock,0);
});
test('disabled layers draw no extra world pixels or bases and delegate original callbacks once',()=>{
 const s=fixture();s.depth.enabled=s.light.enabled=false;s.calls.length=0;assert.equal(s.drawProp({type:'table',x:8,y:9},0,0),'prop');s.light.drawGround();s.light.drawLighting();assert.equal(s.calls.length,0);assert.equal(s.oldProps,1);assert.equal(s.update(.05),'update');assert.equal(s.updates,1);
});
test('render failure restores contact alpha and composition without changing progress',()=>{
 const s=fixture(),before=state(s);s.ctx.globalAlpha=.75;s.ctx.globalCompositeOperation='multiply';s.ctx.fill=()=>{throw Error('canvas failure')};assert.throws(()=>s.light.drawContacts(),/canvas failure/);assert.equal(s.ctx.globalAlpha,.75);assert.equal(s.ctx.globalCompositeOperation,'multiply');assert.equal(s.ctx.depth(),0);assert.equal(state(s),before);
});
console.log(JSON.stringify({suite:'review111-world',passed,layer:'Node/VM production render contracts; no pixel/browser/FPS acceptance'}));
