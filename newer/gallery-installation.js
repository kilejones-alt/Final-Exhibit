(() => {
  'use strict';
  const main=document.querySelector('main');
  if(!main||!document.body.classList.contains('gallery-polished'))return;
  main.querySelectorAll('.src-stage b').forEach(label=>{
    const original=label.textContent,match=original.match(/^(\d{2})([\s\S]*)$/);if(!match)return;
    const number=document.createElement('span');number.className='stage-number';number.textContent=match[1];
    const kind=document.createElement('span');kind.className='stage-kind';kind.textContent=match[2];
    label.replaceChildren(number,kind);
  });
  main.querySelectorAll('.libels a').forEach((link,i)=>link.dataset.installationIndex=String(i+1).padStart(2,'0'));
  main.querySelectorAll('.source-narrative>p').forEach(p=>{if(p.textContent.trim().startsWith('“'))p.classList.add('installation-quotation')});
  // Lighting follows reading position; reduced-motion users get the static composition.
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&'IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)entry.target.classList.toggle('is-installation-focus',entry.isIntersecting);
    },{rootMargin:'-22% 0px -25% 0px',threshold:.45});
    main.querySelectorAll('.src-stage').forEach(stage=>observer.observe(stage));
  }
})();
