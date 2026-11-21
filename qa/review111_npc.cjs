/* Independent 1.11 regression. Real story relocation, NPC life and render functions
 * run in Node VM with small maps. Draw calls/pixel hashes do not certify visual
 * quality, animation perception or gameplay. No generated build/personal save.
 * --baseline-colli=<git-ref> reads only the old world/relocation functions for A/B.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),zlib=require('node:zlib'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const baseline=process.argv.find(a=>a.startsWith('--baseline-colli='))?.split('=')[1];
const production=p=>baseline?cp.execFileSync('/usr/bin/git',['show',baseline+':'+p],{cwd:root,encoding:'utf8'}):read(p);
function between(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a+start.length);assert(a>=0&&b>a,'Missing real section '+start);return text.slice(a,b);}
const runtime=production('game/source/chapter-03/chapter3_runtime.js'),pacing=production('game/source/chapter-03/pacing.js');
const applyWorld=between(runtime,'C3.applyWorld=function(){','\n');
const relocation=between(pacing,'const fluteAtClub=','if(typeof C3!==\'undefined\'&&typeof C3.objective');
const freeSpot=between(pacing,'function freeSpot(','function place(');
const sheetSprite=between(read('game/source/chapter-03/chapter3_runtime.js'),'function c3SheetSprite(','\n');
const lifeSource=read('game/source/chapter-03/npc_life_v1.js');
const gestureSource=read('game/source/chapter-03/npc_gestures_v1.js').replace('__NPC_GESTURES_URI__','"c1-test"').replace('__NPC_C3_GESTURES_URI__','"c3-test"');
const ids=['c3_resident','c3_resident_b','c3_canal_worker','c3_plant_operator'];
const imageKeys=['sprite_resident_a','sprite_resident_b','sprite_canal_worker','sprite_plant_operator'];
const manifest=JSON.parse(read('assets/npcs/vida-v2/manifest.json'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function pngInfo(file){const b=fs.readFileSync(path.join(root,file));assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return {b,width:b.readUInt32BE(16),height:b.readUInt32BE(20)};}
function map(id,npcs=[]){return {id,w:36,h:30,npcs,events:[],props:[],gates:[],blocked:new Set()};}
function fixture(){
 const draws=[],s={console,Math,Map,Set,Number,Object,TypeError,Image:class{constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024;}},T:24,mode:'walk',battle:null,G:null,current:null,areas:{},document:{hidden:false},Input121:{focused:true},routeCache:{key:''},draws,counters:{flute:0,nara:0,scene:0},coopEnabled:false};
 s.window=s;
 s.ctx={save(){},restore(){},drawImage(...args){draws.push(args)},fillRect(){}};
 s.tileWalkable=(a,x,y)=>x>1&&y>1&&x<a.w-1&&y<a.h-1&&!a.blocked.has(Math.floor(x)+','+Math.floor(y));
 s.update=()=>{};s.buildMaps=()=>{};s.drawDetailedNPC=()=>{draws.push(['legacy'])};s.c3NpcPose=()=>({dir:'down',frame:0});
 s.setArea=(id)=>{s.G.area=id;s.current=s.areas[id];};
 s.npc=(a,id,x,y,name,say,style)=>{const n={id,x,y,name,say,style};a.npcs.push(n);return n};s.fill=s.unsolid=()=>{};
 const ready=(name,w=768,h=420)=>({name,complete:true,naturalWidth:w,naturalHeight:h});
 s.C3={images:{prebeta_collabs_move:ready('collaborators'),prebeta_dney:ready('dney')},nara(){s.counters.nara++},scene(){s.counters.scene++},getFlute(){s.counters.flute++},coopActive:()=>s.coopEnabled,coop:{x:2,y:2}};
 for(let i=0;i<ids.length;i++){const p=pngInfo(manifest.rows[i].reference);s.C3.images[imageKeys[i]]=ready(ids[i],p.width,p.height);}
 vm.createContext(s);vm.runInContext(sheetSprite+'\n'+applyWorld+'\n'+freeSpot+'\n'+relocation+'\n'+lifeSource+'\n'+gestureSource+'\nglobalThis.api={life:NpcLifeV1,gestures:C3AmbientGesturesV2,relocate:relocateFluteKeepers};',s);
 world(s,{});return s;
}
function world(s,flags,area='ciro_workshop'){
 s.api.life.reset();s.areas={ciro_workshop:map('ciro_workshop'),contratempo:map('contratempo'),sky_canal:map('sky_canal'),distortion_district:map('distortion_district')};
 s.npc(s.areas.ciro_workshop,'c3_ciro',7,13,'Mazza',()=>s.C3.scene('C3_004'),'citizen');
 s.npc(s.areas.ciro_workshop,'c3_nara',18,12,'Colli',()=>s.C3.nara(),'citizen');
 s.npc(s.areas.sky_canal,'c3_nara_canal',30,17,'Colli canal',()=>s.C3.scene('C3_008'),'citizen');
 s.G={area,x:2,y:2,c3:{usinaDone:false,canalDone:false,windFlute:false,...flags},flags:{quest:'unchanged'},options10:{reducedMotion:false}};s.current=s.areas[area];s.mode='walk';s.battle=null;s.Input121.focused=true;s.document.hidden=false;
}
function refresh(s,count=1){for(let i=0;i<count;i++){s.C3.applyWorld();s.api.relocate();s.api.life.tick(0);}}
function count(s,id){return Object.values(s.areas).flatMap(a=>a.npcs).filter(n=>n.id===id).length;}
function keeper(s,id,area){const list=s.areas[area].npcs.filter(n=>n.id===id);assert.equal(list.length,1,id+' unique in '+area);assert.equal(count(s,id),1,id+' unique across maps');return list[0];}
function act(s,id='c3_resident'){
 const n={id,x:12.5,y:12.5,name:id,say(){}};s.api.life.reset();s.G.area='distortion_district';s.current=s.areas.distortion_district;s.current.npcs=[n];s.api.life.tick(0);return {n,life:s.api.life,state:s.api.life.state(n)};
}
function advance(s,seconds){for(let i=0;i<Math.ceil(seconds/.05);i++)s.update(.05);}
function draw(s,n){s.draws.length=0;s.drawDetailedNPC(n,80,100);assert.equal(s.draws.length,1,'one actor draw');return s.draws[0];}
const results=[];function test(name,fn){try{fn();results.push({name,passed:true});console.log('OK · '+name)}catch(e){results.push({name,passed:false,error:e.message});console.error('FAIL · '+name+' · '+e.message);}}

test('10 world/relocation passes retain one canonical Colli and Mazza at club, with one talk dispatch',()=>{
 const s=fixture();world(s,{usinaDone:true,canalDone:true},'contratempo');refresh(s);
 const refs=['c3_nara','c3_ciro'].map(id=>keeper(s,id,'contratempo'));const state=s.api.life.state(refs[0]);state.clock=3.75;const game=JSON.stringify(s.G);refresh(s,10);
 refs.forEach(n=>assert.equal(keeper(s,n.id,'contratempo'),n));assert.equal(s.api.life.state(refs[0]),state);assert.equal(state.clock,3.75);assert.equal(JSON.stringify(s.G),game);assert.equal(count(s,'c3_nara_canal'),0);
 for(const n of refs){const before=s.counters.flute;n.say();assert.equal(s.counters.flute,before+1);}assert.equal(s.api.life.states.size,2);
});
test('Legacy duplicate objects in both areas converge on the club reference after repeated refresh',()=>{
 const s=fixture();world(s,{usinaDone:true,canalDone:true},'contratempo');
 const chosen={};for(const id of ['c3_nara','c3_ciro']){const home=s.areas.ciro_workshop.npcs.find(n=>n.id===id);s.areas.ciro_workshop.npcs.push({...home});chosen[id]={...home,x:10,y:id==='c3_nara'?11:15,marker:id};s.areas.contratempo.npcs.push(chosen[id],{...home});}
 refresh(s,10);for(const id of Object.keys(chosen))assert.equal(keeper(s,id,'contratempo'),chosen[id]);assert.equal(s.api.life.states.size,2);
});
test('After flute, NPCs stay during club conversation then return home once, with correct workshop callbacks',()=>{
 const s=fixture();world(s,{usinaDone:true,canalDone:true},'contratempo');refresh(s);const refs=['c3_nara','c3_ciro'].map(id=>keeper(s,id,'contratempo'));
 s.G.c3.windFlute=true;refresh(s,10);refs.forEach(n=>assert.equal(keeper(s,n.id,'contratempo'),n));
 s.setArea('ciro_workshop');refresh(s);refs.forEach(n=>assert.equal(keeper(s,n.id,'ciro_workshop'),n));const state=s.api.life.state(refs[0]);state.clock=6;refresh(s,10);assert.equal(s.api.life.state(refs[0]),state);assert.equal(state.clock,6);
 assert.equal(refs[0].x,18);assert.equal(refs[0].y,12);assert.equal(refs[1].x,7);assert.equal(refs[1].y,13);refs[0].say();refs[1].say();assert.equal(s.counters.nara,1);assert.equal(s.counters.scene,1);assert.equal(s.counters.flute,0);
});
for(const first of ['canal','usina'])test('Both route orders keep the right Colli placement: '+first+' first',()=>{
 const s=fixture();world(s,{[first==='canal'?'canalDone':'usinaDone']:true});refresh(s,10);
 if(first==='canal'){keeper(s,'c3_nara','ciro_workshop');assert.equal(count(s,'c3_nara_canal'),0);}else{assert.equal(count(s,'c3_nara'),0);assert.equal(count(s,'c3_nara_canal'),1);}
 s.G.c3.canalDone=s.G.c3.usinaDone=true;s.setArea('contratempo');refresh(s,10);keeper(s,'c3_nara','contratempo');keeper(s,'c3_ciro','contratempo');assert.equal(count(s,'c3_nara_canal'),0);
});
for(const windFlute of [false,true])test('Fresh map reconstruction restores saved flute state '+windFlute+' without cloning',()=>{
 const s=fixture(),flags={usinaDone:true,canalDone:true,windFlute};world(s,flags,windFlute?'ciro_workshop':'contratempo');refresh(s,10);const old=keeper(s,'c3_nara',s.G.area);
 const save=JSON.parse(JSON.stringify(s.G));world(s,save.c3,save.area);refresh(s,10);const now=keeper(s,'c3_nara',save.area);assert.notEqual(now,old);assert(!s.api.life.states.has(old));assert.equal(JSON.stringify(s.G.c3),JSON.stringify(flags));now.say();assert.equal(windFlute?s.counters.nara:s.counters.flute,1);
});

test('Four ambient registrations permit real walking while frontal gesture art is loaded',()=>{
 const s=fixture();for(const id of ids){const {n,life,state}=act(s,id);assert(life.capabilities(n).walk);assert(life.capabilities(n).directional);life.enter(n,state,'wander');assert.equal(state.state,'wander');advance(s,.4);assert(state.moving);assert(Math.hypot(n.x-state.homeX,n.y-state.homeY)>.1);const d=draw(s,n);assert.equal(d[0],s.C3.images[life.ambientImage(n)],'walking retains legacy directional art');}
});
test('Six frontal gesture cells render once per actor and never replace directional poses',()=>{
 const s=fixture();ids.forEach((id,row)=>{const {n,life,state}=act(s,id);life.enter(n,state,'gesture');state.dir='down';state.seed=0;const cells=new Set();
  for(let frame=0;frame<6;frame++){state.age=state.duration*(frame+.1)/6;state.clock=0;const d=draw(s,n);assert.equal(d[0],s.api.gestures.image);assert.equal(d[1],frame*256);assert.equal(d[2],row*256);cells.add(d[1]);}assert.equal(cells.size,6);
  for(const dir of ['left','up','right']){state.dir=dir;const d=draw(s,n);assert.equal(d[0],s.C3.images[life.ambientImage(n)]);}
 });
});
for(const condition of ['overlay','dialogue','focus','hidden'])test('Pause '+condition+' freezes walking cell, gesture phase and clocks without render pops',()=>{
 const s=fixture(),{n,life,state}=act(s);life.enter(n,state,'wander');advance(s,.6);assert(state.moving);const before=draw(s,n).slice(1),snapshot=JSON.stringify(state),xy=[n.x,n.y];
 const pause=()=>{if(condition==='focus')s.Input121.focused=false;else if(condition==='hidden')s.document.hidden=true;else s.mode=condition;};
 const resume=()=>{s.mode='walk';s.Input121.focused=true;s.document.hidden=false;};
 pause();advance(s,1);assert.equal(JSON.stringify(state),snapshot);assert.deepEqual([n.x,n.y],xy);assert.deepEqual(draw(s,n).slice(1),before);assert(life.pose(n).paused);assert(life.pose(n).walking);assert(!life.pose(n).moving);
 resume();life.enter(n,state,'gesture');advance(s,.45);state.dir='down';state.seed=0;const gestureBefore=draw(s,n).slice(1),clock=state.clock,age=state.age;pause();advance(s,1);assert.equal(state.clock,clock);assert.equal(state.age,age);assert.deepEqual(draw(s,n).slice(1),gestureBefore);resume();advance(s,.05);assert(state.clock>clock);
});
test('Failed authored atlas keeps directional fallback, natural aspect ratio and no duplicate drawing',()=>{
 const s=fixture();s.api.gestures.ready();s.api.gestures.image.complete=false;
 for(const id of ids){const {n,life,state}=act(s,id);state.dir='down';const d=draw(s,n),im=s.C3.images[life.ambientImage(n)];assert.equal(d[0],im);assert.equal(d[7],Math.round(82*(im.naturalWidth/8)/im.naturalHeight));assert.equal(d[8],82);assert(life.capabilities(n).walk);}
});
test('Loaded frontal atlas cannot enable walking before its directional source is ready',()=>{
 const s=fixture();s.api.gestures.ready();
 for(const id of ids){const {n,life,state}=act(s,id),im=s.C3.images[life.ambientImage(n)];im.complete=false;assert.equal(life.capabilities(n).walk,false);life.enter(n,state,'wander');assert.notEqual(state.state,'wander');const xy=[n.x,n.y];advance(s,1);assert.deepEqual([n.x,n.y],xy);assert.equal(draw(s,n)[0],'legacy');im.complete=true;}
});
test('PostReserve NPCs still bypass the acting/gesture layer',()=>{const s=fixture(),{n,life}=act(s);n.postReserve=true;life.tick(0);assert(!life.states.has(n));assert.equal(draw(s,n)[0],'legacy');});

// Decode the packed RGBA PNG to prove actual cells, not just manifest claims.
function rgba(png){const b=png.b;assert.equal(b[24],8);assert.equal(b[25],6);assert.equal(b[28],0);const data=[];for(let o=8;o<b.length;){const size=b.readUInt32BE(o),kind=b.toString('ascii',o+4,o+8);if(kind==='IDAT')data.push(b.subarray(o+8,o+8+size));o+=12+size;}const raw=zlib.inflateSync(Buffer.concat(data)),stride=png.width*4,out=Buffer.alloc(stride*png.height);assert.equal(raw.length,(stride+1)*png.height);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<png.height;y++){const f=raw[y*(stride+1)];assert(f<=4);for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=4?out[i-4]:0,b=y?out[i-stride]:0,c=y&&x>=4?out[i-stride-4]:0,v=raw[y*(stride+1)+1+x];out[i]=(v+(f===0?0:f===1?a:f===2?b:f===3?Math.floor((a+b)/2):paeth(a,b,c)))&255;}}return out;}
test('Packed atlas has four rows of six distinct actual pixel cells matching manifest and sources',()=>{
 const png=pngInfo('assets/npcs/vida-v2/'+manifest.file);assert.equal(hash(png.b),manifest.sha256);assert.equal(hash(fs.readFileSync(path.join(root,'assets/npcs/vida-v2/'+manifest.source))),manifest.sourceSha256);assert.deepEqual([png.width,png.height],manifest.size);assert.equal(png.width,1536);assert.equal(png.height,1024);const pixels=rgba(png);
 ids.forEach((id,row)=>{const m=manifest.rows[row];assert.equal(m.id,id);assert.equal(m.row,row);assert.deepEqual(m.cell,[256,256]);assert.deepEqual(m.anchor,[128,256]);const hashes=[];for(let f=0;f<6;f++){const cell=Buffer.alloc(256*256*4);for(let y=0;y<256;y++)pixels.copy(cell,y*256*4,((row*256+y)*png.width+f*256)*4,((row*256+y)*png.width+(f+1)*256)*4);hashes.push(hash(cell));}assert.equal(new Set(hashes).size,6);assert.deepEqual(hashes,m.frameSha256);});
});
const failed=results.filter(r=>!r.passed).length;console.log(JSON.stringify({passed:results.length-failed,failed,baselineColli:baseline||null,method:'Node VM executes real story relocation, NPC life, gesture and sheet renderer functions on minimal map/image fixtures; PNG pixels decoded and hashed. No browser/build/visual perception validation.',results},null,2));if(failed)process.exitCode=1;
