/* Node/VM checks of the actual NPC module. Does not certify art or gameplay. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../game/source/chapter-03/npc_life_v1.js'),'utf8');
const checks=[];
const image=name=>({name,complete:true,naturalWidth:768});
const env={console,Math,Map,Set,Number,Object,TypeError,T:24,mode:'walk',battle:null,
 G:null,current:null,areas:{},Input121:{focused:true},document:{hidden:false},tick:0,
 sheets:[],fallback:[],pixels:[],characters:[],depth:0,coopEnabled:false,
 update(){},setArea(id){env.G.area=id;env.current=env.areas[id]},buildMaps(){},
 c3NpcPose(){return {dir:'down',frame:0}},
 drawDetailedNPC(...args){env.fallback.push(args)},
 tileWalkable(a,x,y){const xx=Math.floor(x),yy=Math.floor(y);return xx>0&&yy>0&&xx<a.w-1&&yy<a.h-1&&!a.blocked.has(xx+','+yy)},
 NPC092:image('npc092'),character092(...args){env.characters.push(args)},
 c3SheetSprite(im,...args){if(!im?.complete||!im.naturalWidth)return false;env.sheets.push({name:im.name,args});return true},
 C3:{images:{prebeta_collabs_move:image('collaborators'),prebeta_dney:image('dney'),sprite_resident_a:image('resident-a'),sprite_resident_b:image('resident-b'),sprite_canal_worker:image('worker'),sprite_plant_operator:image('operator')},coopActive(){return env.coopEnabled},coop:{x:2,y:2}},
 ctx:{save(){env.depth++},restore(){env.depth--},fillRect(...args){env.pixels.push([...args,this.fillStyle])},drawImage(...args){env.sheets.push({name:args[0].name,args:args.slice(1)})}}
};
vm.createContext(env);vm.runInContext(source+'\nglobalThis.life=NpcLifeV1;',env);const life=env.life;
const npc=(id,x=12.5,y=12.5,extra={})=>({id,x,y,name:id,say(){},...extra});
function map(id='test',npcs=[]){return {id,w:32,h:28,npcs,props:[],events:[],gates:[],blocked:new Set()}}
function world(a){life.reset();env.G={area:a.id,x:2,y:2,flags:{bass:false,quest:'preserved'},hp:{franco:40},potions:3,options10:{reducedMotion:false}};env.current=a;env.areas={[a.id]:a};env.mode='walk';env.battle=null;env.document.hidden=false;env.Input121.focused=true;env.coopEnabled=false;env.sheets=[];env.fallback=[];env.pixels=[];env.characters=[];life.tick(0)}
function advance(seconds){for(let t=0;t<seconds;t+=.05)env.update(.05)}
function check(name,fn){fn();checks.push(name);console.log('OK · '+name)}

check('Two NPCs have independent state, reach all local activities and never alter quest/inventory',()=>{
 const a=map('distortion_district',[npc('c3_resident'),npc('c3_resident_b',20.5,17.5)]);world(a);
 const before=JSON.stringify(env.G),refs=a.npcs.map(n=>({n,id:n.id,say:n.say,name:n.name,x:n.x,y:n.y})),seen=new Set();
 for(let i=0;i<2500;i++){env.update(.05);for(const n of a.npcs){const s=life.state(n);seen.add(s.state);assert(Math.hypot(n.x-s.homeX,n.y-s.homeY)<=life.roamRadius+.001)}}
 assert.equal(JSON.stringify(env.G),before);for(const r of refs){assert(a.npcs.includes(r.n));assert.equal(r.n.id,r.id);assert.equal(r.n.say,r.say);assert.equal(r.n.name,r.name)}
 for(const state of ['idle','look','work','gesture','wander','return'])assert(seen.has(state),state);
 assert.notEqual(life.state(a.npcs[0]),life.state(a.npcs[1]));
});
check('Local outing returns to the exact home without teleport or exceeding speed',()=>{
 const n=npc('c3_resident'),a=map('distortion_district',[n]);world(a);const s=life.state(n);life.enter(n,s,'wander');assert.equal(s.state,'wander');let previous={x:n.x,y:n.y},went=false,returned=false;
 for(let i=0;i<150;i++){env.update(.05);const d=Math.hypot(n.x-previous.x,n.y-previous.y);assert(d<=life.speed*.05+.00001);went||=Math.hypot(n.x-s.homeX,n.y-s.homeY)>.4;returned||=went&&s.state==='idle'&&Math.hypot(n.x-s.homeX,n.y-s.homeY)<.025;previous={x:n.x,y:n.y}}
 assert(went&&returned);
});
check('Every pause/dialogue/action/rhythm/title condition freezes positions and clocks',()=>{
 const n=npc('c3_resident'),a=map('distortion_district',[n]);world(a);const s=life.state(n);life.enter(n,s,'wander');advance(.4);
 for(const mode of ['overlay','dialogue','action','rhythm','title']){env.mode=mode;const before=JSON.stringify({s,x:n.x,y:n.y});advance(1);assert.equal(JSON.stringify({s,x:n.x,y:n.y}),before,mode)}
 env.mode='walk';env.battle={};const before=JSON.stringify(s);advance(1);assert.equal(JSON.stringify(s),before);env.battle=null;
 for(const toggle of [()=>{env.Input121.focused=false},()=>{env.Input121.focused=true;env.document.hidden=true}]){toggle();const old=JSON.stringify(s);advance(.5);assert.equal(JSON.stringify(s),old)}
});
check('Reduced motion never creates a local walk and does not move an existing outing',()=>{
 const n=npc('c3_resident'),a=map('distortion_district',[n]);world(a);env.G.options10.reducedMotion=true;life.enter(n,life.state(n),'wander');assert.notEqual(life.state(n).state,'wander');advance(20);assert.equal(n.x,12.5);assert.equal(n.y,12.5);
 env.G.options10.reducedMotion=false;life.enter(n,life.state(n),'wander');advance(.3);env.G.options10.reducedMotion=true;const p=[n.x,n.y];advance(2);assert.deepEqual([n.x,n.y],p);
});
check('Full body and substeps reject walls and furniture missing from tileWalkable',()=>{
 const n=npc('c3_resident',5.5,5.5),a=map('distortion_district',[n]);world(a);a.blocked.add('7,5');assert(!life.routeFree(a,n,{x:5.5,y:5.5},{x:9,y:5.5}));assert(!life.bodyFree(a,6.8,5.5));
 a.blocked.clear();a.props=[{type:'life091',kind:'tools',x:7,y:5}];assert(env.tileWalkable(a,7.5,5.5));assert(!life.pointFree(a,n,7.5,5.5));
 a.props=[{type:'life091',kind:'rug',x:7,y:5,flat:true}];assert(life.pointFree(a,n,7.5,5.5));
});
check('Doors, events and other actors cannot be occupied or crossed by an outing',()=>{
 const n=npc('c3_resident',5.5,5.5),other=npc('c3_resident_b',9.5,5.5),a=map('distortion_district',[n,other]);world(a);a.gates=[{x:7.5,y:5.5}];assert(!life.routeFree(a,n,n,{x:9.5,y:5.5}));
 a.gates=[];a.events=[{x:7.5,y:5.5}];assert(!life.pointFree(a,n,7.5,5.5));a.events=[];assert(!life.pointFree(a,n,9.5,5.5));env.G.x=7.5;env.G.y=5.5;assert(!life.pointFree(a,n,7.5,5.5));
});
check('P1/P2 proximity stops an NPC and faces the nearest player',()=>{
 const n=npc('c3_resident'),a=map('distortion_district',[n]);world(a);life.enter(n,life.state(n),'wander');env.coopEnabled=true;env.C3.coop={x:13.5,y:12.5};const p=[n.x,n.y];advance(1);assert.deepEqual([n.x,n.y],p);assert.equal(life.pose(n).state,'look');assert.equal(life.pose(n).dir,'right');assert.equal(life.pose(n).moving,false);
});
check('Belga in the tools table gets a safe nearby anchor; callbacks and events stay intact',()=>{
 const n=npc('bento',18,8,{spriteKey:'bento'}),a=map('bento_shop',[n]);a.props=[{type:'life091',kind:'tools',x:18,y:7},{type:'voiceBench',x:19,y:10}];a.events=[{id:'tools',x:18,y:8}];a.blocked.add('17,7');a.blocked.add('18,7');const say=n.say,events=JSON.stringify(a.events);world(a);
 assert(Math.hypot(n.x-18,n.y-8)>.5);assert(life.pointFree(a,n,n.x,n.y));assert(Math.hypot(n.x-18,n.y-8)<1.9);assert.equal(n.say,say);assert.equal(JSON.stringify(a.events),events);const home=[n.x,n.y];advance(30);assert.deepEqual([n.x,n.y],home);
 life.reset();assert.deepEqual([n.x,n.y],home);assert.equal(n.id,'bento');
});
check('Map/load reset restores owned positions, but respects a quest relocation',()=>{
 const n=npc('c3_ciro'),a=map('ciro_workshop',[n]);world(a);life.enter(n,life.state(n),'wander');advance(.4);assert(Math.hypot(n.x-12.5,n.y-12.5)>.01);const b=map('contratempo');env.areas.contratempo=b;env.setArea('contratempo');assert.equal(n.x,12.5);assert.equal(n.y,12.5);assert.equal(n.dir,undefined);
 world(a);life.enter(n,life.state(n),'wander');advance(.2);n.x=20;n.y=20;life.reset();assert.equal(n.x,20);assert.equal(n.y,20);
 world(a);const old=life.state(n);env.G={...env.G};env.update(0);assert.notEqual(life.state(n),old);
});
check('Belga repair survives a coop load with all original repair candidates occupied',()=>{
 const n=npc('bento',18,8,{spriteKey:'bento'}),a=map('bento_shop',[n]);a.props=[{type:'life091',kind:'tools',x:18,y:7}];a.blocked.add('17,7');a.blocked.add('18,7');world(a);
 // Recreate the legacy map/save while both players already stand at its front.
 life.reset();n.x=18;n.y=8;env.G={...env.G,x:17.5,y:9.2};env.coopEnabled=true;env.C3.coop={x:18.5,y:9.2};const players=[env.G.x,env.G.y,env.C3.coop.x,env.C3.coop.y];
 env.update(0);assert(life.bodyFree(a,n.x,n.y));assert(!a.props.some(p=>{const b=life.furnitureBounds(p);return b&&n.x>b.left&&n.x<b.right&&n.y>b.top&&n.y<b.bottom}));assert.equal(life.state(n).homeY,9.2);assert.deepEqual([env.G.x,env.G.y,env.C3.coop.x,env.C3.coop.y],players);
 env.G.x=2;env.G.y=2;env.C3.coop.x=3;env.C3.coop.y=3;advance(60);assert.equal(n.y,9.2);
});
check('Postgame reserve actors remain completely outside this module',()=>{
 const n=npc('reserve',12,12,{postReserve:true}),a=map('studio',[n]);world(a);const before=JSON.stringify(n);advance(20);env.drawDetailedNPC(n,40,50);assert.equal(JSON.stringify(n),before);assert.equal(life.states.has(n),false);assert.equal(env.fallback.at(-1)[0],n);assert.equal(life.pose(n),null);
});
check('C1 appearance hook receives acting state, blink, phase and frozen clocks without sliding',()=>{
 const n=npc('child'),a=map('city',[n]),poses=[];world(a);let ready=false;life.registerAppearance('city/child',{ready:()=>ready,walk:false,directional:false,render(actor,x,y,p){poses.push(p);return true}});
 env.drawDetailedNPC(n,30,40);assert.equal(poses.length,0);ready=true;life.enter(n,life.state(n),'gesture');advance(.4);env.drawDetailedNPC(n,30,40);assert.equal(poses.at(-1).state,'gesture');assert(poses.at(-1).gesturePhase>0&&poses.at(-1).gesturePhase<1);assert.equal(typeof poses.at(-1).blink,'boolean');
 env.mode='dialogue';const clock=life.pose(n).clock;advance(1);env.drawDetailedNPC(n,30,40);assert.equal(poses.at(-1).clock,clock);assert.equal(poses.at(-1).paused,true);env.mode='walk';advance(30);assert.equal(n.x,12.5);assert.equal(n.y,12.5);
});
check('Belga/Colli/Mazza and Dney select actual directional cells, neutral when standing',()=>{
 for(const [id,spriteKey,row]of [['bento','bento',0],['nilo','nilo',1],['c3_ciro',null,2]]){
  const n=npc(id,12.5,12.5,{spriteKey}),a=map('contratempo',[n]);world(a);life.state(n).dir='left';env.drawDetailedNPC(n,40,50);const d=env.sheets.at(-1);assert.equal(d.name,'collaborators');assert.equal(d.args[0],2);assert.equal(d.args[1],row);
 }
 const n=npc('c3_vega'),a=map('contratempo',[n]);world(a);const s=life.state(n);s.dir='right';env.drawDetailedNPC(n,40,50);assert.deepEqual(env.sheets.at(-1).args.slice(0,4),[3,0,4,3]);life.enter(n,s,'wander');advance(.6);assert(s.moving);assert(s.distance>0);env.drawDetailedNPC(n,40,50);assert.equal(env.sheets.at(-1).args[1],s.frame);
 env.mode='dialogue';const f=s.frame;advance(1);env.tick+=100;env.drawDetailedNPC(n,40,50);assert.equal(env.sheets.at(-1).args[1],f);
});
check('C2 character renderer is handled once even if its legacy helper returns undefined',()=>{
 const n=npc('iris',12.5,12.5,{spriteKey:'iris'}),a=map('radio9',[n]);world(a);life.state(n).dir='up';env.drawDetailedNPC(n,40,50);assert.equal(env.characters.length,1);assert.equal(env.characters[0][3],'up');assert.equal(env.characters[0][4],false);assert.equal(env.fallback.length,0);
});
check('Guards have directional/blink/arm poses without whole-body bob or rotation',()=>{
 const n=npc('voice_guard'),a=map('voices',[n]);world(a);const p=life.pose(n);env.pixels=[];life.drawGuard(n,80,90,{...p,dir:'down',blink:false});const down=JSON.stringify(env.pixels);env.pixels=[];life.drawGuard(n,80,90,{...p,dir:'up'});assert.notEqual(JSON.stringify(env.pixels),down);env.pixels=[];life.drawGuard(n,80,90,{...p,dir:'down',blink:true});assert.notEqual(JSON.stringify(env.pixels),down);env.pixels=[];life.drawGuard(n,80,90,{...p,dir:'down',state:'gesture',gesturePhase:.5});assert.notEqual(JSON.stringify(env.pixels),down);assert.equal(env.depth,0);advance(30);assert.equal(n.x,12.5);assert.equal(n.y,12.5);
});
check('Missing directional art disables walking and keeps the existing NPC fallback',()=>{
 const n=npc('c3_vega'),a=map('contratempo',[n]);world(a);const original=env.C3.images.prebeta_dney;env.C3.images.prebeta_dney={complete:false,naturalWidth:0};life.enter(n,life.state(n),'wander');assert.notEqual(life.state(n).state,'wander');env.drawDetailedNPC(n,20,30);assert.equal(env.fallback.at(-1)[0],n);env.C3.images.prebeta_dney=original;
});

console.log(JSON.stringify({passed:checks.length,checks,method:'Node VM: state, geometry and render selection; no browser/visual gameplay validation.'},null,2));
