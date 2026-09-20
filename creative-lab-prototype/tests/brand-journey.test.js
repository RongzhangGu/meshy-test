import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceSeedJourney,
  businessMarkMotion,
  advanceSeedDrop,
  getSeedDropRoute,
  isSeedHeadingVisible,
  advanceSeedReveal,
  pointOnSeedPath,
  seedFlightPosition,
  workflowEntryPosition,
  workflowStepMarker,
} from '../src/lib/brand-journey.js';

test('business underline finishes after landing and retraces when returning to the shelf', () => {
  const arrival = (p) => businessMarkMotion({ from: 1, to: 2, progress: p });
  assert.deepEqual(arrival(0), { ink: 0, flight: 0, drawing: false });
  assert.deepEqual(arrival(0.6), { ink: 0, flight: 1, drawing: true });
  assert.deepEqual(arrival(1), { ink: 1, flight: 1, drawing: true });
  let state = advanceSeedJourney(null, { target: 1, now: 0 });
  state = advanceSeedJourney(state, { target: 2, now: 700 });
  state = advanceSeedJourney(state, { target: 2, now: 1820, duration: 1400 });
  assert.ok(
    Math.abs(businessMarkMotion(state).ink - 0.5) < 1e-12,
    'ink advances with time after the wheel stops',
  );
  state = advanceSeedJourney(state, { target: 1, now: 2100, duration: 1400 });
  assert.ok(
    businessMarkMotion(state).ink < 1e-12,
    'a reversal erases before returning to the preceding section',
  );
  assert.equal(
    businessMarkMotion(advanceSeedJourney(state, { target: 2, now: 2200, reducedMotion: true }))
      .ink,
    1,
  );
});

test('Business jumps immediately from its completed stroke and returns without erasing it', () => {
  const duration = 660;
  let state = advanceSeedJourney(null, { target: 2, now: 0 });
  state = advanceSeedJourney(state, { target: 3, now: 16, duration });
  for (let elapsed = 0; elapsed <= duration; elapsed += 33) {
    state = advanceSeedJourney(state, { target: 3, now: 16 + elapsed, duration });
    const mark = businessMarkMotion(state);
    assert.equal(mark.ink, 1, 'the completed underline remains through the jump and landing');
    assert.equal(mark.drawing, false, 'there is no pen-retraction phase');
    if (state.from !== state.to) assert.equal(mark.flight, state.progress, 'no delay before flight');
  }
  assert.deepEqual([state.from, state.to], [3, 3]);
  state = advanceSeedJourney(state, { target: 2, now: 700, duration });
  for (let elapsed = 0; elapsed <= duration; elapsed += 33) {
    state = advanceSeedJourney(state, { target: 2, now: 700 + elapsed, duration });
    assert.equal(businessMarkMotion(state).ink, 1, 'returning to the pen tip keeps the stroke');
    assert.equal(businessMarkMotion(state).drawing, false);
  }
  assert.deepEqual([state.from, state.to], [2, 2]);
  for (const at of [4, 5, 6])
    assert.equal(businessMarkMotion({ from: at, to: at, progress: 0 }).ink, 1);
});

test('adjacent section trips start immediately and reverse the same progress', () => {
  let state = advanceSeedJourney(null, { target: 1, now: 0 });
  state = advanceSeedJourney(state, { target: 2, now: 300 });
  assert.deepEqual([state.from, state.to, state.progress], [1, 2, 0]);
  state = advanceSeedJourney(state, { target: 2, now: 700 });
  assert.equal(state.progress, 0.4, 'the trip advances without another wheel event');
  state = advanceSeedJourney(state, { target: 1, now: 900 });
  assert.equal(state.progress, 0.2, 'reversing retraces the running trip');
  state = advanceSeedJourney(state, { target: 2, now: 1100 });
  assert.equal(state.progress, 0.4);
  state = advanceSeedJourney(state, { target: 2, now: 1700 });
  assert.deepEqual([state.from, state.to], [2, 2]);
  state = advanceSeedJourney(state, { target: 1, now: 1716 });
  assert.deepEqual([state.from, state.to, state.progress], [1, 2, 1]);
  state = advanceSeedJourney(state, { target: 1, now: 2716 });
  assert.deepEqual([state.from, state.to], [1, 1]);
  assert.equal(advanceSeedJourney(state, { target: 5, now: 2732, reducedMotion: true }).from, 5);
});

