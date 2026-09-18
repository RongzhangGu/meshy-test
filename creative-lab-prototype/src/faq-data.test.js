import test from 'node:test';
import assert from 'node:assert/strict';
import { faqGroups, filterFaqGroups } from './faq-data.js';

test('FAQ search finds answer-only keywords regardless of case and whitespace', () => {
  const results = filterFaqGroups('  sTl  ');
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'files-printing');
  assert.equal(results[0].items[0][0], 'Which formats can I download?');
  assert.equal(filterFaqGroups('modeling skills')[0].items[0][0], 'Do I need to know how to model in 3D?');
});

test('FAQ search combines all keywords with the selected topic', () => {
  assert.equal(filterFaqGroups('DOWNLOAD stl', 'files-printing')[0].items.length, 1);
  assert.deepEqual(filterFaqGroups('STL', 'orders-delivery'), []);
  assert.deepEqual(filterFaqGroups('STL shipping'), []);
  assert.deepEqual(filterFaqGroups('not-a-real-question'), []);
  assert.deepEqual(filterFaqGroups('['), []);
});

test('clearing search restores all 16 questions and preserves topic contents and links', () => {
  assert.equal(filterFaqGroups().flatMap(group => group.items).length, 16);
  assert.deepEqual(filterFaqGroups('   '), faqGroups);
  const orders = faqGroups.find(group => group.id === 'orders-delivery');
  assert.deepEqual(filterFaqGroups('', 'orders-delivery'), [orders]);
});
