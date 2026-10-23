'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio=document.getElementById('page-audio');
document.querySelectorAll('.audio-toggle').forEach(button=>button.addEventListener('click',async()=>{if(!audio)return;const label=button.querySelector('.audio-label');if(audio.paused){try{await audio.play();button.setAttribute('aria-pressed','true');if(label)label.textContent='Music on';}catch(error){button.setAttribute('aria-pressed','false');}}else{audio.pause();button.setAttribute('aria-pressed','false');if(label)label.textContent='Music';}}));
const chamber=document.querySelector('.chamber');
if(chamber&&!reduced){let frame;chamber.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=chamber.getBoundingClientRect();chamber.style.setProperty('--mx',`${e.clientX-r.left}px`);chamber.style.setProperty('--my',`${e.clientY-r.top}px`);});});}
if(!reduced)document.querySelectorAll('.door').forEach(door=>{door.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const art=door.querySelector('.door-art'),r=art.getBoundingClientRect();art.style.setProperty('--light-x',`${e.clientX-r.left}px`);art.style.setProperty('--light-y',`${e.clientY-r.top}px`);});});
const track=document.querySelector('.sequence-track');
if(track){const cards=[...track.querySelectorAll('.door')];const prev=document.querySelector('.previous'),next=document.querySelector('.next'),count=document.querySelector('.sequence-count');let current=0;function status(){const r=track.getBoundingClientRect();current=cards.reduce((best,c,i)=>Math.abs(c.getBoundingClientRect().left-r.left-10)<Math.abs(cards[best].getBoundingClientRect().left-r.left-10)?i:best,0);prev.disabled=current===0;next.disabled=current===cards.length-1;count.textContent=`${['I','II','III'][current]} / III`;}function move(d){const target=cards[Math.max(0,Math.min(cards.length-1,current+d))];track.scrollTo({left:target.offsetLeft-cards[0].offsetLeft,behavior:reduced?'instant':'smooth'});}prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));track.addEventListener('scroll',status,{passive:true});track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});addEventListener('resize',status);status();}
const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectTab(index,focus=false){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=i!==index;});if(focus)tabs[index].focus();}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(i));tab.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();selectTab(n,true);});});
const viewer=document.getElementById('viewer');let opener;
document.querySelectorAll('.art-open').forEach(button=>button.addEventListener('click',()=>{opener=button;const img=viewer.querySelector('img');img.src=button.dataset.image;img.alt=button.dataset.title;viewer.querySelector('p').textContent=button.dataset.title;viewer.showModal();document.body.style.overflow='hidden';}));
if(viewer){viewer.querySelector('.close').addEventListener('click',()=>viewer.close());viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});viewer.addEventListener('close',()=>{document.body.style.overflow='';if(opener)opener.focus();});}

