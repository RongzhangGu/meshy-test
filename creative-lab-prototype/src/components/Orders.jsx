import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChatCircleDots, Check, CheckCircle, Package, Truck, X } from '@phosphor-icons/react';
import OrderSupport from './OrderSupport.jsx';
import { orderNotifications, restoreOrders } from '../lib/order-notifications.js';
import './orders.css';

// Explicitly opt-in samples; saved creations never become orders automatically.
const sampleOrders = [
  {
    id: 'CL-1042',
    title: '3D Keychain',
    image: 'keychain',
    finish: 'Full color · Metal ring',
    stage: 1,
    status: 'In production',
    update: 'Your keychain is being printed.',
    arrival: 'Sep 24–26',
    progress: ['Sep 18 · 10:42', 'Sep 19 · 09:15', 'After quality check', 'Estimated Sep 24–26'],
  },
  {
    id: 'CL-1038',
    title: 'Chibi Figure',
    image: 'chibi',
    finish: 'Full color · Display base',
    stage: 2,
    status: 'Shipped',
    update: 'Your figure is on its way.',
    arrival: 'Sep 22–24',
    progress: ['Sep 15 · 14:20', 'Sep 16 · 11:30', 'Sep 19 · 16:05', 'Estimated Sep 22–24'],
  },
  {
    id: 'CL-1016',
    title: '3D Keychain',
    image: 'keychain',
    finish: 'Full color · Metal ring',
    stage: 3,
    status: 'Delivered',
    update: 'Your keychain was delivered and signed for.',
    deliveredAt: 'Sep 12 · 14:32',
    deliveredTimestamp: '2026-09-12T06:32:00Z',
    progress: ['Sep 6 · 10:18', 'Sep 7 · 09:30', 'Sep 10 · 15:45', 'Sep 12 · 14:32'],
  },
];
const steps = ['Order confirmed', 'In production', 'Shipped', 'Delivered'];
const storageKey = 'meshy-lab-sample-orders-v1';

