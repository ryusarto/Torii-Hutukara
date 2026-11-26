// Verify both independently moving body layers through real accepted bow actions.
'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 try {
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__pads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>__pads});});
  await page.goto(process.argv[2],{waitUntil:'load',timeout:120000});
  await page.evaluate(async()=>{
    for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');$('playtestEntry')?.remove();
    for(const key of ['walk','attack_1','attack_2','attack_3','skill','advanced','signature'])
      await NinjaArcherArtV1.image('alt_'+key).decode();
    await HeroAttackBody.sheet('alt','unmasked').decode();
    if(!await RunStrideV1.image('alt').ready)throw Error('Missing running body');
    const pad=index=>({index,id:'Standard controller',connected:true,mapping:'standard',axes:[0,0],
      buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
    window.archerArena=async(seat)=>{
      await window.FinalAssetLoadingV1?.ready();
      G=fresh();G.active=seat?'franco':'alt';G.formation=[G.active,seat?'alt':'franco'];
      G.flags.bass=G.flags.reveal=G.flags.voicesKatana=true;G.knownMembers=C3.unlockedRoster().slice();G.resonance=100;
      for(const id of G.formation){G.hp[id]=G.maxhp[id]=100;G.levels[id]=5;}
      current=mk('forest',100,100,'grass');G.area='forest';G.x=42;G.y=42;G.dir='right';G.aim091=[1,0];
      mode='action';battle={boss:false,id:'field'};bossActor=null;keys={};touchDir={};menuOpen=false;trail=[];
      current.enemies=[hydrateEnemy({id:'test_guard',type:'hush',x:46,y:46})];
      resetMotion10();Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,combo:0,hit:0,invuln:2});
      Input121.focused=true;Input121.game=G;Input121.lastArea=G.area;
      __pads=seat?[pad(0),pad(1)]:[];C3.pad.pads=__pads;C3.pad.previous.clear();
      if(seat){C3.coop.member='alt';C3.syncCoop(true);}
      Object.assign(C3.coop,{x:42.7,y:42.5,dir:'right',cool:0,skill:0,advanced:0,signature:0,combo:0,lastAttack:-20});
      NinjaArcherArtV1.reset();await window.FinalAssetLoadingV1?.ready();update(0);
    };
    window.bow=async(seat,n)=>{
      await window.FinalAssetLoadingV1?.ready();
      await NinjaArcherArtV1.image('alt_'+['attack_1','attack_2','attack_3','skill','advanced','signature'][n]).decode();
      const body=seat?C3.coop:G;
      body.dir='right';if(!seat)G.aim091=[1,0];
      if(n<3)NinjaArcherArtV1.shots[seat]=n;
      const invoke=seat?[()=>C3.coopAttack(),()=>C3.coopSkill(),()=>C3.coopAdvanced(),()=>C3.coopSignature()]:
        [attackAction,skillAction,advancedSkill,duoAction];invoke[Math.max(0,n-2)]();
      const rec=NinjaArcherArtV1.players[seat];
      if(!rec||rec.state!==['attack_1','attack_2','attack_3','skill','advanced','signature'][n])
        throw Error('No accepted archer action for seat '+seat+' attack '+n);
      return rec;
    };
    window.bowPlacementChecks=0;window.bowPlacementErrors=[];
    window.frameBow=(seat,picture=false,world=false)=>{
      const b=seat?C3.coop:G,seen=[],orig=ctx.drawImage;
      const x=b.x*T-cam.x,y=b.y*T-cam.y;
      let actorPoint={x,y};const render=RunStrideV1.render;
      RunStrideV1.render=function(p,xx,yy,...rest){const saved=actorPoint;if(p.style==='alt')actorPoint={x:xx,y:yy};try{return render.call(this,p,xx,yy,...rest)}finally{actorPoint=saved}};
      ctx.drawImage=function(im,...args){if(im?.dataset?.archerPose){
        const name=im.dataset.archerPose;seen.push(name);
        const [kind,row,col]=name.split('/');
        if(kind==='run'||kind==='walk'){
          const config=RunStrideV1.manifest.heroes.alt,entry=config[kind==='run'?'registration':'walkRegistration']?.[+row]?.[+col];
          if(entry){const offset=entry.offset,expected=[Math.round(actorPoint.x-44+offset[0]*88/256),Math.round(actorPoint.y+11-77+offset[1]*88/256)];
            bowPlacementChecks++;if((args[0]!==expected[0]||args[1]!==expected[1])&&bowPlacementErrors.length<10)bowPlacementErrors.push({name,actual:args.slice(0,2),expected});}
        }
      }return orig.call(this,im,...args);};
      try{if(world)drawEnv();else drawActor({style:'alt',dir:b.dir},x,y,true);}finally{ctx.drawImage=orig;RunStrideV1.render=render;}
      if(!picture)return seen;
      // Frame the subject in this review capture, suppressing party followers
      // that would otherwise cross in front of the boots. The archer and arrows
      // still use their real world renderers and simulation.
      const actor=drawActor;
      drawActor=function(p,...args){if(p.style==='alt')return actor.call(this,p,...args);};
      try{drawEnv();}finally{drawActor=actor;}
      const c=document.createElement('canvas');c.width=120;c.height=108;const q=c.getContext('2d');
      q.drawImage(cv,Math.round(b.x*T-cam.x)-60,Math.round(b.y*T-cam.y)-79,120,108,0,0,120,108);
      return {seen,image:c.toDataURL('image/png').split(',')[1]};
    };
  });
  let cases=0;
  for(const seat of [0,1])for(const running of [false,true])for(let n=0;n<6;n++){
    await page.evaluate(async seat=>archerArena(seat),seat);
    if(!seat){await page.keyboard.down('ArrowUp');if(running)await page.keyboard.down('Shift');}
    const r=await page.evaluate(async ({seat,running,n})=>{
      if(seat){__pads[1].axes=[0,running?-1:-.67];__pads[1].buttons[6]={pressed:running,value:running?1:0};}
      for(let i=0;i<8;i++)update(1/60);
      const rec=await bow(seat,n),frames=[],b=seat?C3.coop:G,sy=b.y;
      for(let i=0;i<Math.ceil(rec.duration*60)-1;i++){
        update(1/60);cam.x=b.x*T-VW/2;cam.y=b.y*T-VH/2;const seen=frameBow(seat,false,true);if(seen.length===2)frames.push(seen);
      }
      return {frames,state:rec.state,dy:b.y-sy};
    },{seat,running,n});
    if(!seat){await page.keyboard.up('ArrowUp');await page.keyboard.up('Shift');}
    const label=seat+'/'+running+'/'+n;
    assert(r.dy<0,label+' real movement');assert(r.frames.length>=3,label+' split layers '+JSON.stringify(r));
    assert(r.frames.every(([leg])=>leg.startsWith((running?'run':'walk')+'/2/')),label+' leg direction');
    assert(new Set(r.frames.map(([leg])=>leg)).size>=2,label+' moving feet');
    assert(r.frames.every(([,aim])=>aim.split('/')[1]==='3'),label+' locked aim');
    assert(r.frames.some(([,aim])=>aim.startsWith('contact/')),label+' new contact pose');
    cases++;
  }
  // Normal fire remains animated when the archer holds position.
  await page.evaluate(async ()=>archerArena(0));
  const stopped=await page.evaluate(async ()=>{const rec=await bow(0,0),cols=new Set();let split=false;
    for(let i=0;i<12;i++){update(.016);cols.add(NinjaArcherArtV1.pose({style:'alt',dir:'right'},0,false).frame);
      if(frameBow(0).length)split=true;}return {split,cols:cols.size};});
  assert(!stopped.split&&stopped.cols>1);
  for(const seat of [0,1]){
    await page.evaluate(async seat=>archerArena(seat),seat);
    if(!seat)await page.keyboard.down('ArrowUp');
    const pause=await page.evaluate(async seat=>{
      if(seat)__pads[1].axes=[0,-1];
      for(let i=0;i<6;i++)update(1/60);
      await bow(seat,5);update(1/60);const before=frameBow(seat);
      mode='overlay';update(1/60);const frozen=frameBow(seat);mode='action';
      return {before,frozen};
    },seat);
    assert.equal(pause.before.length,2);assert.deepEqual(pause.frozen,pause.before);
    if(!seat)await page.keyboard.up('ArrowUp');
    const released=await page.evaluate(async seat=>{
      if(seat)__pads[1].axes=[0,0];
      for(let i=0;i<10;i++)update(1/60);
      return frameBow(seat);
    },seat);
    assert.deepEqual(released,[],'held shot with released movement');
    await page.evaluate(async seat=>archerArena(seat),seat);
    if(!seat)await page.keyboard.down('ArrowUp');
    const blocked=await page.evaluate(async seat=>{
      const b=seat?C3.coop:G;
      for(let x=0;x<current.w;x++)current.blocked.add(x+','+(Math.floor(b.y)-1));
      if(seat)__pads[1].axes=[0,-1];
      for(let i=0;i<70;i++)update(1/60);
      await bow(seat,0);let start=b.y;update(1/60);
      const wall=frameBow(seat);
      if(seat){__pads=[];C3.pad.pads=[];}else G.active='franco';
      update(1/60);
      return {stationary:b.y===start,wall,swapped:frameBow(seat)};
    },seat);
    if(!seat)await page.keyboard.up('ArrowUp');
    assert(blocked.stationary);assert.deepEqual(blocked.wall,[]);assert.deepEqual(blocked.swapped,[]);
  }
  if(process.env.ARCHER_PREVIEW_FRAMES){
    const out=process.env.ARCHER_PREVIEW_FRAMES;fs.mkdirSync(out,{recursive:true});
    let index=0;
    for(const running of [false,true]){
      await page.evaluate(async ()=>{archerArena(0);G.formation=['alt'];});await page.keyboard.down('ArrowUp');if(running)await page.keyboard.down('Shift');
      for(let i=0;i<42;i++){
        if(i===18){await page.keyboard.up('ArrowUp');await page.keyboard.down('ArrowDown');}
        const im=await page.evaluate(async ({i})=>{
          if(act.cool<=0)await bow(0,Math.floor(i/8)%3);
          for(let j=0;j<2;j++){tick+=1/60;update(1/60);}
          cam.x=G.x*T-VW/2;cam.y=G.y*T-VH/2;
          return frameBow(0,true).image;
        },{i});fs.writeFileSync(path.join(out,String(index++).padStart(3,'0')+'.png'),Buffer.from(im,'base64'));
      }
      await page.keyboard.up('ArrowDown');await page.keyboard.up('Shift');
    }
  }
  const placement=await page.evaluate(async ()=>({checks:bowPlacementChecks,errors:bowPlacementErrors}));
  assert(placement.checks>100);assert.deepEqual(placement.errors,[],'Moving shot layers share the registered body origin');
  assert.deepEqual(errors,[]);console.log('PASS '+cases+' walk/run × seat × bow actions, contact and independent facing; stationary fire; '+placement.checks+' registered layer draws');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
