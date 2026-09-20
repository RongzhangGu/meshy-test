import { useEffect, useRef } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { products } from '../data/products.js';
import { catalogueFilters, matchingCreations } from '../data/discovery-data.js';
import {
  clamp,
  catalogueLayout,
  openingLayout,
  heroComposition,
  heroPlacements,
  heroCallouts,
} from '../lib/opening-layout.js';
import {
  OPENING_SETTLE,
  openingProgress,
  createCatalogueStop,
  catalogueDockPosition,
  holdCatalogueScroll,
} from '../lib/opening-scroll.js';
import ProductCutout from './ProductCutout.jsx';
import { GlowButton } from './GlowButton.jsx';
import './creative-opening.css';

export default function CreativeOpening({
  query,
  catalogueFilter,
  onFilter,
  onCreate,
  startExpanded,
  tools,
}) {
  const root = useRef(null),
    scene = useRef(null),
    cards = useRef([]);
  const reveal = useRef(() => {});
  const matches = new Set(matchingCreations(query, catalogueFilter));
  const searching = Boolean(query.trim());
  const filtering = searching || catalogueFilter !== 'all';
  const shownProducts = products.filter((product) => matches.has(product.id));

  useEffect(() => {
    const element = root.current,
      surface = scene.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 760px)');
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    const directCatalogue = () => mobile.matches || reduced.matches || filtering;
    let frame = 0,
      width = 0,
      height = 0,
      top = 0,
      travel = 0,
      settledTravel = 0,
      inset = 0;
    let stop = null,
      stopUsed = false,
      lastWheel = 0,
      previousY = window.scrollY,
      unlockTimer = 0;
    const landing = () => Math.max(0, top + settledTravel - inset);
    const canStop = () => !directCatalogue() && pointer.matches;
    function dock() {
      stopUsed = true;
      stop = createCatalogueStop(window.scrollY, landing(), performance.now());
      element.dataset.scrollLocked = 'true';
      // Stop native momentum before it paints an overshoot. The stable scrollbar
      // gutter keeps the grid width unchanged while this short lock is active.
      document.documentElement.dataset.catalogueHold = 'true';
      clearTimeout(unlockTimer);
      unlockTimer = setTimeout(releaseStop, stop.arrivesAt - stop.startedAt + 900);
      schedule();
    }
    function releaseStop() {
      clearTimeout(unlockTimer);
      stop = null;
      stopUsed = true;
      lastWheel = 0;
      delete element.dataset.scrollLocked;
      delete document.documentElement.dataset.catalogueHold;
    }
    function resumeScroll(event, delta) {
      // The wheel target can be resolved before overflow is restored.
      // Carry this gesture forward smoothly instead of swallowing it.
      if (event.cancelable) event.preventDefault();
      releaseStop();
      window.scrollBy({ top: delta, behavior: 'smooth' });
    }
    function measure() {
      if (stop && !canStop()) releaseStop();
      width = surface.clientWidth;
      height = element.querySelector('.opening-size-reference').clientHeight;
      top = element.getBoundingClientRect().top + window.scrollY;
      inset = mobile.matches
        ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) + 24
        : parseFloat(getComputedStyle(surface).top) || 0;
      travel = parseFloat(getComputedStyle(element).getPropertyValue('--opening-travel')) || 260;
      settledTravel = directCatalogue() ? 0 : Math.round(travel * OPENING_SETTLE);
      schedule();
    }
    function draw(time, settled = false) {
      frame = 0;
      const arriving = stop && time < stop.arrivesAt;
      if (stop && !stop.landed) {
        window.scrollTo({ top: catalogueDockPosition(stop, time), behavior: 'instant' });
        if (!arriving) stop.landed = true;
      }
      const progress =
        settled || directCatalogue()
          ? 1
          : openingProgress(window.scrollY - top + inset, travel);
      surface.style.setProperty('--unfold', progress);
      const composition = heroComposition(width, height);
      surface.style.setProperty('--hero-scale', composition.scale);
      surface.style.setProperty('--hero-left', `${composition.left}px`);
      surface.style.setProperty('--hero-top', `${composition.top}px`);
      const ease = progress * progress * (3 - 2 * progress);
      surface.style.setProperty('--detail', ease);
      surface.style.setProperty('--photo-reveal', clamp((progress - 0.38) / 0.42));
      surface.style.setProperty('--arrow-reveal', clamp((progress - 0.65) / 0.3));
      const layout = catalogueLayout(width, mobile.matches, shownProducts.length);
      const catalogueHeight = shownProducts.length ? layout.height : 340;
      const sceneHeight = height + (catalogueHeight - height) * ease;
      surface.style.height = `${sceneHeight}px`;
      element.style.height = `${sceneHeight + settledTravel}px`;
      element.dataset.travel = settledTravel;
      element.dataset.expanded = progress === 1 ? 'true' : 'false';
      element.dataset.browsing = progress > 0.32 ? 'true' : 'false';
      openingLayout(
        width,
        height,
        progress,
        0,
        mobile.matches,
        shownProducts.length,
        products.length,
      ).forEach((pose, index) => {
        const card = cards.current[index];
        // Scale the complete card so artwork, typography and spacing keep their proportions.
        const renderWidth = pose.width / layout.cardScale,
          renderHeight = pose.height / layout.cardScale;
        card.style.width = `${renderWidth}px`;
        card.style.height = `${renderHeight}px`;
        // Depth changes the artwork size; keep the desktop callouts equally readable.
        const projectedScale = (pose.scale * layout.cardScale * 1000) / (1000 - pose.z);
        const labelUnit = composition.scale / projectedScale;
        card.style.setProperty('--hero-label-unit', `${labelUnit}px`);
        const placement =
          heroPlacements[products.findIndex((product) => product.id === shownProducts[index].id)];
        card.style.setProperty(
          '--hero-caption-x',
          `${(placement ? placement[6] - placement[0] : 0) * labelUnit}px`,
        );
        card.style.setProperty(
          '--hero-caption-y',
          `${(placement ? placement[7] - placement[1] - placement[3] : 0) * labelUnit}px`,
        );
        card.style.transform = `translate3d(${pose.x - (renderWidth - pose.width) / 2}px,${pose.y - (renderHeight - pose.height) / 2}px,${pose.z}px) rotateY(${pose.rotateY}deg) rotateZ(${pose.rotateZ}deg) scale(${pose.scale * layout.cardScale})`;
        card.style.opacity = pose.opacity;
        card.style.visibility = pose.opacity === 0 ? 'hidden' : 'visible';
        card.tabIndex = pose.opacity === 0 ? -1 : 0;
        card.style.pointerEvents = pose.opacity === 0 ? 'none' : '';
      });
      if (arriving) frame = requestAnimationFrame(draw);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function scroll() {
      const y = window.scrollY,
        target = landing();
      // Rearm only after a deliberate return into the hero, not a small bounce.
      if (!stop && y < target - settledTravel * 0.5) stopUsed = false;
      // Fallback for a native scroll that crosses between wheel events.
      if (
        canStop() &&
        !stop &&
        !stopUsed &&
        lastWheel &&
        performance.now() - lastWheel < 300 &&
        previousY <= target &&
        y >= target
      )
        dock();
      previousY = window.scrollY;
      schedule();
    }
    function wheel(event) {
      if (
        !canStop() ||
        event.defaultPrevented ||
        event.ctrlKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY)
      )
        return;
      if (event.target.closest('input,textarea,select,[role="dialog"],.nav-search-panel')) return;
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      const target = landing(),
        y = window.scrollY;
      if (delta < 0) {
        if (stop) resumeScroll(event, delta);
        else releaseStop();
        return;
      }
      lastWheel = performance.now();
      if (!stop && y < target - settledTravel * 0.5) stopUsed = false;
      if (stop) {
        if (holdCatalogueScroll(stop, delta, performance.now())) {
          if (event.cancelable) event.preventDefault();
        } else resumeScroll(event, delta);
      } else if (!stopUsed && y <= target + 1 && y + delta >= target) {
        if (event.cancelable) event.preventDefault();
        dock();
      }
      schedule();
    }
    function pointerDown(event) {
      if (
        event.pointerType === 'touch' ||
        event.target.closest('a,button,input,textarea,select') ||
        event.clientX >= document.documentElement.clientWidth
      )
        releaseStop();
    }
    function browse(instant = false, focusHeading = false) {
      releaseStop();
      // A direct visit still needs the dock on its next downward wheel input.
      stopUsed = false;
      measure();
      if (instant || reduced.matches) {
        // Resolve the new result height before positioning the scroll dock.
        cancelAnimationFrame(frame);
        draw(performance.now(), true);
        measure();
      }
      if (focusHeading) document.getElementById('page-title')?.focus({ preventScroll: true });
      window.scrollTo({
        top: landing(),
        behavior: instant || reduced.matches ? 'instant' : 'smooth',
      });
      // Instant navigation must be settled before a View Transition captures it.
      if (instant || reduced.matches) {
        cancelAnimationFrame(frame);
        draw(performance.now());
      } else schedule();
    }
    reveal.current = browse;
    function browseFromNavigation() {
      browse(true);
    }
    element.addEventListener('lab:browse', browseFromNavigation);
    const resize = new ResizeObserver(measure);
    resize.observe(surface);
    resize.observe(element.querySelector('.opening-size-reference'));
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', releaseStop);
    window.addEventListener('pointerdown', pointerDown, { passive: true });
    reduced.addEventListener('change', measure);
    mobile.addEventListener('change', measure);
    measure();
    if (startExpanded || filtering) browse(true);
    return () => {
      releaseStop();
      cancelAnimationFrame(frame);
      resize.disconnect();
      element.removeEventListener('lab:browse', browseFromNavigation);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', releaseStop);
      window.removeEventListener('pointerdown', pointerDown);
      reduced.removeEventListener('change', measure);
      mobile.removeEventListener('change', measure);
    };
  }, [startExpanded, query, catalogueFilter]);

  return (
    <section className="kinetic-catalog" ref={root} aria-label="Creative Lab creations">
      <div className="opening-size-reference" aria-hidden="true" />
      <div className="opening-sticky" ref={scene}>
        <header className="opening-toolbar">
          <h1 className="lab-section-title" id="page-title" tabIndex={-1}>
            Browse Creations
            <span className="seed-rest" data-seed-anchor="catalog" aria-hidden="true" />
          </h1>
          <div className="opening-controls">
            <nav className="opening-filters" aria-label="Creation filters">
              {catalogueFilters.map((filter) => (
                <button
                  key={filter.id}
                  aria-pressed={catalogueFilter === filter.id}
                  onClick={() => onFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </nav>
            {tools}
          </div>
        </header>
        <div className="ribbon-scene">
          <div className="opening-wordmark" aria-hidden="true">
            <span>Creative</span>
            <span>
              Lab
              <span className="opening-period" data-seed-anchor="hero" />
            </span>
          </div>
          <p className="opening-note opening-note--ideas" aria-hidden="true">
            Turn your ideas
            <br />
            into 3D creations
          </p>
          <p className="opening-note opening-note--customize" aria-hidden="true">
            Customize.
            <br />
            Print. Share.
          </p>
          {shownProducts.map((product, index) => (
            <button
              key={product.id}
              ref={(element) => (cards.current[index] = element)}
              className="opening-model"
              style={{
                '--float-duration': `${6.8 + (index % 5) * 0.55}s`,
                '--float-delay': `${-index * 0.67}s`,
              }}
              data-creation={product.id}
              aria-label={`${product.mode === 'device' ? 'Explore' : 'Try Now:'} ${product.title}`}
              aria-describedby={`creation-description-${product.id}${product.badge ? ` creation-badge-${product.id}` : ''}`}
              onClick={() => onCreate(product.id)}
              onFocus={(event) => {
                if (event.currentTarget.matches(':focus-visible')) reveal.current();
              }}
            >
              <div
                className={`opening-model-art ${product.mode === 'device' ? 'is-device' : ''}`}
                data-creation={product.id}
                aria-hidden="true"
              >
                {product.mode !== 'device' && (
                  <span className="opening-source">
                    <img src={`/assets/${product.source}.webp`} alt="" draggable="false" />
                  </span>
                )}
                <span className="opening-result">
                  <ProductCutout product={product} />
                </span>
              </div>
              <span className="opening-product-scene" aria-hidden="true">
                <img src={`/assets/${product.image}.webp`} alt="" draggable="false" />
              </span>
              <span className="opening-model-caption">
                <span className="opening-model-title">
                  {heroCallouts[product.id] && (
                    <svg
                      className="opening-sketch-arrow"
                      viewBox="0 0 1 1"
                      fill="none"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <defs>
                        <marker
                          id={`hero-callout-${product.id}`}
                          markerWidth="9"
                          markerHeight="9"
                          refX="7"
                          refY="4"
                          orient="auto"
                          markerUnits="userSpaceOnUse"
                        >
                          <path d="M1 1L7 4 1 7" />
                        </marker>
                      </defs>
                      <path
                        d={heroCallouts[product.id]}
                        markerEnd={`url(#hero-callout-${product.id})`}
                      />
                    </svg>
                  )}
                  <span className="opening-catalogue-name">{product.title}</span>
                  {product.id === 'lamp' && <span className="opening-reference-name">Lamp</span>}
                  {product.badge && (
                    <span
                      id={`creation-badge-${product.id}`}
                      className={`opening-model-badge opening-model-badge--${product.badge.toLowerCase()}`}
                    >
                      <span>{product.badge}</span>
                    </span>
                  )}
                </span>
                <span
                  className="opening-model-description"
                  id={`creation-description-${product.id}`}
                >
                  {product.detail}
                </span>
                <GlowButton as="span" className="opening-model-cta" aria-hidden="true">
                  {product.mode === 'device' ? 'Explore' : 'Try Now'}
                  <ArrowUpRight size={16} />
                </GlowButton>
              </span>
            </button>
          ))}
        </div>
        {searching && (
          <p className={matches.size ? 'opening-feedback' : 'opening-empty'} role="status">
            {matches.size
              ? `${matches.size} matching ${matches.size === 1 ? 'creation' : 'creations'}`
              : 'No creations found. Try another filter or search.'}
          </p>
        )}
      </div>
    </section>
  );
}
