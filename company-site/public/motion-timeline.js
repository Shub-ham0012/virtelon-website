/* Pure deterministic choreography. Shared by the renderer and lifecycle tests. */
globalThis.VirtelonMotion = Object.freeze({
  duration: 5200,
  clamp: value => Math.max(0, Math.min(1, value)),
  ease(value) { const t = this.clamp(value); return t * t * (3 - 2 * t); },
  sample(elapsed, reduced = false) {
    const t = reduced ? this.duration : Math.max(0, elapsed);
    return {
      phase: t < 650 ? 'signal' : t < 2450 ? 'scattered' : t < 3300 ? 'connected' : t < 4100 ? 'identity' : t < this.duration ? 'moving' : 'settled',
      appear: this.ease((t - 450) / 750),
      connect: this.ease((t - 1600) / 1500),
      identity: this.ease((t - 2900) / 400) * (1 - this.ease((t - 3900) / 450)),
      reveal: this.ease((t - 4000) / 1100),
      done: t >= this.duration
    };
  },
  shouldRun({ reduced, hidden, visible, done }) { return !reduced && !hidden && visible && !done; },
  resolution(width, height, ratio) { const dpr = Math.min(2, Math.max(1, ratio || 1)); return { dpr, width: Math.round(width * dpr), height: Math.round(height * dpr) }; }
});
