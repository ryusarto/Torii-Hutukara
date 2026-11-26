'use strict';
// Native enemy AI in controlled, original-map encounters. No mockup compositing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),device=process.env.FX_DEVICE||'pc';
const version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))).versao;
const url=process.argv[2],buildKey=new URL(url).searchParams.get('ui')||'local',out=path.join(root,'qa',version,'enemy-skill-fx-v2','build-'+buildKey,device==='pc'?'':device);if(!/^http/.test(url||''))throw Error('Use HTTP export only');
const specs=[
 {id:'tambor',type:'tambor_escudo',area:'forest',x:25,y:24,d:1.4,frames:70},
 {id:'flautim',type:'flautim_atirador',area:'forest',x:25,y:24,d:5,frames:70},
 {id:'coro',type:'coro_curador',area:'voices',x:38,y:31,d:4,heal:true,frames:70},
 {id:'maestro',type:'maestro_invocador',area:'voices',x:31,y:12,d:5,frames:75},
 {id:'muralha',type:'muralha_estatica',area:'power_plant',x:9,y:8,d:1.5,frames:70},
 {id:'muralha-charge',type:'muralha_estatica',area:'power_plant',x:9,y:8,d:4,frames:75},
 {id:'antena',type:'antena_feedback',area:'power_plant',x:12,y:4,d:5,frames:70},
 {id:'coro-melee',type:'coro_curador',area:'voices',x:38,y:31,d:1,frames:45},
 {id:'tambor-dificil',type:'tambor_escudo',area:'forest',x:25,y:24,d:1.4,hard:true,frames:75},
 {id:'flautim-dificil',type:'flautim_atirador',area:'forest',x:25,y:24,d:5,hard:true,frames:75},
 {id:'antena-dificil',type:'antena_feedback',area:'power_plant',x:12,y:4,d:5,hard:true,frames:75}
];
const chosen=process.env.FX_CASES?specs.filter(s=>process.env.FX_CASES.split(',').includes(s.id)):specs;
fs.mkdirSync(out,{recursive:true});const report={url,device,method:'Actual HTTP runtime; original enemy AI and props retained; enemies/player positioned to expose the actions, wounded ally for healing, player HP increased for capture. PC close-up crops of the real viewport, full mobile viewport; fixed update(.05), 20fps GIF at actual simulation speed; no human campaign.',cases:[],errors:[]};
const previousFile=path.join(out,'RECORDING.json');
if(fs.existsSync(previousFile)){const previous=JSON.parse(fs.readFileSync(previousFile));if(previous.url===url&&previous.fixtureVersion===2)report.cases=previous.cases.filter(c=>!chosen.some(s=>s.id===c.id));}
report.fixtureVersion=2;
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
 const page=await browser.newPage(device==='pc'?{viewport:{width:960,height:640}}:{viewport:device==='portrait'?{width:390,height:844}:{width:844,height:390},isMobile:true,hasTouch:true});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 await page.goto(device==='pc'?url:url+(url.includes('?')?'&':'?')+'input=mobile',{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>!!window.EnemySkillFXV1,null,{polling:50});await page.locator('#playtestEntry').waitFor({state:'detached'});
 await page.evaluate(()=>EnemySkillFXV1.preload());
 for(const spec of chosen){
  await page.evaluate(async s=>{
   G=fresh();G.flags.bass=G.flags.masks=G.flags.reveal=G.flags.voicesKatana=true;G.c3.started=true;G.chapter=3;G.c3.synthUnlocked=G.c3.percussionUnlocked=G.c3.usinaDone=true;G.formation=['franco'];G.active='franco';G.knownMembers=['franco','ryuchi','alt','katana','synth','percussion'];G.difficulty=s.hard?'dificil':'normal';G.hp.franco=G.maxhp.franco=999;buildMaps();setArea(s.area,s.x,s.y,false);
   $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';menuOrigin10=menuPage10=null;transitionAlpha=0;mode='action';battle={id:'skillfx_demo',boss:false};bossActor=null;current.enemies=[];hostileShots=[];projectiles=[];combatFX.length=0;vfx.length=0;resetMotion10();act.invuln=0;companionCooldown=999;ToriiDificuldade.limparPerigos();EnemyVariantArtV2.reset();
   // Prefer an actual clear horizontal lane, leaving map collision intact.
   let lane=null;const center=s.area==='power_plant'?{x:25,y:13}:s.area==='voices'?{x:32,y:27}:{x:26,y:21};
   const offsets=[];for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++)offsets.push({dx,dy,score:dx*dx+dy*dy*2});offsets.sort((a,b)=>a.score-b.score);
   for(const {dx,dy} of offsets){const x=center.x+dx,y=center.y+dy;let clear=true;for(let q=-Math.ceil(s.d)-1;q<=4;q++)if(!tileWalkable(current,x+q,y)||!tileWalkable(current,x+q,y+1))clear=false;if(clear){lane={x,y};break}}
   if(lane){G.x=lane.x;G.y=lane.y}
   const e=hydrateEnemy({id:'skillfx_demo_'+s.id,type:s.type,x:G.x-s.d,y:G.y});e.cd=0;e.wind=0;e.face=0;current.enemies=[e];window.__skillEnemy=e;
   if(s.heal){const a=hydrateEnemy({id:'skillfx_wounded',type:'hush',x:e.x+1.3,y:e.y+1.5});a.hp=Math.round(a.max*.3);a.cd=999;current.enemies.push(a);window.__skillAlly=a}
   EnemyVariantArtV2.ready(s.type);await EnemyVariantArtV2.image(s.type).decode();for(const hero of['franco','ryuchi'])for(const state of['idle','walk','run']){const im=ProtagonistArtV5.image(hero+'_'+state);if(im?.decode)await im.decode()}
   update(0);updateHUD();ToriiUI7.refresh();await new Promise(r=>setTimeout(r,250));const toast=$('toast');if(toast){toast.style.display='none';toast.textContent=''}drawEnv();
  },spec);
  // Give original environment images a load opportunity without advancing AI.
  await page.waitForTimeout(400);await page.evaluate(()=>drawEnv());
  const child=spawn(process.env.FX_PYTHON||'/private/tmp/torii-playtest-venv/bin/python',[path.join(root,'production/encode_enemy_skill_fx_demo.py'),path.join(out,spec.id+'.gif'),'50']);
  let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);const trace=[];let firstAttack=null;
  const dodge=['tambor','tambor-dificil','muralha'].includes(spec.id);
  for(let frame=0;frame<spec.frames;frame++){
   if(dodge&&frame===2)await page.keyboard.down('ArrowRight');
   if(dodge&&frame===12)await page.keyboard.up('ArrowRight');
   const state=await page.evaluate(({frame,s})=>{
    const e=__skillEnemy;
    tick+=.05;update(.05);drawEnv();const p=EnemyVariantArtV2.pose(e);return{frame,player:[G.x,G.y],enemy:[e.x,e.y],camera:[cam.x,cam.y],team:partyMembers(),mode,pose:p.state,danger:ToriiDificuldade.perigos.filter(h=>h.dono===e).map(h=>({kind:h.kind,time:h.time,angle:h.angle,damage:h.damage})),shots:hostileShots.length,minions:current.enemies.filter(a=>a.f2chamado===e.id).length,hp:e.hp,fx:EnemySkillFXV1.snapshot()};
   },{frame,s:spec});trace.push(state);if(state.pose==='attack'&&firstAttack===null)firstAttack=frame;
   const png=await page.screenshot(device==='pc'?{type:'png',clip:{x:180,y:190,width:720,height:300}}:{type:'png'}),head=Buffer.alloc(4);head.writeUInt32BE(png.length);child.stdin.write(head);if(!child.stdin.write(png))await once(child.stdin,'drain');
   if(frame===firstAttack+2&&firstAttack!==null)fs.writeFileSync(path.join(out,spec.id+'-impact.png'),png);
   if(frame===20||frame===31)await page.screenshot({path:path.join(out,spec.id+'-'+frame+'.png')});
  }
  child.stdin.end();const [code]=await once(child,'close');assert.equal(code,0,stderr);assert(trace.some(t=>t.pose==='attack'),'Native release missing: '+spec.id);
  const result={...spec,controls:dodge?'Native ArrowRight movement during wind-up to expose the sector':'Standing target',trace,encoding:JSON.parse(stdout),states:[...new Set(trace.map(t=>t.pose))]};report.cases.push(result);console.log('RECORDED '+spec.id+' '+JSON.stringify(result.states));fs.writeFileSync(path.join(out,'RECORDING.json'),JSON.stringify(report,null,2)+'\n');
 }
 assert.deepEqual(report.errors,[]);
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'RECORDING.json'),JSON.stringify(report,null,2)+'\n')});
