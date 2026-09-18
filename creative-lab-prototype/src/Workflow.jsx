import React, { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, ArrowDown, Sparkle } from '@phosphor-icons/react';
import { getWorkflowScrollState, initialWorkflow, workflowTransition } from './workflow-transition.js';
import MaskedHeading from './MaskedHeading.jsx';
import SpecularButton from './SpecularButton.jsx';

const compactQuery = '(max-width: 760px), (max-height: 840px)';

// Original Meshy workflow illustrations; provenance is in public/assets/sources.json.
const steps = [
  { title: 'Choose your creation', image: 'choose', benefit: 'Made for the real world', description: 'Choose a figure, keepsake or everyday object to turn into a physical creation.', alt: 'Choose from a figure, lamp, keycap, magnet and fidget' },
  { title: 'Design with AI', image: 'design', benefit: 'No modeling experience needed', description: 'Upload a photo or describe an idea. AI does the modeling for you.', alt: 'A reference image becomes a 3D cowboy figure with AI' },
  { title: 'Preview & customize', image: 'preview', benefit: 'No extra design fee', description: 'Design with credits. Preview every angle and refine the details before making it real.', alt: 'Rotate and inspect the cowboy figure in a 3D preview' },
  { title: 'Print or order', image: 'print', benefit: 'Make it your way', description: 'Print at home, or order a finished creation where delivery is available. Physical orders are paid separately.', alt: 'Print the figure at home or receive it in a delivery box' },
];

export default function Workflow({ onStartCreation, precedingRef }) {
  const [state, dispatch] = useReducer(workflowTransition, initialWorkflow);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const demo = useRef(null);
  const stage = useRef(null);
  const [compact, setCompact] = useState(() => matchMedia(compactQuery).matches);
  const [revealed, setRevealed] = useState(false);
  const step = steps[state.step];

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
    const section = demo.current;
    const preceding = precedingRef?.current;
    let frame = 0;
    let scrollStep = -1;
    const clamp = value => Math.min(1, Math.max(0, value));
    const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    const draw = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const dock = parseFloat(getComputedStyle(stage.current).top) || 0;
      const distance = Math.max(1, section.offsetHeight - stage.current.offsetHeight);
      const { openingProgress, step: nextStep } = getWorkflowScrollState(dock - rect.top, distance, innerHeight);
      // Finish the visible character reveal before the title moves and the cards open.
      const spread = reduced || compact ? 1 : smooth((openingProgress - .24) / .5);
      const entry = reduced || compact ? 1 : smooth((innerHeight - rect.top) / (innerHeight - dock));
      if (preceding) {
        // Tall forms finish scrolling before they pin, keeping every field reachable.
        preceding.style.setProperty('--business-dock', `${Math.min(dock, innerHeight - preceding.offsetHeight)}px`);
        preceding.style.setProperty('--workflow-overlay', reduced || compact ? '0' : entry.toFixed(4));
      }
      section.style.setProperty('--workflow-entry', entry.toFixed(4));
      section.style.setProperty('--workflow-spread', spread.toFixed(4));
      section.style.setProperty('--workflow-copy', smooth((spread - .58) / .42).toFixed(4));
      section.style.setProperty('--workflow-reveal', smooth((spread - .18) / .82).toFixed(4));
      setRevealed(spread > .98);
      if (!reduced && !compact && nextStep !== scrollStep) {
        scrollStep = nextStep;
        dispatch({ type: 'select', step: nextStep });
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    if (preceding) observer.observe(preceding);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    draw();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      preceding?.style.removeProperty('--business-dock');
      preceding?.style.removeProperty('--workflow-overlay');
    };
  }, [reduced, compact, precedingRef]);

  useEffect(() => {
    if (reduced) dispatch({ type: 'settle' });
  }, [reduced, state.target]);

  function selectStep(index) {
    if (!reduced && !compact) {
      const section = demo.current;
      const dock = parseFloat(getComputedStyle(stage.current).top) || 0;
      const { stepStart, stepRange } = getWorkflowScrollState(0, section.offsetHeight - stage.current.offsetHeight, innerHeight);
      // All four targets share the pinned composition; only the artwork crossfades.
      window.scrollTo({ top: scrollY + section.getBoundingClientRect().top - dock + stepStart + stepRange * (index + .12), behavior: 'instant' });
    }
    dispatch({ type: 'select', step: index });
  }

  return <section className="lab-workflow" id="how-it-works" aria-labelledby="workflow-title" ref={demo} data-motion={reduced || compact ? 'static' : 'scroll'}>
    <div className="workflow-stage" ref={stage}>
      <div className="workflow-sheet">
        <h2 className="workflow-title" id="workflow-title" aria-label="How & Why It Works">
          <MaskedHeading as="span" text="How & Why It Works" src="/assets/workflow-choose.webp" fillScale={1.3} parallax={34} reveal="float" triggerRef={demo} staticMotion={reduced || compact}/>
        </h2>
        <div className="workflow-action" inert={!revealed}>
          <SpecularButton className="workflow-start" radius={16} autoAnimate={revealed} intensity={3} speed={.65} thickness={1.8} lineColor="#fffde5" onClick={onStartCreation}>
            <Sparkle size={20} weight="fill" aria-hidden="true"/>
            Try an example
            <span className="workflow-start-arrow" aria-hidden="true"><ArrowRight size={19}/></span>
          </SpecularButton>
        </div>
        <div className="workflow-intro" aria-hidden={revealed}>
          <span>Discover the process <ArrowDown size={15} aria-hidden="true"/></span>
        </div>
        <div className="workflow-demo">
          <div className="workflow-visual">
            <div id="workflow-card" className="workflow-artwork" role="img" aria-label={step.alt} data-step={state.step + 1} data-phase={state.phase}
              onAnimationEnd={event => { if (event.target === event.currentTarget) dispatch({ type: 'turned' }); }}>
              <img className="workflow-illustration" src={`/assets/workflow-${step.image}.webp`} alt="" width="1920" height="1080"/>
            </div>
          </div>
          <div className="workflow-navigation" inert={!revealed}>
            <ol className="workflow-steps" aria-label="How & Why It Works steps">
              {steps.map((item, index) => <li key={item.title} className={state.target === index ? 'is-current' : undefined}>
                <button className="workflow-step" aria-current={state.target === index ? 'step' : undefined} aria-expanded={state.target === index} aria-controls={`workflow-description-${index}`} onClick={() => selectStep(index)}>
                  <span className="workflow-step-number">Step {index + 1}</span><span>{item.title}</span>
                </button>
                <div className="workflow-step-copy" id={`workflow-description-${index}`} hidden={state.target !== index}>
                  <p className="workflow-benefit">{item.benefit}</p>
                  <p>{item.description}</p>
                </div>
              </li>)}
            </ol>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
