'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),noop=()=>{},heroes=['franco','ryuchi','alt','katana','synth','percussion'],elements=new Map();
const c={Math,Number,Set,Date,console,copy:x=>JSON.parse(JSON.stringify(x)),areas:{},combatAreas10:new Set(),mode:'action',battle:null,bossActor:null,T:24,VW:768,VH:432,cam:{x:0,y:120},G:null,current:{enemies:[]},$:id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{add:noop},onclick:null});return elements.get(id)},C3:{AREAS:[],COMBAT_AREAS:[],labels:{},coopActive:()=>false,coopMember:()=> 'alt',unlockedRoster:()=>heroes,areaStory:noop,finishSilence:noop,combatUnlocked:()=>true,damageCoop:amount=>c.G.hp.alt=Math.max(0,c.G.hp.alt-amount)},partyMembers:()=>c.G.formation,hydrateEnemy:e=>Object.assign(e,{hp:44,max:44,power:8}),canBody121:()=>true,engage:noop,toast:noop,setCheckpoint:noop,enterMenu10:noop};
for(const n of ['closeOverlay','fresh','normalizeSave','buildMaps','drawDetailedNPC','openMap','openSystem','enemyActors','gainXP','save','showDefeat','restoreCheckpoint','update','updateHUD','objectiveData','exportSave','getRoute','drawGuideMarker','updateActionHUD'])c[n]=noop;
c.setArea=(id,x,y)=>Object.assign(c.G,{area:id,x,y});c.hitEnemy=(e,damage)=>e.hp=Math.max(0,e.hp-damage);c.damageHero=amount=>{const id=c.G.active;c.G.hp[id]=Math.max(0,c.G.hp[id]-amount);if(!c.G.hp[id])c.G.active='ryuchi'};
vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'game/source/chapter-03/postgame.js'),'utf8'),c);const p=vm.runInContext('PostGame',c);p.clearCombat=noop;c.updateHUD=c.save=noop;
function fixture(wave=1,seats=1){c.C3.coopActive=()=>seats===2;c.G={area:p.AREA,x:14.5,y:18.5,active:'franco',formation:['franco','alt','ryuchi'],c3:{complete:true},hp:Object.fromEntries(heroes.map(h=>[h,40])),maxhp:Object.fromEntries(heroes.map(h=>[h,80])),potions:1,resonance:30,shards:10,defeated:[],postgame:p.defaults()};c.G.postgame.run={active:true,upgrades:{},rules:3,legacy:false,mode:seats===2?'coop':'solo',seed:42,wave,score:0,bankedScore:0,kills:0,bankedKills:0,completedWave:wave-1,hpStart:{...c.G.hp},campaignPotions:17,campaignResonance:63,resonanceStart:100,potionsStart:3,combo:0,comboStart:0,elapsed:10,bankedElapsed:8,waveSeats:seats,phase:'fight',cursor:0,wait:0,pending:null,clean:true,knockouts:0};c.current={enemies:[]};c.mode='action';p.plan=[];p.spawnClock=0;return c.G.postgame.run}
const rows=[];function check(name,fn){fn();rows.push(name);console.log('OK · '+name)}
check('Progressive pressure stays bounded and HP at wave20 is less than legacy sponge growth',()=>{for(const seats of [1,2])for(let w=1;w<=2000;w++){const a=p.profile(w,seats);assert(a.count<=(seats===2?20:15));assert(a.alive<=(seats===2?7:6));assert(a.warning>=.9);assert(a.cadence>=1);assert(a.power<=3.25)}assert(p.profile(20).hp<1+(20-1)*.13)});
check('Procedural plans vary without early controllers or multiple mute auras',()=>{for(let seed=1;seed<=200;seed++)for(let wave=1;wave<=60;wave++){const a=p.wavePlan(seed,wave),again=p.wavePlan(seed,wave);assert.equal(JSON.stringify(a),JSON.stringify(again));assert(a.filter(e=>e.type==='abafador').length<=1);if(wave<10)assert(!a.some(e=>e.type==='abafador'));assert.equal(a.filter(e=>e.elite).length,wave%5===0?1:0)}assert.notEqual(JSON.stringify(p.wavePlan(1,15)),JSON.stringify(p.wavePlan(2,15)))});
check('Clean waves award an extra bonus without a timer favoring fast weapons',()=>{const r=fixture(5);const normal=p.waveValue({...r,clean:false}),clean=p.waveValue(r);assert(clean>normal);assert.equal(p.waveValue({...r,elapsed:10000}),clean);assert.equal(p.killValue('abafador',5)>p.killValue('hush',5),true)});
check('A nonlethal P2 hit immediately classifies the attempt as coop',()=>{const r=fixture();c.C3.coopActive=()=>true;const e={endless:true,hp:100,type:'hush'};c.hitEnemy(e,1);assert.equal(r.mode,'coop');r.score=100;p.best();assert.equal(c.G.postgame.records.solo.score,0);assert.equal(c.G.postgame.records.coop.score,100)});
check('Real damage clears clean bonus and observes KO even after a leader swap',()=>{const r=fixture();c.damageHero(100);assert.equal(c.G.active,'ryuchi');assert.equal(r.clean,false);assert.equal(r.knockouts,1)});
check('Wave 5 preserves wounds and KO, offers a stable draft and never grants the reward twice',()=>{
 const r=fixture(5,2);c.G.hp.alt=0;c.G.potions=0;p.update(.1);
 assert.equal(r.phase,'rest');assert.equal(c.G.hp.franco,40);assert.equal(c.G.hp.alt,0);assert.equal(c.G.potions,0);
 const cards=p.offers(r);assert.equal(new Set(cards).size,3);assert(!p.choose('invalid',5));
 const g=JSON.parse(JSON.stringify(c.G));c.C3.coopActive=()=>false;const resumed=p.normalize(g.postgame,g).run;
 assert.equal(resumed.wave,5);assert.equal(resumed.phase,'rest');assert.equal(resumed.hpStart.alt,0);assert.deepEqual(p.offers(resumed),cards);
 c.G.postgame.run=resumed;assert(p.respiteDue(resumed));assert(!p.choose(cards[1],5),'o respiro vem antes da melhoria');
 assert(p.respite('rare',5));assert(!p.respiteDue(resumed));assert(!p.respite('heal',5),'um respiro por pausa');
 const spawn=p.spawn;p.spawn=()=>false;assert(p.choose(cards[1],5));p.spawn=spawn;
 assert.equal(resumed.upgrades[cards[1]],Math.min(p.cards[cards[1]].maxLevel||99,p.RARE_LEVELS));assert.equal(resumed.rare,false);assert.equal(resumed.wave,6);assert.equal(resumed.phase,'fight');assert(!p.choose(cards[1],5));
 assert.equal(c.G.hp.franco,40);assert.equal(c.G.hp.alt,0);
});
check('Loading a partial wave rewinds unbanked rewards and preserves wounds, KO and selected upgrades',()=>{
 const r=fixture(8);r.score=900;r.bankedScore=500;r.kills=9;r.bankedKills=5;r.hpStart.franco=70;r.resonanceStart=81;r.upgrades={drive:1};
 c.G.hp.franco=1;c.G.hp.alt=0;c.G.resonance=2;const g=JSON.parse(JSON.stringify(c.G)),n=p.normalize(g.postgame,g);
 assert.equal(n.run.score,500);assert.equal(n.run.kills,5);assert.equal(n.run.hpStart.franco,1);assert.equal(n.run.hpStart.alt,0);assert.equal(g.potions,0);assert.equal(g.resonance,81);assert.equal(n.run.upgrades.drive,1);
});
check('Card effects apply to real damage, health thresholds, guard, stun and resonance',()=>{
 const r=fixture();r.upgrades={drive:2,ambush:2,finish:2,guard:2,stagger:2,charge:2};const e={endless:true,hp:150,max:150,type:'hush'};
 c.hitEnemy(e,20);assert.equal(e.hp,116);e.hp=60;c.hitEnemy(e,20);assert.equal(e.hp,28);
 c.damageHero(12);assert.equal(c.G.hp.franco,30);
 c.hitEnemy(e,500);assert.equal(c.G.resonance,34);assert.equal(p.cardValue('stagger',2),'30%');assert.equal(p.cardValue('charge',2),'+4 de ressonância');
});
check('Campaign resources return after an expedition instead of granting temporary supplies permanently',()=>{fixture();p.finishRun('exit');assert.equal(c.G.area,'last_torii');assert.equal(c.G.potions,17);assert.equal(c.G.resonance,63);assert.equal(c.G.postgame.run,null)});
check('Legacy scores remain visible as history and never enter the new rankings',()=>{const g={...c.G,area:p.AREA,c3:{complete:true}},n=p.normalize({version:1,bestScore:9999,bestWave:12,run:{active:true,wave:12,bankedScore:400,hpStart:g.hp}},g);assert.equal(n.legacyScore,9999);assert.equal(n.records.solo.score,0);assert(n.run.legacy);c.G.postgame=n;c.G.area=p.AREA;n.run.score=12000;p.best();assert.equal(n.legacyScore,12000);assert.equal(n.records.solo.score,0)});
check('Pause freezes warnings, wave timers and combat time',()=>{const r=fixture();r.pending={x:18,y:12,time:.9};c.mode='overlay';p.update(.1);assert.equal(r.pending.time,.9);assert.equal(r.elapsed,10);r.phase='rest';r.wait=4;p.update(.1);assert.equal(r.wait,4)});
check('Warning placement cannot be offscreen or hidden under HUD/control corners',()=>{fixture();assert(!p.warningVisible(14.5,4.5));assert(p.warningVisible(18,12));assert(!p.warningVisible(4,9));assert(!p.warningVisible(1,1))});
check('Elite damage stays below one-shot range for the weakest selected maxHP',()=>{const r=fixture(100);for(const id of heroes)c.G.maxhp[id]=38;p.plan=[{type:'hush',elite:true}];r.pending={x:18,y:12,index:0,time:0};p.materialize();assert.equal(c.current.enemies.length,1);assert(c.current.enemies[0].power<=13);assert(c.current.enemies[0].hp>44)});
check('Respite every 5 waves heals the standing team or revives one member, once, and survives a reload',()=>{
 const r=fixture(10);r.phase='rest';r.completedWave=10;c.G.hp.franco=20;c.G.hp.alt=0;c.G.hp.ryuchi=80;
 assert(p.respiteDue(r));assert(!p.respite('revive',10,'franco'),'só revive quem caiu');assert(!p.respite('revive',10,'katana'),'só quem está na equipe');
 const g=JSON.parse(JSON.stringify(c.G));const n=p.normalize(g.postgame,g).run;assert.equal(n.phase,'rest');assert(p.respiteDue(n));
 assert(p.respite('heal',10));assert.equal(c.G.hp.franco,44);assert.equal(c.G.hp.alt,0);assert.equal(c.G.hp.ryuchi,80);assert(!p.respiteDue(r));
 const g2=JSON.parse(JSON.stringify(c.G)),n2=p.normalize(g2.postgame,g2).run;assert(!p.respiteDue(n2),'respiro já usado não volta ao carregar');
 const r2=fixture(15);r2.phase='rest';c.G.hp.alt=0;c.G.active='franco';assert(p.respite('revive',15,'alt'));assert.equal(c.G.hp.alt,40);
 const r3=fixture(4);r3.phase='rest';assert(!p.respiteDue(r3));
});
check('Rare respite raises the chosen card by two levels and the save keeps the budget',()=>{
 const r=fixture(5);r.phase='rest';assert(p.respite('rare',5));const card=p.offers(r)[0];const spawn=p.spawn;p.spawn=()=>false;assert(p.choose(card,5));p.spawn=spawn;
 assert.equal(r.upgrades[card],2);const g=JSON.parse(JSON.stringify(c.G));g.postgame.run.phase='rest';const n=p.normalize(g.postgame,g).run;assert.equal(n.upgrades[card],2);
});
check('Enemies arrive in groups of 2 to 4 (5 in coop) on valid, separate spots',()=>{
 for(const [seats,wave,min] of [[1,1,2],[1,13,4],[2,1,3],[2,13,5]]){const r=fixture(wave,seats);c.G.x=14;c.G.y=11;c.cam={x:0,y:0};c.VW=28*24;c.VH=23*24;c.T=24;c.C3.coop={x:15,y:12};p.plan=p.wavePlan(r.seed,wave,seats);r.cursor=0;
  assert(p.spawn());const w=p.warnings(r),prof=p.profile(wave,seats);assert.equal(w.length,Math.min(prof.group,prof.alive,p.plan.length));assert(w.length>=Math.min(min,prof.alive,p.plan.length),JSON.stringify({seats,wave,n:w.length}));
  for(const a of w){assert(p.warningVisible(a.x,a.y));assert(Math.hypot(a.x-c.G.x,a.y-c.G.y)>=4);for(const b of w)if(a!==b)assert(Math.hypot(a.x-b.x,a.y-b.y)>1.2)}
  assert.equal(JSON.stringify(w.map(a=>a.index)),JSON.stringify(w.map((_,i)=>i)));assert.equal(r.cursor,w.length);assert(!p.spawn(),'um grupo por vez');
  for(const a of w)a.time=0;p.materialize();assert.equal(c.current.enemies.length,w.length);assert.equal(p.warnings(r).length,0);assert.equal(JSON.stringify(c.current.enemies.map(e=>e.id)),JSON.stringify(w.map(a=>'endless_'+a.index)))}
});
check('Coop follows the solo difficulty curve with a fixed extra (it no longer grows faster)',()=>{
 for(let w=1;w<=60;w++){const a=p.profile(w,1),b=p.profile(w,2);assert(Math.abs(b.hp/a.hp-1.2)<1e-9,'vida extra fixa');assert.equal(a.power,b.power);assert(b.count>=a.count&&b.alive>=a.alive&&b.group>=a.group)}
});
check('Everyone takes the same damage; heroes that survive less hit harder, P2 hits use P2 power',()=>{
 fixture();assert.equal(p.incoming(20),20);
 for(const [hero,expected] of [['franco',20],['katana',Math.round(20*p.power('katana'))]]){c.G.active=hero;const e={endless:true,hp:500,max:600,type:'hush'};c.hitEnemy(e,20);assert.equal(500-e.hp,expected)}
 assert(p.power('katana')>p.power('franco'));assert(p.power('synth')>1&&p.power('percussion')>1);
 c.G.active='franco';p.attacker='katana';const e={endless:true,hp:500,max:600,type:'hush'};c.hitEnemy(e,20);p.attacker=null;assert.equal(500-e.hp,Math.round(20*p.power('katana')));
 c.G.postgame.run=null;const o={hp:100,max:100};c.G.active='katana';c.hitEnemy(o,20);assert.equal(o.hp,80,'fora da Fenda nada muda');
});
const report={passed:rows.length,checks:rows,method:'VM of real dungeon functions; combat and DOM dependencies stubbed. Not a human comfort/fun test.'};fs.mkdirSync(path.join(root,'qa/dungeon-v3'),{recursive:true});fs.writeFileSync(path.join(root,'qa/dungeon-v3/UNIT.json'),JSON.stringify(report,null,2)+'\n');
