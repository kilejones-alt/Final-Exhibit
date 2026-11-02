import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';

fs.mkdirSync('qa/generated',{recursive:true});
const server=spawn('python3',['-m','http.server','8767','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(resolve=>setTimeout(resolve,1200));
const browser=await chromium.launch({headless:true});
const results=[];
for(const locale of ['he','ru']) {
 for(const width of [320,390,768,1440]) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8767/'+locale+'/entrance.html',{waitUntil:'networkidle'});
  const initial=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,lang:document.documentElement.lang,dir:document.documentElement.dir,doors:document.querySelectorAll('.triptych .door').length,heading:document.querySelector('h1')?.innerText}));
  const framework=page.locator('.era-framework');
  if(await framework.count())await framework.scrollIntoViewIfNeeded();
  await page.screenshot({path:'qa/generated/locale-'+locale+'-'+width+'.png',fullPage:false});
  const after=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
  results.push({locale,width,initial,after,errors});
  await page.close();
 }
}
await browser.close();
server.kill();
fs.writeFileSync('qa/generated/locale-smoke.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
const bad=results.filter(x=>x.errors.length||x.initial.scrollWidth>x.width||x.after.scrollWidth>x.width||x.initial.lang!==x.locale||x.initial.doors!==3||(x.locale==='he'&&x.initial.dir!=='rtl'));
if(bad.length){console.error('FAILED LOCALE VIEWPORTS',bad.length);process.exitCode=1;}
