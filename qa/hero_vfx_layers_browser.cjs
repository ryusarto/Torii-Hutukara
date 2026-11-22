// Probe primitives submitted by the real combat renderer. The forced missing-
// artwork pass is a positive control: it must still draw each original crescent.
'use strict';
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_CORE || 'playwright');

(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      requestAnimationFrame = () => 0;
      window.__pads = [];
      Object.defineProperty(navigator, 'getGamepads', {value:() => window.__pads});
    });
    await page.goto(process.argv[2], {waitUntil:'load', timeout:120000});
    const result = await page.evaluate(async () => {
      const check = (ok, label) => { if (!ok) throw Error(label); };
      const pad = index => ({index,id:'VFX QA',connected:true,mapping:'standard',axes:[0,0],
        buttons:Array.from({length:18}, () => ({pressed:false,value:0}))});
      HeroAttackFX.prepare();
      await Promise.all([HeroAttackFX.atlas.decode(), HeroAttackFX.sword.decode()]);
      const heroes = ['franco','ryuchi','katana','synth','percussion'];
      for (const hero of heroes) {
        HeroAttackFX.ready(hero);
        await HeroAttackFX.v2Images[hero].decode();
        check(HeroAttackFX.ready(hero), 'atlas '+hero);
      }
      function arena(hero, seat) {
        G=fresh();const other=hero==='franco'?'ryuchi':'franco';
        G.active=seat?other:hero;G.formation=[G.active,seat?hero:other];
        G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;
        G.c3.synthUnlocked=G.c3.percussionUnlocked=true;
        for (const id of G.formation) {G.hp[id]=G.maxhp[id]=100;G.levels[id]=5}
        G.resonance=100;current=mk('forest',48,40,'grass');G.area='forest';
        G.x=13.5;G.y=15.5;G.dir='right';G.aim091=[1,0];
        mode='action';battle={boss:false,id:'field'};bossActor=null;keys={};tick=8;menuOpen=false;
        trail=[];hostileShots=[];projectiles=[];combatFX.length=0;resetMotion10();
        Combat10.effects=[];Special11.traces=[];Special11.fields=[];
        C3.synthWave=0;C3.synthZones=[];C3.hazards=[];C3.percussionGuard=0;
        Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,combo:0,comboTime:0,slash:0});
        Input121.game=G;Input121.focused=true;Input121.lastArea=G.area;
        __pads=[pad(0),pad(1)];C3.pad.pads=__pads;C3.pad.previous.clear();
        C3.coop.member=G.formation[1];C3.syncCoop(true);
        Object.assign(C3.coop,{x:17,y:16,dir:'left',cool:0,skill:0,advanced:0,signature:0,combo:0,lastAttack:-20,attackUntil:0});
        HeroAttackFX.sync();cam.x=cam.y=0;
      }
      const methods=['arc','drawImage'];
      function render(fallback=false) {
        const arcs=[],images=[],events=[];
        const saved=methods.map(k=>ctx[k]), ready=HeroAttackFX.ready,drawV2=HeroAttackFX.drawV2;
        HeroAttackFX.drawV2=function(event,...rest){
          const shown=drawV2.call(this,event,...rest);
          if(shown)events.push(event);
          return shown;
        };
        if(fallback)HeroAttackFX.ready=()=>false;
        ctx.arc=function(x,y,r,a,b,...rest){
          arcs.push({x,y,r,span:Math.abs(a-b)});
          return saved[0].call(this,x,y,r,a,b,...rest);
        };
        ctx.drawImage=function(im,...args){
          const owner=heroes.find(h=>HeroAttackFX.v2Images[h]===im);
          if(owner || im===HeroAttackFX.atlas || im===HeroAttackFX.sword){
            const t=this.getTransform();
            images.push({owner:owner||'legacy',x:t.e,y:t.f,row:args[1]/128,frame:args[0]/128});
          }
          return saved[1].call(this,im,...args);
        };
        try {drawCombatLayer();}
        finally {methods.forEach((k,i)=>ctx[k]=saved[i]);HeroAttackFX.ready=ready;HeroAttackFX.drawV2=drawV2}
        return {arcs,images,events};
      }
      function crescent(frame,seat) {
        return frame.arcs.filter(a=>a.x===0 && a.y===0 && a.span<Math.PI &&
          (seat?a.r===44:[37,32,27].includes(a.r))).length;
      }
      const records=[];
      for(const hero of heroes)for(const seat of [0,1]){
        arena(hero,seat);
        const body=seat?C3.coop:G,start=body.x;
        const move=()=>{if(seat){__pads[1].axes=[-.7,0];C3.coopMove(__pads[1],1/30)}
          else moveG(1,0,1/30)};
        move();check(body.x!==start,'movement before cast '+hero+seat);
        const origin={x:body.x,y:body.y};
        if(seat)C3.coopAttack();else attackAction();
        const first=render().images.find(i=>i.owner===hero);
        move();check(body.x!==origin.x,'movement during cast '+hero+seat);
        const event=HeroAttackFX.events.find(e=>e.art?.hero===hero && e.art.clip===0);
        check(event && Math.hypot(event.x-origin.x,event.y-origin.y)<.001,'cast origin '+hero+seat);
        const actual=render(),old=render(true);
        const sprites=actual.images.filter(i=>i.owner===hero);
        check(sprites.length>0 && !actual.images.some(i=>i.owner==='legacy'),'new stroke + old sheet '+hero+seat);
        check(sprites.some(i=>Math.hypot(i.x-origin.x*T,i.y-origin.y*T)<42),'wrong seat bitmap '+hero+seat);
        check(first && sprites.some(i=>Math.abs((i.x-first.x)-(body.x-origin.x)*T)<=1),
          'attack separated from moving hand '+hero+seat);
        if(hero==='franco'){
          check(crescent(old,seat)>0,'missing historical positive control P'+(seat+1));
          check(crescent(actual,seat)===0,'extra crescent P'+(seat+1));
          const frozen=HeroAttackFX.clock;mode='overlay';update(.2);
          check(HeroAttackFX.clock===frozen,'pause advanced clock');
          const pose=f=>f.images.map(i=>[i.owner,i.frame,i.row]);
          check(JSON.stringify(pose(render()))===JSON.stringify(pose(actual)),'pause advanced sprite');
        }
        records.push({hero,seat,clip:event.art.clip});
      }
      arena('franco',0);
      current.enemies=[hydrateEnemy({id:'layer_target',type:'hush',x:G.x+1.3,y:G.y+.16})];
      attackAction();
      // Same geometry as player strikes. Distinct world positions let us check
      // that enemy/warning/hurt feedback remains independently visible.
      const controls=['strike','warning','hurt','hit','duo','pulse','xp','dodge'];
      controls.forEach((kind,i)=>addCombatFX(4+i,5,kind,.75));
      const playerFX=combatFX.find(f=>f.heroArt==='franco');
      check(playerFX,'hero ring missing attribution');
      const normal=render(),fallback=render(true);
      const ringAt=(r,x,y)=>r.arcs.some(a=>Math.abs(a.x-x*T)<.01 && Math.abs(a.y-(y*T-12))<.01 && a.span>6);
      for(let i=0;i<controls.length;i++)check(ringAt(normal,4+i,5),'lost '+controls[i]);
      check(ringAt(fallback,playerFX.x,playerFX.y)&&!ringAt(normal,playerFX.x,playerFX.y),'duplicated player ring');
      for(const seat of [0,1]){
        arena('alt',seat);if(seat)C3.coopAttack();else attackAction();
        const arrow=projectiles.find(p=>p.arrow);
        check(arrow && !HeroLegacyFX.ready('alt') && HeroAttackFX.drawProjectile(arrow),'arrow lost '+seat);
        check(render().images.some(i=>i.owner==='legacy'),'arrow cast lost '+seat);
      }
      for(const hero of ['katana','percussion']){
        arena(hero,0);
        const katana=hero==='katana';
        if(katana)advancedSkill();else skillAction();
        const prepared=HeroAttackFX.events.at(-1);
        const window=katana?Combat10.guard:C3.percussionGuard;
        check(window>0 && prepared.duration>=window-.001,'short guard '+hero);
        const elapsed=window-.04;
        HeroAttackFX.advance(elapsed);updateAction(elapsed);mode='action';
        check(render().events.includes(prepared),'guard cue disappeared '+hero);
        act.invuln=0;
        damageHero(4,hydrateEnemy({id:'guard_contact',type:'hush',x:G.x+.65,y:G.y}));
        HeroAttackFX.advance(.001);
        check(!(katana?Combat10.guard:C3.percussionGuard),'guard not triggered '+hero);
        check(!render().events.includes(prepared),'guard still showing after reaction '+hero);
      }
      // Use the world compositor, not drawCombatLayer() in isolation. Both
      // players occupy one tile and the third party member follows beside them.
      const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
      let crowdCases=0;
      for(const [direction,[dx,dy]] of Object.entries(directions))for(const missing of [false,true]){
        arena('franco',0);
        G.formation=['franco','alt','ryuchi'];G.hp.alt=100;G.maxhp.alt=100;
        G.dir=direction;G.aim091=[dx,dy];
        C3.coop.member='alt';C3.syncCoop(true);
        Object.assign(C3.coop,{x:G.x+.14,y:G.y+.10,dir:direction,cool:0,attackUntil:0});
        trail=[{x:G.x-.13,y:G.y+.06,dir:direction}];
        C3.coopAttack();attackAction();skillAction();
        HeroAttackFX.advance(.06);
        const shot=projectiles.find(p=>p.arrow);
        check(shot && shot.vx*dx+shot.vy*dy>0,'shoot '+direction);
        // Place a real traveling arrow at a visible distance beyond the crowd.
        shot.x+=dx*2.5;shot.y+=dy*2.5;
        for(const id of G.formation)await RunStrideV1.image(id).ready;
        const calls=[],poses=[],arrowPositions=[];
        const actorDraw=drawActor,imageDraw=ctx.drawImage,ready=HeroAttackFX.ready;
        const overlayDraw=HeroLegacyFX.drawOverlay;
        if(missing)HeroAttackFX.ready=()=>false;
        drawActor=function(p,x,y,...rest){
          if(G.formation.includes(p.style)){calls.push('actor');poses.push({id:p.style,x,y})}
          return actorDraw.call(this,p,x,y,...rest);
        };
        ctx.drawImage=function(im,...args){
          if(im===HeroAttackFX.atlas || im===HeroAttackFX.sword || im===HeroAttackFX.v2Images.franco)
            calls.push('partyFX');
          if(im===HeroAttackFX.atlas && args[0]>=960 && args[1]===(37%24)*96){
            const t=this.getTransform();arrowPositions.push([t.e,t.f]);
          }
          return imageDraw.call(this,im,...args);
        };
        const heads=()=>poses.map(({x,y})=>ctx.getImageData(x-10,y-54,21,38).data);
        HeroLegacyFX.drawOverlay=function(){
          const before=heads();
          overlayDraw.call(this);
          const after=heads();
          check(before.length===3,'incomplete group '+JSON.stringify(poses));
          for(let i=0;i<3;i++)check(before[i].every((v,j)=>v===after[i][j]),'head/torso painted over '+poses[i].id);
        };
        try{
          drawEnv();
          check(new Set(poses.map(p=>p.id)).size===3,'party failed to render');
          // Parados, os aliados dão um passo para o lado do líder (Fase 6), até ~1 casa.
          check(poses.every(p=>Math.hypot(p.x-poses[0].x,p.y-poses[0].y)<=T*2),'party spread out');
          check(calls.includes('partyFX') && calls.lastIndexOf('partyFX')<calls.indexOf('actor'),'offense above party '+direction+missing);
          check(HeroAttackFX.events.some(e=>e.art?.hero==='franco') && projectiles.includes(shot),'world draw mutated cast');
          check(arrowPositions.some(([x,y])=>Math.hypot(x-(shot.x*T-cam.x),y-(shot.y*T-cam.y))<1),
            'projectile did not render at its full travel distance '+direction);
        }finally{drawActor=actorDraw;ctx.drawImage=imageDraw;HeroAttackFX.ready=ready;HeroLegacyFX.drawOverlay=overlayDraw}
        crowdCases++;
      }
      return {movingCasts:records.length,francoCrescentsRemoved:2,feedbackKinds:controls,arrowSeats:2,pausedSeats:2,guardWindows:2,crowdCases};
    });
    assert.deepEqual(errors,[]);
    console.log('Combat layer regression passed',JSON.stringify(result));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
