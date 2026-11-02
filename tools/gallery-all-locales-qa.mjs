/* Cross-language / cross-device release QA for the Three Eras gallery rail.
   Real Chromium and WebKit, not a static regex approximation.
   No remote publishing or content edits occur in this test. */
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
const server=spawn('python3',['-m','http.server','8779','--bind','127.0.0.1'],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
await delay(900);
const results=[];
fs.mkdirSync('qa/generated',{recursive:true});
async function check(engine,pagePath,width){
 const browser=await engine.launch({headless:true});
 const phone=width<=430;
 const page=await browser.newPage({viewport:{width,height:phone?844:950},deviceScaleFactor:phone?2:1,
  isMobile:phone,hasTouch:phone,reducedMotion:'no-preference'});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const url='http://127.0.0.1:8779/'+pagePath;
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:22000});
  await page.locator('#museum-gallery-rail').waitFor({state:'visible',timeout:9000});
  await delay(420);
  const original=await page.evaluate(()=>{
    const rail=document.querySelector('#museum-gallery-rail');
    const tabs=[...rail.querySelectorAll('.museum-rail-tab')].map(a=>a.textContent.trim());
    const scroller=rail.querySelector('.museum-rail-viewport');
    const item=rail.querySelector('.museum-rail-image');
    const root=document.documentElement;
    const frame=document.querySelector('main figure img, main .art-open img, main .door-art img');
    return {
      lang:root.lang,dir:root.dir||'ltr',width:innerWidth,
      documentWidth:root.scrollWidth,bodyWidth:document.body.scrollWidth,
      railTop:rail.getBoundingClientRect().top,railPosition:getComputedStyle(rail).position,
      railWidth:rail.getBoundingClientRect().width,
      thumbCount:rail.querySelectorAll('.museum-rail-image').length,
      tabs,active:rail.querySelector('.museum-rail-tab[aria-current]')?.dataset.era||null,
      firstItemWidth:item?.getBoundingClientRect().width,
      scrollWidth:scroller?.scrollWidth,clientWidth:scroller?.clientWidth,
      musicControl:!!document.querySelector('#page-audio')&&!!document.querySelector('.audio-toggle'),
      motionDuration:frame?getComputedStyle(frame).transitionDuration:null,
      paths:[...rail.querySelectorAll('.museum-rail-image')].map(a=>({href:a.getAttribute('href'),path: a.href})).slice(0,3)
    };
  });
  if(pagePath.endsWith('entrance.html')&&width===390){
   const img=await page.screenshot({type:'jpeg',quality:68});
   const str=img.toString('base64');
   const prefix=pagePath.replace(/\W+/g,'_').toUpperCase();
   console.log('GALLERY_SHOT_BEGIN '+prefix);
   for(let i=0;i<str.length;i+=3500)console.log('GALLERY_SHOT_'+prefix+' '+str.slice(i,i+3500));
   console.log('GALLERY_SHOT_END '+prefix);
  }
  if(!pagePath.endsWith('index.html')&&!pagePath.endsWith('/')){
   await page.evaluate(()=>window.scrollTo({top:Math.min(1300,document.documentElement.scrollHeight-1000),behavior:'instant'}));
   await delay(200);
  }
  const pinned=await page.evaluate(()=>{
   const el=document.querySelector('#museum-gallery-rail');
   return {top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,visible:el.getBoundingClientRect().bottom>0};
  });
  const expectedLang=pagePath.startsWith('he/')?'he':pagePath.startsWith('ru/')?'ru':'en';
  const bad=original.thumbCount!==21||original.tabs.length!==3||
    original.width!==width||original.documentWidth>width+1||
    original.lang!==expectedLang||!pinned.visible||(!pagePath.includes('index.html')&&!pagePath.endsWith('/')&&Math.abs(pinned.top)>5)||
    (pagePath.includes('entrance.html')&&!original.musicControl);
  const record={engine:engine===webkit?'webkit':'chromium',page:pagePath,width,original,pinned,errors,bad};
  results.push(record);
  console.log('GALLERY_ONE '+JSON.stringify({engine:record.engine,page:pagePath,width,lang:original.lang,top:original.railTop,pinned:pinned.top,
   documentWidth:original.documentWidth,thumbCount:original.thumbCount,musicControl:original.musicControl,bad,errors}));
 } finally {await page.close();await browser.close()}
}
try{
 const specs=[
  [chromium,'index.html',390],
  [chromium,'entrance.html',390],
  [chromium,'antijudaism.html',390],
  [chromium,'antisemitism.html',390],
  [chromium,'exhibition.html',390],
  [chromium,'colonialism.html',390],
  [chromium,'apartheid.html',390],
  [chromium,'genocide.html',390],
  [chromium,'he/index.html',390],
  [chromium,'he/entrance.html',390],
  [chromium,'ru/index.html',390],
  [chromium,'ru/entrance.html',390],
  [chromium,'entrance.html',768],
  [chromium,'entrance.html',1024],
  [chromium,'entrance.html',1440],
  [webkit,'entrance.html',390],
  [webkit,'he/entrance.html',390],
  [webkit,'ru/entrance.html',390],
  [webkit,'antijudaism.html',390],
  [webkit,'entrance.html',1440]
 ];
 for(const args of specs)await check(...args);
}finally{server.kill()}
fs.writeFileSync('qa/generated/gallery-all-languages.json',JSON.stringify(results,null,2));
console.log('GALLERY_FINAL '+JSON.stringify({tested:results.length,failures:results.filter(x=>x.bad||x.errors.length).map(x=>({page:x.page,width:x.width,errors:x.errors,pinned:x.pinned,original:x.original}))}));
if(results.some(x=>x.bad||x.errors.length))process.exitCode=1;
