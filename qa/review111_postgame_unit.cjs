/* Small real-source regressions: chapter destinations and dynamic combat guards.
 * No browser, build or player storage. Map/DOM stubs cover menus only; browser
 * suite exercises the complete attack/input/save chain against the built game. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),noop=()=>{},copy=x=>JSON.parse(JSON.stringify(x));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const campaign=JSON.parse(read('qa/beta-1.10.1/CAMPAIGN_usina_RELOAD.json')).save;
const combatRef=process.argv.find(a=>a.startsWith('--combat-ref='))?.slice(13);
const base=read('game/source/base/TORII_HUTUKARA_1_1_2_TRILHAS.html'),builder=combatRef?execFileSync('git',['show',combatRef+':game/source/chapter-03/build_alpha.rb'],{cwd:root,encoding:'utf8'}):read('game/source/chapter-03/build_alpha.rb'),post=read('game/source/chapter-03/postgame.js');
let count=0,failed=0;
function check(name,fn){try{fn();count++;console.log('OK · '+name)}catch(e){failed++;console.error('FAIL · '+name+' · '+e.message)}}
function func(source,name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);assert(start>=0&&end>start,name);return source.slice(start,end)}
// Execute the actual small Ruby patch block in memory, not the asset builder.
const start=builder.indexOf('combat_old ='),end=builder.indexOf('\nreplace_once!(html,',start);assert(start>=0&&end>start);
const patched=execFileSync('/usr/bin/ruby',['-e','html=STDIN.read.force_encoding(Encoding::UTF_8)\n'+builder.slice(start,end)+'\nSTDOUT.write(html)'],{input:base,encoding:'utf8',maxBuffer:64*1024*1024});
for(const hero of ['franco','ryuchi'])for(const action of ['attackAction','skillAction','advancedSkill'])check(hero+' '+action+' honors the dynamic arena registration',()=>{
 const s={console,Math,Number,Set,G:copy(campaign),mode:'walk',act:{cool:0,dash:0,skill:0,skillX:0,invuln:0,combo:0},tick:10,T:24,cam:{x:0,y:0},projectiles:[],screenShake:0,bossActor:null,current:{enemies:[]},clamp:(n,a,b)=>Math.max(a,Math.min(n,b)),setTimeout:noop};
 Object.assign(s.G,{active:hero,formation:['franco','ryuchi'],area:'endless_echo',x:10,y:10,dir:'right',aim091:[1,0]});s.G.levels.franco=s.G.levels.ryuchi=5;
 const e={id:'endless_0',type:'hush',hp:1000,max:1000,x:11.5,y:10};s.current.enemies=[e];
 for(const name of ['playTone','toast','addCombatFX','spawnSlashSparks','updateActionHUD','gainXP','save','finishBoss'])s[name]=noop;
 s.fighterName=()=>s.G.active;s.dirVec=()=>[1,0];s.tileWalkable=()=>true;s.meleeCandidates=()=>s.current.enemies;s.engage=()=>{s.mode='action'};
 vm.createContext(s);vm.runInContext(patched.match(/const combatAreas10=new Set\([^\n]+/)[0]+'\ncombatAreas10.add("endless_echo");\n'+func(patched,'hitEnemy')+'\n'+func(patched,action)+'\n'+func(patched,'tickFriendlyShots10'),s);
 vm.runInContext(action+'()',s);for(let i=0;i<30;i++)s.tickFriendlyShots10(.025);
 assert(e.hp<1000,hero+' cannot damage in Fenda with '+action);assert.equal(s.mode,'action');
});
function menus(){
 const elements=new Map(),state={html:'',stored:null};const room=id=>({id,w:32,h:24,gates:[],npcs:[],props:[],enemies:[]});
 const s={console,Math,Number,Set,Date,copy,G:copy(campaign),mode:'walk',battle:null,bossActor:null,menuPage10:null,areas:Object.fromEntries(['city','voices','distortion_district','studio','roof','last_torii'].map(id=>[id,room(id)])),combatAreas10:new Set(),KEY:'isolated-review111',localStorage:{setItem:(k,v)=>state.stored=JSON.parse(v)},C3:{AREAS:[],COMBAT_AREAS:[],labels:{},unlockedRoster:()=>Object.keys(campaign.maxhp),coopActive:()=>false,coopMember:()=>null,areaStory:noop,finishSilence:noop,combatUnlocked:()=>true}};
 const element=id=>{if(!elements.has(id))elements.set(id,{id,style:{},dataset:{},classList:{add:noop,remove:noop},appendChild:noop});return elements.get(id)};
 s.$=id=>id==='retryCheckpoint'?null:element(id);s.partyMembers=()=>s.G.formation;s.savedFormationAlive10=g=>!!g?.formation?.some(id=>g.hp[id]>0);s.tileWalkable=(a,x,y)=>x>1&&y>1&&x<a.w-1&&y<a.h-1;
 s.enterMenu10=html=>{state.html=html;s.mode='overlay';elements.clear()};s.document={querySelectorAll:()=>Array.from(state.html.matchAll(/data-post-area="([^"]+)"/g),m=>{const b=element(m[1]);b.dataset.postArea=m[1];return b}),createElement:()=>element('created')};
 s.closeOverlay=()=>{s.mode='walk'};s.setArea=(id,x,y)=>{s.G.area=id;s.G.x=x;s.G.y=y;s.current=s.areas[id];s.mode='walk'};s.setCheckpoint=(id,area,x,y)=>{s.G.checkpoint={id,area,x,y};s.save(true)};s.save=()=>s.localStorage.setItem(s.KEY,JSON.stringify(s.G));
 for(const name of ['fresh','normalizeSave','buildMaps','drawDetailedNPC','openMap','openSystem','enemyActors','gainXP','hitEnemy','showDefeat','restoreCheckpoint','update','updateHUD','objectiveData','exportSave','importSave','getRoute','drawGuideMarker','updateActionHUD','damageHero','continueGame'])s[name]=noop;
 vm.createContext(s);vm.runInContext(post,s);return{s,state,p:vm.runInContext('PostGame',s)};
}
check('Postgame exposes exactly three chapter hubs plus the dungeon',()=>{const {p,state}=menus();assert(p.openTravel());assert.deepEqual(Array.from(state.html.matchAll(/data-post-area="([^"]+)"/g),m=>m[1]),['city','voices','distortion_district']);for(const n of [1,2,3])assert(state.html.includes('CAPÍTULO '+n));assert.equal((state.html.match(/id="postDungeon"/g)||[]).length,1);assert(!state.html.includes('data-post-area="studio"'));});
check('Chapter selection preserves campaign, party, resources, unlocks and record',()=>{const {s,p,state}=menus();const fields=['flags','c3','formation','active','hp','maxhp','xp','levels','potions','shards','defeated','postgame'];const before=Object.fromEntries(fields.map(k=>[k,copy(s.G[k])]));for(const [id,chapter]of [['city',1],['voices',2],['distortion_district',3]]){assert(p.travel(id));assert.equal(s.G.area,id);assert.equal(s.G.chapter,chapter);assert.equal(s.G.checkpoint.area,id);assert.equal(state.stored.area,id);for(const key of fields)assert.deepEqual(s.G[key],before[key],key)}});
check('Internal rooms cannot be selected or used through the travel API',()=>{const {s,p}=menus();const before=JSON.stringify(s.G);for(const id of ['studio','roof','last_torii','endless_echo','unknown'])assert.equal(p.travel(id),false,id);assert.equal(JSON.stringify(s.G),before)});
check('Chapter travel stays locked before campaign completion and during combat',()=>{const {s,p}=menus();s.G.c3.complete=false;assert.equal(p.openTravel(),false);assert.equal(p.travel('city'),false);s.G.c3.complete=true;s.battle={id:'field'};assert.equal(p.travel('city'),false)});
console.log(JSON.stringify({passed:count,failed,combatRef:combatRef||'working-tree',method:'Real Ruby guard patch and legacy damage/actions in VM; real PostGame menu/travel with isolated DOM and map stubs. No browser/hardware.'}));

if(failed)process.exitCode=1;
