import {clamp} from './opening-layout.js';

// Finish the barely visible animation tail and enable previews together.
export const OPENING_SETTLE = .88;
export function openingProgress(offset, travel) {
  const progress = clamp(offset / travel);
  return offset >= Math.round(travel * OPENING_SETTLE) ? 1 : progress;
}

export function holdCatalogueScroll(stop, delta, now) {
  if (delta <= 0) return false;
  if (now - stop.since < 800) return true;
  // A single large wheel event must not consume the entire pause.
  stop.effort += Math.min(delta, 100);
  stop.events += 1;
  return stop.effort < 240 || stop.events < 3;
}
