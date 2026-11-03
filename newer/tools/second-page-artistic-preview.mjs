import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server=spawn('python3',['-m','http.server','8772','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
fs.rmSync('qa/second-page-artistic-preview',{recursive:true,force:true});
fs.mkdirSync('qa/second-page-artistic-preview',{recursive:true});
await sleep(1200);
const browser=await chromium.launch({headless:true});

async function smoothScroll(page,to,duration=2800){
  const from=await page.evaluate(()=>scrollY);
  const steps=Math.max(12,Math.floor(duration/90));
  for(let i=1;i<=steps;i++){
    const t=i/steps;
    const eased=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    const y=from+(to-from)*eased;
    await page.evaluate(y=>window.scrollTo(0,y),y);
    await sleep(duration/steps);
  }
}

async function desktop(){
  const context=await browser.newContext({
    viewport:{width:1440,height:900},
    recordVideo:{dir:'qa/second-page-artistic-preview',size:{width:1440,height:900}},
    reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8772/entrance.html',{waitUntil:'domcontentloaded'});
  await sleep(1800);

  const linkReport=await page.evaluate(()=>[...document.querySelectorAll('.triptych .door')].map(a=>({
    text:a.textContent.trim(),href:a.getAttribute('href'),pointer:getComputedStyle(a).pointerEvents
  })));

  const doors=page.locator('.triptych .door');
  for(let i=0;i<3;i++){
    const d=doors.nth(i);
    await d.hover();
    await sleep(1200);
  }
  await page.mouse.move(720,100,{steps:20});
  await sleep(500);

  const introY=await page.locator('#introduction').evaluate(el=>el.offsetTop);
  await smoothScroll(page,Math.max(0,introY-80),2200);
  await sleep(1200);

  const overviewY=await page.locator('.home-overview').evaluate(el=>el.offsetTop);
  await smoothScroll(page,Math.max(0,overviewY-120),4200);
  await sleep(2600);
  await page.screenshot({path:'qa/second-page-artistic-preview/desktop-framework-handoff.png',fullPage:false});

  const eras=page.locator('.framework-era');
  for(let i=0;i<3;i++){
    const r=await eras.nth(i).boundingBox();
    if(r){
      await page.mouse.move(r.x+r.width/2,r.y+r.height*.38,{steps:24});
      await sleep(850);
    }
  }
  await page.screenshot({path:'qa/second-page-artistic-preview/desktop-framework-hover.png',fullPage:false});

  await page.evaluate(()=>scrollTo(0,0));
  await sleep(500);
  await page.screenshot({path:'qa/second-page-artistic-preview/desktop-top.png',fullPage:false});
  await page.screenshot({path:'qa/second-page-artistic-preview/desktop-full.png',fullPage:true});

  const video=page.video();
  await page.close();
  await context.close();
  if(video){
    const p=await video.path();
    fs.renameSync(p,'qa/second-page-artistic-preview/desktop-artistic.webm');
  }
  return {errors,linkReport};
}

async function touch(name,width,height){
  const context=await browser.newContext({
    viewport:{width,height},
    hasTouch:true,
    isMobile:width<500,
    recordVideo:{dir:'qa/second-page-artistic-preview',size:{width,height}},
    reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8772/entrance.html',{waitUntil:'domcontentloaded'});
  await sleep(1400);
  const overviewY=await page.locator('.home-overview').evaluate(el=>el.offsetTop);
  await smoothScroll(page,Math.max(0,overviewY-70),4800);
  await sleep(4300);
  await page.screenshot({path:`qa/second-page-artistic-preview/${name}-framework.png`,fullPage:false});
  await page.evaluate(()=>scrollTo(0,0));
  await sleep(400);
  await page.screenshot({path:`qa/second-page-artistic-preview/${name}-full.png`,fullPage:true});
  const video=page.video();
  await page.close();
  await context.close();
  if(video){
    const p=await video.path();
    fs.renameSync(p,`qa/second-page-artistic-preview/${name}-artistic.webm`);
  }
  return {errors};
}

const [desktopResult,tabletResult,iphoneResult]=await Promise.all([
  desktop(),
  touch('tablet',768,1024),
  touch('iphone',390,844)
]);

await browser.close();
server.kill();
const report={desktop:desktopResult,tablet:tabletResult,iphone:iphoneResult};
fs.writeFileSync('qa/second-page-artistic-preview/report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
