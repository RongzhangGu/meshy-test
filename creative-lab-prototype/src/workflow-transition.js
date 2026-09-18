export const initialWorkflow = { step: 0, target: 0, phase: 'idle' };

// Preserve the title reveal, then divide the remaining native scroll into four steps.
export function getWorkflowScrollState(offset, range, viewportHeight) {
  const openingRange = Math.min(range, viewportHeight * 1.3 + 24);
  const stepStart = openingRange * .74;
  const stepRange = Math.max(1, (range - stepStart) / 4);
  return {
    openingProgress: Math.max(0, Math.min(1, offset / Math.max(1, openingRange))),
    step: Math.max(0, Math.min(3, Math.floor((offset - stepStart) / stepRange))),
    stepStart,
    stepRange,
  };
}

// Keep the latest selection during a transition; swap artwork once it has faded out.
export function workflowTransition(state, action) {
  if (action.type === 'select') {
    return { ...state, target: action.step, phase: state.phase === 'idle' && state.step !== action.step ? 'out' : state.phase };
  }
  if (action.type === 'settle') return { step: state.target, target: state.target, phase: 'idle' };
  if (action.type === 'turned' && state.phase === 'out') return { ...state, step: state.target, phase: 'in' };
  if (action.type === 'turned' && state.phase === 'in') return { ...state, phase: state.step === state.target ? 'idle' : 'out' };
  return state;
}
