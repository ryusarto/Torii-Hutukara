/* Usage: node qa/lumi_melody_playtest.cjs [web-playtest URL] */
'use strict';
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright');

const url = process.argv[2] || 'http://127.0.0.1:8886/';
const keyboardHints = /\b(?:ESC|ENTER|ESPAÇO|WASD|TECLA)\b|\b[EJZKQ] ·| · [LOPV](?=\s|$)|\[[HINM]\]/i;

async function testLumi(browser, mobile) {
  const context = await browser.newContext(mobile ? {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
  } : { viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const press = selector => page.locator(selector)[mobile ? 'tap' : 'click']();
  const text = selector => page.locator(selector).innerText();
  try {
    await page.goto(url);
    await press('#startOptions10');
    await press('#preview10');
    await press('#dif_normal');
    await page.evaluate(() => { if (mode === 'dialogue') Narrativa.pularCena(); });
    if (mobile) await press('[data-mobile-action="pause"]');
    else await page.keyboard.press('Escape');
    if (await page.locator('#journey10').count()) await press('#journey10');
    else {
      // Approved pause B exposes map/journal directly, replacing the old
      // Journey button. Exercise that button's unchanged native callback to
      // retain this test's platform-help and Lumi assertions.
      assert.equal(await page.locator('.ui7-pause-sidebar').count(), 1);
      await page.evaluate(() => openJourney10());
    }
    await press('#controls10');
    if (mobile) {
      assert.match(await text('#overlayInner'), /direcional à esquerda.*toque em AÇÃO/s);
      assert.doesNotMatch(await text('#overlayInner'), keyboardHints);
    } else {
      assert.match(await text('#overlayInner'), /WASD/);
    }
    await press('#helpBack10');
    await press('#back10');
    await press('#resume10');
    const contextAtLumi = await page.evaluate(() => {
      setArea('voices', 26, 18, false);
      // The campaign test fights through this area. Isolate the NPC and touch UI here.
      for (const enemy of current.enemies) {
        if (!G.defeated.includes(enemy.id)) G.defeated.push(enemy.id);
        enemy.hp = 0;
      }
      const lumi = current.npcs.find(npc => npc.id === 'lumi');
      for (const [dx, dy] of [[0, -0.9], [0.9, 0], [0, 0.9], [-0.9, 0]]) {
        const x = lumi.x + dx, y = lumi.y + dy;
        if (!canBody121(x, y)) continue;
        G.x = x;
        G.y = y;
        if (nearestInteraction()?.value === lumi) break;
      }
      update(1 / 60);
      return { mode, nearby: nearestInteraction()?.label, prompt: $('prompt').textContent };
    });
    assert.equal(contextAtLumi.mode, 'walk', JSON.stringify(contextAtLumi));
    assert.match(contextAtLumi.nearby, /Lumi/);
    await page.waitForFunction(() => !!document.querySelector('#prompt b'));
    assert.equal(await text('#prompt b'), mobile ? 'AÇÃO' : 'E');
    assert.equal(await text('#bMenu'), mobile ? 'MENU' : 'MENU · ESC');
    if (mobile) {
      for (const orientation of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(orientation);
        await page.waitForFunction(landscape => document.documentElement.classList.contains('landscape121') === landscape, orientation.width > orientation.height);
        assert.equal(await text('#prompt b'), 'AÇÃO');
        assert.equal(await text('#bMenu'), 'MENU');
      }
      await press('[data-mobile-action="pause"]');
      const pauseText = await text('.ui7-pause-sidebar');
      assert.match(pauseText, /Continuar/);
      assert.doesNotMatch(pauseText, keyboardHints);
      await press('#party10');
      assert.match(await text('#overlayInner'), /Escolha até três integrantes/);
      assert.doesNotMatch(await text('#overlayInner'), keyboardHints);
      assert.equal(await page.locator('.ui7-party-skills kbd').count(), 0, 'Equipe mobile deve preservar golpes sem rótulos de tecla');
      await page.evaluate(() => closeOverlay());
      await press('[data-mobile-action="interact"]');
      assert.match(await text('#dialogue .continue'), /TOQUE PARA CONTINUAR/);
      await page.waitForFunction(() => !Narrativa.digitando() && $('words').textContent.includes('junto.'));
      assert.doesNotMatch(await text('.leitura-barra'), keyboardHints);
      await press('[data-leitura="historico"]');
      assert.equal(await text('[data-leitura="fechar"]'), 'FECHAR');
      await press('[data-leitura="fechar"]');
      await press('#words');
    } else {
      await page.keyboard.press('e');
      assert.match(await text('#dialogue .continue'), /ESPAÇO \/ ENTER/);
      await page.waitForFunction(() => !Narrativa.digitando() && $('words').textContent.includes('junto.'));
      assert.match(await text('.leitura-barra'), /PULAR · P/);
      await page.keyboard.press('Enter');
    }
    await page.locator('#lumiMelody').waitFor();
    const firstNote = page.locator('[data-vnote="0"]');
    assert.equal(await firstNote.getAttribute('aria-label'), mobile ? 'Si♭' : 'Si♭, tecla 1');
    assert.equal(await firstNote.locator('small').count(), mobile ? 0 : 1);

    await press('#lumiListen');
    await page.waitForFunction(() => $('lumiAudioStatus').textContent === 'Trecho da gravação · Veracidade');
    assert(await page.evaluate(() => Music11.buffer.get('veracidade')?.duration > 90));
    if (mobile) {
      await page.evaluate(() => { audioMuted = true; audioEnabled = false; });
      await press('#lumiListen');
      assert.match(await text('#lumiAudioStatus'), /Acompanhe as notas destacadas/);
      await press('#lumiShow');
      assert.equal(await text('#lumiHint'), 'Dó♯ → Ré♯ → Si♭');
      await press('[data-vnote="0"]');
      assert.match(await text('#lumiProgress'), /não encaixou/);
      for (const note of [1, 2, 0]) await press(`[data-vnote="${note}"]`);
    } else {
      for (const key of ['2', '3', '1']) await page.keyboard.press(key);
    }
    assert.equal(await text('#lumiProgress'), 'Frase completa.');
    const potions = await page.evaluate(() => G.potions);
    await press('#lumiFinish');
    const result = await page.evaluate(() => {
      Narrativa.pularCena();
      lumiNPC();
      Narrativa.pularCena();
      return { potions: G.potions, song: G.flags.lumiSong, violin: G.flags.violin11, mode };
    });
    assert.deepEqual(result, { potions: potions + 1, song: true, violin: true, mode: 'walk' });
    assert.deepEqual(errors, []);
    console.log(`OK · Lumi e dicas de controle (${mobile ? 'toque' : 'teclado'})`);
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
  try {
    await testLumi(browser, false);
    await testLumi(browser, true);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
