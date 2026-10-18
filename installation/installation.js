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
  cinema.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = cinema.getBoundingClientRect();
    cinema.style.setProperty('--pan-x', ((event.clientX - rect.left) / rect.width - 0.5) * 16 + 'px');
    cinema.style.setProperty('--pan-y', ((event.clientY - rect.top) / rect.height - 0.5) * 10 + 'px');
  });
  cinema.addEventListener('pointerleave', () => {
    cinema.style.setProperty('--pan-x', '0px');
    cinema.style.setProperty('--pan-y', '0px');
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      for (const entry of entries) {
        cinema.querySelectorAll('.cinema-world,.cinema-plate,.cinema-title,.cinema-triangle').forEach(el => {
          el.style.animationPlayState = entry.isIntersecting && !document.hidden ? 'running' : 'paused';
        });
      }
    }, {rootMargin:'120px'}).observe(cinema);
  }
  document.addEventListener('visibilitychange', () => {
    const rect=cinema.getBoundingClientRect();
    const visible=rect.bottom>0 && rect.top<innerHeight;
    cinema.querySelectorAll('.cinema-world,.cinema-plate,.cinema-title,.cinema-triangle').forEach(el => {
      el.style.animationPlayState = !document.hidden && visible ? 'running' : 'paused';
    });
  });
}
