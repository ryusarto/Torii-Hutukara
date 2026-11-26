'use strict';
// Independent integration checks. HTTP only; no portable copies, user saves or
// claim of human gameplay. The art director owns the visual acceptance.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa',JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))).versao,'enemy-skill-fx-v1');
const url=process.argv[2];if(!/^https?:/.test(url||''))throw Error('Pass the current small HTTP export URL. Portable HTML is not supported.');
const registrationOnly=process.argv.includes('--registration-only');
const emittersOnly=process.argv.includes('--emitters-only');
const sceneDiffOnly=process.argv.includes('--scene-diff-only');
const scopedOnly=process.argv.includes('--scoped-only');
const report={method:'Independent Chromium integration, native enemy AI/timers and controlled collision fixtures. Not human/hardware playtest.',checks:[],errors:[],limits:['Occlusion numbers are indicative raster measurements, not artistic acceptance.','No full campaign, physical mobile/gamepad, FPS or memory benchmark.']};
let browser,page;
async function check(name,fn){if(scopedOnly&&!name.startsWith('Scoped native decoration')||registrationOnly&&!name.startsWith('Flight-core pivots')||emittersOnly&&!name.startsWith('Coro and minion')||sceneDiffOnly&&!name.startsWith('Actual drawEnv'))return;const details=await fn();report.checks.push({name,passed:true,details});console.log('OK · '+name)}
async function evaluate(fn,arg){return page.evaluate(fn,arg)}
async function shot(name){await page.screenshot({path:path.join(out,name+'.png')})}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
 page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 await page.goto(url,{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>!!window.EnemySkillFXV1,null,{polling:50,timeout:30000});
 await page.locator('#playtestEntry').waitFor({state:'detached'});
 report.sha256=await evaluate(async ()=>window.TORII_PLAYTEST_BUILD?.sourceSha256||null);if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.sha256,process.env.EXPECTED_SOURCE_SHA);
 await evaluate(async ()=>{
  window.__sf={
   async world(type,action='base',difficulty='normal'){await window.FinalAssetLoadingV1?.ready();
    G=fresh();G.flags.bass=G.flags.reveal=G.flags.voicesKatana=true;G.knownMembers=C3.unlockedRoster().slice();G.difficulty=difficulty;G.formation=['franco'];G.hp.franco=G.maxhp.franco=999;
    current=mk('forest',100,100,'grass');areas.forest=current;G.area='forest';G.x=G.y=50.5;mode='action';battle={id:'independent-skill-fx',boss:false};bossActor=null;
    keys={};touchDir={};resetMotion10();Input121.game=G;Input121.lastArea=G.area;Input121.focused=true;Input121.wasCoop=false;C3.pad.pads=[];
    act.invuln=999;companionCooldown=999;hostileShots=[];projectiles=[];combatFX.length=0;vfx.length=0;C3.synthZones=[];Special11.fields=[];Special11.traces=[];
    ToriiDificuldade.limparPerigos();CombatReadabilityV1.reset();EnemyVariantArtV2.reset();EnemySkillFXV1.reset();transitionAlpha=0;
    const distance=type==='tambor_escudo'||action==='cone'?1.4:action==='melee'?1:5;
    const e=hydrateEnemy({id:'independent_'+type,type,x:G.x-distance,y:G.y});e.cd=e.wind=e.stun=e.flash=0;e.face=0;current.enemies=[e];
    if(type==='coro_curador'&&action!=='melee'){const a=hydrateEnemy({id:'recipient',type:'hush',x:e.x+1,y:e.y+1});a.hp=Math.round(a.max*.3);a.cd=999;current.enemies.push(a);this.recipient=a;this.recipientHp=a.hp}else this.recipient=null;
    for(const id of['start','overlay','dialogue'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';
    cam.x=G.x*T-VW/2;cam.y=G.y*T-VH/2;this.enemy=e;this.action=action;this.sim=0;this.hazards=[];await window.FinalAssetLoadingV1?.ready();return e;
   },
   start(){updateEnemy(this.enemy,.001);this.hazards=ToriiDificuldade.perigos.filter(h=>h.dono===this.enemy);return this.hazards},
   tick(n=1,dt=.01){for(let i=0;i<n;i++){tick+=dt;update(dt);this.sim+=dt}},
   paint(){drawEnv()},
   state(){return JSON.stringify({G,act,enemies:current.enemies,shots:hostileShots,projectiles,perigos:ToriiDificuldade.perigos})},
   calls(fn){const im=ctx.drawImage,stroke=ctx.stroke,fill=ctx.fill,rect=ctx.fillRect;const images=[],rectangles=[];let strokes=0,fills=0;
    ctx.drawImage=function(image,...a){images.push({old:image===CombatReadabilityV1.image,skill:Object.values(EnemySkillFXV1.images).includes(image),src:a.slice(0,4),dest:a.slice(4)});return im.call(this,image,...a)};
    ctx.stroke=function(...a){strokes++;return stroke.apply(this,a)};ctx.fill=function(...a){fills++;return fill.apply(this,a)};ctx.fillRect=function(...a){rectangles.push(a);return rect.apply(this,a)};
    try{fn();return{images,strokes,fills,rectangles}}finally{ctx.drawImage=im;ctx.stroke=stroke;ctx.fill=fill;ctx.fillRect=rect}
   },
   async run(type,action,difficulty='normal'){
    await this.world(type,action,difficulty);const initial=EnemySkillFXV1.snapshot(),h=this.start(),owner=this.enemy;
    const releaseTimes=[];let previous=initial.stats.releases,maxSkew=0,n=0;
    const stop=type==='tambor_escudo'&&difficulty==='dificil'?1.36:type==='coro_curador'&&action==='melee'?.02:1.38;
    while(this.sim<stop&&n++<160){this.tick();const now=EnemySkillFXV1.snapshot();if(now.stats.releases>previous){releaseTimes.push({time:this.sim,count:now.stats.releases-previous});previous=now.stats.releases}
     if(h[0]&&owner.wind>0&&!(h[0].atraso>0))maxSkew=Math.max(maxSkew,Math.abs(Math.max(0,owner.wind)-Math.max(0,h[0].time)));
     this.paint();
     if(action!=='melee'&&h.every(q=>!ToriiDificuldade.perigos.includes(q))&&!(type==='tambor_escudo'&&difficulty==='dificil'))break;
    }
    return{type,action,difficulty,time:this.sim,hazards:h.map(q=>({kind:q.kind,r:q.r,len:q.len,width:q.width,arc:q.arc,max:q.max,angle:q.angle,damage:q.damage})),maxSkew,
     releaseTimes,releaseDelta:EnemySkillFXV1.snapshot().stats.releases-initial.stats.releases,meleeDelta:EnemySkillFXV1.snapshot().stats.melee-initial.stats.melee,
     healed:this.recipient?this.recipient.hp-this.recipientHp:null,spawned:current.enemies.filter(e=>e.f2chamado===owner.id).map(e=>({id:e.id,x:e.x,y:e.y})),
     snapshot:EnemySkillFXV1.snapshot(),shots:hostileShots.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy}))};
   }
  };
 });
 await check('Six image resources and ten authored clips decode on the HTTP build',async()=>{
  const r=await evaluate(async()=>{const a=EnemySkillFXV1;const loaded=await a.preload();return{loaded,clips:Object.keys(a.manifest.clips||{}),files:Object.keys(a.images),ready:a.readyAll()}});
  assert(r.loaded&&r.ready);assert.equal(r.clips.length,10);assert.equal(r.files.length,6);return r;
 });
 const actions=[['tambor_escudo','cone','tambor',.75],['muralha_estatica','cone','muralha',.8],['muralha_estatica','charge','muralha_charge',.9],['flautim_atirador','shot','flautim',.7],['coro_curador','heal','coro',1.15],['coro_curador','melee','coro_melee',0],['maestro_invocador','summon','maestro',1.3],['antena_feedback','beam','antena',1]];
 for(const[type,action,key,duration]of actions)await check('Native '+type+'/'+action+' preserves timing and uses its own material family',async()=>{
  const r=await evaluate(async ({type,action})=>await __sf.run(type,action),{type,action});
  if(duration){assert(r.hazards.length);assert(Math.abs(r.hazards[0].max-duration)<1e-9);assert(r.maxSkew<.02001);assert.equal(r.releaseDelta,1);assert(Math.abs(r.releaseTimes[0].time-duration)<.02001)}else assert.equal(r.meleeDelta,1);
  if(action==='heal')assert(r.healed>0);if(action==='summon')assert.equal(r.spawned.length,2);
  assert(r.snapshot.decoded.includes(key));return r;
 });
 for(const[type,action,count]of[['tambor_escudo','cone',2],['flautim_atirador','shot',1],['antena_feedback','beam',3]])await check('Hard '+type+' keeps the original delayed/spread pattern',async()=>{
  const r=await evaluate(async ({type,action})=>await __sf.run(type,action,'dificil'),{type,action});assert.equal(r.releaseDelta,count);
  if(type==='tambor_escudo'){assert.equal(r.hazards.length,2);assert(r.releaseTimes.length===2&&r.releaseTimes[1].time-r.releaseTimes[0].time>=.49)}
  if(type==='flautim_atirador'){assert.equal(r.snapshot.shots.length,3);assert.equal(new Set(r.shots.map(p=>Math.atan2(p.vy,p.vx).toFixed(3))).size,3)}
  if(type==='antena_feedback'){assert.equal(r.hazards.length,3);assert.equal(new Set(r.hazards.map(h=>h.angle.toFixed(3))).size,3)}return r;
 });
 await check('Drawing eight families changes no gameplay state/RNG and never revives the old glyph atlas',async()=>{
  const r=await evaluate(async actions=>{const rows=[];for(const[type,action]of actions){await __sf.run(type,action);const state=__sf.state(),old=Math.random;let randoms=0;Math.random=()=>{randoms++;return old()};let calls;try{calls=__sf.calls(()=>{for(let i=0;i<3;i++)__sf.paint()})}finally{Math.random=old}rows.push({type,action,unchanged:state===__sf.state(),randoms,oldGlyphs:calls.images.filter(d=>d.old).length,newRasterDraws:calls.images.filter(d=>d.skill).length})}return rows},actions);
  for(const q of r){assert(q.unchanged&&q.randoms===0);assert.equal(q.oldGlyphs,0)}return r;
 });
 await check('Pause, interrupted summon, dead caster and area change cannot leave orphan releases',async()=>{
  const r=await evaluate(async ()=>{const a=EnemySkillFXV1;await __sf.world('maestro_invocador','summon');__sf.start();__sf.tick(20);const clock=a.snapshot().clock;mode='overlay';__sf.tick(5);const paused=a.snapshot().clock===clock;mode='action';const releases=a.snapshot().stats.releases;hitEnemy(__sf.enemy,10,.6,0);__sf.tick(140);const cancelled=a.snapshot().stats.releases===releases&&current.enemies.filter(e=>e.f2chamado===__sf.enemy.id).length===0;
   await __sf.world('tambor_escudo','cone');__sf.start();const before=a.snapshot().stats.releases;__sf.enemy.hp=0;__sf.tick(100);const dead=a.snapshot().stats.releases===before;
   a.heal({x:G.x,y:G.y,valor:1});G.area='review_changed';update(0);const s=a.snapshot();return{paused,cancelled,dead,area:s.area,effects:s.effects.length,shots:s.shots.length}});
  assert(r.paused&&r.cancelled&&r.dead);assert.equal(r.area,'review_changed');assert.equal(r.effects,0);assert.equal(r.shots,0);return r;
 });
 await check('Charge trail/impact stop at the actual wall-limited endpoint',async()=>{
  const r=await evaluate(async ()=>{await __sf.world('muralha_estatica','charge');const e=__sf.enemy,start={x:e.x,y:e.y};for(let y=0;y<100;y++)solid(current,48,y);const h=__sf.start()[0];while(ToriiDificuldade.perigos.includes(h)&&__sf.sim<1.2)__sf.tick();const calls=__sf.calls(()=>__sf.paint()),s=EnemySkillFXV1.snapshot();return{start,end:{x:e.x,y:e.y},len:h.len,travelledPixels:Math.hypot(e.x-start.x,e.y-start.y)*T,materialWidths:calls.images.filter(d=>d.skill).map(d=>d.dest[2]),releases:s.recentReleases,effects:s.effects}});
  assert(r.end.x<48);assert(r.end.x-r.start.x<r.len);const q=r.releases.find(e=>e.key==='muralha_charge');assert(q&&Math.abs(q.endpointX-r.end.x)<1e-8&&Math.abs(q.endpointY-r.end.y)<1e-8);assert(r.materialWidths.some(w=>Math.abs(w-r.travelledPixels)<.1));return r;
 });
 await check('Flute contact is at its real collision point; expiry/clear do not create remote impacts',async()=>{
  const r=await evaluate(async ()=>{await __sf.run('flautim_atirador','shot');const a=EnemySkillFXV1,p=hostileShots[0],initial=a.snapshot().stats.impacts;const axis=Math.floor(p.x)+2;for(let y=0;y<100;y++)solid(current,axis,y);let n=0;while(hostileShots.includes(p)&&n++<120)__sf.tick();const hit=a.snapshot().effects.find(e=>e.kind==='projectile-contact');
   await __sf.run('flautim_atirador','shot');const expiry=hostileShots[0];expiry.time=.001;const beforeExpiry=a.snapshot().stats.impacts;__sf.tick();const expired=a.snapshot().stats.impacts===beforeExpiry;
   await __sf.run('flautim_atirador','shot');const beforeClear=a.snapshot().stats.impacts;hostileShots=[];__sf.tick();return{initial,hit,axis,expired,cleared:a.snapshot().stats.impacts===beforeClear}});
  assert(r.hit&&r.hit.x<r.axis&&r.hit.x>r.axis-.5);assert(r.expired&&r.cleared);return r;
 });
 await check('Cold assets preserve functional warnings and a small moving collision core only',async()=>{
  const r=await evaluate(async ()=>{await __sf.run('flautim_atirador','shot');const a=EnemySkillFXV1,p=hostileShots[0],old={...a.images};for(const key of Object.keys(a.images))a.images[key]=new Image();try{const e=__sf.enemy,h={kind:'line',x:e.x,y:e.y,len:7,width:.35,angle:0,time:.3,max:.7,damage:0,dono:e,area:G.area};const before=__sf.state(),calls=__sf.calls(()=>{a.ground(h,false,0,false);a.ground(h,false,0,true);a.projectile(p)});return{stateUnchanged:before===__sf.state(),ready:a.readyAll(),calls}}finally{Object.assign(a.images,old)}});
  assert(!r.ready&&r.stateUnchanged);assert.equal(r.calls.images.length,0);assert(r.calls.strokes>0);assert(r.calls.rectangles.some(x=>x[2]<=8&&x[3]<=4));return r;
 });
 await check('Budgets cap material/effects while warnings and dangerous flight stay visible',async()=>{
  const r=await evaluate(async ()=>{await __sf.run('flautim_atirador','shot');const a=EnemySkillFXV1,p=hostileShots[0],e=__sf.enemy,owner={type:'tambor_escudo',id:'budget-owner',x:G.x,y:G.y,hp:50};const h={kind:'cone',x:G.x,y:G.y,r:2.3,arc:.95,angle:0,time:0,max:.75,damage:8,dono:owner,area:G.area};a.release(h);__sf.paint();const before=a.snapshot(),world=__sf.state();for(let i=0;i<100;i++)a.ground(h,true,.08,false);const warned=a.snapshot().stats.warnings;for(let i=0;i<5;i++)a.ground({...h,time:.2},false,0,true);for(let i=0;i<30;i++)a.projectile(p);for(let i=0;i<80;i++)a.heal({x:e.x,y:e.y,valor:1});const after=a.snapshot();return{before,after,stateUnchanged:world===__sf.state(),functionalWarnings:after.stats.warnings-warned}});
  assert(r.stateUnchanged&&r.after.budget>=0);assert(r.after.stats.stamps-r.before.stats.stamps<=r.before.maxStamps);assert(r.after.effects.length<=r.after.maxEffects);assert(r.after.stats.skipped>r.before.stats.skipped);assert(r.after.stats.collisionCores>r.before.stats.collisionCores);assert.equal(r.functionalWarnings,5);return r;
 });
 await check('Raster release stays within native area; coverage/opacity are recorded without artistic approval',async()=>{
  const r=await evaluate(async ()=>{await __sf.world('tambor_escudo','cone');const e=__sf.enemy,h=__sf.start()[0];while(ToriiDificuldade.perigos.includes(h)&&__sf.sim<1)__sf.tick();const a=EnemySkillFXV1;cam.x=h.x*T-200;cam.y=h.y*T-220;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,VW,VH);a.ground(h,true,.08,false);const drawn=ctx.getImageData(0,0,VW,VH).data;ctx.restore();const mask=document.createElement('canvas');mask.width=VW;mask.height=VH;const q=mask.getContext('2d');q.translate(h.x*T-cam.x,h.y*T-cam.y);q.rotate(h.angle||0);q.fill(CombatReadabilityV1.geometry(h));const m=q.getImageData(0,0,VW,VH).data;let visible=0,strong=0,outside=0,area=0;for(let i=3;i<drawn.length;i+=4){if(m[i])area++;if(drawn[i]>8){visible++;if(m[i]===0)outside++}if(drawn[i]>192)strong++}const boxes={torso:[180,165,40,40],feet:[180,210,40,20]},regions={};for(const[name,[x,y,w,h]]of Object.entries(boxes)){let covered=0,opaque=0;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const alpha=drawn[(yy*VW+xx)*4+3];if(alpha>32)covered++;if(alpha>192)opaque++}regions[name]={box:boxes[name],coverage:covered/(w*h),opaqueCoverage:opaque/(w*h)}}return{visible,strong,outside,area,coverage:area?visible/area:0,opaqueCoverage:area?strong/area:0,indicativeEmitterRegions:regions}});
  assert(r.visible>0);assert.equal(r.outside,0);assert(r.coverage<1);return r;
 });
 // Frozen bright-core anchors of the approved V2 atlas (V1 used other pixels).
 await check('Flight-core pivots and fixed beam content bounds align with native coordinates',async()=>{
  const r=await evaluate(async()=>{const a=EnemySkillFXV1;await a.preload();await __sf.run('flautim_atirador','shot');const p=hostileShots[0],pivots={3:[94.47,68.51],4:[95.29,67.44],5:[95.02,68.02]},flight=[];
   for(let i=0;i<3;i++){
    let captured=null;const originalDraw=ctx.drawImage;
    ctx.drawImage=function(image,...args){
     if(image===a.image('flautim')){
      const m=ctx.getTransform(),clip=a.manifest.clips.flautim,c=clip.cell||a.manifest.cell||128,cols=clip.columns||a.manifest.columns||4;
      const frame=args[1]/c*cols+args[0]/c-(clip.rowOffset||0)*cols,anchor=pivots[frame];
      if(anchor){const x=args[4]+anchor[0]*args[6]/c,y=args[5]+anchor[1]*args[7]/c;captured={frame,pivot:anchor,core:[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f],expected:[Math.round(p.x*T-cam.x),Math.round(p.y*T-cam.y)]}}
     }
     return originalDraw.call(this,image,...args);
    };
    try{a.projectile(p)}finally{ctx.drawImage=originalDraw}
    flight.push(captured);if(i<2)__sf.tick(1,.071);
   }
   await __sf.run('antena_feedback','beam');const h=__sf.hazards[0];cam.x=h.x*T-150;cam.y=h.y*T-220;const clip=a.manifest.clips.antena,c=clip.cell||a.manifest.cell||128,bounds=clip.contentBounds||[0,0,c,c];let beam=null;const old=ctx.drawImage;
   ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,VW,VH);ctx.drawImage=function(image,...args){if(image===a.image('antena')){const m=ctx.getTransform(),x0=args[4]+bounds[0]*args[6]/c,x1=args[4]+bounds[2]*args[6]/c;beam={contentBounds:bounds,factor:c/(bounds[2]-bounds[0]),drawWidth:args[6],projectedStart:m.a*x0+m.e,projectedEnd:m.a*x1+m.e,expectedStart:h.x*T-cam.x,expectedEnd:(h.x+h.len)*T-cam.x,span:h.len*T}}return old.call(this,image,...args)};
   try{a.ground(h,true,.075,false)}finally{ctx.drawImage=old}const pixels=ctx.getImageData(0,0,VW,VH).data;ctx.restore();let count=0,minX=VW,maxX=-1,columns=new Set();for(let y=0;y<VH;y++)for(let x=0;x<VW;x++)if(pixels[(y*VW+x)*4+3]>8){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);columns.add(x)}return{flight,beam,gate:window.FinalAssetLoadingV1?.snapshot(),beamRaster:{pixels:count,minX,maxX,columns:columns.size}}});
  assert.equal(new Set(r.flight.map(p=>p?.frame)).size,3);for(const q of r.flight)assert(q&&q.core.every((v,i)=>Math.abs(v-q.expected[i])<.001),JSON.stringify({flight:r.flight,gate:r.gate}));assert(r.beam);assert(Math.abs(r.beam.projectedStart-r.beam.expectedStart)<.001&&Math.abs(r.beam.projectedEnd-r.beam.expectedEnd)<.001);assert(r.beamRaster.pixels>0);return r;
 });
 await check('Coro and minion emitter registration preserves feet, cache, drawing state and pause',async()=>{
  const r=await evaluate(async()=>{
   const a=EnemySkillFXV1;await a.preload();const cached={...a.images};await a.preload();
   const cacheSame=Object.keys(cached).length===6&&Object.keys(cached).every(k=>a.images[k]===cached[k]),rows=[];
   for(const[type,action,key,w,h,pivot]of[['coro_curador','heal','coro',62,82,[64,105]],['maestro_invocador','summon','maestro_emerge',64,84,[64,90]]]){
    await __sf.run(type,action);const snap=a.snapshot(),before=__sf.state(),captured=[],originalDraw=ctx.drawImage;
    ctx.drawImage=function(image,...args){
     if(image===a.image(key)&&Math.abs(args[6]-w)<.001&&Math.abs(args[7]-h)<.001){
      const m=ctx.getTransform(),c=128,x=args[4]+pivot[0]*args[6]/c,y=args[5]+pivot[1]*args[7]/c;
      const tile=document.createElement('canvas');tile.width=tile.height=c;const q=tile.getContext('2d');q.drawImage(image,...args.slice(0,4),0,0,c,c);const pixels=q.getImageData(0,0,c,c).data;let bottom=0;
      for(let yy=0;yy<c;yy++)for(let xx=0;xx<c;xx++)if(pixels[(yy*c+xx)*4+3]>8)bottom=Math.max(bottom,yy+1);
      const edgeY=args[5]+bottom*args[7]/c;
      captured.push({anchor:[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f],pivot,sourceBottom:bottom,visibleBottom:m.b*x+m.d*edgeY+m.f});
     }
     return originalDraw.call(this,image,...args);
    };
    try{__sf.paint()}finally{ctx.drawImage=originalDraw}
    const targets=key==='coro'?snap.effects.filter(e=>e.kind==='heal').map(e=>({x:e.x,y:e.y,anchorY:e.y*T-cam.y-15*e.age/e.duration})):snap.emergences.map(e=>({x:e.x,y:e.y,anchorY:e.y*T-cam.y-7}));
    for(let i=0;i<captured.length;i++){
     const target=targets.slice().sort((p,q)=>Math.abs(Math.round(p.x*T-cam.x)-captured[i].anchor[0])-Math.abs(Math.round(q.x*T-cam.x)-captured[i].anchor[0]))[0];
     captured[i].expected=target?[Math.round(target.x*T-cam.x),Math.round(target.anchorY)]:null;captured[i].footY=target?target.y*T-cam.y:null;
    }
    const unchanged=before===__sf.state(),clock=a.snapshot().clock,pausedEffects=JSON.stringify(a.snapshot().effects),phases=JSON.stringify(a.snapshot().emergences);
    mode='overlay';__sf.tick(5);const frozen=clock===a.snapshot().clock&&pausedEffects===JSON.stringify(a.snapshot().effects)&&phases===JSON.stringify(a.snapshot().emergences);mode='action';
    rows.push({type,key,targets:targets.length,captured,unchanged,frozen});
   }
   return{ready:a.readyAll(),files:Object.keys(a.images).length,cacheSame,rows};
  });
  assert(r.ready&&r.files===6&&r.cacheSame);for(const row of r.rows){assert(row.unchanged&&row.frozen&&row.captured.length===row.targets,JSON.stringify(row));assert.equal(row.targets,row.key==='coro'?1:2);for(const q of row.captured){assert(q.expected&&q.anchor.every((v,i)=>Math.abs(v-q.expected[i])<.001));assert(q.visibleBottom<=q.footY+1)}}return r;
 });
 for(const terrain of['grass','ruins'])for(const type of['tambor_escudo','antena_feedback'])await check('Actual drawEnv final pixels retain '+type+' material on '+terrain,async()=>{
  await evaluate(async({terrain,type})=>{
   const a=EnemySkillFXV1;await a.preload();await __sf.world(type,type==='tambor_escudo'?'cone':'beam');
   if(terrain==='ruins'){
    buildMaps();setArea('ruins',35.4,18.5,false);transitionAlpha=0;mode='action';battle={id:'independent-scene-fx',boss:false};bossActor=null;current.enemies=[];hostileShots=[];combatFX.length=0;vfx.length=0;ToriiDificuldade.limparPerigos();CombatReadabilityV1.reset();EnemyVariantArtV2.reset();a.reset();
    const e=hydrateEnemy({id:'independent_'+type,type,x:G.x+(type==='tambor_escudo'?1.4:5),y:G.y});e.cd=e.wind=e.stun=e.flash=0;e.face=Math.PI;current.enemies=[e];__sf.enemy=e;
   }
   // The real ruins transition and its replacement fixture actor both own
   // scene resources. Finish their gate before native AI/timers are advanced.
   await FinalAssetLoadingV1.start({force:true});await FinalAssetLoadingV1.ready();
   if(FinalAssetLoadingV1.busy()||FinalAssetLoadingV1.snapshot().error)throw Error('Scene-diff fixture final art is not ready');
   __sf.start();while(__sf.hazards.some(h=>ToriiDificuldade.perigos.includes(h))&&__sf.sim<1.4)__sf.tick();__sf.tick(8);
   cam.x=G.x*T-VW/2;cam.y=G.y*T-VH/2;__sf.paint();
   await EnemyVariantArtV2.image(type).decode();await ProtagonistArtV5.image('franco_idle').decode();
   window.__sceneNative={type,terrain};
  },{terrain,type});
  if(await evaluate(async ()=>!!window.ToriiMedia))await page.waitForFunction(()=>ToriiMedia.idle(),null,{polling:50,timeout:30000});
  const r=await evaluate(async ()=>{
   const a=EnemySkillFXV1,{type,terrain}=__sceneNative,key=type==='tambor_escudo'?'tambor':'antena',image=a.image(key),h=__sf.hazards[0];
   const rawCam={x:cam.x,y:cam.y},initialPainter={alpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation},originalGround=a.ground,originalDraw=ctx.drawImage,originalRandom=Math.random,originalNow=performance.now,originalDate=Date.now;
   const frozenNow=performance.now(),frozenDate=Date.now(),frozenTick=tick,frozenClock=a.snapshot().clock,state=__sf.state();let draws=[];
   const delta=(p,q)=>{let pixels=0,above4=0,above12=0,max=0,sum=0;for(let i=0;i<p.length;i+=4){const d=Math.max(Math.abs(p[i]-q[i]),Math.abs(p[i+1]-q[i+1]),Math.abs(p[i+2]-q[i+2]));if(d){pixels++;sum+=d;if(d>4)above4++;if(d>12)above12++;max=Math.max(max,d)}}return{pixels,above4,above12,maxRGB:max,meanOnChanged:pixels?sum/pixels:0}};
   Math.random=()=>.5;performance.now=()=>frozenNow;Date.now=()=>frozenDate;
   function paint(material){
    cam.x=rawCam.x;cam.y=rawCam.y;ctx.globalAlpha=initialPainter.alpha;ctx.globalCompositeOperation=initialPainter.composite;
    a.ground=function(q,release,age,foreground){if(!material&&release&&!foreground&&q.dono===__sf.enemy)return true;return originalGround.apply(this,arguments)};
    ctx.drawImage=function(im,...args){
     if(im!==image)return originalDraw.call(this,im,...args);
     const before=ctx.getImageData(0,0,VW,VH).data,m=ctx.getTransform(),alpha=ctx.globalAlpha,composite=ctx.globalCompositeOperation;
     const tile=document.createElement('canvas');tile.width=args[2];tile.height=args[3];const q=tile.getContext('2d');q.drawImage(im,...args.slice(0,4),0,0,args[2],args[3]);const pixels=q.getImageData(0,0,args[2],args[3]).data;let peak=0;for(let i=3;i<pixels.length;i+=4)peak=Math.max(peak,pixels[i]);
     const result=originalDraw.call(this,im,...args);draws.push({source:args.slice(0,4),destination:args.slice(4),alpha,composite,sourcePeakAlpha:peak,effectivePeakAlpha:peak*alpha,transform:[m.a,m.b,m.c,m.d,m.e,m.f],instantDelta:delta(before,ctx.getImageData(0,0,VW,VH).data)});return result;
    };
    drawEnv();return ctx.getImageData(0,0,VW,VH).data;
   }
   let base1,full1,base2,full2;
   try{base1=paint(false);full1=paint(true);base2=paint(false);full2=paint(true)}
   finally{a.ground=originalGround;ctx.drawImage=originalDraw;Math.random=originalRandom;performance.now=originalNow;Date.now=originalDate;cam.x=rawCam.x;cam.y=rawCam.y}
   return{type,terrain,initialPainter,hazard:{kind:h.kind,r:h.r,len:h.len,width:h.width,arc:h.arc},baselineNoise:delta(base1,base2),repeatNoise:delta(full1,full2),finalMaterialDelta:delta(base2,full2),draws,unchanged:state===__sf.state(),tickUnchanged:tick===frozenTick,clockUnchanged:a.snapshot().clock===frozenClock};
  });
  assert(r.unchanged&&r.tickUnchanged&&r.clockUnchanged);assert.equal(r.baselineNoise.pixels,0);assert.equal(r.repeatNoise.pixels,0);assert(r.draws.length>=2&&r.draws.every(d=>d.composite==='source-over'&&d.alpha>0&&d.effectivePeakAlpha>0));assert(r.finalMaterialDelta.pixels>0&&r.finalMaterialDelta.above4>0);return r;
 });
 for(const [type,action,source,expected,step=.01] of [['tambor_escudo','cone','native-danger-release-decoration',1],['maestro_invocador','summon','native-maestro-minion-spawn-decoration',2,.01],['maestro_invocador','summon','native-maestro-minion-spawn-decoration',2,.05],['muralha_estatica','charge','native-charge-terminal-decoration',1]].filter(([type])=>!process.env.SCOPED_TYPE||process.env.SCOPED_TYPE===type))await check('Scoped native decoration '+source+' dt='+step+' preserves foreign objects and restores the list',async()=>{
  const r=await evaluate(async ({type,action,source,expected,step})=>{
   await __sf.world(type,action);const old={kind:'duo',x:1,y:1,r:1,time:999,max:999};combatFX.push(old);__sf.start();while(__sf.hazards.some(h=>ToriiDificuldade.perigos.includes(h))&&__sf.sim<1.5)__sf.tick(1,step);
   const tagged=EnemySkillFXV1.snapshot().hiddenLegacyRings.filter(f=>f.source===source),used=new Set(),owned=tagged.map(q=>{const f=combatFX.find(f=>!used.has(f)&&f.kind===q.kind&&f.x===q.x&&f.y===q.y&&f.r===q.r&&f.time===q.time);used.add(f);return f});
   if(tagged.length!==expected)return{type,source,expected,tagged:tagged.length,sim:__sf.sim,rawFX:combatFX.map(f=>({...f})),actors:current.enemies.map(e=>({id:e.id,f2chamado:e.f2chamado,f2surge:e.f2surge,f2tonto:e.f2tonto,hp:e.hp})),snapshot:EnemySkillFXV1.snapshot()};
   const list=combatFX,refs=list.slice(),state=__sf.state(),hiddenReads={n:0};for(const f of owned){const v=f.r;Object.defineProperty(f,'r',{configurable:true,enumerable:true,get(){hiddenReads.n++;return v}})}
   const foreign={...owned[0]},appended={kind:'duo',x:3,y:3,r:1,time:.36,max:.36};let foreignReads=0,append=false,throwing=false;const radius=foreign.r;
   Object.defineProperty(foreign,'r',{configurable:true,enumerable:true,get(){foreignReads++;if(throwing)throw Error('independent delegated paint failure');if(!append){append=true;combatFX.push(appended)}return radius}});list.push(foreign);hiddenReads.n=0;drawCombatLayer();
   const normal={identity:combatFX===list,oldPreserved:list.includes(old),references:refs.every(f=>list.includes(f)),hiddenReads:hiddenReads.n,foreignReads,appended:list.includes(appended),foreignNotTagged:EnemySkillFXV1.snapshot().hiddenLegacyRings.filter(f=>f.source===source).length===expected};
   const bytes=JSON.stringify(list);throwing=true;let threw=false;try{drawCombatLayer()}catch(e){threw=/independent delegated paint failure/.test(e.message)}finally{throwing=false}
   return{type,source,expected,step,nativeAges:tagged.map(f=>({nativeFrameDt:f.nativeFrameDt,observedNativeAge:f.observedNativeAge})),tagged:tagged.length,normal,exception:{threw,identity:combatFX===list,bytes:bytes===JSON.stringify(list)},unchanged:state===__sf.state()};
  },{type,action,source,expected,step});
  report.lastScopedProbe=r;assert.equal(r.tagged,expected);if(type==='maestro_invocador')assert(r.nativeAges.every(q=>Math.abs(q.nativeFrameDt-step)<1e-8&&Math.abs(q.observedNativeAge-step)<1e-8));assert(r.unchanged);assert(r.normal.identity&&r.normal.oldPreserved&&r.normal.references&&r.normal.appended&&r.normal.foreignNotTagged);assert.equal(r.normal.hiddenReads,0);assert(r.normal.foreignReads>0);assert(r.exception.threw&&r.exception.identity&&r.exception.bytes);return r;
 });
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({passed:report.checks.length,sha256:report.sha256,errors:report.errors}));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,scopedOnly?'SCOPED_DECORATIONS_BROWSER.json':sceneDiffOnly?'SCENE_DIFF_BROWSER.json':emittersOnly?'EMITTER_REGISTRATION_BROWSER.json':registrationOnly?'REGISTRATION_BROWSER.json':'INDEPENDENT_BROWSER.json'),JSON.stringify(report,null,2)+'\n');await browser?.close()});
