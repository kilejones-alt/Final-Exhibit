/* Gallery-wide Chromium + WebKit regression QA.
   Checks published page shells, localized linked image timeline,
   correct music controls, slow hover/falling text, iPhone camera-in. */
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const server=spawn('python3',['-m','http.server','8783','--bind','127.0.0.1'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(1200);
fs.mkdirSync('qa/generated',{recursive:true});
const pages=[
 'index.html','entrance.html','antijudaism.html','antisemitism.html',
 'exhibition.html','colonialism.html','apartheid.html','genocide.html',
 'historical-sources.html','he/index.html','ru/index.html',
 'he/entrance.html','ru/entrance.html',
 'pages/page-03.html','he/pages/page-03.html','ru/pages/page-03.html'
];
const cases=pages.map(path=>({path,engine:'chromium',width:390}))
 .concat(['index.html','entrance.html','antijudaism.html','antisemitism.html','exhibition.html','colonialism.html','apartheid.html','genocide.html','he/entrance.html','ru/entrance.html'].map(path=>({path,engine:'webkit',width:390})))
 .concat(['entrance.html','antijudaism.html','exhibition.html','he/entrance.html','ru/entrance.html'].map(path=>({path,engine:'chromium',width:1440})));
const report=[];
const engines={};
try{
  for(const spec of cases){
    let browser=engines[spec.engine];
    if(!browser){browser=await (spec.engine==='webkit'?webkit:chromium).launch({headless:true});engines[spec.engine]=browser;}
    const mobile=spec.width<=430;
    const page=await browser.newPage({
      viewport:{width:spec.width,height:844},deviceScaleFactor:mobile?2:1,
      isMobile:mobile,hasTouch:mobile,reducedMotion:'no-preference'
    });
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto('http://127.0.0.1:8783/'+spec.path,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('.gallery-rail').waitFor({state:'attached',timeout:12000});
    await wait(260);
    const data=await page.evaluate(()=>{
      const rail=document.querySelector('.gallery-rail');
      const anchors=[...rail.querySelectorAll('a.gallery-rail-item')];
      const primary=anchors.filter(x=>x.querySelector('img'));
      const css=primary[0]&&getComputedStyle(primary[0].querySelector('img'));
      const audio=document.querySelector('.audio-toggle');
      const firstImage=document.querySelector('main :is(.art-open,.door-art,.aj-object,figure) img');
      const one=document.querySelector('[data-museum-reveal]:not(.sentence-land)');
      return {
        lang:document.documentElement.lang,dir:document.documentElement.dir,
        viewWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        timelineCount:anchors.length,timelineImages:primary.length,
        active:[...rail.querySelectorAll('[aria-current]')].map(a=>a.dataset.galleryTarget),
        names:anchors.map(a=>a.querySelector('.gallery-rail-title')?.textContent),
        labels:anchors.map(a=>a.getAttribute('aria-label')),
        links:anchors.map(a=>a.href),
        images:primary.map(a=>a.querySelector('img')?.getAttribute('src')),
        timelineZoom:css?.transitionDuration,
        mobileFrame:firstImage?.closest('figure,.door-art,.art-open,.aj-object')?.className||'',
        mobileImageTransition:firstImage?getComputedStyle(firstImage).transitionDuration:null,
        revealDuration:one?getComputedStyle(one).transitionDuration:null,
        audioPresent:!!audio,audioDisplay:audio?getComputedStyle(audio).display:null,
        blankShell:document.body.dataset.pageState==='blank',
        blankMain:document.querySelector('main')?.children.length===0
      };
    });
    // Check a real destination, not a decorative image.
    const first=page.locator('.gallery-rail-item').first();
    const target=await first.getAttribute('href');
    const validLink=/\/Final-Exhibit\/entrance\.html$/.test(new URL(target).pathname);
    if(spec.path==='entrance.html'&&spec.width===390){
      await page.locator('.gallery-rail').scrollIntoViewIfNeeded();
      await page.screenshot({path:'qa/generated/gallery-entrance-phone.png'});
    }
    if(spec.path==='antijudaism.html'&&spec.width===390&&spec.engine==='webkit'){
      await page.screenshot({path:'qa/generated/gallery-antijudaism-iphone-safari.png'});
    }
    if(spec.path==='he/entrance.html'&&spec.width===390){
      await page.screenshot({path:'qa/generated/gallery-he-iphone.png'});
    }
    if(spec.path==='ru/entrance.html'&&spec.width===390){
      await page.screenshot({path:'qa/generated/gallery-ru-iphone.png'});
    }
    const failures=[];
    if(data.timelineCount!==10||data.timelineImages!==9)failures.push('timeline card count');
    if(!validLink||data.links.some(url=>!url.includes('/Final-Exhibit/')))failures.push('navigation URLs');
    if(data.images.some(url=>!url.startsWith('http://127.0.0.1:8783/Final-Exhibit/'))) {
      // Local runner serves the repo at site root, unlike GitHub Pages subpath.
      if(data.images.some(url=>!url.includes('/assets/')))failures.push('image URLs');
    }
    if(data.scrollWidth>spec.width+1)failures.push('horizontal overflow');
    if(data.audioPresent&&data.audioDisplay==='none')failures.push('music hidden');
    if(data.blankShell&&!data.blankMain)failures.push('reserved page no longer blank');
    if(spec.path.startsWith('he/')&&data.names[1]!=='אנטי־יהדות')failures.push('Hebrew label');
    if(spec.path.startsWith('ru/')&&data.names[1]!=='Антииудаизм')failures.push('Russian label');
    if(!data.timelineZoom?.includes('5.7s'))failures.push('slow timeline image zoom');
    if(spec.width===1440&&spec.path==='antijudaism.html'&&!data.revealDuration?.includes('1.95s'))failures.push('falling text duration');
    report.push({...spec,data,validLink,failures,errors});
    await page.close();
  }
}finally{
 for(const browser of Object.values(engines))await browser.close();
 server.kill();
}
fs.writeFileSync('qa/generated/gallery-master-report.json',JSON.stringify(report,null,2));
console.log('GALLERY_REPORT '+JSON.stringify(report.map(x=>({path:x.path,engine:x.engine,width:x.width,lang:x.data.lang,links:x.data.timelineCount,images:x.data.timelineImages,scrollWidth:x.data.scrollWidth,zoom:x.data.timelineZoom,failures:x.failures,errors:x.errors}))));
const failures=report.filter(x=>x.failures.length||x.errors.length);
if(failures.length){console.error('GALLERY_FAIL '+JSON.stringify(failures));process.exitCode=1;}
