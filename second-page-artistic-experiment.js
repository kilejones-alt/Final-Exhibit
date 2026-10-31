'use strict';
(() => {
  const body=document.body;
  if(!body.classList.contains('home-selected'))return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const doors=[...document.querySelectorAll('.triptych .door[data-era]')];
  const framework=document.querySelector('.era-framework');
  const eras=framework?[...framework.querySelectorAll('.framework-era[data-era]')]:[];
  const overview=document.querySelector('.home-overview');
  const intro=document.querySelector('.home-message');
  const hero=document.querySelector('.hero');

  if(!reduced){
    // Independent image travel inside the existing door frame.
    doors.forEach(door=>{
      const img=door.querySelector('.door-art img');
      if(!img)return;
      door.addEventListener('pointermove',event=>{
        if(event.pointerType==='touch')return;
        const rect=door.getBoundingClientRect();
        const x=(event.clientX-rect.left)/rect.width-.5;
        const y=(event.clientY-rect.top)/rect.height-.5;
        img.style.setProperty('--door-img-x',`${(x*5.5).toFixed(2)}px`);
        img.style.setProperty('--door-img-y',`${(y*4).toFixed(2)}px`);
      });
      door.addEventListener('pointerleave',()=>{
        img.style.setProperty('--door-img-x','0px');
        img.style.setProperty('--door-img-y','0px');
      });
    });

    let scrollFrame=0;
    const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
    const updateFlow=()=>{
      scrollFrame=0;
      if(hero){
        const rect=hero.getBoundingClientRect();
        const p=clamp((-rect.top)/(Math.max(1,rect.height)*.82));
        body.style.setProperty('--hero-exit',p.toFixed(3));
      }
      if(intro){
        const rect=intro.getBoundingClientRect();
        const p=clamp((-rect.top+innerHeight*.08)/(Math.max(1,rect.height)*.88));
        body.style.setProperty('--intro-flow',p.toFixed(3));
      }
      if(overview){
        const rect=overview.getBoundingClientRect();
        const p=clamp((innerHeight*.92-rect.top)/(innerHeight*.62));
        body.style.setProperty('--overview-enter',p.toFixed(3));
      }
    };
    const requestFlow=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateFlow)};
    addEventListener('scroll',requestFlow,{passive:true});
    addEventListener('resize',requestFlow);
    updateFlow();
  }

  // Pointer-proximity response for the semantic branches.
  if(finePointer && framework && eras.length){
    framework.addEventListener('pointermove',event=>{
      const rect=framework.getBoundingClientRect();
      const candidates=eras.map(era=>{
        const r=era.getBoundingClientRect();
        const cx=r.left+r.width/2;
        const cy=r.top+r.height*.38;
        return {era,r,cx,cy,d:Math.hypot(event.clientX-cx,event.clientY-cy)};
      });
      const closest=candidates.sort((a,b)=>a.d-b.d)[0];
      eras.forEach(era=>{
        era.classList.remove('is-era-near');
        era.style.setProperty('--era-pull-x','0px');
        era.style.setProperty('--era-pull-y','0px');
      });
      if(!closest || closest.d>230)return;
      const strength=1-closest.d/230;
      const dx=(event.clientX-closest.cx)*.022*strength;
      const dy=(event.clientY-closest.cy)*.018*strength;
      closest.era.classList.add('is-era-near');
      closest.era.style.setProperty('--era-pull-x',`${Math.max(-4,Math.min(4,dx)).toFixed(2)}px`);
      closest.era.style.setProperty('--era-pull-y',`${Math.max(-3,Math.min(3,dy)).toFixed(2)}px`);
    });
    framework.addEventListener('pointerleave',()=>{
      eras.forEach(era=>{
        era.classList.remove('is-era-near');
        era.style.setProperty('--era-pull-x','0px');
        era.style.setProperty('--era-pull-y','0px');
      });
    });
  }

  // Door-to-framework visual handoff. Real links are untouched.
  if(!reduced && finePointer && doors.length===3 && eras.length===3 && framework){
    const layer=document.createElement('div');
    layer.className='era-transition-layer';
    layer.setAttribute('aria-hidden','true');
    document.body.append(layer);

    const ghosts=doors.map((door,index)=>{
      const ghost=document.createElement('div');
      ghost.className='era-transition-ghost';
      ghost.dataset.era=String(index);
      const img=door.querySelector('img')?.cloneNode(true);
      if(img){img.removeAttribute('fetchpriority');ghost.append(img)}
      layer.append(ghost);

      const thread=document.createElement('div');
      thread.className='era-transition-thread';
      thread.dataset.era=String(index);
      layer.append(thread);
      return {ghost,thread};
    });

    let played=false;
    const playBridge=()=>{
      if(played)return;
      const fRect=framework.getBoundingClientRect();
      if(fRect.top>innerHeight*.76 || fRect.bottom<innerHeight*.18)return;
      played=true;

      ghosts.forEach(({ghost,thread},index)=>{
        const target=eras[index].getBoundingClientRect();
        const startX=(index+.5)*(innerWidth/3);
        const startY=Math.max(110,Math.min(targetY-210,innerHeight*.38));
        const targetX=target.left+target.width/2;
        const targetY=target.top+Math.min(44,target.height*.18);

        const startW=Math.max(82,Math.min(122,innerWidth*.082));
        ghost.style.left=`${startX-startW/2}px`;
        ghost.style.top=`${startY}px`;
        ghost.style.setProperty('--ghost-w',`${startW}px`);

        const dx=targetX-startX;
        const dy=targetY-startY;
        const delay=index*130;
        ghost.animate([
          {opacity:0,transform:'translate3d(0,-14px,0) scale(.88)',filter:'blur(1px)'},
          {opacity:.58,offset:.14,transform:'translate3d(0,0,0) scale(1)',filter:'blur(0)'},
          {opacity:.34,offset:.66,transform:`translate3d(${(dx*.72).toFixed(1)}px,${(dy*.72).toFixed(1)}px,0) scale(.48)`,filter:'blur(.2px)'},
          {opacity:0,transform:`translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0) scale(.035,1.25)`,filter:'blur(.8px)'}
        ],{duration:1450,delay,easing:'cubic-bezier(.16,.72,.2,1)',fill:'forwards'});

        const threadTop=startY+startW*1.15;
        const tx=targetX-startX;
        const ty=Math.max(30,targetY-threadTop);
        const angle=Math.atan2(tx,ty)*180/Math.PI;
        thread.style.left=`${startX}px`;
        thread.style.top=`${threadTop}px`;
        thread.animate([
          {opacity:0,height:'0px',transform:`rotate(${angle.toFixed(2)}deg)`},
          {opacity:.42,height:`${Math.hypot(tx,ty)*.44}px`,offset:.48,transform:`rotate(${angle.toFixed(2)}deg)`},
          {opacity:.74,height:`${Math.hypot(tx,ty)}px`,offset:.78,transform:`rotate(${angle.toFixed(2)}deg)`},
          {opacity:0,height:`${Math.hypot(tx,ty)}px`,transform:`rotate(${angle.toFixed(2)}deg)`}
        ],{duration:1500,delay:delay+80,easing:'cubic-bezier(.18,.66,.24,1)',fill:'forwards'});
      });
    };

    const observer=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting))playBridge();
    },{threshold:.12,rootMargin:'0px 0px -10% 0px'});
    observer.observe(framework);
  }
})();
