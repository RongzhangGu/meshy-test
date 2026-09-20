import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowRight, ArrowDown, Sparkle } from '@phosphor-icons/react';
import {
  getWorkflowScrollState,
  getWorkflowWheelStop,
  getWorkflowReadingScrollY,
  isWorkflowTitleReady,
  holdWorkflowStep,
  initialWorkflow,
  workflowTransition,
} from '../lib/workflow-transition.js';
import MaskedHeading from './MaskedHeading.jsx';
import SpecularButton from './SpecularButton.jsx';

const compactQuery = '(max-width: 760px), (max-height: 840px)';
// Equal total stagger keeps both lines on the original 2.165s reveal, regardless of letter count.
const titleStagger = { amount: 0.765 };

function renderTitleChar(char) {
  return char === 'i' ? (
    <span className="workflow-letter-i">
      ı
      <span className="workflow-i-dot" data-seed-anchor="workflow-title" />
    </span>
  ) : char;
}

// Original Meshy workflow illustrations; provenance is in docs/assets-sources.json.
const steps = [
  {
    title: 'Choose Your Creation',
    image: 'choose',
    benefit: 'Made For The Real World',
    description: 'Choose a figure, keepsake or everyday object to turn into a physical creation.',
    alt: 'Choose from a figure, lamp, keycap, magnet and fidget',
  },
  {
    title: 'Design With AI',
    image: 'design',
    benefit: 'No Modeling Experience Needed',
    description: 'Upload a photo or describe an idea. AI does the modeling for you.',
    alt: 'A reference image becomes a 3D cowboy figure with AI',
  },
  {
    title: 'Preview & Customize',
    image: 'preview',
    benefit: 'No Extra Design Fee',
    description:
      'Design with credits. Preview every angle and refine the details before making it real.',
    alt: 'Rotate and inspect the cowboy figure in a 3D preview',
  },
  {
    title: 'Print Or Order',
    image: 'print',
    benefit: 'Make It Your Way',
    description:
      'Print at home, or order a finished creation where delivery is available. Physical orders are paid separately.',
    alt: 'Print the figure at home or receive it in a delivery box',
  },
];

