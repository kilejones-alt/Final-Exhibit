import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '8766', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pages = [
  'index.html',
  'entrance.html',
  'antijudaism.html',
  'antisemitism.html',
  'exhibition.html',
  'genocide.html',
  'apartheid.html',
  'colonialism.html',
  'historical-sources.html',
  'gallery.html',
  'overview.html',
];

const viewports = [
  { key: 'desktop', width: 1440, height: 900 },
  { key: 'tablet', width: 768, height: 1024 },
  { key: 'iphone', width: 390, height: 844 },
];

fs.rmSync('qa/review-gallery', { recursive: true, force: true });
fs.mkdirSync('qa/review-gallery', { recursive: true });
await sleep(1400);

const browser = await chromium.launch({ headless: true });
const report = [];

async function revealPage(page) {
  await page.evaluate(async () => {
    const step = Math.max(220, Math.floor(window.innerHeight * 0.58));
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, max);
    await new Promise((resolve) => setTimeout(resolve, 900));
  });
}

for (const viewport of viewports) {
  for (const file of pages) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
    });

    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:8766/${file}`, { waitUntil: 'domcontentloaded' });

    if (file === 'index.html') {
      await sleep(38000);
    } else {
      await sleep(1600);
      await revealPage(page);
    }

    const base = file.replaceAll('/', '--').replace('.html', '');
    await page.screenshot({
      path: `qa/review-gallery/${base}-${viewport.key}-full.png`,
      fullPage: true,
    });

    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    await page.screenshot({
      path: `qa/review-gallery/${base}-${viewport.key}-top.png`,
      fullPage: false,
    });

    report.push({
      file,
      viewport: viewport.key,
      width: viewport.width,
      height: viewport.height,
      title: await page.title(),
      pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
      errors,
    });

    await page.close();
  }
}

await browser.close();
server.kill();

fs.writeFileSync('qa/review-gallery/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
