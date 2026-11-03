'use strict';
const cinema = document.querySelector('.cinema');
const audio = document.getElementById('cinema-audio');
const music = document.querySelector('.music');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Fit the entire 3D coordinate system, including perspective, inside this page.
// Observe the actual container so embedded previews and rotations resize too.
if (cinema) {
  const fitScene = () => {
    const width = cinema.clientWidth;
    const height = cinema.clientHeight;
    if (!width || !height) return;
    const scale = Math.min(1.2, width * 0.96 / 1100, height * 0.92 / 600);
    cinema.style.setProperty('--scene-scale', scale.toFixed(5));
  };
  fitScene();
  if ('ResizeObserver' in window) new ResizeObserver(fitScene).observe(cinema);
  else window.addEventListener('resize', fitScene, {passive:true});
  window.addEventListener('pageshow', fitScene);
}
if (audio && music) {
  audio.volume = 0.5;
  music.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        await audio.play();
        music.setAttribute('aria-pressed', 'true');
      } catch {
        music.setAttribute('aria-pressed', 'false');
      }
    } else {
      audio.pause();
      music.setAttribute('aria-pressed', 'false');
    }
  });
}
if (cinema && !reduced) {
  const plates = [...cinema.querySelectorAll('.cinema-plate')];
  const entryPill = document.querySelector('.entry-pill');
  const entryOutline = entryPill?.querySelector('.entry-outline');

  // Keep the entrance reveal on the same clock as the installation when hidden.
  const timelineElements = [
    ...cinema.querySelectorAll('.cinema-world,.cinema-plate,.cinema-title,.cinema-triangle'),
    ...document.querySelectorAll('.entry-pill,.entry-outline rect,.entry-label')
  ];
  const setTimelineState = visible => timelineElements.forEach(el => {
    el.style.animationPlayState = visible && !document.hidden ? 'running' : 'paused';
  });

  // Layered cursor parallax: foreground plates travel slightly farther than distant ones.
  let depthFrame = 0;
  let lastDepthSample = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerInside = false;
  let depthFactors = plates.map(() => .45);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const sampleDepth = () => {
    const zs = plates.map(plate => {
      const transform = getComputedStyle(plate).transform;
      if (!transform || transform === 'none' || typeof DOMMatrixReadOnly === 'undefined') return 0;
      try { return new DOMMatrixReadOnly(transform).m43 || 0; } catch { return 0; }
    });
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const span = Math.max(1, maxZ - minZ);
    depthFactors = zs.map(z => .18 + ((z - minZ) / span) * .82);
  };

  const applyDepth = timestamp => {
    depthFrame = 0;
    if (!pointerInside) return;

    if (timestamp - lastDepthSample > 180) {
      sampleDepth();
      lastDepthSample = timestamp;
    }

    const rect = cinema.getBoundingClientRect();
    const nx = clamp((pointerX - rect.left) / rect.width - .5, -.5, .5);
    const ny = clamp((pointerY - rect.top) / rect.height - .5, -.5, .5);

    cinema.style.setProperty('--pan-x', (nx * 16).toFixed(2) + 'px');
    cinema.style.setProperty('--pan-y', (ny * 10).toFixed(2) + 'px');

    plates.forEach((plate, index) => {
      const depth = depthFactors[index] || .45;
      plate.style.setProperty('--depth-x', (nx * depth * 8).toFixed(2) + 'px');
      plate.style.setProperty('--depth-y', (ny * depth * 5).toFixed(2) + 'px');
    });
  };

  cinema.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    pointerInside = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!depthFrame) depthFrame = requestAnimationFrame(applyDepth);
  });

  cinema.addEventListener('pointerleave', () => {
    pointerInside = false;
    cinema.style.setProperty('--pan-x', '0px');
    cinema.style.setProperty('--pan-y', '0px');
    plates.forEach(plate => {
      plate.style.setProperty('--depth-x', '0px');
      plate.style.setProperty('--depth-y', '0px');
    });
  });

  // Magnetic entrance with a slower outline follower for a physical, high-end response.
  if (entryPill && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const radius = 120;
    let targetX = 0;
    let targetY = 0;
    let bodyX = 0;
    let bodyY = 0;
    let outlineX = 0;
    let outlineY = 0;
    let magnetFrame = 0;

    const tickMagnet = () => {
      bodyX += (targetX - bodyX) * .18;
      bodyY += (targetY - bodyY) * .18;
      outlineX += (targetX - outlineX) * .095;
      outlineY += (targetY - outlineY) * .095;

      entryPill.style.setProperty('--magnet-x', bodyX.toFixed(2) + 'px');
      entryPill.style.setProperty('--magnet-y', bodyY.toFixed(2) + 'px');
      entryPill.style.setProperty('--outline-lag-x', (outlineX - bodyX).toFixed(2) + 'px');
      entryPill.style.setProperty('--outline-lag-y', (outlineY - bodyY).toFixed(2) + 'px');

      const stillMoving =
        Math.abs(targetX - bodyX) > .03 ||
        Math.abs(targetY - bodyY) > .03 ||
        Math.abs(targetX - outlineX) > .03 ||
        Math.abs(targetY - outlineY) > .03;

      magnetFrame = stillMoving ? requestAnimationFrame(tickMagnet) : 0;
    };

    const aimMagnet = event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const rect = entryPill.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.hypot(dx, dy);
      const strength = clamp(1 - distance / radius, 0, 1);
      targetX = clamp(dx * .055 * strength, -6, 6);
      targetY = clamp(dy * .05 * strength, -5, 5);
      if (!magnetFrame) magnetFrame = requestAnimationFrame(tickMagnet);
    };

    document.addEventListener('pointermove', aimMagnet, {passive:true});
    window.addEventListener('blur', () => {
      targetX = 0;
      targetY = 0;
      if (!magnetFrame) magnetFrame = requestAnimationFrame(tickMagnet);
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      for (const entry of entries) setTimelineState(entry.isIntersecting);
    }, {rootMargin:'120px'}).observe(cinema);
  }

  document.addEventListener('visibilitychange', () => {
    const rect = cinema.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < innerHeight;
    setTimelineState(visible);
  });
}
