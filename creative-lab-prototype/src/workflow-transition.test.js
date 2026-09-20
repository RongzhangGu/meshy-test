import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkflowScrollState, getWorkflowWheelStop, getWorkflowReadingScrollY, isWorkflowTitleReady, holdWorkflowStep, initialWorkflow, workflowTransition as transition } from './workflow-transition.js';

test('reading layout preserves the visible illustration as the runway and section spacing collapse', () => {
  for (const scrollY of [1800,4800,6400]) for (const beforeTop of [-300,320,900]) {
    // A natural-height Business panel and flow header put the illustration here.
    const afterDocumentTop=2250, afterTop=afterDocumentTop-scrollY;
    const nextScrollY=getWorkflowReadingScrollY(scrollY,beforeTop,afterTop);
    assert.equal(afterDocumentTop-nextScrollY,beforeTop);
    assert.equal(afterDocumentTop-getWorkflowReadingScrollY(scrollY,beforeTop,afterTop,120),beforeTop-120,
      'the gesture that exits the last step is preserved');
  }
});

test('scroll preserves the entrance, advances all four steps and reverses with the wheel', () => {
  const read = offset => getWorkflowScrollState(offset, 4024, 1000);
  assert.equal(read(0).openingProgress, 0);
  assert.equal(read(1324).openingProgress, 1);
  assert.deepEqual([0, 900, 1000, 1600, 2200, 2800].map(offset => read(offset).step), [0, 0, 0, 1, 2, 3]);
  assert.deepEqual([2800, 2200, 1600, 1000].map(offset => read(offset).step), [3, 2, 1, 0]);
  assert.equal(read(-1000).step, 0);
  assert.equal(read(100000).step, 3);
  const { stepStart, stepRange } = read(0);
  for (let step = 0; step < 4; step++) {
    assert.equal(read(stepStart + stepRange * (step + .12)).step, step);
  }
});

test('the final step has a full pinned reading interval before the section releases', () => {
  for (const viewportHeight of [900, 1000, 1200]) {
    // The section is 500svh; its pinned stage is 100svh minus the shared navbar and inset.
    const range = viewportHeight * 4 + 24;
    const read = offset => getWorkflowScrollState(offset, range, viewportHeight);
    const { stepStart, stepRange } = read(0);
    const lastStepStart = stepStart + stepRange * 3;
    assert.ok(stepRange >= viewportHeight * .5, 'each step gets at least half a viewport of scroll');
    assert.ok(range - lastStepStart >= viewportHeight * 1.3, 'Step 4 stays pinned after its flip');
    assert.equal(read(lastStepStart + 1).step, 3);
    assert.equal(read(lastStepStart + viewportHeight).step, 3);
    assert.equal(read(range).step, 3);
  }
});

test('large wheel gestures visit every step before releasing to the following section', () => {
  let offset = 0;
  for (let step = 0; step < 4; step++) {
    const stop = getWorkflowWheelStop(offset, 10000, 4024, 1000);
    assert.equal(stop.step, step);
    assert.equal(getWorkflowScrollState(stop.offset, 4024, 1000).step, step);
    offset = stop.offset;
  }
  assert.equal(getWorkflowWheelStop(offset, 10000, 4024, 1000), null);
  assert.equal(getWorkflowWheelStop(offset, -10000, 4024, 1000), null);
  assert.equal(getWorkflowWheelStop(0, 120, 4024, 1000), null);
});

test('a fast fling stops on the masked title until both lines finish and settle', () => {
  const read = (offset, ready) => getWorkflowWheelStop(offset, 10000, 4024, 1000, ready);
  const pending = { context: false, main: false, completedAt: null };
  assert.equal(isWorkflowTitleReady(pending, 5000), false);
  assert.equal(isWorkflowTitleReady({ ...pending, context: true }, 5000), false);
  assert.equal(isWorkflowTitleReady({ ...pending, main: true }, 5000), false);
  assert.deepEqual(read(-500, false), { offset: 0, phase: 'title' });
  assert.deepEqual(read(0, false), { offset: 0, phase: 'title' });
  const complete = { context: true, main: true, completedAt: 2200 };
  assert.equal(isWorkflowTitleReady(complete, 2400), false);
  assert.equal(isWorkflowTitleReady(complete, 2520), true);
  const opened = read(0, isWorkflowTitleReady(complete, 2520));
  assert.equal(opened.step, 0);
  assert.ok(opened.offset > 0);
  // An intentional departure or return remains possible.
  assert.equal(getWorkflowWheelStop(0, -300, 4024, 1000, false), null);
  assert.equal(read(4500, false), null);
});

test('wheel inertia cannot leave a turning card; a fresh gesture can continue after settling', () => {
  assert.equal(holdWorkflowStep(1400, 300, true), true);
  assert.equal(holdWorkflowStep(900, 300, false), true);
  assert.equal(holdWorkflowStep(1800, 40, false), true);
  assert.equal(holdWorkflowStep(1400, 300, false), false);
});

test('workflow flips forward and backward through all four steps', () => {
  let state = initialWorkflow;
  for (const step of [1, 2, 3, 0]) {
    const previous = state.step;
    state = transition(state, { type: 'select', step });
    assert.equal(state.phase, 'turning');
    assert.equal(state.step, previous);
    assert.equal(state.next, step);
    assert.equal(state.direction, Math.sign(step - previous));
    state = transition(state, { type: 'turned' });
    assert.equal(state.step, step);
    assert.equal(state.phase, 'idle');
  }
});

test('rapid selections preserve both visible faces and queue only the latest destination', () => {
  let state = transition(initialWorkflow, { type: 'select', step: 1 });
  const turning = state;
  assert.equal(transition(state, { type: 'select', step: 1 }), turning);
  state = transition(state, { type: 'select', step: 2 });
  state = transition(state, { type: 'select', step: 3 });
  assert.equal(state.step, 0);
  assert.equal(state.next, 1);
  assert.equal(state.direction, 1);
  state = transition(state, { type: 'turned' });
  assert.equal(state.step, 1);
  assert.equal(state.next, 3);
  assert.equal(state.phase, 'turning');
  state = transition(state, { type: 'turned' });
  assert.equal(state.step, 3);
  assert.equal(state.phase, 'idle');
});

test('reversing while a card is turning finishes smoothly before flipping back', () => {
  let state = transition(initialWorkflow, { type: 'select', step: 1 });
  state = transition(state, { type: 'select', step: 0 });
  assert.equal(state.next, 1);
  assert.equal(state.direction, 1);
  state = transition(state, { type: 'turned' });
  assert.equal(state.step, 1);
  assert.equal(state.next, 0);
  assert.equal(state.direction, -1);
  state = transition(state, { type: 'turned' });
  assert.equal(state.step, 0);
  assert.equal(state.phase, 'idle');
});

test('reduced motion settles directly on the latest requested step', () => {
  let state = transition(initialWorkflow, { type: 'select', step: 1 });
  state = transition(state, { type: 'select', step: 2 });
  state = transition(state, { type: 'settle' });
  assert.equal(state.step, 2);
  assert.equal(state.next, 2);
  assert.equal(state.target, 2);
  assert.equal(state.phase, 'idle');
  assert.equal(transition(state, { type: 'turned' }), state);
});
