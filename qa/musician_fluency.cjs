/* Controller-driven musician animation QA at 60 Hz; no source/PNG replacement.
 * node qa/musician_fluency.cjs URL
 * Optional PLAYWRIGHT_CORE, CHROME_PATH, CDP_URL, MUSICIAN_FLUENCY_OUTPUT.
 * All fixtures live in a fresh browser context and never write a save.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const crypto=require('node:crypto');
function sourceFingerprint(url,redirects=0){
 return new Promise((resolve,reject)=>{
  const transport=require(new URL(url).protocol==='https:'?'node:https':'node:http');
  const request=transport.get(url,{headers:{'Accept-Encoding':'identity'}},response=>{
   if(response.statusCode>=300&&response.statusCode<400&&response.headers.location&&redirects<5){
    response.resume();return resolve(sourceFingerprint(new URL(response.headers.location,url).href,redirects+1));
   }
   if(response.statusCode!==200){response.resume();return reject(Error('Source HTTP '+response.statusCode));}
   const hash=crypto.createHash('sha256');let bytes=0;
   response.on('data',chunk=>{bytes+=chunk.length;hash.update(chunk)});
   response.on('end',()=>resolve({sha256:hash.digest('hex'),bytes,url,lastModified:response.headers['last-modified']||null}));
   response.on('error',reject);
  });
  request.setTimeout(120000,()=>request.destroy(Error('Source fingerprint timeout')));request.on('error',reject);
 });
}
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../game/VERSION.json'),'utf8')).versao;
const output=process.env.MUSICIAN_FLUENCY_OUTPUT||path.join(__dirname,release,'MUSICIAN_FLUENCY.json');
(async()=>{
 let browser,context,report;
 try{
  browser=process.env.CDP_URL?await chromium.connectOverCDP(process.env.CDP_URL):
   await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  context=await browser.newContext({viewport:{width:960,height:640}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   window.requestAnimationFrame=()=>0;window.__fluencyPads=[];
   Object.defineProperty(navigator,'getGamepads',{value:()=>window.__fluencyPads});
   window.__fluencyPad=i=>({index:i,id:'Musician fluency QA '+i,connected:true,mapping:'standard',
    axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
  });
  const url=process.argv[2]||'http://127.0.0.1:8767/';
  const [source,navigation]=await Promise.all([sourceFingerprint(url),page.goto(url,{waitUntil:'load',timeout:120000})]);
  const headers=await navigation.allHeaders();
  if(source.lastModified&&headers['last-modified'])assert.equal(source.lastModified,headers['last-modified'],'Source changed while starting QA');
  await page.waitForFunction(()=>typeof MusicianArtV1!=='undefined');
  const metadata=await page.evaluate(()=>typeof ToriiPlaytest!=='undefined'
   ?{version:ToriiPlaytest.version,sourceSha:ToriiPlaytest.sourceSha256}:null);
  const title=await page.title(),version=metadata?.version||title.match(/Beta\s+([\d.]+)/i)?.[1]||null;
  const sourceSha=metadata?.sourceSha||source.sha256;
  if(process.env.MUSICIAN_EXPECTED_SHA)assert.equal(sourceSha,process.env.MUSICIAN_EXPECTED_SHA,'Unexpected portable source metadata');
  if(process.env.MUSICIAN_EXPECTED_VERSION)assert.equal(version,process.env.MUSICIAN_EXPECTED_VERSION,'Unexpected game version');
  report=await page.evaluate(async()=>{
   const art=MusicianArtV1,dt=1/60,heroes=['synth','percussion'],variants=['unmasked','masked'];
   const dirs=['down','left','up','right'],vectors={down:[0,1],left:[-1,0],up:[0,-1],right:[1,0]};
   const states=['idle','walk','run','roll','attack_1','attack_2','attack_3','skill','advanced','signature','hurt','defeat','performance'];
   const sequences=[],transitions=[],assert=(test,message)=>{if(!test)throw Error(message)};
   const keyForDir={down:'s',left:'a',up:'w',right:'d'};
   function arena(hero,variant='unmasked',direction='down',coop=false){
    G=fresh();G.active=hero;G.formation=[hero,hero==='synth'?'percussion':'synth'];
    G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;
    G.c3.started=G.c3.synthUnlocked=G.c3.percussionUnlocked=true;
    for(const id of heroes)G.hp[id]=G.maxhp[id]=100;
    current=mk('power_plant',64,64,'grass');G.area='power_plant';G.x=G.y=32.5;G.dir=direction;G.aim091=[...vectors[direction]];
    const sentinel=hydrateEnemy({id:'fluency-sentinel',type:'hush',x:G.x,y:G.y+4});
    sentinel.hp=sentinel.max=9999999;sentinel.stun=999;sentinel.cd=999;current.enemies.push(sentinel);
    mode='action';menuOpen=false;battle={boss:false,id:'field'};bossActor=null;keys={};
    Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,dashCD:0,invuln:0,combo:0,comboTime:0});
    C3.synthWave=0;C3.synthZones=[];C3.percussionGuard=0;G.resonance=100;
    projectiles=[];hostileShots=[];resetMotion10();stride10=0;lastAnimArea10=G.area;
    Input121.game=G;Input121.lastArea=G.area;Input121.focused=true;Input121.wasCoop=false;
    C3.pad.previous.clear();window.__fluencyPads=coop?[window.__fluencyPad(0),window.__fluencyPad(1)]:[];
    C3.pad.pads=window.__fluencyPads;C3.coop.member=G.formation[1];C3.coop.actor123=null;
    if(coop)C3.syncCoop(true);Input121.wasCoop=coop;
    Object.assign(C3.coop,{cool:0,skill:0,advanced:0,signature:0,combo:0,hit:0,dash:0,dashCD:0,invuln:0,stride:0,running:false,moving:false,dir:direction});
    art.reset();for(const id of heroes)art.setVariant(id,variant);
    $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');
    $('cinema').style.display='none';cam.x=G.x*T-160;cam.y=G.y*T-160;
   }
   function step(){const before={x:G.x,y:G.y};tick+=dt;update(dt);return Math.hypot(G.x-before.x,G.y-before.y)>.00001}
   function advance(seconds){for(let i=0;i<Math.ceil(seconds/dt);i++)step()}
   async function preload(hero,variant,state){
    await HeroAttackBody.sheet(hero,variant).decode();
    if(state==='run')assert(await RunStrideV1.image(hero).ready,'Missing running body sheet '+hero);
    for(const name of new Set(state==='roll'?[state,'walk','idle']:[state,'idle'])){
     const image=art.image(art.key(hero,variant,name));assert(image,'Missing '+name);await image.decode();
     assert(image.naturalWidth===2048&&image.naturalHeight===1024,'Invalid atlas '+name);
    }
   }
   function controls(direction,running,seat=0){
    if(seat===1){const vector=vectors[direction],scale=running?1:.6;window.__fluencyPads[1].axes=vector.map(v=>v*scale);}
    else {keys={[keyForDir[direction]]:true,shift:running};}
   }
   function frame(hero,state,moving=false,seat=0){
    const performance=state==='performance',body=seat===1?C3.coop:G;
    const p={style:hero,dir:body.dir,...(performance?{musicianState:'performance',musicianNpc:true}:{})};
    let pose=art.pose(p,performance?-1:seat,moving);const calls=[],previous=ctx.drawImage;
    ctx.drawImage=function(...args){calls.push(args);return previous.apply(this,args)};
    try{
     if(performance)drawDetailedNPC({id:hero==='synth'?'c3_synth_npc':'c3_percussion_npc',dir:body.dir,musicianState:'performance'},120,120);
     else drawActor(p,body.x*T-cam.x,body.y*T-cam.y,moving);
    }finally{ctx.drawImage=previous}
    // V9 registers the shared motion clock only while drawing this actor.
    // Read its effective walk pose after drawActor, including the walking exit
    // from a completed roll; action/roll sequence checks below stay unchanged.
    if(!performance&&['walk','run'].includes(pose.state)){
     const effective=RunStrideV1.snapshot().find(item=>item.hero===hero&&item.seat===seat)?.nativePose;
     if(effective?.state===pose.state)pose={...effective};
    }
    const call=calls.at(-1),image=art.images[art.key(hero,pose.variant,pose.state)];
    if(pose.state==='run'&&moving){
     const run=RunStrideV1.image(hero),cell=run.cell,row=dirs.indexOf(pose.direction)+(pose.variant==='masked'?4:0);
     assert(call && call[0]===run.bitmap && call[2]===row*cell && call[3]===cell && call[4]===cell,'Wrong running body sheet or direction');
     return {state:'run',frame:call[1]/cell,direction:pose.direction,variant:pose.variant,source:call.slice(1,5)};
    }
    const action=HeroAttackBody.states.includes(pose.state);
    const contact=action && call?.[0]===HeroAttackBody.sheet(hero,pose.variant);
    assert(call && (contact || call[0]===image),'Unrecognized body source '+JSON.stringify(pose));
    const expectedX=contact?HeroAttackBody.states.indexOf(pose.state):pose.frame;
    assert(call[2]===pose.row*256 && call[3]===256 && call[4]===256,'Wrong row/cell '+JSON.stringify(pose));
    if(contact || !action)assert(call[1]===expectedX*256,'Wrong action/motion cell '+JSON.stringify(pose));
    const oldFrame=call[1]/256;
    const visible=contact?4:action && oldFrame>=4?oldFrame+1:oldFrame;
    return {state:pose.state,frame:visible,direction:pose.direction,variant:pose.variant,source:[call[1],call[2],call[3],call[4]]};
   }
   function startState(hero,state){
    if(state.startsWith('attack_')){
     const stage=Number(state.at(-1));
     for(let i=1;i<=stage;i++){
      // Wait out genuine cooldown; never assign combo stage/record elapsed.
      for(let wait=0;act.cool>1e-7&&wait<90;wait++)step();
      attackAction();assert(art.players[0]?.state==='attack_'+i,'Combo stage rejected: '+i);
     }
     return 'attackAction accepted '+stage+' time(s), real cooldown between stages';
    }
    const action={skill:skillAction,advanced:advancedSkill,signature:duoAction}[state];
    if(action){action();assert(art.players[0]?.state===state,'Action rejected '+state);return 'accepted '+({skill:'skillAction',advanced:'advancedSkill',signature:'duoAction'}[state]);}
    if(state==='roll'){assert(startRoll121()===true,'Roll rejected');return 'accepted startRoll121';}
    if(state==='hurt'){const hp=G.hp[hero];damageHero(5);assert(G.hp[hero]===hp-5&&art.players[0]?.state==='hurt','Damage rejected');return 'damageHero accepted: HP100→95';}
    if(state==='defeat'){
     G.formation=[hero];for(const id of Object.keys(G.hp))G.hp[id]=id===hero?1:0;
     damageHero(5);assert(G.hp[hero]===0&&art.players[0]?.state==='defeat','Lethal damage rejected');
     return 'last-member lethal damageHero and real retry overlay';
    }
    return state==='performance'?'NPC musicianState=performance (visual NPC state; no playable command)':
      state==='walk'||state==='run'?'real keyboard movement through update/smoothMove10':'idle through real update';
   }
   for(const hero of heroes)for(const variant of variants)for(const state of states)for(const direction of dirs){
    const result={hero,variant,state,direction,seat:state==='performance'?'NPC':0,passed:false};
    try{
     arena(hero,variant,direction);await preload(hero,variant,state);
     result.trigger=startState(hero,state);const cyclic=['idle','walk','run','performance'].includes(state);
     if(state==='walk'||state==='run')controls(direction,state==='run');
     const count=state==='run'?RunStrideV1.manifest.heroes[hero].frames:HeroAttackBody.states.includes(state)?9:8;
     const frames=[],rects=[],seen=new Set();let movement=0,started=false,finished=false;
     for(let n=0;n<240;n++){
      let moving=false;
      if(n>0||state==='walk'||state==='run'){const x=G.x,y=G.y;moving=step();movement+=Math.hypot(G.x-x,G.y-y);}
      const sample=frame(hero,state,moving);
      if(sample.state!==state){
       if(started){finished=true;break;}
       if(state==='walk'||state==='run')continue;
       throw Error('Wrong start state '+sample.state);
      }
      started=true;assert(sample.direction===direction,'Direction changed '+JSON.stringify(sample));
      assert(sample.variant===variant,'Requested mask variant not rendered '+JSON.stringify(sample));
      if(frames.at(-1)!==sample.frame){
       if(frames.length){const previous=frames.at(-1);assert(sample.frame===(cyclic?(previous+1)%count:Math.min(count-1,previous+1)),'Skipped/reversed pose '+frames+'→'+sample.frame);}
       frames.push(sample.frame);rects.push(sample.source);seen.add(sample.frame);
      }
      if(seen.size===count)break;
     }
     assert(seen.size===count,'Incomplete body sequence at60Hz: '+frames);
     if(!cyclic)assert(frames[0]===0&&frames.at(-1)===count-1,'Action must reach its final pose');
     if(['walk','run','roll'].includes(state))assert(movement>.1,'Controller did not move actual actor');
     if(state==='defeat'){advance(1);const held=frame(hero,state,false);assert(held.state==='defeat'&&held.frame===7,'Defeat failed to hold');}
     else if(!cyclic){
      let exited=false;for(let n=0;n<90;n++){const moving=step();const after=frame(hero,state,moving);if(state==='roll'&&moving&&after.state==='walk')continue;if(after.state!==state){assert(after.state==='idle','Wrong exit '+after.state);exited=true;break;}}
      assert(exited,'Action never returns to idle');
     }
     result.frames=frames;result.sourceRects=rects;result.movement=Number(movement.toFixed(4));result.passed=true;
     result.cacheSize=Object.keys(art.images).length;assert(result.cacheSize<=8,'Decoded cache exceeded8');
    }catch(error){result.passed=false;result.error=error.message;}
    sequences.push(result);
   }
   // Free transitions use the same real controller/update functions as above.
   function check(name,detail,fn){const result={name,...detail,passed:false};try{result.detail=fn();result.passed=true}catch(error){result.error=error.message}transitions.push(result)}
   for(const hero of heroes)for(const variant of variants){
    for(const seat of [0,1]){
     const lead=seat===1?(hero==='synth'?'percussion':'synth'):hero;
     arena(lead,variant,'right',true);
     check('hurt interrupts late roll',{hero,variant,seat},()=>{
      assert((seat===0?startRoll121():C3.coopDodge(window.__fluencyPads[1]))===true,'Roll rejected');advance(.25);
      if(seat===0)damageHero(5);else C3.damageCoop(5);
      const p=art.pose({style:hero,dir:'right'},seat,true);assert(p.state==='hurt'&&p.frame===0&&G.hp[hero]===95,'Reaction hidden by roll '+JSON.stringify({pose:p,hp:G.hp[hero],invuln:act.invuln,p2Invuln:C3.coop.invuln,mode,record:art.players[seat]}));return {state:p.state,frame:p.frame,hp:G.hp[hero]};
     });
     arena(lead,variant,'right',true);
     check('roll cancels earlier signature',{hero,variant,seat},()=>{
      if(seat===0)duoAction();else C3.coopSignature(window.__fluencyPads[1]);assert(art.players[seat]?.state==='signature','Signature rejected');
      assert((seat===0?startRoll121():C3.coopDodge(window.__fluencyPads[1]))===true,'Roll rejected');advance(.4);
      const p=art.pose({style:hero,dir:'right'},seat,false);assert(p.state==='idle','Signature reappeared');return {state:p.state};
     });
     for(const running of [false,true]){
      arena(lead,variant,'right',true);controls('right',running,seat);let moving=false;
      for(let i=0;i<24;i++)moving=step();
      check('pause during locomotion',{hero,variant,seat,running},()=>{
       const p={style:hero,dir:'right'},before=art.pose(p,seat,seat===1?C3.coop.moving:moving);
       assert(before.state===(running?'run':'walk'),'Movement not accepted');openSystem();step();
       const after=art.pose({...p,dir:'down'},seat,false);
       assert(after.state===before.state&&after.frame===before.frame&&after.direction===before.direction,'Pose changed when inputs released');
       art.setVariant(hero,variant==='masked'?'unmasked':'masked');const masked=art.pose(p,seat,false);
       assert(masked.frame===before.frame&&masked.state===before.state&&masked.variant!==variant,'Paused mask altered pose');
       closeOverlay();keys={};window.__fluencyPads[1].axes=[0,0];step();
       assert(art.pose(p,seat,false).state==='idle','Frozen movement survived resume');return {before,after};
      });
     }
    }
    arena(hero,variant,'left');check('mask swap preserves action phase',{hero,variant},()=>{
     advancedSkill();advance(.3);const before=art.pose({style:hero},0,false);art.setVariant(hero,variant==='masked'?'unmasked':'masked');
     const after=art.pose({style:hero},0,false);assert(before.state==='advanced'&&after.state===before.state&&after.frame===before.frame&&after.direction===before.direction,'Mask reset action');return {before,after};
    });
    arena(hero,variant,'right');controls('right',false);for(let i=0;stride10<10&&i<600;i++)step();
    check('walk/run input transition',{hero,variant},()=>{
     const before=art.pose({style:hero},0,true),distanceBefore=stride10;keys.shift=true;const moving=step();
     const after=art.pose({style:hero},0,moving),delta=(after.frame-before.frame+8)%8;
     assert(before.state==='walk'&&after.state==='run'&&delta<=1,'Gait jumped or reversed phase');return {before,after,distanceBefore,distanceAfter:stride10};
    });
    arena(hero,variant);check('idle/performance clock pauses',{hero,variant},()=>{
     advance(.43);const p={style:hero},npc={style:hero,musicianNpc:true,musicianState:'performance'};
     const before=art.pose(p,0,false),perform=art.pose(npc,-1,false);openSystem();advance(.2);
     assert(art.pose(p,0,false).frame===before.frame&&art.pose(npc,-1,false).frame===perform.frame,'Paused ambient pose changed');return {idle:before.frame,performance:perform.frame};
    });
    arena(hero,variant);check('defeat still advances and holds',{hero,variant},()=>{
     startState(hero,'defeat');advance(1);const p=art.pose({style:hero},0,false);assert(p.state==='defeat'&&p.frame===7,'Defeat frozen or released');return {state:p.state,frame:p.frame,mode};
    });
   }
   return {fps:60,sequences,transitions,fixtureMarkedAnimations:[],
    semantics:{simulation:'actual update at fixed 1/60s; no wall-clock FPS claim',actions:'accepted gameplay functions; natural cooldowns for combo stages',
     movement:'keyboard axes and real body displacement',performance:'NPC-only musicianState; explicitly visual, not playable ability',
     rendering:'actual drawActor/drawDetailedNPC source image and source rectangle matched each sample',
     preload:'only requested state and idle; decoded cache remains <=8',artReview:'frame order/controller regression; not a substitute for artistic review'},
    cacheSize:Object.keys(art.images).length};
  });
  report.version=version;report.sourceSha=sourceSha;report.servedHtmlSha=source.sha256;
  report.source={...source,title,sourceShaKind:metadata?.sourceSha?'ToriiPlaytest.sourceSha256 portable HTML':'raw served HTML',
   method:'portable source metadata when exported; raw HTTP hash recorded separately and Last-Modified compared to navigation'};
  report.pageErrors=errors;report.passed=report.sequences.length===208&&report.sequences.every(s=>s.passed)&&report.transitions.length===48&&report.transitions.every(s=>s.passed)&&errors.length===0;
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));
  const failures=[...report.sequences,...report.transitions].filter(s=>!s.passed);
  assert(report.passed,JSON.stringify({sequences:report.sequences.length,transitions:report.transitions.length,failures,pageErrors:errors}));
  console.log(JSON.stringify({passed:true,sequences:208,transitions:48,fps:60,output}));
 }catch(error){console.error(error);process.exitCode=1}
 finally{if(context)await context.close();if(browser)await browser.close()}
})();