export default function Workflow({ onStartCreation, precedingRef }) {
  const [state, dispatch] = useReducer(workflowTransition, initialWorkflow);
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const demo = useRef(null);
  const stage = useRef(null);
  const titleReveal = useRef({ context: false, main: false, completedAt: null });
  const redraw = useRef(() => {});
  const [compact, setCompact] = useState(() => matchMedia(compactQuery).matches);
  const [revealed, setRevealed] = useState(false);
  // One guided visit per page load; subsequent visits are ordinary document scrolling.
  const [introSeen, setIntroSeen] = useState(false);
  const [reading, setReading] = useState(false);
  const expanded = useRef(false);
  const readingScroll = useRef(null);
  const step = steps[state.step];
  const incomingStep = steps[state.next];
  const activeStep = state.phase === 'turning' ? state.next : state.step;

  function updateTitleReveal(line, complete) {
    const reveal = titleReveal.current;
    reveal[line] = complete;
    if (!reveal.context || !reveal.main) reveal.completedAt = null;
    else if (reveal.completedAt === null) reveal.completedAt = performance.now();
    if (demo.current) demo.current.dataset.titleRevealed = String(reveal.context && reveal.main);
    redraw.current();
  }

  useLayoutEffect(() => {
    if (readingScroll.current === null) return;
    const { top } = readingScroll.current;
    const nextTop = stage.current.getBoundingClientRect().top;
    window.scrollTo({
      top: getWorkflowReadingScrollY(scrollY, top, nextTop),
      behavior: 'instant',
    });
    readingScroll.current = null;
  }, [reading]);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const changeMotion = () => setReduced(preference.matches);
    const smallScreen = matchMedia(compactQuery);
    const changeSize = () => setCompact(smallScreen.matches);
    smallScreen.addEventListener('change', changeSize);
    preference.addEventListener('change', changeMotion);
    return () => {
      smallScreen.removeEventListener('change', changeSize);
      preference.removeEventListener('change', changeMotion);
    };
  }, []);

  // The preceding section stays behind the rising sheet; native scroll drives both layers.
  useEffect(() => {
    if (reading) return;
    const section = demo.current;
    const preceding = precedingRef?.current;
    let frame = 0;
    let scrollStep = -1;
    let wheelStop = null;
    let lastWheel = 0;
    let lastDirection = 0;
    let spread = reduced || compact ? 1 : 0;
    let lastDraw = performance.now();
    const clamp = (value) => Math.min(1, Math.max(0, value));
    const smooth = (value) => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };
    const finishJourney = () => {
      wheelStop = null;
      readingScroll.current = { top: stage.current.getBoundingClientRect().top };
      setReading(true);
    };
    const draw = () => {
      frame = 0;
      let rect = section.getBoundingClientRect();
      const dock = parseFloat(getComputedStyle(stage.current).top) || 0;
      const distance = Math.max(1, section.offsetHeight - stage.current.offsetHeight);
      const now = performance.now();
      const titleReady = expanded.current || isWorkflowTitleReady(titleReveal.current, now);
      const offset = dock - rect.top;
      // Collapse the used scroll runway while preserving the content's viewport position.
      if (!reduced && !compact && expanded.current && (offset < 0 || offset >= distance)) {
        finishJourney();
        return;
      }
      // Catch fast native scrolling at the title, before any cards or white fill appear.
      if (!reduced && !compact && !titleReady && offset > 0 && offset < distance) {
        wheelStop = { y: scrollY - offset, phase: 'title' };
        window.scrollTo({ top: wheelStop.y, behavior: 'instant' });
        rect = section.getBoundingClientRect();
      }
      const { openingProgress, step: nextStep } = getWorkflowScrollState(
        dock - rect.top,
        distance,
        innerHeight,
      );
      const targetSpread = expanded.current
        ? 1
        : titleReady
          ? smooth((openingProgress - 0.24) / 0.5)
          : 0;
      // Even a large wheel delta unfolds the composition continuously after the title finishes.
      const elapsed = Math.min(64, now - lastDraw);
      lastDraw = now;
      spread =
        reduced || compact
          ? 1
          : !titleReady
            ? 0
            : spread + (targetSpread - spread) * (1 - Math.exp(-elapsed / 180));
      if (Math.abs(targetSpread - spread) < 0.002) spread = targetSpread;
      const entry =
        reduced || compact ? 1 : smooth((innerHeight - rect.top) / (innerHeight - dock));
      if (preceding) {
        // Tall forms finish scrolling before they pin, keeping every field reachable.
        preceding.style.setProperty(
          '--business-dock',
          `${Math.min(dock, innerHeight - preceding.offsetHeight)}px`,
        );
        preceding.style.setProperty(
          '--workflow-overlay',
          reduced || compact ? '0' : entry.toFixed(4),
        );
      }
      section.style.setProperty('--workflow-entry', entry.toFixed(4));
      section.style.setProperty('--workflow-spread', spread.toFixed(4));
      section.style.setProperty('--workflow-copy', smooth((spread - 0.58) / 0.42).toFixed(4));
      section.style.setProperty('--workflow-reveal', smooth((spread - 0.18) / 0.82).toFixed(4));
      setRevealed(spread > 0.98);
      if (!reduced && !compact && spread > 0.98 && !expanded.current) {
        expanded.current = true;
        setIntroSeen(true);
      }
      if (!reduced && !compact && nextStep !== scrollStep) {
        scrollStep = nextStep;
        dispatch({ type: 'select', step: nextStep });
      }
      if (!reduced && !compact && spread !== targetSpread) frame = requestAnimationFrame(draw);
    };
    const schedule = () => {
      // Keep any native momentum at the same dock until a fresh gesture continues.
      if (wheelStop && Math.abs(scrollY - wheelStop.y) > 0.5)
        window.scrollTo({ top: wheelStop.y, behavior: 'instant' });
      if (!frame) frame = requestAnimationFrame(draw);
    };
    redraw.current = schedule;
    const releaseWheel = () => {
      wheelStop = null;
      lastWheel = 0;
      lastDirection = 0;
    };
    const wheel = (event) => {
      if (
        reduced ||
        compact ||
        event.defaultPrevented ||
        event.ctrlKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY)
      )
        return;
      if (event.target.closest('input,textarea,select,dialog,[role="dialog"],.nav-search-panel')) return;
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const now = performance.now();
      const quietFor = now - lastWheel;
      const direction = Math.sign(delta);
      const inertia = holdWorkflowStep(quietFor, direction, lastDirection);
      lastWheel = now;
      lastDirection = direction;
      if (wheelStop) {
        const hold =
          wheelStop.phase === 'title'
            ? delta > 0 && (!isWorkflowTitleReady(titleReveal.current, now) || inertia)
            : !expanded.current || inertia;
        if (hold) {
          if (event.cancelable) event.preventDefault();
          schedule();
          return;
        }
        wheelStop = null;
      }
      const dock = parseFloat(getComputedStyle(stage.current).top) || 0;
      const offset = dock - section.getBoundingClientRect().top;
      const distance = section.offsetHeight - stage.current.offsetHeight;
      const stop = getWorkflowWheelStop(
        offset,
        delta,
        distance,
        innerHeight,
        expanded.current || isWorkflowTitleReady(titleReveal.current, now),
      );
      if (!stop) return;
      if (stop.exit) {
        // Remove only the consumed runway before the browser applies this wheel normally.
        flushSync(finishJourney);
        return;
      }
      if (event.cancelable) event.preventDefault();
      wheelStop = {
        y: scrollY + stop.offset - offset,
        phase: stop.phase,
        step: stop.step,
      };
      window.scrollTo({ top: wheelStop.y, behavior: 'instant' });
      if (stop.phase !== 'title') {
        scrollStep = stop.step;
        dispatch({ type: 'scroll', step: stop.step });
      }
      schedule();
    };
    const resize = () => {
      releaseWheel();
      schedule();
    };
    const pointerDown = (event) => {
      if (
        event.pointerType === 'touch' ||
        event.target.closest('a,button,input,textarea,select') ||
        event.clientX >= document.documentElement.clientWidth
      )
        releaseWheel();
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    if (preceding) observer.observe(preceding);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', releaseWheel);
    window.addEventListener('pointerdown', pointerDown, { passive: true });
    window.addEventListener('resize', resize);
    draw();
    return () => {
      redraw.current = () => {};
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', releaseWheel);
      window.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('resize', resize);
      preceding?.style.removeProperty('--business-dock');
      preceding?.style.removeProperty('--workflow-overlay');
    };
  }, [reduced, compact, precedingRef, reading]);

  useEffect(() => {
    if (reduced) dispatch({ type: 'settle' });
  }, [reduced, state.target]);

  function selectStep(index) {
    if (!reduced && !compact && !reading) {
      const section = demo.current;
      const dock = parseFloat(getComputedStyle(stage.current).top) || 0;
      const { stepStart, stepRange } = getWorkflowScrollState(
        0,
        section.offsetHeight - stage.current.offsetHeight,
        innerHeight,
      );
      // Keep the pinned composition in place while the artwork completes its flip.
      window.scrollTo({
        top:
          scrollY +
          section.getBoundingClientRect().top -
          dock +
          stepStart +
          stepRange * (index + 0.12),
        behavior: 'instant',
      });
    }
    dispatch({ type: 'select', step: index });
  }

  return (
    <section
      className="lab-workflow"
      id="how-it-works"
      aria-labelledby="workflow-title"
      ref={demo}
      data-motion={reduced || compact ? 'static' : reading ? 'read' : 'scroll'}
      style={
        reading
          ? {
              '--workflow-entry': 1,
              '--workflow-spread': 1,
              '--workflow-copy': 1,
              '--workflow-reveal': 1,
            }
          : undefined
      }
    >
      {steps.map((item) => (
        <link
          key={item.image}
          rel="preload"
          as="image"
          href={`/assets/workflow-${item.image}.webp`}
        />
      ))}
      <div className="workflow-stage" ref={stage}>
        <div className="workflow-sheet">
          <span className="workflow-guide" aria-hidden="true" />
          <h2
            className="workflow-title lab-section-title"
            id="workflow-title"
            aria-label="MESHY CREATIVE LAB: How & Why it Works"
          >
            <MaskedHeading
              as="span"
              className="workflow-title-context"
              text="MESHY CREATIVE LAB"
              src="/assets/workflow-choose.webp"
              fillScale={1.3}
              parallax={12}
              reveal="float"
              triggerRef={demo}
              staticMotion={reduced || compact || introSeen}
              once
              stagger={titleStagger}
              onRevealChange={(complete) => updateTitleReveal('context', complete)}
            />
            <MaskedHeading
              as="span"
              className="workflow-title-main"
              text="How & Why it Works"
              renderChar={renderTitleChar}
              src="/assets/workflow-choose.webp"
              fillScale={1.3}
              parallax={34}
              reveal="float"
              triggerRef={demo}
              staticMotion={reduced || compact || introSeen}
              once
              stagger={titleStagger}
              onRevealChange={(complete) => updateTitleReveal('main', complete)}
            />
          </h2>
          <div className="workflow-action" inert={!revealed}>
            <SpecularButton
              className="workflow-start"
              radius={16}
              autoAnimate={revealed}
              intensity={3}
              speed={0.65}
              thickness={1.8}
              lineColor="#fffde5"
              onClick={onStartCreation}
            >
              <Sparkle size={20} weight="fill" aria-hidden="true" />
              Try an example
              <span className="workflow-start-arrow" aria-hidden="true">
                <ArrowRight size={19} />
              </span>
            </SpecularButton>
          </div>
          <div className="workflow-intro" aria-hidden={revealed}>
            <span>
              Scroll to discover <ArrowDown size={15} aria-hidden="true" />
            </span>
          </div>
          <div className="workflow-demo">
            <div className="workflow-visual">
              <div
                key={state.step}
                id="workflow-card"
                className="workflow-artwork"
                role="img"
                aria-label={steps[activeStep].alt}
                data-step={state.step + 1}
                data-next-step={state.next + 1}
                data-phase={state.phase}
                style={{ '--workflow-turn': `${-180 * state.direction}deg` }}
                onAnimationEnd={(event) => {
                  if (event.target === event.currentTarget) dispatch({ type: 'turned' });
                }}
              >
                <div className="workflow-face" aria-hidden="true">
                  <img
                    className="workflow-illustration"
                    src={`/assets/workflow-${step.image}.webp`}
                    alt=""
                    width="1920"
                    height="1080"
                  />
                </div>
                <div className="workflow-face workflow-face-back" aria-hidden="true">
                  <img
                    className="workflow-illustration"
                    src={`/assets/workflow-${incomingStep.image}.webp`}
                    alt=""
                    width="1920"
                    height="1080"
                  />
                </div>
              </div>
            </div>
            <div className="workflow-navigation" inert={!revealed}>
              <ol className="workflow-steps" aria-label="How & Why It Works steps">
                {steps.map((item, index) => (
                  <li
                    key={item.title}
                    className={
                      activeStep === index
                        ? 'is-current'
                        : index < activeStep
                          ? 'is-past'
                          : undefined
                    }
                  >
                    <button
                      className="workflow-step"
                      aria-current={activeStep === index ? 'step' : undefined}
                      aria-expanded={activeStep === index}
                      aria-controls={`workflow-description-${index}`}
                      onClick={() => selectStep(index)}
                    >
                      <span className="workflow-step-number">
                        <i
                          className="workflow-seed-anchor"
                          data-seed-anchor={activeStep === index ? 'workflow' : undefined}
                          aria-hidden="true"
                        />
                        Step {index + 1}
                      </span>
                      <span>{item.title}</span>
                    </button>
                    <div
                      className="workflow-step-copy"
                      id={`workflow-description-${index}`}
                      aria-hidden={activeStep !== index}
                      inert={activeStep !== index}
                    >
                      <div className="workflow-step-copy-inner">
                        <p className="workflow-benefit">{item.benefit}</p>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
