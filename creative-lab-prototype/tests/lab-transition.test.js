import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionLabView } from '../src/lib/lab-transition.js';

test('rapid view changes commit only the latest destination; fallback still aligns once', async () => {
  const original = { document: globalThis.document, matchMedia: globalThis.matchMedia };
  const calls = [];
  let skipped = 0,
    reduced = false;
  globalThis.matchMedia = () => ({ matches: reduced });
  globalThis.document = {
    documentElement: { dataset: {} },
    startViewTransition(update) {
      const done = Promise.resolve().then(update);
      return {
        ready: done,
        finished: done,
        updateCallbackDone: done,
        skipTransition() {
          skipped++;
        },
      };
    },
  };
  try {
    const first = transitionLabView(
      () => calls.push('old'),
      () => calls.push('old aligned'),
    );
    const latest = transitionLabView(
      () => calls.push('new'),
      () => calls.push('new aligned'),
    );
    await Promise.all([first, latest]);
    assert.deepEqual(calls, ['new', 'new aligned']);
    assert.equal(skipped, 1);
    reduced = true;
    await transitionLabView(
      () => calls.push('reduced'),
      () => calls.push('reduced aligned'),
    );
    reduced = false;
    delete document.startViewTransition;
    await transitionLabView(
      () => calls.push('fallback'),
      () => calls.push('fallback aligned'),
    );
    assert.deepEqual(calls.slice(2), [
      'reduced',
      'reduced aligned',
      'fallback',
      'fallback aligned',
    ]);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
