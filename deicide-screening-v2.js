/* THE THIRD ERA | DEICIDE | Immersive, narrated museum screening
 * User-supplied historical cards, original full narration and original score.
 * Playback governed by actual audio currentTime, not scroll distance. */
(() => {
 'use strict';
 const root=document.getElementById('deicide-cinema');
 if(!root)return;
 const $=id=>root.querySelector('#'+id);
 const slides=[
  ['The Evolution of the Deicide Libel','Introduction'],
  ['The Crucifixion','c. 30 CE'],
  ['Destruction of the Second Temple','70 CE'],
  ['The Gospel Accounts','c. 85 CE'],
  ['Ignatius of Antioch','c. 110 CE'],
  ['Hadrian and the Bar Kokhba Revolt','135 CE'],
  ['Justin Martyr','c. 150 CE'],
  ['Melito of Sardis','c. 165 CE'],
  ['Origen','c. 240 CE'],
  ['Constantine and the Council of Nicaea','325 CE'],
  ['Theodosius I','380 CE'],
  ['John Chrysostom','c. 387 CE'],
  ['From Dispute to Doctrine','440 CE'],
  ['Credits','Final frame']
 ];
 const frames=[...root.querySelectorAll('.deicide-frame')];
 const caption=root.querySelector('.deicide-caption');
 const screen=$('deicide-screen');
 const title=$('deicide-scene-title'),date=$('deicide-scene-date');
 const current=$('deicide-current'),progress=$('deicide-progress-indicator');
 const prev=$('deicide-prev'),next=$('deicide-next'),sound=$('deicide-sound');
 const gate=$('deicide-screening-gate'),start=$('deicide-begin');
 const quick=$('deicide-quick-tour'),silent=$('deicide-silent-tour');
 const replay=$('deicide-screening-replay'),exit=$('deicide-screening-exit');
 const play=$('deicide-screening-play'),clock=$('deicide-screening-time');
 const audio=$('deicide-voice-score'),shortAudio=$('deicide-quick-score');
 const siteAudio=document.getElementById('page-audio');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 const pad=t=>String(Math.floor(t)).padStart(2,'0');
 const fmt=s=>pad(Math.floor(s/60))+':'+pad(Math.floor(s%60));
 const DUR_FULL=438,DUR_SHORT=133;
 // Download the short cut once so seeking never depends on static-host byte ranges.
 let quickReady=null;
 function prepareQuickAudio(){
   if(shortAudio.src.startsWith('blob:'))return Promise.resolve();
   if(!quickReady){
     quickReady=fetch(new URL('assets/deicide-cinema/deicide_quick_ambient.m4a',document.baseURI))
       .then(r=>{if(!r.ok)throw Error('Short score unavailable');return r.arrayBuffer();})
       .then(buffer=>{shortAudio.src=URL.createObjectURL(new Blob([buffer],{type:'audio/mp4'}));shortAudio.load();})
       .catch(err=>{quickReady=null;throw err;});
   }
   return quickReady;
 }

 // Reassemble the unchanged AAC source from lossless binary parts. Splitting only
 // keeps each immutable GitHub Pages asset under the connector upload limit.
 let fullAudioReady=null;
 function prepareNarration(){
   if(audio.src)return Promise.resolve();
   if(!fullAudioReady){
     const paths=[1,2,3,4].map(i=>'assets/deicide-cinema/deicide_voice_part_'+String(i).padStart(2,'0')+'.bin');
     fullAudioReady=Promise.all(paths.map(async path=>{
       const result=await fetch(new URL(path,document.baseURI));
       if(!result.ok)throw Error('Narration file unavailable: '+path);
       return result.arrayBuffer();
     })).then(parts=>{
       const objectURL=URL.createObjectURL(new Blob(parts,{type:'audio/mp4'}));
       audio.src=objectURL;
       audio.load();
     }).catch(error=>{fullAudioReady=null;throw error});
   }
   return fullAudioReady;
 }

 let mode='narrated',opened=false,dismissed=false,finished=false,active=-1,activeAudio=audio,silentMode=false;
 let frameId=0,lastClock=0,elapsedSilent=0,wasSiteAudioPlaying=false,wasVolume=0.5,previousFocus=null;
 let startRequested=false;
 function setFrame(n){
   n=clamp(n,0,frames.length-1);if(n===active)return;
   if(active>=0){frames[active].classList.remove('is-active');frames[active].setAttribute('aria-hidden','true');}
   active=n;frames[n].classList.add('is-active');frames[n].setAttribute('aria-hidden','false');
   title.textContent=slides[n][0];date.textContent=slides[n][1];current.textContent=String(n+1).padStart(2,'0');
   prev.disabled=n===0;next.disabled=n===frames.length-1;
   if(!reduced){caption.classList.remove('is-revealing');void caption.offsetWidth;caption.classList.add('is-revealing');}
 }
 function restoreSiteAudio(){
   if(!siteAudio)return;
   siteAudio.volume=wasVolume;
   if(wasSiteAudioPlaying){siteAudio.play().catch(()=>{});wasSiteAudioPlaying=false;}
 }
 function openScreen(){
   if(opened||dismissed)return;
   previousFocus=document.activeElement;
   frames.forEach(frame=>{frame.classList.remove('is-active');frame.setAttribute('aria-hidden','true');});
   opened=true;finished=false;active=-1;
   root.classList.add('is-open');root.classList.remove('is-dismissed','is-playing');
   document.body.classList.add('deicide-modal-open');
   gate.removeAttribute('hidden');gate.removeAttribute('aria-hidden');replay.hidden=true;
   exit.parentElement.hidden=false;
   if(siteAudio){wasSiteAudioPlaying=!siteAudio.paused;wasVolume=siteAudio.volume;siteAudio.pause();}
   setFrame(0);
   start.focus({preventScroll:true});
 }
 function pauseAll(){
   audio.pause();shortAudio.pause();
   cancelAnimationFrame(frameId);frameId=0;
   root.classList.add('is-paused');
   play.textContent='Resume';play.setAttribute('aria-label','Resume screening');
 }
 function closeScreen(advance=true){
   if(!opened)return;
   pauseAll();audio.currentTime=0;shortAudio.currentTime=0;
   opened=false;dismissed=true;root.classList.remove('is-open','is-playing');root.classList.add('is-dismissed');
   document.body.classList.remove('deicide-modal-open');
   replay.hidden=false;gate.removeAttribute('hidden');exit.parentElement.hidden=true;
   if(advance){
     const nextRoom=document.getElementById('libel-02');
     if(nextRoom)nextRoom.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
   }
   restoreSiteAudio();
   (previousFocus?.isConnected?previousFocus:replay)?.focus({preventScroll:true});
 }
 function updateSound(){
   const enabled=(!silentMode && !activeAudio.muted && !activeAudio.paused);
   sound.setAttribute('aria-pressed',String(enabled));
   const label=sound.querySelector('span');if(label)label.textContent=enabled?'Sound on':'Sound off';
 }
 function updateTime(){
   if(!opened||!root.classList.contains('is-playing')||root.classList.contains('is-paused'))return;
   const max=mode==='quick'?DUR_SHORT:DUR_FULL;
   const t=silentMode?elapsedSilent:clamp(activeAudio.currentTime,0,max);
   const f=clamp(t/max,0,1);
   let n=Math.min(frames.length-1,Math.floor(f*frames.length));
   setFrame(n);
   progress.style.transform='scaleX('+Math.max(.001,f).toFixed(5)+')';
   clock.textContent=fmt(t)+' / '+fmt(max);
   if(!reduced){
     const within=(f*frames.length)%1;
     const x=(n%2===0?1:-1);
     const z=1.025+.11*within;
     frames[n].style.setProperty('--zoom',z.toFixed(4));
     frames[n].style.setProperty('--cx',(x*within*9).toFixed(1)+'px');
     frames[n].style.setProperty('--cy',(-within*7).toFixed(1)+'px');
     frames[n].style.setProperty('--tilt',(x*within*.28).toFixed(3)+'deg');
     frames[n].style.setProperty('--camera-origin',n%2===0?'46% 43%':'54% 48%');
   }
   if(silentMode){
     const now=performance.now();if(lastClock){elapsedSilent+=Math.min(.1,(now-lastClock)/1000);}
     lastClock=now;
   }
   if((silentMode?elapsedSilent:t)>=max-.25){
     if(!finished){finished=true;setTimeout(()=>{if(opened)closeScreen(true);},1700);}return;
   }
   frameId=requestAnimationFrame(updateTime);
 }
 async function startScreen(nextMode,{muted=false,noAudio=false}={}){
   if(!opened)openScreen();
   if(startRequested)return;
   startRequested=true;
   pauseAll();
   mode=nextMode;silentMode=noAudio;elapsedSilent=0;lastClock=0;active=-1;finished=false;
   activeAudio=nextMode==='quick'?shortAudio:audio;
   activeAudio.currentTime=0;activeAudio.muted=muted;
   root.classList.add('is-playing');root.classList.remove('is-paused');
   play.textContent='Pause';play.setAttribute('aria-label','Pause screening');
   gate.setAttribute('aria-hidden','true');
   try{
     if(nextMode==='narrated'&&!noAudio){
       start.textContent='Preparing narration…';
       await prepareNarration();
       start.textContent='BEGIN NARRATED SCREENING';
       if(!opened)return;
     }
     if(nextMode==='quick'&&!noAudio)await prepareQuickAudio();
     if(!noAudio)await activeAudio.play();
     startRequested=false;updateSound();
     clock.textContent='00:00 / '+fmt(nextMode==='quick'?DUR_SHORT:DUR_FULL);
     cancelAnimationFrame(frameId);frameId=requestAnimationFrame(updateTime);
     play.focus({preventScroll:true});
   }catch(e){
     start.textContent='BEGIN NARRATED SCREENING';
     // Browser autoplay protection: keep the immersive gate, never silently lie about sound.
     startRequested=false;root.classList.remove('is-playing');gate.removeAttribute('aria-hidden');
     const note=root.querySelector('.deicide-gate-note');if(note)note.textContent='Your browser requires a click to enable playback. Choose Begin screening.';
     start.focus({preventScroll:true});
   }
 }
 function togglePause(){
   if(!opened)return;
   if(silentMode){
     if(frameId){pauseAll();lastClock=0;}else{play.textContent='Pause';root.classList.remove('is-paused');lastClock=0;frameId=requestAnimationFrame(updateTime);}return;
   }
   if(activeAudio.paused){activeAudio.play().then(()=>{play.textContent='Pause';root.classList.remove('is-paused');frameId=requestAnimationFrame(updateTime);updateSound();}).catch(()=>{});}
   else pauseAll();
 }
 function skip(delta){
   if(!opened||!root.classList.contains('is-playing'))return;
   const dur=mode==='quick'?DUR_SHORT:DUR_FULL;
   const target=clamp(active+delta,0,13);
   const t=(target+.015)*dur/14;
   if(silentMode){elapsedSilent=t;lastClock=0;}
   else activeAudio.currentTime=t;
   setFrame(target);if(!root.classList.contains('is-paused'))updateTime();
 }
 start.addEventListener('click',()=>startScreen('narrated'));
 quick.addEventListener('click',()=>startScreen('quick'));
 silent.addEventListener('click',()=>startScreen('quick',{noAudio:true}));
 replay.addEventListener('click',()=>{dismissed=false;openScreen();});
 exit.addEventListener('click',()=>closeScreen(true));
 root.querySelector('.deicide-exit a')?.addEventListener('click',e=>{e.preventDefault();closeScreen(true);});
 play.addEventListener('click',togglePause);
 prev.addEventListener('click',()=>skip(-1));next.addEventListener('click',()=>skip(1));
 sound.addEventListener('click',async()=>{
   if(!opened||silentMode)return;
   activeAudio.muted=!activeAudio.muted;
   if(activeAudio.paused){try{await activeAudio.play();}catch(e){}}
   updateSound();
 });
 audio.addEventListener('ended',()=>{if(!finished){finished=true;setTimeout(()=>closeScreen(true),1400);}});
 shortAudio.addEventListener('ended',()=>{if(!finished){finished=true;setTimeout(()=>closeScreen(true),1400);}});
 document.addEventListener('keydown',e=>{
   if(!opened)return;
   if(e.key==='Escape'){e.preventDefault();closeScreen(true);}
   if(e.key==='Tab'){
     const nodes=[...root.querySelectorAll('button:not([disabled]),a[href]')].filter(el=>el.getClientRects().length>0 && getComputedStyle(el).visibility!=='hidden');
     const focusable=nodes.filter(el=>root.classList.contains('is-playing')?!el.closest('.deicide-screening-gate'):!!el.closest('.deicide-screening-gate')||!!el.closest('.deicide-screening-utility'));
     if(focusable.length){let i=focusable.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();focusable[focusable.length-1].focus();}else if(!e.shiftKey&&i===focusable.length-1){e.preventDefault();focusable[0].focus();}}
   }
   if(e.key==='ArrowRight'){e.preventDefault();skip(1);}
   if(e.key==='ArrowLeft'){e.preventDefault();skip(-1);}
   if(e.code==='Space' && !['BUTTON','A'].includes(document.activeElement.tagName)){e.preventDefault();togglePause();}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&opened){pauseAll();}});
 if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
     for(const entry of entries){if(entry.isIntersecting&&!opened&&!dismissed)openScreen();}
   },{threshold:.36,rootMargin:'0px 0px -14% 0px'});
   observer.observe(root);
 } else {root.addEventListener('mouseenter',()=>{if(!opened&&!dismissed)openScreen()},{once:true});}
 root.classList.add('is-ready');
 setFrame(0);replay.hidden=true;exit.parentElement.hidden=true;
})();
