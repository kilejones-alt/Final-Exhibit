import { webkit } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const server=spawn('python3',['-m','http.server','8771','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(1100);
fs.mkdirSync('qa/generated',{recursive:true});
const browser=await webkit.launch({headless:true});
const output=[];
try{
 for(const width of [320,390,412,768]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',x=>errors.push(String(x)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:8771/newer/antijudaism.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>document.fonts.ready);
  const snap=await page.evaluate(()=>{
   const els=['.site-header','.site-header .brand','.header-pills','#aj-title','.src-hero','.src-editorial-row','#libels','#cycle','#faq','.exhibit-footer'];
   return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,
    visibleHeading:document.querySelector('h1')?.innerText||'',
    sections:document.querySelectorAll('#libels > .src-artifact').length,steps:document.querySelectorAll('#cycle .src-stage').length,
    bounds:els.map(selector=>{let el=document.querySelector(selector),r=el?.getBoundingClientRect();return {selector,display:el?getComputedStyle(el).display:null,left:r?.left,right:r?.right,width:r?.width}})};
  });
  await page.screenshot({path:`qa/generated/aj-safari-${width}.png`});
  output.push({width,snap,errors,bad:snap.bounds.filter(x=>x.width===0||x.left<-.6||x.right>width+.6)});
  await page.close();
 }
}finally{await browser.close();server.kill();}
fs.writeFileSync('qa/generated/aj-webkit-report.json',JSON.stringify(output,null,2));
console.log('AJ_WEBKIT_REPORT '+JSON.stringify(output));
if(output.some(x=>x.errors.length||x.bad.length||x.snap.scrollWidth>x.width||x.snap.sections!==3||x.snap.steps!==6))process.exitCode=1;
