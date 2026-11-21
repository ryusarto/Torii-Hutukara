/* Exercise the actual injected module with controlled game/canvas fixtures.
 * Real PNG loading and visual review remain separate browser checks.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const modulePath = path.join(root, 'game/source/chapter-03/musician_art_v1.js');
const source = fs.readFileSync(modulePath, 'utf8');
const heroes = {synth: 'franco_sintetizador', percussion: 'ryuchi_percussionista'};
const states = ['idle','walk','run','roll','attack_1','attack_2','attack_3','skill','advanced','signature','hurt','defeat','performance'];
const directions = ['down','left','up','right'];
const variants = ['unmasked','masked'];
const expressions = ['neutral','speaking','happy','surprised','determined','angry','hurt','sad'];
const assets = {};
for (const canonical of Object.values(heroes)) for (const variant of variants) {
  for (const state of states) assets[canonical + '_' + variant + '_' + state] = 'fixture:' + canonical + '_' + variant + '_' + state;
  for (const expression of expressions) assets[canonical + '_' + variant + '_portrait_' + expression] = 'fixture:' + canonical + '_' + variant + '_portrait_' + expression;
}
function harness(options = {}) {
  const draws = [], stats = {actor: 0, npc: 0, update: 0, dialogue: 0}, elements = {portrait: {src: ''}};
  const h = {
    G: {active: 'synth', area: 'power_plant', x: 3, y: 4, dir: 'down', isRunning10: false,
      flags: {masks: true}, hp: {synth: 44, percussion: 46}, resonance: 90, options10: {}},
    act: {cool: 0, skill: 0, skillX: 0, duo: 0, combo: 0, hit: 0, invuln: 0},
    C3: {coop: {member: 'percussion', x: 8, y: 9, dir: 'right', cool: 0, skill: 0,
      advanced: 0, signature: 0, combo: 0, hit: 0, dash: 0, stride: 0, running: false},
      synthWave: 0, percussionGuard: 0},
    cam: {x: 0, y: 0}, T: 24, tick: .13, stride10: 0, mode: 'action',
    Input121: {roll: null}, Combat10: {dashTime: 0}, dialogueQueue: [],
    ctx: {save() {}, restore() {}, drawImage(...args) { draws.push(args); }},
    $: id => elements[id],
    Image: class {
      constructor() {
        this.complete = true; this.naturalWidth = 2048; this.naturalHeight = 1024;
        if(options.withDecode)this.decode=()=>{stats.decode=(stats.decode||0)+1;
          return options.rejectDecode?Promise.reject(Error('simulated decode failure')):Promise.resolve();};
      }
      set src(value) {
        this.value = value;
        if (options.pending?.some(key => value.includes(key))) { this.complete = false; this.naturalWidth = 0; }
        if (options.broken?.some(key => value.includes(key))) { this.complete = true; this.naturalWidth = 0; }
      }
      get src() { return this.value; }
    }
  };
  h.activeModes10 = () => ['action','walk'].includes(h.mode);
  h.C3.coopMember = () => h.C3.coop.member;
  h.C3.coopActive = () => !!h.C3.coop.member;
  h.update = dt => {
    stats.update++;
    if(!h.activeModes10())return;
    for(const key of ['cool','skill','skillX','duo','hit','invuln'])h.act[key]=Math.max(0,(h.act[key]||0)-dt);
    for(const key of ['cool','skill','advanced','signature','hit'])h.C3.coop[key]=Math.max(0,(h.C3.coop[key]||0)-dt);
    h.Combat10.dashTime=Math.max(0,h.Combat10.dashTime-dt);h.C3.coop.dash=Math.max(0,h.C3.coop.dash-dt);
  };
  h.drawActor = () => { stats.actor++; return 'legacy-actor'; };
  h.drawDetailedNPC = () => { stats.npc++; return 'legacy-npc'; };
  h.c3NpcPose = n => ({dir: n.dir || 'down'});
  h.portraitURI10 = id => 'legacy-portrait:' + id;
  h.advanceDialogue = () => { stats.dialogue++; return 'legacy-dialogue'; };
  h.attackAction = () => {
    if (!h.activeModes10() || h.act.cool > 0 || h.Combat10.dashTime > 0) return false;
    h.act.cool = h.G.active === 'synth' ? .22 : .24; h.act.combo = h.act.combo % 3 + 1;
    if (h.G.active === 'synth') h.C3.synthWave = h.C3.synthWave % 3 + 1;
    return true;
  };
  for (const [name,key,value] of [['skillAction','skill',3.2],['advancedSkill','skillX',6.2],['duoAction','duo',7]]) {
    h[name] = () => {
      if (!h.activeModes10() || h.act[key] > 0 || (name === 'duoAction' && h.G.resonance < 40)) return false;
      h.act[key] = value;
      if (name === 'duoAction') h.G.resonance -= 40;
      return true;
    };
  }
  for (const [name,key,value] of [['coopAttack','cool',.24],['coopSkill','skill',4.2],['coopAdvanced','advanced',6.5],['coopSignature','signature',7]]) {
    h.C3[name] = () => {
      const c = h.C3.coop;
      if (!h.activeModes10() || c[key] > 0 || (name === 'coopSignature' && h.G.resonance < 40)) return false;
      c[key] = value;
      if (name === 'coopAttack') c.combo = c.combo % 3 + 1;
      if (name === 'coopSignature') h.G.resonance -= 40;
      return true;
    };
  }
  h.damageHero = amount => {
    if (h.act.invuln > 0) return false;
    if (h.G.active === 'percussion' && h.C3.percussionGuard > 0) {
      h.C3.percussionGuard = 0; h.act.invuln = .65; return false;
    }
    h.G.hp[h.G.active] = Math.max(0, h.G.hp[h.G.active] - amount); h.act.hit = .35;
    return true;
  };
  h.C3.damageCoop = amount => {
    const id = h.C3.coop.member;
    h.G.hp[id] = Math.max(0, h.G.hp[id] - amount); h.C3.coop.hit = .35;
    return true;
  };
  h.startRoll121 = () => {
    if (!h.activeModes10() || h.Combat10.dashTime > 0) return false;
    h.Combat10.dashTime = .39; h.Input121.roll = {id:h.G.active,duration:.39}; return true;
  };
  h.C3.coopDodge = () => {
    const c=h.C3.coop; if (!h.activeModes10() || c.dash > 0) return false;
    c.dash=.38; c.rollDuration=.38; c.rollHero=c.member; return true;
  };
  // Use the production native fallback while the optional contact atlas is unavailable.
  h.HeroAttackFX = {follower(){}}; h.effect10 = () => {};
  vm.createContext(h);
  vm.runInContext(fs.readFileSync(path.join(root,'game/source/chapter-03/hero_attack_body.js'),'utf8').replace('__HERO_BODY_ATLASES__','{}').replace('__HERO_BODY_PLACEMENT__','{}'),h);
  vm.runInContext(source.replace('__MUSICIAN_ASSETS__', JSON.stringify(options.assets || assets))
    .replace('__MUSICIAN_MANIFEST__', JSON.stringify({animations: [], portraits: []})), h);
  return {h, art: vm.runInContext('MusicianArtV1', h), draws, stats, elements};
}

const results=[];
function check(name,fn){const detail=fn();results.push({name,passed:true,detail});}
function scene(hero='synth',variant='unmasked',seat=0,options={}){
 const s=harness(options),{h,art,draws}=s;
 h.G.active=seat===0?hero:hero==='synth'?'percussion':'synth';h.C3.coop.member=seat===1?hero:hero==='synth'?'percussion':'synth';
 art.setVariant(hero,variant);art.sync();
 const body=()=>seat===0?h.G:h.C3.coop;
 const draw=(moving=false)=>{
  const p={style:hero,dir:body().dir};h.drawActor(p,body().x*h.T-h.cam.x,body().y*h.T-h.cam.y,moving);
  const call=draws.at(-1),src=call?.[0]?.src||'',state=states.find(st=>src.endsWith('_'+st));
  return {state,frame:call?.[1]/256,clock:art.clock,src};
 };
 const start=()=>seat===0?h.attackAction():h.C3.coopAttack();
 const step=dt=>{h.tick+=dt;h.update(dt)};
 const record=()=>art.players[seat];
 return {...s,hero,variant,seat,draw,start,step,record};
}
function uniqueFrames(trace){return trace.filter(x=>x.state?.startsWith('attack_')).map(x=>x.frame).filter((n,i,a)=>i===0||n!==a[i-1]);}
for(const hero of ['synth','percussion'])for(const variant of variants)for(const seat of [0,1]){
 const tag=hero+'/'+variant+'/P'+(seat+1);
 check('60Hz exact ordered poses '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();const duration=s.record().duration,trace=[s.draw()];
  for(let i=0;i<30;i++){s.step(1/60);trace.push(s.draw())}
  assert.deepEqual(uniqueFrames(trace),[0,1,2,3,4,5,6,7]);assert.equal(trace.at(-1).state,'idle');assert.equal(s.record().duration,duration);
  return {duration,frames:uniqueFrames(trace)};
 });
 check('30Hz bounded tail '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();const duration=s.record().duration,trace=[];
  for(let i=0;i<18;i++){s.step(1/30);trace.push(s.draw())}
  assert.deepEqual(uniqueFrames(trace),[0,1,2,3,4,5,6,7]);
  const last=trace.filter(x=>x.state==='attack_1').at(-1);
  assert.ok(last.clock<=duration+.1+1e-8);assert.equal(trace.at(-1).state,'idle');
  assert.equal((seat===0?s.h.act:s.h.C3.coop).cool,0,'cooldown ends independently of visual tail');
  return {duration,lastPresentation:last.clock,tail:Math.max(0,last.clock-duration),frames:uniqueFrames(trace)};
 });
 check('reported .0668 + .060 stall '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();const trace=[s.draw()];
  for(let i=0;i<4;i++){s.step(.0167);trace.push(s.draw())}
  assert.equal(trace.at(-1).frame,2);s.step(.06);const corrected=s.draw();trace.push(corrected);assert.equal(corrected.frame,3,'target4 is capped to actually-presented3');
  for(let i=0;i<24;i++){s.step(1/60);trace.push(s.draw())}
  assert.deepEqual(uniqueFrames(trace),[0,1,2,3,4,5,6,7]);return {corrected,frames:uniqueFrames(trace)};
 });
 check('extreme low RAF expires safely '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();s.step(.12);const a=s.draw();s.step(.12);const b=s.draw();s.step(.12);const expired=s.draw();
  assert.equal(a.frame,0);assert.equal(b.frame,1);assert.equal(expired.state,'idle');
  assert.ok(s.art.clock>s.record().duration+.1);assert.equal(s.record().presentedFrame,1,'remaining debt is discarded, never queued');
  return {frames:[a.frame,b.frame],expiresAt:expired.clock};
 });
 check('late first decode .150s '+tag,()=>{
  const canonical=heroes[hero],s=scene(hero,variant,seat,{pending:[canonical+'_'+variant+'_attack_1']});s.start();
  assert.equal(s.draw().state,'idle');assert.equal(s.record().presentedFrame,-1);
  s.step(.15);assert.equal(s.draw().state,'idle');assert.equal(s.record().presentedFrame,-1);
  const image=s.art.images[s.art.key(hero,variant,'attack_1')];image.complete=true;image.naturalWidth=2048;
  const trace=[s.draw()];assert.equal(trace[0].frame,0);
  for(let i=0;i<24;i++){s.step(1/60);trace.push(s.draw())}
  assert.deepEqual(uniqueFrames(trace),[0,1,2,3,4,5,6,7]);
  const last=trace.filter(x=>x.state==='attack_1').at(-1);assert.ok(last.clock<=s.record().duration+.1+1e-8);
  return {first:trace[0].clock,last:last.clock,frames:uniqueFrames(trace)};
 });
 check('decode after original deadline never starts ghost '+tag,()=>{
  const s=scene(hero,variant,seat,{pending:[heroes[hero]+'_'+variant+'_attack_1']});s.start();s.draw();s.step(.3);
  const image=s.art.images[s.art.key(hero,variant,'attack_1')];image.complete=true;image.naturalWidth=2048;
  assert.equal(s.draw().state,'idle');assert.equal(s.record().presentedFrame,-1);
  s.step(.03);assert.equal(s.draw().state,'idle');return {neverPresented:true};
 });
 check('queries duplicates failed draw never consume '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();
  const previous=s.h.ctx.drawImage;s.h.ctx.drawImage=()=>{throw Error('simulated renderer failure')};
  assert.throws(()=>s.draw(),/renderer failure/);assert.equal(s.record().presentedFrame,-1);
  s.h.ctx.drawImage=previous;assert.equal(s.draw().frame,0);s.step(.06);
  for(let i=0;i<4;i++)assert.equal(s.art.pose({style:hero},seat,false).frame,1);
  assert.equal(s.record().presentedFrame,0);assert.equal(s.draw().frame,1);
  for(let i=0;i<4;i++)assert.equal(s.draw().frame,1);assert.equal(s.record().presentedFrame,1);
  return {sameClock:s.art.clock,confirmed:s.record().presentedFrame};
 });
 check('accepted new action and hurt interrupt '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();const first=s.record();s.draw();s.step(.06);s.draw();s.start();assert.equal(s.record(),first,'rejected command does not restart');
  s.step(.2);s.start();assert.notEqual(s.record(),first);assert.equal(s.record().state,'attack_2');assert.equal(s.draw().frame,0);
  if(seat===0)s.h.damageHero(5);else s.h.C3.damageCoop(5);
  assert.equal(s.draw().state,'hurt');assert.equal(s.h.G.hp[hero],hero==='synth'?39:41);
  s.step(.5);assert.equal(s.draw().state,'idle');return {newAction:'attack_2',damage:5};
 });
 check('accepted roll cancels debt '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();s.draw();s.step(.06);s.draw();
  assert.equal(seat===0?s.h.startRoll121():s.h.C3.coopDodge(),true);assert.equal(s.record(),null);assert.equal(s.draw(true).state,'roll');
  s.step(.5);assert.equal(s.draw().state,'idle');return {noResurrection:true};
 });
 check('movement cuts only tail '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();s.draw();s.step(.06);assert.equal(s.draw(true).state,'attack_1','movement does not shorten original action');
  s.step(.2);assert.equal(s.draw(true).state,'walk');assert.equal(s.record().tailCancelled,true);
  assert.equal(s.draw(false).state,'idle','stopping movement never resurrects cancelled tail');
  s.step(.01);assert.equal(s.draw(false).state,'idle');return {duration:s.record().duration,cancelledForever:true};
 });
 check('pause keeps actual frame and mask keeps cursor '+tag,()=>{
  const s=scene(hero,variant,seat);s.start();assert.equal(s.draw().frame,0);s.step(.06);
  assert.equal(s.art.pose({style:hero},seat,false).frame,1,'pure query plans next frame');
  s.h.mode='overlay';s.step(.5);assert.equal(s.draw().frame,0,'pause freezes last actual draw, not queried next pose');
  const clock=s.art.clock;s.art.setVariant(hero,variant==='masked'?'unmasked':'masked');assert.equal(s.draw().frame,0);assert.equal(s.record().presentedFrame,0);
  s.h.mode='action';s.step(1/60);assert.equal(s.draw().frame,1);assert.ok(s.art.clock>clock);return {pausedFrame:0,resumedFrame:1};
 });
 check('pause with pending atlas freezes actual idle '+tag,()=>{
  const s=scene(hero,variant,seat,{pending:[heroes[hero]+'_'+variant+'_attack_1']});s.start();assert.equal(s.draw().state,'idle');
  s.h.mode='dialogue';s.step(.5);const image=s.art.images[s.art.key(hero,variant,'attack_1')];image.complete=true;image.naturalWidth=2048;
  assert.equal(s.draw().state,'idle','late texture does not change frozen fallback body');assert.equal(s.record().presentedFrame,-1);
  s.h.mode='action';s.step(1/60);const first=s.draw();assert.equal(first.state,'attack_1');assert.equal(first.frame,0);return {resumedAtZero:true};
 });
 check('area save role release cursor '+tag,()=>{
  for(const change of ['area','save','role']){
   const s=scene(hero,variant,seat);s.start();s.draw();
   if(change==='area')s.h.G.area='sky_canal';else if(change==='save')s.h.G={...s.h.G};
   else if(seat===0)s.h.G.active=hero==='synth'?'percussion':'synth';else s.h.C3.coop.member=hero==='synth'?'percussion':'synth';
   s.art.sync();assert.equal(s.record(),null,change+' clears old record');
  }return {cleared:['area','save','role']};
 });
}
for(const failure of ['pending','broken','absent'])check('fallback '+failure,()=>{
 const options=failure==='absent'?{assets:{}}:{[failure]:['franco_sintetizador_unmasked_attack_1']};
 const s=scene('synth','unmasked',0,options);s.start();
 if(failure==='absent'){const n=s.stats.actor;s.draw();assert.equal(s.stats.actor,n+1)}else assert.equal(s.draw().state,'idle');
 assert.equal(s.record().presentedFrame,-1);s.step(.4);assert.equal(s.record().presentedFrame,-1);return {noConsumption:true};
});
check('defeat and non-attack timelines unchanged',()=>{
 const s=scene();s.h.damageHero(999);s.h.mode='gameover';s.step(.4);assert.equal(s.draw().state,'defeat');assert.equal(s.draw().frame,4);
 s.step(.8);assert.equal(s.draw().frame,7);s.h.G.hp.synth=20;s.h.mode='action';s.step(0);assert.equal(s.draw().state,'idle');
 s.art.mark(0,'synth','skill',.42,'down');s.step(.21);assert.equal(s.draw().frame,4,'skill remains elapsed based');
 return {defeatHold:7,skillAtHalf:4};
});
check('title and cache contract preserved',()=>{
 const s=harness();s.h.G=null;s.h.mode='title';s.art.setVariant('synth','masked');s.art.sync();assert.equal(Object.keys(s.art.images).length,0);
 const q=scene();for(const hero of Object.keys(heroes))for(const variant of variants)for(const state of states)q.art.image(q.art.key(hero,variant,state));
 assert.ok(Object.keys(q.art.images).length<=8);return {title:0,cache:Object.keys(q.art.images).length};
});
check('async decode warmup never waits for input',()=>{
 const s=scene('synth','unmasked',0,{withDecode:true,rejectDecode:true});
 assert.ok(s.stats.decode>=2,'warmup requests decoding of idle and first attack');
 assert.equal(s.start(),true);assert.equal(s.h.act.cool,.22);assert.equal(s.record().duration,.22);assert.equal(s.draw().frame,0);
 const title=harness({withDecode:true});title.h.G=null;title.h.mode='title';title.art.sync();
 assert.equal(title.stats.decode||0,0,'title does not decode musician sheets');
 return {decodeRequests:s.stats.decode,cooldown:.22,noAwait:true};
});
check('interruption inside renderer never confirms a replaced record',()=>{
 const s=scene();s.start();const old=s.record(),previous=s.h.ctx.drawImage;
 s.h.ctx.drawImage=function(...args){previous.apply(this,args);s.h.act.cool=0;s.start();};
 s.draw();assert.notEqual(s.record(),old);assert.equal(old.presentedFrame,-1);assert.equal(s.record().presentedFrame,-1);
 s.h.ctx.drawImage=previous;assert.equal(s.draw().frame,0);assert.equal(s.record().state,'attack_2');
 return {oldNotConfirmed:true,newStartsAtZero:true};
});
const report={passed:true,cases:results.length,moduleFile:path.basename(modulePath),moduleSha256:require('node:crypto').createHash('sha256').update(source).digest('hex'),results,semantics:{tailMs:100,scope:'attack_1/2/3 only',
 confirmation:'after successful action atlas draw; once per art.clock',browserRun:false}};
const release=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'),'utf8')).versao;
const output=path.join(__dirname,release,'MUSICIAN_PRESENTATION_UNIT.json');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,cases:results.length}));
