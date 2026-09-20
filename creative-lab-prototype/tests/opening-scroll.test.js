import test from 'node:test';
import assert from 'node:assert/strict';
import {
  openingProgress,
  OPENING_SETTLE,
  createCatalogueStop,
  catalogueDockPosition,
  holdCatalogueScroll,
} from '../src/lib/opening-scroll.js';

test('opening reaches the catalogue continuously without a final layout snap', () => {
  const end = Math.round(260 * OPENING_SETTLE);
  assert.equal(openingProgress(-10, 260), 0);
  assert.equal(openingProgress(0, 260), 0);
  assert.ok(openingProgress(end - 1, 260) > 0.99);
  assert.equal(openingProgress(end, 260), 1);
  assert.equal(openingProgress(1000, 260), 1);
});

test('a fast wheel lands smoothly at the catalogue without overshooting', () => {
  const stop = createCatalogueStop(40, 229, 1000);
  const positions = [1000, 1060, 1120, 1180, 1240, 1300, 1360, 2000].map((now) =>
    catalogueDockPosition(stop, now),
  );
  assert.equal(positions[0], 40);
  assert.equal(positions.at(-1), 229);
  assert.equal(catalogueDockPosition(stop, 1360), 229);
  assert.ok(positions.every((y, index) => y <= 229 && (!index || y >= positions[index - 1])));
  assert.ok(positions[1] - positions[0] > positions[5] - positions[4], 'arrival decelerates');
});

test('arrival absorbs momentum and preserves a short fully expanded rest', () => {
  const stop = createCatalogueStop(0, 229, 0);
  for (const now of [0, 100, 359, 360, 500, 779])
    assert.equal(holdCatalogueScroll(stop, 2000, now), true);
});

test('one fresh gesture resumes native scrolling, even with a tiny wheel delta', () => {
  for (const delta of [1, 20, 2000]) {
    const stop = createCatalogueStop(0, 229, 0);
    assert.equal(holdCatalogueScroll(stop, 2000, 400), true);
    assert.equal(holdCatalogueScroll(stop, delta, 800), false);
  }
});

test('continuous wheel input cannot keep the catalogue locked indefinitely', () => {
  const stop = createCatalogueStop(0, 229, 0);
  for (let now = 0; now < 1260; now += 20) assert.equal(holdCatalogueScroll(stop, 1, now), true);
  assert.equal(holdCatalogueScroll(stop, 1, 1260), false);
});

test('direct arrivals, idle time and upward movement need no extra scroll quota', () => {
  const stop = createCatalogueStop(229, 229, 100);
  assert.equal(stop.arrivesAt, 100);
  assert.equal(catalogueDockPosition(stop, 100), 229);
  assert.equal(holdCatalogueScroll(stop, -10, 110), false);
  assert.equal(holdCatalogueScroll(stop, 100, 60000), false);
});
