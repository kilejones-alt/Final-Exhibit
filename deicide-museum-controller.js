/* Three Eras / Deicide: cinematic arrival into the existing historical film.
 * The archival film begins immediately while the page darkens and the image
 * gently enlarges over five seconds. The film is silent and has no music UI. */
(() => {
  'use strict';
  const section = document.getElementById('deicide-cinema');
  if (!section) return;
  const source = 'deicide-museum-film.html?edition=20261102-silent-cinema-v4&embedded=1';
  const next = document.getElementById('libel-02');
  const siteAudio = document.getElementById('page-audio');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let overlay = null;
  let opened = false;
  let dismissed = false;
  let closing = false;
  let wasPlaying = false;
  let lastFocus = null;

  function start() {
    if (opened || closing) return;
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
    const startY = Math.max(-innerHeight * .035, Math.min(innerHeight * .035, relativeY * .15));
    const startScale = reducedMotion ? 1 : .92;

    overlay = document.createElement('div');
    overlay.className = 'deicide-film-host';
    overlay.style.setProperty('--portal-start-scale', String(startScale));
    overlay.style.setProperty('--portal-start-y', startY.toFixed(1) + 'px');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'The evolution of the Deicide Libel: historical film');

    const frame = document.createElement('iframe');
    frame.src = source;
    frame.title = 'The Deicide Libel — museum film in fourteen movements';
    frame.allow = 'autoplay';
    frame.setAttribute('referrerpolicy', 'same-origin');
    frame.setAttribute('loading', 'eager');
    overlay.appendChild(frame);

    document.body.appendChild(overlay);
    document.body.classList.add('deicide-film-host-open');

    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (opened && overlay) overlay.classList.add('is-opening');
    }));

    frame.focus();
  }

  function close(advance = true) {
    if (!opened || closing) return;
    opened = false;
    closing = true;
    overlay?.classList.add('is-closing');
    const previousFocus = lastFocus;
    // The room fades away before returning the visitor to the exhibition.
    setTimeout(() => {
      overlay?.remove();
      overlay = null;
      closing = false;
      document.body.classList.remove('deicide-film-host-open');
      if (wasPlaying && siteAudio) siteAudio.play().catch(() => {});
      wasPlaying = false;
      if (advance && next) next.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth', block: 'start'
      });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 1100);
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

  section.querySelector('#deicide-film-watch')?.addEventListener('click', start);

  if ('IntersectionObserver' in window) {
    const approachObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) section.classList.add('is-approaching');
      }
    }, { threshold: .08 });
    approachObserver.observe(section);

    const entranceObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !dismissed && !opened) start();
    }, { threshold: .36 });
    entranceObserver.observe(section);
  }
})();