test('fast scrolling to Business skips obsolete stops in either direction', () => {
  let state = advanceSeedJourney(null, { target: 0, now: 0 });
  const jump = advanceSeedJourney(state, { target: 2, now: 16 });
  assert.deepEqual([jump.from, jump.to], [2, 2], 'a direct jump arrives on the next frame');
  assert.equal(businessMarkMotion(jump).ink, 1, 'the daylight mark is ready too');

  state = advanceSeedJourney(state, { target: 1, now: 16 });
  state = advanceSeedJourney(state, { target: 1, now: 200 });
  state = advanceSeedJourney(state, { target: 2, now: 216 });
  assert.deepEqual([state.from, state.to], [2, 2], 'do not finish an old shelf flight first');

  state = advanceSeedJourney(null, { target: 4, now: 0 });
  state = advanceSeedJourney(state, { target: 3, now: 16 });
  state = advanceSeedJourney(state, { target: 3, now: 200 });
  state = advanceSeedJourney(state, { target: 2, now: 216 });
  assert.deepEqual([state.from, state.to], [2, 2], 'a fast reverse does not queue the workflow');
  state = advanceSeedJourney(state, { target: 3, now: 232 });
  assert.deepEqual([state.from, state.to, state.progress], [2, 3, 0], 'no dwell after catching up');
});

test('scroll advances the shelf arrival before its timer, then leaves room for Business', () => {
  let state = advanceSeedJourney(null, { target: 0, now: 0 });
  state = advanceSeedJourney(state, { target: 1, now: 16, minimumProgress: 0.3 });
  assert.equal(state.progress, 0.3, 'catch up even when the first gesture starts mid-flight');
  state = advanceSeedJourney(state, { target: 1, now: 32, minimumProgress: 0.75 });
  assert.equal(state.progress, 0.75, 'scroll sets a lower bound on arrival progress');
  state = advanceSeedJourney(state, { target: 1, now: 48, minimumProgress: 0.6 });
  assert.ok(state.progress > 0.75, 'a small scroll bounce cannot rewind the arrival');
  state = advanceSeedJourney(state, { target: 1, now: 64, minimumProgress: 1 });
  assert.deepEqual([state.from, state.to], [1, 1], 'land at the viewport deadline, not one second later');
  state = advanceSeedJourney(state, { target: 2, now: 80, duration: 450 });
  assert.deepEqual([state.from, state.to, state.progress], [1, 2, 0], 'Business starts from the settled shelf');
});

test('the shelf flight still completes at rest and reverses without its forward scroll floor', () => {
  let state = advanceSeedJourney(null, { target: 0, now: 0 });
  state = advanceSeedJourney(state, { target: 1, now: 16, minimumProgress: 0.4 });
  state = advanceSeedJourney(state, { target: 1, now: 616, minimumProgress: 0.4 });
  assert.deepEqual([state.from, state.to], [1, 1], 'stopping the wheel does not freeze the sphere');
  state = advanceSeedJourney(state, { target: 0, now: 632 });
  state = advanceSeedJourney(state, { target: 0, now: 1632 });
  assert.deepEqual([state.from, state.to], [0, 0]);
});

test('drop routing retains the current journey through FAQ and resets for the next fall', () => {
  assert.equal(getSeedDropRoute({ from: 3, to: 3 }, 4), 3);
  assert.equal(getSeedDropRoute({ from: 3, to: 4 }, 4), 3);
  assert.equal(getSeedDropRoute({ from: 3, to: 4 }, 3), 3);
  assert.equal(getSeedDropRoute({ from: 4, to: 4 }, 3), 3);
  assert.equal(getSeedDropRoute({ from: 4, to: 4 }, 5), 4);
  assert.equal(getSeedDropRoute({ from: 4, to: 5 }, 4), 4);
  assert.equal(getSeedDropRoute({ from: 3, to: 4 }, 5), null, 'skip stale landings after a fast scroll');
  assert.equal(getSeedDropRoute({ from: 0, to: 1 }, 1), 0, 'preserve the Browse → My Creations fall');
  assert.equal(getSeedDropRoute(null, 0), 0, 'restoring the catalogue has a valid source');
});

test('a heading keeps its dot until its last visible pixel leaves the reading viewport', () => {
  assert.equal(isSeedHeadingVisible({ top: 50, bottom: 73 }, 72, 1000), true);
  assert.equal(isSeedHeadingVisible({ top: 50, bottom: 72 }, 72, 1000), false);
  assert.equal(isSeedHeadingVisible({ top: 999, bottom: 1040 }, 72, 1000), true);
  assert.equal(isSeedHeadingVisible({ top: 1000, bottom: 1040 }, 72, 1000), false);
});

