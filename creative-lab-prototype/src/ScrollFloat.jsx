import React, { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

// React Bits ScrollFloat, adapted for the existing sticky sheet and reduced motion.
export default function ScrollFloat({ children, scrollContainerRef, triggerRef, containerClassName = '', textClassName = '', animationDuration = 1, ease = 'back.inOut(2)', scrollStart = 'center bottom+=50%', scrollEnd = 'bottom bottom-=40%', stagger = .03, scrub = true, as: Tag = 'h2', disabled = false }) {
  const containerRef = useRef(null);
  const text = typeof children === 'string' ? children : '';
  const splitText = useMemo(() => text.split(' ').map((word, wordIndex) => <React.Fragment key={wordIndex}>
    {wordIndex > 0 && <span className="char">{'\u00A0'}</span>}
    <span className="scroll-float-word">{Array.from(word).map((char, index) => <span className="char" key={index}>{char}</span>)}</span>
  </React.Fragment>), [text]);

  useEffect(() => {
    const element = containerRef.current;
    const characters = element.querySelectorAll('.char');
    const clearMotion = () => gsap.set(characters, { clearProps: 'opacity,transform,transformOrigin,translate,rotate,scale' });
    if (disabled) { clearMotion(); return; }
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.set(characters, {
        opacity: 0, y: 0, yPercent: 120, scaleY: 2.3, scaleX: .7, transformOrigin: '50% 0%'
      });
      const animation = gsap.to(characters, {
        duration: animationDuration, ease, opacity: 1, y: 0, yPercent: 0, scaleY: 1, scaleX: 1, stagger,
        scrollTrigger: {
          trigger: triggerRef?.current || element,
          scroller: scrollContainerRef?.current || window,
          start: scrollStart, end: scrollEnd, scrub, toggleActions: 'play none none reset'
        }
      });
      // The creation grid above changes document height as it unfolds or filters.
      let refreshFrame = 0;
      const refresh = () => {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => animation.scrollTrigger.refresh());
      };
      const layout = new ResizeObserver(refresh);
      layout.observe(scrollContainerRef?.current || document.body);
      refresh();
      return () => { cancelAnimationFrame(refreshFrame); layout.disconnect(); };
    }, containerRef);
    return () => { media.revert(); clearMotion(); };
  }, [text, scrollContainerRef, triggerRef, animationDuration, ease, scrollStart, scrollEnd, stagger, scrub, disabled]);

  return <Tag ref={containerRef} className={`scroll-float ${containerClassName}`} aria-label={text}>
    <span className={`scroll-float-text ${textClassName}`} aria-hidden="true">{splitText}</span>
  </Tag>;
}
