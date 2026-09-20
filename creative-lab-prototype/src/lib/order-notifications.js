function deliveredOrder(order, timestamp) {
  const date = new Date(timestamp);
  if (order.stage === 3 || !Number.isFinite(date.getTime())) return order;
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const deliveredAt = `${day} · ${time}`;
  return {
    ...order,
    stage: 3,
    status: 'Delivered',
    deliveredAt,
    deliveredTimestamp: date.toISOString(),
    update: 'Your order has been delivered.',
    unread: true,
    progress: order.progress.map((step, index) => (
      index === 3 ? deliveredAt : index > order.stage ? 'Completed' : step
    )),
  };
}

export function orderNotifications(state, action) {
  switch (action.type) {
    case 'preview':
      return { orders: action.orders.map((order) => ({ ...order, unread: false })), notification: null };
    case 'clear':
      return { orders: [], notification: null };
    case 'delivered': {
      const order = state.orders.find((item) => item.id === action.id);
      if (!order) return state;
      const delivered = deliveredOrder(order, action.timestamp);
      if (delivered === order) return state;
      return {
        orders: state.orders.map((item) => item.id === order.id ? delivered : item),
        notification: action.notify
          ? { id: order.id, title: order.title, message: 'Your order has been delivered.' }
          : state.notification,
      };
    }
    case 'viewed': {
      const viewed = new Set(action.ids);
      if (!state.orders.some((order) => order.unread && viewed.has(order.id))) return state;
      return {
        ...state,
        orders: state.orders.map((order) => order.unread && viewed.has(order.id)
          ? { ...order, unread: false } : order),
      };
    }
    case 'dismiss':
      return state.notification?.id === action.id ? { ...state, notification: null } : state;
    default:
      return state;
  }
}

// Restore only known sample orders and their delivery/read state, never a toast.
export function restoreOrders(serialized, samples) {
  try {
    const saved = JSON.parse(serialized);
    if (!Array.isArray(saved)) return [];
    const ids = new Set();
    return saved.map((entry) => {
      const sample = samples.find((order) => order.id === entry.id);
      if (!sample || ids.has(entry.id)) throw new Error('Invalid saved order');
      ids.add(entry.id);
      const order = entry.deliveredTimestamp && sample.stage < 3
        ? deliveredOrder(sample, entry.deliveredTimestamp) : sample;
      return { ...order, unread: order !== sample && entry.unread === true };
    });
  } catch {
    return [];
  }
}
