/* Three Eras: a single figure direction for English, Russian and Hebrew.
   Existing texts, image assets, links, and SVG geometry are preserved. */
(() => {
  'use strict';
  const framework = document.querySelector('.home-selected .era-framework');
  if (!framework || framework.classList.contains('diagram-directed')) return;
  const branchSVG = framework.querySelector('.framework-branches');
  const eraSVGs = [...framework.querySelectorAll('.framework-era > svg')].slice(0,3);
  if (!branchSVG || eraSVGs.length !== 3) return;
  const branchPaths = [...branchSVG.querySelectorAll(':scope > path:not(.chromatic-flow):not(.museum-current-stroke)')].slice(0,3);
  if (branchPaths.length !== 3) return;
  const ns = 'http://www.w3.org/2000/svg';
  const motion = !matchMedia('(prefers-reduced-motion:reduce)').matches
    && !matchMedia('(forced-colors:active)').matches && 'IntersectionObserver' in window;
  let maskCount = 0;
  function drawMask(path, host, phase) {
    if (!motion) return;
    const id = 'framework-draw-' + ++maskCount;
    const mask = document.createElementNS(ns,'mask');
    mask.id = id;
    mask.setAttribute('maskUnits','userSpaceOnUse');
    const box = host.viewBox.baseVal;
    mask.setAttribute('x','-50');
    mask.setAttribute('y','-50');
    mask.setAttribute('width',String(box.width + 100));
    mask.setAttribute('height',String(box.height + 100));
    const line = document.createElementNS(ns,'polyline');
    line.setAttribute('points',path.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).join(' '));
    line.setAttribute('class','diagram-draw-line diagram-draw-' + phase);
    line.setAttribute('pathLength','1');
    line.setAttribute('stroke-width','46');
    line.setAttribute('stroke','#fff');
    line.setAttribute('fill','none');
    mask.append(line);
    host.append(mask);
    path.setAttribute('mask','url(#' + id + ')');
  }
  const topTips = [...branchSVG.querySelectorAll(':scope > polyline')];
  branchPaths.forEach((path,i) => {
    path.classList.add('framework-base-branch');
    drawMask(path,branchSVG,'upper');
    topTips[i]?.classList.add('diagram-branch-tip');
  });
  eraSVGs.forEach(svg => {
    const path = svg.querySelector('path:not(.chromatic-flow-down):not(.museum-current-stroke)');
    if (!path) return;
    path.classList.add('framework-base-lower');
    svg.querySelectorAll(':scope > polyline').forEach(tip => tip.classList.add('diagram-lower-tip'));
    drawMask(path,svg,'lower');
  });
  framework.classList.add('diagram-directed');
  if (!motion) {
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