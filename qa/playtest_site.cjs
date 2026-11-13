/* Run against local or deployed Pages using isolated, disposable browser contexts.
 * PLAYWRIGHT_CORE=/path/to/playwright-core node qa/playtest_site.cjs [base URL]
 * Connects to a disposable Chrome at CDP_URL (default localhost:9223).
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const base = process.argv[2] || 'http://127.0.0.1:8766/';
const results = [];
let testedBuild;
const uaPhone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const uaPad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

async function main() {
  const browser = await chromium.connectOverCDP(process.env.CDP_URL || 'http://127.0.0.1:9223');
  const cases = [
    { name: 'PC', device: 'pc', viewport: { width: 1280, height: 800 } },
    { name: 'Mobile', device: 'mobile', userAgent: uaPhone, isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } },
    { name: 'iPad desktop UA', device: 'mobile', userAgent: uaPad, hasTouch: true, viewport: { width: 1024, height: 768 } }
  ];
  for (const item of cases) {
    const { name, device, ...options } = item;
    const context = await browser.newContext(options);
    // Chromium's hasTouch defaults to one point; a physical iPad reports more.
    if (name.includes('iPad')) await context.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
    });
    await context.addInitScript(() => Object.defineProperty(navigator, 'getGamepads', { value: () => [] }));
    const page = await context.newPage();
    const errors = [], failed = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failed.push(response.status() + ' ' + response.url()); });
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('#playtestEntry', { timeout: 30000 });
    testedBuild = await page.evaluate(() => ToriiPlaytest);
    assert.equal(await page.evaluate(() => ToriiPlaytest.device), device);
    assert.equal(await page.evaluate(() => Input121.mobile), device === 'mobile');
    assert.match(await page.locator('#playtestEntry').textContent(), device === 'mobile' ? /^MOBILE/ : /^PC/);
    assert.equal(await page.locator('#playtestEntry').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    assert.equal(await page.evaluate(() => ToriiPlaytest.version), '1.2.3');
    await page.waitForLoadState('load');
    // All externally served chapter assets must have decoded, not just returned HTTP 200.
    await page.waitForFunction(() => Object.values(C3.images).every(img => img.complete && img.naturalWidth > 0));
    await page.waitForSelector('#playtestEntry', { state: 'detached', timeout: 6500 });
    if (name === 'PC') {
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => Input121.mobile), false, 'A narrow PC window is still PC');
      await page.setViewportSize(options.viewport);
    } else if (name === 'Mobile') {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForFunction(() => document.documentElement.classList.contains('landscape121'));
      await page.locator('#mobileStick121').waitFor({state:'visible',timeout:10000});
      const stick = await page.locator('#mobileStick121').boundingBox();
      assert(stick.x >= 0 && stick.y >= 0 && stick.x + stick.width <= 844 && stick.y + stick.height <= 390);
      await page.setViewportSize(options.viewport);
      await page.waitForFunction(() => !document.documentElement.classList.contains('landscape121'));
    }
    await page.evaluate(() => { window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('resize')); });
    assert.equal(await page.locator('#playtestEntry').count(), 0, 'The notice must not return after rotation/focus');
    if (name === 'PC') {
      await page.evaluate(() => document.addEventListener('click', () => enableAudio(), { once: true }));
      await page.mouse.click(12, 12);
      const audio = await page.evaluate(async () => {
        const tracks = [];
        for (const id of ['veracidade', 'c3_100_adsense', 'c3_nervos']) {
          const buffer = await decodeAlbum11(id);
          tracks.push({ id, duration: buffer?.duration || 0, external: ALBUM11[id].startsWith('media/') });
        }
        return tracks;
      });
      for (const track of audio) { assert(track.external); assert(track.duration > 10, JSON.stringify(track)); }
      results.push({ name: 'Hosted soundtrack fetch and decode (chapter 1, chapter 3, final boss)', passed: true });
    }
    await page.evaluate(() => C3.start(true));
    await page.waitForFunction(() => G?.chapter === 3 || G?.c3?.started);
    assert(await page.evaluate(() => !!current && document.querySelector('#game').width > 0));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const screenshotDir = path.join(__dirname, 'screenshots-local/pages');
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, device + (name.includes('iPad') ? '-tablet' : '') + '.png') });
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    results.push({ name: name + ': detection, notice removal, assets, layout and chapter 3 start', passed: true });
    await context.close();
    console.log('OK · ' + name);
  }
  const dir = path.join(__dirname, 'playtest');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SITE_TEST_RESULTS.json'), JSON.stringify({ testedAt: new Date().toISOString(), url: base, build: testedBuild, method: 'Chrome with emulated device profiles; no physical-device validation', results }, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
