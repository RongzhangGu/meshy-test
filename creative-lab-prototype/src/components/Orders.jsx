import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Package, Truck, X } from '@phosphor-icons/react';
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
];
const steps = ['Order confirmed', 'In production', 'Shipped', 'Delivered'];

export default function Orders({ open, onOpen, onClose, onBrowse, hidden }) {
  const [samples, setSamples] = useState(false);
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const heading = useRef(null);
  const content = useRef(null);
  const returnFocus = useRef(null);
  const backdropPress = useRef(false);
  const order = sampleOrders.find((item) => item.id === selected);
  const activeCount = samples ? sampleOrders.filter((item) => item.stage < 3).length : 0;

  useEffect(() => {
    if (open) {
      const trigger = document.activeElement;
      returnFocus.current = trigger?.closest('details')?.querySelector('summary') || trigger;
      setSelected(null);
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
    (content.current.querySelector('h3') || heading.current).focus({ preventScroll: true });
  }, [selected, samples]);

  function browse() {
    onClose();
    // Close the native modal before the catalogue restores its own focus.
    requestAnimationFrame(onBrowse);
  }

  return (
    <>
      <button
        className="orders-launcher"
        hidden={hidden}
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-controls="orders-panel"
        aria-expanded={open}
        aria-label={`Orders${activeCount ? `, ${activeCount} active sample orders` : ''}`}
      >
        <Package size={21} aria-hidden="true" />
        <span>Orders</span>
        {activeCount > 0 && (
          <span className="orders-count" aria-hidden="true">{activeCount}</span>
        )}
      </button>
      <dialog
        ref={dialog}
        id="orders-panel"
        className="orders-dialog"
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
            <div>
              <span className="orders-eyebrow">Creative Lab</span>
              <h2 id="orders-title" tabIndex={-1} ref={heading}>
                Orders
              </h2>
            </div>
            <button className="orders-icon-button" aria-label="Close orders" onClick={onClose}>
              <X size={22} />
            </button>
          </header>
          <div className="orders-content" ref={content}>
            {!samples ? (
              <div className="orders-empty">
                <Package className="orders-empty-icon" size={60} weight="light" aria-hidden="true" />
                <h3 tabIndex={-1}>Bring a creation home.</h3>
                <p>Once you place an order, you can follow its progress here.</p>
                <button className="orders-browse" onClick={browse}>
                  Browse Creations <ArrowRight size={18} />
                </button>
                <button className="orders-sample-link" onClick={() => setSamples(true)}>
                  Preview sample orders
                </button>
              </div>
            ) : order ? (
              <>
                <button className="orders-back" onClick={() => setSelected(null)}>
                  <ArrowLeft size={17} /> All orders
                </button>
                <div className="orders-product orders-product-detail">
                  <img src={`/assets/${order.image}.webp`} alt="" />
                  <div>
                    <span className="orders-number">#{order.id}</span>
                    <h3 tabIndex={-1}>{order.title}</h3>
                    <p>{order.finish} · Qty 1</p>
                  </div>
                </div>
                <section className="orders-delivery" aria-label="Delivery estimate">
                  {order.stage === 2 ? <Truck size={23} /> : <Package size={23} />}
                  <div>
                    <span>Estimated arrival</span>
                    <strong>{order.arrival}</strong>
                  </div>
                </section>
                <p className="orders-update">{order.update}</p>
                <ol className="orders-timeline" aria-label="Order progress">
                  {steps.map((step, index) => (
                    <li
                      key={step}
                      data-state={index < order.stage ? 'complete' : index === order.stage ? 'current' : 'next'}
                      aria-current={index === order.stage ? 'step' : undefined}
                    >
                      <span className="orders-step-dot" aria-hidden="true">
                        {index < order.stage && <Check size={12} weight="bold" />}
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
              <>
                <div className="orders-list-heading">
                  <h3 tabIndex={-1}>On the way to you</h3>
                  <span>{activeCount} active</span>
                </div>
                <ul className="orders-list">
                  {sampleOrders.map((item) => (
                    <li key={item.id}>
                      <button
                        className="orders-card"
                        onClick={() => setSelected(item.id)}
                        aria-label={`View ${item.title} order ${item.id}, ${item.status}`}
                      >
                        <span className="orders-product">
                          <img src={`/assets/${item.image}.webp`} alt="" />
                          <span>
                            <span className="orders-number">#{item.id}</span>
                            <strong>{item.title}</strong>
                            <span className="orders-quantity">Qty 1</span>
                          </span>
                          <ArrowRight className="orders-card-arrow" size={18} />
                        </span>
                        <span className="orders-card-progress">
                          <span className="orders-status">
                            <i aria-hidden="true" />{item.status}
                          </span>
                          <span>Est. {item.arrival}</span>
                        </span>
                        <span className="orders-progress-bar" aria-hidden="true">
                          {steps.map((step, index) => (
                            <i key={step} data-filled={index <= item.stage} />
                          ))}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="orders-list-note">Open an order to see its latest progress.</p>
              </>
            )}
          </div>
          {samples && (
            <footer className="orders-footer">
              <span>Sample orders · Preview only</span>
              <button onClick={() => {
                setSelected(null);
                setSamples(false);
              }}>
                Clear samples
              </button>
            </footer>
          )}
        </div>
      </dialog>
    </>
  );
}
