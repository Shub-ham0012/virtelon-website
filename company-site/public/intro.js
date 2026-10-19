(() => {
  'use strict';
  const hero = document.querySelector('.motion-hero');
  const motion = globalThis.VirtelonMotion;
  if (!hero || !motion || typeof IntersectionObserver !== 'function' || typeof ResizeObserver !== 'function') return;
  const canvas = hero.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return; // Static, SEO-readable HTML remains the complete experience.
  const skip = hero.querySelector('.motion-control');
  const replay = hero.querySelector('.motion-replay');
  const identity = hero.querySelector('.opening-identity');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'virtelon-connection-v1';
  let seen = false;
  try { seen = sessionStorage.getItem(key) === 'seen'; } catch { /* Storage is optional. */ }
  let elapsed = 0, previous = null, raf = 0, visible = true, done = true;
  let width = 0, height = 0, pointer = null, bounds = null;
  let frames = 0, workTotal = 0, workMax = 0;
  const labels = ['Creative', 'Technology', 'Systems'];
  const fragments = ['Shape the experience', 'Build the software', 'Connect the operation'];
  const remember = () => { try { sessionStorage.setItem(key, 'seen'); } catch { /* Private browsing fallback. */ } };
  function clear() { ctx.clearRect(0, 0, width, height); }
  function cancel() { cancelAnimationFrame(raf); raf = 0; previous = null; }
  function finish(restoreFocus = false) {
    done = true; elapsed = motion.duration; cancel(); clear();
    hero.dataset.motion = 'settled';
    hero.classList.remove('intro-playing');
    hero.style.removeProperty('--reveal');
    identity.style.opacity = '0';
    const hadFocus = document.activeElement === skip;
    skip.hidden = true; replay.hidden = media.matches;
    remember();
    if (restoreFocus || hadFocus) hero.querySelector('.hero-message a').focus({ preventScroll: true });
    // Read-only QA evidence; renderer time is not an end-to-end FPS claim.
    hero.dataset.motionFrames = String(frames);
    hero.dataset.motionMeanMs = frames ? (workTotal / frames).toFixed(3) : '0';
    hero.dataset.motionMaxMs = workMax.toFixed(3);
  }
  function resize() {
    bounds = hero.getBoundingClientRect(); width = bounds.width; height = bounds.height;
    const size = motion.resolution(width, height, devicePixelRatio);
    canvas.width = size.width; canvas.height = size.height;
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  }
  function render(state) {
    clear();
    const compact = width < 650;
    const cx = width * .5, cy = height * .43;
    const points = compact ? [[.2,.26],[.79,.46],[.23,.67]] : [[.19,.28],[.8,.35],[.34,.72]];
    ctx.lineWidth = 1;
    // One seed, then three named paths. No emitter, noise, blur or particle field.
    ctx.fillStyle = '#F4BB62';
    ctx.globalAlpha = 1 - state.reveal;
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    points.forEach(([x,y], i) => {
      const sx = x * width, sy = y * height;
      const converge = state.connect * .77;
      const px = sx + (cx - sx) * converge, py = sy + (cy - sy) * converge;
      const near = pointer ? Math.max(0, 1 - Math.hypot(pointer.x - sx, pointer.y - sy) / 200) : 0;
      const alpha = state.appear * (1 - state.reveal) * (1 - state.identity * .85);
      ctx.globalAlpha = alpha * (.36 + near * .4);
      ctx.strokeStyle = '#C6CAC8'; ctx.beginPath(); ctx.moveTo(px, py);
      ctx.lineTo(px + (cx - px) * state.connect, py);
      ctx.lineTo(px + (cx - px) * state.connect, py + (cy - py) * state.connect); ctx.stroke();
      ctx.globalAlpha = alpha; ctx.fillStyle = '#F4BB62';
      ctx.fillRect(px - 2, py - 2, 4, 4);
      ctx.fillStyle = '#F4F0E7'; ctx.font = `${compact ? 14 : 18}px Manrope, sans-serif`;
      ctx.textAlign = x > .5 ? 'right' : 'left';
      ctx.fillText(labels[i], sx, sy - 18);
      ctx.globalAlpha = alpha * Math.max(.6, near);
      ctx.fillStyle = '#C6CAC8'; ctx.font = `${compact ? 10 : 12}px "IBM Plex Mono", monospace`;
      ctx.fillText(fragments[i], sx, sy + 24);
      // Pointer proximity reveals a short directional handoff, not a spotlight.
      if (near > 0) { ctx.strokeStyle = '#F4BB62'; ctx.beginPath(); ctx.moveTo(sx, sy + 35); ctx.lineTo(sx + (x > .5 ? -1 : 1) * 65 * near, sy + 35); ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
    identity.style.opacity = String(state.identity);
    hero.style.setProperty('--reveal', String(state.reveal));
    if (hero.dataset.motion !== state.phase) hero.dataset.motion = state.phase;
  }
  function tick(now) {
    raf = 0;
    if (!motion.shouldRun({ reduced: media.matches, hidden: document.hidden, visible, done })) { previous = null; return; }
    if (previous !== null) elapsed += Math.min(now - previous, 50);
    previous = now;
    const start = performance.now(); const state = motion.sample(elapsed);
    render(state);
    const work = performance.now() - start; frames++; workTotal += work; workMax = Math.max(workMax, work);
    if (state.done) finish(); else raf = requestAnimationFrame(tick);
  }
  function resume() { if (!raf && motion.shouldRun({ reduced: media.matches, hidden: document.hidden, visible, done })) raf = requestAnimationFrame(tick); }
  function start() {
    if (media.matches) { finish(); return; }
    elapsed = 0; previous = null; frames = 0; workTotal = 0; workMax = 0; done = false;
    resize(); hero.classList.add('intro-playing'); hero.dataset.motion = 'signal';
    hero.style.setProperty('--reveal', '0'); skip.hidden = false; replay.hidden = true;
    remember(); resume();
  }
  skip.addEventListener('click', () => finish(true));
  replay.addEventListener('click', () => { start(); skip.focus({ preventScroll: true }); });
  document.addEventListener('keydown', event => { if (!done && event.key === 'Escape') finish(document.activeElement === skip); });
  hero.addEventListener('focusin', event => { if (!done && event.target.closest('.hero-message')) finish(); });
  hero.addEventListener('pointermove', event => { if (!done && event.pointerType !== 'touch' && bounds) pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer = null; });
  window.addEventListener('scroll', () => { if (!done) bounds = hero.getBoundingClientRect(); }, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? cancel() : resume());
  media.addEventListener('change', () => { if (media.matches) finish(); else replay.hidden = false; });
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) resume(); else cancel(); });
  intersection.observe(hero);
  const sizing = new ResizeObserver(() => { resize(); if (!done) render(motion.sample(elapsed)); });
  sizing.observe(hero);
  window.addEventListener('pagehide', () => { cancel(); intersection.disconnect(); sizing.disconnect(); }, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
  if (!seen && !media.matches && !location.hash) start(); else finish();
})();