/* Site-wide exhibition choreography: exact human-written copy, staged sentence by sentence. */
if(!reduced && 'IntersectionObserver' in window){
  document.documentElement.classList.add('motion-ready');
  const main=document.querySelector('main');
  if(main){
    const sentenceParagraphs=[...main.querySelectorAll('p:not(.date)')].filter(paragraph=>
      paragraph.childNodes.length===1&&paragraph.firstChild?.nodeType===Node.TEXT_NODE&&paragraph.textContent.trim().length>70
    );
    sentenceParagraphs.forEach(paragraph=>{
      const original=paragraph.textContent;
      let segments;
      try{segments=[...new Intl.Segmenter(document.documentElement.lang||'en',{granularity:'sentence'}).segment(original)].map(item=>item.segment);}
      catch(error){segments=[original];}
      if(segments.length<2)return;
      const fragment=document.createDocumentFragment();
      segments.forEach((sentence,index)=>{
        const span=document.createElement('span');
        span.className='sentence-land';
        span.style.setProperty('--sentence-delay',`${Math.min(index,3)*120}ms`);
        sentence.split(/(\s+)/u).forEach(part=>{
          if(!part)return;
          if(/^\s+$/u.test(part)){span.append(document.createTextNode(part));return;}
          const word=document.createElement('span');
          word.className='sentence-word';
          word.textContent=part;
          span.append(word);
        });
        fragment.append(span);
      });
      paragraph.replaceChildren(fragment);
    });

    const revealSelector='h1,h2,h3,p,li,.artifact,.door,.libels a,.home-era-details details,.button,figure,table,.sentence-land';
    const revealTargets=[...main.querySelectorAll(revealSelector)].filter(element=>
      !element.closest('dialog')&&!element.closest('.site-header')&&!(element.matches('p')&&element.querySelector('.sentence-land'))
    );
    revealTargets.forEach((element,index)=>{
      element.dataset.museumReveal='';
      element.style.setProperty('--museum-delay',`${(index%4)*85}ms`);
    });

    main.querySelectorAll('.artifact,.door,.libels a,.home-era-details details,.button,.era-framework,.framework-table').forEach(element=>element.classList.add('museum-lift'));
    main.querySelectorAll('.art-open,.door-art,figure').forEach(element=>{
      if(element.querySelector('img'))element.classList.add('museum-image-frame');
    });

    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-museum-visible');
        observer.unobserve(entry.target);
      });
    },{threshold:0,rootMargin:'0px 0px -6% 0px'});
    revealTargets.forEach(element=>observer.observe(element));

    main.querySelectorAll('svg').forEach(svg=>{
      if(svg.closest('.era-framework'))return;
      const lines=[...svg.querySelectorAll('path,line,polyline')];
      if(!lines.length)return;
      svg.classList.add('museum-drawable');
      lines.forEach((line,index)=>{
        let length=1;
        try{length=Number(line.getAttribute('pathLength'))||Math.max(1,line.getTotalLength());}catch(error){}
        line.dataset.drawLine='';
        line.style.setProperty('--line-length',`${length}`);
        line.style.setProperty('--draw-delay',`${index*180}ms`);
      });
      const drawObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-drawn');
        drawObserver.unobserve(entry.target);
      }),{threshold:.18,rootMargin:'0px 0px -8% 0px'});
      drawObserver.observe(svg);
    });
  }
}

const selectedHome=document.body.classList.contains('home-selected')?document.body:null;

/* Selected-home museum interactions: pointer depth, magnetic controls, and scroll-led staging. */
if(selectedHome&&!reduced){
  const clamp=value=>Math.max(0,Math.min(1,value));
  const segment=(value,start,end)=>clamp((value-start)/(end-start));

  selectedHome.querySelectorAll('.triptych .door').forEach(door=>{
    const art=door.querySelector('.door-art');
    if(!art)return;
    door.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch')return;
      const rect=door.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5;
      const y=(event.clientY-rect.top)/rect.height-.5;
      art.style.transform=`perspective(1000px) rotateX(${(-y*4.5).toFixed(2)}deg) rotateY(${(x*5.5).toFixed(2)}deg) translate3d(${(x*4).toFixed(2)}px,${(y*3).toFixed(2)}px,0)`;
    });
    door.addEventListener('pointerleave',()=>{art.style.transform='';});
  });

  selectedHome.querySelectorAll('h1,h2,h3,.home-message-actions .button').forEach(element=>{
    element.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch')return;
      const rect=element.getBoundingClientRect();
      const x=((event.clientX-rect.left)/rect.width-.5)*7;
      const y=((event.clientY-rect.top)/rect.height-.5)*5;
      element.style.translate=`${x.toFixed(2)}px ${y.toFixed(2)}px`;
    });
    element.addEventListener('pointerleave',()=>{element.style.translate='0 0';});
  });

  const hero=selectedHome.querySelector('.hero');
  const framework=selectedHome.querySelector('.era-framework');
  let museumFrame=0;
  function updateMuseumScene(){
    museumFrame=0;
    selectedHome.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach(element=>{
      if(element.getBoundingClientRect().top<window.innerHeight*.96)element.classList.add('is-revealed');
    });
    if(hero){
      const progress=clamp(window.scrollY/Math.max(1,hero.offsetHeight*.72));
      selectedHome.style.setProperty('--hero-exit',progress.toFixed(3));
    }
    if(!framework)return;
    /* Trigger once on entry, then let the deliberately slow CSS timeline play out. */
    if(framework.getBoundingClientRect().top<window.innerHeight*.78)framework.classList.add('is-revealed');
  }
  function requestMuseumUpdate(){if(!museumFrame)museumFrame=requestAnimationFrame(updateMuseumScene);}
  addEventListener('scroll',requestMuseumUpdate,{passive:true});
  addEventListener('resize',requestMuseumUpdate);
  updateMuseumScene();
}
