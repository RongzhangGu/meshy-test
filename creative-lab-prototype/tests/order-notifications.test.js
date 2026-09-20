import test from 'node:test';
import assert from 'node:assert/strict';
import { orderNotifications, restoreOrders } from '../src/lib/order-notifications.js';

const samples = [
  { id: 'printing', title: '3D Keychain', stage: 1, status: 'In production', progress: ['Placed', 'Printing', 'After quality check', 'Estimated arrival'] },
  { id: 'shipped', title: 'Chibi Figure', stage: 2, status: 'Shipped', progress: ['Placed', 'Printed', 'Shipped', 'Estimated arrival'] },
  { id: 'history', title: '3D Keychain', stage: 3, status: 'Delivered', progress: ['Placed', 'Printed', 'Shipped', 'Delivered'] },
];
const preview = () => orderNotifications({ orders: [], notification: null }, { type: 'preview', orders: samples });
const delivery = (id = 'shipped', notify = true) => ({
  type: 'delivered', id, notify, timestamp: '2026-09-21T12:00:00.000Z',
});
const snapshot = (state) => JSON.stringify(state.orders.map(({ id, deliveredTimestamp, unread }) => (
  { id, deliveredTimestamp, unread }
)));

test('historical completed orders load without unread flags or a delivery toast', () => {
  const state = preview();
  assert.equal(state.orders.filter((order) => order.stage < 3).length, 2);
  assert.ok(state.orders.every((order) => !order.unread));
  assert.equal(state.notification, null);
});

test('a new delivery updates progress and active count, and creates exactly one unread item', () => {
  const state = orderNotifications(preview(), delivery());
  const order = state.orders.find((item) => item.id === 'shipped');
  assert.equal(order.stage, 3);
  assert.equal(order.status, 'Delivered');
  assert.equal(order.unread, true);
  assert.equal(order.deliveredTimestamp, delivery().timestamp);
  assert.equal(order.progress[3], order.deliveredAt);
  assert.equal(state.orders.filter((item) => item.stage < 3).length, 1);
  assert.equal(state.orders.filter((item) => item.unread).length, 1);
  assert.equal(state.notification.message, 'Your order has been delivered.');
  assert.equal(state.notification.id, order.id);
  assert.equal(state.notification.title, order.title);
  assert.equal(samples[1].stage, 2, 'the source fixture is unchanged');
});

test('duplicate, historical, unknown and malformed delivery updates are ignored', () => {
  const state = orderNotifications(preview(), delivery());
  const read = orderNotifications(state, { type: 'viewed', ids: ['shipped'] });
  assert.equal(orderNotifications(read, delivery()), read, 'duplicate delivery cannot restore unread');
  assert.equal(orderNotifications(read, delivery('history')), read);
  assert.equal(orderNotifications(read, delivery('unknown')), read);
  assert.equal(orderNotifications(read, { ...delivery('printing'), timestamp: 'invalid' }), read);
});

test('background or offline deliveries remain unread without creating a toast', () => {
  const state = orderNotifications(preview(), delivery('shipped', false));
  assert.equal(state.orders.find((order) => order.id === 'shipped').unread, true);
  assert.equal(state.notification, null);
  const caughtUp = orderNotifications(state, delivery('printing', false));
  assert.equal(caughtUp.orders.find((order) => order.id === 'printing').progress[2], 'Completed');
  assert.equal(caughtUp.notification, null);
});

test('acknowledging one viewed order leaves other unread deliveries intact', () => {
  const first = orderNotifications(preview(), delivery('shipped', false));
  const both = orderNotifications(first, delivery('printing', false));
  const state = orderNotifications(both, { type: 'viewed', ids: ['shipped'] });
  assert.equal(state.orders.find((order) => order.id === 'shipped').unread, false);
  assert.equal(state.orders.find((order) => order.id === 'printing').unread, true);
  assert.equal(orderNotifications(state, { type: 'viewed', ids: ['shipped', 'unknown'] }), state);
});

test('restoring the session preserves read receipts without replaying notifications', () => {
  const arrived = orderNotifications(preview(), delivery('shipped'));
  const read = orderNotifications(arrived, { type: 'viewed', ids: ['shipped'] });
  for (const original of [arrived, read]) {
    const restored = restoreOrders(snapshot(original), samples);
    assert.deepEqual(restored, original.orders);
    const state = { orders: restored, notification: null };
    assert.equal(orderNotifications(state, delivery()), state);
  }
});

test('invalid session data falls back safely and cannot rewrite sample order content', () => {
  for (const value of ['broken', 'null', '{}', '[null]', '[{"id":"unknown"}]', '[{"id":"shipped"},{"id":"shipped"}]']) {
    assert.deepEqual(restoreOrders(value, samples), []);
  }
  const restored = restoreOrders(JSON.stringify([{ id: 'shipped', deliveredTimestamp: 'invalid', unread: true, title: 'Injected' }]), samples);
  assert.deepEqual(restored, [{ ...samples[1], unread: false }]);
});

test('clearing samples resets notification state and stale timers cannot dismiss a newer toast', () => {
  const first = orderNotifications(preview(), delivery('shipped'));
  const second = orderNotifications(first, delivery('printing'));
  assert.equal(orderNotifications(second, { type: 'dismiss', id: 'shipped' }), second);
  assert.equal(orderNotifications(second, { type: 'dismiss', id: 'printing' }).notification, null);
  assert.deepEqual(orderNotifications(second, { type: 'clear' }), { orders: [], notification: null });
});
