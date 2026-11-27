'use strict';
// The shipped compositor: floor -> actors -> compact allied FX -> warnings.
// Warm geometry coverage complements first_cast_visibility_v1's cold real RAF.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL,fileURLToPath}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const input=process.argv[2]||pathToFileURL(path.join(root,'game/builds',version.versao,'TORII_HUTUKARA_'+version.sufixo+'.html')).href;
const out=path.resolve(process.env.HERO_VFX_LAYERS_OUT||path.join(root,'qa',version.versao,'hero-vfx-layers-v3'));
const report={input,method:'Actual V3 runtime in isolated Chromium; warm compositor interception, exact coordinates and face-detail retention. Cold final-pixel coverage is separate. No physical hardware or human playtest.',checks:[],errors:[]};let browser;
(async()=>{
 if(input.startsWith('file:'))report.sourceSha256=await new Promise((resolve,reject)=>{const hash=crypto.createHash('sha256'),stream=fs.createReadStream(fileURLToPath(input));stream.on('data',b=>hash.update(b));stream.on('error',reject);stream.on('end',()=>resolve(hash.digest('hex')))});
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--disable-gpu']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});await page.goto(input,{waitUntil:'load',timeout:120000});
 if(!report.sourceSha256)report.sourceSha256=await page.evaluate(()=>TORII_PLAYTEST_BUILD.sourceSha256);if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.sourceSha256,process.env.EXPECTED_SOURCE_SHA);
 await page.waitForFunction(()=>typeof HeroAttackFX!=='undefined'&&HeroAttackFX.v3Sources);await page.evaluate(require('./hero_attack_fixture.cjs'));
 const result=await page.evaluate(async()=>{
  const check=(ok,label)=>{if(!ok)throw Error(label)},fx=HeroAttackFX;
  // A killed/removed target can precede the first visual sample. A cached edge
  // isolates coordinate math from art decoding and the current enemy renderer.
  await heroAttackArena('franco');const previousEnemies=current.enemies,previousBoss=bossActor;
  const target={x:50,y:60},angle=.37,hit={x:5,y:6,target,edge:{x:2,y:-3},edgeAngle:angle};current.enemies=[];bossActor=null;
  for(const phase of[0,.25,1]){const p=fx.contactPoint(hit,angle,phase);check(Number.isFinite(p.x)&&Number.isFinite(p.y),'Removed first contact became NaN at phase '+phase);check(Math.abs(p.x-(5*T-cam.x+2))<1e-8&&Math.abs(p.y-(6*T-cam.y-3))<1e-8,'Removed first contact lost original impact point')}
  current.enemies=[target];target.x=7;target.y=9;fx.contactPoint(hit,angle,1);current.enemies=[];target.x=99;target.y=99;
  const remembered=fx.contactPoint(hit,angle,1);check(Math.abs(remembered.x-(7*T-cam.x+2))<1e-8&&Math.abs(remembered.y-(9*T-cam.y-3))<1e-8,'Removed target lost last observed position');current.enemies=previousEnemies;bossActor=previousBoss;
  // Separate renderer-backed unit: a real enemy object removed before its
  // first contact sample, with no prefilled hit.edge or species edge cache.
  const removed=hydrateEnemy({id:'removed_uncached_unit',type:'hush',x:5,y:6});removed.hp=0;current.enemies=[];bossActor=null;
  const removedKey=EnemyArtV1.key(removed.type,removed);await EnemyArtV1.image(removedKey).decode();const savedEdge=fx.enemyEdges.get(removedKey);fx.enemyEdges.delete(removedKey);
  const uncached={x:5,y:6,target:removed},edgePhases=[];check(!current.enemies.includes(removed)&&!uncached.edge&&!fx.enemyEdges.has(removedKey),'Uncached removed-object unit was already prepared');
  for(const phase of[0,.25,1]){const point=fx.contactPoint(uncached,angle,phase);check(Number.isFinite(point.x)&&Number.isFinite(point.y),'Uncached real removed enemy produced NaN');check(Math.abs(point.x-(5*T-cam.x+uncached.edge.x))<1e-8&&Math.abs(point.y-(6*T-cam.y+uncached.edge.y))<1e-8,'Real edge lost removed impact point');edgePhases.push({phase,point})}
  const realRemovedEdge={targetObject:true,removedFromCurrent:!current.enemies.includes(removed),cachedEdgeBefore:false,calculatedFromActualDecodedEnemy:fx.enemyEdges.has(removedKey),phases:edgePhases};check(realRemovedEdge.calculatedFromActualDecodedEnemy,'Actual enemy edge path was not exercised');if(savedEdge)fx.enemyEdges.set(removedKey,savedEdge);else fx.enemyEdges.delete(removedKey);current.enemies=previousEnemies;bossActor=previousBoss;
  const classification=[...[['floor',true],['field',true],['pulse',true],['strike',false],['impact',false],['path',false],['link',false],['bass',false]].map(([gesture,want])=>[{art:{gesture}},want]),[{art:{floor:true}},true],[{art:{floor:true,castCue:true}},false],[{art:{gesture:'pulse',castCue:true}},false],[{art:{floorWidth:78}},true],[{row:36,art:null},true],[{row:0,art:null},false]];
  for(const[event,want]of classification)check(fx.isGround(event)===want,'Incorrect floor classification '+JSON.stringify(event));
  for(const hero of fx.heroes){fx.v3Ready(hero);await fx.v3Images[hero].decode()}
  const pad=index=>({index,id:'V3 layer QA',connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
  const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},rows=[];
  for(const[direction,[dx,dy]]of Object.entries(directions))for(const crowded of[false,true])for(const missing of[false,true]){
   await heroAttackArena('franco');G.formation=['franco','alt','ryuchi'];G.hp.alt=G.maxhp.alt=100;G.dir=direction;G.aim091=[dx,dy];
   C3.pad.pads=[pad(0),pad(1)];C3.coop.member='alt';C3.syncCoop(true);
   Object.assign(C3.coop,{x:G.x+(crowded?.14:3.2),y:G.y+(crowded?.1:2.5),dir:direction,cool:0,attackUntil:0});
   trail=[{x:G.x-(crowded?.13:3.1),y:G.y+(crowded?.06:2.3),dir:direction}];
   const enemy=hydrateEnemy({id:'layer_target',type:'hush',x:G.x+dx*1.1,y:G.y+dy*1.1});enemy.hp=enemy.max=9999;current.enemies=[enemy];
   const enemyKey=EnemyArtV1.key(enemy.type,enemy);await EnemyArtV1.image(enemyKey).decode();
   await window.FinalAssetLoadingV1?.ready();C3.coopAttack();attackAction();skillAction();
   const ally=getFollower(1);fx.follower('ryuchi',ally,{x:ally.x+dx,y:ally.y+dy});C3.percussionPulse(2.4,12,.45);fx.advance(.06);
   const shot=projectiles.find(p=>p.arrow);check(shot&&shot.vx*dx+shot.vy*dy>0,'Missing directed P2 arrow '+direction);shot.x+=dx*2.5;shot.y+=dy*2.5;
   for(const hero of G.formation)await RunStrideV1.image(hero).ready;
   for(const state of['idle','attack_1','skill']){await ProtagonistArtV5.image('franco_'+state).decode();await ProtagonistArtV5.image('ryuchi_'+state).decode();if(state!=='skill')await NinjaArcherArtV1.image('alt_'+state).decode()}
   cam.x=Math.max(0,G.x*T-VW/2);cam.y=Math.max(0,G.y*T-VH/2);
   const order=[],poses=[],projectilePositions=[],fallbackPositions=[],faceRetention=[],eventDraws=new Map();let projectileCount=0,inProjectile=false,pass='';
   const actorDraw=drawActor,imageDraw=ctx.drawImage,rectDraw=ctx.fillRect,overlayDraw=HeroLegacyFX.drawOverlay,groundDraw=HeroLegacyFX.drawGround,projectileDraw=fx.drawProjectile,ready=fx.v3Ready,drawV3=fx.drawV3,combatDraw=drawCombatLayer;
   if(missing)fx.v3Ready=()=>false;
   drawActor=function(p,x,y,...rest){if(G.formation.includes(p.style)){order.push('actor');poses.push({id:p.style,x,y})}return actorDraw.call(this,p,x,y,...rest)};
   fx.drawV3=function(event,...rest){eventDraws.set(event,(eventDraws.get(event)||0)+1);return drawV3.call(this,event,...rest)};
   fx.drawProjectile=function(p,...rest){const before=inProjectile;inProjectile=p===shot;if(inProjectile){projectileCount++;order.push('projectile')}try{return projectileDraw.call(this,p,...rest)}finally{inProjectile=before}};
   ctx.drawImage=function(im,...args){if(Object.values(fx.v3Images).includes(im)){order.push(pass==='ground'?'groundFX':'foregroundFX');if(inProjectile){const t=this.getTransform();projectilePositions.push([t.e,t.f])}}return imageDraw.call(this,im,...args)};
   ctx.fillRect=function(x,y,w,h){if(inProjectile&&w===4&&h===2){const t=this.getTransform();fallbackPositions.push([t.a*(x+2)+t.c*(y+1)+t.e,t.b*(x+2)+t.d*(y+1)+t.f])}return rectDraw.call(this,x,y,w,h)};
   const heads=()=>poses.map(({x,y})=>ctx.getImageData(Math.round(x)-10,Math.round(y)-54,21,38).data);
   HeroLegacyFX.drawGround=function(){pass='ground';try{return groundDraw.call(this)}finally{pass=''}};
   HeroLegacyFX.drawOverlay=function(){pass='foreground';const before=heads();try{const r=overlayDraw.call(this),after=heads();check(before.length===3,'Expected both players and follower before overlay');for(let i=0;i<3;i++){let changed=0;for(let p=0;p<before[i].length;p+=4)if([0,1,2,3].some(c=>before[i][p+c]!==after[i][p+c]))changed++;const retained=1-changed/(before[i].length/4);check(retained>=.75,'Compact feedback obscured more than a quarter of face/detail region '+poses[i].id+' '+direction);faceRetention.push({hero:poses[i].id,retainedPixels:retained})}return r}finally{pass=''}};
   drawCombatLayer=function(...args){if(HeroLegacyFX.worldOverlay)order.push('warnings');return combatDraw.apply(this,args)};
   const gameplay=()=>JSON.stringify({G,act,projectiles,enemyHP:enemy.hp});const before=gameplay();
   try{
    drawEnv();check(gameplay()===before,'Compositor mutated gameplay records');
    check(new Set(poses.map(p=>p.id)).size===3,'Missing party member in compositor');
    const firstActor=order.indexOf('actor'),lastActor=order.lastIndexOf('actor'),warning=order.indexOf('warnings');check(firstActor>=0&&warning>lastActor,'Warnings preceded the actors');
    if(!missing){check(order.includes('groundFX')&&order.lastIndexOf('groundFX')<firstActor,'Floor effect above actors '+direction);check(order.includes('foregroundFX')&&order.indexOf('foregroundFX')>lastActor,'Compact FX hidden below actors '+direction);check(order.lastIndexOf('foregroundFX')<warning,'Compact FX covered warnings '+direction)}else check(!order.includes('groundFX')&&!order.includes('foregroundFX'),'Missing V3 bitmap fabricated a decoded draw');
    check(order.indexOf('projectile')>lastActor&&order.indexOf('projectile')<warning,'Projectile outside foreground/warning boundary');check(projectileCount===1,'Projectile rendered more than once');
    check([...eventDraws.values()].every(n=>n===1)&&eventDraws.size===fx.events.length,'An event was lost or submitted twice across passes');
    const positions=missing?fallbackPositions:projectilePositions;check(positions.some(([x,y])=>Math.hypot(x-(shot.x*T-cam.x),y-(shot.y*T-cam.y))<1),'Projectile detached from collision point '+direction+' missing='+missing);
    check(fx.events.some(e=>e.art?.hero==='franco')&&fx.events.some(e=>e.art?.hero==='ryuchi')&&projectiles.includes(shot),'Lost P1/follower cast or P2 projectile');
    rows.push({direction,crowded,missingBitmap:missing,partyMembers:poses.length,faceRetention,projectileAnchored:true,projectileCount,submittedEvents:eventDraws.size,order,gameplayUnchanged:true});
   }finally{drawActor=actorDraw;ctx.drawImage=imageDraw;ctx.fillRect=rectDraw;HeroLegacyFX.drawOverlay=overlayDraw;HeroLegacyFX.drawGround=groundDraw;fx.drawProjectile=projectileDraw;fx.v3Ready=ready;fx.drawV3=drawV3;drawCombatLayer=combatDraw}
  }
  await heroAttackArena('franco');attackAction();HeroLegacyFX.withActor('franco',()=>addCombatFX(G.x,G.y,'strike',.75));const own=combatFX.find(f=>f.heroArt==='franco');check(own,'Player feedback attribution absent');
  const kinds=['strike','warning','hurt','hit','duo','pulse','xp','dodge'];for(let i=0;i<kinds.length;i++)addCombatFX(4+i,5,kinds[i],.75);
  const arcs=[],arc=ctx.arc;ctx.arc=function(x,y,r,a,b,...rest){arcs.push({x,y,r,span:Math.abs(a-b)});return arc.call(this,x,y,r,a,b,...rest)};try{drawCombatLayer()}finally{ctx.arc=arc}
  const ringAt=(x,y)=>arcs.some(a=>Math.abs(a.x-(x*T-cam.x))<.01&&Math.abs(a.y-(y*T-cam.y-12))<.01&&a.span>6);
  for(let i=0;i<kinds.length;i++)check(ringAt(4+i,5),'Unowned/enemy feedback disappeared: '+kinds[i]);check(!ringAt(own.x,own.y),'V3 contact duplicated retired ring');
  const eligible=fx.events.length,allCalls=[],previousV3=fx.drawV3;fx.drawV3=function(e){allCalls.push(e)};try{fx.draw()}finally{fx.drawV3=previousV3}check(allCalls.length===eligible&&new Set(allCalls).size===eligible,'Default all pass contract changed');
  return{removedFirstContactFinite:true,lastContactPositionPreserved:true,realRemovedEdge,contactUnitScope:'Removed enemy object, with cached edge and separately actual uncached edge; no null-target contract. Fatal first-input visibility is a separate cold case.',classificationCases:classification.length,cases:rows,faceRegions:rows.reduce((n,r)=>n+r.faceRetention.length,0),feedbackKinds:kinds,duplicatePlayerRingSuppressed:true,defaultAllPass:true};
 });report.checks.push({name:'Floor/actors/compact-FX/warnings contract, finite contacts, all party seats and independent feedback',passed:true,details:result});assert.deepEqual(report.errors,[]);console.log('PASS · '+JSON.stringify({cases:result.cases.length,faceRegions:result.faceRegions,removedFirstContactFinite:true}));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();report.browserClosed=true;fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'BROWSER.json'),JSON.stringify(report,null,2)+'\n')});
