export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const smooth01 = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

// A visited stop leaves its dot as soon as the sphere departs. The receiving
// stop stays covered throughout inertia, including a return to a visited stop.
export function workflowStepMarker(visited, { current, receiving, guide, anchor }) {
  const settled = current && receiving && guide
    && Math.hypot(guide.x - anchor.x, guide.y - anchor.y) < 0.75;
  visited = visited || Boolean(settled);
  return { visited, appearance: current && receiving ? 'covered' : visited ? 'solid' : 'empty' };
}

// Draw on arrival from the shelf; keep the completed stroke when jumping onward.
// Reversing toward the shelf retraces the drawing, while Workflow returns to its end.
export function businessMarkMotion({ from, to, progress }) {
  if (from === to) return { ink: from >= 2 ? 1 : 0, flight: progress, drawing: false };
  if (to === 2)
    return {
      ink: smooth01((progress - 0.6) / 0.4),
      flight: clamp01(progress / 0.6),
      drawing: progress >= 0.6,
    };
  return { ink: from >= 2 ? 1 : 0, flight: progress, drawing: false };
}

// Scroll chooses the latest destination; do not queue stops the reader has passed.
export function advanceSeedJourney(
  state,
  { target, now, reducedMotion = false, duration = 1000, minimumProgress = 0 },
) {
  const rest = (at) => ({ from: at, to: at, progress: 0, lastTime: now });
  if (!state || reducedMotion || minimumProgress >= 1) return rest(target);
  if (state.from === state.to) {
    if (target === state.from) return { ...state, lastTime: now };
    if (Math.abs(target - state.from) > 1) return rest(target);
    return {
      from: Math.min(state.from, target),
      to: Math.max(state.from, target),
      progress: target > state.from ? minimumProgress : 1,
      lastTime: now,
    };
  }
  if (target < state.from || target > state.to) return rest(target);
  const direction = target <= state.from ? -1 : 1;
  // Scroll can pull an arrival ahead of the clock without waiting after a fast wheel gesture.
  const progress = clamp01(
    Math.max(minimumProgress, state.progress + (direction * Math.max(0, now - state.lastTime)) / duration),
  );
  if (direction < 0 && progress === 0) return rest(state.from);
  if (direction > 0 && progress === 1) return rest(state.to);
  return { ...state, progress, lastTime: now };
}

// Linear distance along a route: one continuous position, even when
// the source heading has scrolled out of view. Never clamp a source to the viewport.
export function pointOnSeedPath(points, progress) {
  const t = clamp01(progress);
  if (t === 0) return { x: points[0].x, y: points[0].y };
  if (t === 1) return { x: points.at(-1).x, y: points.at(-1).y };
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let remaining = lengths.reduce((sum, n) => sum + n, 0) * t;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i] > 0) {
      const u = remaining / lengths[i],
        a = points[i],
        b = points[i + 1];
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }
    remaining -= lengths[i];
  }
  return { x: points.at(-1).x, y: points.at(-1).y };
}

// Keep the active adjacent route when FAQ is both a landing and a departure.
export function getSeedDropRoute(journey, target) {
  const from = Math.min(journey?.from ?? target, target);
  const to = Math.max(journey?.to ?? target, target);
  return [0, 3, 4].includes(from) && to - from <= 1 ? from : null;
}

export function isSeedHeadingVisible(heading, viewportTop, viewportBottom) {
  return heading.bottom > viewportTop && heading.top < viewportBottom;
}

// Empty space beside the last cards is part of the visible fall. Actual content
// still masks the sphere and its glow immediately, including expanded answers.
export function advanceSeedReveal(state, { x, y, radius, regions, now }) {
  if (regions.some(({ left, right, top, bottom, padding = 8 }) =>
    x + radius + padding >= left && x - radius - padding <= right
    && y + radius + padding >= top && y - radius - padding <= bottom))
    return { since: null, opacity: 0 };
  const since = state?.since ?? now;
  // Reveal promptly: a slow ease-in would spend most of the remaining fall invisible.
  return { since, opacity: 1 - (1 - clamp01((now - since) / 90)) ** 2 };
}

