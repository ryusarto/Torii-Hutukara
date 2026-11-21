'use strict';
// All inputs, cooldowns, body positions and damage are resolved by the shipped game.
module.exports=function heroAttackFixture(){
 window.heroAttackArena=function(hero,seat=0){
 G=fresh();const other=hero==='franco'?'ryuchi':'franco';
 G.active=seat?other:hero;G.formation=[G.active,seat?hero:other];
 G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;
 G.c3.synthUnlocked=G.c3.percussionUnlocked=true;
 for(const id of G.formation){G.hp[id]=G.maxhp[id]=100;G.levels[id]=5}
 G.resonance=100;current=mk('forest',40,30,'grass');G.area='forest';
 G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];
 mode='action';battle={boss:false,id:'field'};bossActor=null;keys={};tick=8;menuOpen=false;
 C3.synthWave=0;C3.synthZones=[];C3.percussionGuard=0;
 resetMotion10();Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,combo:0,comboTime:0});
 C3.pad.pads=[{index:0},{index:1}];C3.coop.member=G.formation[1];C3.syncCoop(true);
 Object.assign(C3.coop,{x:14,y:15,dir:'left',cool:0,skill:0,advanced:0,signature:0,combo:0,lastAttack:-20});
 projectiles=[];hostileShots=[];combatFX.length=0;current.enemies=[];companionCooldown=90;
 HeroAttackFX.sync();cam.x=cam.y=0;
};
};
