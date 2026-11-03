/* Three Eras: shared, source-preserving gallery timeline for every populated
   exhibit page and for the three-language entrance installations.
   No historical prose is generated or modified here. */
(() => {
  'use strict';
  const body = document.body;
  if (!body || body.dataset.pageState === 'blank' || body.classList.contains('deicide-film') || body.classList.contains('official-entrance')) return;
  const root = document.documentElement;
  const lang = (root.lang || 'en').slice(0, 2).toLowerCase();
  const locale = ['he','ru'].includes(lang) ? lang : 'en';
  const strings = {
    en: { heading: 'The Three Eras of Jew-Hatred', eras: ['Antijudaism', 'Antisemitism', 'Antizionism'] },
    he: { heading: 'שלוש תקופות של שנאת יהודים', eras: ['אנטי־יהדות', 'אנטישמיות', 'אנטי־ציונות'] },
    ru: { heading: 'Три эпохи ненависти к евреям', eras: ['Антииудаизм', 'Антисемитизм', 'Антисионизм'] }
  };
  const text = strings[locale];
  // Links refer to existing room sections/artifacts. The preview uses type so
  // artwork is encountered only at its place in the exhibition.
  const artworks = [
    [0,'antijudaism.html'],
    [0,'antijudaism.html#aj-title'],
    [0,'antijudaism.html#aj-art-manesse'],
    [0,'antijudaism.html#aj-art-host'],
    [0,'antijudaism.html#deicide-cinema'],
    [0,'antijudaism.html#libel-blood'],
    [0,'antijudaism.html#libel-well'],
    [1,'antisemitism.html'],
    [1,'antisemitism.html#museum-object-01'],
    [1,'antisemitism.html#museum-object-02'],
    [1,'antisemitism.html#museum-object-03'],
    [1,'antisemitism.html#museum-object-04'],
    [1,'antisemitism.html#museum-object-05'],
    [2,'exhibition.html'],
    [2,'colonialism.html#museum-object-01'],
    [2,'colonialism.html#museum-object-02'],
    [2,'colonialism.html#museum-object-03'],
    [2,'colonialism.html#museum-object-04'],
    [2,'colonialism.html#museum-object-05'],
    [2,'colonialism.html#museum-object-06'],
    [2,'apartheid.html#museum-object-01']
  ];
  // Existing object images are loaded only when a visitor approaches a dot.
  // Chapter/film points have no duplicate artwork preview.
  const previewArt = [
    'assets/antijudaism-1.jpg', null, 'assets/antijudaism-2.jpg',
    'assets/antijudaism-4.jpg', null, 'assets/antijudaism-5.jpg',
    'assets/antijudaism-3.jpg', null,
    'assets/antisemitism-1.jpg', 'assets/antisemitism-2.jpg',
    'assets/antisemitism-3.jpg', 'assets/antisemitism-4.jpg',
    'assets/antisemitism-5.jpg',
    'assets/naya-nelyubin-un-1978.webp',
    'assets/naya-sayegh-1965.webp', 'assets/naya-rodinson-1967.webp',
    'assets/naya-ivanov-beware-zionism-1969.webp',
    'assets/naya-sychov-moscow-1972.webp',
    'assets/naya-expansionists-krokodil-1973.webp',
    'assets/naya-cherepanov-israeli-plan-1979.webp',
    'assets/naya-efimovsky-zionism-racism-1976.webp'
  ];
  const chapters = ['I','II','III'];
  const main = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const selectedEntrance = body.classList.contains('official-entrance');
  if (!main || (!header && !selectedEntrance)) return;
  if (document.getElementById('museum-gallery-rail')) return;

  const rail = document.createElement('nav');
  rail.id = 'museum-gallery-rail';
  rail.className = 'museum-gallery-rail';
  rail.setAttribute('aria-label', text.heading);
  // One strip of navigable dots. Era names remain accessible through link labels.
  const viewport = document.createElement('div');
  viewport.className = 'museum-rail-viewport';
  viewport.setAttribute('tabindex','0');
  const strip = document.createElement('div');
  strip.className = 'museum-rail-strip';
  const counts = [0,0,0];
  const anchors = [];
  for (const [era,href] of artworks) {
    counts[era]++;
    const a = document.createElement('a');
    a.className = 'museum-rail-image';
    a.href = href;
    a.dataset.era = String(era);
    a.dataset.ordinal = String(counts[era]);
    a.title = chapters[era] + ' · ' + text.eras[era] + ' · ' + String(counts[era]).padStart(2,'0');
    a.setAttribute('aria-label',a.title);
    const point = document.createElement('span');
    point.className = 'museum-rail-dot';
    point.setAttribute('aria-hidden','true');
    a.append(point);
    if (counts[era] === 1) a.classList.add('is-era-start');
    strip.append(a);
    anchors.push(a);
  }
  viewport.append(strip);
  rail.append(viewport);
  if (header) header.insertAdjacentElement('afterend',rail);
  else (document.querySelector('.skip') || body.firstElementChild)?.insertAdjacentElement('afterend',rail);
  body.classList.add('museum-gallery-enabled');

  // Match the pinned timeline to the actual bottom edge of the responsive
  // music/language header. ResizeObserver handles multi-row mobile headers.
  if (header) {
    const syncHeaderHeight = () =>
      root.style.setProperty('--museum-header-h', Math.ceil(header.getBoundingClientRect().height) + 'px');
    syncHeaderHeight();
    if ('ResizeObserver' in window) new ResizeObserver(syncHeaderHeight).observe(header);
    else addEventListener('resize', syncHeaderHeight, { passive: true });
  }

  // Fixed timeline CSS is authoritative. No scroll-dependent pinning,
  // layout spacers or frame loops: faster, and stable on mobile Safari.

  // Highlight the current archival object without a separate category menu.
  const filename=location.pathname.split('/').pop()||'index.html';
  const era=filename==='antijudaism.html'?0:filename==='antisemitism.html'?1:
    ['exhibition.html','colonialism.html','apartheid.html','genocide.html'].includes(filename)?2:null;
  if(era!==null){
    const hash=decodeURIComponent(location.hash||'');
    const index=anchors.findIndex(a=>a.dataset.era===String(era)&&
      new URL(a.href,document.baseURI).pathname.endsWith('/'+filename)&&
      (hash?new URL(a.href,document.baseURI).hash===hash:!new URL(a.href,document.baseURI).hash));
    const selected=index>=0?index:anchors.findIndex(a=>a.dataset.era===String(era));
    if(selected>=0){
      anchors[selected].setAttribute('aria-current','location');
      requestAnimationFrame(()=>{viewport.scrollLeft=Math.max(0,anchors[selected].offsetLeft-viewport.offsetLeft-95)});
    }
  }

  // A dot is the only persistent mark. Its chapter label appears on interaction.
  // On a touchscreen, swiping to a dot reveals it; the first tap previews,
  // and a second tap follows the original exhibition link.
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const preview = document.createElement('div');
  preview.className = 'museum-rail-preview';
  preview.setAttribute('aria-hidden','true');
  const previewImage = document.createElement('img');
  previewImage.className = 'museum-rail-preview-art';
  previewImage.alt = '';
  previewImage.decoding = 'async';
  preview.append(previewImage);
  const previewTitle = document.createElement('span');
  previewTitle.className = 'museum-rail-preview-title';
  preview.append(previewTitle);
  body.append(preview);
  let chosen = null, hideTimer = 0, scrollFrame = 0;
  let userScrolledTimeline = false;
  let touchSelected = false;
  const closePreview = () => {
    clearTimeout(hideTimer);
    chosen?.classList.remove('is-revealed');
    chosen = null;touchSelected=false;
    preview.classList.remove('is-open');
    preview.setAttribute('aria-hidden','true');
    rail.classList.remove('is-thread-active');
  };
  const reveal = (link, fromTouch=false) => {
    if (innerWidth <= 700 && !fromTouch) return;
    if(!link)return;
    clearTimeout(hideTimer);
    if(chosen && chosen !== link)chosen.classList.remove('is-revealed');
    const changed = chosen !== link;
    chosen=link;touchSelected=fromTouch;
    const art = previewArt[anchors.indexOf(link)];
    preview.classList.toggle('has-art', Boolean(art));
    if (art && previewImage.getAttribute('src') !== art) previewImage.src = art;
    previewImage.alt = art ? link.title : '';
    link.classList.add('is-revealed');
    rail.classList.add('is-thread-active');
    const rect=link.getBoundingClientRect();
    const vw=art ? Math.min(finePointer?520:350,innerWidth*(finePointer?.62:.86)) : Math.min(finePointer?275:225,innerWidth-28);
    const vh=art ? Math.min(430,innerHeight*.54) : Math.min(finePointer?284:245,Math.max(165,innerHeight*.34));
    preview.style.width=vw+'px';
    preview.style.height=vh+'px';
    const left=Math.max(12,Math.min(innerWidth-vw-12,rect.left+rect.width/2-vw/2));
    preview.style.left=left+'px';
    let top=rect.bottom+10;
    if(top+vh>innerHeight-16)top=rect.top-vh-10;
    top=Math.max(12,top);
    preview.style.top=top+'px';
    // The chapter label emerges from its dot.
    preview.style.setProperty('--dot-origin-x',(rect.left+rect.width/2-left).toFixed(1)+'px');
    preview.style.setProperty('--dot-origin-y',(rect.top+rect.height/2-top).toFixed(1)+'px');
    if(changed){
      previewTitle.textContent=link.title;
      preview.classList.remove('is-open');
      void preview.offsetWidth;
    }
    preview.classList.add('is-open');
    preview.setAttribute('aria-hidden','false');
  };
  if(finePointer){
    anchors.forEach(link=>{
      link.addEventListener('pointerenter',()=>reveal(link));
      link.addEventListener('pointerleave',()=>{
        hideTimer=setTimeout(()=>{if(!preview.matches(':hover'))closePreview()},120);
      });
      link.addEventListener('focusin',()=>reveal(link));
      link.addEventListener('focusout',()=>{hideTimer=setTimeout(closePreview,150)});
    });
    preview.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
    preview.addEventListener('pointerleave',closePreview);
    // The expanded label remains a route to its original room.
    preview.addEventListener('click',()=>{if(chosen)location.href=chosen.href});
  }else{
    // On tap, preview first and navigate on the second tap.
    anchors.forEach(link=>{
      // Keyboard and assistive-technology activation must navigate on the first
      // attempt. The deliberate two-tap preview applies to touch only.
      link.addEventListener('click',event=>{
        if(event.detail===0 || event.pointerType==='mouse') return;
        if(innerWidth <= 700 && !previewArt[anchors.indexOf(link)]) return;
        if(chosen!==link || !touchSelected){
          event.preventDefault();
          reveal(link,true);
        }
      });
      link.addEventListener('focusin',()=>reveal(link,false));
      link.addEventListener('focusout',()=>{hideTimer=setTimeout(closePreview,150)});
    });
    preview.addEventListener('click',()=>{if(chosen)location.href=chosen.href});
    // Programmatic scrolling to the current chapter must not reveal art.
    // Only deliberate touching, wheeling or keyboard navigation enables it.
    viewport.addEventListener('pointerdown',()=>{userScrolledTimeline=true},{passive:true});
    viewport.addEventListener('wheel',()=>{userScrolledTimeline=true},{passive:true});
    viewport.addEventListener('keydown',()=>{userScrolledTimeline=true});
    viewport.addEventListener('scroll',()=>{
      if(!userScrolledTimeline)return;
      if(scrollFrame)cancelAnimationFrame(scrollFrame);
      scrollFrame=requestAnimationFrame(()=>{
        scrollFrame=0;
        if(!userScrolledTimeline)return;
        const bounds=viewport.getBoundingClientRect(),middle=(bounds.left+bounds.right)/2;
        let closest=null,distance=Infinity;
        anchors.forEach(link=>{
          const r=link.getBoundingClientRect();
          if(r.right<bounds.left || r.left>bounds.right)return;
          const d=Math.abs((r.left+r.right)/2-middle);
          if(d<distance){distance=d;closest=link}
        });
        if(closest)reveal(closest,true);
      });
    },{passive:true});
  }
  addEventListener('scroll',()=>{
    if(!viewport.matches(':hover')&&!preview.matches(':hover'))closePreview();
  },{passive:true,capture:false});
  addEventListener('keydown',event=>{if(event.key==='Escape')closePreview()});
  document.addEventListener('pointerdown',event=>{
    if(!preview.contains(event.target) && !viewport.contains(event.target))closePreview();
  },{passive:true});

  // The gallery's dots respond quietly before the pointer reaches them.
  // The only large image remains the single user-selected archival preview.
  if (finePointer && !reduced) {
    let proximityFrame = 0, px = 0, py = 0;
    const clearProximity = () => {
      if (proximityFrame) cancelAnimationFrame(proximityFrame);
      proximityFrame = 0;
      anchors.forEach(link => {
        link.style.removeProperty('--museum-proximity-scale');
        link.style.removeProperty('--thread-shift-x');
      });
    };
    const paintProximity = () => {
      proximityFrame = 0;
      for (const link of anchors) {
        const r = link.getBoundingClientRect();
        const dx = px-(r.left+r.right)/2;
        const distance = Math.hypot(dx,py-(r.top+r.bottom)/2);
        const fraction = Math.max(0,1-distance/96);
        // Two quiet gestures: a subtle magnetic drift and a physical point of focus.
        const shift = Math.sign(dx)*2.6*fraction*fraction;
        link.style.setProperty('--thread-shift-x',shift.toFixed(2)+'px');
        link.style.setProperty('--museum-proximity-scale',(1+.68*fraction*fraction).toFixed(3));
      }
    };
    viewport.addEventListener('pointermove', event => {
      px = event.clientX; py = event.clientY;
      if (!proximityFrame) proximityFrame = requestAnimationFrame(paintProximity);
    }, {passive:true});
    viewport.addEventListener('pointerleave', clearProximity, {passive:true});
  }

  // Shared gallery choreography: leave every existing word and source image alone.
  const base = main;
  if (base && !selectedEntrance) {
    const hoverLabels = base.querySelectorAll('h1,h2,h3,h4,figcaption,.door-label,.artifact-copy,.aj-fact,.aj-faq summary,.home-era-details summary,.section-marker,.date,.button,.text-link,.room-nav a,.aj-next-actions a');
    hoverLabels.forEach(el=>el.classList.add('museum-global-hover'));
    const frames = base.querySelectorAll('figure,.art-open,.door-art,.archive,.aj-object');
    frames.forEach(el=>{
      if (el.querySelector('img') && !el.classList.contains('museum-global-artframe')) {
        el.classList.add('museum-global-artframe');
        const imgs=el.querySelectorAll('img');
        imgs.forEach(img=>{
          img.decoding='async';
          if (!img.hasAttribute('loading') && !img.hasAttribute('fetchpriority')) img.loading='lazy';
        });
      }
    });

    // On pages that do not already use exhibit.js's observer, gracefully
    // reveal headings and artwork when they enter the viewport.
    if (!document.documentElement.classList.contains('motion-ready') && !reduced && 'IntersectionObserver' in window) {
      const targets=[...base.querySelectorAll('h1,h2,h3,h4,figure,article,.aj-fact')].filter(el=>!el.closest('.deicide-museum-passage'));
      targets.forEach((el,i)=>{el.dataset.globalArrival='';el.style.setProperty('--museum-reveal-delay',(i%3)*95+'ms');});
      document.documentElement.classList.add('museum-global-motion');
      const arrival = new IntersectionObserver(entries=>{
        for(const e of entries){if(e.isIntersecting){e.target.classList.add('is-arrived');arrival.unobserve(e.target);}}
      },{threshold:0,rootMargin:'0px 0px -6% 0px'});
      targets.forEach(el=>arrival.observe(el));
    }

  // Make human-written libel subtitles link to their existing room sections.
  if (base && !selectedEntrance) {
    base.querySelectorAll('.aj-libel-head h3').forEach(heading => {
      if (heading.querySelector('a')) return;
      const section = heading.closest('.aj-libel');
      if (!section?.id) return;
      const link = document.createElement('a');
      link.className = 'museum-libel-heading-link';
      link.href = '#' + section.id;
      link.setAttribute('aria-label',heading.textContent);
      while (heading.firstChild) link.append(heading.firstChild);
      heading.append(link);
    });
    // Touch screens have no hover. Begin the same 5.5 second, subtle camera push
    // as each original artwork frame enters the viewport.
    if (!reduced && 'IntersectionObserver' in window &&
        matchMedia('(hover:none), (pointer:coarse)').matches) {
      const frames = [...base.querySelectorAll('.museum-global-artframe')]
        .filter(el => !el.closest('.deicide-museum-passage,.cinema,.museum-gallery-rail'));
      const touchObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('museum-mobile-arrived');
          touchObserver.unobserve(entry.target);
        }
      }, {threshold:0,rootMargin:'0px 0px -18% 0px'});
      frames.forEach(el=>touchObserver.observe(el));
    }
  }
  }
})();


