import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const timelineSource = await readFile(new URL('../public/motion-timeline.js', import.meta.url), 'utf8');
const introSource = await readFile(new URL('../public/intro.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(timelineSource, context);
const timeline = context.VirtelonMotion;

test('deterministic five-second arc: scan → fragments → mark → system → handoff → settled', () => {
  for (const [time, phase] of [[0,'scan'],[700,'fragments'],[2000,'mark'],[3000,'system'],[4100,'handoff'],[5050,'settled']]) {
    assert.equal(timeline.sample(time).phase, phase);
  }
  let reveal = 0;
  for (let time = -100; time <= 5600; time += 10) {
    const state = timeline.sample(time);
    for (const key of ['scan','expose','assemble','sheen','rails','pulse','word','handoff','reveal']) {
      assert.ok(state[key] >= 0 && state[key] <= 1, `${key} at ${time}`);
    }
    assert.ok(state.reveal >= reveal);
    reveal = state.reveal;
  }
});

test('sixteen deterministic vector fragments converge to the approved mark', () => {
  const opening = [];
  const settled = [];
  for (let index = 0; index < 16; index += 1) {
    opening.push(timeline.fragment(index, 700, false));
    settled.push(timeline.fragment(index, 2400, false));
  }
  assert.equal(new Set(opening.map(value => `${value.x}:${value.y}`)).size, 16);
  for (const value of settled) {
    assert.ok(Math.abs(value.x) < 0.01);
    assert.ok(Math.abs(value.y) < 0.01);
    assert.ok(Math.abs(value.scale - 1) < 0.01);
  }
});

test('reduced motion settles immediately and execution is visibility gated', () => {
  assert.equal(timeline.sample(0, true).done, true);
  assert.equal(timeline.sample(0, true).reveal, 1);
  const active = { reduced:false, hidden:false, visible:true, done:false };
  assert.equal(timeline.shouldRun(active), true);
  for (const [key,value] of [['reduced',true],['hidden',true],['visible',false],['done',true]]) {
    assert.equal(timeline.shouldRun({...active,[key]:value}), false);
  }
});

test('controller includes accessible skip/replay, lifecycle cancellation and no perpetual motion', () => {
  for (const token of ['Escape','visibilitychange','IntersectionObserver','ResizeObserver','pagehide','cancelAnimationFrame','prefers-reduced-motion']) {
    assert.ok(introSource.includes(token), token);
  }
  assert.ok(introSource.includes('if(state.done)finish()'));
  assert.ok(!introSource.includes('setInterval'));
  assert.ok(!introSource.includes('Math.random'));
});

test('homepage uses approved mark fragments and Manrope-led real HTML hero', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('class="mark-fragment"'));
  assert.equal((html.match(/class="mark-fragment"/g) || []).length, 16);
  assert.ok(html.includes('We engineer<br>software &amp; AI'));
  assert.ok(html.includes('Skip opening'));
  assert.ok(html.includes('Replay opening'));
  assert.ok(html.includes('/assets/fonts/manrope-latin.woff2'));
  assert.ok(!html.toLowerCase().includes('bricolage'));
});
