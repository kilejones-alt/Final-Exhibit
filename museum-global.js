/* Three Eras: shared, source-preserving gallery timeline for every populated
   exhibit page and for the three-language entrance installations.
   No historical prose is generated or modified here. */
(() => {
  'use strict';
  const body = document.body;
  if (!body || body.dataset.pageState === 'blank' || body.classList.contains('deicide-film')) return;
  const root = document.documentElement;
  const lang = (root.lang || 'en').slice(0, 2).toLowerCase();
  const locale = ['he','ru'].includes(lang) ? lang : 'en';
  const strings = {
    en: { heading: 'The Three Eras of Jew-Hatred', eras: ['Antijudaism', 'Antisemitism', 'Antizionism'] },
    he: { heading: 'שלוש תקופות של שנאת יהודים', eras: ['אנטי־יהדות', 'אנטישמיות', 'אנטי־ציונות'] },
    ru: { heading: 'Три эпохи ненависти к евреям', eras: ['Антииудаизм', 'Антисемитизм', 'Антисионизм'] }
  };
  const text = strings[locale];
  // Gallery objects already present in the exhibition; links refer to existing
  // room sections/artifacts. The label displays only the era and a number.
  const artworks = [
    [0,'antijudaism.html','assets/door-antijudaism-kile.jpg'],
    [0,'antijudaism.html#aj-title','assets/antijudaism-1.jpg'],
    [0,'antijudaism.html#three-libels','assets/antijudaism-2.jpg'],
    [0,'antijudaism.html#libel-deicide','assets/antijudaism-3.jpg'],
    [0,'antijudaism.html#libel-blood','assets/antijudaism-4.jpg'],
    [0,'antijudaism.html#libel-well','assets/antijudaism-5.jpg'],
    [0,'antijudaism.html#deicide-cinema','assets/deicide-cinema/scene_01.webp'],
    [1,'antisemitism.html','assets/door-antisemitism-naya.jpg'],
    [1,'antisemitism.html#museum-object-01','assets/antisemitism-1.jpg'],
    [1,'antisemitism.html#museum-object-02','assets/antisemitism-2.jpg'],
    [1,'antisemitism.html#museum-object-03','assets/antisemitism-3.jpg'],
    [1,'antisemitism.html#museum-object-04','assets/antisemitism-4.jpg'],
    [1,'antisemitism.html#museum-object-05','assets/antisemitism-5.jpg'],
    [2,'exhibition.html','assets/door-antizionism-naya-source.jpg'],
    [2,'colonialism.html#museum-object-01','assets/naya-sayegh-1965.webp'],
    [2,'colonialism.html#museum-object-02','assets/naya-rodinson-1967.webp'],
    [2,'colonialism.html#museum-object-03','assets/naya-ivanov-beware-zionism-1969.webp'],
    [2,'colonialism.html#museum-object-04','assets/naya-sychov-moscow-1972.webp'],
    [2,'colonialism.html#museum-object-05','assets/naya-expansionists-krokodil-1973.webp'],
    [2,'colonialism.html#museum-object-06','assets/naya-cherepanov-israeli-plan-1979.webp'],
    [2,'apartheid.html#museum-object-01','assets/naya-efimovsky-zionism-racism-1976.webp']
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
  const heading = document.createElement('a');
  heading.className = 'museum-rail-heading';
  heading.href = locale === 'en' ? 'entrance.html' : locale + '/entrance.html';
  heading.textContent = text.heading;
  rail.append(heading);

  const tabs = document.createElement('div');
  tabs.className = 'museum-rail-tabs';
  tabs.setAttribute('role','group');
  tabs.setAttribute('aria-label', text.heading);
  ['antijudaism.html','antisemitism.html','exhibition.html'].forEach((href, era) => {
    const tab = document.createElement('a');
    tab.href = href;
    tab.className = 'museum-rail-tab';
    tab.dataset.era = String(era);
    const numeral = document.createElement('span');
    numeral.className = 'museum-rail-roman';
    numeral.textContent = chapters[era];
    const label = document.createElement('span');
    label.className = 'museum-rail-era-name';
    label.textContent = text.eras[era];
    tab.setAttribute('aria-label', chapters[era] + ' · ' + text.eras[era]);
    tab.append(numeral,label);
    tabs.append(tab);
  });
  rail.append(tabs);

  const viewport = document.createElement('div');
  viewport.className = 'museum-rail-viewport';
  viewport.setAttribute('tabindex','0');
  const strip = document.createElement('div');
  strip.className = 'museum-rail-strip';
  const counts = [0,0,0];
  const anchors = [];
  const thumbImages = [];
  for (const [index, [era,href,src]] of artworks.entries()) {
    counts[era]++;
    const a = document.createElement('a');
    a.className = 'museum-rail-image';
    a.href = href;
    a.dataset.era = String(era);
    a.dataset.picture = src;
    a.dataset.ordinal = String(counts[era]);
    a.title = chapters[era] + ' · ' + text.eras[era] + ' · ' + String(counts[era]).padStart(2,'0');
    a.setAttribute('aria-label',a.title);
    const photo = document.createElement('img');
    photo.decoding = 'async';
    photo.loading = 'lazy';
    photo.alt = '';
    photo.width = 64;
    photo.height = 64;
    photo.dataset.src = src;
    a.append(photo);
    const stamp = document.createElement('span');
    stamp.className = 'museum-rail-stamp';
    stamp.textContent = chapters[era] + '·' + String(counts[era]).padStart(2,'0');
    stamp.setAttribute('aria-hidden','true');
    a.append(stamp);
    if (counts[era] === 1) a.classList.add('is-era-start');
    strip.append(a);
    anchors.push(a);
    thumbImages.push(photo);
  }
  viewport.append(strip);
  rail.append(viewport);
  const indicator = document.createElement('div');
  indicator.className = 'museum-rail-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  rail.append(indicator);
  if (header) header.insertAdjacentElement('afterend',rail);
  else (document.querySelector('.skip') || body.firstElementChild)?.insertAdjacentElement('afterend',rail);
  body.classList.add('museum-gallery-enabled');

  // Some exhibition layouts have ancestor overflow rules that disable
  // CSS position:sticky on iOS. Pin by switching to fixed and reserve the
  // original rail height so the reading layout never jumps.
  if (header && !selectedEntrance) {
    const spacer = document.createElement('div');
    spacer.className = 'museum-gallery-spacer';
    spacer.setAttribute('aria-hidden','true');
    rail.insertAdjacentElement('afterend',spacer);
    let pinFrame = 0;
    const pin = () => {
      pinFrame = 0;
      const shouldPin = window.scrollY > Math.max(0,header.offsetHeight-1);
      if (shouldPin) {
        const height = Math.ceil(rail.getBoundingClientRect().height);
        spacer.style.height = height + 'px';
        rail.classList.add('is-pinned');
      } else {
        rail.classList.remove('is-pinned');
        spacer.style.height = '0px';
      }
    };
    const requestPin = () => {
      if (!pinFrame) pinFrame = requestAnimationFrame(pin);
    };
    window.addEventListener('scroll',requestPin,{passive:true});
    window.addEventListener('resize',requestPin,{passive:true});
    pin();
    requestAnimationFrame(pin);
  }

  const scrollImage = (img) => {
    if (!img || img.src || !img.dataset.src) return;
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        scrollImage(entry.target);
        observer.unobserve(entry.target);
      }
    }, {root: viewport, rootMargin:'0px 300px', threshold:0});
    thumbImages.forEach(img => observer.observe(img));
  } else thumbImages.forEach(scrollImage);

  // "Current room" is reflected in the chapter tabs and the miniature art.
  const filename = location.pathname.split('/').pop() || 'index.html';
  let activeEra = null;
  if (filename === 'antijudaism.html') activeEra = 0;
  if (filename === 'antisemitism.html') activeEra = 1;
  if (['exhibition.html','colonialism.html','apartheid.html','genocide.html'].includes(filename)) activeEra = 2;
  if (activeEra !== null) {
    tabs.querySelectorAll('.museum-rail-tab')[activeEra]?.setAttribute('aria-current','page');
    const hash = decodeURIComponent(location.hash || '');
    const itemIndex = anchors.findIndex(a => a.dataset.era === String(activeEra) &&
      new URL(a.href,document.baseURI).pathname.endsWith('/'+filename) &&
      (hash ? new URL(a.href,document.baseURI).hash === hash : !new URL(a.href,document.baseURI).hash));
    const index = itemIndex < 0 ? anchors.findIndex(a => a.dataset.era === String(activeEra)) : itemIndex;
    if (index >= 0) {
      anchors[index].setAttribute('aria-current','location');
      requestAnimationFrame(() => {
        viewport.scrollLeft = Math.max(0, anchors[index].offsetLeft - viewport.offsetLeft - 95);
      });
    }
    indicator.style.setProperty('--museum-current-era',String(activeEra));
  }

  // One shared zooming preview, loaded only when hover/focus requests it.
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (finePointer) {
    const preview = document.createElement('div');
    preview.className = 'museum-rail-preview';
    preview.setAttribute('aria-hidden','true');
    const full = document.createElement('img');
    full.alt = '';
    full.decoding = 'async';
    const line = document.createElement('span');
    line.className = 'museum-rail-preview-title';
    preview.append(full,line);
    body.append(preview);
    let dismiss;
    const show = link => {
      clearTimeout(dismiss);
      const r = link.getBoundingClientRect();
      full.src = link.dataset.picture;
      line.textContent = link.title;
      const maxWidth = Math.min(250,innerWidth-30);
      preview.style.width = maxWidth + 'px';
      preview.style.left = Math.max(12,Math.min(innerWidth-maxWidth-12,r.left + r.width/2-maxWidth/2))+'px';
      preview.style.top = Math.min(innerHeight-290,r.bottom+11)+'px';
      preview.classList.add('is-open');
    };
    const hide = () => {dismiss=setTimeout(()=>preview.classList.remove('is-open'),80);};
    anchors.forEach(a => {
      a.addEventListener('pointerenter',()=>show(a));
      a.addEventListener('pointerleave',hide);
      a.addEventListener('focusin',()=>show(a));
      a.addEventListener('focusout',hide);
    });
    addEventListener('scroll',()=>preview.classList.remove('is-open'),{passive:true,capture:true});
    if (!reduced) {
      tabs.querySelectorAll('.museum-rail-tab').forEach(tab => {
        tab.addEventListener('pointermove',event => {
          const r = tab.getBoundingClientRect();
          tab.style.setProperty('--museum-mx',Math.max(-4,Math.min(4,(event.clientX-r.left-r.width/2)*.07)).toFixed(2)+'px');
          tab.style.setProperty('--museum-my',Math.max(-3,Math.min(3,(event.clientY-r.top-r.height/2)*.1)).toFixed(2)+'px');
        },{passive:true});
        tab.addEventListener('pointerleave',()=>{
          tab.style.removeProperty('--museum-mx');
          tab.style.removeProperty('--museum-my');
        });
      });
    }
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
