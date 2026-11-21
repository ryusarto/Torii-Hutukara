// Bitmap, origin and timing checks against the actual hero inputs in the exported game.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE || 'playwright');

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
  try{
    const page=await browser.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
    await page.goto(process.argv[2],{waitUntil:'load',timeout:120000});
    await page.evaluate(require('./hero_attack_fixture.cjs'));
    const report=await page.evaluate(async()=>{
      const check=(pass,message)=>{if(!pass)throw Error(message)};
      const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
      const fx=HeroAttackFX,heroes=['franco','ryuchi','katana','synth','percussion'];
      const arena=window.heroAttackArena,latest=()=>fx.events.at(-1);
      fx.prepare();await Promise.all([fx.sword.decode(),fx.atlas.decode()]);
      for(const hero of heroes){fx.ready(hero);await fx.v2Images[hero].decode();check(fx.ready(hero),'Sheet missing '+hero)}
      await fx.bass.decode();check(fx.bass.naturalWidth===1024 && fx.bass.naturalHeight===48,'Bass strip dimensions');
      const inputs=[
        [()=>attackAction(),()=>skillAction(),()=>advancedSkill(),()=>duoAction()],
        [()=>C3.coopAttack(),()=>C3.coopSkill(),()=>C3.coopAdvanced(),()=>C3.coopSignature()]
      ];
      function draws(callback=()=>fx.draw()){
        const calls=[],original=ctx.drawImage;
        try{
          ctx.drawImage=function(image,...args){
            const t=this.getTransform();
            calls.push({image,sx:args[0],sy:args[1],sw:args[2],sh:args[3],x:t.e,y:t.f,
              angle:Math.atan2(t.b,t.a),scale:Math.hypot(t.a,t.b)});
            return original.call(this,image,...args);
          };
          callback();return calls;
        }finally{ctx.drawImage=original}
      }
      function sample(event,fraction){
        fx.clock=event.start+event.duration*fraction;
        return draws().at(-1);
      }
      let runs=0,frames=0;
      for(const hero of heroes)for(const seat of [0,1])for(let clip=0;clip<6;clip++){
        arena(hero,seat);
        const action=clip<3?0:clip-2,input=inputs[seat][action],body=seat?C3.coop:act;
        for(let i=0;i<(action===0?clip+1:1);i++){if(i)body.cool=0;tick+=.23;input()}
        const e=latest();check(e.art.hero===hero && e.art.clip===clip,'Invalid selection '+[hero,seat,clip,e.art?.clip]);
        const chord=hero==='franco' && clip===5;
        const drum=hero==='percussion' && e.art.floor;
        const count=chord?8:6;
        const sampled=new Set();
        for(let col=0;col<count;col++){
          const call=sample(e,(col+.35)/count);
          const [img,row,w,h]=chord?[fx.bass,0,128,48]:
            drum?[fx.v2Images[hero],clip*128+38,59,53]:[fx.v2Images[hero],clip*128,128,128];
          check(call.image===img && call.sy===row && call.sw===w && call.sh===h,
            'Wrong sheet, row or crop '+[hero,seat,clip,col,call.sy,call.sw,call.sh]);
          sampled.add(Math.floor(call.sx/128));frames++;
        }
        check(sampled.size===count,'Missing temporal draws '+[hero,seat,clip]);runs++;
      }
      // The wave uses the actual pre-knockback targets in either seat, including
      // enemies behind the player. An empty arena yields one short emission only.
      for(const seat of [0,1]){
        arena('franco',seat);const actor=seat?C3.coop:G;
        const targets=[.95,-1.4].map((d,i)=>hydrateEnemy({id:'bass'+i,type:'hush',x:actor.x+d,y:actor.y}));
        const positions=targets.map(e=>({x:e.x,y:e.y}));
        current.enemies.push(...targets);inputs[seat][3]();
        const event=latest();
        check(eq(event.art.hits.map(({x,y})=>({x,y})),positions) && event.art.hits.every((h,i)=>h.target===targets[i]),'Bass wave missed actual targets at '+seat);
        if(!seat)check(targets[0].x>positions[0].x,'Fixture must exercise genuine knockback');
        const edges=event.art.hits.map((h,i)=>fx.contactPoint(h,Math.atan2(h.y-event.y,h.x-event.x)+Math.PI,1));
        check(edges.every((e,i)=>Math.hypot(e.x-targets[i].x*T,e.y-targets[i].y*T)<75 && e.y<targets[i].y*T-12),
          'Contact escaped the hurt sprite');
        fx.clock=event.start+event.duration*.85;
        const waveCalls=draws().filter(c=>c.image===fx.bass);
        check(waveCalls.length===2 && waveCalls.every((c,i)=>Math.hypot(c.x-edges[i].x,c.y-edges[i].y)<.1),
          'Impact does not end at actual target '+seat);
        targets[0].y+=.3;
        const follow=draws().filter(c=>c.image===fx.bass);
        check(Math.abs(follow[0].y-waveCalls[0].y-.3*T)<.1,'Wave lost moving target after knockback');
        edges[0].y+=.3*T;
        current.enemies=current.enemies.filter(e=>e!==targets[0]);targets[0].y+=5;
        const removed=draws().filter(c=>c.image===fx.bass);
        check(Math.abs(removed[0].y-follow[0].y)<.1,'Wave followed a despawned target to another room');
        G.options10.reducedMotion=true;
        fx.clock=event.start+.12*event.duration;
        const onset=draws().filter(c=>c.image===fx.bass);
        check(onset.length===1 && Math.abs(onset[0].x-event.x*T)<26,'Reduced motion has no hand cue');
        fx.clock=event.start+.78*event.duration;
        const hold=draws().filter(c=>c.image===fx.bass);
        check(hold.length===2 && hold.every((c,i)=>Math.hypot(c.x-edges[i].x,c.y-edges[i].y)<.1),'Reduced motion hides actual contact');
        fx.clock=event.start+.86*event.duration;
        check(eq(hold.map(c=>[c.x,c.y,c.sx]),draws().filter(c=>c.image===fx.bass).map(c=>[c.x,c.y,c.sx])),
          'Reduced motion target cue shakes');
        arena('franco',seat);inputs[seat][3]();
        const miss=latest();
        check(!miss.art.hits.length && draws().filter(c=>c.image===fx.bass).length===1,'Bass fabricated contact');
        const saved=fx.bass;fx.bass=new Image();
        try{
          const call=sample(miss,.55);
          check(call.image===fx.v2Images.franco && call.sy===51 && call.sh===26,'Bass fallback drew an emblem');
        }finally{fx.bass=saved}
      }
      // Bosses live outside current.enemies. Keep the impact attached through
      // displacement and release the reference immediately if the room changes.
      arena('franco');const boss=hydrateEnemy({id:'c3_silence',type:'boss',x:G.x+2,y:G.y});
      boss.hp=boss.max=5000;bossActor=boss;
      await EnemyArtV1.image(EnemyArtV1.key('boss',boss)).decode();
      const beforeBoss=boss.hp;inputs[0][3]();const bossCast=latest();
      check(boss.hp<beforeBoss && bossCast.art.hits[0].target===boss,'Missing authoritative boss hit');
      fx.clock=bossCast.start+.86*bossCast.duration;
      const beforeMove=draws().find(c=>c.image===fx.bass);
      boss.x+=.25;const afterMove=draws().find(c=>c.image===fx.bass);
      check(Math.abs(afterMove.x-beforeMove.x-.25*T)<.1,'Boss edge detached after motion');
      G.area='ruins';fx.sync();check(fx.events.length===0,'Bass crosses rooms after defeating boss');
      for(const [hero,clip] of [['katana',1],['katana',2],['synth',2],['percussion',2]]){
        arena(hero);const target=hydrateEnemy({id:'short-contact',type:'hush',x:G.x+1.2,y:G.y});
        target.hp=target.max=900;current.enemies.push(target);
        for(let stage=0;stage<=clip;stage++){
          target.x=G.x+1.2;target.y=G.y;act.cool=0;tick+=.23;inputs[0][0]();
        }
        const mark=fx.events.find(e=>e.art?.edgeHit && e.art.clip===clip);
        check(mark?.art.edgeHit.target===target,'Missing close-range edge '+[hero,clip]);
        const source=draws(()=>fx.drawV2(mark,.32))[0];
        const side=Math.hypot(source.x-target.x*T,source.y-(target.y*T-17));
        check(side>=10 && side<=75,'Close-range contact hides inside target '+[hero,clip,side]);
      }
      // The hand follows the player's shoulder while the baseline direction is held.
      arena('franco',1);inputs[1][0]();
      const bass=latest(),first=sample(bass,.28);C3.coop.x+=1.25;
      const moved=sample(bass,.28);check(Math.abs((moved.x-first.x)-1.25*T)<1,'Bass detached from P2');
      check(Math.abs(Math.abs(moved.angle)-Math.PI)<.01,'Wrong direction for P2 pluck');
      arena('ryuchi');inputs[0][0]();
      const slash=latest();check(Math.abs(sample(slash,.76).angle-sample(slash,.10).angle)>.7,'Blade never swept');
      G.options10.reducedMotion=true;
      const a=sample(slash,.06),b=sample(slash,.94);
      check(eq([a.x,a.y,a.sx,a.angle],[b.x,b.y,b.sx,b.angle]),'Reduced motion still sweeps');
      const clock=fx.clock;menuOpen=true;fx.advance(.35);check(fx.clock===clock,'Menu advances FX');
      // A bitmap that has not decoded must draw V1 until the existing event can use the V2 sheet.
      const back=fx.v2Images.ryuchi;fx.v2Images.ryuchi=new Image();
      try{check(draws().at(-1).image===fx.sword,'Lost load-time fallback')}
      finally{fx.v2Images.ryuchi=back}
      check(draws().at(-1).image===back,'Decoded sheet not restored');
      arena('ryuchi');const start=G.x;inputs[0][2]();const dash=latest();
      check(dash.art.gesture==='path' && dash.x===start && dash.art.end.x===G.x && G.x>start,'Dash ignores actual displacement');
      check(sample(dash,.95).x>sample(dash,.05).x+T,'Dash does not cross path');

      // Isolate target contacts: a miss creates no hit flash, a real hit anchors at pre-knockback position.
      arena('franco');inputs[0][0]();check(!fx.events.some(e=>e.art?.gesture==='impact'),'Air strike created a hit');
      arena('franco');const victim=hydrateEnemy({id:'test-contact',type:'hush',x:G.x+1.3,y:G.y});
      current.enemies.push(victim);const vx=victim.x,vy=victim.y,hp=victim.hp;inputs[0][0]();
      check(victim.hp<hp && fx.events.some(e=>e.art?.gesture==='impact' && e.x===vx && e.y===vy),'Real hit lost its position');
      arena('katana');const target=hydrateEnemy({id:'test-iai',type:'hush',x:G.x+.9,y:G.y});
      current.enemies.push(target);const targetHP=target.hp;inputs[0][1]();
      const iai=latest();tickMotion10(.035);fx.trackTravel();
      check(iai.art.end.x===G.x && iai.art.end.x>iai.x && target.hp<targetHP && fx.events.some(e=>e.art?.gesture==='impact'),'Iai lost path or contact');
      fx.clock=iai.start+.60*iai.duration;
      const echoes=draws().filter(c=>c.image===fx.v2Images.katana && c.sw===128);
      check(echoes.length===2 && echoes[0].x<echoes[1].x,'Missing delayed iai echo');
      arena('synth');inputs[0][1]();const zone=C3.synthZones[0];inputs[0][2]();
      const filter=fx.events.find(e=>e.row===40);
      check(filter?.x===zone.x && filter.y===zone.y && filter.x!==G.x,'Filter detached from pad');
      const field=(phase)=>draws(()=>fx.drawV2(filter,phase)).at(-1);
      check(field(.85).scale<field(.12).scale,'Filter never converges');
      // Drain any outstanding timed percussion casts before starting a fresh sequence.
      arena('franco');await new Promise(r=>setTimeout(r,360));
      arena('percussion');inputs[0][2]();await new Promise(r=>setTimeout(r,65));G.x+=1;
      await new Promise(r=>setTimeout(r,148));G.x+=1;await new Promise(r=>setTimeout(r,135));
      const beats=fx.events.filter(e=>e.row===39);
      check(eq(beats.map(e=>e.x),[G.x-2,G.x-1,G.x]),'Break pulses detached from real beats');
      arena('percussion');inputs[0][3]();check(fx.events.some(e=>e.row===39 && e.art.clip===5),'Super reused advanced pulse');
      for(const [hero,button,window] of [['katana',2,()=>Combat10.guard],['percussion',1,()=>C3.percussionGuard]]){
        arena(hero);inputs[0][button]();const guard=latest();
        check(guard.duration===window() && guard.art.guard===hero,'Guard duration mismatch '+hero);
        act.invuln=0;damageHero(5,hydrateEnemy({id:'guard-probe',type:'hush',x:G.x+.8,y:G.y}));
        check(window()===0 && !draws().some(c=>c.image===fx.v2Images[hero] && (c.sy===guard.art.clip*128 || c.sy===guard.art.clip*128+38) && (c.sw===128 || c.sw===59)),
          'Successful counter still draws full stance '+hero);
      }
      arena('alt');inputs[0][1]();const arrow=projectiles.at(-1);
      check(arrow?.arrow && !fx.ready('alt') && draws(()=>fx.drawProjectile(arrow))[0].image===fx.atlas,'Archer flight replaced');
      arena('ryuchi');inputs[0][1]();check(projectiles.length===3,'Triple blade count changed');
      for(const shot of projectiles){
        const old=JSON.stringify(shot),c=draws(()=>fx.drawProjectile(shot))[0];
        check(c.image===fx.v2Images.ryuchi && c.x===Math.round(shot.x*T) && c.y===Math.round(shot.y*T) &&
          Math.abs(c.angle-Math.atan2(shot.vy,shot.vx))<.001 && JSON.stringify(shot)===old,'Shot detached or mutated');
      }
      return {heroes:heroes.length,seatAndMoveCases:runs,sampledFrames:frames,realBreakBeats:beats.length,realTripleBlades:projectiles.length,archerFlight:'V1'};
    });
    assert.deepEqual(errors,[]);console.log('Hero weapon signatures passed',JSON.stringify(report));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
