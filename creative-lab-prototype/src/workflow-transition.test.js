import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkflowScrollState, initialWorkflow, workflowTransition as transition } from './workflow-transition.js';

test('scroll preserves the entrance, advances all four steps and reverses with the wheel', () => {
  const read = offset => getWorkflowScrollState(offset, 2324, 1000);
  assert.equal(read(0).openingProgress, 0);
  assert.equal(read(1324).openingProgress, 1);
  assert.deepEqual([0, 900, 1000, 1400, 1800, 2200].map(offset => read(offset).step), [0, 0, 0, 1, 2, 3]);
  assert.deepEqual([2200, 1800, 1400, 1000].map(offset => read(offset).step), [3, 2, 1, 0]);
  assert.equal(read(-1000).step, 0);
  assert.equal(read(100000).step, 3);
  const { stepStart, stepRange } = read(0);
  for (let step = 0; step < 4; step++) {
    assert.equal(read(stepStart + stepRange * (step + .12)).step, step);
  }
});

test('workflow cycles through four steps and honors the latest click during a transition', () => {
  let state = initialWorkflow;
  for (const step of [1, 2, 3, 0]) {
    state = transition(state, { type: 'select', step });
    assert.equal(state.phase, 'out');
    assert.notEqual(state.step, step);
    state = transition(state, { type: 'turned' });
    assert.equal(state.step, step);
    state = transition(state, { type: 'turned' });
    assert.equal(state.phase, 'idle');
  }
  state = transition(state, { type: 'select', step: 1 });
  state = transition(state, { type: 'select', step: 3 });
  state = transition(state, { type: 'turned' });
  assert.equal(state.step, 3);
  state = transition(state, { type: 'select', step: 2 });
  state = transition(state, { type: 'turned' });
  assert.equal(state.phase, 'out');
  state = transition(state, { type: 'settle' });
  assert.deepEqual(state, { step: 2, target: 2, phase: 'idle' });
});
