(() => {
  'use strict';
  const main=document.querySelector('main');
  if(!main)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const graph=()=>{
    const el=document.createElement('div');
    el.className='museum-reading-graph';
    el.setAttribute('aria-hidden','true');
    ['I · Antijudaism','II · Antisemitism','III · Antizionism'].forEach(label=>{
      const step=document.createElement('span');step.textContent=document.body.classList.contains('aj-source-page')?'':label;el.append(step);
    });
    return el;
  };
  let count=0;
  const sequence=[...main.querySelectorAll('p,figure,table,svg,.deicide-museum-passage,.era-framework,.libels,.aj-cycle-grid,.src-cycle')];
  for(const el of sequence){
    if(el.tagName!=='P'){count=0;continue}
    if(el.closest('figure,figcaption,.artifact-copy,.aj-credits,.support,.src-cycle')||el.matches('.date,.object-credit'))continue;
    if(!el.textContent.trim())continue;
    if(count===3){el.before(graph());count=0}
    count++;
  }
  const objects=[...main.querySelectorAll('.aj-object,article.artifact .art-open')];
  if(!reduced&&'IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        entry.target.classList.add('is-gallery-arrived');
        observer.unobserve(entry.target);
      }
    },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    objects.forEach(el=>{el.classList.add('museum-color-object');observer.observe(el)});
    main.querySelectorAll('.museum-reading-graph').forEach(el=>observer.observe(el));
  }else main.querySelectorAll('.museum-reading-graph').forEach(el=>el.classList.add('is-gallery-arrived'));
})();
