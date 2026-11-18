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
      constructor() { this.complete = true; this.naturalWidth = 2048; this.naturalHeight = 1024; }
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
  h.update = () => { stats.update++; };
  h.drawActor = () => { stats.actor++; return 'legacy-actor'; };
  h.drawDetailedNPC = () => { stats.npc++; return 'legacy-npc'; };
  h.c3NpcPose = n => ({dir: n.dir || 'down'});
  h.portraitURI10 = id => 'legacy-portrait:' + id;
  h.advanceDialogue = () => { stats.dialogue++; return 'legacy-dialogue'; };
  h.attackAction = () => {
    if (!h.activeModes10() || h.act.cool > 0 || h.Combat10.dashTime > 0) return false;
    h.act.cool = .27; h.act.combo = h.act.combo % 3 + 1;
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
  vm.createContext(h);
  vm.runInContext(source.replace('__MUSICIAN_ASSETS__', JSON.stringify(options.assets || assets))
    .replace('__MUSICIAN_MANIFEST__', JSON.stringify({animations: [], portraits: []})), h);
  return {h, art: vm.runInContext('MusicianArtV1', h), draws, stats, elements};
}

let poses = 0, sequences = 0;
{
  const {h,art,draws,stats} = harness();
  for (const [id,canonical] of Object.entries(heroes)) for (const variant of variants)
    for (const state of states) for (let row = 0; row < 4; row++) {
      h.G.active = id; h.C3.coop.member = id === 'synth' ? 'percussion' : 'synth';
      h.G.hp[id] = state === 'defeat' ? 0 : 100;
      art.setVariant(id, variant); art.mark(0, id, state, .8, directions[row]);
      for (let frame = 0; frame < 8; frame++) {
        art.players[0].elapsed = frame * .1 + .00001;
        h.drawActor({style: id, dir: 'down'}, 72, 96, false);
        const draw = draws.at(-1);
        assert.equal(draw[0].src, 'fixture:' + canonical + '_' + variant + '_' + state);
        assert.deepEqual(draw.slice(1,5), [frame*256,row*256,256,256]);
        assert.deepEqual(draw.slice(5), [28,30,88,88]);
        poses++;
      }
      sequences++;
    }
  assert.equal(stats.actor, 0); assert.equal(sequences,208); assert.equal(poses,1664);
  assert.ok(Object.keys(art.images).length <= 8, 'decoded image cache stays bounded');
  h.drawActor({style:'katana',dir:'down'},72,96,false);
  assert.equal(stats.actor,1,'other roles delegate to previous renderer');
}
{
  const {h,art} = harness();
  assert.equal(art.variant('synth'),'unmasked','legacy mask flag does not silently change musicians');
  assert.equal(art.setVariant('synth','masked'),true);
  assert.equal(art.variant('percussion'),'unmasked','variants are per character');
  assert.equal(art.setVariant('franco','masked'),false);
  assert.equal(art.setVariant('synth','unknown'),false);
  h.attackAction(); assert.equal(art.players[0].state,'attack_1');
  const first = art.players[0]; first.elapsed = .12; h.attackAction();
  assert.equal(art.players[0],first,'blocked attack does not restart animation');
  assert.equal(first.elapsed,.12);
  h.act.cool=0;h.attackAction();assert.equal(art.players[0].state,'attack_2');
  h.act.cool=0;h.attackAction();assert.equal(art.players[0].state,'attack_3');
  h.C3.coopAttack();assert.equal(art.players[1].state,'attack_1');
  assert.equal(art.players[0].state,'attack_3','P2 does not overwrite P1');
  assert.equal(art.players[1].direction,'right');
  const p2 = art.players[1];h.C3.coopAttack();assert.equal(art.players[1],p2);
  h.skillAction();assert.equal(art.players[0].state,'skill');
  h.advancedSkill();assert.equal(art.players[0].state,'advanced');
  h.duoAction();assert.equal(art.players[0].state,'signature');assert.equal(h.G.resonance,50);
  const signature = art.players[0];h.duoAction();assert.equal(art.players[0],signature);assert.equal(h.G.resonance,50);
  h.C3.coopSkill();assert.equal(art.players[1].state,'skill');
  h.C3.coopAdvanced();assert.equal(art.players[1].state,'advanced');
  h.C3.coopSignature();assert.equal(art.players[1].state,'signature');
  const elapsed = art.players[0].elapsed;h.mode='dialogue';h.update(.2);
  assert.equal(art.players[0].elapsed,elapsed,'action clock freezes in dialogue');
  h.mode='action';h.update(.1);assert.ok(art.players[0].elapsed>elapsed);
  h.G.area='sky_canal';h.update(.1);assert.equal(art.players[0],null);assert.equal(art.players[1],null);
  art.mark(0,'synth','skill',.4,'down');h.G={...h.G};h.update(.1);assert.equal(art.players[0],null,'new save object cancels stale action');
  art.mark(0,'synth','skill',.4,'down');h.G.active='percussion';h.update(.1);assert.equal(art.players[0],null,'role switch cancels stale action');
}
{
  const {h,art,draws} = harness();
  h.G.active='percussion';h.C3.coop.member='synth';h.G.dir='left';
  h.skillAction();assert.equal(art.players[0].duration,.72,'Contratempo preserves .72s visual guard window');
  h.advancedSkill();assert.equal(art.players[0].duration,.62,'Quebra-pulso does not schedule new pulses');
  h.Input121.roll={id:'percussion',duration:.4};h.Combat10.dashTime=.2;
  let pose=art.pose({style:'percussion'},0,true);assert.equal(pose.state,'roll');assert.equal(pose.frame,4);assert.equal(pose.direction,'left');
  h.C3.coop.rollHero='synth';h.C3.coop.dash=.3;h.C3.coop.rollDuration=.4;h.C3.coop.dir='up';
  pose=art.pose({style:'synth'},1,true);assert.equal(pose.state,'roll');assert.equal(pose.frame,2);assert.equal(pose.direction,'up');
  h.Combat10.dashTime=0;h.C3.coop.dash=0;art.players=[null,null];
  h.G.isRunning10=true;h.stride10=1.3;pose=art.pose({style:'percussion',dir:'right'},0,true);assert.equal(pose.state,'run');assert.equal(pose.frame,4);
  h.G.isRunning10=false;pose=art.pose({style:'percussion'},0,true);assert.equal(pose.state,'walk');
  h.C3.coop.running=true;h.C3.coop.stride=2;pose=art.pose({style:'synth'},1,true);assert.equal(pose.state,'run');assert.equal(pose.frame,6);
  h.G.isRunning10=false;h.stride10=1.3;h.drawActor({style:'percussion',dir:'left'},400,300,true);
  assert.equal(draws.at(-1)[0].src,'fixture:ryuchi_percussionista_unmasked_walk','moving follower outside either player uses walk');
  h.G.isRunning10=true;h.drawActor({style:'percussion',dir:'left'},400,300,true);
  assert.equal(draws.at(-1)[0].src,'fixture:ryuchi_percussionista_unmasked_run','follower follows party run pace');
  h.damageHero(4);assert.equal(art.players[0].state,'hurt');assert.equal(h.G.hp.percussion,42);
  h.C3.percussionGuard=.5;h.act.invuln=0;h.damageHero(4);
  assert.equal(h.G.hp.percussion,42);assert.equal(art.players[0].state,'attack_3','accepted counter uses existing accent without extra damage');
  h.act.invuln=0;h.damageHero(100);assert.equal(art.players[0].state,'defeat');
  h.C3.damageCoop(100);assert.equal(art.players[1].state,'defeat');
}
{
  const {h,art,draws,stats,elements} = harness();
  art.setVariant('synth','masked');
  assert.equal(h.portraitURI10('synth'),'fixture:franco_sintetizador_masked_portrait_neutral');
  assert.equal(h.portraitURI10('percussion'),'fixture:ryuchi_percussionista_unmasked_portrait_neutral');
  assert.equal(h.portraitURI10('alt'),'legacy-portrait:alt');
  h.mode='dialogue';h.dialogueQueue=[{who:'synth',expression:'angry'}];h.advanceDialogue();
  assert.equal(elements.portrait.src,'fixture:franco_sintetizador_masked_portrait_angry');
  h.dialogueQueue=[{who:'percussion'}];h.advanceDialogue();
  assert.equal(elements.portrait.src,'fixture:ryuchi_percussionista_unmasked_portrait_speaking');
  h.mode='action';art.mark(0,'synth','attack_3',.8,'down');
  h.drawDetailedNPC({id:'c3_synth_npc',dir:'left'},72,96);
  assert.equal(draws.at(-1)[0].src,'fixture:franco_sintetizador_masked_idle','NPC does not inherit overlapping P1 attack');
  assert.equal(draws.at(-1)[2],256);
  art.setVariant('percussion','masked');h.drawDetailedNPC({id:'c3_percussion_npc',dir:'up'},300,200);
  assert.equal(draws.at(-1)[0].src,'fixture:ryuchi_percussionista_masked_idle');
  assert.equal(draws.at(-1)[2],512);
  h.drawDetailedNPC({id:'c3_maia'},72,96);assert.equal(stats.npc,1);
}
for (const failure of ['pending','broken','absent']) {
  const opts = failure==='absent' ? {assets:{}} : {[failure]:['franco_sintetizador_unmasked_']};
  const {h,stats} = harness(opts);h.drawActor({style:'synth'},72,96,false);
  assert.equal(stats.actor,1,failure+' source falls back to previous renderer');
  h.drawDetailedNPC({id:'c3_synth_npc'},72,96);assert.equal(stats.npc,1);
}
{
  const {h,art,elements} = harness();
  h.G.hp.synth=0;art.mark(0,'synth','defeat',.8,'right');
  const clock=art.clock;h.mode='gameover';h.update(.4);
  assert.equal(art.pose({style:'synth'},0,false).frame,4,'defeat advances in a rendered gameover scene');
  h.update(.9);let pose=art.pose({style:'synth'},0,false);
  assert.equal(pose.state,'defeat');assert.equal(pose.frame,7,'completed defeat holds last ground pose');
  h.update(2);pose=art.pose({style:'synth'},0,false);assert.equal(pose.frame,7);
  assert.equal(art.clock,clock,'idle/performance clock does not run behind gameover');
  art.mark(0,'synth','defeat',.8,'down');h.mode='overlay';
  elements.overlay={classList:{contains:()=>false}};elements.retryCheckpoint={};
  h.update(.4);assert.equal(art.players[0].elapsed,.4,'actual visible retry overlay advances defeat');
  delete elements.retryCheckpoint;h.update(.4);
  assert.equal(art.players[0].elapsed,.4,'ordinary pause overlay freezes defeat');
  elements.retryCheckpoint={};h.mode='dialogue';h.update(.4);
  assert.equal(art.players[0].elapsed,.4,'dialogue does not advance a stale defeat');
  h.G.hp.synth=20;h.update(0);assert.equal(art.players[0],null,'revival releases held defeat');
  h.mode='action';h.act.invuln=0;h.damageHero(5);assert.equal(art.players[0].state,'hurt');
  h.update(.5);assert.equal(art.pose({style:'synth'},0,false).state,'idle','ordinary hurt still expires');
  h.G.hp.synth=0;art.mark(0,'synth','defeat',.8,'down');h.G.area='another_area';h.update(0);
  assert.equal(art.players[0],null,'area change releases defeat');
  art.mark(0,'synth','defeat',.8,'down');h.G={...h.G};h.update(0);
  assert.equal(art.players[0],null,'new save object releases defeat');
  art.mark(0,'synth','defeat',.8,'down');h.G.active='percussion';h.update(0);
  assert.equal(art.players[0],null,'role change releases defeat');
}
{
  const {h,art,draws,stats} = harness({pending:['franco_sintetizador_unmasked_attack_']});
  art.mark(0,'synth','attack_1',.4,'right');h.drawActor({style:'synth'},72,96,false);
  assert.equal(stats.actor,0);assert.equal(draws.at(-1)[0].src,'fixture:franco_sintetizador_unmasked_idle');
  assert.equal(draws.at(-1)[1],0);assert.equal(draws.at(-1)[2],768);
}

