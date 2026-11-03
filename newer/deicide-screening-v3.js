/* The Third Era / Deicide — autonomous cinematic exhibition, 2026-11-02.
   Approved fourteen images unchanged; excerpts below come from the displayed images.
   Film begins automatically without demanding scrolling or clicks. Browsers require
   a user gesture before audible narration; its source is prepared before that gesture. */
(() => {
  'use strict';
  const root = document.getElementById('deicide-cinema');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  const slides = [
    {title:'The Evolution of the Deicide Libel', date:'INTRODUCTION', line:'From a Roman execution to an accusation against a people.'},
    {title:'The Crucifixion',date:'c. 30 CE',line:'Jesus was crucified under Pontius Pilate, by Roman authority.'},
    {title:'Destruction of the Second Temple',date:'70 CE',line:'Rome destroyed Jerusalem and the Second Temple.'},
    {title:'The Gospel Accounts',date:'c. 85 CE',line:'“His blood be on us and on our children.”'},
    {title:'Ignatius of Antioch',date:'c. 110 CE',line:'“It is absurd to profess Christ Jesus and to Judaize.”'},
    {title:'Hadrian and the Bar Kokhba Revolt',date:'135 CE',line:'Jerusalem was rebuilt as Aelia Capitolina; Jews were excluded.'},
    {title:'Justin Martyr',date:'c. 150 CE',line:'Christians presented as the “true spiritual Israel.”'},
    {title:'Melito of Sardis',date:'c. 165 CE',line:'“God has been murdered.”'},
    {title:'Origen',date:'c. 240 CE',line:'Displacement interpreted as divine punishment.'},
    {title:'Constantine and Nicaea',date:'325 CE',line:'The ancient libel spoke with the voice of an emperor.'},
    {title:'Theodosius I',date:'380 CE',line:'Nicene Christianity established as imperial orthodoxy.'},
    {title:'John Chrysostom',date:'c. 387 CE',line:'“The slayers of Christ.”'},
    {title:'From Dispute to Doctrine',date:'440 CE',line:'Collective accusation became imperial doctrine and social policy.'},
    {title:'Credits',date:'HISTORICAL RECORD',line:'The Deicide Libel · Natasha H. Pein · Kile Jones'}
  ];
  const frames=[...root.querySelectorAll('.deicide-frame')];
  const sound=$('deicide-sound'),audio=$('deicide-voice-score');
  const gate=$('deicide-screening-gate'),play=$('deicide-screening-play'),exit=$('deicide-screening-exit');
  const replay=$('deicide-screening-replay'),previous=$('deicide-prev'),next=$('deicide-next');
  const counter=$('deicide-current'),time=$('deicide-screening-time'),progress=$('deicide-progress-indicator');
  const title=$('deicide-scene-title'),date=$('deicide-scene-date');
  const caption=root.querySelector('.deicide-caption');
  const screen=$('deicide-screen'),siteAudio=document.getElementById('page-audio');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FILM_SECONDS=126, VOICE_SECONDS=449.1;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const pad=x=>String(Math.max(0,Math.floor(x))).padStart(2,'0');
  const fmt=seconds=>pad(seconds/60)+':'+pad(seconds%60);
  const line=document.createElement('span'); line.className='deicide-caption-quotation'; caption.append(line);
  let opened=false,dismissed=false,active=-1,paused=false,mode='film',elapsed=0,lastStamp=0;
  let raf=0,voiceReady=null,lastFocus=null,siteWasPlaying=false,siteVolume=.5;
  let voiceObjectURL=null,curtainTimer=0;
  gate.hidden=true;
  const obsoleteAudio=$('deicide-quick-score');if(obsoleteAudio){obsoleteAudio.pause();obsoleteAudio.removeAttribute('src');}
  const buttonLabel=s=>{const label=sound.querySelector('span');if(label)label.textContent=s;};
  function voiceButton(text){buttonLabel(text);sound.setAttribute('aria-label',text);}
  voiceButton('Hear narration · 7:29');
  const images=frames.map(f=>f.querySelector('img'));
  images.forEach(image=>{image.decoding='async';image.loading='eager';});
  // Prepare original voice in the background, before the visitor asks for audio.
  function prepareVoice(){
    if(audio.src)return Promise.resolve();
    if(!voiceReady){
      voiceReady=Promise.all([1,2,3,4].map(async n=>{
        const path='assets/deicide-cinema/deicide_voice_clear_part_'+String(n).padStart(2,'0')+'.bin';
        const response=await fetch(new URL(path,document.baseURI),{cache:'force-cache'});
        if(!response.ok)throw new Error('Voice unavailable: '+path);
        return response.arrayBuffer();
      })).then(parts=>{
        voiceObjectURL=URL.createObjectURL(new Blob(parts,{type:'audio/mp4'}));
        audio.src=voiceObjectURL;audio.preload='auto';audio.load();
        root.classList.add('voice-ready');
      }).catch(error=>{
        voiceReady=null;
        root.classList.add('voice-error');
        console.warn('Deicide voice could not be prepared:',error);
        voiceButton('Narration unavailable · retry');
        throw error;
      });
    }
    return voiceReady;
  }
  const prefetchObserver='IntersectionObserver' in window ? new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){prefetchObserver.disconnect();prepareVoice().catch(()=>{});}
  },{rootMargin:'1400px 0px'}) : null;
  if(prefetchObserver)prefetchObserver.observe(root);else prepareVoice().catch(()=>{});

  function render(index){
    index=clamp(index,0,frames.length-1);
    if(index===active)return;
    if(active>=0){frames[active].classList.remove('is-active');frames[active].setAttribute('aria-hidden','true');}
    active=index;const frame=frames[index];frame.classList.add('is-active');frame.setAttribute('aria-hidden','false');
    title.textContent=slides[index].title;date.textContent=slides[index].date;
    line.textContent=slides[index].line;
    counter.textContent=pad(index+1);
    previous.disabled=index===0;next.disabled=index===frames.length-1;
    root.style.setProperty('--deicide-backdrop','url("'+images[index].getAttribute('src')+'")');
    caption.classList.remove('is-revealing');if(!reduced){void caption.offsetWidth;caption.classList.add('is-revealing');}
  }
  function stopSiteSound(){if(siteAudio){siteWasPlaying=!siteAudio.paused;siteVolume=siteAudio.volume;siteAudio.pause();}}
  function restoreSiteSound(){if(siteAudio){siteAudio.volume=siteVolume;if(siteWasPlaying)siteAudio.play().catch(()=>{});siteWasPlaying=false;}}
  function startFilm(){
    if(opened||dismissed)return;
    lastFocus=document.activeElement;opened=true;paused=false;elapsed=0;lastStamp=0;mode='film';
    stopSiteSound();root.classList.add('is-open','is-playing','is-film');root.classList.remove('is-dismissed','is-paused','is-narrating');
    document.body.classList.add('deicide-modal-open');replay.hidden=true;exit.parentElement.hidden=false;gate.hidden=true;
    play.textContent='Pause';play.setAttribute('aria-label','Pause the film');
    render(0);time.textContent='00:00 / '+fmt(FILM_SECONDS);
    clearTimeout(curtainTimer);curtainTimer=setTimeout(()=>root.classList.add('curtain-open'),100);
    tick(performance.now());
  }
  function closeScreen(advance=true){
    if(!opened)return;
    opened=false;dismissed=true;cancelAnimationFrame(raf);raf=0;audio.pause();
    root.classList.remove('is-open','is-playing','curtain-open','is-narrating','is-film');root.classList.add('is-dismissed');
    document.body.classList.remove('deicide-modal-open');exit.parentElement.hidden=true;replay.hidden=false;gate.hidden=true;
    restoreSiteSound();
    if(advance){document.getElementById('libel-02')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}
    (replay.isConnected?replay:lastFocus)?.focus({preventScroll:true});
  }
  function finish(){if(!opened)return;root.classList.add('is-finishing');setTimeout(()=>{root.classList.remove('is-finishing');if(opened)closeScreen(true);},1800);}
  function tick(now){
    raf=0;if(!opened||paused)return;
    if(mode==='film'){
      if(lastStamp)elapsed+=Math.min(0.12,(now-lastStamp)/1000);
      lastStamp=now;
    }else{elapsed=audio.currentTime;}
    const duration=mode==='film'?FILM_SECONDS:VOICE_SECONDS;
    const portion=clamp(elapsed/duration,0,1);
    const phase=portion*slides.length;
    const i=clamp(Math.floor(phase),0,slides.length-1);
    render(i);
    const inFrame=clamp(phase-i,0,1);
    const image=images[i];
    if(!reduced){
      const travel=(i%2===0?1:-1);
      image.style.setProperty('--shot-zoom',(1.005+.055*inFrame).toFixed(4));
      image.style.setProperty('--shot-x',(travel*inFrame*4).toFixed(2)+'px');
      image.style.setProperty('--shot-y',(-inFrame*3).toFixed(2)+'px');
      image.style.setProperty('--shot-angle',(travel*inFrame*.22).toFixed(3)+'deg');
      screen.style.setProperty('--screen-move',(1+.012*Math.sin(now/2000)).toFixed(5));
    }
    progress.style.transform='scaleX('+portion.toFixed(5)+')';time.textContent=fmt(elapsed)+' / '+fmt(duration);
    if(elapsed>=duration-.1){finish();return;}
    raf=requestAnimationFrame(tick);
  }
  async function hearNarration(){
    if(!opened)return;
    if(mode==='voice'){
      audio.muted=!audio.muted;
      voiceButton(audio.muted?'Unmute narration':'Mute narration');
      return;
    }
    if(!audio.src){
      voiceButton('Loading your narration…');
      try{await prepareVoice();}catch{return;}
    }
    // The immediately playable source is already assembled by preloading. This
    // call happens under the visitor's audio gesture, not after downloading files.
    audio.muted=false;audio.volume=1;
    try{
      audio.currentTime=0;
      await audio.play();
      mode='voice';elapsed=0;lastStamp=0;active=-1;
      root.classList.add('is-narrating');root.classList.remove('is-film');
      voiceButton('Mute narration');render(0);
      if(paused){paused=false;root.classList.remove('is-paused');play.textContent='Pause';}
      cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
    }catch(error){
      voiceButton('Tap again for narration');
      console.warn('Narration could not begin; film continues.',error);
    }
  }
  function togglePause(){
    if(!opened)return;paused=!paused;root.classList.toggle('is-paused',paused);
    play.textContent=paused?'Resume':'Pause';
    play.setAttribute('aria-label',paused?'Resume screening':'Pause screening');
    if(mode==='voice'){
      if(paused)audio.pause();else audio.play().catch(()=>{paused=true;root.classList.add('is-paused');});
    }
    lastStamp=0;
    if(!paused){cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}
    else{cancelAnimationFrame(raf);raf=0;}
  }
  function navigate(delta){
    if(!opened)return;
    const nextIndex=clamp(active+delta,0,13);
    const duration=mode==='film'?FILM_SECONDS:VOICE_SECONDS;
    elapsed=nextIndex*duration/14+.02;lastStamp=0;
    if(mode==='voice'){try{audio.currentTime=elapsed;}catch{}}
    render(nextIndex);if(!paused){cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}
  }
  sound.addEventListener('click',hearNarration);
  play.addEventListener('click',togglePause);
  previous.addEventListener('click',()=>navigate(-1));next.addEventListener('click',()=>navigate(1));
  exit.addEventListener('click',()=>closeScreen(true));
  root.querySelector('.deicide-exit a')?.addEventListener('click',e=>{e.preventDefault();closeScreen(true);});
  replay.addEventListener('click',()=>{dismissed=false;startFilm();});
  audio.addEventListener('ended',finish);
  document.addEventListener('keydown',event=>{
    if(!opened)return;
    if(event.key==='Escape'){event.preventDefault();closeScreen(true);}
    else if(event.key==='ArrowRight'){event.preventDefault();navigate(1);}
    else if(event.key==='ArrowLeft'){event.preventDefault();navigate(-1);}
    else if(event.code==='Space'&&!['BUTTON','A','INPUT'].includes(document.activeElement.tagName)){
      event.preventDefault();togglePause();
    }
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&opened&&!paused){togglePause();}
  });
  if('IntersectionObserver' in window){
    const showObserver=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)&&!opened&&!dismissed)startFilm();
    },{threshold:.22,rootMargin:'0px 0px -6% 0px'});
    showObserver.observe(root);
  }else{
    root.addEventListener('mouseenter',()=>{if(!opened&&!dismissed)startFilm();},{once:true});
  }
  root.classList.add('is-ready');replay.hidden=true;exit.parentElement.hidden=true;render(0);
})();
