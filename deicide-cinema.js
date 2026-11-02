/* The Third Era: 14 original Deicide slides, cinematic scroll-projection. */
(() => {
 "use strict";
 const section=document.querySelector("#deicide-cinema");
 if(!section)return;
 const frames=[...section.querySelectorAll(".deicide-frame")];
 const slides=[["The Evolution of the Deicide Libel","Introduction"],["The Crucifixion","c. 30 CE"],["Destruction of the Second Temple","70 CE"],["The Gospel Accounts","c. 85 CE"],["Ignatius of Antioch","c. 110 CE"],["Hadrian and the Bar Kokhba Revolt","135 CE"],["Justin Martyr","c. 150 CE"],["Melito of Sardis","c. 165 CE"],["Origen","c. 240 CE"],["Constantine and the Council of Nicaea","325 CE"],["Theodosius I","380 CE"],["John Chrysostom","c. 387 CE"],["From Dispute to Doctrine","440 CE"],["Credits","Final frame"]];
 const currentEl=section.querySelector("#deicide-current");
 const titleEl=section.querySelector("#deicide-scene-title");
 const dateEl=section.querySelector("#deicide-scene-date");
 const progressEl=section.querySelector("#deicide-progress-indicator");
 const back=section.querySelector("#deicide-prev");
 const forward=section.querySelector("#deicide-next");
 const sound=section.querySelector("#deicide-sound");
 const screen=section.querySelector("#deicide-screen");
 const reduced=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const audio=document.querySelector("#page-audio");
 let activeIndex=-1,raf=0,audioStartedHere=false,fadeFrame=0,stageVisible=false;
 function fadeAudio(target,done){
   if(!audio)return;
   cancelAnimationFrame(fadeFrame);
   const start=audio.volume,begin=performance.now(),duration=1100;
   const tick=now=>{
     const t=clamp((now-begin)/duration,0,1);
     audio.volume=start+(target-start)*(t*t*(3-2*t));
     if(t<1)fadeFrame=requestAnimationFrame(tick);
     else {fadeFrame=0;if(done)done();}
   };
   fadeFrame=requestAnimationFrame(tick);
 }
 function setScene(index){
   index=clamp(index,0,frames.length-1);
   if(index===activeIndex)return;
   if(activeIndex>=0){frames[activeIndex].classList.remove("is-active");frames[activeIndex].setAttribute("aria-hidden","true");}
   activeIndex=index;frames[index].classList.add("is-active");frames[index].setAttribute("aria-hidden","false");
   currentEl.textContent=String(index+1).padStart(2,"0");
   titleEl.textContent=slides[index][0];dateEl.textContent=slides[index][1];
   progressEl.style.transform="scaleX("+((index+1)/frames.length).toFixed(5)+")";
   back.disabled=index===0;forward.disabled=index===frames.length-1;
 }
 function navigate(index){
   const top=window.scrollY+section.getBoundingClientRect().top;
   const distance=Math.max(1,section.offsetHeight-window.innerHeight);
   window.scrollTo({top:top+distance*clamp((index+.25)/frames.length,0,1),behavior:reduced?"instant":"smooth"});
 }
 back.addEventListener("click",()=>navigate(activeIndex-1));
 forward.addEventListener("click",()=>navigate(activeIndex+1));
 section.addEventListener("keydown",event=>{
   if(event.target.tagName==="BUTTON"&&(event.key==="ArrowRight"||event.key==="ArrowLeft")){
     event.preventDefault();navigate(activeIndex+(event.key==="ArrowRight"?1:-1));
   }
 });
 async function toggleSound(){
   if(!audio)return;
   if(audioStartedHere&&!audio.paused){
     sound.setAttribute("aria-pressed","false");sound.querySelector("span").textContent="Enable score";
     fadeAudio(0,()=>{audio.pause();audioStartedHere=false;audio.volume=.5;});
     return;
   }
   try{
     audio.volume=0;
     await audio.play();audioStartedHere=true;
     sound.setAttribute("aria-pressed","true");sound.querySelector("span").textContent="Sound on";
     fadeAudio(.48);
   }catch{
     audioStartedHere=false;sound.setAttribute("aria-pressed","false");
     sound.querySelector("span").textContent="Sound unavailable";
   }
 }
 sound.addEventListener("click",toggleSound);
 if(!audio){sound.disabled=true;sound.querySelector("span").textContent="No audio available";}
 function update(){
   raf=0;
   const rect=section.getBoundingClientRect(),vh=window.innerHeight;
   const inView=rect.bottom>0&&rect.top<vh;
   if(inView!==stageVisible){
     stageVisible=inView;
     section.classList.toggle("is-in-view",inView);
     document.body.classList.toggle("deicide-screening",inView);
     if(!inView&&audioStartedHere&&audio&&!audio.paused){
       sound.setAttribute("aria-pressed","false");sound.querySelector("span").textContent="Enable score";
       fadeAudio(0,()=>{audio.pause();audioStartedHere=false;audio.volume=.5;});
     }
   }
   if(!inView)return;
   const distance=Math.max(1,rect.height-vh);
   const p=clamp(-rect.top/distance,0,1);
   const sceneProgress=p*frames.length;
   setScene(Math.min(frames.length-1,Math.floor(sceneProgress)));
   const within=clamp(sceneProgress-Math.floor(sceneProgress),0,1);
   if(!reduced){
     const portal=0.78+0.22*clamp(p*frames.length*1.3,0,1);
     screen.style.setProperty("--deicide-portal-scale",portal.toFixed(4));
     screen.style.setProperty("--deicide-camera-scale",(1.018+.048*within).toFixed(4));
     const turn=activeIndex%2===0?1:-1;
     screen.style.setProperty("--deicide-camera-x",(turn*within*1.4).toFixed(2)+"px");
     screen.style.setProperty("--deicide-camera-y",(-within*2).toFixed(2)+"px");
   }else{
     screen.style.setProperty("--deicide-portal-scale","1");
   }
 }
 const request=()=>{if(!raf)raf=requestAnimationFrame(update);};
 section.classList.add("is-ready");
 setScene(0);
 addEventListener("scroll",request,{passive:true});
 addEventListener("resize",request,{passive:true});
 document.addEventListener("visibilitychange",()=>{
   if(document.hidden&&audioStartedHere&&audio&&!audio.paused)audio.pause();
 });
 update();
})();
