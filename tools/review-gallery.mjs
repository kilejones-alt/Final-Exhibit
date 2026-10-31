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

fs.mkdirSync('qa/review-gallery', { recursive: true });
await sleep(1400);

const browser = await chromium.launch({ headless: true });
const report = [];

async function revealPage(page) {
  await page.evaluate(async () => {
    const step = Math.max(260, Math.floor(window.innerHeight * 0.65));
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 140));
    }
    window.scrollTo(0, max);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
}

for (const file of pages) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });

  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto(`http://127.0.0.1:8766/${file}`, { waitUntil: 'domcontentloaded' });

  if (file === 'index.html') {
    await sleep(38000);
  } else {
    await sleep(1800);
    await revealPage(page);
  }

  await page.screenshot({
    path: `qa/review-gallery/${file.replaceAll('/', '--').replace('.html', '')}-full.png`,
    fullPage: true,
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(600);
  await page.screenshot({
    path: `qa/review-gallery/${file.replaceAll('/', '--').replace('.html', '')}-top.png`,
    fullPage: false,
  });

  report.push({
    file,
    title: await page.title(),
    height: await page.evaluate(() => document.documentElement.scrollHeight),
    errors,
  });

  await page.close();
}

const mobileTargets = ['entrance.html', 'antijudaism.html', 'antisemitism.html', 'exhibition.html'];
for (const file of mobileTargets) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  await page.goto(`http://127.0.0.1:8766/${file}`, { waitUntil: 'domcontentloaded' });
  await sleep(1600);
  await page.screenshot({
    path: `qa/review-gallery/${file.replace('.html', '')}-mobile-top.png`,
    fullPage: false,
  });
  await page.close();
}

await browser.close();
server.kill();

fs.writeFileSync('qa/review-gallery/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
