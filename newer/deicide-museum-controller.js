/* Three Eras / Deicide: automatic arrival into the existing slideshow.
 * The page darkens as the slideshow grows. Playback begins when the
 * entry transition settles. Audio remains user initiated under browser rules. */
(() => {
  'use strict';
  const section = document.getElementById('deicide-cinema');

    if (!section) return;
  const source = 'deicide-museum-film.html?edition=20261103-scroll-back-v2&embedded=1';
  const next = document.getElementById('libel-blood');
  const siteAudio = document.getElementById('page-audio');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arrivalMs = reducedMotion ? 0 : 1550;
  let overlay = null;
  let opened = false;
  let dismissed = false;
  let wasPlaying = false;
  let lastFocus = null;
  let entryTimer = null;
  // A direct chapter link can cross this sentinel during the browser's initial
  // smooth scroll. Only enter the slideshow when that is the chosen destination
  // or when the visitor deliberately scrolls through the gallery.
  let chapterJump = Boolean(location.hash && location.hash !== '#deicide-cinema' && location.hash !== '#libel-deicide');
  const beginReading = () => { chapterJump = false; };
  addEventListener('wheel',beginReading,{passive:true});
  addEventListener('touchstart',beginReading,{passive:true});
  addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(event.key))beginReading()});
  addEventListener('hashchange',()=>{chapterJump=Boolean(location.hash && location.hash !== '#deicide-cinema' && location.hash !== '#libel-deicide')});

  function start() {
    if (opened) return;
    opened = true;
    dismissed = true;
    lastFocus = document.activeElement;
    section.classList.add('is-approaching');

    if (siteAudio) {
      wasPlaying = !siteAudio.paused;
      siteAudio.pause();
    }

    const rect = section.getBoundingClientRect();
    const relativeY = rect.top + rect.height / 2 - innerHeight / 2;
    const startY = Math.max(-innerHeight * .28, Math.min(innerHeight * .28, relativeY));
    const startScale = Math.max(.50, Math.min(.70, Math.min(rect.width / innerWidth, rect.height / innerHeight) * .85));

    overlay = document.createElement('div');
    overlay.className = 'deicide-film-host';
    overlay.style.setProperty('--portal-start-scale', String(startScale));
    overlay.style.setProperty('--portal-start-y', startY.toFixed(1) + 'px');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'The evolution of the Deicide Libel: historical slideshow');

    const frame = document.createElement('iframe');
    frame.src = source;
    frame.title = 'The Deicide Libel — fourteen-card slideshow';
    frame.allow = 'autoplay';
    frame.setAttribute('referrerpolicy', 'same-origin');
    frame.setAttribute('loading', 'eager');
    overlay.appendChild(frame);
    let upDistance=0;
    overlay.addEventListener('wheel',event=>{
      if(event.ctrlKey||event.deltaY>=0){upDistance=0;return}
      event.preventDefault();upDistance-=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
      if(upDistance>45)close(false);
    },{passive:false});
    let touchY=null;
    overlay.addEventListener('touchstart',event=>{touchY=event.touches.length===1?event.touches[0].clientY:null},{passive:true});
    overlay.addEventListener('touchmove',event=>{
      if(touchY!==null&&event.touches.length===1&&event.touches[0].clientY-touchY>55){event.preventDefault();touchY=null;close(false)}
    },{passive:false});

    let frameReady = false, arrivalFinished = false;
    const playWhenReady = () => {
      if (!opened || !frameReady || !arrivalFinished || !frame.contentWindow) return;
      frame.contentWindow.postMessage({ type: 'deicide-film-start' }, window.location.origin);
    };

    frame.addEventListener('load', () => {
      frameReady = true;
      playWhenReady();
    }, { once: true });

    document.body.appendChild(overlay);
    document.body.classList.add('deicide-film-host-open');

    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (opened && overlay) overlay.classList.add('is-opening');
    }));

    entryTimer = setTimeout(() => {
      arrivalFinished = true;
      playWhenReady();
    }, arrivalMs);

    frame.focus();
  }

  function close(advance = true) {
    if (!opened) return;
    opened = false;
    clearTimeout(entryTimer);
    entryTimer = null;
    overlay?.remove();
    overlay = null;
    document.body.classList.remove('deicide-film-host-open');

    if (wasPlaying && siteAudio) siteAudio.play().catch(() => {});
    wasPlaying = false;
    if (advance && next) next.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth', block: 'start'
    });
    if(!advance){
      const top=window.scrollY+section.getBoundingClientRect().top-window.innerHeight-32;
      window.scrollTo({top:Math.max(0,top),behavior:'instant'});
    }
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }

  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin ||
        event.source !== overlay?.querySelector('iframe')?.contentWindow) return;
    if(event.data?.type==='deicide-film-scroll-back'){close(false);return}
    if (event.data?.type === 'deicide-film-exit' ||
        event.data?.type === 'deicide-film-finished') close(true);
  });

  document.addEventListener('keydown', event => {
    if(opened&&['ArrowUp','PageUp'].includes(event.key)){event.preventDefault();close(false);return}
    if (opened && event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
  });

  if ('IntersectionObserver' in window) {
    const approachObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) section.classList.add('is-approaching');
      }
    }, { threshold: .08 });
    approachObserver.observe(section);

    const entranceObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        if (!dismissed && !opened && !chapterJump) start();
      } else if (!opened) {
        dismissed = false;
      }
    }, { threshold: .36 });
    entranceObserver.observe(section);
  }
})();
