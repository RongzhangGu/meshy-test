import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './TiltedCard.css';

// TiltedCard interaction from React Bits, adapted to the project's existing GSAP runtime.
// Reference: https://reactbits.dev/components/tilted-card
export default function TiltedCard({ imageSrc, altText = '', captionText = '', rotateAmplitude = 10, scaleOnHover = 1.05, overlayContent }) {
  const card = useRef(null);
  const surface = useRef(null);
  const caption = useRef(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const element = card.current;
      const toX = gsap.quickTo(surface.current, 'rotationX', {duration:.65, ease:'power3.out'});
      const toY = gsap.quickTo(surface.current, 'rotationY', {duration:.65, ease:'power3.out'});
      const toScaleX = gsap.quickTo(surface.current, 'scaleX', {duration:.65, ease:'power3.out'});
      const toScaleY = gsap.quickTo(surface.current, 'scaleY', {duration:.65, ease:'power3.out'});

      function move(event) {
        if (event.pointerType === 'touch') return;
        const bounds = element.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
        toX(-y * rotateAmplitude);
        toY(x * rotateAmplitude);
        toScaleX(scaleOnHover);
        toScaleY(scaleOnHover);
        if (caption.current) {
          caption.current.style.left = `${Math.max(12, Math.min(bounds.width - 252, event.clientX - bounds.left + 18))}px`;
          caption.current.style.top = `${Math.max(12, Math.min(bounds.height - 92, event.clientY - bounds.top + 18))}px`;
        }
      }

      function reset() { toX(0); toY(0); toScaleX(1); toScaleY(1); }
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerleave', reset);
      element.addEventListener('pointercancel', reset);
      return () => {
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerleave', reset);
        element.removeEventListener('pointercancel', reset);
      };
    });
    return () => media.revert();
  }, [rotateAmplitude, scaleOnHover]);

  return <figure className="tilted-card" ref={card}>
    <div className="tilted-card-surface" ref={surface}>
      <div className="tilted-card-image"><img src={imageSrc} alt={altText} loading="lazy" width="1440" height="720" draggable="false"/></div>
      <div className="tilted-card-overlay">{overlayContent}</div>
    </div>
    {captionText && <figcaption className="tilted-card-caption" ref={caption} aria-hidden="true">{captionText}</figcaption>}
  </figure>;
}
