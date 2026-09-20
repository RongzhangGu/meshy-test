import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWorkflowScrollState,
  getWorkflowWheelStop,
  getWorkflowReadingScrollY,
  isWorkflowTitleReady,
  holdWorkflowStep,
  initialWorkflow,
  workflowTransition as transition,
} from '../src/lib/workflow-transition.js';

test('release preserves the entire stage across viewport heights, without adding a wheel jump', () => {
  for (const scrollY of [1800, 4800, 6400])
    for (const beforeTop of [-300, 320, 900]) {
      // Business can shrink when it unpins, but the workflow composition stays identical.
      const afterDocumentTop = 2250,
        afterTop = afterDocumentTop - scrollY;
      const nextScrollY = getWorkflowReadingScrollY(scrollY, beforeTop, afterTop);
      assert.equal(afterDocumentTop - nextScrollY, beforeTop);
      for (const viewportHeight of [900, 1000, 1200])
        for (const childOffset of [126, 240, viewportHeight - 200])
          assert.equal(afterDocumentTop + childOffset - nextScrollY, beforeTop + childOffset);
    }
});

test('scroll preserves the entrance, advances all four steps and reverses with the wheel', () => {
  const read = (offset) => getWorkflowScrollState(offset, 4024, 1000);
  assert.equal(read(0).openingProgress, 0);
  assert.equal(read(1324).openingProgress, 1);
  assert.deepEqual(
    [0, 900, 1000, 1600, 2200, 2800].map((offset) => read(offset).step),
    [0, 0, 0, 1, 2, 3],
  );
  assert.deepEqual(
    [2800, 2200, 1600, 1000].map((offset) => read(offset).step),
    [3, 2, 1, 0],
  );
  assert.equal(read(-1000).step, 0);
  assert.equal(read(100000).step, 3);
  const { stepStart, stepRange } = read(0);
  for (let step = 0; step < 4; step++) {
    assert.equal(read(stepStart + stepRange * (step + 0.12)).step, step);
  }
});

test('the final step has a full pinned reading interval before the section releases', () => {
  for (const viewportHeight of [900, 1000, 1200]) {
    // The section is 500svh; its pinned stage is 100svh minus the shared navbar and inset.
    const range = viewportHeight * 4 + 24;
    const read = (offset) => getWorkflowScrollState(offset, range, viewportHeight);
    const { stepStart, stepRange } = read(0);
    const lastStepStart = stepStart + stepRange * 3;
    assert.ok(
      stepRange >= viewportHeight * 0.5,
      'each step gets at least half a viewport of scroll',
    );
    assert.ok(range - lastStepStart >= viewportHeight * 1.3, 'Step 4 stays pinned after its flip');
    assert.equal(read(lastStepStart + 1).step, 3);
    assert.equal(read(lastStepStart + viewportHeight).step, 3);
    assert.equal(read(range).step, 3);
  }
});

test('small and large wheel gestures advance exactly one step in either direction', () => {
  for (const viewportHeight of [900, 1000, 1200]) {
    const range = viewportHeight * 4 + 24;
    for (const delta of [1, 16, 120, 900, 10000]) {
      let offset = getWorkflowWheelStop(0, 10000, range, viewportHeight).offset;
      for (const step of [1, 2, 3, 2, 1, 0]) {
        const current = getWorkflowScrollState(offset, range, viewportHeight).step;
        const stop = getWorkflowWheelStop(
          offset,
          Math.sign(step - current) * delta,
          range,
          viewportHeight,
        );
        assert.equal(stop.step, step);
        assert.equal(getWorkflowScrollState(stop.offset, range, viewportHeight).step, step);
        offset = stop.offset;
      }
    }
  }
});

test('a fresh gesture exits beyond the first or last step without another scroll runway', () => {
  const { stepStart, stepRange } = getWorkflowScrollState(0, 4024, 1000);
  assert.deepEqual(getWorkflowWheelStop(stepStart + 1, -1, 4024, 1000), { exit: true });
  assert.deepEqual(getWorkflowWheelStop(stepStart + stepRange * 3 + 1, 1, 4024, 1000), {
    exit: true,
  });
  assert.equal(getWorkflowWheelStop(4500, -120, 4024, 1000), null);
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

test('wheel inertia is absorbed symmetrically without a timed reading lock', () => {
  for (const direction of [-1, 1]) {
    assert.equal(holdWorkflowStep(40, direction, direction), true);
    assert.equal(holdWorkflowStep(179, direction, direction), true);
    assert.equal(holdWorkflowStep(180, direction, direction), false);
    assert.equal(holdWorkflowStep(300, direction, direction), false);
    assert.equal(holdWorkflowStep(40, -direction, direction), false);
  }
});

test('fresh wheel gestures during a flip are queued without skipping an intermediate step', () => {
  let state = initialWorkflow;
  for (const step of [1, 2, 3]) state = transition(state, { type: 'scroll', step });
  for (const step of [1, 2, 3]) {
    assert.equal(state.next, step);
    state = transition(state, { type: 'turned' });
    assert.equal(state.step, step);
  }
  assert.equal(state.phase, 'idle');
  for (const step of [2, 1, 0]) state = transition(state, { type: 'scroll', step });
  for (const step of [2, 1, 0]) {
    assert.equal(state.next, step);
    state = transition(state, { type: 'turned' });
    assert.equal(state.step, step);
  }
  assert.equal(state.phase, 'idle');
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
