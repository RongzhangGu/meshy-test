import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy } from '@phosphor-icons/react';

export default function OrderSupport({ order, draft, onChange, onBack }) {
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef(null);
  const summary = useRef(null);
  const message = [
    `Order: #${order.id}`,
    `Product: ${order.title}`,
    `Status: ${order.status}`,
    `Topic: ${draft.topic}`,
    '',
    draft.message.trim(),
  ].join('\n');

  useEffect(() => {
    heading.current.focus({ preventScroll: true });
    heading.current.closest('.orders-content').scrollTop = 0;
  }, [prepared]);

  function prepare(event) {
    event.preventDefault();
    if (!draft.message.trim()) {
      setError('Add a message so support can help with your order.');
      event.currentTarget.elements.message.focus();
      return;
    }
    setError('');
    setPrepared(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setError('');
    } catch {
      summary.current.focus();
      summary.current.select();
      setError('Copy the selected message, then open Meshy support.');
    }
  }

  return (
    <section className="order-support" aria-labelledby="order-support-title">
      <button
        className="orders-back"
        onClick={() => {
          if (prepared) {
            setPrepared(false);
            setCopied(false);
            setError('');
          } else onBack();
        }}
      >
        <ArrowLeft size={17} /> {prepared ? 'Edit message' : 'Order details'}
      </button>
      <h3 id="order-support-title" tabIndex={-1} ref={heading}>
        {prepared ? 'Message ready' : 'Contact support'}
      </h3>
      <div className="order-support-context">
        <img src={`/assets/${order.image}.webp`} alt="" width="48" height="48" />
        <div>
          <strong>{order.title}</strong>
          <span>#{order.id} · {order.status}</span>
        </div>
      </div>
      {prepared ? (
        <>
          <p className="order-support-note">Copy your message and send it through Meshy support.</p>
          <textarea
            className="order-support-summary"
            aria-label="Prepared support message"
            ref={summary}
            readOnly
            value={message}
            rows={8}
          />
          <div className="order-support-actions">
            <button className="order-support-copy" onClick={copy}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? 'Copied' : 'Copy message'}
            </button>
            <a className="orders-browse" href="https://help.meshy.ai/en/" target="_blank" rel="noreferrer">
              Open support <ArrowUpRight size={17} />
            </a>
          </div>
          <span className="sr-only" role="status">{copied ? 'Support message copied.' : ''}</span>
        </>
      ) : (
        <form className="order-support-form" onSubmit={prepare}>
          <label htmlFor="order-support-topic">What can we help with?</label>
          <select
            id="order-support-topic"
            value={draft.topic}
            onChange={(event) => onChange({ ...draft, topic: event.target.value })}
          >
            <option>Order status</option>
            <option>Delivery</option>
            <option>Product quality</option>
            <option>Other</option>
          </select>
          <label htmlFor="order-support-message">Message</label>
          <textarea
            id="order-support-message"
            name="message"
            placeholder="Tell us what happened or what you’d like to know."
            rows={4}
            maxLength={2000}
            required
            value={draft.message}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'order-support-error' : undefined}
            onChange={(event) => {
              onChange({ ...draft, message: event.target.value });
              setError('');
            }}
          />
          <button className="orders-browse" type="submit">
            Prepare message <ArrowRight size={17} />
          </button>
        </form>
      )}
      {error && <p id="order-support-error" className="order-support-error" role="alert">{error}</p>}
    </section>
  );
}
