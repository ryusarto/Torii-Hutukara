'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/beta-1.17.0/hero-fx-v3/animation-frames');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});try{const p=await b.newPage({viewport:{width:1280,height:800}});await p.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});await p.goto(process.argv[2]||pathToFileURL(path.join(root,'game/builds/beta-1.17.0/TORII_HUTUKARA_BETA_1_17_0.html')).href,{waitUntil:'load',timeout:120000});await p.evaluate(require('./hero_attack_fixture.cjs'));const metadata=[];
for(const hero of['franco','ryuchi','alt','katana','synth','percussion']){
 const folder=path.join(out,hero);fs.mkdirSync(folder,{recursive:true});
 await p.evaluate(async hero=>{await heroAttackArena(hero);buildMaps();setArea('ruins',37,16,false);G.formation=[hero];C3.pad.pads=[];C3.coop.member=null;mode='action';battle={id:'fxrec',boss:false};bossActor=null;current.enemies=[];G.dir='right';G.aim091=[1,0];$('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';transitionAlpha=0;
  HeroAttackFX.v3Ready(hero);await HeroAttackFX.v3Images[hero].decode();const art=['franco','ryuchi'].includes(hero)?ProtagonistArtV5:['alt','katana'].includes(hero)?NinjaArcherArtV1:MusicianArtV1;
  await Promise.all(['idle','attack_1','attack_2','attack_3'].map(state=>{const key=art===MusicianArtV1?art.key(hero,'unmasked',state):hero+'_'+state;return art.image(key).decode()}));await HeroAttackBody.sheet(hero,'unmasked')?.decode();update(0);drawEnv();
 },hero);
 const accepted=[];
 for(let frame=0;frame<42;frame++){
  const info=await p.evaluate(async frame=>{if(frame%14===0){const before=HeroAttackFX.events.length;attackAction();window.__accepted=HeroAttackFX.events.length>before?HeroAttackFX.events.at(-1)?.art?.clip:null}tick+=1/30;update(1/30);drawEnv();const r=ctx.canvas.getBoundingClientRect(),x=r.x+(G.x*T-cam.x)/VW*r.width,y=r.y+(G.y*T-cam.y)/VH*r.height;return{clip:{x:Math.round(x-90),y:Math.round(y-145),width:240,height:210},accepted:frame%14===0?window.__accepted:null}},frame);
  if(frame%14===0)accepted.push(info.accepted);await p.screenshot({path:path.join(folder,String(frame).padStart(3,'0')+'.png'),clip:info.clip});
 }
 metadata.push({hero,acceptedClips:accepted,frames:42,simulationDt:1/30,gifFrameMs:80,playback:'2.4x slower than the actual simulated cadence, for inspection'});console.log('Recorded '+hero+' '+JSON.stringify(accepted));
}
fs.writeFileSync(path.join(out,'RECORDING.json'),JSON.stringify({method:'Actual accepted J combos and update(1/30), real ruins renderer, solo formation, cached existing body atlases; no posed image interpolation',metadata},null,2)+'\n');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
