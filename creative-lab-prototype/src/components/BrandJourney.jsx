import { useEffect } from 'react';
import {
  advanceSeedJourney,
  businessMarkMotion,
  pointOnSeedPath,
  seedFlightPosition,
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
      const sheet = elements[3].querySelector('.workflow-sheet'),
        sheetBox = rect(sheet);
      const guide = elements[3].querySelector('.workflow-guide');
      const spread =
        elements[3].dataset.motion === 'scroll'
          ? Number(getComputedStyle(elements[3]).getPropertyValue('--workflow-spread')) || 0
          : 1;
      const intro = {
        x: sheetBox.left + sheetBox.width / 2,
        y: headings[3].top - 76,
        size: 22,
        round: 50,
        depth: 1,
      };
      const localProgress = smooth01((spread - 0.12) / 0.88);
      const local = pointOnSeedPath(
        [intro, { x: points[3].x, y: intro.y }, points[3]],
        localProgress,
      );
      const guidePoint = { ...local, size: 22 - 8 * localProgress, round: 50, depth: 1 };
      if (guide) {
        const scale = sheetBox.width / sheet.offsetWidth;
        guide.style.transform = `translate3d(${(local.x - sheetBox.left) / scale}px,${(local.y - sheetBox.top) / scale}px,0) translate(-50%,-50%)`;
        guide.style.width = guide.style.height = `${guidePoint.size}px`;
      }
      const playground = elements[6].querySelector('.finale-playground');
      points[6].size = 14;
      const dock =
        parseFloat(getComputedStyle(elements[3].querySelector('.workflow-stage')).top) || 84;
      const openingDock =
        boxes[0].top +
        (Number(elements[0].dataset.travel) || 0) -
        (parseFloat(getComputedStyle(document.querySelector('.opening-sticky')).top) || 84);
      const stops = points.map((p) => p.y - height * 0.35);
      stops[0] = openingDock;
      stops[3] = boxes[3].top - dock;
      stops[6] = boxes[6].top - height * 0.4;
      // Trigger once as the next anchor enters the reading area. A small dead
      // zone avoids repeated trips from tiny wheel movements near the boundary.
      let nextTarget = 0;
      for (let i = 1; i < stops.length; i++) {
        const trigger = i === 3 ? sheetBox.top - height * 0.55 : stops[i] - height * 0.2;
        if (scrollY >= trigger + (target >= i ? -24 : 24)) nextTarget = i;
      }
      const unfold =
        Number(
          getComputedStyle(document.querySelector('.opening-sticky')).getPropertyValue('--unfold'),
        ) || 0;
      const opening = scrollY <= openingDock + 1 && unfold < 1;
      target = opening ? 0 : nextTarget;
      const marking = daylight && (journey?.from === 2 || journey?.to === 2);
      journey = advanceSeedJourney(opening ? null : journey, {
        target,
        now,
        reducedMotion: reduced.matches,
        duration: journey?.to === 6 ? CAPSULE_TRAVEL_MS : marking ? 1400 : 1000,
      });
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
      } else if (holding) {
        pose = daylight && from === 2 ? markPoint(1) : from === 3 ? guidePoint : a;
      } else if (mark.drawing) {
        pose = markPoint(mark.ink);
        owner = 'business';
      } else {
        let landing;
        if (to === 1) {
          const firstLetter = document.createRange();
          firstLetter.setStart(headingNodes[1].firstChild, 0);
          firstLetter.setEnd(headingNodes[1].firstChild, 1);
          const m = rect(firstLetter);
          landing = { x: m.left + m.width / 2, y: headings[1].top - b.size / 2 - 2 };
        }
        const bend = Math.min(140, innerWidth * 0.075) * (from === 3 ? -1 : 1);
        const flight = smooth01(mark.flight);
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
            : seedFlightPosition({ a, b, landing, bend, progress: flight });
        const sizeProgress = to === 6 ? smooth01(finale.flight) : flight;
        pose = { ...p, size: a.size + (b.size - a.size) * sizeProgress, round: 50, depth: 1 };
        owner = names[to];
      }
      if (!pose) return;
      const obscuredByNav = pose.y - scrollY < 76;
      const hide = reduced.matches || (holding && !opening) || from === 6 || obscuredByNav;
      el.style.opacity = hide ? 0 : to === 6 ? 1 - finale.handoff : 1;
      // Paint above each backdrop but below its content. Foreground cards really
      // occlude the sphere; crossing a scene boundary preserves its page position.
      const ribbon = document.querySelector('.ribbon-scene');
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
      const host = opening
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
      el.style.transform = `translate3d(${x}px,${y}px,${z}px) translate(-50%,-50%)`;
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
      // The local sphere is visible before a route arrives, then hands off to the
      // traveller when leaving; only one of the two owns the visible mark.
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
      if (!document.hidden && (now < until || !holding || from !== target))
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
      el.remove();
    };
  }, [disabled]);
  return null;
}
