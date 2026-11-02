import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server=spawn('python3',['-m','http.server','8771','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
fs.rmSync('qa/homepage-artistic-preview',{recursive:true,force:true});
fs.mkdirSync('qa/homepage-artistic-preview',{recursive:true});
await sleep(1200);
const browser=await chromium.launch({headless:true});

async function desktop(){
  const context=await browser.newContext({
    viewport:{width:1440,height:900},
    recordVideo:{dir:'qa/homepage-artistic-preview',size:{width:1440,height:900}},
    reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const started=Date.now();
  await page.goto('http://127.0.0.1:8771/index.html',{waitUntil:'domcontentloaded'});
  await sleep(1800);

  const cinema=page.locator('.cinema');
  const cb=await cinema.boundingBox();
  if(cb){
    const pts=[
      [cb.x+cb.width*.5,cb.y+cb.height*.5],
      [cb.x+cb.width*.22,cb.y+cb.height*.38],
      [cb.x+cb.width*.78,cb.y+cb.height*.34],
      [cb.x+cb.width*.68,cb.y+cb.height*.68],
      [cb.x+cb.width*.32,cb.y+cb.height*.64],
      [cb.x+cb.width*.5,cb.y+cb.height*.5],
    ];
    for(const [x,y] of pts){
      await page.mouse.move(x,y,{steps:28});
      await sleep(520);
    }
  }

  const waitUntil=async ms=>{
    const left=ms-(Date.now()-started);
    if(left>0) await sleep(left);
  };

  await waitUntil(33500);
  await page.screenshot({path:'qa/homepage-artistic-preview/desktop-title-hold.png',fullPage:false});
  await waitUntil(35200);
  await page.screenshot({path:'qa/homepage-artistic-preview/desktop-pill-completion.png',fullPage:false});
  await waitUntil(36800);

  const pill=page.locator('.entry-pill');
  const pb=await pill.boundingBox();
  if(pb){
    const cx=pb.x+pb.width/2, cy=pb.y+pb.height/2;
    await page.mouse.move(cx+95,cy,{steps:24}); await sleep(650);
    await page.mouse.move(cx+48,cy-32,{steps:24}); await sleep(650);
    await page.mouse.move(cx-55,cy+18,{steps:24}); await sleep(650);
    await page.mouse.move(cx,cy,{steps:24}); await sleep(850);
    await page.screenshot({path:'qa/homepage-artistic-preview/desktop-magnetic-pill.png',fullPage:false});
  }
  await waitUntil(43000);

  const state=await page.evaluate(()=>({
    title:getComputedStyle(document.querySelector('.cinema-title')).opacity,
    pill:getComputedStyle(document.querySelector('.entry-pill')).translate,
    outlineTransform:getComputedStyle(document.querySelector('.entry-outline')).transform,
    errors:[]
  }));
  const video=page.video();
  await page.close();
  await context.close();
  if(video){
    const p=await video.path();
    fs.renameSync(p,'qa/homepage-artistic-preview/desktop-artistic.webm');
  }
  return {errors,state};
}

async function touch(name,width,height){
  const context=await browser.newContext({
    viewport:{width,height},
    hasTouch:true,
    isMobile:width<500,
    recordVideo:{dir:'qa/homepage-artistic-preview',size:{width,height}},
    reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8771/index.html',{waitUntil:'domcontentloaded'});
  await sleep(39000);
  const video=page.video();
  await page.close();
  await context.close();
  if(video){
    const p=await video.path();
    fs.renameSync(p,`qa/homepage-artistic-preview/${name}.webm`);
  }
  return {errors};
}

const [desktopResult,tabletResult,iphoneResult]=await Promise.all([
  desktop(),
  touch('tablet-artistic',768,1024),
  touch('iphone-artistic',390,844)
]);

await browser.close();
server.kill();
fs.writeFileSync('qa/homepage-artistic-preview/report.json',JSON.stringify({
  desktop:desktopResult,tablet:tabletResult,iphone:iphoneResult
},null,2));
console.log(JSON.stringify({desktop:desktopResult,tablet:tabletResult,iphone:iphoneResult},null,2));