test('content masks include the sphere edge and revealed answers, then fade in without a residual over content', () => {
  const band = { x: 300, radius: 5, regions: [{ left: 100, right: 1000, top: 100, bottom: 700 }] };
  let state = advanceSeedReveal(null, { ...band, y: 400, now: 0 });
  assert.equal(state.opacity, 0);
  state = advanceSeedReveal(state, { ...band, y: 713, now: 100 });
  assert.equal(state.opacity, 0, 'keep even the glow off the content edge');
  state = advanceSeedReveal(state, { ...band, y: 714, now: 120 });
  state = advanceSeedReveal(state, { ...band, y: 760, now: 165 });
  assert.equal(state.opacity, 0.75);
  state = advanceSeedReveal(state, { ...band, y: 800, now: 210 });
  assert.equal(state.opacity, 1);
  state = advanceSeedReveal(state, { ...band, regions: [{ ...band.regions[0], bottom: 1100 }], y: 800, now: 300 });
  assert.equal(state.opacity, 0, 'expanding content hides immediately, without a fade-out over text');
  state = advanceSeedReveal(state, { ...band, y: 800, now: 400 });
  assert.equal(state.opacity, 0, 'start a fresh fade after leaving content again');
});

test('the fall reveals beside the last card row and below FAQ answers, while help text still masks it', () => {
  const cards = [
    { left: 32, right: 450, top: 100, bottom: 500 },
    { left: 480, right: 930, top: 100, bottom: 900 },
  ];
  const sample = { x: 300, y: 540, radius: 5, now: 90 };
  const revealed = { since: 0, opacity: 0 };
  assert.equal(advanceSeedReveal(revealed, { ...sample, regions: cards }).opacity, 1,
    'show in the empty left side of the final row, well before its bottom');
  assert.equal(advanceSeedReveal(revealed, { ...sample, x: 500, regions: cards }).opacity, 0,
    'keep the actual final card and the row gap above it hidden');
  const faq = [
    { left: 100, right: 1000, top: 100, bottom: 500 },
    { left: 350, right: 650, top: 560, bottom: 580, padding: 2 },
  ];
  assert.equal(advanceSeedReveal(revealed, { ...sample, regions: faq }).opacity, 1,
    'reveal directly below the final question');
  assert.equal(advanceSeedReveal(revealed, { ...sample, y: 570, regions: faq }).opacity, 1,
    'the empty space beside help text remains visible');
  assert.equal(advanceSeedReveal(revealed, { ...sample, x: 340, y: 570, regions: faq }).opacity, 1,
    'faint outer glow beside help text does not restart the reveal');
  assert.equal(advanceSeedReveal(revealed, { ...sample, x: 346, y: 570, regions: faq }).opacity, 0,
    'hide if the sphere actually overlaps help text');
});

test('scrolling moves the shelf landing surface without restarting or dragging the falling ball', () => {
  const route = { a: { x: 306, y: 104 }, b: { x: 278, y: 900 } };
  let still = advanceSeedDrop(null, { ...route, now: 0 });
  let scrolling = still;
  assert.deepEqual([still.x, still.y], [route.a.x, route.a.y]);
  for (let now = 16; now <= 304; now += 16) {
    still = advanceSeedDrop(still, { ...route, now });
    scrolling = advanceSeedDrop(scrolling, {
      a: { ...route.a, y: -now * 2 }, b: { ...route.b, y: 900 - now * 0.7 }, now,
    });
    assert.deepEqual([scrolling.x, scrolling.y], [still.x, still.y]);
    assert.ok(scrolling.y > route.a.y, 'visible and moving from the first frame');
    assert.ok(scrolling.x >= route.b.x && scrolling.x <= route.a.x, 'stays on the Browse route');
  }
});

