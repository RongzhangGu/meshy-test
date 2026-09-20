import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateImage, MAX_IMAGE_BYTES } from '../src/lib/upload.js';

test('image validation protects the local preview boundary', () => {
  assert.equal(validateImage({ type: 'image/jpeg', size: 3000 }), '');
  assert.equal(validateImage({ type: 'image/webp', size: MAX_IMAGE_BYTES }), '');
  assert.match(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }), /too large/);
  assert.match(validateImage({ type: 'image/svg+xml', size: 500 }), /not supported/);
  assert.match(validateImage({ type: 'image/jpeg', size: 0 }), /empty/);
  assert.match(validateImage(null), /Choose a photo/);
});
