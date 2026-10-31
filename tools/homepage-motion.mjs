import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server=spawn('python3',['-m','http.server','8768','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync('qa/homepage-motion',{recursive:true});
await sleep(1400);
const browser=await chromium.launch({headless:true});

async function record(name,viewport){
  const context=await browser.newContext({viewport,recordVideo:{dir:'qa/homepage-motion',size:viewport},reducedMotion:'no-preference'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:8768/index.html',{waitUntil:'domcontentloaded'});
  await sleep(39000);
  const video=page.video();
  await page.close();
  await context.close();
  if(video){
    const path=await video.path();
    fs.renameSync(path,`qa/homepage-motion/${name}.webm`);
  }
}

await Promise.all([
  record('homepage-desktop-1440x900',{width:1440,height:900}),
  record('homepage-tablet-768x1024',{width:768,height:1024}),
  record('homepage-iphone-390x844',{width:390,height:844}),
]);
await browser.close();
server.kill();