test('one gravity gives shorter falls earlier contact and a small impact-driven rebound', () => {
  const impactTimes = [];
  for (const landingY of [300, 900]) {
    const route = { a: { x: 306, y: 104 }, b: { x: 278, y: landingY } };
    let state = advanceSeedDrop(null, { ...route, now: 0 });
    let contact = null;
    for (let now = 10; now <= 750; now += 10) {
      const before = state;
      state = advanceSeedDrop(state, { ...route, now });
      if (state.phase === 'falling') assert.ok(state.vy > before.vy, 'accelerates until contact');
      if (state.phase === 'rebounding') {
        contact ??= now;
        assert.ok(landingY - state.y <= 15, 'one restrained rebound rather than a decorative hop');
      }
    }
    assert.equal(state.phase, 'settled');
    assert.deepEqual([state.x, state.y], [route.b.x, route.b.y]);
    impactTimes.push(contact);
  }
  assert.ok(impactTimes[1] < 550);
  assert.ok(impactTimes[0] < impactTimes[1] * 0.6, 'travel time follows distance instead of one fixed timer');
});

test('Business arrivals finish on the shorter clock after scrolling stops', () => {
  for (const duration of [450, 650]) {
    let state = advanceSeedJourney(null, { target: 1, now: 0 });
    state = advanceSeedJourney(state, { target: 2, now: 16, duration });
    state = advanceSeedJourney(state, { target: 2, now: 16 + duration / 2, duration });
    assert.equal(state.progress, 0.5);
    state = advanceSeedJourney(state, { target: 2, now: 16 + duration, duration });
    assert.deepEqual([state.from, state.to], [2, 2]);
    assert.equal(businessMarkMotion(state).ink, 1);
  }
});

test('the workflow entrance compresses, accelerates into contact and loses energy in one rebound', () => {
  for (const landingY of [240, 520, 850]) {
    const route = { a: { x: 100, y: 450 }, b: { x: 810, y: landingY } };
    const samples = Array.from({ length: 101 }, (_, i) =>
      workflowEntryPosition({ ...route, progress: i / 100 }));
    for (const [sample, endpoint] of [[samples[0], route.a], [samples.at(-1), route.b]]) {
      assert.deepEqual(sample, { ...endpoint, scaleX: 1, scaleY: 1, rotation: 0, recess: 0 });
    }
    assert.ok(samples[10].x < route.a.x && samples[10].scaleY < 0.75, 'loads the spring before launching');
    const apex = Math.min(...samples.slice(12, 63).map(p => p.y));
    assert.ok(apex < Math.min(route.a.y, route.b.y) - 70);
    for (let i = 14; i <= 62; i++) {
      const previousVelocity = samples[i - 1].y - samples[i - 2].y;
      const velocity = samples[i].y - samples[i - 1].y;
      assert.ok(velocity > previousVelocity, 'gravity accelerates the free flight');
    }
    assert.equal(samples[62].x, route.b.x, 'reaches the letter before the recoil and settling beats');
    assert.ok(samples[65].scaleY < 0.7, 'impact visibly compresses the ball');
    const reboundHeight = route.b.y - Math.min(...samples.slice(69).map(p => p.y));
    assert.ok(reboundHeight > 17.9 && reboundHeight <= 30 && reboundHeight < route.b.y - apex);
    for (const sample of samples) {
      assert.ok(Math.abs(sample.scaleX * sample.scaleY - 1) < 1e-9, 'deformation preserves area');
      assert.equal(sample.recess, 0, 'the ball never recedes into the black mask');
    }
    for (const boundary of [0.12, 0.62, 0.69, 0.94]) {
      const before = workflowEntryPosition({ ...route, progress: boundary - 1e-7 });
      const after = workflowEntryPosition({ ...route, progress: boundary + 1e-7 });
      assert.ok(Math.hypot(after.x - before.x, after.y - before.y) < 0.01, 'no jump at contact or release');
      assert.ok(Math.abs(after.scaleX - before.scaleX) < 0.001);
    }
  }
});

test('the title dot makes a visible hop even when Step 1 is almost at the same position', () => {
  const a = { x: 810, y: 440 }, b = { x: 824, y: 428 };
  const sample = (progress) => workflowEntryPosition({ a, b, progress, lift: 140 });
  let state = advanceSeedJourney(null, { target: 0, now: 0 });
  state = advanceSeedJourney(state, { target: 1, now: 0, duration: 760 });
  state = advanceSeedJourney(state, { target: 1, now: 260, duration: 760 });
  assert.ok(sample(state.progress).y < Math.min(a.y, b.y) - 130, 'height is independent of endpoint distance');
  state = advanceSeedJourney(state, { target: 1, now: 760, duration: 760 });
  assert.equal(state.to, 1, 'a stopped scroll still completes the jump');
  assert.equal(state.from, state.to);
  assert.deepEqual([sample(1).x, sample(1).y], [b.x, b.y]);
});

