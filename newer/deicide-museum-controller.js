/* Three Eras / Deicide: automatic arrival into the existing slideshow.
 * The page darkens as the slideshow grows. Playback begins when the
 * entry transition settles. Audio remains user initiated under browser rules. */
(() => {
  'use strict';
  const section = document.getElementById('deicide-cinema');
  if (!section) return;
  const source = 'deicide-museum-film.html?edition=20261102-original-cards-v1&embedded=1';
  const next = document.getElementById('libel-blood');
  const siteAudio = document.getElementById('page-audio');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arrivalMs = reducedMotion ? 0 : 3900;
  let overlay = null;
  let opened = false;
  let dismissed = false;
  let wasPlaying = false;
  let lastFocus = null;
  let entryTimer = null;

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
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }

  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin ||
        event.source !== overlay?.querySelector('iframe')?.contentWindow) return;
    if (event.data?.type === 'deicide-film-exit' ||
        event.data?.type === 'deicide-film-finished') close(true);
  });

  document.addEventListener('keydown', event => {
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
        if (!dismissed && !opened) start();
      } else if (!opened) {
        dismissed = false;
      }
    }, { threshold: .36 });
    entranceObserver.observe(section);
  }
})();
