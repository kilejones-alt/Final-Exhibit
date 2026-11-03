import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
const widths=[320,390,768,1024,1280,1440];
const results=[];
const browser=await chromium.launch({headless:true});
const sleep=t=>new Promise(r=>setTimeout(r,t));
await sleep(1500);
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8765/entrance.html',{waitUntil:'domcontentloaded'});
 await sleep(1600);
 const initial=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,doors:[...document.querySelectorAll('.triptych .door')].map(e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),w:Math.round(r.width),y:Math.round(r.y)}})}));
 await page.screenshot({path:`qa/generated/second-${width}-hero.png`,fullPage:false});
 const fw=page.locator('.era-framework');
 if(await fw.count()){
  await fw.scrollIntoViewIfNeeded();await sleep(4700);
  await page.screenshot({path:`qa/generated/second-${width}-framework.png`,fullPage:false});
 }
 const framework=await page.evaluate(()=>{
 const e=document.querySelector('.era-framework');if(!e)return null;
 const r=e.getBoundingClientRect();
 return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},opacity:getComputedStyle(e).opacity,innerOpacity:getComputedStyle(e.querySelector('.framework-inner')).opacity,labels:[...e.querySelectorAll('.framework-era')].map(x=>({text:x.innerText.trim().slice(0,90),x:x.getBoundingClientRect().x,width:x.getBoundingClientRect().width}))};
 });
 let hover=null;
 const img=page.locator('.triptych .door').first();
 if(await img.count()){
  await img.scrollIntoViewIfNeeded();await img.hover();await sleep(200);
  const start=await img.locator('img').first().evaluate(e=>getComputedStyle(e).transform).catch(()=>null);
  await sleep(5600);
  const end=await img.locator('img').first().evaluate(e=>getComputedStyle(e).transform).catch(()=>null);
  hover={start,end,changed:start!==end};
  await page.screenshot({path:`qa/generated/second-${width}-hover.png`,fullPage:false});
 }
 const after=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
 results.push({width,initial,after,framework,hover,errors});
 await page.close();
}
await browser.close();server.kill();
fs.writeFileSync('qa/generated/report.json',JSON.stringify(results,null,2));
let report='# Second-page rendered-browser QA\n\n';
for(const r of results){report+=`## ${r.width}px\n- Horizontal overflow: ${r.initial.scrollWidth>r.width||r.after.scrollWidth>r.width?'YES':'No'} (initial ${r.initial.scrollWidth}px; after ${r.after.scrollWidth}px)\n- Doors: ${JSON.stringify(r.initial.doors)}\n- Framework: ${JSON.stringify(r.framework)}\n- Hover: ${JSON.stringify(r.hover)}\n- JS errors: ${JSON.stringify(r.errors)}\n\n`;}
fs.writeFileSync('qa/generated/report.md',report);
console.log(report);
