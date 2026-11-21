// Exercise the public body renderer, accepted commands and actual game update.
// The tiny arena isolates timing and drawing; it does not simulate a campaign.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    requestAnimationFrame=()=>0;window.__bodyPads=[];
    Object.defineProperty(navigator,'getGamepads',{value:()=>__bodyPads});
  });
  await page.goto(process.argv[2],{waitUntil:'load',timeout:120000});
  const summary=await page.evaluate(async()=>{
    const states=['attack_1','attack_2','attack_3','skill','advanced','signature'];
    const dirs=['down','left','up','right'];
    const axis=[[0,1],[-1,0],[0,-1],[1,0]];
    const dt=1/120;
    const pad=i=>({index:i,id:'BodyQA '+i,connected:true,mapping:'standard',axes:[0,0],
      buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
    const artFor=h=>h==='synth'||h==='percussion'?MusicianArtV1:h==='alt'||h==='katana'?NinjaArcherArtV1:ProtagonistArtV5;
    const keyFor=(art,h,v,s)=>art===MusicianArtV1?art.key(h,v,s):h+'_'+s;
    let cases=0,contacts=0,canonicalFrames=0;
    function fixture(hero,variant,dir,seat){
      const buddy=hero==='franco'?'ryuchi':'franco';
      G=fresh();G.active=seat?buddy:hero;G.formation=[G.active,seat?hero:buddy];
      G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;
      G.flags.masks=variant==='masked';G.c3.started=G.c3.synthUnlocked=G.c3.percussionUnlocked=true;
      for(const id of G.formation){G.hp[id]=G.maxhp[id]=100;G.levels[id]=5}
      G.resonance=100;G.x=G.y=24.5;G.area='forest';G.dir=dirs[dir];G.aim091=axis[dir];
      current=mk('forest',50,50,'grass');mode='action';battle={boss:false,id:'field'};bossActor=null;
      const enemy=hydrateEnemy({id:'body-target',type:'hush',x:G.x+1,y:G.y});
      enemy.hp=enemy.max=999999;enemy.cd=enemy.stun=999;current.enemies.push(enemy);
      menuOpen=false;keys={};tick=10;attackHeld=false;following=[];projectiles=[];hostileShots=[];companionCooldown=99;
      resetMotion10();Combat10.area=G.area;Combat10.active=G.active;Input121.game=G;Input121.lastArea=G.area;Input121.wasCoop=!!seat;Input121.focused=true;
      C3.synthWave=0;C3.synthZones=[];C3.percussionGuard=0;
      Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,combo:0,comboTime:0,hit:0,dashCD:0,invuln:0});
      __bodyPads=seat?[pad(0),pad(1)]:[];C3.pad.pads=__bodyPads;C3.pad.previous.clear();
      C3.coop.member=G.formation[1];C3.coop.actor123=null;if(seat)C3.syncCoop(true);
      Object.assign(C3.coop,{cool:0,skill:0,advanced:0,signature:0,dash:0,combo:0,lastAttack:-10,dir:dirs[dir]});
      const art=artFor(hero);
      art.reset();if(art===MusicianArtV1)art.setVariant(hero,variant);
      cam.x=G.x*T-160;cam.y=G.y*T-160;
      for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');
    }
    function step(){tick+=dt;update(dt)}
    function activate(state,seat,art){
      const i=states.indexOf(state);
      if(i<3){
        const actor=seat?C3.coop:act;
        for(let k=0;k<=i;k++){
          for(let wait=0;actor.cool>0 && wait<160;wait++)step();
          if(seat)C3.coopAttack(__bodyPads[1]);else attackAction();
        }
      }else{
        const fn=seat?[C3.coopSkill,C3.coopAdvanced,C3.coopSignature][i-3]:[skillAction,advancedSkill,duoAction][i-3];
        fn.call(seat?C3:null,__bodyPads[1]);
      }
      if(art.players[seat]?.state!==state)throw Error('Action not accepted '+[seat,G.active,C3.coop.member,state,art.players[seat]?.state,act.cool,C3.coop.cool,tick,act.combo,act.comboTime,C3.coop.combo,mode]);
    }
    for(const hero of ['franco','ryuchi','alt','katana','synth','percussion']){
      const art=artFor(hero);
      for(const variant of (['alt','katana'].includes(hero)?['unmasked']:['unmasked','masked'])){
        const body=HeroAttackBody.sheet(hero,variant);await body.decode();
        if(body.naturalWidth!==1536||body.naturalHeight!==1024)throw Error('Wrong body grid '+hero+'/'+variant);
        const sample=document.createElement('canvas');sample.width=sample.height=256;
        const q=sample.getContext('2d',{willReadFrequently:true});
        const hashes=new Set();
        for(const state of states){
          const col=states.indexOf(state),original=art.image(keyFor(art,hero,variant,state));await original.decode();
          for(let row=0;row<4;row++){
            q.clearRect(0,0,256,256);
            q.drawImage(body,col*256,row*256,256,256,0,0,256,256);
            const data=q.getImageData(0,0,256,256).data;
            let hash=2166136261,n=0;
            for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3 && data[i]>64)n++}
            if(n<500||n>50000||data[3]||data[(256*256-1)*4+3]||hashes.has(hash))throw Error('Invalid/duplicate drawing '+[hero,variant,state,row]);
            hashes.add(hash);
            for(const seat of [0,1]){
              fixture(hero,variant,row,seat);
              activate(state,seat,art);
              const frames=[];
              for(let i=0;i<160;i++){
                const actor=seat?C3.coop:G,draw=ctx.drawImage;
                const liveOriginal=art.images[keyFor(art,hero,variant,state)],liveBody=HeroAttackBody.sheet(hero,variant);
                ctx.drawImage=function(im,sx,sy,...rest){
                  if(im===liveBody){
                    if(sx!==col*256||sy!==row*256)throw Error('Wrong new pose '+[hero,variant,state,dirs[row],seat,sx,sy]);
                    if(frames.at(-1)!=='impact')frames.push('impact');
                  }else if(im===liveOriginal){const f=sx/256;if(frames.at(-1)!==f)frames.push(f)}
                  return draw.call(this,im,sx,sy,...rest);
                };
                try{drawActor({style:hero,dir:dirs[row]},actor.x*T-cam.x,actor.y*T-cam.y,false)}
                finally{ctx.drawImage=draw}
                if(frames.at(-1)===7)break;
                step();
              }
              if(frames.join(',')!=='0,1,2,3,impact,4,5,6,7')throw Error('Body sequence '+[hero,variant,state,dirs[row],seat,frames]);
              cases++;contacts++;canonicalFrames+=8;
            }
          }
        }
      }
    }
    fixture('katana','unmasked',3,0);activate('advanced',0,NinjaArcherArtV1);
    act.invuln=0;damageHero(4,hydrateEnemy({id:'body-parry',type:'hush',x:G.x+.65,y:G.y}));
    if(NinjaArcherArtV1.players[0]?.state!=='attack_3')throw Error('Parry failed to trigger the riposte body');
    fixture('franco','unmasked',3,0);
    const ally=getFollower(0);const enemy=current.enemies[0];enemy.x=ally.x+.3;enemy.y=ally.y;
    companionCooldown=0;updateAction(dt);
    if(HeroAttackBody.followerCast?.hero!=='ryuchi')throw Error('Missing real follower body strike');
    await HeroAttackBody.sheet('ryuchi','unmasked').decode();
    await ProtagonistArtV5.image('ryuchi_attack_1').decode();
    await ProtagonistArtV5.image('ryuchi_idle').decode();
    const followerFrames=[];
    for(let i=0;i<36;i++){
      const follower=getFollower(0),original=ctx.drawImage;
      ctx.drawImage=function(im,x,y,...rest){
        const key=HeroAttackBody.images.get('ryuchi_unmasked');
        const f=im===key?'impact':im===ProtagonistArtV5.images.ryuchi_attack_1?x/256:null;
        if(f!==null && followerFrames.at(-1)!==f)followerFrames.push(f);
        return original.call(this,im,x,y,...rest);
      };
      try{drawActor({style:'ryuchi',dir:'right'},follower.x*T-cam.x,follower.y*T-cam.y,false)}finally{ctx.drawImage=original}
      step();
    }
    if(followerFrames.join(',')!=='0,1,2,3,impact,4,5,6,7')throw Error('Wrong AI body '+followerFrames);
    return {version:ToriiPlaytest.version,sourceSha256:ToriiPlaytest.sourceSha256,cases,contacts,canonicalFrames,
      katanaRiposte:true,followerFrames,decodedBodySheetLimit:HeroAttackBody.images.size};
  });
  assert.equal(summary.cases,480);assert.equal(summary.contacts,480);
  assert(summary.decodedBodySheetLimit<=4);assert.deepEqual(errors,[]);
  if(process.env.BODY_QA_OUTPUT)fs.writeFileSync(process.env.BODY_QA_OUTPUT,JSON.stringify({...summary,errors},null,2)+'\n');
  console.log('480 accepted P1/P2 actions rendered with nine body poses',JSON.stringify(summary));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
