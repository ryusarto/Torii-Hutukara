/* Unit checks for the actual V5 state layer; no browser or personal save. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let source=fs.readFileSync(path.join(root,'game/source/chapter-03/protagonist_art_v5.js'),'utf8').replace('__PROTAGONIST_ASSETS__','{}').replace('__PROTAGONIST_MANIFEST__','{}');
const noop=()=>{},env={Image:class{},G:{active:'franco',area:'forest',flags:{masks:false}},act:{},C3:{coop:{},coopMember:()=> 'ryuchi',coopActive:()=>true,coopAttack:noop,coopSkill:noop,coopAdvanced:noop,coopSignature:noop,damageCoop:noop},activeModes10:()=>true,Input121:{roll:null},Combat10:{dashTime:0},stride10:1,T:24,cam:{x:0,y:0},update:noop,attackAction:noop,skillAction:noop,advancedSkill:noop,duoAction:noop,damageHero:noop,drawActor:noop,portraitURI10:noop,advanceDialogue:noop};
vm.createContext(env);vm.runInContext(source+';globalThis.art=ProtagonistArtV5;',env);const a=env.art;let checks=0;
for(const masks of [false,true])for(const hero of ['franco','ryuchi'])for(const [i,dir]of ['down','left','up','right'].entries()){
 env.G.flags.masks=masks;const p=a.pose({style:hero,dir},-1,false);assert.equal(p.row,i+(masks?4:0));assert.equal(p.state,'idle');checks++;
}
a.reset();a.mark(0,'franco','attack_2',.4,'left');a.mark(1,'ryuchi','skill',.8,'up');a.players[0].elapsed=.2;a.players[1].elapsed=.2;
assert.equal(a.pose({style:'franco'},0,false).frame,4);assert.equal(a.pose({style:'ryuchi'},1,false).frame,2);checks++;
env.Input121.roll={id:'franco',duration:.4};env.Combat10.dashTime=.1;env.G.dir='right';assert.equal(a.pose({style:'franco'},0,false).state,'roll');assert.equal(a.pose({style:'franco'},0,false).frame,6);checks++;
env.Combat10.dashTime=0;env.activeModes10=()=>false;const elapsed=a.players[0].elapsed;env.update(.1);assert.equal(a.players[0].elapsed,elapsed);checks++;
env.activeModes10=()=>true;env.G.active='ryuchi';env.update(0);assert.equal(a.players[0],null);checks++;
env.G={...env.G};env.update(0);assert(a.players.every(p=>p===null));checks++;
a.mark(0,'franco','hurt',.3,'left');env.G.area='studio';env.update(0);assert(a.players.every(p=>p===null));checks++;
for(let i=0;i<20;i++)a.image('sheet_'+i);assert.equal(Object.keys(a.images).length,8);checks++;
assert(!a.supports('alt')&&!a.supports('katana')&&!a.supports('synth')&&!a.supports('percussion'));checks++;
console.log(JSON.stringify({passed:checks,type:'unit state checks, not browser playtest'}));
