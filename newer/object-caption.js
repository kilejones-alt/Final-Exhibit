(() => {
  'use strict';
  document.querySelectorAll('.aj-page .aj-object figcaption').forEach(caption => {
    const credits = [...caption.querySelectorAll('.object-detail')];
    if (!credits.length) return;
    const details = document.createElement('details');
    details.className = 'object-provenance';
    const summary = document.createElement('summary');
    summary.textContent = 'ⓘ';
    summary.setAttribute('aria-label', 'Artwork details and source');
    summary.title = 'Artwork details and source';
    const panel = document.createElement('div');
    panel.className = 'object-provenance-panel';
    credits.forEach(node => panel.append(node));
    details.append(summary, panel);
    caption.append(details);
  });
  document.addEventListener('pointerdown', event => {
    document.querySelectorAll('.object-provenance[open]').forEach(details => {
      if (!details.contains(event.target)) details.open = false;
    });
  }, { passive: true });
})();
