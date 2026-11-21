'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),noop=()=>{},all=['franco','ryuchi','alt','katana','synth','percussion'];
const context={console,Math,Number,Set,Date,copy:x=>JSON.parse(JSON.stringify(x)),G:{formation:['franco','ryuchi'],active:'franco',c3:{complete:true},hp:{},maxhp:{}},areas:{},combatAreas10:new Set(),C3:{AREAS:[],COMBAT_AREAS:[],labels:{},unlockedRoster:()=>all,coopActive:()=>false,coopMember:()=>null,areaStory:noop,finishSilence:noop,combatUnlocked:()=>true}};
for(const n of ['fresh','normalizeSave','buildMaps','setArea','drawDetailedNPC','openMap','openSystem','enemyActors','gainXP','hitEnemy','save','showDefeat','restoreCheckpoint','update','updateHUD','objectiveData','exportSave','getRoute','drawGuideMarker'])context[n]=noop;
context.partyMembers=()=>context.G.formation;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'game/source/chapter-03/postgame.js'),'utf8'),context);const p=vm.runInContext('PostGame',context);let cases=0;
const subsets=[];for(let mask=1;mask<64;mask++){const team=all.filter((_,i)=>mask&(1<<i));if(team.length<=3)subsets.push(team)}
for(const team of subsets){context.G.formation=team;context.G.active=team[0];const chosen=Array.from(p.selectedReserves());assert(chosen.every(id=>!team.includes(id)));assert.equal(new Set(chosen).size,chosen.length);assert.equal(chosen.length,Math.min(2,6-team.length));cases++}
context.G.formation=['franco','alt','katana'];context.G.active='franco';context.C3.coopActive=()=>true;context.C3.coopMember=()=> 'synth';assert(!p.selectedReserves().includes('synth'));cases++;
let total=0;for(let wave=1;wave<=2000;wave++){const a=JSON.stringify(p.wavePlan(42,wave)),b=JSON.stringify(p.wavePlan(42,wave));assert.equal(a,b);const plan=p.wavePlan(42,wave);assert(plan.length<=18&&plan.length>=3);assert(plan.every(e=>all.length&&e.x>=3.5&&e.x<=23.5&&e.y>=4.5&&e.y<=16.5));total+=plan.length}cases++;
assert.notEqual(JSON.stringify(p.wavePlan(41,8)),JSON.stringify(p.wavePlan(42,8)));cases++;
const g={c3:{complete:true},hp:Object.fromEntries(all.map(id=>[id,20])),maxhp:Object.fromEntries(all.map(id=>[id,80]))};
let s=p.normalize({run:{active:true,seed:42,wave:7,score:9999,bankedScore:200,bankedKills:4,phase:'fight',hpStart:g.hp}},g);assert.equal(s.run.wave,7);assert.equal(s.run.score,200);assert.equal(s.run.kills,4);assert(s.run._resume);cases++;
s=p.normalize({run:{active:true,seed:42,wave:7,bankedScore:900,bankedKills:8,phase:'rest',hpStart:g.hp}},g);assert.equal(s.run.wave,8);assert.equal(s.run.completedWave,7);assert.equal(s.run.score,900);assert.equal(s.run.hpStart.franco,36);cases++;
s=p.normalize({bestScore:Infinity,bestWave:-2,run:{active:true,wave:Infinity,seed:'bad',hpStart:{franco:-1}}},g);assert(Number.isFinite(s.run.wave));assert(s.run.hpStart.franco>0);assert.equal(s.bestScore,0);cases++;
s=p.normalize({run:{active:true,wave:2}},{...g,c3:{complete:false}});assert.equal(s.run,null);cases++;
const report={passed:cases,formationCombinations:subsets.length,proceduralWaves:2000,plannedEnemies:total,physicalHardware:false};const out=path.join(root,'qa/postgame');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'UNIT.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
