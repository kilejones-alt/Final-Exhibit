import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const server=spawn('python3',['-m','http.server','8777','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(1200);
fs.mkdirSync('qa/generated',{recursive:true});
const report=[];
async function one(name,width){
 const browser=await (name==='webkit'?webkit:chromium).launch({headless:true});
 try{
  const mobile=width<=430;
  const page=await browser.newPage({viewport:{width,height:mobile?844:900},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,reducedMotion:'no-preference'});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8777/deicide-museum-film.html',{waitUntil:'domcontentloaded'});
  await page.locator('#theater.open').waitFor();
  await sleep(1050);
  const opening=await page.evaluate(()=>({
    time,playing,scene:document.querySelector('#title').textContent,
    frameWidth:document.querySelector('.stage').getBoundingClientRect().width,
    scrollWidth:document.documentElement.scrollWidth,
    imageLoaded:[...document.querySelectorAll('.image')].some(x=>x.complete&&x.naturalWidth>0),
    viewWidth:innerWidth,progressCount:document.querySelectorAll('#progress').length
  }));
  if(name==='webkit'&&width===390){
   const b=await page.screenshot({type:'jpeg',quality:60});
   const str=b.toString('base64');
   console.log('FILM_PHONE_BEGIN');
   for(let i=0;i<str.length;i+=3000)console.log('FILM_PHONE_JPG '+str.slice(i,i+3000));
   console.log('FILM_PHONE_END');
  }
  await sleep(2200);
  const settled=await page.evaluate(()=>({frameWidth:document.querySelector('.stage').getBoundingClientRect().width,opacity:parseFloat(getComputedStyle(document.querySelector('.stage')).opacity),artVisible:[...document.querySelectorAll('.image.visible')].some(x=>parseFloat(getComputedStyle(x).opacity)>.95)}));
  if(name==='webkit'&&width===390){
    const b=await page.screenshot({type:'jpeg',quality:67});const str=b.toString('base64');
    console.log('FILM_SETTLED_BEGIN');for(let i=0;i<str.length;i+=3000)console.log('FILM_SETTLED_JPG '+str.slice(i,i+3000));console.log('FILM_SETTLED_END');
  }
  await page.locator('#pause').click();
  const pauseStart=await page.evaluate(()=>time);
  await sleep(500);
  const pauseEnd=await page.evaluate(()=>time);
  await page.locator('#pause').click();
  await page.locator('#progress').evaluate(el=>{
   el.value=String(offsets[6]+.2);
   el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const jump=await page.evaluate(()=>({
    time,title:document.querySelector('#title').textContent,
    text:document.querySelector('#quote').textContent,
    art:[...document.querySelectorAll('.image.visible')].at(-1)?.getAttribute('src'),
    counter:document.querySelector('#hud-counter').textContent
  }));
  const before=jump.time;
  await page.locator('#narrate').click();
  await sleep(600);
  const music=await page.evaluate(()=>({
    time,playing,sounding,paused:document.querySelector('#voice').paused,
    source:document.querySelector('#voice').currentSrc,
    volume:document.querySelector('#voice').volume
  }));
  await page.locator('#narrate').click();
  await page.locator('#progress').evaluate(el=>{
   el.value=String(offsets[8]+.2);
   el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await sleep(1200);
  const interlude=await page.evaluate(()=>({
    title:document.querySelector('#title').textContent,
    classOn:document.querySelector('#theater').classList.contains('is-typographic'),
    displayed:getComputedStyle(document.querySelector('#interlude')).display,
    quote:document.querySelector('.interlude-copy').textContent
  }));
  if(name==='webkit'&&width===390){
   const b=await page.screenshot({type:'jpeg',quality:62});
   const str=b.toString('base64');
   console.log('FILM_INTERLUDE_BEGIN');
   for(let i=0;i<str.length;i+=3000)console.log('FILM_INTERLUDE_JPG '+str.slice(i,i+3000));
   console.log('FILM_INTERLUDE_END');
  }
  await page.locator('#progress').evaluate(el=>{
   el.value=String(offsets[13]+.2);
   el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await sleep(350);
  const credits=await page.evaluate(()=>({
    scene:document.querySelector('#title').textContent,
    classOn:document.querySelector('#theater').classList.contains('is-credits'),
    copyDisplay:getComputedStyle(document.querySelector('#copy')).display,
    image:[...document.querySelectorAll('.image.visible')].at(-1)?.src,
    loaded:[...document.querySelectorAll('.image.visible')].some(x=>x.complete&&x.naturalWidth>0)
  }));
  const result={name,width,opening,settled,pauseStart,pauseEnd,jump,music,before,interlude,credits,errors};
  report.push(result);
  await page.close();
 }finally{await browser.close()}
}
try{
 for(const [name,width] of [['chromium',320],['chromium',1440],['webkit',390],['webkit',768]])await one(name,width);
}finally{server.kill()}
fs.writeFileSync('qa/generated/deicide-master-report.json',JSON.stringify(report,null,2));
console.log('FILM_REPORT '+JSON.stringify(report));
const failures=report.filter(r=>r.errors.length||r.opening.scrollWidth>r.width||r.opening.frameWidth<r.width*.80||r.settled.frameWidth<r.width*.99||r.settled.opacity<.98||!r.settled.artVisible||!r.opening.imageLoaded||Math.abs(r.pauseStart-r.pauseEnd)>.15||
 !r.jump.title.includes('JUSTIN MARTYR')||!r.jump.art?.includes('scene_07')||
 Math.abs(r.music.time-r.before)>1.8||r.music.paused||!r.music.source.includes('deicide_quick_ambient')||
 !r.interlude.classOn||r.interlude.displayed==='none'||!r.credits.classOn||!r.credits.loaded||r.credits.copyDisplay!=='none');
if(failures.length){console.error('FILM_FAIL '+JSON.stringify(failures));process.exitCode=1}
