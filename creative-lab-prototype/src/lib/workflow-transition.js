export const initialWorkflow = { step: 0, target: 0, next: 0, phase: 'idle', direction: 1 };

// Preserve the entire stage when removing the consumed runway; wheel movement stays native.
export function getWorkflowReadingScrollY(scrollY, beforeTop, afterTop) {
  return scrollY + afterTop - beforeTop;
}

// Give every step its own pinned interval, with an extra reading interval before release.
export function getWorkflowScrollState(offset, range, viewportHeight) {
  const openingRange = Math.min(range, viewportHeight * 1.3 + 24);
  const stepStart = openingRange * 0.74;
  const exitHold = Math.min(viewportHeight * 0.8, Math.max(0, range - stepStart) / 3);
  const stepRange = Math.max(1, (range - stepStart - exitHold) / 4);
  return {
    openingProgress: Math.max(0, Math.min(1, offset / Math.max(1, openingRange))),
    step: Math.max(0, Math.min(3, Math.floor((offset - stepStart) / stepRange))),
    stepStart,
    stepRange,
  };
}

// Once open, every new gesture selects one adjacent step, regardless of wheel distance.
export function getWorkflowWheelStop(offset, delta, range, viewportHeight, titleReady = true) {
  if (!delta || offset >= range) return null;
  if (!titleReady) {
    return delta > 0 && offset + delta >= 0 ? { offset: 0, phase: 'title' } : null;
  }
  const { step, stepStart, stepRange } = getWorkflowScrollState(offset, range, viewportHeight);
  if (offset < stepStart) {
    if (delta < 0 || offset + delta < stepStart) return null;
    return { offset: stepStart + stepRange * 0.12, step: 0 };
  }
  const next = step + Math.sign(delta);
  if (next < 0 || next > 3) return { exit: true };
  return { offset: stepStart + stepRange * (next + 0.12), step: next };
}

export function isWorkflowTitleReady(reveal, now) {
  return (
    reveal.context && reveal.main && reveal.completedAt !== null && now - reveal.completedAt >= 320
  );
}

export function holdWorkflowStep(quietFor, direction, previousDirection) {
  // Only absorb the tail of the same gesture; reversing is a fresh input immediately.
  return quietFor < 180 && direction === previousDirection;
}

function startTurn(state, target, sequential = false) {
  return {
    ...state,
    target,
    next: sequential ? state.step + Math.sign(target - state.step) : target,
    sequential,
    phase: state.step === target ? 'idle' : 'turning',
    direction: Math.sign(target - state.step) || state.direction,
  };
}

// Latch both faces until the flip finishes; wheel selections still visit adjacent steps.
export function workflowTransition(state, action) {
  if (action.type === 'select' || action.type === 'scroll') {
    if (action.step === state.target) return state;
    const sequential = action.type === 'scroll';
    return state.phase === 'idle'
      ? startTurn(state, action.step, sequential)
      : { ...state, target: action.step, sequential };
  }
  if (action.type === 'settle')
    return { ...state, step: state.target, next: state.target, phase: 'idle' };
  if (action.type === 'turned' && state.phase === 'turning')
    return startTurn({ ...state, step: state.next }, state.target, state.sequential);
  return state;
}
