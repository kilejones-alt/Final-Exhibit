import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '8767', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
fs.mkdirSync('qa/review-motion', { recursive: true });
await sleep(1400);

const browser = await chromium.launch({ headless: true });

async function record(name, viewport, file) {
  const context = await browser.newContext({
    viewport,
    recordVideo: {
      dir: 'qa/review-motion',
      size: viewport,
    },
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:8767/${file}`, { waitUntil: 'domcontentloaded' });
  await sleep(1800);

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(240, Math.floor(viewport.height * 0.55));

  for (let y = 0; y < height - viewport.height; y += step) {
    await page.evaluate((nextY) => window.scrollTo({ top: nextY, behavior: 'smooth' }), y);
    await sleep(900);
  }

  if (file === 'entrance.html') {
    const firstDoor = page.locator('.triptych .door').first();
    if (await firstDoor.count()) {
      await firstDoor.scrollIntoViewIfNeeded();
      await sleep(600);
      await firstDoor.hover();
      await sleep(6200);
    }

    const framework = page.locator('.era-framework');
    if (await framework.count()) {
      await framework.scrollIntoViewIfNeeded();
      await sleep(4300);
    }
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1200);

  const video = page.video();
  await page.close();
  await context.close();

  if (video) {
    const path = await video.path();
    fs.renameSync(path, `qa/review-motion/${name}.webm`);
  }
}

await record('entrance-desktop-1440x900', { width: 1440, height: 900 }, 'entrance.html');
await record('entrance-iphone-390x844', { width: 390, height: 844 }, 'entrance.html');
await record('antijudaism-desktop-1440x900', { width: 1440, height: 900 }, 'antijudaism.html');
await record('antijudaism-iphone-390x844', { width: 390, height: 844 }, 'antijudaism.html');

await browser.close();
server.kill();
