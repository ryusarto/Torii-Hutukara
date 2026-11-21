// Paired screenshots from actual combat. Record each release against identical fixtures.
// node qa/hero_vfx_preview.cjs URL ignored-output-directory
'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
async function install(){
 window.requestAnimationFrame=()=>0;
 Object.defineProperty(navigator,'getGamepads',{value:()=>[]});
}
async function prepare(){
 C3.loadDeferredImages();
 await CenariosV2.ready();
 for(const image of Object.values(C3.images))await image.decode();
 await EnemyArtV1.image('hush').decode();
 window.captureArrow=()=>{
  if(!projectiles.length)throw Error('A flecha precisa estar em voo');
  const actual=projectiles[0],x=actual.x*T-cam.x,y=actual.y*T-cam.y;
  const rect=[Math.round(x)-64,Math.round(y)-64,128,128];
  const t=HeroAttackFX.clock;HeroAttackFX.clock=.20;
  const original=[...projectiles];let on,off;
  try{
   function isolated(){
    ctx.save();ctx.resetTransform();ctx.clearRect(0,0,cv.width,cv.height);drawCombatLayer();ctx.restore();
    return ctx.getImageData(...rect).data;
   }
   projectiles=[];off=isolated();projectiles=[actual];on=isolated();
  }finally{projectiles=original;HeroAttackFX.clock=t}
  const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d');
  const delta=q.createImageData(128,128);
  for(let i=0;i<on.length;i+=4){
   if(on[i]===off[i]&&on[i+1]===off[i+1]&&on[i+2]===off[i+2]&&on[i+3]===off[i+3])continue;
   delta.data.set(on.slice(i,i+4),i);
  }
  q.putImageData(delta,0,0);return c.toDataURL('image/png').split(',')[1];
 };
 window.captureMove=async(hero,action,group=false)=>{
  const art=hero==='synth'||hero==='percussion'?MusicianArtV1:hero==='alt'||hero==='katana'?NinjaArcherArtV1:ProtagonistArtV5;
  const state=['attack_1','skill','advanced','signature','attack_2','attack_3'][action];
  G=fresh();G.active=hero;G.formation=group?[hero,...['alt','katana','ryuchi'].filter(id=>id!==hero).slice(0,2)]:[hero];
  G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;G.flags.masks=false;
  G.c3.started=G.c3.synthUnlocked=G.c3.percussionUnlocked=true;
  G.hp[hero]=G.maxhp[hero]=80;G.levels[hero]=5;G.resonance=100;G.area='forest';G.x=23.5;G.y=19.5;G.dir='right';G.aim091=[1,0];
  current=mk('forest',48,40,'grass');current.npcs=[];current.props=[];current.enemies=[];
  const dist=group?3.25:hero==='alt'?4:hero==='synth'?2.2:1.75;
  if(group){
   G.party3=true;G.thirdSlot=G.formation[2];
   G.formation.forEach(id=>{G.hp[id]=G.maxhp[id]=80});
   trail=[{x:G.x-.72,y:G.y-.43,dir:'right'},{x:G.x-1.48,y:G.y-.07,dir:'right'}];
  }
  const enemy=hydrateEnemy({id:'preview-target',type:'hush',x:G.x+dist,y:G.y});
  enemy.hp=enemy.max=99999;enemy.cd=enemy.stun=99;current.enemies.push(enemy);
  mode='action';battle={boss:false,id:'field'};bossActor=null;
  resetMotion10();menuOpen=false;keys={};touchDir={};tick=15;attackHeld=false;following=[];projectiles=[];hostileShots=[];combatFX.length=0;companionCooldown=90;
  Object.assign(act,{skill:0,skillX:0,duo:0,dashCD:0,cool:0,hit:0,invuln:0,combo:0,comboTime:0});
  C3.pad.pads=[];C3.coop.member=null;C3.synthWave=0;C3.synthZones=[];C3.percussionGuard=0;C3.hazards=[];screenShake=0;transitionAlpha=0;
  Combat10.area=G.area;Combat10.active=hero;Input121.game=G;Input121.lastArea=G.area;Input121.wasCoop=false;Input121.focused=true;
  art.reset();if(art===MusicianArtV1)art.setVariant(hero,'unmasked');
  const key=s=>art===MusicianArtV1?art.key(hero,'unmasked',s):hero+'_'+s;
  await Promise.all([art.image(key('idle')).decode(),art.image(key(state)).decode(),HeroAttackBody.sheet(hero,'unmasked').decode()]);
  HeroAttackFX.sync();HeroAttackFX.prepare();
  if(HeroAttackFX.v2Sources?.[hero]){
   HeroAttackFX.ready(hero);
   await HeroAttackFX.v2Images[hero].decode();
  }
  // Warm the active weapon sheet before measuring the accepted action. Swapping the
  // two draws in a stationary frame isolates the cast's contribution on the real floor.
  await Promise.all(Object.values(HeroAttackFX).filter(x=>x instanceof HTMLImageElement).map(x=>x.decode()));
  const ow=256,oh=154,frames=36,at=5,fps=24;
  const sheet=document.createElement('canvas');sheet.width=6*ow;sheet.height=6*oh;
  const q=sheet.getContext('2d');q.imageSmoothingEnabled=false;
  const stats=[],arrows=[];let arrowPng=null,healthWhenPressed=enemy.hp;
  const origin={x:G.x*T,y:G.y*T},targetAtStart={x:enemy.x*T,y:enemy.y*T};VW=768;VH=432;cv.width=VW;cv.height=VH;ctx.imageSmoothingEnabled=false;
  const camera=()=>{cam.x=origin.x-285;cam.y=origin.y-230;screenShake=0};
  for(let n=0;n<frames;n++){
   if(n===at){
    if(action>=4){
     const prior=action===4?1:2;
     for(let i=0;i<prior;i++){attackAction();for(let j=0;act.cool>0&&j<120;j++){tick+=1/120;update(1/120)}}
    }
    healthWhenPressed=enemy.hp;
    [attackAction,skillAction,advancedSkill,duoAction,attackAction,attackAction][action]();
   }
   // Capture both a guard activation and its actual successful counter.
   if(n===at+2 && ((hero==='katana'&&action===2)||(hero==='percussion'&&action===1))){act.invuln=0;damageHero(5,enemy)}
   // Let staged effects use their authored callbacks on real time, including drum breaks.
   if(n>0){await new Promise(resolve=>setTimeout(resolve,1000/fps));for(let s=0;s<3;s++){tick+=1/(fps*3);update(1/(fps*3))}}
   camera();drawEnv();
   const left=Math.round(origin.x-cam.x-68),top=Math.round(origin.y-cam.y-95);
   q.drawImage(cv,left,top,ow,oh,(n%6)*ow,Math.floor(n/6)*oh,ow,oh);
   const actual=ctx.getImageData(left,top,ow,oh).data;
   let weaponPixels=null;
   if(typeof HeroAttackFX.drawV2==='function'){
    const drawV2=HeroAttackFX.drawV2;
    try{HeroAttackFX.drawV2=()=>false;camera();drawEnv()}finally{HeroAttackFX.drawV2=drawV2}
    const legacy=ctx.getImageData(left,top,ow,oh).data;
    weaponPixels=0;
    for(let i=0;i<actual.length;i+=4)if(Math.abs(actual[i]-legacy[i])+Math.abs(actual[i+1]-legacy[i+1])+Math.abs(actual[i+2]-legacy[i+2])>42)weaponPixels++;
   }
   const draw=HeroAttackFX.draw;
   try{HeroAttackFX.draw=()=>{};camera();drawEnv()}finally{HeroAttackFX.draw=draw}
   const other=ctx.getImageData(left,top,ow,oh).data;let marked=0,minX=ow,minY=oh,maxX=-1,maxY=-1;
   for(let i=0;i<actual.length;i+=4)if(Math.abs(actual[i]-other[i])+Math.abs(actual[i+1]-other[i+1])+Math.abs(actual[i+2]-other[i+2])>42){
    const x=i/4%ow,y=Math.floor(i/(4*ow));marked++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   }
   let groupRead=null;
   if(group){
    const allies=[G,...partyMembers().filter(id=>id!==G.active).map((_,index)=>getFollower(index))];
    const points=allies.map(actor=>({x:Math.round(actor.x*T-cam.x-left),y:Math.round(actor.y*T-cam.y-top)}));
    const face=allies.map(()=>0),torso=allies.map(()=>0);
    let ahead=0,contact=0,atOriginalTarget=0,atSpriteEdge=0,sumX=0;
    const ex=enemy.x*T-cam.x-left,ey=enemy.y*T-cam.y-top-19;
    const creature=drawCreature;
    try{
     HeroAttackFX.draw=()=>{};
     drawCreature=(x,y,kind,actor)=>{if(actor!==enemy)creature(x,y,kind,actor)};
     camera();drawEnv();
    }finally{HeroAttackFX.draw=draw;drawCreature=creature}
    const absent=ctx.getImageData(left,top,ow,oh).data,outline=new Uint8Array(ow*oh);
    for(let y=Math.max(0,Math.floor(ey-40));y<Math.min(oh,ey+21);y++)for(let x=Math.max(0,Math.floor(ex-38));x<Math.min(ow,ex+39);x++){
     const i=(y*ow+x)*4;
     if(Math.abs(absent[i]-other[i])+Math.abs(absent[i+1]-other[i+1])+Math.abs(absent[i+2]-other[i+2])<=42)continue;
     for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++)if(dx*dx+dy*dy<=16)outline[(y+dy)*ow+x+dx]=1;
    }
    for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){
     const i=(y*ow+x)*4;
     if(Math.abs(actual[i]-other[i])+Math.abs(actual[i+1]-other[i+1])+Math.abs(actual[i+2]-other[i+2])<=42)continue;
     sumX+=x;
     if(x>points[0].x+12)ahead++;
     if(Math.hypot(x-ex,y-ey)<=17)contact++;
     if(outline[y*ow+x])atSpriteEdge++;
     if(Math.hypot(x-(targetAtStart.x-cam.x-left),y-(targetAtStart.y-cam.y-top-19))<=17)atOriginalTarget++;
     points.forEach((p,j)=>{
      if(Math.abs(x-p.x)<=6&&y>=p.y-43&&y<=p.y-31)face[j]++;
      if(Math.abs(x-p.x)<=8&&y>=p.y-30&&y<=p.y-12)torso[j]++;
     });
    }
    groupRead={points,face,torso,ahead,contact,atOriginalTarget,atSpriteEdge,centerX:marked?Math.round(sumX/marked):null,target:[ex,ey]};
   }
   stats.push({frame:n,marked,weaponPixels,...(group?{groupRead}:{}),bounds:marked?[minX,minY,maxX,maxY]:null,hero:[G.x,G.y],enemyHp:enemy.hp,stance:art.players?.[0]?.state||null});
   if(hero==='alt'&&action===0&&projectiles.length&&n===at+2)arrowPng=captureArrow();
   if(hero==='alt'&&action===0&&projectiles.length)arrows.push({frame:n,shot:{x:projectiles[0].x,y:projectiles[0].y,vx:projectiles[0].vx,vy:projectiles[0].vy,arrow:projectiles[0].arrow}});
  }
  return {arrowPng,png:sheet.toDataURL('image/png').split(',')[1],stats,arrows,healthWhenPressed,dimensions:{width:ow,height:oh,frames,columns:6,fps,inputFrame:at}};
 };
}
(async()=>{
 const [url,out]=process.argv.slice(2);assert(url&&out);fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(install);
  const entry=await page.goto(url,{timeout:120000,waitUntil:'load'});
  await page.evaluate(prepare);const info=await(await page.request.get(new URL('build-info.json',url).href)).json();
  assert.equal(createHash('sha256').update(await entry.body()).digest('hex'),info.indexSha256,'A página e o manifesto devem vir da mesma exportação');
  const report={version:info.version,sha:info.sourceSha256,cases:{},errors};
  for(const hero of ['franco','ryuchi','alt','katana','synth','percussion'])for(let i=0;i<(hero==='alt'?4:6);i++){
   const group=!!process.env.PREVIEW_GROUP_ONLY;
   if(group&&i!==3)continue;
   if(process.env.PREVIEW_EXTRA_ONLY&&hero!=='synth'&&i<4)continue;
   if(process.env.PREVIEW_ARROW_ONLY&&(hero!=='alt'||i!==0))continue;
   const key=hero+'_'+['basic','skill','advanced','super','second','third'][i];
   const r=await page.evaluate(([h,a,g])=>captureMove(h,a,g),[hero,i,group]);fs.writeFileSync(path.join(out,key+'.png'),Buffer.from(r.png,'base64'));delete r.png;if(r.arrowPng)fs.writeFileSync(path.join(out,'ARROW.png'),Buffer.from(r.arrowPng,'base64'));delete r.arrowPng;report.cases[key]=r;console.log(key,Math.max(...r.stats.map(s=>s.marked)));
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,process.env.PREVIEW_ARROW_ONLY?'arrow-capture.json':process.env.PREVIEW_EXTRA_ONLY?'extra-captures.json':'captures.json'),JSON.stringify(report)+'\n');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
