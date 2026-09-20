import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { products } from '../src/data/products.js';
import { creationSettings, creationEstimate } from '../src/data/creation-settings.js';
import { validateImage } from '../src/lib/upload.js';

test('every photo creation has its own verified Create controls and available examples', () => {
  assert.deepEqual(
    Object.keys(creationSettings).sort(),
    products
      .filter((p) => !p.inputKind)
      .map((p) => p.id)
      .sort(),
  );
  for (const id of ['keychain', 'chibi', 'vinyl', 'brick', 'magnet', 'keycap']) {
    assert.equal(creationSettings[id].defaultCount, 4);
    assert.equal(creationSettings[id].maxCount, 8);
    assert.equal(creationEstimate(id, 3).credits, 18);
    assert.equal(creationEstimate(id, 8).credits, 48);
  }
  assert.deepEqual(creationEstimate('pixel'), { quantity: 2, credits: 12, duration: '1 min' });
  assert.equal(creationEstimate('pixel', 8).quantity, 4);
  assert.deepEqual(creationEstimate('pet', 1), { quantity: 4, credits: 24, duration: '1 min' });
  assert.equal(creationSettings.pet.maxCount, undefined);
  assert.equal(creationEstimate('brick').duration, '2 min');
  assert.equal(creationEstimate('collapsible').duration, '25 sec');
  assert.equal(creationEstimate('egg').credits, 30);
  const expectedExamples = {
    keychain: 4,
    chibi: 5,
    vinyl: 5,
    brick: 4,
    magnet: 0,
    keycap: 0,
    pixel: 4,
    pet: 4,
    lamp: 9,
    egg: 9,
    collapsible: 9,
    plantpot: 9,
  };
  for (const [id, settings] of Object.entries(creationSettings)) {
    assert.equal(settings.examples.length, expectedExamples[id], id);
    for (const example of settings.examples)
      assert.ok(
        existsSync(new URL(`../public/assets/${example.image}.webp`, import.meta.url)),
        example.image,
      );
  }
  assert.equal(
    validateImage({ type: 'image/png', size: 15 * 1024 * 1024 }, creationSettings.lamp.maxMB),
    '',
  );
  assert.match(
    validateImage({ type: 'image/png', size: 15 * 1024 * 1024 }, creationSettings.chibi.maxMB),
    /10 MB/,
  );
});
