/* Deicide archival film — silent, minimal cinema edition.
   Approved SCENES content is supplied by the HTML and is never rewritten here.
   Images finish loading and decoding before every cross-dissolve. */
'use strict';
const S=SCENES;
const $=id=>document.getElementById(id);
const theater=$('theater'),art=$('image-hold'),halo=$('halo');
const images=[$('image-a'),$('image-b')];
const copy=$('copy'),date=$('date'),title=$('title'),quote=$('quote');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hosted=new URLSearchParams(location.search).get('embedded')==='1';
const offsets=[0];
S.forEach(s=>offsets.push(offsets[offsets.length-1]+s.duration));
const TOTAL=offsets[offsets.length-1];
const cache=new Map();
let time=0,last=0,wanted=-1,shown=-1,active=0,request=0;
let playing=true,finishing=false,suspendedByVisibility=false;
let finishTimer=null,fadeTimer=null;
const fadeMs=reduced?30:2200;

function preload(n){
 if(n<0||n>=S.length)return Promise.resolve(false);
 if(cache.has(n))return cache.get(n);
 const photo=new Image();
 photo.decoding='async';
 const ready=new Promise(resolve=>{
  photo.onload=()=>resolve(true);
  photo.onerror=()=>resolve(false);
  photo.src=S[n].photo;
  if(photo.complete)resolve(photo.naturalWidth>0);
 }).then(async ok=>{
  if(ok&&typeof photo.decode==='function'){
   try{await photo.decode()}catch(e){}
  }
  return ok;
 });
 cache.set(n,ready);
 return ready;
}
function idxAt(t){
 for(let n=0;n<S.length;n++)if(t<offsets[n+1])return n;
 return S.length-1;
}
function moveCamera(){
 if(reduced||shown<0||shown===8||shown===S.length-1)return;
 const n=shown;
 const p=Math.max(0,Math.min(1,(time-offsets[n])/S[n].duration));
 const e=p*p*(3-2*p);
 const direction=n%2===0?1:-1;
 let dx=0,dy=0,scale=1.008;
 switch(S[n].move){
  case 'ascend':scale=1.008+.027*e;dx=-4*direction*e;dy=-6*e;break;
  case 'glide':scale=1.008+.027*e;dx=6*direction*e;dy=-2*e;break;
  case 'slow':scale=1.008+.022*e;dx=-4*direction*e;dy=-4*e;break;
  case 'close':scale=1.012+.023*e;dx=4*direction*e;dy=2*e;break;
  case 'still':scale=1.008+.01*e;break;
  default:scale=1.008+.024*e;
 }
 images[active].style.transform='translate3d('+dx.toFixed(2)+'px,'+dy.toFixed(2)+'px,0) scale('+scale.toFixed(4)+')';
}
function showScene(n){
 if(n===wanted)return;
 wanted=n;
 const token=++request;
 const s=S[n];
 preload(n).then(ok=>{
  if(token!==request)return;
  const first=shown<0;
  const oldImage=first?null:images[active];
  const nextIndex=first?active:1-active;
  const newImage=images[nextIndex];

  if(!first){
   newImage.classList.remove('visible');
   newImage.style.transition='none';
   newImage.style.zIndex='2';
   oldImage.style.zIndex='1';
  }
  newImage.src=s.photo;
  newImage.alt=s.title+' — historical archival artwork';
  newImage.style.transform='translate3d(0,0,0) scale(1.008)';
  if(!first){
   void newImage.offsetWidth;
   newImage.style.removeProperty('transition');
  }
  // If a source file fails, the previous frame remains rather than a black flash.
  if(!ok&&!first)return;
  const previousScene=shown;
  shown=n;
  active=nextIndex;
  theater.classList.toggle('is-typographic',n===8);
  theater.classList.toggle('is-credits',n===S.length-1);
  $('interlude').setAttribute('aria-hidden',n===8?'false':'true');

  copy.classList.remove('is-shown');
  const writeCaptions=()=>{
   if(token!==request)return;
   date.textContent=s.date;
   title.textContent=s.title;
   quote.textContent=s.sub;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(token===request)copy.classList.add('is-shown');
   }));
  };
  if(previousScene<0)writeCaptions();
  else setTimeout(writeCaptions,reduced?0:620);

  requestAnimationFrame(()=>{
   if(token!==request)return;
   newImage.classList.add('visible');
   if(oldImage){
    // Keep the outgoing picture fully visible underneath the incoming fade.
    // It is hidden only when the new, decoded image is already opaque.
    setTimeout(()=>{if(token===request)oldImage.classList.remove('visible')},fadeMs+30);
   }
  });
  preload(n+1);preload(n+2);preload(n+3);
 });
}
function closeFilm(){
 playing=false;
 clearTimeout(fadeTimer);clearTimeout(finishTimer);
 if(window.parent!==window)window.parent.postMessage({type:'deicide-film-exit'},location.origin);
 else location.href='antijudaism.html#libel-blood';
}
function finish(){
 if(finishing)return;
 finishing=true;playing=false;
 if(hosted){
  fadeTimer=setTimeout(()=>theater.classList.add('finale'),550);
  finishTimer=setTimeout(()=>window.parent.postMessage({type:'deicide-film-finished'},location.origin),3000);
 }
}
function tick(now){
 if(!last)last=now;
 const diff=Math.max(0,Math.min(.12,(now-last)/1000));
 last=now;
 if(playing&&!finishing)time=Math.min(TOTAL,time+diff);
 showScene(idxAt(time));
 moveCamera();
 if(time>=TOTAL)finish();
 requestAnimationFrame(tick);
}
function seek(value){
 time=Math.max(0,Math.min(TOTAL-.08,Number(value)||0));
 last=0;
 if(finishing){
  finishing=false;playing=true;
  theater.classList.remove('finale');
  clearTimeout(fadeTimer);clearTimeout(finishTimer);
 }
 showScene(idxAt(time));
}
function togglePause(){
 if(finishing){seek(0);return;}
 playing=!playing;last=0;
}
$('exit').addEventListener('click',closeFilm);
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();closeFilm();}
 else if(event.code==='Space'&&!event.target.closest('button,input')){
  event.preventDefault();togglePause();
 }else if(!event.target.closest('input')&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){
  event.preventDefault();
  const n=idxAt(time)+(event.key==='ArrowRight'?1:-1);
  seek(offsets[Math.max(0,Math.min(S.length-1,n))]+.01);
 }
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){
  suspendedByVisibility=playing;
  if(playing){playing=false;last=0;}
 }else if(suspendedByVisibility&&!finishing){
  suspendedByVisibility=false;playing=true;last=0;
 }
});
// Start at the first ready picture: no arbitrary five-second delay to playback.
// The room darkens over five seconds independently of the timeline.
preload(0).then(()=>{
 images[0].src=S[0].photo;
 images[1].src=S[0].photo;
 halo.src=S[0].photo;
 art.style.setProperty('--museum-art','url("'+S[0].photo+'")');
 showScene(0);
 preload(1);preload(2);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  theater.classList.add('open');
  requestAnimationFrame(tick);
 }));
});
