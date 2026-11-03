/* Minimal, invisible navigation only. The original 24-image film, music,
   timing, typography, and entrance pill remain exactly as authored. */
(() => {
  'use strict';
  const enter = document.querySelector('a.entry-pill[href]');
  if (!enter || !document.querySelector('.cinema')) return;

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    // Existing language, music, skip, and Enter controls keep their own actions.
    if (target.closest('.entrance-controls, a, button, input, select, textarea, [role="button"], [contenteditable]')) return;
    // Don't navigate when someone is selecting text.
    if (window.getSelection()?.toString().trim()) return;
    enter.click();
  });
})();
