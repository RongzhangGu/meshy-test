import {clamp} from './opening-layout.js';

// Keep the existing travel distance, but reach the final layout continuously.
export const OPENING_SETTLE = .88;
export function openingProgress(offset, travel) {
  return clamp(offset / Math.max(1, Math.round(travel * OPENING_SETTLE)));
}

export function createCatalogueStop(from, target, now) {
  return {from, target, startedAt:now, arrivesAt:now+(Math.abs(target-from)>.5?360:0), lastInput:now};
}

export function catalogueDockPosition(stop, now) {
  const progress=clamp((now-stop.startedAt)/Math.max(1,stop.arrivesAt-stop.startedAt));
  return stop.from+(stop.target-stop.from)*(1-Math.pow(1-progress,3));
}

export function holdCatalogueScroll(stop, delta, now) {
  if(delta<=0)return false;
  const quietFor=now-stop.lastInput;
  stop.lastInput=now;
  const settledFor=now-stop.arrivesAt;
  // Absorb arrival momentum; one fresh gesture is enough after the brief rest.
  // Continuous wheel input also has a bounded wait, with no distance/event quota.
  return settledFor<420||(quietFor<140&&settledFor<900);
}
