import {chromium,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const server=spawn('python3',['-m','http.server','8793','--bind','127.0.0.1'],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
await delay(1200);
const specs=[
 {engine:chromium,path:'index.html',width:390},
 {engine:webkit,path:'he/index.html',width:390},
 {engine:webkit,path:'ru/index.html',width:390},
 {engine:chromium,path:'entrance.html',width:1440},
 {engine:webkit,path:'he/entrance.html',width:390},
 {engine:webkit,path:'ru/entrance.html',width:390},
 {engine:webkit,path:'antijudaism.html',width:390}
];
const output=[];
fs.mkdirSync('qa/generated',{recursive:true});
try{
 for(const spec of specs){
  const browser=await spec.engine.launch({headless:true});
  const page=await browser.newPage({viewport:{width:spec.width,height:844},isMobile:spec.width<600,hasTouch:spec.width<600,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:8793/'+spec.path,{waitUntil:'domcontentloaded'});
   const home=spec.path.endsWith('index.html');
   const button=page.locator(home?'.music':'.audio-toggle');
   const audio=page.locator(home?'#cinema-audio':'#page-audio');
   await button.waitFor({state:'visible',timeout:9000});
   await button.scrollIntoViewIfNeeded();
   const initial=await audio.evaluate(e=>({paused:e.paused,loop:e.loop,src:e.getAttribute('src')}));
   const buttonStyle=await button.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {width:r.width,height:r.height,display:s.display}});
   await button.click();
   await delay(1100);
   const started=await audio.evaluate(e=>({paused:e.paused,currentTime:e.currentTime,muted:e.muted,volume:e.volume,readyState:e.readyState}));
   const pressed=await button.getAttribute('aria-pressed');
   await button.click();
   const stopped=await audio.evaluate(e=>({paused:e.paused,currentTime:e.currentTime}));
   const result={path:spec.path,width:spec.width,engine:spec.engine===webkit?'webkit':'chromium',initial,buttonStyle,started,pressed,stopped,errors};
   output.push(result);
  }finally{await page.close();await browser.close()}
 }
}finally{server.kill()}
fs.writeFileSync('qa/generated/music-trilingual-report.json',JSON.stringify(output,null,2));
console.log('MUSIC_REPORT '+JSON.stringify(output));
const failure=output.filter(x=>x.errors.length||!x.initial.paused||x.initial.loop!==true||x.started.paused||x.started.currentTime<=0||x.pressed!=='true'||!x.stopped.paused||(x.path.endsWith('index.html')&&(x.buttonStyle.width<43||x.buttonStyle.height<43)));
if(failure.length){console.error('MUSIC_FAIL '+JSON.stringify(failure));process.exitCode=1;}