/* 2026-11-03 localised arrow illuminations, no changes to historical wording. */
(() => {
 'use strict';
 const frame=document.querySelector('.home-selected .era-framework');
 if(!frame||frame.classList.contains('chromatic-framework')||frame.classList.contains('museum-three-flow'))return;
 frame.classList.add('museum-three-flow');
 const ns='http://www.w3.org/2000/svg', branches=frame.querySelector('.framework-branches');
 if(branches){
  const tip=branches.querySelector('polyline');
  [...branches.querySelectorAll(':scope > path')].slice(0,3).forEach(line=>{
   const p=document.createElementNS(ns,'path');
   p.setAttribute('class','museum-current-stroke');
   p.setAttribute('d',line.getAttribute('d'));
   p.setAttribute('pathLength','100');
   p.setAttribute('aria-hidden','true');
   branches.insertBefore(p,tip);
  });
 }
 frame.querySelectorAll('.framework-era svg').forEach(svg=>{
  const line=svg.querySelector('path:not(.museum-current-stroke)');
  if(!line)return;
  const p=document.createElementNS(ns,'path');
  p.setAttribute('class','museum-current-stroke');
  p.setAttribute('d',line.getAttribute('d'));
  p.setAttribute('pathLength','100');
  p.setAttribute('aria-hidden','true');
  svg.insertBefore(p,svg.querySelector('polyline'));
 });
})();