// Regressions reproduced against the real game; visual-only behavior.
for (const hero of ['synth','percussion']) for (const variant of variants) for (const seat of [0,1]) {
  const {h,art}=harness();
  if(seat===0){h.G.active=hero;h.C3.coop.member=hero==='synth'?'percussion':'synth';}
  else {h.C3.coop.member=hero;h.G.active=hero==='synth'?'percussion':'synth';}
  art.setVariant(hero,variant);art.sync();
  const roll=()=>seat===0?h.startRoll121():h.C3.coopDodge();
  art.mark(seat,hero,'signature',.72,'right');
  assert.equal(roll(),true);
  assert.equal(art.players[seat],null,'accepted roll cancels earlier cast');
  art.mark(seat,hero,'skill',.42,'right');
  assert.equal(art.players[seat],null,'cast accepted during rolling never reappears afterward');
  art.mark(seat,hero,'hurt',.35,'right');
  assert.equal(art.pose({style:hero},seat,true).state,'hurt','fresh damage wins over remaining roll');
  assert.equal(art.pose({style:hero},seat,true).frame,0,'reaction starts at frame0');
  const reaction=art.players[seat];assert.equal(roll(),false);
  assert.equal(art.players[seat],reaction,'rejected roll does not cancel reaction');
  h.G.hp[hero]=0;art.mark(seat,hero,'defeat',.8,'right');
  assert.equal(art.pose({style:hero},seat,true).state,'defeat','defeat takes priority even if dash fields remain');
  h.mode='gameover';h.update(1);
  assert.equal(art.pose({style:hero},seat,true).frame,7);
}
{
  const {h,art}=harness();art.sync();art.clock=.43;
  const idle=art.pose({style:'synth'},0,false).frame;
  const performance=art.pose({style:'percussion',musicianState:'performance'},-1,false).frame;
  assert.equal(idle,3);assert.equal(performance,5);
  h.mode='dialogue';h.update(.3);
  assert.equal(art.pose({style:'synth'},0,false).frame,idle);
  assert.equal(art.pose({style:'percussion',musicianState:'performance'},-1,false).frame,performance);
  h.mode='action';h.update(.12);
  assert.notEqual(art.pose({style:'synth'},0,false).frame,idle);
}
for (const seat of [0,1,-1]) {
  const {h,art}=harness();art.sync();
  const hero=seat===1?'percussion':'synth';h.stride10=10;h.C3.coop.stride=10;
  const pose=()=>art.pose({style:hero},seat,true);
  const walk=pose();h.G.isRunning10=true;h.C3.coop.running=true;
  assert.equal(pose().state,'run');assert.equal(pose().frame,walk.frame,'walk/run keeps phase without displacement');
  h.stride10+=.5;h.C3.coop.stride+=.5;
  assert.equal(pose().frame,Math.floor((36+1.6)%8),'run cadence remains 3.2 frames per stride');
  h.G.isRunning10=false;h.C3.coop.running=false;
  const stopped=pose().frame;assert.equal(stopped,Math.floor((36+1.6)%8));
  h.stride10+=.5;h.C3.coop.stride+=.5;
  assert.equal(pose().frame,Math.floor((36+1.6+1.8)%8),'walk cadence remains 3.6 frames per stride');
  art.reset();assert.equal(Object.keys(art.strides).length,0);
}
{
  const {h,art}=harness();art.mark(0,'synth','signature',.72,'right');art.players[0].elapsed=.31;
  const before=art.pose({style:'synth'},0,false);art.setVariant('synth','masked');
  const after=art.pose({style:'synth'},0,false);
  assert.equal(after.frame,before.frame);assert.equal(after.state,before.state);assert.equal(after.direction,before.direction);
  assert.equal(after.variant,'masked');assert.equal(art.variant('percussion'),'unmasked');
}

