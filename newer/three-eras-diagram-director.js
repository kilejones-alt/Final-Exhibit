/* Three Eras: a single figure direction for English, Russian and Hebrew.
   Existing texts, image assets, links, and SVG geometry are preserved. */
(() => {
  'use strict';
  const framework = document.querySelector('.home-selected .era-framework');
  if (!framework || framework.classList.contains('diagram-directed')) return;
  const branchSVG = framework.querySelector('.framework-branches');
  const eraSVGs = [...framework.querySelectorAll('.framework-era svg')].slice(0,3);
  if (!branchSVG || eraSVGs.length !== 3) return;
  const branchPaths = [...branchSVG.querySelectorAll(':scope > path:not(.chromatic-flow):not(.museum-current-stroke)')].slice(0,3);
  if (branchPaths.length !== 3) return;
  const ns = 'http://www.w3.org/2000/svg';
  const appendTrace = (path, host) => {
    const light = document.createElementNS(ns,'path');
    light.setAttribute('class','diagram-light-trace');
    light.setAttribute('d',path.getAttribute('d'));
    light.setAttribute('pathLength','100');
    light.setAttribute('aria-hidden','true');
    host.insertBefore(light,host.querySelector('polyline'));
  };
  branchPaths.forEach(path => {
    path.classList.add('framework-base-branch');
    appendTrace(path,branchSVG);
  });
  branchSVG.querySelectorAll(':scope > polyline').forEach(tip => tip.classList.add('diagram-branch-tip'));
  eraSVGs.forEach(svg => {
    const path = svg.querySelector('path:not(.chromatic-flow-down):not(.museum-current-stroke)');
    if (!path) return;
    path.classList.add('framework-base-lower');
    appendTrace(path,svg);
    svg.querySelectorAll('polyline').forEach(tip => tip.classList.add('diagram-lower-tip'));
  });
  framework.classList.add('diagram-directed');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) {
    framework.classList.add('diagram-entered');
    return;
  }
  framework.classList.add('diagram-motion-ready');
  const observer = new IntersectionObserver(entries => {
    const entry = entries[0];
    if (!entry) return;
    framework.classList.toggle('diagram-in-viewport',entry.isIntersecting);
    if (entry.isIntersecting) {
      framework.classList.add('diagram-entered');
      framework.classList.add('is-revealed');
    }
  }, {threshold:.1,rootMargin:'0px 0px -12% 0px'});
  observer.observe(framework);
})();