export default function Orders({ open, onOpen, onClose, onBrowse, hidden }) {
  const [{ orders, notification }, dispatch] = useReducer(orderNotifications, null, () => {
    let restored = [];
    try {
      restored = restoreOrders(sessionStorage.getItem(storageKey), sampleOrders);
    } catch { /* Storage is optional; the preview still works in memory. */ }
    return { orders: restored, notification: null };
  });
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('active');
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportDrafts, setSupportDrafts] = useState({});
  const dialog = useRef(null);
  const heading = useRef(null);
  const content = useRef(null);
  const returnFocus = useRef(null);
  const backdropPress = useRef(false);
  const samples = orders.length > 0;
  const order = orders.find((item) => item.id === selected);
  const activeCount = orders.filter((item) => item.stage < 3).length;
  const hasUnread = orders.some((item) => item.unread);
  const nextDelivery = orders.find((item) => item.stage === 2);
  const filteredOrders = orders.filter((item) => filter === 'active' ? item.stage < 3 : item.stage === 3);
  if (filter === 'completed') {
    filteredOrders.sort((a, b) => Date.parse(b.deliveredTimestamp) - Date.parse(a.deliveredTimestamp));
  }

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(orders.map(({ id, deliveredTimestamp, unread }) => (
        { id, deliveredTimestamp, unread }
      ))));
    } catch { /* Keep working if browser storage is unavailable. */ }
  }, [orders]);

  useEffect(() => {
    const visibility = () => setPageVisible(document.visibilityState === 'visible');
    // The preview and a future delivery subscription share the same transition.
    const delivered = (event) => {
      if (!event.detail?.orderId) return;
      dispatch({
        type: 'delivered',
        id: event.detail.orderId,
        timestamp: event.detail.deliveredAt || new Date().toISOString(),
        notify: navigator.onLine && document.visibilityState === 'visible',
      });
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('meshy:order-delivered', delivered);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('meshy:order-delivered', delivered);
    };
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timeout = setTimeout(() => dispatch({ type: 'dismiss', id: notification.id }), 5200);
    return () => clearTimeout(timeout);
  }, [notification]);

  useEffect(() => {
    if (open) {
      const trigger = document.activeElement;
      returnFocus.current = trigger?.closest('details')?.querySelector('summary') || trigger;
      setSelected(null);
      setSupportOpen(false);
      dialog.current.showModal();
      heading.current.focus({ preventScroll: true });
      content.current.scrollTop = 0;
    } else if (dialog.current.open) {
      dialog.current.close();
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    content.current.scrollTop = 0;
    const target = content.current.querySelector('h3')
      || dialog.current.querySelector('.orders-filters [aria-pressed="true"]')
      || heading.current;
    target.focus({ preventScroll: true });
  }, [selected, samples, supportOpen]);

  function browse() {
    onClose();
    // Close the native modal before the catalogue restores its own focus.
    requestAnimationFrame(onBrowse);
  }

  function previewDelivery() {
    if (!nextDelivery) return;
    dispatch({
      type: 'delivered',
      id: nextDelivery.id,
      timestamp: new Date().toISOString(),
      notify: navigator.onLine && document.visibilityState === 'visible',
    });
  }

  const deliveryToast = notification && pageVisible && (
    <div className="orders-notification" role="status" aria-live="polite">
      <CheckCircle size={19} aria-hidden="true" />
      <span>
        <strong>{notification.title} · #{notification.id}</strong>
        <span>{notification.message}</span>
      </span>
    </div>
  );

  return (
    <>
      <button
        className="orders-launcher"
        data-unread={hasUnread}
        hidden={hidden}
        onClick={() => {
          if (hasUnread) setFilter('completed');
          onOpen();
        }}
        aria-haspopup="dialog"
        aria-controls="orders-panel"
        aria-expanded={open}
        aria-label={hasUnread ? 'Orders, new delivery. View completed orders' : `Orders, ${activeCount ? `${activeCount} active sample orders` : 'no active orders'}`}
      >
        <Package size={21} aria-hidden="true" />
        <span className="orders-launcher-label" aria-hidden="true">{hasUnread ? 'New delivery' : 'Orders'}</span>
        {!hasUnread && <span className="orders-count" aria-hidden="true">{activeCount}</span>}
      </button>
      <dialog
        ref={dialog}
        id="orders-panel"
        className="orders-dialog"
        data-has-orders={samples}
        role="dialog"
        aria-labelledby="orders-title"
        onKeyDown={(event) => event.stopPropagation()}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        onPointerDown={(event) => {
          backdropPress.current = event.target === dialog.current;
        }}
        onClick={(event) => {
          if (backdropPress.current && event.target === dialog.current) onClose();
        }}
      >
        <div className="orders-sheet">
          <header className="orders-header">
            <h2 id="orders-title" tabIndex={-1} ref={heading}>
              Orders
            </h2>
            <button className="orders-icon-button" aria-label="Close orders" onClick={onClose}>
              <X size={20} />
            </button>
          </header>
          {samples && !order && (
            <div className="orders-filters" role="group" aria-label="Filter orders">
              {[
                { id: 'active', label: 'On the way to you', count: activeCount },
                { id: 'completed', label: 'Completed' },
              ].map((option) => (
                <button
                  key={option.id}
                  data-filter={option.id}
                  aria-pressed={filter === option.id}
                  aria-controls="orders-list"
                  onClick={() => {
                    setFilter(option.id);
                    content.current.scrollTop = 0;
                  }}
                >
                  {option.label}
                  {option.id === 'active' && <span className="orders-filter-count">{option.count}</span>}
                  {option.id === 'completed' && hasUnread && (
                    <>
                      <span className="orders-unread-dot" aria-hidden="true" />
                      <span className="sr-only">New deliveries</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="orders-content" ref={content}>
            {!samples ? (
              <div className="orders-empty">
                <span className="orders-empty-icon" aria-hidden="true">
                  <svg className="orders-empty-rays" viewBox="0 0 40 16" fill="none">
                    <path d="M20 2v6M4 9l4 4M36 9l-4 4" />
                  </svg>
                  <Package size={60} weight="light" />
                </span>
                <h3 tabIndex={-1}>No orders yet</h3>
                <p>Your custom prints will appear here.</p>
                <button className="orders-browse" onClick={browse}>
                  Browse Creations <ArrowRight size={18} />
                </button>
                <button className="orders-sample-link" onClick={() => dispatch({ type: 'preview', orders: sampleOrders })}>
                  Preview sample orders
                </button>
              </div>
            ) : order && supportOpen ? (
              <OrderSupport
                order={order}
                draft={supportDrafts[order.id] || { topic: 'Order status', message: '' }}
                onChange={(draft) => setSupportDrafts((previous) => ({
                  ...previous,
                  [order.id]: draft,
                }))}
                onBack={() => setSupportOpen(false)}
              />
            ) : order ? (
              <>
                <button className="orders-back" onClick={() => setSelected(null)}>
                  <ArrowLeft size={17} /> {filter === 'active' ? 'On the way to you' : 'Completed'}
                </button>
                <div className="orders-product orders-product-detail">
                  <img src={`/assets/${order.image}.webp`} alt="" />
                  <div>
                    <span className="orders-number">#{order.id}</span>
                    <h3 tabIndex={-1}>{order.title}</h3>
                    <p>{order.finish} · Qty 1</p>
                  </div>
                </div>
                <section
                  className="orders-delivery"
                  aria-label={order.stage === 3 ? 'Delivery confirmation' : 'Delivery estimate'}
                >
                  {order.stage === 3 ? <CheckCircle size={23} />
                    : order.stage === 2 ? <Truck size={23} /> : <Package size={23} />}
                  <div>
                    <span>{order.stage === 3 ? 'Delivered' : 'Estimated arrival'}</span>
                    <strong>{order.stage === 3 ? order.deliveredAt : order.arrival}</strong>
                  </div>
                </section>
                <p className="orders-update">{order.update}</p>
                <ol className="orders-timeline" aria-label="Order progress">
                  {steps.map((step, index) => (
                    <li
                      key={step}
                      data-state={index < order.stage || order.stage === 3 ? 'complete' : index === order.stage ? 'current' : 'next'}
                      aria-current={index === order.stage ? 'step' : undefined}
                    >
                      <span className="orders-step-dot" aria-hidden="true">
                        {(index < order.stage || order.stage === 3) && <Check size={12} weight="bold" />}
                      </span>
                      <div>
                        <strong>{step}</strong>
                        <p>{order.progress[index]}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <ul
                className="orders-list"
                id="orders-list"
                aria-label={filter === 'active' ? 'Orders on the way to you' : 'Completed orders'}
              >
                {filteredOrders.map((item) => (
                  <li key={item.id}>
                    <button
                      className="orders-card"
                      data-order-id={item.id}
                      data-unread={Boolean(item.unread)}
                      data-completed={item.stage === 3}
                      onClick={() => {
                        dispatch({ type: 'viewed', ids: [item.id] });
                        setSelected(item.id);
                      }}
                      aria-label={`View ${item.title} order ${item.id}, ${item.status}${item.unread ? ', New' : ''}`}
                    >
                      <span className="orders-product">
                        <img src={`/assets/${item.image}.webp`} alt="" />
                        <span>
                          <span className="orders-card-meta">
                            <span className="orders-number">#{item.id}</span>
                            {item.unread && <span className="orders-new">New</span>}
                          </span>
                          <strong>{item.title}</strong>
                          <span className="orders-quantity">Qty 1</span>
                        </span>
                        <ArrowRight className="orders-card-arrow" size={18} />
                      </span>
                      <span className="orders-card-progress">
                        <span className="orders-status">
                          <CheckCircle size={14} weight="fill" aria-hidden="true" />
                          {item.status}
                        </span>
                        <span>{item.progress[item.stage]}</span>
                      </span>
                      <span className="orders-progress-bar" aria-hidden="true">
                        {steps.map((step, index) => (
                          <i key={step} data-filled={index <= item.stage} />
                        ))}
                      </span>
                    </button>
                  </li>
                ))}
                {!filteredOrders.length && <li className="orders-filter-empty">No orders on the way.</li>}
              </ul>
            )}
          </div>
          {samples && !supportOpen && (
            <footer className="orders-footer">
              {order && (
                <button className="orders-support-trigger" onClick={() => setSupportOpen(true)}>
                  <ChatCircleDots size={19} aria-hidden="true" />
                  Contact support
                </button>
              )}
              {!order && nextDelivery && (
                <button className="orders-preview-delivery" onClick={previewDelivery}>Preview delivery</button>
              )}
              <button onClick={() => {
                setSelected(null);
                dispatch({ type: 'clear' });
                setFilter('active');
                setSupportDrafts({});
              }}>
                Clear samples
              </button>
            </footer>
          )}
          {open && deliveryToast}
        </div>
      </dialog>
      {!open && deliveryToast}
    </>
  );
}