test('section flights use the interior, recede and reverse through identical positions', () => {
  const route = { a: { x: 269, y: 1603 }, b: { x: 90, y: 1883 }, bend: 108 };
  const forward = [];
  for (let i = 0; i <= 1000; i++) {
    const p = seedFlightPosition({ ...route, progress: i / 1000 });
    forward.push(p);
    assert.ok(
      p.x >= 90 && p.x < 360,
      'the route stays inside the composition rather than the left gutter',
    );
    assert.ok(p.y >= route.a.y && p.y <= route.b.y);
    const previous = forward.at(-2);
    if (previous)
      assert.ok(Math.hypot(p.x - previous.x, p.y - previous.y) < 1, 'continuous spatial arc');
  }
  for (let i = 1000; i >= 0; i--) {
    assert.deepEqual(seedFlightPosition({ ...route, progress: i / 1000 }), forward[i]);
  }
  assert.deepEqual(forward[0], { ...route.a, recess: 0 });
  assert.deepEqual(forward.at(-1), { ...route.b, recess: 0 });
  assert.equal(forward[500].recess, 1);
});

test('the mark follows a continuous path and lands exactly at either anchor', () => {
  const a = { x: 280, y: 120 },
    b = { x: 220, y: 1500 };
  const path = [
    a,
    { x: 280, y: 154 },
    { x: 16, y: 154 },
    { x: 16, y: 1470 },
    { x: 220, y: 1470 },
    b,
  ];
  assert.deepEqual(pointOnSeedPath(path, -1), a);
  assert.deepEqual(pointOnSeedPath(path, 2), b);
  let previous = a;
  for (let i = 1; i <= 1000; i++) {
    const p = pointOnSeedPath(path, i / 1000);
    assert.ok(
      Math.hypot(p.x - previous.x, p.y - previous.y) < 2.1,
      'no discontinuity as the source leaves the viewport',
    );
    if (p.y > 154 && p.y < 1470) assert.equal(p.x, 16, 'travel stays outside the content');
    previous = p;
  }
});

test('falling is frame-rate independent and reversing starts at the current position', () => {
  const route = { a: { x: 306, y: 104 }, b: { x: 278, y: 900 } };
  const advanceAt = (interval) => {
    let state = advanceSeedDrop(null, { ...route, now: 0 });
    for (let now = interval; now <= 320; now += interval)
      state = advanceSeedDrop(state, { ...route, now });
    return state;
  };
  const frequent = advanceAt(10), sparse = advanceAt(40);
  assert.ok(Math.hypot(frequent.x - sparse.x, frequent.y - sparse.y) < 1e-9);
  let returning = advanceSeedDrop(frequent, { ...route, now: 320, target: 0 });
  assert.deepEqual([returning.x, returning.y], [frequent.x, frequent.y]);
  returning = advanceSeedDrop(returning, { ...route, now: 530, target: 0 });
  const again = advanceSeedDrop(returning, { ...route, now: 530, target: 1 });
  assert.deepEqual([again.x, again.y], [returning.x, returning.y]);
  returning = advanceSeedDrop(returning, { ...route, now: 740, target: 0 });
  assert.equal(returning.phase, 'settled');
  assert.deepEqual([returning.x, returning.y], [route.a.x, route.a.y]);
});


test('visited steps leave a solid marker during departure, while an inertial arrival stays covered', () => {
  const anchor = { x: 100, y: 200 };
  const arrival = { current: true, receiving: true, anchor, guide: { x: 100, y: 218 } };
  assert.deepEqual(workflowStepMarker(false, arrival), { visited: false, appearance: 'covered' });
  const docked = workflowStepMarker(false, { ...arrival, guide: anchor });
  assert.deepEqual(docked, { visited: true, appearance: 'covered' });
  for (const current of [true, false]) {
    assert.deepEqual(workflowStepMarker(docked.visited, {
      ...arrival, current, receiving: false, guide: null,
    }), { visited: true, appearance: 'solid' }, 'departure to another step or FAQ leaves the dot immediately');
  }
  assert.deepEqual(workflowStepMarker(true, arrival), { visited: true, appearance: 'covered' },
    'returning to a visited stop cannot expose its marker under the moving sphere');
  assert.deepEqual(workflowStepMarker(false, { ...arrival, current: false }),
    { visited: false, appearance: 'empty' }, 'skipped stops are not marked visited');
});
