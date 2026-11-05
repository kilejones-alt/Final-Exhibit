(() => {
const table = document.querySelector('#recurring-pattern .geo-table');
let litCell, lightTimer;
table?.addEventListener('click', event => {
  if (event.pointerType !== 'touch' && !matchMedia('(hover:none)').matches) return;
  const cell = event.target.closest('th,td');
  if (!cell || !table.contains(cell)) return;
  clearTimeout(lightTimer);
  litCell?.classList.remove('is-tap-lit');
  litCell = cell;
  cell.classList.add('is-tap-lit');
  lightTimer = setTimeout(() => cell.classList.remove('is-tap-lit'), 800);
});
document.querySelectorAll('#historical-entrances .geo-door-cta,#understanding .geo-era-cta,#explore .geo-explore-links a,#sources .geo-sources-link,#support .actions .button').forEach(label => {
  const door = label.closest('a');
  label.addEventListener('click', event => {
    const isTouch = event.pointerType === 'touch' ||
      (!event.pointerType && event.detail > 0 && matchMedia('(hover:none)').matches);
    if (!isTouch || event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey ||
        matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    event.preventDefault();
    if (label.classList.contains('is-drawing')) return;
    label.classList.add('is-drawing');
    setTimeout(() => {
      label.classList.remove('is-drawing');
      location.assign(door.href);
    }, 1450);
  });
});
})();

(() => {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const referencesHeading = document.querySelector('#sources h2');
  if (referencesHeading) {
    const colorOnView = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) referencesHeading.classList.remove('references-in-view');
      else if (entry.intersectionRatio >= .45) referencesHeading.classList.add('references-in-view');
    }, { threshold:[0,.45] });
    colorOnView.observe(referencesHeading);
  }
  const text = document.querySelectorAll('main.geo-editorial :is(h1,h2,h3,h4,p,.door-label,.geo-door-type,.geo-door-claim,.geo-door-caption,.geo-door-cta,.geo-table tr,.geo-era-cta,.geo-explore-links a,.geo-support .button,.geo-sources-link)');
  const reveal = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      reveal.unobserve(target);
      target.dataset.readingReveal = 'visible';
      setTimeout(() => delete target.dataset.readingReveal, 900);
    }
  }, { rootMargin:'0px 0px -7% 0px', threshold:.06 });
  for (const element of text) {
    if (element.closest('.era-framework')) continue;
    element.dataset.readingReveal = 'pending';
    reveal.observe(element);
  }
})();