// Pause snapshots remain scoped, bounded and independent of gameplay flags.
for (const hero of ['synth','percussion']) for (const variant of variants)
for (const seat of [0,1,-1]) for (const running of [false,true]) {
  const {h,art}=harness();
  if(seat===1){h.C3.coop.member=hero;h.G.active=hero==='synth'?'percussion':'synth';}
  else {h.G.active=hero;h.C3.coop.member=hero==='synth'?'percussion':'synth';}
  art.setVariant(hero,variant);h.stride10=h.C3.coop.stride=10;
  h.G.isRunning10=h.C3.coop.running=running;
  const before=art.pose({style:hero,dir:'left'},seat,true);
  assert.equal(before.state,running?'run':'walk');
  h.mode='overlay';h.G.isRunning10=h.C3.coop.running=h.C3.coop.moving=false;h.update(.2);
  const after=art.pose({style:hero,dir:'down'},seat,false);
  assert.equal(after.state,before.state);assert.equal(after.frame,before.frame);assert.equal(after.direction,'left');
  art.setVariant(hero,variant==='masked'?'unmasked':'masked');
  const masked=art.pose({style:hero,dir:'up'},seat,false);
  assert.equal(masked.state,before.state);assert.equal(masked.frame,before.frame);assert.notEqual(masked.variant,variant);
  const npc=art.pose({style:hero,dir:'down',musicianNpc:true},-1,false);
  assert.equal(npc.state,'idle','NPC never inherits the paused player/follower stride');
  h.mode='action';
  assert.equal(art.pose({style:hero},seat,false).state,'idle','resuming without input releases locomotion snapshot');
  art.pose({style:hero,dir:'left'},seat,true);h.mode='overlay';
  h.G.area='new-area';
  assert.equal(art.pose({style:hero},seat,false).state,'idle','area change clears frozen locomotion');
  assert.equal(Object.keys(art.poses).length,0);
  h.mode='action';art.pose({style:hero},seat,true);h.mode='dialogue';h.G={...h.G};
  assert.equal(art.pose({style:hero},seat,false).state,'idle','new save clears frozen locomotion');
}
{
  const {h,art}=harness();
  for(const hero of ['synth','percussion'])art.pose({style:hero},-1,true);
  art.pose({style:'synth'},0,true);art.pose({style:'percussion'},1,true);
  assert.equal(Object.keys(art.poses).length,4,'snapshot map has only two seats and two musician followers');
  h.mode='overlay';h.G.active='percussion';
  assert.equal(art.pose({style:'percussion'},0,false).state,'idle','role switch cannot reuse former occupant pose');
  h.C3.coop.member='synth';assert.equal(art.pose({style:'synth'},1,false).state,'idle');
}
{
  const {h,art}=harness();h.stride10=10;art.pose({style:'synth'},0,true);
  h.damageHero(100);assert.equal(art.pose({style:'synth'},0,false).frame,0);h.mode='gameover';h.update(.4);
  assert.equal(art.pose({style:'synth'},0,false).state,'defeat');
  assert.equal(art.pose({style:'synth'},0,false).frame,4,'defeat advances despite earlier walking snapshot');
  h.update(.5);assert.equal(art.pose({style:'synth'},0,false).frame,7);
  h.G.hp.synth=20;assert.equal(art.pose({style:'synth'},0,false).state,'idle');
}

