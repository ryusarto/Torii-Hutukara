/* Legacy entry point; tests the current builder-selected locomotion contract.
 * Real animation hooks in a VM at30/60/120Hz. Not a perception/FPS benchmark. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const builder=read('game/source/chapter-03/build_alpha.rb');
const assetParts=builder.match(/^LOCOMOTION_ASSETS\s*=\s*File\.join\(REPO_ROOT,\s*([^\n]+)\)/m)?.[1].match(/'([^']+)'/g)?.map(s=>s.slice(1,-1));
assert(assetParts?.length,'Builder must declare LOCOMOTION_ASSETS');
assert.equal(assetParts.join('/'),'assets/protagonistas/v7-locomocao','Test the current V7 builder assets, not a stale V6 fixture');
const locomotion=JSON.parse(read(path.join(...assetParts,'manifest.json'))),v5=JSON.parse(read('assets/protagonistas/v5/manifest.json'));
const states=new Set(locomotion.animations.map(a=>a.state));
const manifest={...v5,animations:[...v5.animations.filter(a=>!states.has(a.state)),...locomotion.animations]};
const noop=()=>{};let active=true,wall=false,speeds=[6.1,6.1],checks=0;
const stride={walk:8/3.6,run:6.1*.520},velocity={walk:3.7,run:6.1};
const env={Image:class{},G:{x:10,y:10,active:'franco',area:'forest',dir:'right',isRunning10:true,flags:{}},act:{},C3:{coop:{x:20,y:10,running:true,dir:'left'},coopMember:()=> 'ryuchi',coopActive:()=>true,coopAttack:noop,coopSkill:noop,coopAdvanced:noop,coopSignature:noop,damageCoop:noop},activeModes10:()=>active,Input121:{roll:null},Combat10:{dashTime:0},stride10:0,T:24,cam:{x:0,y:0},update:dt=>{if(active&&!wall){env.G.x+=speeds[0]*dt;env.C3.coop.x-=speeds[1]*dt}},attackAction:noop,skillAction:noop,advancedSkill:noop,duoAction:noop,damageHero:noop,drawActor:noop,portraitURI10:noop,advanceDialogue:noop};
vm.createContext(env);vm.runInContext(read('game/source/chapter-03/protagonist_art_v5.js').replace('__PROTAGONIST_ASSETS__','{}').replace('__PROTAGONIST_MANIFEST__',JSON.stringify(manifest))+';globalThis.art=ProtagonistArtV5;',env);const art=env.art;
function check(name,fn){fn();checks++;console.log('OK · '+name)}
function reset(state='run'){active=true;wall=false;env.G.x=10;env.C3.coop.x=20;env.G.isRunning10=env.C3.coop.running=state==='run';env.G.flags.masks=false;env.Input121.roll=null;env.Combat10.dashTime=0;speeds=[velocity[state],velocity[state]];art.reset();}
function close(actual,expected,message){const d=Math.abs(actual-expected);assert(Math.min(d,Math.abs(1-d))<1e-8,message+': '+actual+' vs '+expected);}
function advance(seconds,hz,onFrame=()=>{}){const count=Math.floor(hz*seconds);for(let i=0;i<count;i++){env.update(1/hz);onFrame();}const rest=seconds-count/hz;if(rest>1e-10){env.update(rest);onFrame();}}
check('V7 supplies32 unique hero/state/variant/direction sequences with16 played columns and virtual closure',()=>{
 assert.deepEqual([...states].sort(),['run','walk']);assert.equal(locomotion.animations.length,32);assert.deepEqual(locomotion.cell,[256,256]);assert.equal(locomotion.rows.length,8);const keys=new Set();
 for(const s of locomotion.animations){const key=s.hero+'/'+s.state+'/'+s.row;assert(!keys.has(key),key);keys.add(key);assert.equal(s.playFrames,16);assert.equal(s.frames,s.playFrames);assert.equal(s.closureFrame,0);assert.equal(s.loop,true);assert.equal(s.row,['down','left','up','right'].indexOf(s.direction)+(s.variant==='masked'?4:0));assert.equal(s.frameDurationsMs.length,s.playFrames);assert(s.frameDurationsMs.every(ms=>Number.isFinite(ms)&&ms>0));assert(Math.abs(s.frameDurationsMs.reduce((a,b)=>a+b,0)-s.cycleMs)<1e-8);assert(Math.abs(s.strideDistance-stride[s.state])<1e-8);
  let time=0;const shown=new Set();for(let i=0;i<s.playFrames;i++){assert.equal(art.phaseFrame(s,(time+s.frameDurationsMs[i]/2)/s.cycleMs),i);shown.add(art.phaseFrame(s,(time+s.frameDurationsMs[i]/2)/s.cycleMs));time+=s.frameDurationsMs[i];}assert.equal(shown.size,s.playFrames);assert.equal(art.phaseFrame(s,1-1e-9),s.playFrames-1);assert.equal(art.phaseFrame(s,1%1),s.closureFrame);
 }
 for(const hero of ['franco','ryuchi'])for(const state of states)for(let row=0;row<8;row++)assert(keys.has(hero+'/'+state+'/'+row));assert.equal(manifest.animations.length,v5.animations.length);
});
const phases=[];
for(const state of ['walk','run'])for(const hz of [30,60,120])check('Actual '+state+' travel preserves stride and samples every frame at'+hz+'Hz for P1/P2',()=>{
 reset(state);const samples=[new Set(),new Set()],seconds=stride[state]/velocity[state]*3.375;
 advance(seconds,hz,()=>{for(const seat of [0,1]){const p=art.pose({style:seat?'ryuchi':'franco',dir:'down'},seat,true);assert.equal(p.state,state);samples[seat].add(p.frame);}});
 for(const seat of [0,1]){assert.equal(samples[seat].size,art.sequence(seat?'ryuchi':'franco',state,0).playFrames);close(art.locomotion[seat].phase,.375,'distance-derived phase');}phases.push({state,hz,p1:art.locomotion[0].phase,p2:art.locomotion[1].phase});
});
for(const state of ['walk','run'])check('A complete '+state+' spatial cycle wraps to virtual frame0 without an extra closing column',()=>{
 reset(state);const seconds=stride[state]/velocity[state];advance(seconds,120);for(const seat of [0,1]){close(art.locomotion[seat].phase,0,'closed cycle');const sequence=art.sequence(seat?'ryuchi':'franco',state,0);assert.equal(art.phaseFrame(sequence,(art.locomotion[seat].phase+1e-8)%1),sequence.closureFrame);}
});
check('Walk/run transitions preserve phase across direction and mask changes',()=>{
 reset();advance(.2,60);const phase=art.locomotion[0].phase;env.G.isRunning10=false;env.G.flags.masks=true;const p=art.pose({style:'franco',dir:'left'},0,true);assert.equal(p.row,5);assert.equal(p.state,'walk');assert.equal(p.frame,art.phaseFrame(art.sequence('franco','walk',5),phase));assert.equal(art.locomotion[0].phase,phase);env.G.isRunning10=true;const q=art.pose({style:'franco',dir:'right'},0,true);assert.equal(q.row,7);assert.equal(q.frame,art.phaseFrame(art.sequence('franco','run',7),phase));
});
check('Holding input against a wall does not march or advance either cycle',()=>{reset();advance(.2,60);wall=true;const phase=art.locomotion.map(s=>s.phase);env.update(.1);for(const seat of [0,1]){assert.equal(art.locomotion[seat].phase,phase[seat]);assert.equal(art.pose({style:seat?'ryuchi':'franco'},seat,true).state,'idle');}wall=false;});
check('Dialogue/menu pauses freeze both clocks, actions and locomotion state',()=>{reset();advance(.1,60);art.mark(0,'franco','attack_1',.4,'up');active=false;const before=JSON.stringify({motion:art.locomotion,players:art.players}),clock=art.clock;env.update(.3);assert.equal(JSON.stringify({motion:art.locomotion,players:art.players}),before);assert.equal(art.clock,clock);active=true;});
check('Different P1/P2 distances produce independent phases',()=>{reset();speeds=[6.1,3.05];advance(.2,60);close(art.locomotion[0].phase,.2/.520,'P1 phase');close(art.locomotion[1].phase,.1/.520,'P2 phase');assert.notEqual(art.locomotion[0],art.locomotion[1]);});
check('Accepted actions and rolls retain precedence without advancing the action seat locomotion',()=>{reset();art.mark(0,'franco','attack_1',.4,'up');env.update(.02);assert.equal(art.pose({style:'franco'},0,true).state,'attack_1');assert.equal(art.locomotion[0].phase,0);assert(art.locomotion[1].phase>0);env.Input121.roll={id:'franco',duration:.3};env.Combat10.dashTime=.2;const phase=art.locomotion[0].phase;env.update(.02);assert.equal(art.pose({style:'franco'},0,true).state,'roll');assert.equal(art.locomotion[0].phase,phase);env.Combat10.dashTime=0;});
check('Load/area/member changes discard stale action and locomotion ownership',()=>{env.G={...env.G,area:'studio'};env.update(0);assert(art.players.every(v=>!v));assert(!art.locomotion[0]?.moving);env.G.active='ryuchi';env.update(0);assert.equal(art.locomotion[0].hero,'ryuchi');assert.equal(art.locomotion[0].phase,0);});
console.log(JSON.stringify({passed:checks,assets:assetParts.join('/'),method:'Node VM with current builder-selected manifest and actual runtime hooks; not a built-browser, physical-device or human fluency evaluation',phases}));
