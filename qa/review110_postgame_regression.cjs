/* Post-game Beta 1.10 regressions; Node only, no browser or build required.
 * node qa/review110_postgame_regression.cjs
 * node qa/review110_postgame_regression.cjs --ref=4ddce49  # historical red control
 * Runs real legacy/C3 normalizers, PostGame and import/export functions in VM.
 * DOM, FileReader, storage, map geometry and combat execution are bounded stubs;
 * this suite does not validate rendering, asynchronous file IO or actual fights.
 * It never reads player storage and writes no files.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const ref = process.argv.find(arg => arg.startsWith('--ref='))?.slice(6);
const all = ['franco', 'ryuchi', 'alt', 'katana', 'synth', 'percussion'];
const noop = () => {};
const copy = value => JSON.parse(JSON.stringify(value));
function read(relative) {
  return ref ? execFileSync('git', ['show', `${ref}:${relative}`], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  }) : fs.readFileSync(path.join(root, relative), 'utf8');
}
const base = read('game/source/base/TORII_HUTUKARA_1_1_2_TRILHAS.html');
const runtime = read('game/source/chapter-03/chapter3_runtime.js');
const postgame = read('game/source/chapter-03/postgame.js');
function between(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `Source extraction failed: ${start}`);
  return source.slice(a, b);
}
function line(start) {
  const a = base.indexOf(start);
  assert(a >= 0, `Legacy source extraction failed: ${start}`);
  return base.slice(a, base.indexOf('\n', a));
}
const normalizers = between(base, 'function normalizeSave(v)', '\nfunction safeLoad()') + '\n' + [
  'const _normalizeSave=', 'const norm08=', 'const migrate091=',
  'function savedFormationAlive10(', 'const normalizeBase10=', 'const normalizeRelicsBase11='
].map(line).join('\n');
// Include the adjacent C3 compatibility wrappers, not a rewritten test normalizer.
const c3Normalizers = between(runtime, 'const C3_freshBase=', 'const C3_checkpointBase=');

function fixture(musician = 'synth') {
  return {
    version: 13, chapter: 3, area: 'endless_echo', x: 14.5, y: 18.5,
    flags: { masks: true, reveal: true, voicesKatana: true },
    c3: { started: true, complete: true, synthUnlocked: true, percussionUnlocked: true },
    formation: ['franco', 'ryuchi', musician], active: musician,
    hp: Object.fromEntries(all.map(id => [id, 20])),
    maxhp: Object.fromEntries(all.map(id => [id, 40])),
    xp: {}, levels: {}, defeated: [], shards: 19,
    postgame: {
      version: 1, bestScore: 500, bestWave: 3, lastRun: null,
      run: { active: true, phase: 'fight', seed: 42, wave: 4, score: 530,
        bankedScore: 500, kills: 11, bankedKills: 10, completedWave: 3,
        hpStart: Object.fromEntries(all.map(id => [id, 40])) }
    }
  };
}

function harness() {
  const messages = [], stored = new Map(), elements = new Map();
  const observed = { menus: 0, appended: 0, resumes: 0, downloaded: null, retryVisible: false,
    builds: 0, steps: [], rebuiltProgress: null };
  const room = (id, w = 28, h = 23) => ({ id, w, h, gates: [], enemies: [], npcs: [], props: [], events: [] });
  const staticAreas = () => Object.fromEntries(['city', 'studio', 'last_torii'].map(id => [id, room(id)]));
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, style: {}, dataset: {}, textContent: '',
      classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
      appendChild() { observed.appended++; }, querySelector: () => null,
      focus: noop, click: noop, remove: noop, setAttribute: noop, getAttribute: () => null
    });
    return elements.get(id);
  }
  const context = {
    console, Math, Number, Set, Date, Blob, copy, KEY: 'isolated-postgame-regression',
    BASE_HP: { franco: 40, ryuchi: 40 },
    clamp: (x, a, b) => Math.max(a, Math.min(x, b)),
    calculateLevel: () => 1, flagsDefault: () => ({}), VFLAGS: [], RELIC_FLAGS11: [],
    migrateRelics11: g => g,
    window: { matchMedia: () => ({ matches: false }) },
    G: { sentinel: 'existing-session' }, areas: staticAreas(),
    combatAreas10: new Set(), bossActor: null, battle: null, mode: 'walk', menuPage10: null,
    document: { querySelectorAll: () => [], createElement: () => element('created'),
      body: { appendChild: noop }, getElementById: id => context.$(id) },
    $: id => id === 'retryCheckpoint' ? (observed.retryVisible ? element(id) : null) : element(id),
    localStorage: { setItem: (k, v) => stored.set(k, v), getItem: k => stored.get(k) ?? null },
    URL: { createObjectURL(blob) { observed.downloaded = blob; return 'blob:isolated'; }, revokeObjectURL: noop },
    FileReader: class { readAsText(file) { this.result = file.content; this.onload(); } },
    setTimeout: noop, toast: message => messages.push(message), closeOverlay: noop,
    enterMenu10() { observed.menus++; }, areaLabels: () => ({}),
    C3: { VERSION: 13, defaults: () => ({}), ensureProgression: noop, progressionIds: all,
      AREAS: [], COMBAT_AREAS: [], labels: {}, unlockedRoster: () => all,
      coopActive: () => false, coopMember: () => null, areaStory: noop,
      finishSilence: noop, combatUnlocked: () => true,
      room(id, w, h) {
        const a = room(id, w, h); context.areas[id] = a; return a;
      }
    },
    solid: noop, prop: noop, evt: noop,
    npc: (a, id, x, y, name) => a.npcs.push({ id, x, y, name })
  };
  context.fresh = () => ({ maxhp: {}, hp: {}, xp: {}, flags: {} });
  for (const name of ['revealAlt', 'drawDetailedNPC', 'openMap', 'enemyActors',
    'gainXP', 'hitEnemy', 'save', 'showDefeat', 'restoreCheckpoint', 'update', 'updateHUD',
    'objectiveData', 'getRoute', 'drawGuideMarker', 'updateActionHUD','damageHero']) context[name] = noop;
  // The legacy system deliberately refuses to replace a defeat overlay.
  context.openSystem = () => {
    if (observed.retryVisible) return;
    context.mode = 'overlay'; context.menuPage10 = 'main';
  };
  // Legacy rebuild discards existing rooms. PostGame's real wrapper must recreate
  // the dynamic arena after this boundary, using the newly accepted progress.
  context.buildMaps = () => {
    observed.builds++; observed.steps.push('buildMaps'); observed.rebuiltProgress = context.G;
    context.areas = staticAreas();
  };
  context.setArea = id => {
    assert(context.areas[id], `Destination ${id} must exist after map rebuild`);
    observed.steps.push('setArea'); context.G.area = id; context.current = context.areas[id];
  };
  context.partyMembers = () => context.G.formation;
  vm.createContext(context);
  vm.runInContext(normalizers + '\n' + line('function exportSave()') + '\n' +
    line('function importSave(file)') + '\n' + c3Normalizers + '\n' + postgame, context,
    { filename: 'real-postgame-sources.js', timeout: 2000 });
  const p = vm.runInContext('PostGame', context);
  // Import should reach resume; enemy spawning and actual combat have browser coverage.
  p.beginWave = () => { observed.resumes++; };
  return { context, p, messages, stored, observed };
}

const results = [];
async function check(name, run) {
  try { await run(); results.push({ name, passed: true }); console.log('OK · ' + name); }
  catch (error) {
    results.push({ name, passed: false }); console.error('FAIL · ' + name + '\n' + error.stack);
  }
}

async function main() {
  await check('Real expedition export imports in a fresh session with no registered arena', async () => {
    const source = harness(); source.context.G = fixture(); source.context.battle = { active: true };
    source.context.exportSave();
    assert(source.observed.downloaded, 'Exporter should produce a file');
    const content = await source.observed.downloaded.text();
    assert.equal(JSON.parse(content).progress.area, 'endless_echo');
    const target = harness();
    assert.equal(target.context.areas.endless_echo, undefined, 'Fresh session must not pre-register arena');
    target.context.importSave({ content });
    assert(target.messages.includes('PROGRESSO IMPORTADO'), target.messages.join(' | '));
    assert.equal(target.context.G.area, 'endless_echo');
    assert.equal(target.context.G.postgame.run.active, true);
    assert.equal(target.context.G.postgame.run.wave, 4);
    assert.equal(target.context.G.postgame.run.score, 500, 'Only banked points resume');
    assert.equal(target.observed.resumes, 1);
    assert.equal(target.observed.builds, 1, 'Import rebuilds maps for the accepted progress');
    assert.equal(target.observed.rebuiltProgress, target.context.G);
    assert(target.observed.steps.indexOf('buildMaps') < target.observed.steps.indexOf('setArea'),
      'Maps rebuild before arriving in the imported area');
    assert(target.context.areas.endless_echo, 'Rebuild must retain/recreate the dynamic arena');
    assert.equal(JSON.parse(target.stored.get(target.context.KEY)).area, 'endless_echo');
  });
  await check('Invalid import preserves current session and saved progress', () => {
    const future = fixture(); future.version = 999;
    for (const content of ['{invalid', 'null', JSON.stringify(future),
      JSON.stringify({ area: 'unknown', flags: {}, x: 1, y: 1 }),
      JSON.stringify({ ...fixture(), flags: null }),
      JSON.stringify({ ...fixture(), x: 'Infinity' })]) {
      const h = harness(), original = h.context.G;
      h.stored.set(h.context.KEY, 'previous-save');
      h.context.importSave({ content });
      assert.equal(h.context.G, original);
      assert.equal(h.stored.get(h.context.KEY), 'previous-save');
      assert.equal(h.observed.builds, 0, 'Rejected import must not rebuild the current world');
      assert(h.messages.includes('ARQUIVO DE SALVAMENTO INVÁLIDO'));
    }
  });
  for (const musician of ['synth', 'percussion']) {
    await check(`${musician} surviving alone in mixed formation preserves expedition and KO HP`, () => {
      const h = harness(), raw = fixture(musician); raw.hp.franco = raw.hp.ryuchi = 0;
      const g = h.context.normalizeSave(raw);
      assert.equal(g.area, raw.area, 'Legacy fallback must not teleport a living formation');
      assert.equal(g.hp.franco, 0); assert.equal(g.hp.ryuchi, 0);
      assert.equal(g.active, musician); assert.deepEqual(Array.from(g.formation), raw.formation);
      assert.equal(g.postgame.run.active, true); assert.equal(g.postgame.run._resume, true);
    });
    await check(`${musician} remains selected leader over three save/load round trips`, () => {
      const h = harness(); let g = fixture(musician);
      for (let i = 0; i < 3; i++) {
        g = h.context.normalizeSave(JSON.parse(JSON.stringify({ progress: g })));
        assert.equal(g.active, musician, `Selected leader changed on load ${i + 1}`);
        assert.equal(g.area, 'endless_echo');
        assert.deepEqual(Array.from(g.formation), ['franco', 'ryuchi', musician]);
      }
    });
  }
  await check('Locked or reserve musicians do not make a defeated formation count as alive', () => {
    for (const musician of ['synth', 'percussion']) {
      for (const selected of [false, true]) {
        const h = harness(), raw = fixture(musician);
        raw.hp.franco = raw.hp.ryuchi = 0;
        if (selected) raw.c3[musician + 'Unlocked'] = false;
        else raw.formation = ['franco', 'ryuchi'];
        assert.equal(h.context.savedFormationAlive10(raw), false);
      }
    }
  });
  await check('An incapacitated saved leader is still replaced by a living selected ally', () => {
    const h = harness(), raw = fixture(); raw.hp.synth = 0;
    const g = h.context.normalizeSave(raw);
    assert.notEqual(g.active, 'synth'); assert(g.hp[g.active] > 0);
    assert(g.formation.includes(g.active)); assert.equal(g.area, 'endless_echo');
  });
  await check('Dead postgame formation cannot travel or replace the retry overlay', () => {
    const h = harness(); h.context.G = fixture();
    h.context.G.area = 'last_torii'; h.context.G.postgame.run = null;
    for (const id of all) h.context.G.hp[id] = 0;
    h.context.mode = 'overlay'; h.observed.retryVisible = true;
    assert.equal(h.p.canTravel(), false);
    assert.equal(h.p.openTravel(), false);
    assert.equal(h.observed.menus, 0, 'The defeat menu must remain intact');
    assert.equal(h.p.startDungeon(), false);
    assert(h.context.G.formation.every(id => h.context.G.hp[id] === 0), 'Blocked dungeon must not heal');
  });
  for (const fallen of ['franco', 'ryuchi']) {
    await check(`Fatal fall of ${fallen} preserves retry overlay while teammates remain alive`, () => {
      const h = harness(); h.context.G = fixture(); h.context.G.active = fallen;
      h.context.G.area = 'last_torii'; h.context.G.postgame.run = null;
      h.context.G.hp[fallen] = 0;
      h.context.mode = 'overlay'; h.observed.retryVisible = true;
      const hp = copy(h.context.G.hp);
      assert.equal(h.context.savedFormationAlive10(h.context.G), true, 'Teammates must still be alive');
      assert.equal(h.p.canTravel(), false, 'A living teammate cannot bypass a pending fatal-fall retry');
      assert.equal(h.p.openTravel(), false);
      assert.equal(h.observed.menus, 0, 'MAP must not replace the pending retry menu');
      assert.equal(h.p.startDungeon(), false);
      assert.deepEqual(h.context.G.hp, hp, 'Blocked dungeon must not revive the fallen hero');
    });
    await check(`Closed ${fallen} retry overlay does not block travel through a stale DOM node`, () => {
      const h = harness(); h.context.G = fixture(); h.context.G.active = fallen;
      h.context.G.area = 'last_torii'; h.context.G.postgame.run = null;
      h.context.G.hp[fallen] = 0;
      // Legacy overlays retain their contents after closing: the retry node may
      // remain in DOM, but mode=walk establishes that no retry is pending.
      h.context.mode = 'walk'; h.observed.retryVisible = true;
      assert.equal(h.p.canTravel(), true);
      assert.equal(h.p.openTravel(), true);
      assert.equal(h.observed.menus, 1);
    });
  }
  await check('System menu does not append travel buttons when legacy defeat guard refuses opening', () => {
    const h = harness(); h.context.G = fixture(); h.context.G.area = 'last_torii';
    h.context.G.postgame.run = null; h.context.mode = 'overlay'; h.observed.retryVisible = true;
    h.context.openSystem();
    assert.equal(h.observed.appended, 0, 'No postgame buttons may leak into the retry overlay');
  });
  await check('Living postgame formation retains access to travel', () => {
    const h = harness(); h.context.G = fixture(); h.context.G.area = 'last_torii';
    h.context.G.postgame.run = null; h.context.mode = 'walk';
    assert.equal(h.p.canTravel(), true);
    h.context.openSystem();
    assert.equal(h.observed.appended, 2, 'The normal system menu retains its postgame buttons');
  });
  const failed = results.filter(result => !result.passed).length;
  console.log(JSON.stringify({ source: ref || 'working tree', passed: results.length - failed,
    failed, checks: results.length, browser: false, filesWritten: false }));
  if (failed) process.exitCode = 1;
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