{
  const {h,art}=harness();h.mode='title';h.G=null;
  art.setVariant('synth','masked');art.sync();art.prepare('synth',0);
  assert.equal(Object.keys(art.images).length,0,'no warmup on title');
  assert.equal(Object.keys(art.prepared).length,0);
}
{
  const {h,art}=harness();h.C3.coop.member=null;h.update(0);
  assert.deepEqual(Object.keys(art.images).sort(),['franco_sintetizador_unmasked_attack_1','franco_sintetizador_unmasked_idle']);
  const warm=Object.values(art.images);h.update(.01);h.update(.01);
  assert.ok(warm.every(image=>Object.values(art.images).includes(image)),'unchanged actor never reloads warmup sheets');
  art.mark(0,'synth','advanced',.48,'left');art.players[0].elapsed=.2;
  art.setVariant('synth','masked');
  assert.ok(art.images.franco_sintetizador_masked_idle);assert.ok(art.images.franco_sintetizador_masked_advanced);
  assert.equal(art.players[0].elapsed,.2,'mask warmup never restarts action');
  assert.equal(art.images.franco_sintetizador_masked_attack_1,undefined,'mask in action warms current pose, not extra actions');
  const masked=art.images.franco_sintetizador_masked_advanced;art.setVariant('synth','masked');h.update(0);
  assert.equal(art.images.franco_sintetizador_masked_advanced,masked);
  h.G.area='new-area';art.sync();assert.equal(Object.keys(art.prepared).length,1);
  h.G.active='franco';art.sync();assert.equal(Object.keys(art.prepared).length,0,'non-musician clears seat preparation');
}
{
  const {h,art}=harness();h.update(0);
  h.drawActor({style:'synth',musicianVariant:'masked'},72,96,false);
  const before=art.images.franco_sintetizador_masked_attack_1;
  for(let i=0;i<3;i++){h.update(.01);h.drawActor({style:'synth',musicianVariant:'masked'},72,96,false)}
  assert.equal(art.images.franco_sintetizador_masked_attack_1,before,'explicit actor variant does not toggle warmup each sync');
  h.drawActor({style:'synth'},400,300,false);h.drawActor({style:'percussion'},420,300,false);
  assert.ok(Object.keys(art.prepared).length<=4,'preparation bounded to two seats plus two musician appearances');
  assert.ok(Object.keys(art.images).length<=8);art.reset();assert.equal(Object.keys(art.prepared).length,0);
}

