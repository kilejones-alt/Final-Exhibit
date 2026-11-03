(() => {
  'use strict';
  const main=document.querySelector('main');
  if(!main||!document.body.classList.contains('gallery-polished'))return;
  // Group existing objects in chronological order. No extra copies or new prose.
  const wall=(ids,triptych=false)=>{
    const objects=ids.map(id=>document.getElementById(id));if(objects.some(x=>!x))return;
    const section=document.createElement('section');section.className='installation-wall'+(triptych?' is-triptych':'');
    objects[0].before(section);objects.forEach(object=>section.append(object));
  };
  const page=location.pathname.split('/').pop();
  if(page==='antisemitism.html')wall(['museum-object-03','museum-object-04']);
  if(page==='colonialism.html')wall(['museum-object-04','museum-object-05','museum-object-06'],true);
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
