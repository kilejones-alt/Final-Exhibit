import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const server=spawn('python3',['-m','http.server','8770','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(1100);
const browser=await chromium.launch({headless:true});
fs.mkdirSync('qa/generated',{recursive:true});
const output=[];
try{
  for(const width of [320,360,390,412,768,1024,1440]){
    const mobile=width<=412;
    const page=await browser.newPage({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text())});
    await page.goto('http://127.0.0.1:8770/antijudaism.html',{waitUntil:'networkidle',timeout:25000});
    await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(()=>{
      const selectors=['.site-header','.site-header .brand','.header-pills','.site-header nav','.aj-hero h1','.aj-hero h2','.aj-hero-copy','.aj-hero-art','.aj-gallery','#three-libels','.aj-libel-grid','#mechanism','.aj-cycle-list','#era-transition','#questions','#sources','#next-era'];
      let rects=selectors.map(sel=>{const el=document.querySelector(sel);const r=el?.getBoundingClientRect();return {selector:sel,left:r?.left??null,right:r?.right??null,width:r?.width??null,display:el?getComputedStyle(el).display:null}});
      return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,headingCount:document.querySelectorAll('h1').length,heroHead:document.querySelector('h1')?.textContent,figures:document.querySelectorAll('.aj-object img').length,libels:document.querySelectorAll('.aj-libel').length,cycleSteps:document.querySelectorAll('.aj-cycle-list li').length,faqs:document.querySelectorAll('.aj-faq details').length,paragraphs:document.querySelectorAll('.aj-page main p').length,sourceChecks:['THREE LIBELS. CENTURIES OF PERSECUTION.','The Libel:','The Historical Reality:','Denial and erasure can help sustain or revive the original libel','The Language Changed. The Libels Endured.','SCHOLARLY SOURCES & HISTORICAL REFERENCES'].map(t=>({text:t,present:document.querySelector('main')?.innerText.includes(t)})),rects};
    });
    await page.screenshot({path:`qa/generated/aj-top-${width}.png`,fullPage:false});
    if(width===390){
      const bytes=fs.readFileSync('qa/generated/aj-top-390.png').toString('base64');
      console.log('AJ390_IMAGE_BEGIN');
      for(let i=0;i<bytes.length;i+=3500)console.log('AJ390_PNG '+bytes.slice(i,i+3500));
      console.log('AJ390_IMAGE_END');
    }
    await page.locator('#mechanism').scrollIntoViewIfNeeded();
    await page.screenshot({path:`qa/generated/aj-mechanism-${width}.png`,fullPage:false});
    if(width===390){
      const bytes=fs.readFileSync('qa/generated/aj-mechanism-390.png').toString('base64');
      console.log('AJ390_MECHANISM_BEGIN');
      for(let i=0;i<bytes.length;i+=3500)console.log('AJ390_MECHANISM_PNG '+bytes.slice(i,i+3500));
      console.log('AJ390_MECHANISM_END');
    }
    const badRects=metrics.rects.filter(x=>x.left!==null&&(x.left<-.6||x.right>width+.6||x.width<1));
    const failedChecks=metrics.sourceChecks.filter(x=>!x.present);
    output.push({width,mobile,metrics,errors,badRects,failedChecks});
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
fs.writeFileSync('qa/generated/antijudaism-mobile-report.json',JSON.stringify(output,null,2));
console.log('AJ_REPORT_BEGIN '+JSON.stringify(output)+' AJ_REPORT_END');
if(output.some(x=>x.metrics.scrollWidth>x.width+.5||x.metrics.headingCount!==1||x.metrics.figures!==5||x.metrics.libels!==3||x.metrics.cycleSteps!==6||x.metrics.faqs!==3||x.failedChecks.length||x.badRects.length||x.errors.length))process.exitCode=1;
