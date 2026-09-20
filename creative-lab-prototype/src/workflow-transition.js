export const initialWorkflow = { step: 0, target: 0, next: 0, phase: 'idle', direction: 1 };

// Anchor the illustration when the runway and cinematic header spacing collapse.
export function getWorkflowReadingScrollY(scrollY, beforeTop, afterTop, delta = 0) {
  return scrollY + afterTop - beforeTop + delta;
}

// Give every step its own pinned interval, with an extra reading interval before release.
export function getWorkflowScrollState(offset, range, viewportHeight) {
  const openingRange = Math.min(range, viewportHeight * 1.3 + 24);
  const stepStart = openingRange * .74;
  const exitHold = Math.min(viewportHeight * .8, Math.max(0, range - stepStart) / 3);
  const stepRange = Math.max(1, (range - stepStart - exitHold) / 4);
  return {
    openingProgress: Math.max(0, Math.min(1, offset / Math.max(1, openingRange))),
    step: Math.max(0, Math.min(3, Math.floor((offset - stepStart) / stepRange))),
    stepStart,
    stepRange,
  };
}

// A fast wheel gesture may reach the next step, but cannot skip across the journey.
export function getWorkflowWheelStop(offset, delta, range, viewportHeight, titleReady = true) {
  if (delta <= 0) return null;
  if (!titleReady && offset < range && offset + delta >= 0) return { offset: 0, phase: 'title' };
  const { stepStart, stepRange } = getWorkflowScrollState(offset, range, viewportHeight);
  for (let step = 0; step < 4; step++) {
    const boundary = stepStart + stepRange * step;
    if (offset < boundary && offset + delta >= boundary) return { offset: boundary + 1, step };
  }
  return null;
}

export function isWorkflowTitleReady(reveal, now) {
  return reveal.context && reveal.main && reveal.completedAt !== null && now - reveal.completedAt >= 320;
}

export function holdWorkflowStep(elapsed, quietFor, turning) {
  return turning || elapsed < 1200 || quietFor < 180;
}

function startTurn(state, target) {
  return { ...state, target, next: target, phase: state.step === target ? 'idle' : 'turning', direction: Math.sign(target - state.step) || state.direction };
}

// Latch both faces until the flip finishes; rapid scrolling only updates the queued destination.
export function workflowTransition(state, action) {
  if (action.type === 'select') {
    if (action.step === state.target) return state;
    return state.phase === 'idle' ? startTurn(state, action.step) : { ...state, target: action.step };
  }
  if (action.type === 'settle') return { ...state, step: state.target, next: state.target, phase: 'idle' };
  if (action.type === 'turned' && state.phase === 'turning') return startTurn({ ...state, step: state.next }, state.target);
  return state;
}
