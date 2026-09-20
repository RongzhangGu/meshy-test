import test from 'node:test';
import assert from 'node:assert/strict';
import { faqGroups, filterFaqGroups } from './faq-data.js';

test('FAQ search finds answer-only keywords regardless of case and whitespace', () => {
  const results = filterFaqGroups('  sTl  ');
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'files-printing');
  assert.deepEqual(results[0].items.map(([question]) => question), ['What file formats do I get?', 'Will it print well on my 3D printer?']);
  assert.equal(filterFaqGroups('AI handles')[0].items[0][0], 'Do I need any 3D modeling experience?');
});

test('FAQ search combines all keywords with the selected topic', () => {
  assert.equal(filterFaqGroups('DOWNLOAD standard', 'files-printing')[0].items.length, 1);
  assert.deepEqual(filterFaqGroups('STL', 'orders-delivery'), []);
  assert.deepEqual(filterFaqGroups('STL shipping'), []);
  assert.deepEqual(filterFaqGroups('not-a-real-question'), []);
  assert.deepEqual(filterFaqGroups('['), []);
});

test('clearing search restores all 16 questions and preserves topic contents', () => {
  assert.equal(filterFaqGroups().flatMap(group => group.items).length, 16);
  assert.deepEqual(filterFaqGroups('   '), faqGroups);
  const orders = faqGroups.find(group => group.id === 'orders-delivery');
  assert.deepEqual(filterFaqGroups('', 'orders-delivery'), [orders]);
});

test('original inline links each occur once so surrounding answer text stays intact', () => {
  const linkedAnswers = faqGroups.flatMap(group => group.items).filter(([, , href]) => href);
  assert.equal(linkedAnswers.length, 4);
  for (const [, answer, href, label] of linkedAnswers) {
    assert.equal(answer.split(label).length, 2);
    assert.equal(href, label === 'Discord' ? 'https://discord.com/invite/KgD5yVM9Y4' : 'https://www.meshy.ai/terms-of-use');
  }
});
