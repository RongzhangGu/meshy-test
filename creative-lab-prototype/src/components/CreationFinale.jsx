import { lazy, Suspense, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, UploadSimple } from '@phosphor-icons/react';
import SpecularButton from './SpecularButton.jsx';

const SeedCapsule = lazy(() => import('./SeedCapsule.jsx'));

export default function CreationFinale({ onUpload, onBrowseCreations }) {
  const section = useRef(null);
  const heading = useRef(null),
    letter = useRef(null);
  const orbitGradient = useId();
  const [near, setNear] = useState(false);
  useLayoutEffect(() => {
    // Anchor to the actual letter so font loading and responsive type stay aligned.
    const place = () => {
      const word = heading.current.getBoundingClientRect(),
        e = letter.current.getBoundingClientRect();
      const line = letter.current.closest('.finale-line').getBoundingClientRect();
      heading.current.style.setProperty('--letter-x', `${e.left - word.left + e.width / 2}px`);
      heading.current.style.setProperty(
        '--letter-y',
        `${line.top - word.top + line.height * 0.65}px`,
      );
      heading.current.style.setProperty('--letter-width', `${e.width}px`);
    };
    const observer = new ResizeObserver(place);
    observer.observe(heading.current);
    place();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px' },
    );
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  return (
    <section
      className="creation-finale"
      id="create-something"
      aria-labelledby="return-title"
      ref={section}
    >
      <div className="finale-heading" ref={heading}>
        <h2 id="return-title" aria-label="Your Next Idea Starts Here">
          Your Next Idea
          <br />
          <span className="finale-line">
            Starts H
            <span className="finale-letter" ref={letter}>
              <span className="finale-letter-glyph">e</span>
            </span>
            re
          </span>
        </h2>
        <div className="finale-playground">
          <div className="finale-halo" aria-hidden="true">
            <svg
              className="finale-orbit"
              viewBox="0 0 600 180"
              preserveAspectRatio="none"
              focusable="false"
            >
              <defs>
                <linearGradient id={orbitGradient} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="var(--orbit-color)" stopOpacity=".06" />
                  <stop offset=".4" stopColor="var(--orbit-color)" stopOpacity=".18" />
                  <stop offset=".68" stopColor="var(--orbit-color)" stopOpacity=".75" />
                  <stop offset="1" stopColor="var(--orbit-color)" stopOpacity=".14" />
                </linearGradient>
              </defs>
              <ellipse className="orbit-echo" cx="300" cy="90" rx="272" ry="65" />
              <g fill="none" stroke={`url(#${orbitGradient})`}>
                <ellipse className="orbit-aura" cx="300" cy="90" rx="288" ry="74" />
                <ellipse className="orbit-line" cx="300" cy="90" rx="288" ry="74" />
              </g>
              <g className="orbit-comet" fill="none" strokeLinecap="round">
                <ellipse
                  className="orbit-trail orbit-trail-glow"
                  cx="300"
                  cy="90"
                  rx="288"
                  ry="74"
                  pathLength="100"
                />
                <ellipse
                  className="orbit-trail orbit-trail-tail"
                  cx="300"
                  cy="90"
                  rx="288"
                  ry="74"
                  pathLength="100"
                />
                <ellipse
                  className="orbit-trail orbit-trail-bright"
                  cx="300"
                  cy="90"
                  rx="288"
                  ry="74"
                  pathLength="100"
                />
                <ellipse
                  className="orbit-trail orbit-trail-star"
                  cx="300"
                  cy="90"
                  rx="288"
                  ry="74"
                  pathLength="100"
                />
              </g>
            </svg>
          </div>
          <span className="finale-dock" data-seed-anchor="finale" aria-hidden="true" />
          {near && (
            <Suspense fallback={null}>
              <SeedCapsule sectionRef={section} />
            </Suspense>
          )}
        </div>
      </div>
      <div className="finale-actions">
        <SpecularButton
          className="finale-upload"
          radius={14}
          autoAnimate
          speed={0.4}
          onClick={onUpload}
        >
          Upload photo
          <UploadSimple size={20} aria-hidden="true" />
        </SpecularButton>
        <button className="finale-browse" onClick={onBrowseCreations}>
          Browse Creations <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
