import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const server=spawn('python3',['-m','http.server','8891','--bind','127.0.0.1'],{stdio:'ignore'});
const base='http://127.0.0.1:8891/newer/';
const locales=['','ru/','he/'];
const rooms=['entrance.html','antijudaism.html','antisemitism.html','exhibition.html','colonialism.html','apartheid.html','genocide.html','historical-sources.html'];
const labels={
 en:['Colonialism','Apartheid and Racism Libels','Genocide'],
 ru:['Колониализм','Обвинения в апартеиде и расизме','Геноцид'],
 he:['קולוניאליזם','עלילות האפרטהייד והגזענות','רצח עם']
};
const results=[];
fs.mkdirSync('qa/type-timeline-polish',{recursive:true});
await new Promise(r=>setTimeout(r,800));
try {
 for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]) {
  const browser=await engine.launch({headless:true});
  for(const locale of locales) for(const room of rooms) for(const width of [320,1024,1440]) {
   const context=await browser.newContext({viewport:{width,height:width===320?568:900},isMobile:width<700,hasTouch:width<700,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('response',r=>{if(r.status()>=400 && r.url().includes('127.0.0.1:8891'))missing.push(r.url());});
   const result={engine:engineName,route:locale+room,width,passed:false,failures:[]};
   try {
    const response=await page.goto(base+locale+room,{waitUntil:'load',timeout:25000});
    await page.evaluate(()=>document.fonts.ready);
    const data=await page.evaluate(()=>{
     const links=[...document.querySelectorAll('#museum-gallery-rail .museum-rail-image')];
     const preview=document.querySelector('.museum-rail-preview');
     const outside=[];
     for(const [i,link] of links.entries()) {
      link.dispatchEvent(new PointerEvent(innerWidth<700?'pointerdown':'pointerenter',{pointerType:innerWidth<700?'touch':'mouse'}));
      for(const animation of preview.getAnimations()) {try{animation.finish();}catch{}}
      const r=preview.getBoundingClientRect(),s=getComputedStyle(preview),v=visualViewport;
      if(s.display!=='none' && (r.left<v.offsetLeft+9 || r.top<v.offsetTop+9 || r.right>v.offsetLeft+v.width-9 || r.bottom>v.offsetTop+v.height-9))outside.push({stop:i,rect:[r.left,r.top,r.right,r.bottom],viewport:[v.offsetLeft,v.offsetTop,v.width,v.height]});
     }
     return {scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),labels:links.map(a=>a.title),active:links.filter(a=>a.hasAttribute('aria-current')).map(a=>new URL(a.href).pathname),dots:links.length,outside,cache:[...document.scripts].some(s=>s.src.includes('museum-global.js?v=20261104-polish1'))};
    });
    assert.equal(response.status(),200);
    assert(data.scrollWidth<=width+2,'horizontal overflow: '+data.scrollWidth);
    assert.equal(data.dots,7,'existing seven-stop timeline changed');
    assert.deepEqual(data.labels.slice(4),labels[locale.slice(0,2)||'en']);
    assert.equal(data.active.length,room==='historical-sources.html'?0:1,'wrong active dot count');
    if(data.active.length)assert(data.active[0].endsWith('/newer/'+locale+room),'incorrect active page');
    assert(data.cache,'new asset cache key missing');
    assert.deepEqual(data.outside,[],'preview exceeded visible viewport');
    assert.deepEqual(errors,[],'browser exceptions');
    assert.deepEqual(missing,[],'missing local resources');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.museum-rail-preview.is-open').count(),0,'Escape did not dismiss');
    if(room==='colonialism.html') {
     await page.locator('.museum-rail-image').nth(5).dispatchEvent(width<700?'pointerdown':'pointerenter',{pointerType:width<700?'touch':'mouse'});
     await page.setViewportSize({width:width+16,height:width<700?584:916});
     await page.waitForTimeout(100);
     assert.equal(await page.locator('.museum-rail-preview.is-open').count(),0,'resize did not dismiss preview');
     await page.locator('.museum-rail-image').nth(5).click();
     await page.waitForURL('**/newer/'+locale+'apartheid.html',{timeout:10000});
    }
    if(room==='apartheid.html' && width===1440) {
     await page.locator('.museum-rail-image').nth(5).focus();
     await page.evaluate(()=>{for(const a of document.querySelector('.museum-rail-preview').getAnimations()){try{a.finish()}catch{}}});
     await page.screenshot({path:'qa/type-timeline-polish/'+engineName+'-'+(locale.slice(0,2)||'en')+'-timeline.png'});
    }
    result.passed=true;
   } catch(e) {result.failures.push(String(e));}
   finally {results.push(result);await context.close();}
   console.log(engineName,locale+room,width,result.passed?'PASS':'FAIL '+result.failures.join('; '));
  }
  // Normal-motion smoke test keeps the existing slow artwork timing and opener.
  for(const locale of locales) {
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await context.newPage();
   const result={engine:engineName,route:locale+'index.html',width:390,passed:false,failures:[]};
   try {
    await page.goto(base+locale+'index.html',{waitUntil:'load'});
    const count=await page.locator('.cinema-plate').count();assert.equal(count,24);
    assert.equal(await page.locator('a.entry-pill').count(),1);
    await page.locator('.cinema').dispatchEvent('click',{button:0});
    await page.waitForURL('**/newer/'+locale+'entrance.html',{timeout:15000});
    assert.equal(await page.locator('.museum-rail-image').count(),7);
    result.passed=true;
   }catch(e){result.failures.push(String(e));}
   results.push(result);await context.close();
  }
  await browser.close();
 }
} finally {server.kill();}
const failures=results.filter(r=>!r.passed);
fs.writeFileSync('qa/type-timeline-polish/results.json',JSON.stringify({checks:results.length,passed:results.length-failures.length,failed:failures.length,results},null,2));
console.log('SUMMARY',JSON.stringify({checks:results.length,passed:results.length-failures.length,failures}));
if(failures.length)process.exitCode=1;
