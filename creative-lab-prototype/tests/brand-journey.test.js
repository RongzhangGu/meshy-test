import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceSeedJourney,
  businessMarkMotion,
  pointOnSeedPath,
  seedFlightPosition,
  advanceSeeds,
} from '../src/lib/brand-journey.js';

test('business underline finishes after landing and retracts before departure on the reversible trip clock', () => {
  const arrival = (p) => businessMarkMotion({ from: 1, to: 2, progress: p });
  const departure = (p) => businessMarkMotion({ from: 2, to: 3, progress: p });
  assert.deepEqual(arrival(0), { ink: 0, flight: 0, drawing: false });
  assert.deepEqual(arrival(0.6), { ink: 0, flight: 1, drawing: true });
  assert.deepEqual(arrival(1), { ink: 1, flight: 1, drawing: true });
  assert.deepEqual(departure(0), { ink: 1, flight: 0, drawing: true });
  assert.deepEqual(departure(0.4), { ink: 0, flight: 0, drawing: true });
  assert.deepEqual(departure(1), { ink: 0, flight: 1, drawing: false });
  for (let i = 0; i <= 100; i++) {
    const p = i / 100;
    assert.ok(
      Math.abs(arrival(p).ink - departure(1 - p).ink) < 1e-12,
      'reverse travel retraces the same ink',
    );
  }
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

test('section trips finish by time, rest between destinations, and reverse the same progress', () => {
  let state = advanceSeedJourney(null, { target: 1, now: 0 });
  state = advanceSeedJourney(state, { target: 2, now: 300 });
  assert.equal(state.from, state.to, 'arrival rests before a new trip');
  state = advanceSeedJourney(state, { target: 2, now: 700 });
  assert.deepEqual([state.from, state.to, state.progress], [1, 2, 0]);
  state = advanceSeedJourney(state, { target: 2, now: 1100 });
  assert.equal(state.progress, 0.4, 'the trip advances without another wheel event');
  state = advanceSeedJourney(state, { target: 1, now: 1300 });
  assert.equal(state.progress, 0.2, 'reversing retraces the running trip');
  state = advanceSeedJourney(state, { target: 2, now: 1500 });
  assert.equal(state.progress, 0.4);
  state = advanceSeedJourney(state, { target: 3, now: 2100 });
  assert.equal(state.from, 2, 'finish this destination before a queued next destination');
  state = advanceSeedJourney(state, { target: 3, now: 2400 });
  assert.equal(state.to, 2, 'rest again rather than chaining motion immediately');
  state = advanceSeedJourney(state, { target: 2, now: 2900 });
  assert.equal(state.to, 2, 'discard a stale next destination when the user returns');
  state = advanceSeedJourney(state, { target: 1, now: 3000 });
  state = advanceSeedJourney(state, { target: 1, now: 4000 });
  assert.deepEqual([state.from, state.to], [1, 1]);
  assert.equal(advanceSeedJourney(state, { target: 5, now: 4100, reducedMotion: true }).from, 5);
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

test('the mark lands exactly at either anchor and particles stay finite after a pause or collision', () => {
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
  const balls = [
    { x: 0, y: 0, vx: 0, vy: 0, homeX: -1, homeY: 1, r: 0.2 },
    { x: 0, y: 0, vx: 0, vy: 0, homeX: 1, homeY: -1, r: 0.2 },
  ];
  for (let i = 0; i < 500; i++)
    advanceSeeds(balls, i === 0 ? 8 : 1 / 60, { x: 0, y: 0 }, { x: 2.65, y: 2.65 });
  for (const ball of balls)
    for (const key of ['x', 'y', 'vx', 'vy']) assert.ok(Number.isFinite(ball[key]));
  for (const ball of balls) {
    assert.ok(Math.abs(ball.x) < 2.66);
    assert.ok(Math.abs(ball.y) < 2.66);
  }
  assert.ok(Math.hypot(balls[0].x - balls[1].x, balls[0].y - balls[1].y) >= 0.39);
});

test('My creations arrival falls onto the M, clears the title and reverses without jumps', () => {
  const route = { a: { x: 296, y: 334 }, b: { x: 300, y: 1606 }, landing: { x: 44, y: 1580 } };
  const forward = [];
  for (let i = 0; i <= 1000; i++) {
    const p = seedFlightPosition({ ...route, progress: i / 1000 });
    forward.push(p);
    if (p.x > route.landing.x && p.x < route.b.x && i > 650)
      assert.ok(p.y <= route.landing.y, 'the hop stays above the text');
    const previous = forward.at(-2);
    if (previous)
      assert.ok(
        Math.hypot(p.x - previous.x, p.y - previous.y) < 10,
        'no jumps at the landing or hop',
      );
  }
  const contact = seedFlightPosition({ ...route, progress: 0.7375 });
  assert.ok(Math.hypot(contact.x - route.landing.x, contact.y - route.landing.y) < 1e-9);
  assert.deepEqual(forward.at(-1), { ...route.b, recess: 0 });
  for (let i = 1000; i >= 0; i--)
    assert.deepEqual(seedFlightPosition({ ...route, progress: i / 1000 }), forward[i]);
});
