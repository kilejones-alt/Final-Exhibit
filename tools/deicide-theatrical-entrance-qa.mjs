/* Rendered-browser proof of the actual arrival: progressive blackout, enlargement,
 * freeze of the first card, then clean start of the historical sequence. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const server = spawn('python3',['-m','http.server','8768','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(1400);
fs.mkdirSync('qa/generated',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'no-preference'});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:8768/antijudaism.html',{waitUntil:'domcontentloaded'});
    await page.locator('#deicide-film-watch').scrollIntoViewIfNeeded();
    await page.waitForSelector('.deicide-film-host iframe',{timeout:10000});
    const host=page.locator('.deicide-film-host');
    const film=page.frameLocator('.deicide-film-host iframe');
    await film.locator('#theater').waitFor({state:'visible'});
    await sleep(750);
    const during=await page.evaluate(()=>{
      const host=document.querySelector('.deicide-film-host');
      const frame=host.querySelector('iframe');
      return {opening:host.classList.contains('is-opening'),
        dim:parseFloat(getComputedStyle(host,'::before').opacity),
        transform:getComputedStyle(frame).transform,
        frameOpacity:parseFloat(getComputedStyle(frame).opacity),
        reduced:matchMedia('(prefers-reduced-motion:reduce)').matches};
    });
    const still=await film.locator('body').evaluate(()=>{
      const imgs=[...document.querySelectorAll('.image')];
      return {time,playing,firstCard:document.getElementById('title').textContent,
        imageLoaded:imgs.some(e=>e.complete&&e.naturalWidth>0)};
    });
    await page.screenshot({path:`qa/generated/deicide-arrival-${width}.png`});
    await sleep(3650);
    const settled=await page.evaluate(()=>{
      const host=document.querySelector('.deicide-film-host'),frame=host.querySelector('iframe');
      return {dim:parseFloat(getComputedStyle(host,'::before').opacity),
        frameOpacity:parseFloat(getComputedStyle(frame).opacity),
        transform:getComputedStyle(frame).transform};
    });
    const motion=await film.locator('body').evaluate(()=>({time,playing}));
    await page.screenshot({path:`qa/generated/deicide-theatre-${width}.png`});
    await film.locator('#exit').click();
    await page.locator('.deicide-film-host').waitFor({state:'detached',timeout:3500});
    const result={width,during,still,settled,motion,errors,closed:await host.count()===0};
    results.push(result);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
fs.writeFileSync('qa/generated/deicide-entrance-report.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
const failures=results.filter(r=>r.errors.length||!r.closed||
  !r.during.opening||r.during.dim>=.99||r.during.frameOpacity>=1||
  !r.still.imageLoaded||r.still.playing||r.still.time>.4||
  r.settled.dim<.98||r.settled.frameOpacity<.98||
  !r.motion.playing||r.motion.time<.2);
if(failures.length){console.error('Deicide theatrical entry failed:',JSON.stringify(failures,null,2));process.exitCode=1;}
