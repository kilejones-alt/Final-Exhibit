(() => {
  'use strict';
  const install=(caption,name,date,credits)=>{
    if(!name||!date)return;
    [name,date].forEach(node=>{
      node.removeAttribute('data-museum-reveal');
      node.removeAttribute('data-global-arrival');
      node.classList.remove('museum-global-hover');
    });
    const details=document.createElement('details');
    details.className='object-provenance';
    const summary=document.createElement('summary');
    summary.className='object-caption-line';
    summary.setAttribute('aria-label',name.textContent+' · '+date.textContent+' — פרטי היצירה והמקור');
    name.classList.add('caption-name');date.classList.add('caption-date');
    const separator=document.createElement('span');separator.className='caption-separator';separator.textContent='·';separator.setAttribute('aria-hidden','true');
    summary.append(name,separator,date);
    const panel=document.createElement('div');
    panel.className='object-provenance-panel';
    credits.forEach(node=>panel.append(node));
    details.append(summary,panel);
    caption.replaceChildren(details);
  };
  document.querySelectorAll('.aj-page .aj-object figcaption').forEach(caption => {
    install(caption,caption.querySelector('.object-name'),caption.querySelector('.object-date'),[...caption.querySelectorAll('.object-detail')]);
  });
  document.querySelectorAll('article.artifact .artifact-copy').forEach(caption=>{
    install(caption,caption.querySelector('h2'),caption.querySelector('.date'),[...caption.querySelectorAll('.object-credit')]);
  });
  document.addEventListener('pointerdown', event => {
    document.querySelectorAll('.object-provenance[open]').forEach(details => {
      if (!details.contains(event.target)) details.open = false;
    });
  }, { passive: true });
})();
