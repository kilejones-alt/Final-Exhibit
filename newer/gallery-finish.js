(() => {
  'use strict';
  const main=document.querySelector('main');
  if(!main)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const objects=[...main.querySelectorAll('.aj-object,article.artifact .art-open')];
  if(!reduced&&'IntersectionObserver'in window){
    const timers=new WeakMap(),seen=new WeakSet();
    const reveal=el=>{
      clearTimeout(timers.get(el));
      el.classList.remove('is-gallery-arrived');
      el.classList.add('is-color-reset');
      timers.set(el,setTimeout(()=>{
        el.classList.remove('is-color-reset');
        el.classList.add('is-gallery-arrived');
      },450));
    };
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting){
          clearTimeout(timers.get(entry.target));seen.delete(entry.target);
          entry.target.classList.remove('is-gallery-arrived');entry.target.classList.add('is-color-reset');
        }else if(entry.intersectionRatio>=.45&&!seen.has(entry.target)){
          seen.add(entry.target);reveal(entry.target);
        }
      }
    },{threshold:[0,.45],rootMargin:'0px 0px -5% 0px'});
    objects.forEach(el=>{
      el.classList.add('museum-color-object');observer.observe(el);
    });
    const graphs=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-gallery-arrived');graphs.unobserve(entry.target)}}));
    main.querySelectorAll('.src-stage').forEach(el=>graphs.observe(el));
  }
})();
