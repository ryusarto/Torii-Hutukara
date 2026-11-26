// Actual attack controllers and the production drawCreature/projectile entry points.
'use strict';
const fs = require('node:fs');
const {chromium} = require(process.env.PLAYWRIGHT_CORE || 'playwright');
const assert = require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  try{
    const page=await browser.newPage();
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.goto(process.argv[2],{waitUntil:'load',timeout:120000});
    const result=await page.evaluate(async()=>{
      const fx=EnemyAttackFX, choreo=BossChoreographyV2;
      const rows=[], sheets=new Map();
      function expect(ok,msg){if(!ok)throw Error(msg);}
      async function fixture(area){
        G=fresh();buildMaps();G.area=area;current=areas[area];mode='action';
        G.active='franco';G.x=15;G.y=15;G.hp.franco=G.maxhp.franco=1000;
        G.options10={...G.options10,reducedMotion:false};
        C3.hazards=[];C3.finalPending=false;hostileShots=[];bossActor=null;rings092=[];
        EnemyArtV1.reset();choreo.reset();ToriiCombate.MODE.mode='padrao';await FinalAssetLoadingV1.ready();if(FinalAssetLoadingV1.busy()||FinalAssetLoadingV1.snapshot().error)throw Error('Fixture final art is not ready');
      }
      function sample(name,shape,palette,draw,entities){
        const sheet=fx.atlas(shape,palette);sheets.set(name,sheet);
        const original=ctx.drawImage,seen=[],before=JSON.stringify(entities);
        ctx.drawImage=function(im,...args){if(im===sheet)seen.push(args[0]/40);return original.call(this,im,...args);};
        try{draw();}finally{ctx.drawImage=original;}
        expect(seen.length>0,'Missing bitmap for '+name);
        expect(JSON.stringify(entities)===before,'Drawing changed state for '+name);
        rows.push({name,shape,palette,framesSeen:seen});
      }
      const bossCases=[
        ['boss','drum','ruins',['ring','fan','charge']],
        ['voice_boss','radio','voice_tower',['lanes','feedback','double_wave','volley']],
        ['c3_metronome','iron','cloud_terrace',['ring','cross','fan','pulse']],
        ['c3_silence','void','silence_core',['ring','cross','fan','pulse','rain','chase','orbit']]
      ];
      for(const [id,palette,area,patterns] of bossCases)for(const kind of patterns){
        await fixture(area);
        const e=bossActor={id,type:'boss',x:15,y:10,hp:id==='voice_boss'&&['double_wave','volley'].includes(kind)?400:1000,
          max:1000,power:10,cd:10,stun:0,flash:0,phase:2,facing:1.57,chargeX:0,chargeY:1,patternIndex:0};
        battle={id,boss:true};await FinalAssetLoadingV1.ready();if(FinalAssetLoadingV1.busy()||FinalAssetLoadingV1.snapshot().error)throw Error('Fixture final art is not ready');
        const step=dt=>{choreo.clock+=dt;updateEnemy(e,dt,true);};
        let release;
        if(id.startsWith('c3_')){
          C3.castPattern(e,kind);
          const h=C3.hazards[0]; release=()=>step(h.time-h.trigger+.0001);
        }else if(id==='boss'){
          e.wind=.6;e.windKind=kind;step(.01);release=()=>step(e.wind+.001);
        }else if(kind==='volley'){
          e.volley091=0;step(.01);
        }else{
          e.cd=0;e.step09=kind==='double_wave'?2:kind==='feedback'?1:0;step(.001);
          release=()=>step((e.echoWarning092||e.tele09.time)+.001);
        }
        const label=id+'/'+kind,draw=()=>drawCreature(200,200,'boss',e);
        if(release){
          sample(label,fx.bosses[id][kind],palette,draw,[e,C3.hazards]);
          if(!['double_wave','chase','orbit'].includes(kind)){
            cam.x=e.x*T-VW/2;cam.y=e.y*T-VH/2;
            sample(label+'/ground',fx.bosses[id][kind],palette,()=>choreo.drawGround(),[e,C3.hazards]);
          }
          release();
        }
        sample(label,fx.bosses[id][kind],palette,draw,[e,C3.hazards]);
        if(['chase','orbit','volley'].includes(kind)){
          expect(hostileShots.length===({chase:5,orbit:12,volley:3})[kind],label+' shot count');
          sample(label+'/shot',fx.bosses[id][kind],palette,()=>BossGroundFXV1.drawProjectile(hostileShots[0]),hostileShots);
        }
      }
      const mobs=[['hush','claws','void'],['whisper','wisp','ghost'],['abafador','bell','void'],
        ['compasso','pendulum','drum'],['c3_drone','pistons','iron'],['c3_echo','fracture','radio'],
        ['espelho','mirror','ghost'],['espelho','echo','ghost']];
      for(const [type,shape,palette] of mobs){
        await fixture('forest');battle={boss:false,id:'field'};
        const e=hydrateEnemy({id:'qa_'+type,type,x:14.6,y:15});e.cd=0;const image=window.EnemyVariantArtV2?.supports(e)?EnemyVariantArtV2.image(type):EnemyArtV1.image(EnemyArtV1.key(type,e));await FinalAssetLoadingV1.requireImage(image,'QA enemy '+type);await FinalAssetLoadingV1.ready();if(FinalAssetLoadingV1.busy()||FinalAssetLoadingV1.snapshot().error)throw Error('Fixture final art is not ready');
        const step=dt=>{EnemyArtV1.clock+=dt;updateEnemy(e,dt,false);};
        if(type==='compasso'){e.clock=.998;e.lastBeat=0;}
        if(type==='espelho'&&shape==='echo'){e.clock=1;e.hits=[.4,.8];}
        step(.02);
        if(e.wind>0)step(e.wind+.001);
        const draw=()=>drawCreature(200,200,type,e);
        sample(type+'/'+shape,shape,palette,draw,[e]);
        if(type==='abafador')sample(type+'/aura','baffle','void',draw,[e]);
        if(type==='whisper'){
          expect(hostileShots.length===1,'Whisper should emit one shot');
          sample(type+'/shot','wisp','ghost',()=>BossGroundFXV1.drawProjectile(hostileShots[0]),hostileShots);
        }
      }
      const uniqueSheets=[...new Set(sheets.values())];
      const catalog=document.createElement('canvas');catalog.width=320;catalog.height=40*uniqueSheets.length;
      const q=catalog.getContext('2d',{willReadFrequently:true});
      const manifest=uniqueSheets.map((sheet,row)=>{
        q.drawImage(sheet,0,row*40);
        const checks=[];
        for(let i=0;i<8;i++){
          const pixels=q.getImageData(i*40,row*40,40,40).data;
          expect(pixels.some((n,i)=>i%4===3&&n>190),'Invisible sprite');
          expect(!pixels[3]&&!pixels[pixels.length-1],'Bleeding sprite corner');
          let hash=2166136261;
          for(const n of pixels)hash=Math.imul(hash^n,16777619);
          checks.push(hash>>>0);
        }
        expect(new Set(checks).size===8,'Too few distinct poses '+row);
        return {row,attacks:[...sheets].filter(([,im])=>im===sheet).map(([id])=>id),distinctFrames:new Set(checks).size};
      });
      return {rows,manifest,png:catalog.toDataURL('image/png')};
    });
    assert.deepEqual(errors,[]);
    if(process.env.ENEMY_FX_EXPORT){
      fs.writeFileSync('assets/enemy-attack-fx/attack-strips.png',Buffer.from(result.png.split(',')[1],'base64'));
      fs.writeFileSync('assets/enemy-attack-fx/manifest.json',JSON.stringify({cell:40,frames:8,rows:result.manifest},null,2)+'\n');
    }
    console.log(JSON.stringify({draws:result.rows.length,clips:result.manifest.length,actions:result.rows.map(r=>r.name)}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
