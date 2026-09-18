import React, { useEffect, useRef } from 'react';
import ScrollFloat from './ScrollFloat.jsx';
import './MaskedHeading.css';

export default function MaskedHeading({ text, src, fillScale = 1.3, parallax = 34, reveal = 'wipe', trigger = 'view', as: Tag = 'h2', className = '', triggerRef, staticMotion = false }) {
  const heading = useRef(null);

  useEffect(() => {
    const element = heading.current;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const draw = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / (innerHeight / 2)));
      element.style.setProperty('--masked-offset', `${motion.matches ? 0 : progress * parallax}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const measure = () => {
      const line = element.querySelector('.scroll-float-text');
      if (line) {
        element.style.setProperty('--masked-width', `${line.offsetWidth}px`);
        line.querySelectorAll('.char').forEach(char => char.style.setProperty('--char-left', `${char.offsetLeft}px`));
      }
      schedule();
    };
    const size = new ResizeObserver(measure);
    size.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.dataset.visible = 'true';
        observer.disconnect();
      }
    }, { threshold: .25 });
    if (trigger === 'view' && reveal !== 'float') observer.observe(element);
    else element.dataset.visible = 'true';
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    motion.addEventListener('change', schedule);
    measure();
    draw();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      size.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
    };
  }, [parallax, trigger, reveal, text]);

  return <Tag ref={heading} className={`masked-heading ${className}`} data-reveal={reveal} style={{ '--masked-image': `url("${src}")`, '--masked-fill': `${fillScale * 100}%`, '--masked-scale': fillScale }}>
    {reveal === 'float' ? <ScrollFloat as="span" textClassName="masked-heading-float" triggerRef={triggerRef} disabled={staticMotion} animationDuration={1.4} ease="back.inOut(2)" scrollStart="top 45%" stagger={.045} scrub={false}>{text}</ScrollFloat> : <span className="masked-heading-fill">{text}</span>}
  </Tag>;
}
