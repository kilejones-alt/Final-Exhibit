/* DEICIDE · archival museum film, edition 2026-11.
   Editorial integrity: SCENES is injected unmodified from the approved source.
   Time is controlled by the picture, never by optional audio. */
'use strict';
const S=SCENES;
const $=id=>document.getElementById(id);
const theater=$('theater'),art=$('image-hold'),stage=$('stage'),halo=$('halo');
const images=[$('image-a'),$('image-b')],copy=$('copy'),date=$('date'),title=$('title'),quote=$('quote');
const aud=$('voice'),sound=$('narrate'),pause=$('pause'),previous=$('previous'),next=$('next');
const progress=$('progress'),timer=$('time-display'),sceneName=$('scene-name'),counter=$('hud-counter'),status=$('status');
const reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const hosted=new URLSearchParams(location.search).get('embedded')==='1';
const offsets=[0];
S.forEach(s=>offsets.push(offsets[offsets.length-1]+s.duration));
const TOTAL=offsets[offsets.length-1];
const SCORE_END=Math.min(133,TOTAL);
const sceneCache=new Map();
let time=0,last=0,current=-1,active=0,playing=!hosted,sounding=false,finishing=false,raf=0;
let begun=!hosted,fadeTimer=null,finishTimer=null,seekDragging=false;
const numeral=n=>String(n).padStart(2,'0');
const clock=t=>numeral(Math.floor(t/60))+':'+numeral(Math.floor(t%60));
function message(value){
 status.textContent=value;
 clearTimeout(message.timer);
 message.timer=setTimeout(()=>{status.textContent=''},3400);
}
function preload(n){
 if(n<0||n>=S.length||sceneCache.has(n))return;
 let p=new Image();
 p.decoding='async';
 p.src=S[n].photo;
 sceneCache.set(n,p);
}
function idxAt(t){
 for(let n=0;n<S.length;n++)if(t<offsets[n+1])return n;
 return S.length-1;
}
function moveCamera(n,local){
 if(reduced || n===8 || n===13)return;
 const p=Math.max(0,Math.min(1,local)),s=S[n];
 let dx=0,dy=0,scale=1.006;
 const direction=n%2===0?1:-1;
 switch(s.move){
  case 'ascend':scale=1.012+.052*p;dx=direction*-8*p;dy=-14*p;break;
  case 'glide':scale=1.009+.061*p;dx=direction*17*p;dy=direction*-3*p;break;
  case 'slow':scale=1.012+.037*p;dx=direction*-8*p;dy=-7*p;break;
  case 'close':scale=1.024+.073*p;dx=direction*8*p;dy=4*p;break;
  case 'still':scale=1.009+.012*p;break;
  default:scale=1.011+.048*p;
 }
 // Preserve the complete artwork: move the containing image, never crop its source.
 images[active].style.transform='translate3d('+dx.toFixed(2)+'px,'+dy.toFixed(2)+'px,0) scale('+scale.toFixed(4)+')';
}
function draw(n){
 if(n===current)return;
 current=n;
 const s=S[n];
 const isFirst=current===0&&!draw.hasDrawn;
 const image=isFirst?images[active]:images[1-active];
 image.style.transform='translate3d(0,0,0) scale(1.006)';
 image.src=s.photo;
 image.alt=s.title+' — historical archival artwork';
 image.classList.add('visible');
 if(!isFirst){images[active].classList.remove('visible');active=1-active}
 draw.hasDrawn=true;
 $('interlude').setAttribute('aria-hidden',n===8?'false':'true');
 art.style.setProperty('--museum-art','url("'+s.photo+'")');
 halo.src=s.photo;
 theater.classList.toggle('is-typographic',n===8);
 theater.classList.toggle('is-credits',n===S.length-1);
 copy.classList.remove('is-shown');
 date.textContent=s.date;
 title.textContent=s.title;
 quote.textContent=s.sub;
 sceneName.textContent=s.date;
 counter.textContent=numeral(n+1)+' / '+numeral(S.length);
 requestAnimationFrame(()=>requestAnimationFrame(()=>copy.classList.add('is-shown')));
 preload(n+1);preload(n+2);
}
function audioFollow(){
 if(!sounding||aud.paused)return;
 // The motion clock is authoritative; the 133s score never rewinds a 138s film.
 const available=Number.isFinite(aud.duration)&&aud.duration>0?aud.duration:SCORE_END;
 const cap=Math.min(available-.06,SCORE_END-.06);
 if(time<=cap-.05 && Math.abs(aud.currentTime-time)>.3){
  try{aud.currentTime=Math.max(0,time)}catch(e){}
 }
 const intro=Math.min(1,Math.max(.01,(aud.currentTime)/3.7));
 const outro=Math.min(1,Math.max(0,(SCORE_END-aud.currentTime)/6.3));
 aud.volume=Math.min(.58,.58*intro*outro);
}
function renderTransport(){
 if(!seekDragging){
  progress.value=String(Math.min(TOTAL,time));
  progress.style.setProperty('--progress',(time/TOTAL*100).toFixed(3)+'%');
 }
 timer.textContent=clock(time)+' / '+clock(TOTAL);
 pause.textContent=finishing?'Replay':playing?'Pause':'Resume';
 pause.setAttribute('aria-label',finishing?'Replay film':playing?'Pause film':'Resume film');
}
function closeFilm(){
 playing=false;sounding=false;aud.pause();
 clearTimeout(fadeTimer);clearTimeout(finishTimer);
 if(window.parent!==window) window.parent.postMessage({type:'deicide-film-exit'},location.origin);
 else location.href='antijudaism.html#libel-blood';
}
function finish(){
 if(finishing)return;
 finishing=true;playing=false;
 sounding=false;aud.pause();
 sound.textContent='Play music';sound.setAttribute('aria-pressed','false');
 renderTransport();
 if(hosted){
  // The image stays on its last credits frame before the room fades to black.
  fadeTimer=setTimeout(()=>{theater.classList.add('finale')},550);
  finishTimer=setTimeout(()=>{
   window.parent.postMessage({type:'deicide-film-finished'},location.origin);
  },3000);
 }
}
function tick(now){
 if(!last)last=now;
 const diff=Math.max(0,Math.min(.12,(now-last)/1000));
 last=now;
 if(playing&&!finishing)time=Math.min(TOTAL,time+diff);
 const n=idxAt(time);
 draw(n);
 moveCamera(n,(time-offsets[n])/S[n].duration);
 audioFollow();
 renderTransport();
 if(time>=TOTAL)finish();
 raf=requestAnimationFrame(tick);
}
function seek(t){
 const value=Math.max(0,Math.min(TOTAL-.08,Number(t)||0));
 time=value;current=-1;last=0;
 if(finishing){
  finishing=false;theater.classList.remove('finale');
  clearTimeout(fadeTimer);clearTimeout(finishTimer);
 }
 if(sounding&&!aud.paused && value<SCORE_END-.07){
  try{aud.currentTime=value}catch(e){}
 }else if(sounding&&value>=SCORE_END){
  aud.pause();sounding=false;sound.textContent='Play music';sound.setAttribute('aria-pressed','false');
 }
 draw(idxAt(time));renderTransport();
}
function togglePause(){
 if(!begun)return;
 if(finishing){
  time=0;current=-1;finishing=false;playing=true;last=0;
  theater.classList.remove('finale');
  clearTimeout(fadeTimer);clearTimeout(finishTimer);
  if(sounding){try{aud.currentTime=0}catch(e){}aud.play().catch(()=>{})}
  draw(0);renderTransport();return;
 }
 playing=!playing;
 last=0;
 if(sounding){
  if(playing)aud.play().catch(()=>{});
  else aud.pause();
 }
 renderTransport();
}
async function toggleMusic(){
 if(sounding){
  aud.pause();sounding=false;
  sound.textContent='Play music';sound.setAttribute('aria-pressed','false');
  message('Music off');
  return;
 }
 if(finishing||time>=SCORE_END-1){
  message('The score has ended');return;
 }
 try{
  if(aud.readyState<2)await aud.load();
 }catch(e){}
 try{
  aud.currentTime=Math.max(0,Math.min(time,SCORE_END-.35));
  aud.volume=.08;
  await aud.play();
  sounding=true;
  sound.textContent='Music on';sound.setAttribute('aria-pressed','true');
  message('Music on');
  // Don't start the film during the architectural entrance.
  if(begun&&!playing)togglePause();
 }catch(e){
  message('Tap Play music to enable sound');
 }
}
sound.addEventListener('click',toggleMusic);
pause.addEventListener('click',togglePause);
previous.addEventListener('click',()=>seek(offsets[Math.max(0,idxAt(time)-1)]+.01));
next.addEventListener('click',()=>seek(offsets[Math.min(S.length-1,idxAt(time)+1)]+.01));
$('exit').addEventListener('click',closeFilm);
art.addEventListener('click',()=>{
 if(!sounding&&!finishing)toggleMusic();
});
progress.max=String(TOTAL);
progress.addEventListener('pointerdown',()=>{seekDragging=true});
progress.addEventListener('pointerup',()=>{seekDragging=false;seek(progress.value)});
progress.addEventListener('input',()=>{seekDragging=true;seek(progress.value);progress.value=String(time);progress.style.setProperty('--progress',(time/TOTAL*100).toFixed(3)+'%')});
progress.addEventListener('change',()=>{seekDragging=false;seek(progress.value)});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();closeFilm()}
 else if(event.code==='Space'&&!event.target.closest('button,input')){event.preventDefault();togglePause()}
 else if(!event.target.closest('input')&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){
  event.preventDefault();
  seek(offsets[Math.max(0,Math.min(S.length-1,idxAt(time)+(event.key==='ArrowRight'?1:-1)))]+.01);
 }
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&playing){playing=false;last=0;if(sounding)aud.pause();renderTransport()}
});
aud.addEventListener('ended',()=>{
 sounding=false;sound.textContent='Play music';sound.setAttribute('aria-pressed','false');
});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==window.parent)return;
 if(event.data?.type==='deicide-film-start'&&!begun){
  begun=true;playing=true;last=0;renderTransport();
 }
});
// Only critical art loads immediately; other frames are fetched as the film advances.
preload(0);preload(1);preload(2);
images[0].src=S[0].photo;
images[1].src=S[0].photo;
halo.src=S[0].photo;
aud.src='assets/deicide-cinema/deicide_quick_ambient.m4a?edition=museum-master';
aud.preload='auto';aud.volume=0;
draw(0);renderTransport();
requestAnimationFrame(()=>{theater.classList.add('open');requestAnimationFrame(tick)});
