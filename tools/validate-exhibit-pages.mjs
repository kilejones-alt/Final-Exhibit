// Hard release guard for future exhibit slots: no dependencies required.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const languages=[
  {lang:'en',dir:'',prefix:'pages/',base:'../'},
  {lang:'ru',dir:'',prefix:'ru/pages/',base:'../../'},
  {lang:'he',dir:'rtl',prefix:'he/pages/',base:'../../'}
];
const required=['exhibit.css?v=19','responsive.css?v=19','overview-refinements.css?v=1','exhibition-page-shell.css?v=1'];
const expected=Array.from({length:20},(_,i)=>'page-'+String(i+3).padStart(2,'0')+'.html');
const problems=[];
const check=(condition,message)=>{if(!condition)problems.push(message)};
check(fs.existsSync(path.join(root,'EXHIBITION_PAGE_RULES.md')),'Missing binding rulebook');
check(fs.existsSync(path.join(root,'exhibition-page-shell.css')),'Missing blank canvas shared stylesheet');
check(fs.existsSync(path.join(root,'exhibit.js')),'Missing shared interactions script');
for(const locale of languages){
  const baseDir=path.join(root,locale.prefix);
  const actual=fs.readdirSync(baseDir).filter(n=>/^page-\d+\.html$/.test(n)).sort();
  check(actual.join('|')===expected.join('|'),locale.lang+': expected exactly pages 03–22, found '+actual.join(', '));
}
for(const filename of expected){
  const pageStates=[];
  const bodyShapes=[];
  for(const {lang,dir,prefix,base} of languages){
    const p=prefix+filename;
    const html=read(p);
    const label=lang+': '+p;
    check(html.startsWith('<!doctype html>'),label+' must begin with doctype');
    check(html.includes('<html lang="'+lang+'"'+(dir?' dir="'+dir+'"':'')+'>'),label+' missing exact locale HTML attributes');
    check(html.includes('<base href="'+base+'">'),label+' wrong relative asset base');
    check(html.includes('name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"'),label+' missing viewport fit');
    check(html.includes('name="robots" content="noindex,nofollow"')||html.includes('data-page-state="content"'),label+' blank page must remain noindex');
    for(const asset of required)check(html.includes('href="'+asset+'"'),label+' missing shared CSS '+asset);
    check(html.includes('src="exhibit.js?v=19"'),label+' missing shared animation JS');
    check(html.includes('class="dark home-selected exhibition-future"'),label+' wrong style inheritance');
    const state=html.match(/data-page-state="(blank|content)"/)?.[1];
    check(!!state,label+' missing page state');
    pageStates.push(state);
    const main=html.match(/<main id="main" class="exhibition-future-main"[^>]*>([\s\S]*?)<\/main>/);
    check(!!main,label+' missing required shared empty/content main');
    if(state==='blank'){
      check(!!main&&!main[1].trim(),label+' has visible/hidden content inside reserved blank main');
      const body=html.match(/<body[^>]*>([\s\S]*)<\/body>/);
      check(!!body&&!!main&&body[1].replace(main[0],'').trim()==='',label+' has unexpected visible content outside blank main');
    }
    const body=html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    const shape=(body?.[1]||'').replace(/>[^<>]*</g,'><').match(/<\/?[a-z][a-z\d-]*/gi)?.join(' ')||'';
    bodyShapes.push(shape);
  }
  check(new Set(pageStates).size===1,filename+' differs in blank/content state across languages');
  if(pageStates[0]==='content')check(new Set(bodyShapes).size===1,filename+' structural tags differ between language mirrors');
}
check(read('README.md').includes('EXHIBITION_PAGE_RULES.md'),'README must link the mandatory rulebook');
if(problems.length){console.error('Exhibition rule-check FAILED ('+problems.length+'):\n'+problems.map(s=>' - '+s).join('\n'));process.exit(1)}
console.log('PASS: 20 reserved exhibition pages / 60 locale mirrors, shared rules, blank canvas and language structure verified.');
