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
    en: { heading: 'The Three Eras of Jew-Hatred', eras: ['Antijudaism', 'Antisemitism', 'Antizionism'], libels: ['Colonialism', 'Apartheid and Racism Libels', 'Genocide'] },
    he: { heading: 'שלוש תקופות של שנאת יהודים', eras: ['אנטי־יהדות', 'אנטישמיות', 'אנטי־ציונות'], libels: ['קולוניאליזם', 'עלילות האפרטהייד והגזענות', 'רצח עם'] },
    ru: { heading: 'Три эпохи ненависти к евреям', eras: ['Антииудаизм', 'Антисемитизм', 'Антисионизм'], libels: ['Колониализм', 'Обвинения в апартеиде и расизме', 'Геноцид'] }
  };
  const text = strings[locale];
  // Each stop opens the top of one public gallery page.
  const overview = locale === 'en' ? 'entrance.html' : locale + '/entrance.html';
  const roomPrefix = locale === 'en' ? '' : locale + '/';
  const pages = [
    [overview, text.heading, null],
    [roomPrefix+'antijudaism.html', text.eras[0], 'assets/antijudaism-1.jpg'],
    [roomPrefix+'antisemitism.html', text.eras[1], 'assets/antisemitism-1.jpg'],
    [roomPrefix+'exhibition.html', text.eras[2], 'assets/naya-nelyubin-un-1978.webp'],
    [roomPrefix+'colonialism.html', text.libels[0], 'assets/naya-sayegh-1965.webp'],
    [roomPrefix+'apartheid.html', text.libels[1], 'assets/naya-efimovsky-zionism-racism-1976.webp'],
    [roomPrefix+'genocide.html', text.libels[2], null]
  ];
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
  const anchors = [];
  const artworkByLink = new Map();
  for (const [href, label, artwork] of pages) {
    const a = document.createElement('a');
    a.className = 'museum-rail-image';
    a.href = href;
    a.title = label;
    a.setAttribute('aria-label', label);
    artworkByLink.set(a, artwork);
    const point = document.createElement('span');
    point.className = 'museum-rail-dot';
    point.setAttribute('aria-hidden','true');
    a.append(point);
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

  // Keep the active stop tied to the page, including incoming chapter links.
  const activePage = anchors.find(link => new URL(link.href).pathname === location.pathname);
  activePage?.setAttribute('aria-current','page');

  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  // Keep the native dot targets above the growing artwork and span the header.
  const navigationStyle = document.createElement('style');
  navigationStyle.textContent = `/* Keep timeline navigation independent of artwork previews. */
body.museum-gallery-enabled #museum-gallery-rail{
  padding-inline:0!important;
}
body.museum-gallery-enabled #museum-gallery-rail .museum-rail-strip{
  box-sizing:border-box!important;
  width:100%!important;min-width:0!important;
  padding-inline:max(8px,env(safe-area-inset-left)) max(8px,env(safe-area-inset-right))!important;
  justify-content:space-between!important;gap:0!important;
}
body.museum-gallery-enabled #museum-gallery-rail .museum-rail-strip::before{
  left:0!important;right:0!important;
}
body.museum-gallery-enabled a.museum-rail-preview{
  text-decoration:none!important;
  z-index:964!important;
}
body.museum-gallery-enabled a.museum-rail-preview.has-art{
  box-sizing:border-box!important;
  grid-template: minmax(0,1fr) / minmax(0,1fr);
  gap:0;
  padding:0!important;
  border-radius:50%!important;
  overflow:hidden!important;
  box-shadow:none!important;
}
body.museum-gallery-enabled a.museum-rail-preview.has-art .museum-rail-preview-art{
  width:100%!important;height:100%!important;
  object-fit:cover!important;
}
body.museum-gallery-enabled #museum-gallery-rail .museum-rail-image.is-revealed .museum-rail-dot{
  opacity:.9!important;
}
@media (pointer:coarse){
  body.museum-gallery-enabled .museum-gallery-rail .museum-rail-image{
    width:clamp(36px,11vw,44px)!important;
    min-width:clamp(36px,11vw,44px)!important;
    flex:0 0 clamp(36px,11vw,44px)!important;
  }
  body.museum-gallery-enabled .museum-rail-preview{
    pointer-events:none!important;
  }
}`;
  document.head.append(navigationStyle);
  const preview = document.createElement('a');
  // A preview has its own native destination, independent of transient hover state.
  preview.tabIndex = -1;
  preview.className = 'museum-rail-preview';
  preview.setAttribute('aria-hidden','true');
  const previewImage = document.createElement('img');
  previewImage.className = 'museum-rail-preview-art';
  previewImage.alt = '';
  previewImage.decoding = 'async';
  preview.append(previewImage);
  body.append(preview);
  let chosen = null, hideTimer = 0;
  const closePreview = () => {
    clearTimeout(hideTimer);
    chosen?.classList.remove('is-revealed');
    chosen = null;
    preview.classList.remove('is-open');
    preview.setAttribute('aria-hidden','true');
    rail.classList.remove('is-thread-active');
  };
  const reveal = link => {
    if(!link)return;
    const art = artworkByLink.get(link);
    // Text-only stops remain ordinary links; do not create empty-looking cards.
    if (!art) { closePreview(); return; }
    clearTimeout(hideTimer);
    if(chosen && chosen !== link)chosen.classList.remove('is-revealed');
    const changed = chosen !== link;
    chosen=link;
    preview.href = link.href;
    preview.setAttribute('aria-label', link.title);
    preview.classList.add('has-art');
    if (previewImage.getAttribute('src') !== art) previewImage.src = art;
    link.classList.add('is-revealed');
    rail.classList.add('is-thread-active');
    const rect=link.getBoundingClientRect();
    const visual=window.visualViewport;
    const screenWidth=Math.min(innerWidth,visual?.width || innerWidth);
    const screenHeight=Math.min(innerHeight,visual?.height || innerHeight);
    const originX=visual?.offsetLeft || 0;
    const originY=visual?.offsetTop || 0;
    const edge=12;
    const diameter=Math.max(1,Math.min(168,screenWidth*.28,screenHeight*.31,screenWidth-edge*2,screenHeight-edge*2));
    preview.style.width=diameter+'px';
    preview.style.height=diameter+'px';
    const left=Math.max(originX+edge,Math.min(originX+screenWidth-diameter-edge,rect.left+rect.width/2-diameter/2));
    preview.style.left=left+'px';
    let top=rect.bottom+6;
    if(top+diameter>originY+screenHeight-edge)top=rect.top-diameter-6;
    top=Math.max(originY+edge,Math.min(top,originY+screenHeight-diameter-edge));
    preview.style.top=top+'px';
    // Retain the existing expansion from its dot, with no timing change.
    preview.style.setProperty('--dot-origin-x',(rect.left+rect.width/2-left).toFixed(1)+'px');
    preview.style.setProperty('--dot-origin-y',(rect.top+rect.height/2-top).toFixed(1)+'px');
    if(changed){
      preview.classList.remove('is-open');
      void preview.offsetWidth;
    }
    preview.classList.add('is-open');
    preview.setAttribute('aria-hidden','false');
  };
  anchors.forEach(link => {
    link.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') reveal(link);
    });
    link.addEventListener('pointerleave', () => {
      hideTimer = setTimeout(() => {
        if (!preview.matches(':hover')) closePreview();
      }, 160);
    });
    link.addEventListener('focusin', () => {
      // Touch focus must not place a growing overlay between touch-down and click.
      if (link.matches(':focus-visible')) reveal(link);
    });
    link.addEventListener('focusout', () => { hideTimer = setTimeout(closePreview, 160); });
    link.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') closePreview();
    }, { passive: true });
    link.addEventListener('pointercancel', closePreview);
  });
  preview.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  preview.addEventListener('pointerleave', closePreview);
  // Native links preserve first-tap navigation, keyboard use and modified clicks.
  // Re-selecting the current page returns to its start instead of seeming inert.
  const returnToPageStart = event => {
    if(event.defaultPrevented || event.button!==0 || event.metaKey ||
       event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination=new URL(event.currentTarget.href,document.baseURI);
    if(destination.origin!==location.origin || destination.pathname!==location.pathname ||
       destination.search!==location.search || destination.hash) return;
    event.preventDefault();
    closePreview();
    window.scrollTo({top:0,left:0,behavior:reduced?'instant':'smooth'});
  };
  anchors.forEach(link=>link.addEventListener('click',returnToPageStart));
  preview.addEventListener('click',returnToPageStart);
  addEventListener('scroll',()=>{
    if(!viewport.matches(':hover')&&!preview.matches(':hover'))closePreview();
  },{passive:true,capture:false});
  addEventListener('keydown',event=>{if(event.key==='Escape')closePreview()});
  // Dismiss stale coordinates on rotation, browser resizing, or pinch zoom.
  addEventListener('resize',closePreview,{passive:true});
  window.visualViewport?.addEventListener('resize',closePreview,{passive:true});
  window.visualViewport?.addEventListener('scroll',closePreview,{passive:true});
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
