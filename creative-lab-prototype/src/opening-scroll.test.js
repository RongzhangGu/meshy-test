import test from 'node:test';
import assert from 'node:assert/strict';
import {openingProgress, OPENING_SETTLE, holdCatalogueScroll} from './opening-scroll.js';

test('settled cards are interactive before the imperceptible animation tail', () => {
  assert.equal(openingProgress(0, 260), 0);
  assert.equal(openingProgress(Math.round(260 * OPENING_SETTLE), 260), 1);
  assert.equal(openingProgress(1000, 260), 1);
});

test('arrival absorbs a fast fling, then deliberate continued scrolling releases it', () => {
  const stop = {since:0, effort:0, events:0};
  for (const now of [0, 16, 100, 400, 799]) assert.equal(holdCatalogueScroll(stop, 2000, now), true);
  assert.equal(stop.effort, 0, 'arrival momentum does not count toward release');
  assert.equal(holdCatalogueScroll(stop, 2000, 800), true);
  assert.equal(holdCatalogueScroll(stop, 100, 900), true);
  assert.equal(holdCatalogueScroll(stop, 100, 1000), false);
  assert.equal(holdCatalogueScroll({since:0, effort:0, events:0}, -10, 10), false);
  const trackpad = {since:0, effort:0, events:0};
  for (let i=0;i<11;i++) assert.equal(holdCatalogueScroll(trackpad, 20, 900+i*16), true);
  assert.equal(holdCatalogueScroll(trackpad, 20, 1100), false);
  assert.equal(holdCatalogueScroll({since:0, effort:0, events:0}, 100, 60000), true, 'waiting alone never unlocks the catalogue');
});
