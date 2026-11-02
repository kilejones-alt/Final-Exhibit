/* Three Eras: Deicide · a self-running archival film. No third-party SDK or autoplay sound. */
(() => {
  'use strict';
  const section = document.getElementById('deicide-cinema');
  if (!section) return;
  const source = 'deicide-museum-film.html?edition=20261102-v6';
  const next = document.getElementById('libel-02');
  const siteAudio = document.getElementById('page-audio');
  let overlay = null, opened = false, dismissed = false, wasPlaying = false, lastFocus = null;

  function start() {
    if (opened) return;
    opened = true;
    dismissed = true;
    lastFocus = document.activeElement;
    if (siteAudio) { wasPlaying = !siteAudio.paused; siteAudio.pause(); }
    overlay = document.createElement('div');
    overlay.className = 'deicide-film-host';
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
    frame.focus();
  }

  function close(advance = true) {
    if (!opened) return;
    opened = false;
    overlay?.remove();
    overlay = null;
    document.body.classList.remove('deicide-film-host-open');
    if (wasPlaying && siteAudio) siteAudio.play().catch(() => {});
    wasPlaying = false;
    if (advance && next) next.scrollIntoView({behavior: 'smooth', block: 'start'});
    if (lastFocus?.isConnected) lastFocus.focus({preventScroll: true});
  }
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin || event.source !== overlay?.querySelector('iframe')?.contentWindow) return;
    if (event.data?.type === 'deicide-film-exit' || event.data?.type === 'deicide-film-finished') close(true);
  });
  document.addEventListener('keydown', event => {
    if (opened && event.key === 'Escape') { event.preventDefault(); close(true); }
  });
  section.querySelector('#deicide-film-watch')?.addEventListener('click', () => start());
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !dismissed && !opened) start();
    }, {threshold: .36});
    observer.observe(section);
  }
})();
