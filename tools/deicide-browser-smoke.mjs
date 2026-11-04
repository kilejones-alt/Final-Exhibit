import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';

fs.mkdirSync('qa/generated', { recursive: true });
const server = spawn('python3', ['-m', 'http.server', '8766', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
await sleep(1200);
const browser = await chromium.launch({ headless: true });
const results = [];
const url = 'http://127.0.0.1:8766/newer/antijudaism.html#deicide-cinema';

try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const host = page.locator('.deicide-film-host');
    await host.waitFor({ state: 'visible', timeout: 10000 });
    const frame = page.frameLocator('.deicide-film-host iframe');
    await frame.locator('#theater').waitFor({ state: 'visible' });
    await frame.locator('#image-a').evaluate(image => image.decode());
    const info = await frame.locator('body').evaluate(() => {
      const images = [document.getElementById('image-a'), document.getElementById('image-b')];
      const stage = document.getElementById('stage').getBoundingClientRect();
      const soundtrack = document.getElementById('voice');
      return {
        imageLoaded: images.some(image => image.complete && image.naturalWidth > 0),
        scrollWidth: document.documentElement.scrollWidth,
        viewport: innerWidth,
        sceneCount: SCENES.length,
        stageWidth: Math.round(stage.width),
        silent: soundtrack.paused && !soundtrack.getAttribute('src')
      };
    });
    assert.equal(info.sceneCount, 14);
    assert(info.imageLoaded && info.scrollWidth <= info.viewport && info.stageWidth >= width * .98);
    assert(info.silent);
    await page.screenshot({ path: 'qa/generated/deicide-' + width + '.png', fullPage: false });

    // Wait for the deliberate-gesture guard, then exercise the wheel in both directions.
    await sleep(500);
    const forward = width !== 768;
    if (width === 320) await frame.locator('#exit').click();
    else {
      await page.mouse.move(width / 2, 450);
      await page.mouse.wheel(0, forward ? 160 : -160);
    }
    await host.waitFor({ state: 'detached', timeout: 5000 });
    await page.waitForFunction(advance => {
      const id = advance ? 'libel-blood' : 'deicide-cinema';
      const top = document.getElementById(id).getBoundingClientRect().top;
      return advance ? top < innerHeight && top >= -4 : top >= innerHeight - 24;
    }, forward);
    assert.deepEqual(errors, []);
    results.push({ width, info, exit: width === 320 ? 'button' : forward ? 'wheel forward' : 'wheel back' });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
fs.writeFileSync('qa/generated/deicide-smoke.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
