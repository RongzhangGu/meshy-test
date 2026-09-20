import { useEffect } from 'react';
import {
  advanceSeedJourney,
  advanceSeedDrop,
  getSeedDropRoute,
  isSeedHeadingVisible,
  advanceSeedReveal,
  businessMarkMotion,
  pointOnSeedPath,
  seedFlightPosition,
  workflowEntryPosition,
  smooth01,
} from '../lib/brand-journey.js';
import { CAPSULE_TRAVEL_MS, capsuleArrival, capsuleFlightPosition } from '../lib/capsule-motion.js';
import './brand-journey.css';

const names = ['catalog', 'shelf', 'business', 'workflow', 'faq', 'toolkit', 'finale'];
const selectors = [
  '.kinetic-catalog',
  '.creation-shelf',
  '.business-stage',
  '.lab-workflow',
  '.lab-faq',
  '.lab-toolkit',
  '.creation-finale',
];

export default function BrandJourney({ disabled }) {
  useEffect(() => {
    if (disabled) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    // Own this decorative node outside React so it can move between real scene
    // layers without moving or duplicating any interactive content.
    const el = document.createElement('div');
    el.className = 'brand-seed';
    el.setAttribute('aria-hidden', 'true');
    const page = document.querySelector('main');
    page.appendChild(el);
    let frame = 0,
      until = 0;
    let journey = null,
      target = 0;
    let sectionDrop = null;
    let contentReveal = null;
    let workflowHop = null;
    let workflowDotSize = 0;
    const rect = (node) => {
      const r = node.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top + scrollY,
        bottom: r.bottom + scrollY,
        width: r.width,
        height: r.height,
      };
    };
    const anchor = (name, size) => {
      const node = document.querySelector(`[data-seed-anchor="${name}"]`);
      if (!node) return null;
      const r = rect(node);
      return {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        size: size ?? r.width,
        round: 50,
        depth: 1,
      };
    };
    function draw(now) {
      frame = 0;
      const elements = selectors.map((s) => document.querySelector(s));
      if (elements.some((e) => !e)) {
        el.style.opacity = 0;
        return;
      }
      const height = innerHeight;
      const daylight = document.documentElement.dataset.theme === 'light';
      const points = names.map((name, i) => anchor(name, i === 3 ? 14 : undefined));
      if (points.some((p) => !p)) {
        el.style.opacity = 0;
        return;
      }
      const boxes = elements.map(rect);
      const headingNodes = [
        document.getElementById('page-title'),
        document.getElementById('my-creations-title'),
        null,
        document.getElementById('workflow-title'),
        document.getElementById('questions-title'),
        document.getElementById('toolkit-title'),
      ];
      const headings = headingNodes.map((n) => (n ? rect(n) : null));
      const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
      const titleVisible = (i) => isSeedHeadingVisible(headings[i], scrollY + navHeight, scrollY + height);
      const sheet = elements[3].querySelector('.workflow-sheet'),
        sheetBox = rect(sheet);
      const guide = elements[3].querySelector('.workflow-guide');
      const spread =
        elements[3].dataset.motion === 'scroll'
          ? Number(getComputedStyle(elements[3]).getPropertyValue('--workflow-spread')) || 0
          : 1;
      const intro = anchor('workflow-title');
      if (!intro) return;
      const titleDot = elements[3].querySelector('[data-seed-anchor="workflow-title"]');
      const titleLine = rect(titleDot.closest('.scroll-float-text'));
      const sheetScale = sheetBox.width / sheet.offsetWidth;
      const titleRevealing = elements[3].dataset.motion === 'scroll'
        && elements[3].dataset.titleRevealed !== 'true'
        && boxes[3].top - scrollY <= height * 0.45 + 1;
      // The sphere waits in the sheet, then the rising i picks it up. Its own
      // paint stays outside the glyph's opacity, clipping and stretch animation.
      intro.y = Math.min(intro.y, titleLine.top + titleLine.height * 0.78, scrollY + height - 32);
      intro.size = parseFloat(getComputedStyle(titleDot).width) * sheetScale;
      workflowHop = advanceSeedJourney(workflowHop, {
        target: spread > 0.12 ? 1 : 0,
        now,
        duration: 760,
        reducedMotion: reduced.matches || elements[3].dataset.motion !== 'scroll',
      });
      const hopping = workflowHop.from !== workflowHop.to;
      const localProgress = hopping ? workflowHop.progress : workflowHop.to;
      if (localProgress === 0) workflowDotSize = intro.size;
      const local = workflowEntryPosition({
        a: intro, b: points[3], progress: localProgress,
        lift: Math.min(140, Math.max(0, Math.min(intro.y, points[3].y) - sheetBox.top - 48)),
      });
      const guidePoint = {
        ...local, size: workflowDotSize + (14 - workflowDotSize) * localProgress, round: 50, depth: 1,
      };
      if (guide) {
        // The hop owns its clock; a CSS transition would damp away its impulse.
        guide.style.transition = hopping ? 'none' : '';
        guide.style.transform = `translate3d(${(local.x - sheetBox.left) / sheetScale}px,${(local.y - sheetBox.top) / sheetScale}px,0) translate(-50%,-50%) rotate(${local.rotation}deg) scale(${local.scaleX},${local.scaleY})`;
        guide.style.width = guide.style.height = `${guidePoint.size / sheetScale}px`;
      }
      const playground = elements[6].querySelector('.finale-playground');
      points[6].size = 14;
      const dock =
        parseFloat(getComputedStyle(elements[3].querySelector('.workflow-stage')).top) || 84;
      const catalogDock =
        parseFloat(getComputedStyle(document.querySelector('.opening-sticky')).top) || 84;
      const openingDock = boxes[0].top + (Number(elements[0].dataset.travel) || 0) - catalogDock;
      const stops = points.map((p) => p.y - height * 0.35);
      stops[0] = openingDock;
      stops[3] = boxes[3].top - dock;
      stops[6] = boxes[6].top - height * 0.4;
      // Falling journeys start as the destination heading first enters view.
      const shelfStart = Math.max(openingDock + 1, headings[1].top - height + 1);
      const faqStart = headings[4].top - height + 1;
      const toolkitStart = headings[5].top - height + 1;
      // Trigger once as the next anchor enters the reading area. A small dead
      // zone avoids repeated trips from tiny wheel movements near the boundary.
      let nextTarget = 0;
      for (let i = 1; i < stops.length; i++) {
        const trigger = i === 3 ? sheetBox.top - height * 0.55 : stops[i] - height * 0.2;
        const threshold = i === 1
          ? Math.max(openingDock + 1, shelfStart - (target >= i ? 24 : 0))
          : i === 4 || i === 5
          ? (i === 4 ? faqStart : toolkitStart) - (target >= i ? 24 : 0)
          : trigger + (target >= i ? -24 : 24);
        if (scrollY >= threshold) nextTarget = i;
      }
      // A fast scroll can expose the short shelf and Business together. Show the shelf's
      // drop while its heading is still visible, then let Business take over below it.
      const shelfHeadingY = headings[1].top - scrollY;
      if (nextTarget === 2 && shelfHeadingY >= catalogDock && shelfHeadingY < height)
        nextTarget = 1;
      const unfold =
        Number(
          getComputedStyle(document.querySelector('.opening-sticky')).getPropertyValue('--unfold'),
        ) || 0;
      const opening = scrollY <= openingDock + 1 && unfold < 1;
      target = opening ? 0 : nextTarget;
      if (!opening) {
        for (const source of [0, 4]) {
          if (!titleVisible(source)) continue;
          if (target === source + 1) target = source;
          // Scrolling back to a readable heading docks the dot immediately.
          if (journey?.from === source && journey.to === source + 1) {
            journey = { from: source, to: source, progress: 0, lastTime: now };
            sectionDrop = null;
          }
        }
      }
      // A direct arrival at a drop destination gets the same visible entrance.
      if (!journey && (target === 1 || target === 4 || target === 5))
        journey = { from: target - 1, to: target - 1, progress: 0, lastTime: now };
      const business = target === 2 || journey?.from === 2 || journey?.to === 2;
      const enteringWorkflow = journey?.from === 2 && (target === 3 || journey.to === 3);
      const dropFrom = getSeedDropRoute(journey, target);
      // Read the painted guide, including an unfinished step transition, rather
      // than jumping to the new step's target anchor at the moment of departure.
      const guideBox = dropFrom === 3 ? rect(guide) : null;
      const sourcePoint = guideBox
        ? { x: guideBox.left + guideBox.width / 2, y: guideBox.top + guideBox.height / 2 }
        : points[dropFrom];
      const dropSource = dropFrom === null ? null : {
        x: sourcePoint.x, y: Math.max(sourcePoint.y - scrollY, catalogDock + 16),
      };
      // FAQ → Toolkit must start a fresh fall after Workflow → FAQ settles.
      if (sectionDrop?.route !== dropFrom) sectionDrop = null;
      const dropTrip = !opening && !reduced.matches && dropFrom !== null
        && journey?.from >= dropFrom && journey?.to <= dropFrom + 1
        && (journey.from !== target || journey.from !== journey.to);
      if (dropTrip) {
        const landing = points[dropFrom + 1];
        sectionDrop = advanceSeedDrop(sectionDrop || (target === dropFrom
          ? { x: landing.x, y: landing.y - scrollY } : null), {
          a: dropSource, b: { x: landing.x, y: landing.y - scrollY }, now, target: target - dropFrom,
        });
        sectionDrop.route = dropFrom;
        journey = sectionDrop.phase === 'settled'
          ? { from: target, to: target, progress: 0, lastTime: now }
          : { from: dropFrom, to: dropFrom + 1, progress: sectionDrop.progress, lastTime: now };
      } else {
        sectionDrop = null;
        journey = advanceSeedJourney(opening ? null : journey, {
          target,
          now,
          reducedMotion: reduced.matches,
          duration: journey?.to === 6
            ? CAPSULE_TRAVEL_MS
            : enteringWorkflow
              ? (daylight ? 1100 : 660)
              : business
              ? (daylight ? 650 : 450)
              : 1000,
        });
      }
      const { from, to } = journey;
      const holding = from === to;
      const progress = smooth01(journey.progress);
      const mark = daylight
        ? businessMarkMotion(journey)
        : { ink: 0, flight: journey.progress, drawing: false };
      const markNode = elements[2].querySelector('.business-mark');
      const markPoint = (ink) => {
        const box = rect(markNode),
          path = markNode.firstElementChild;
        const point = path.getPointAtLength(path.getTotalLength() * ink);
        return {
          x: box.left + (point.x * box.width) / 300,
          y: box.top + (point.y * box.height) / 16,
          size: 14,
          round: 50,
          depth: 1,
        };
      };
      // Keep the section trigger in place; only its visual landing changes.
      if (daylight) points[2] = markPoint(0);
      const finale = capsuleArrival(from === 6 ? 1 : to === 6 ? mark.flight : 0);
      const holdingWorkflow = from === 3 && holding;
      let pose,
        owner = '';
      const a = points[from],
        b = to === 3 ? guidePoint : points[to];
      const carryingSource = !opening && holding && (from === 0 || from === 4);
      const pinnedToHeading = carryingSource && titleVisible(from);
      if (opening) {
        const heroNode = document.querySelector('[data-seed-anchor=hero]');
        const hero = rect(heroNode),
          h = { x: hero.left + hero.width / 2, y: hero.top + hero.height / 2 };
        const p = pointOnSeedPath([h, points[0]], unfold);
        pose = {
          ...p,
          size: hero.width + (points[0].size - hero.width) * unfold,
          round: unfold * 50,
          depth: unfold,
        };
        owner = 'opening';
      } else if (carryingSource) {
        // On the landing frame the old route still exists; carry the newly
        // active heading, never that route's departure point.
        pose = pinnedToHeading ? a : { ...a, y: Math.max(a.y - scrollY, catalogDock + 16) + scrollY };
        owner = names[from];
      } else if (holding) {
        pose = daylight && from === 2 ? markPoint(1) : from === 3 ? guidePoint : a;
      } else if (sectionDrop) {
        pose = {
          ...a, x: sectionDrop.x, y: sectionDrop.y + scrollY, recess: 0,
          size: a.size + (b.size - a.size) * sectionDrop.progress,
        };
        owner = names[to];
      } else if (mark.drawing) {
        pose = markPoint(mark.ink);
        owner = 'business';
      } else {
        const bend = Math.min(140, innerWidth * 0.075) * (from === 3 ? -1 : 1);
        const flight = enteringWorkflow ? mark.flight : smooth01(mark.flight);
        const letterBox = to === 6 ? rect(elements[6].querySelector('.finale-letter')) : null;
        const contact = letterBox
          ? { x: b.x, y: letterBox.top + letterBox.height * 0.32 - b.size / 2 }
          : undefined;
        const p =
          to === 6
            ? capsuleFlightPosition({
                a,
                b,
                contact,
                bounceHeight: Math.min(64, letterBox.height * 0.5),
                progress: finale.flight,
              })
            : enteringWorkflow
              ? workflowEntryPosition({
                  a, b, progress: flight,
                  lift: Math.min(76, Math.max(0, Math.min(a.y, b.y) - scrollY - 96)),
                })
              : seedFlightPosition({ a, b, bend, progress: flight });
        const sizeProgress = to === 6 ? smooth01(finale.flight) : flight;
        pose = { ...p, size: a.size + (b.size - a.size) * sizeProgress, round: 50, depth: 1 };
        owner = names[to];
      }
      if (!pose) return;
      const fadingArrival = holding && contentReveal?.route === from - 1 && contentReveal.opacity < 1;
      const protectedRoute = !opening && (from === 0 || from === 4) && (holding || to === from + 1)
        ? from
        : fadingArrival ? contentReveal.route : null;
      if (protectedRoute !== null) {
        const section = elements[protectedRoute];
        const regions = protectedRoute === 0
          ? [...section.querySelectorAll('.opening-model')].map((node) => {
              const card = rect(node);
              // Keep gaps between rows quiet; reveal beside an incomplete last
              // row as soon as the last card in the ball's column is cleared.
              return { ...card, left: card.left - 12, right: card.right + 12, top: headings[0].top };
            })
          : [
              { ...rect(section.querySelector('.faq-results')), top: headings[4].top },
              ...[...section.querySelectorAll('.faq-help > *')].map((node) => ({ ...rect(node), padding: 2 })),
            ];
        const reveal = advanceSeedReveal(contentReveal?.route === protectedRoute ? contentReveal : null, {
          x: pose.x,
          y: pose.y,
          radius: pose.size / 2,
          regions,
          now,
        });
        contentReveal = { ...reveal, route: protectedRoute };
      } else contentReveal = null;
      const obscuredByNav = pose.y - scrollY < 76;
      const hide = reduced.matches || pinnedToHeading
        || (holding && !opening && !carryingSource && !fadingArrival) || from === 6 || obscuredByNav;
      el.style.opacity = hide ? 0 : contentReveal?.opacity ?? (to === 6 ? 1 - finale.handoff : 1);
      // Paint above each backdrop but below its content. Foreground cards really
      // occlude the sphere; crossing a scene boundary preserves its page position.
      const ribbon = document.querySelector('.ribbon-scene');
      const dropping = carryingSource || Boolean(sectionDrop);
      const workflowEntry = enteringWorkflow && !holding;
      el.classList.toggle('is-dropping', dropping);
      el.classList.toggle('is-workflow-entry', workflowEntry);
      const layers = [
        ribbon,
        elements[1],
        elements[2],
        elements[2].querySelector('.business-story'),
        sheet,
        elements[4],
        elements[5],
        playground,
      ];
      const host = dropping || workflowEntry
        ? page
        : opening
          ? ribbon
          : layers.findLast((node) => {
              const r = rect(node);
              return pose.x >= r.left && pose.x <= r.right && pose.y >= r.top && pose.y <= r.bottom;
            }) || page;
      if (el.parentNode !== host) host.appendChild(el);
      const hostBox = rect(host),
        scaleX = hostBox.width / host.offsetWidth;
      const scaleY = host === sheet ? scaleX : hostBox.height / host.offsetHeight;
      let x = (pose.x - hostBox.left) / scaleX,
        y = (pose.y - hostBox.top) / scaleY;
      const recess = pose.recess || 0,
        z = host === ribbon ? -220 * recess : 0;
      if (z) {
        const projection = 1000 / (1000 - z);
        x = host.clientWidth / 2 + (x - host.clientWidth / 2) / projection;
        y = host.clientHeight / 2 + (y - host.clientHeight / 2) / projection;
      }
      el.style.transform = `translate3d(${x}px,${y}px,${z}px) translate(-50%,-50%) rotate(${pose.rotation || 0}deg) scale(${pose.scaleX || 1},${pose.scaleY || 1})`;
      el.style.width =
        el.style.height = `${(pose.size * (host === ribbon ? 1 : 1 - 0.28 * recess)) / (host === sheet ? 1 : scaleX)}px`;
      el.style.filter = `brightness(${1 - 0.2 * recess}) blur(${0.3 * recess}px)`;
      el.style.borderRadius = `${pose.round}%`;
      el.style.setProperty('--seed-depth', pose.depth);
      const root = document.documentElement;
      root.dataset.seedMoving = hide ? '' : owner;
      root.dataset.seedDeparting = hide ? '' : names[from];
      const active = holding ? from : progress > 0.65 ? to : from;
      elements.forEach((section, i) => {
        section.dataset.seedActive = i === active ? 'true' : 'false';
        section.dataset.seedTravelling = String(!holding && !opening && (i === from || i === to));
        if (i <= active) section.dataset.seedVisited = 'true';
      });
      // Handoff at the same position and size; the sphere never inherits the
      // hidden letter's opacity. The glyph dot is only a measurement anchor here.
      elements[3].dataset.seedTitle = localProgress === 0
        ? holdingWorkflow ? 'docked' : 'waiting'
        : 'released';
      guide.style.opacity = holdingWorkflow ? 1 : 0;
      const light =
        holding && from === 2
          ? 1
          : to === 2
            ? smooth01((progress - 0.8) / 0.2)
            : from === 2
              ? 1 - smooth01(progress / 0.2)
              : 0;
      elements[2].style.setProperty('--seed-light', light);
      elements[2].style.setProperty('--business-mark-progress', mark.ink);
      elements[2].style.setProperty(
        '--business-mark-rest',
        Number(daylight && holding && from === 2),
      );
      // Opening overlaps growth after the handoff; no extra pause or third impact.
      elements[6].style.setProperty('--seed-handoff', finale.handoff);
      elements[6].style.setProperty('--letter-impact', finale.letterImpact);
      elements[6].style.setProperty('--letter-absorb', finale.letterAbsorb);
      const shadowProximity =
        from === 6
          ? 1
          : to === 6
            ? smooth01(
                1 -
                  Math.hypot(pose.x - points[6].x, pose.y - points[6].y) /
                    (playground.clientHeight * 0.75),
              )
            : 0;
      elements[6].style.setProperty('--seed-shadow-proximity', shadowProximity);
      if (elements[6].dataset.seedMorph !== String(finale.growth)) {
        elements[6].dataset.seedMorph = String(finale.growth);
        elements[6].dispatchEvent(new CustomEvent('lab:seed-morph', { detail: finale.growth }));
      }
      const contact = from === 6 || (to === 6 && finale.handoff === 1);
      if (elements[6].dataset.seedContact !== String(contact)) {
        elements[6].dataset.seedContact = String(contact);
        elements[6].dispatchEvent(new CustomEvent('lab:seed-contact', { detail: contact }));
      }
      if (!document.hidden && (now < until || !holding || from !== target || fadingArrival
        || (contentReveal?.since != null && contentReveal.opacity < 1)
        || (holdingWorkflow && (titleRevealing || hopping))))
        frame = requestAnimationFrame(draw);
    }
    const schedule = () => {
      until = performance.now() + 900;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const resizer = new ResizeObserver(schedule);
    document
      .querySelectorAll('main,.lab-workflow,.creation-finale')
      .forEach((n) => resizer.observe(n));
    const observer = new MutationObserver(schedule),
      steps = document.querySelector('.workflow-steps');
    if (steps)
      observer.observe(steps, { attributes: true, subtree: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', schedule);
      document
        .querySelectorAll('[data-seed-travelling]')
        .forEach((n) => delete n.dataset.seedTravelling);
      delete document.documentElement.dataset.seedMoving;
      delete document.documentElement.dataset.seedDeparting;
      delete document.querySelector('.lab-workflow')?.dataset.seedTitle;
      el.remove();
    };
  }, [disabled]);
  return null;
}
