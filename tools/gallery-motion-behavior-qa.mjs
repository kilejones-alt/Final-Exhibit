/* Actual five-to-six-second camera zoom and slow-falling text, not just CSS names. */
import {chromium,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const server=spawn('python3',['-m','http.server','8795','--bind','127.0.0.1'],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
await delay(1100);
const cases=[
 ['chromium',chromium,'entrance.html',1440,'.home-message-title h2'],
 ['webkit',webkit,'he/entrance.html',390,'.home-message-title h2'],
 ['webkit',webkit,'ru/entrance.html',390,'.home-message-title h2'],
 ['webkit',webkit,'antijudaism.html',390,'.aj-section-heading h2']
];
const results=[];
fs.mkdirSync('qa/generated',{recursive:true});
try{
 for(const [name,engine,path,width,selector] of cases){
  const b=await engine.launch({headless:true});
  const p=await b.newPage({viewport:{width,height:900},hasTouch:width<500,isMobile:width<500,reducedMotion:'no-preference'});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  try{
   await p.goto('http://127.0.0.1:8795/'+path,{waitUntil:'domcontentloaded'});
   const target=p.locator(selector).first();await target.waitFor();
   const before=await target.evaluate(el=>({ready:document.documentElement.classList.contains('motion-ready'),tagged:el.hasAttribute('data-museum-reveal'),visible:el.classList.contains('is-museum-visible'),opacity:getComputedStyle(el).opacity,transition:getComputedStyle(el).transitionDuration}));
   await target.scrollIntoViewIfNeeded();
   await delay(2300);
   const after=await target.evaluate(el=>({visible:el.classList.contains('is-museum-visible'),opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform}));
   const screenshot='qa/generated/falling-text-'+name+'-'+path.replace(/\W/g,'-')+'.png';
   await p.screenshot({path:screenshot});
   results.push({kind:'falling-text',engine:name,path,width,before,after,errors});
  }finally{await p.close();await b.close()}
 }
 for(const [name,engine,width] of [['chromium',chromium,1440],['webkit',webkit,390]]){
  const b=await engine.launch({headless:true});
  const p=await b.newPage({viewport:{width,height:844},hasTouch:width<500,isMobile:width<500,reducedMotion:'no-preference'});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  try{
   await p.goto('http://127.0.0.1:8795/antisemitism.html',{waitUntil:'domcontentloaded'});
   const frame=p.locator('.art-open').first();
   await frame.scrollIntoViewIfNeeded();
   await delay(250);
   const img=frame.locator('img');
   const before=await img.evaluate(el=>({transition:getComputedStyle(el).transitionDuration,animation:getComputedStyle(el).animationDuration,transform:getComputedStyle(el).transform}));
   if(width>500)await frame.hover();
   else await frame.evaluate(el=>{el.classList.add('museum-mobile-arrived')});
   await delay(1800);
   const during=await img.evaluate(el=>({transform:getComputedStyle(el).transform,animation:getComputedStyle(el).animationDuration}));
   await delay(4000);
   const settled=await img.evaluate(el=>({transform:getComputedStyle(el).transform,animation:getComputedStyle(el).animationDuration}));
   const imgScreenshot='qa/generated/camera-zoom-'+name+'-'+width+'.png';
   await p.screenshot({path:imgScreenshot});
   results.push({kind:'camera-zoom',engine:name,path:'antisemitism.html',width,before,during,settled,errors});
  }finally{await p.close();await b.close()}
 }
}finally{server.kill()}
fs.writeFileSync('qa/generated/gallery-motion-behavior.json',JSON.stringify(results,null,2));
console.log('MOTION_REPORT '+JSON.stringify(results));
const issues=results.filter(r=>{
 if(r.errors.length)return true;
 if(r.kind==='falling-text')return !r.before.ready||!r.before.tagged||!r.after.visible||Number(r.after.opacity)<.93;
 if(r.kind==='camera-zoom'){
  const scale=matrix=>{const m=matrix?.match(/matrix(?:3d)?\(([^)]+)\)/);return m?Number(m[1].split(',')[0]):1};
  return r.width>500?!r.before.transition.includes('5.5s')||scale(r.during.transform)<=1.003||scale(r.settled.transform)<1.03:
    !r.before.animation.includes('5.5s')||scale(r.settled.transform)<1.02;
 }
 return true;
});
if(issues.length){console.error('MOTION_FAIL '+JSON.stringify(issues));process.exitCode=1}