{
  const {h,art}=harness();h.C3.coop.member=null;h.update(0);
  for(const state of ['walk','run','roll','attack_2','attack_3','skill','advanced','signature'])art.image(art.key('synth','unmasked',state));
  assert.equal(art.images.franco_sintetizador_unmasked_attack_1,undefined);
  h.update(.01);h.drawActor({style:'synth'},72,96,false);
  assert.equal(art.images.franco_sintetizador_unmasked_attack_1,undefined,'unchanged actor does not pin/re-request evicted warmup every frame');
}
const result={passed:true,sequences,poses,checks:['accepted actions P1/P2','blocked actions','direction and dash phase',
  'stride and moving followers','dialogue pause','area/save/role reset','per-character mask API','portraits and NPC masks',
  'NPC state isolation','image pending/broken/absent fallback','bounded decoded cache','unchanged fixture damage/cost',
  'defeat holds frame7','gameover/retry-overlay visual advance','pause/dialogue freeze','revival releases defeat','hurt still expires','roll cancels stale cast P1/P2','hurt precedes rolling P1/P2','pause preserves idle/performance phase','walk-run phase and existing cadence','mask swap preserves state and phase','walk/run pause snapshots P1/P2/followers','paused mask remains live','snapshot reset and role isolation','snapshot never blocks defeat','entry warms only idle+attack1','mask warms current action without restart','warmup bounded4 and decoded cache8','no warmup on title','no per-frame warmup churn']};
fs.mkdirSync(path.join(root,'qa'),{recursive:true});
fs.writeFileSync(path.join(root,'qa','INTEGRACAO_MODULO.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
