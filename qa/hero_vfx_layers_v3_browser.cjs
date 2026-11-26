'use strict';
// World-compositor invariants for the approved V3 bitmap interface. Retains
// coverage from the retired V1/V2 suite without loading their absent atlases.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const input=process.argv[2]||pathToFileURL(path.join(root,'game/builds',version.versao,'TORII_HUTUKARA_'+version.sufixo+'.html')).href;
const out=path.join(root,'qa',version.versao,'hero-vfx-layers-v3');
const report={method:'Actual V3 runtime in isolated Chromium; compositor interception and exact pixel checks. No physical hardware or human playtest.',checks:[],errors:[]};
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--disable-gpu']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 await page.goto(input,{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.HeroAttackFX?.v3Sources||typeof HeroAttackFX!=='undefined'&&HeroAttackFX.v3Sources);
 await page.evaluate(require('./hero_attack_fixture.cjs'));
 const result=await page.evaluate(async()=>{
  const check=(ok,label)=>{if(!ok)throw Error(label)};
  const fx=HeroAttackFX;
  for(const hero of fx.heroes){fx.v3Ready(hero);await fx.v3Images[hero].decode()}
  const pad=index=>({index,id:'V3 layer QA',connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
  const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const rows=[];
  for(const [direction,[dx,dy]]of Object.entries(directions))for(const missing of[false,true]){
   await heroAttackArena('franco');
   G.formation=['franco','alt','ryuchi'];G.hp.alt=G.maxhp.alt=100;
   G.dir=direction;G.aim091=[dx,dy];
   C3.pad.pads=[pad(0),pad(1)];C3.coop.member='alt';C3.syncCoop(true);
   Object.assign(C3.coop,{x:G.x+.14,y:G.y+.1,dir:direction,cool:0,attackUntil:0});
   trail=[{x:G.x-.13,y:G.y+.06,dir:direction}];
   await window.FinalAssetLoadingV1?.ready();C3.coopAttack();attackAction();skillAction();fx.advance(.06);
   const shot=projectiles.find(p=>p.arrow);
   check(shot&&shot.vx*dx+shot.vy*dy>0,'Missing directed P2 arrow '+direction);
   shot.x+=dx*2.5;shot.y+=dy*2.5;
   for(const hero of G.formation)await RunStrideV1.image(hero).ready;
   for(const state of['idle','attack_1']){
    await ProtagonistArtV5.image('franco_'+state).decode();
    await ProtagonistArtV5.image('ryuchi_'+state).decode();
    await NinjaArcherArtV1.image('alt_'+state).decode();
   }
   const order=[],poses=[],projectilePositions=[],fallbackPositions=[];
   const actorDraw=drawActor,imageDraw=ctx.drawImage,rectDraw=ctx.fillRect;
   const overlayDraw=HeroLegacyFX.drawOverlay,projectileDraw=fx.drawProjectile,ready=fx.v3Ready;
   let inProjectile=false,headComparisons=0;
   if(missing)fx.v3Ready=()=>false;
   drawActor=function(p,x,y,...rest){
    if(G.formation.includes(p.style)){order.push('actor');poses.push({id:p.style,x,y})}
    return actorDraw.call(this,p,x,y,...rest);
   };
   fx.drawProjectile=function(p,...rest){const before=inProjectile;inProjectile=p===shot;try{return projectileDraw.call(this,p,...rest)}finally{inProjectile=before}};
   ctx.drawImage=function(im,...args){
    if(Object.values(fx.v3Images).includes(im)){
     order.push('partyFX');
     if(inProjectile){const t=this.getTransform();projectilePositions.push([t.e,t.f])}
    }
    return imageDraw.call(this,im,...args);
   };
   ctx.fillRect=function(x,y,w,h){if(inProjectile&&w===4&&h===2){const t=this.getTransform();fallbackPositions.push([t.a*(x+2)+t.c*(y+1)+t.e,t.b*(x+2)+t.d*(y+1)+t.f])}return rectDraw.call(this,x,y,w,h)};
   const heads=()=>poses.map(({x,y})=>ctx.getImageData(Math.round(x)-10,Math.round(y)-54,21,38).data);
   HeroLegacyFX.drawOverlay=function(){
    const before=heads();const result=overlayDraw.call(this);const after=heads();
    check(before.length===3,'Expected both players and follower before overlay');
    for(let i=0;i<3;i++){check(before[i].every((v,j)=>v===after[i][j]),'Overlay painted over head/torso '+poses[i].id+' '+direction);headComparisons++}
    return result;
   };
   try{
    drawEnv();
    check(new Set(poses.map(p=>p.id)).size===3,'Missing party member in world compositor');
    check(poses.every(p=>Math.hypot(p.x-poses[0].x,p.y-poses[0].y)<=T*2),'Party fixture not crowded');
    if(!missing)check(order.includes('partyFX')&&order.lastIndexOf('partyFX')<order.indexOf('actor'),'V3 offense above party '+direction);
    else check(!order.includes('partyFX'),'Missing V3 bitmap must not fabricate a decoded draw');
    const positions=missing?fallbackPositions:projectilePositions;
    check(positions.some(([x,y])=>Math.hypot(x-(shot.x*T-cam.x),y-(shot.y*T-cam.y))<1),'Projectile detached from collision point '+direction+' missing='+missing);
    check(fx.events.some(e=>e.art?.hero==='franco')&&projectiles.includes(shot),'World compositor removed gameplay cast/projectile');
    rows.push({direction,missingBitmap:missing,partyMembers:poses.length,headComparisons,projectileAnchored:true,offenseBelowBodies:missing?null:true});
   }finally{
    drawActor=actorDraw;ctx.drawImage=imageDraw;ctx.fillRect=rectDraw;
    HeroLegacyFX.drawOverlay=overlayDraw;fx.drawProjectile=projectileDraw;fx.v3Ready=ready;
   }
  }
  await heroAttackArena('franco');attackAction();
  // Exercise the shared legacy feedback factory with explicit ownership. V3
  // need not emit a redundant ring for every attack, but must suppress one
  // received from an attributed delayed source without hiding enemy feedback.
  HeroLegacyFX.withActor('franco',()=>addCombatFX(G.x,G.y,'strike',.75));
  const own=combatFX.find(f=>f.heroArt==='franco');check(own,'Player feedback attribution absent');
  const kinds=['strike','warning','hurt','hit','duo','pulse','xp','dodge'];
  for(let i=0;i<kinds.length;i++)addCombatFX(4+i,5,kinds[i],.75);
  const arcs=[],arc=ctx.arc;
  ctx.arc=function(x,y,r,a,b,...rest){arcs.push({x,y,r,span:Math.abs(a-b)});return arc.call(this,x,y,r,a,b,...rest)};
  try{drawCombatLayer()}finally{ctx.arc=arc}
  const ringAt=(x,y)=>arcs.some(a=>Math.abs(a.x-(x*T-cam.x))<.01&&Math.abs(a.y-(y*T-cam.y-12))<.01&&a.span>6);
  for(let i=0;i<kinds.length;i++)check(ringAt(4+i,5),'Unowned/enemy feedback disappeared: '+kinds[i]);
  check(!ringAt(own.x,own.y),'V3 player contact duplicates the retired ring');
  return{crowdCases:rows,protectedHeadRegions:rows.reduce((n,r)=>n+r.headComparisons,0),feedbackKinds:kinds,duplicatePlayerRingSuppressed:true};
 });
 report.checks.push({name:'World compositor preserves V3 layering, party silhouettes, projectile coordinates and independent feedback',passed:true,details:result});
 assert.deepEqual(report.errors,[]);console.log('PASS · '+JSON.stringify(result));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'BROWSER.json'),JSON.stringify(report,null,2)+'\n');await browser?.close()});
