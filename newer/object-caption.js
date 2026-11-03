(() => {
  'use strict';
  const install=(caption,name,date,credits)=>{
    if(!name||!date)return;
    const details=document.createElement('details');
    details.className='object-provenance';
    const summary=document.createElement('summary');
    summary.className='object-caption-line';
    summary.setAttribute('aria-label',name.textContent+' · '+date.textContent+' — artwork details and source');
    summary.append(name,document.createTextNode(' · '),date);
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
