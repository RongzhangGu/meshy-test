export const clamp01 = value => Math.max(0, Math.min(1, value));
export const smooth01 = value => { const t = clamp01(value); return t * t * (3 - 2 * t); };

// The pen stroke shares the trip clock, so pauses and reversals retain its tip.
export function businessMarkMotion({ from, to, progress }) {
  if (from === to) return { ink:from === 2 ? 1 : 0, flight:progress, drawing:false };
  if (to === 2) return { ink:smooth01((progress-.6)/.4), flight:clamp01(progress/.6), drawing:progress>=.6 };
  if (from === 2) return { ink:1-smooth01(progress/.4), flight:clamp01((progress-.4)/.6), drawing:progress<=.4 };
  return { ink:0, flight:progress, drawing:false };
}

// Scroll chooses the destination; elapsed time completes the trip independently.
// A short rest prevents a fast scroll from turning arrivals into a continuous tour.
export function advanceSeedJourney(state, { target, now, reducedMotion = false, duration = 1000 }) {
  const rest = at => ({ from:at, to:at, progress:0, lastTime:now, restUntil:now+700 });
  if(!state || reducedMotion) return rest(target);
  if(state.from===state.to){
    if(target===state.from || now<state.restUntil) return {...state,lastTime:now};
    return {from:Math.min(state.from,target),to:Math.max(state.from,target),progress:target>state.from?0:1,lastTime:now};
  }
  const direction=target<=state.from?-1:1;
  const progress=clamp01(state.progress+direction*Math.max(0,now-state.lastTime)/duration);
  if(direction<0 && progress===0) return rest(state.from);
  if(direction>0 && progress===1) return rest(state.to);
  return {...state,progress,lastTime:now};
}

// Linear distance along a route: one continuous position, even when
// the source heading has scrolled out of view. Never clamp a source to the viewport.
export function pointOnSeedPath(points, progress) {
  const t = clamp01(progress);
  if (t === 0) return {x:points[0].x,y:points[0].y};
  if (t === 1) return {x:points.at(-1).x,y:points.at(-1).y};
  const lengths = points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
  let remaining = lengths.reduce((sum,n)=>sum+n,0)*t;
  for (let i=0;i<lengths.length;i++) {
    if (remaining<=lengths[i] && lengths[i]>0) {
      const u=remaining/lengths[i],a=points[i],b=points[i+1];
      return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
    }
    remaining-=lengths[i];
  }
  return {x:points.at(-1).x,y:points.at(-1).y};
}

// Direct, reversible spatial arcs. The sphere recedes between destinations and
// comes back to the content plane at either anchor; scene layers handle occlusion.
export function seedFlightPosition({ a, b, progress, bend=80, landing }) {
  const t=clamp01(progress);
  if(t===0)return {x:a.x,y:a.y,recess:0};
  if(t===1)return {x:b.x,y:b.y,recess:0};
  if(landing&&t>=.65){
    const u=(t-.65)/.35;
    if(u<.25)return {x:landing.x,y:landing.y-64+64*(u/.25)**2,recess:0};
    if(u<.8){
      const hop=(u-.25)/.55;
      return {x:landing.x+(b.x-landing.x)*hop,y:landing.y-88*hop*(1-hop),recess:0};
    }
    return {x:b.x,y:landing.y+(b.y-landing.y)*smooth01((u-.8)/.2),recess:0};
  }
  const end=landing?{x:landing.x,y:landing.y-64}:b;
  const u=landing?t/.65:t, v=1-u, dy=end.y-a.y;
  return {
    x:v**3*a.x+3*v*v*u*(a.x+bend)+3*v*u*u*(end.x+(landing?0:bend))+u**3*end.x,
    y:v**3*a.y+3*v*v*u*(a.y+dy*.3)+3*v*u*u*(end.y-dy*.3)+u**3*end.y,
    recess:Math.sin(Math.PI*u)**2,
  };
}

// One small, bounded particle field, intentionally capped at eight objects.
export function advanceSeeds(balls, dt, pointer, bounds) {
  dt = Math.min(dt, 1 / 30);
  for (const ball of balls) {
    ball.vx += (ball.homeX - ball.x) * dt * 1.6;
    ball.vy += (ball.homeY - ball.y) * dt * 1.6;
    if (pointer) {
      const dx = ball.x - pointer.x, dy = ball.y - pointer.y;
      const distance = Math.max(.01, Math.hypot(dx, dy));
      if (distance < 1.1) {
        const force = (1.1 - distance) * 24 * dt;
        ball.vx += (dx || .01) / distance * force;
        ball.vy += dy / distance * force;
      }
    }
    const damping = Math.exp(-1.9 * dt);
    ball.vx *= damping; ball.vy *= damping;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    const xLimit = bounds.x - ball.r, yLimit = bounds.y - ball.r;
    if (Math.abs(ball.x) > xLimit) { ball.x = Math.sign(ball.x) * xLimit; ball.vx *= -.8; }
    if (Math.abs(ball.y) > yLimit) { ball.y = Math.sign(ball.y) * yLimit; ball.vy *= -.8; }
  }
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
    const a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y;
    const distance = Math.hypot(dx, dy), min = a.r + b.r;
    if (distance >= min) continue;
    const nx = distance > .001 ? dx / distance : 1, ny = distance > .001 ? dy / distance : 0;
    const overlap = (min - distance) / 2;
    a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap;
    const approaching = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (approaching < 0) { a.vx += approaching * nx * .9; a.vy += approaching * ny * .9; b.vx -= approaching * nx * .9; b.vy -= approaching * ny * .9; }
  }
}