// Viewport-space flight: scrolling moves the landing surface, never the ball's
// origin or acceleration. A shorter fall reaches it sooner under the same gravity.
export function advanceSeedDrop(state, { a, b, now, target = 1 }) {
  const gravity = 6000;
  if (!state || state.target !== target) {
    const start = state || { x: a.x, y: Math.min(a.y, b.y) };
    const fallTime = Math.sqrt((2 * Math.max(0, b.y - start.y)) / gravity);
    return {
      x: start.x, y: start.y, vy: 0,
      vx: fallTime > 0 ? (b.x - start.x) / fallTime : 0,
      origin: { x: start.x, y: start.y },
      startedAt: now, lastTime: now, target,
      phase: target === 1 ? 'falling' : 'returning',
      progress: target === 1 ? 0 : 1,
    };
  }
  if (state.phase === 'returning') {
    const t = clamp01((now - state.startedAt) / 420);
    const u = smooth01(t);
    return {
      ...state,
      x: state.origin.x + (a.x - state.origin.x) * u,
      y: state.origin.y + (a.y - state.origin.y) * u,
      phase: t === 1 ? 'settled' : 'returning', progress: 1 - t, lastTime: now,
    };
  }
  if (state.phase === 'rebounding') {
    const seconds = Math.max(0, now - state.startedAt) / 1000;
    const duration = (2 * state.bounceSpeed) / gravity;
    const t = duration > 0 ? clamp01(seconds / duration) : 1;
    return {
      ...state,
      x: state.origin.x + (b.x - state.origin.x) * t,
      y: t === 1 ? b.y : b.y - state.bounceSpeed * seconds + gravity * seconds ** 2 / 2,
      phase: t === 1 ? 'settled' : 'rebounding', progress: 1, lastTime: now,
    };
  }
  if (state.phase === 'settled') return { ...state, x: b.x, y: b.y, lastTime: now };
  const dt = Math.min(0.064, Math.max(0, now - state.lastTime) / 1000);
  const x = state.x + state.vx * dt;
  const y = state.y + state.vy * dt + gravity * dt * dt / 2;
  const vy = state.vy + gravity * dt;
  if (y < b.y) return {
    ...state, x, y, vy, lastTime: now,
    progress: clamp01((y - state.origin.y) / Math.max(1, b.y - state.origin.y)),
  };
  return {
    ...state, x, y: b.y, vy: 0,
    origin: { x, y: b.y }, startedAt: now, lastTime: now,
    // Low restitution gives one small rebound proportional to the impact.
    bounceSpeed: Math.min(420, vy * 0.14), phase: 'rebounding', progress: 1,
  };
}

// Compress, release, impact, rebound. Most of the distance is covered in the
// short flight; the remaining time makes the spring's impulse and contact legible.
export function workflowEntryPosition({ a, b, progress, lift = 76 }) {
  const t = clamp01(progress);
  const pose = (x, y, scaleX = 1, rotation = 0) => ({
    x, y, scaleX, scaleY: 1 / scaleX, rotation, recess: 0,
  });
  if (t === 0) return pose(a.x, a.y);
  if (t === 1) return pose(b.x, b.y);
  const direction = Math.sign(b.x - a.x);
  const launch = { x: a.x - direction * 6, y: a.y + 3 };
  if (t < 0.12) {
    const compression = smooth01(t / 0.12);
    return pose(a.x - direction * 6 * compression, a.y + 3 * compression, 1 + 0.48 * compression);
  }
  if (t < 0.62) {
    const flight = (t - 0.12) / 0.5;
    const rise = lift + Math.max(0, launch.y - b.y);
    const up = Math.sqrt(rise);
    const duration = up + Math.sqrt(rise + b.y - launch.y);
    const vx = b.x - launch.x;
    const vy = -2 * up * duration + 2 * duration ** 2 * flight;
    // The first 30 ms release the squash into a stretch aligned with velocity.
    const release = smooth01(flight / 0.09);
    const stretch = 1.48 + 0.18 * Math.abs(2 * flight - 1);
    const roundAtContact = smooth01((flight - 0.86) / 0.14);
    return pose(
      launch.x + vx * flight,
      launch.y - 2 * up * duration * flight + duration ** 2 * flight ** 2,
      (1.48 + (stretch - 1.48) * release) * (1 - roundAtContact) + roundAtContact,
      Math.atan2(vy, vx) * 180 / Math.PI * release * (1 - roundAtContact),
    );
  }
  if (t < 0.69) {
    const compression = Math.sin(Math.PI * (t - 0.62) / 0.07);
    return pose(b.x, b.y + 3 * compression, 1 + 0.6 * compression);
  }
  if (t < 0.94) {
    const bounce = (t - 0.69) / 0.25;
    const height = Math.min(30, Math.max(18, Math.abs(b.y - a.y) * 0.065));
    // One small rebound loses energy at contact; it doesn't float into place.
    return pose(b.x, b.y - 4 * height * bounce * (1 - bounce), 1 - 0.2 * Math.sin(2 * Math.PI * bounce) ** 2);
  }
  const compression = Math.sin(Math.PI * (t - 0.94) / 0.06);
  return pose(b.x, b.y + compression, 1 + 0.16 * compression);
}

// Direct, reversible spatial arcs. The sphere recedes between destinations and
// comes back to the content plane at either anchor; scene layers handle occlusion.
export function seedFlightPosition({ a, b, progress, bend = 80 }) {
  const t = clamp01(progress);
  if (t === 0) return { x: a.x, y: a.y, recess: 0 };
  if (t === 1) return { x: b.x, y: b.y, recess: 0 };
  const end = b;
  const u = t,
    v = 1 - u,
    dy = end.y - a.y;
  return {
    x:
      v ** 3 * a.x +
      3 * v * v * u * (a.x + bend) +
      3 * v * u * u * (end.x + bend) +
      u ** 3 * end.x,
    y:
      v ** 3 * a.y +
      3 * v * v * u * (a.y + dy * 0.3) +
      3 * v * u * u * (end.y - dy * 0.3) +
      u ** 3 * end.y,
    recess: Math.sin(Math.PI * u) ** 2,
  };
}
