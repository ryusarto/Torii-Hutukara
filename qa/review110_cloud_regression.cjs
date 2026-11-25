/* Focused regression for the1.10 review. No browser, generated build or personal save.
 * Executes real movement/path functions and the legacy actor-list draw section.
 * Drawing is a call trace: this does not certify pixels, animation perception or hardware.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const input=read('game/source/chapter-03/input_mobile_combat.js');
const base=read('game/source/base/TORII_HUTUKARA_1_1_2_TRILHAS.html');
const cloud=read('game/source/chapter-03/cloud_world_v1.js');
function between(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a+start.length);assert(a>=0&&b>a,'Runtime section not found: '+start);return text.slice(a,b);}
const nativeFeel=between(input,'const CombatFeel121=','function canBody121(');
const nativeMovement=between(input,'function canBody121(','const moveBodyBefore121=');
const nativeFollower=between(input,'const followerBefore121=getFollower;','function inputVector121(');
const legacyFollower=between(base,'function getFollower(i){','function nearestInteraction(');
const walkability=between(base,'function tileWalkable(','function moveG(');
const drawStart=' const behind=getFollower(0),third=getFollower(1);',drawEnd='drawable.sort((a,b)=>a.y-b.y);for(let d of drawable)d.draw();';
const legacyActorList=between(base,drawStart,drawEnd)+drawEnd;

function fixture(member='ryuchi'){
 const a={id:'cloud_sea',w:58,h:34,tiles:Array.from({length:34},()=>Array(58).fill('c3_sky')),blocked:new Set()};
 for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++)a.blocked.add(x+','+y);
 for(let y=24;y<=28;y++)for(let x=3;x<=17;x++){a.tiles[y][x]='c3_cloud';a.blocked.delete(x+','+y);}
 const calls=[],s={console,Math,Map,Set,Number,Object,Array,Image:class{},G:{area:'cloud_sea',active:'franco',x:8.5,y:26.5,dir:'down',flags:{},hp:{franco:100,ryuchi:100,alt:100},c3:{},options10:{}},current:a,areas:{cloud_sea:a},mode:'walk',T:24,VW:768,VH:432,cam:{x:0,y:0},routeCache:{key:''},lastStep:1,trail:[],attackHeld:false,connected:true,member,padAxes:[0,0],calls,defeats:0,Input121:{focused:true,wasCoop:true},PostGame:{canTravel(){return true}}};
 s.window=s;s.document={createElement:()=>({})};
 s.ctx={globalAlpha:1,save(){calls.push({kind:'save'})},restore(){calls.push({kind:'restore'})},beginPath(){},rect(){},clip(){},translate(){},scale(x,y){calls.push({kind:'scale',x,y})}};
 s.C3={coop:{x:17.5,y:26.5,dir:'right',dash:0,dashCD:0,recovery:0,stride:0,route:[],lastGood:{x:17.5,y:26.5},area:'cloud_sea',game:s.G,actor123:member},coopActive:()=>s.connected,coopMember:()=>s.member,padDirection:()=>s.padAxes,padPressed:()=>false,cloudPath(){},cloudPlatform(){},applyWorld(){},cycleCoop(){}};
 s.partyMembers=()=>['franco','ryuchi','alt'];s.activeModes10=()=>['walk','action'].includes(s.mode);
 s.drawActor=(p,x,y,moving)=>calls.push({kind:'actor',hero:p.style,x,y,moving});s.drawTile=()=>{};
 s.CenariosV2={cloud(){return true}};s.emitMusic=s.toast=s.resetMotion10=()=>{};
 s.moveBody10=s.moveActor121=()=>false;s.update=()=>{};s.buildMaps=s.init=()=>{};
 s.setArea=(id,x,y)=>{s.G.area=id;s.G.x=x;s.G.y=y;s.current=s.areas[id]||a;s.mode='walk';};
 s.restoreCheckpoint=()=>{s.G.x=8.5;s.G.y=26.5;s.mode='walk';};s.save=()=>{};s.exportSave=s.openParty=()=>{};
 s.showDefeat=()=>{s.defeats++;s.mode='overlay';};
 vm.createContext(s);
 vm.runInContext(walkability+legacyFollower+'\nconst C3_gamepadFollowerBase=getFollower;\n'+nativeFeel+nativeMovement+nativeFollower+'\nfunction drawEnv(){const drawable=[];'+legacyActorList+'}\n',s);
 vm.runInContext(cloud.replace('__CLOUD_WORLD_ASSETS__','{}').replace('__CLOUD_WORLD_MANIFEST__','{}')+'\ninit();',s);
 s.world=s.CloudWorldV1;s.world.sync();return s;
}
function enterFall(s){s.padAxes=[1,0];for(let i=0;i<20&&!s.world.fall;i++)s.C3.coopMove({},1/60);s.padAxes=[0,0];assert(s.world.fall?.coop,'Actual P2 movement must enter a cloud fall');assert.equal(s.world.fall.hero,s.member);s.update(.3);}
function assertCapturedOnce(s){s.calls.length=0;s.drawEnv();const f=s.world.fall,actors=s.calls.filter(c=>c.kind==='actor'&&c.hero===f.hero);assert.equal(actors.length,1,'Captured hero must have one representation: '+JSON.stringify(actors));assert(Math.abs(actors[0].x-(f.body.x*s.T-s.cam.x))<=1&&Math.abs(actors[0].y-(f.body.y*s.T-s.cam.y))<=1,'Captured hero must stay at the falling position: '+JSON.stringify(actors));return actors[0];}
const results=[];
function test(name,fn){try{fn();results.push({name,passed:true});console.log('OK · '+name)}catch(error){results.push({name,passed:false,error:error.message});console.error('FAIL · '+name+' · '+error.message);}}

for(const member of ['ryuchi','alt']){
 test('Connected P2 occupies one falling representation in follower slot '+member,()=>{const s=fixture(member);enterFall(s);assertCapturedOnce(s);});
 for(const fx of [true,false])test('Disconnecting P2 does not clone or relocate '+member+' with FX '+fx,()=>{const s=fixture(member);enterFall(s);s.connected=false;s.world.enabled=fx;assertCapturedOnce(s);});
 test('Reconnecting P2 keeps the captured fall, then the party restarts at the start of the clouds '+member,()=>{const s=fixture(member);enterFall(s);const captured=s.world.fall;s.connected=false;s.drawEnv();s.connected=true;assertCapturedOnce(s);assert.equal(s.world.fall,captured);s.member=member==='ryuchi'?'alt':'ryuchi';for(let i=0;i<20;i++)s.update(.05);assert.equal(s.G.hp[member],100);assert.equal(s.G.hp.franco,100);assert.equal(s.G.hp[s.member],100);assert.equal(s.defeats,0);assert.equal(s.world.fall,null);assert.deepEqual({x:s.G.x,y:s.G.y},{x:5.5,y:26.5});});
}
for(const axes of [[0,0],[-1,0]])test('Autopull recovers an overhanging P2 with '+(axes[0]?'return input':'neutral input'),()=>{
 const s=fixture();Object.assign(s.C3.coop,{x:17.95,y:26.5,lastGood:{x:17.65,y:26.5}});assert(s.tileWalkable(s.current,s.C3.coop.x,s.C3.coop.y));assert(!s.canBody121(s.C3.coop.x,s.C3.coop.y));
 const before=Math.hypot(s.G.x-s.C3.coop.x,s.G.y-s.C3.coop.y);assert(Math.abs(before-9.45)<1e-9);s.moveBody10(-1,0,.1);assert(Math.abs(Math.hypot(s.G.x-s.C3.coop.x,s.G.y-s.C3.coop.y)-9.55)<1e-9);
 s.padAxes=axes;for(let i=0;i<120;i++)s.C3.coopMove({},1/60);
 assert(!s.world.fall,'Return autopull must not push P2 into the void');assert(s.canBody121(s.C3.coop.x,s.C3.coop.y),'P2 must recover full body support instead of remaining frozen at the edge');assert(Math.hypot(s.G.x-s.C3.coop.x,s.G.y-s.C3.coop.y)<before-.1,'P2 must make actual return progress');
});
test('Voluntary P2 movement still falls when autopull is not active',()=>{const s=fixture();s.G.x=15.5;enterFall(s);assert(s.world.fall.coop);});

const failed=results.filter(r=>!r.passed).length;console.log(JSON.stringify({passed:results.length-failed,failed,results,method:'Node VM; real input/path/collision functions, CloudWorld module and legacy actor-list section. Render call tracing only, no browser or pixel/playtest claims.'},null,2));if(failed)process.exitCode=1;
