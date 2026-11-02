import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';

fs.mkdirSync('qa/generated',{recursive:true});
const server=spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await sleep(1200);
const browser=await chromium.launch({headless:true});
const results=[];
for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8766/antijudaism.html',{waitUntil:'domcontentloaded'});
  const button=page.locator('#deicide-film-watch');
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await page.waitForSelector('.deicide-film-host iframe',{timeout:10000});
  const frame=page.frameLocator('.deicide-film-host iframe');
  await frame.locator('#theater').waitFor({state:'visible'});
  await sleep(1700);
  const info=await frame.locator('body').evaluate(()=>{
    const images=[...document.querySelectorAll('.image')];
    return {controls:[...document.querySelectorAll('button')].map(e=>e.id),imageLoaded:images.some(e=>e.complete&&e.naturalWidth>0),scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,sceneCount:SCENES.length};
  });
  await page.screenshot({path:'qa/generated/deicide-'+width+'.png',fullPage:false});
  await frame.locator('#pause').click();
  const paused=await frame.locator('#pause').innerText();
  await frame.locator('#exit').click();
  const closed=await page.locator('.deicide-film-host').count()===0;
  results.push({width,info,paused,closed,errors});
  await page.close();
}
await browser.close();
server.kill();
fs.writeFileSync('qa/generated/deicide-smoke.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.errors.length||!r.info.imageLoaded||r.info.scrollWidth>r.info.viewport||r.info.sceneCount!==14||!r.closed))process.exitCode=1;
