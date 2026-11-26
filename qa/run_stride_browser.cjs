// Drive real movement through keyboard or a second standard Gamepad. Observe the
// actual source rectangles submitted by the public actor renderer in an isolated page.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  try {
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      requestAnimationFrame=()=>0;window.__pads=[];
      Object.defineProperty(navigator,'getGamepads',{value:()=>window.__pads});
    });
    await page.goto(process.argv[2],{waitUntil:'load',timeout:120000});
    await page.evaluate(()=>{
      for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');
      $('playtestEntry')?.remove();
      window.__runSetup=async function(hero,seat,masked,dx,dy){
        G=fresh();G.flags.masks=masked;G.flags.bass=true;
        const partner=hero==='franco'?'ryuchi':'franco';
        G.active=seat?partner:hero;G.formation=[G.active,seat?hero:partner];
        for(const id of G.formation){G.hp[id]=G.maxhp[id]=100;G.levels[id]=5;}
        current=mk('forest',80,80,'grass');G.area=current.id;G.x=30.5;G.y=30.5;
        mode='walk';battle=null;bossActor=null;keys={};trail=[];touchDir={};resetMotion10();
        Input121.game=G;Input121.lastArea=G.area;Input121.focused=true;Combat10.dashTime=0;
        const pad=index=>({index,id:'Run QA',connected:true,mapping:'standard',axes:[0,0],
          buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
        window.__pads=seat?[pad(0),pad(1)]:[];C3.pad.previous.clear();C3.pad.pads=window.__pads;
        if(seat){
          C3.coop.member=hero;C3.syncCoop(true);update(0);C3.coop.x=32.5;C3.coop.y=30.5;
          __pads[1].axes=[dx,dy];__pads[1].buttons[6]={pressed:true,value:1};
        }
        if(MusicianArtV1.supports(hero))MusicianArtV1.setVariant(hero,masked?'masked':'unmasked');
        if(!await RunStrideV1.image(hero).ready)throw Error('Missing run sheet '+hero);
        if(masked&&RunStrideV1.manifest.heroes[hero].nativeRunRows?.length)await ProtagonistArtV5.image(hero+'_run').decode();
      };
      window.__runDraw=(hero,dir,seat,world=false)=>{
        const seen=[],original=ctx.drawImage,body=seat?C3.coop:G;
        const rec=RunStrideV1.image(hero);
        ctx.drawImage=function(sheet,...args){
          if(sheet===rec.bitmap)seen.push([args[0]/rec.cell,args[1]/rec.cell]);
          else if(ProtagonistArtV5.supports(hero)&&sheet===ProtagonistArtV5.images[hero+'_run']&&RunStrideV1.manifest.heroes[hero].nativeRunRows?.includes(args[1]/256))seen.push([args[0]/256,args[1]/256]);
          return original.call(this,sheet,...args);
        };
        try{if(world)drawEnv();else drawActor({style:hero,dir},body.x*T-cam.x,body.y*T-cam.y,true);}
        finally{ctx.drawImage=original;}
        return seen;
      };
    });
    const directions=[['down','s',0,1],['left','a',-1,0],['up','w',0,-1],['right','d',1,0]];
    const report=[];
    for(const hero of ['franco','ryuchi','alt','katana','synth','percussion']){
      const {frames,rows,strideDistance,nativeRunRows}=await page.evaluate(hero=>RunStrideV1.manifest.heroes[hero],hero);
      assert.equal(frames,16);
      for(const masked of rows>4?[false,true]:[false])for(const seat of [0,1])for(const [index,[dir,key,dx,dy]] of directions.entries()){
        await page.evaluate(({hero,seat,masked,dx,dy})=>__runSetup(hero,seat,masked,dx,dy),{hero,seat,masked,dx,dy});
        if(!seat){await page.keyboard.down('Shift');await page.keyboard.down(key);}
        const r=await page.evaluate(({hero,seat,dir,strideDistance})=>{
          const cols=new Set(),rows=new Set(),body=seat?C3.coop:G;
          const sx=body.x,sy=body.y;
          let distance=0;
          for(let step=0;step<250&&distance<(strideDistance||3.172)*1.25;step++){
            update(1/60);distance=Math.hypot(body.x-sx,body.y-sy);
            cam.x=body.x*T-VW/2;cam.y=body.y*T-VH/2;
            for(const [col,row] of __runDraw(hero,dir,seat,seat===1)){cols.add(col);rows.add(row);}
          }
          const last=__runDraw(hero,dir,seat);
          mode='overlay';update(.05);const paused=__runDraw(hero,dir,seat);
          return {distance,cols:[...cols],rows:[...rows],frozen:JSON.stringify(last)===JSON.stringify(paused)};
        },{hero,seat,dir,strideDistance});
        if(!seat){await page.keyboard.up(key);await page.keyboard.up('Shift');}
        const label=hero+'/'+seat+'/'+masked+'/'+dir;
        assert.deepEqual(r.rows,[index+(masked?4:0)],label);
        const native=masked&&nativeRunRows?.includes(index+4);
        assert.equal(r.cols.length,native?8:frames,label);if(native)assert(r.cols.every(c=>c%2===0),label+' canonical source columns');assert(r.frozen,label);assert(r.distance>3,label);
        report.push({hero,seat,masked,dir});
      }
    }
    // A held direction at a wall must not continue a run in place.
    await page.evaluate(()=>__runSetup('franco',0,false,1,0));
    await page.keyboard.down('Shift');await page.keyboard.down('d');
    const wall=await page.evaluate(()=>{
      for(let i=0;i<10;i++)update(1/60);
      const blocked=Math.floor(G.x)+1;
      for(let y=0;y<current.h;y++)current.blocked.add(blocked+','+y);
      for(let i=0;i<120;i++)update(1/60);
      const x=G.x;update(1/60);return {stationary:x===G.x,draws:__runDraw('franco','right',0)};
    });
    await page.keyboard.up('d');await page.keyboard.up('Shift');
    assert(wall.stationary);assert.deepEqual(wall.draws,[]);
    // Walking and stopped actors keep their established body sheets.
    await page.evaluate(()=>__runSetup('franco',0,false,1,0));await page.keyboard.down('d');
    const walk=await page.evaluate(()=>{
      const x=G.x;for(let i=0;i<12;i++)update(1/60);
      return {moved:G.x>x,draws:__runDraw('franco','right',0)};
    });
    await page.keyboard.up('d');assert(walk.moved);assert.deepEqual(walk.draws,[]);
    assert.deepEqual(errors,[]);
    console.log('PASS running body sprites for '+report.length+' keyboard/gamepad, mask and direction combinations');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
