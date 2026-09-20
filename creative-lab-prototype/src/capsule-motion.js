export const CAPSULE_TIMING = { firstHit:360, secondHit:700, dock:760, open:800, formed:1100 };
export const CAPSULE_IMPACT = CAPSULE_TIMING.firstHit/CAPSULE_TIMING.dock;
export const CAPSULE_SECOND_IMPACT = CAPSULE_TIMING.secondHit/CAPSULE_TIMING.dock;
export const CAPSULE_TRAVEL_MS = CAPSULE_TIMING.formed;

// ponytail: solid hemispheres also protect the thin rims; eight decorative balls
// don't need a triangle-mesh physics engine. Contacts use each shell's live pose.
export function resolveSeedShellContacts(balls, shells) {
  for (let pass=0;pass<4;pass++) for (const ball of balls) for (const shell of shells) {
    const dx=ball.x-shell.x, dy=ball.y-shell.y, dz=(ball.z||0)-shell.z;
    const radius=shell.radius+ball.r+.012;
    const sectionRadiusSq=radius*radius-dz*dz;
    const cap=dx*shell.nx+dy*shell.ny+dz*shell.nz+ball.r+.012;
    if (sectionRadiusSq<=0 || cap<=0) continue;
    const distance=Math.hypot(dx,dy), radial=Math.sqrt(sectionRadiusSq)-distance;
    if (radial<=0) continue;
    const axis=Math.hypot(shell.nx,shell.ny), flat=axis>.0001?cap/axis:Infinity;
    const nx=flat<radial?-shell.nx/axis:distance>.0001?dx/distance:1;
    const ny=flat<radial?-shell.ny/axis:distance>.0001?dy/distance:0;
    const correction=Math.min(flat,radial)+.0001;
    ball.x+=nx*correction; ball.y+=ny*correction;
    const incoming=(ball.vx-(shell.vx||0))*nx+(ball.vy-(shell.vy||0))*ny;
    if (incoming<0) { ball.vx-=incoming*1.55*nx; ball.vy-=incoming*1.55*ny; }
  }
}

// An exact damped spring keeps the same weight at different frame rates.
export function advanceCapsuleSpring(state, goal, dt, impact = false) {
  const stiffness = impact ? 180 : 110, damping = impact ? 18 : 13;
  const decay = damping / 2, frequency = Math.sqrt(stiffness - decay * decay);
  const offset = state.position - goal, envelope = Math.exp(-decay * dt);
  const sin = Math.sin(frequency * dt), cos = Math.cos(frequency * dt);
  return {
    position: goal + envelope * (offset * cos + (state.velocity + decay * offset) * sin / frequency),
    velocity: envelope * (state.velocity * cos - (decay * state.velocity + stiffness * offset) * sin / frequency),
  };
}

// Dock at the exact 3D center before exchanging renderers at the same diameter.
// Growth uses a spring curve with zero velocity at both ends, including reverse.
export function capsuleArrival(progress) {
  const clamp=value=>Math.max(0,Math.min(1,value));
  const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
  const time=clamp(progress)*CAPSULE_TRAVEL_MS;
  const t=clamp((time-CAPSULE_TIMING.open)/(CAPSULE_TIMING.formed-CAPSULE_TIMING.open)), duration=.65;
  const start={position:0,velocity:0};
  const sample=advanceCapsuleSpring(start,1,t*duration);
  const end=advanceCapsuleSpring(start,1,duration);
  const growth=sample.position-(end.position-1)*smooth(t)-end.velocity*duration*(t*t*t-t*t);
  const flight=clamp(time/CAPSULE_TIMING.dock);
  // First hit: a restrained squash and full recovery beneath the rebound.
  // Second hit: compress once more, then shrink into the seed at the handoff.
  const pulse=(hit,rise,release)=>smooth((time-hit)/rise)*(1-smooth((time-hit-rise)/release));
  const letterImpact=.85*pulse(CAPSULE_TIMING.firstHit,50,230)+pulse(CAPSULE_TIMING.secondHit,40,110);
  const letterAbsorb=smooth((time-CAPSULE_TIMING.secondHit-20)/(CAPSULE_TIMING.open-CAPSULE_TIMING.secondHit-20));
  const handoff=smooth((time-CAPSULE_TIMING.dock)/(CAPSULE_TIMING.open-CAPSULE_TIMING.dock));
  return {flight,handoff,growth,letterImpact,letterAbsorb};
}

// The small seed accelerates toward the footer dock and rebounds once before growing.
// Both directions sample this same path; scrolling never determines its speed.
export function capsuleFlightPosition({ a, b, progress, contact=b, bounceHeight=44 }) {
  const t = Math.max(0, Math.min(1, progress));
  if (t >= CAPSULE_SECOND_IMPACT) {
    const u=(t-CAPSULE_SECOND_IMPACT)/(1-CAPSULE_SECOND_IMPACT), settle=u*u*(3-2*u);
    return {x:contact.x+(b.x-contact.x)*settle,y:contact.y+(b.y-contact.y)*settle,recess:0};
  }
  if (t >= CAPSULE_IMPACT) {
    const bounce=(t-CAPSULE_IMPACT)/(CAPSULE_SECOND_IMPACT-CAPSULE_IMPACT);
    return {x:contact.x,y:contact.y-4*bounceHeight*bounce*(1-bounce),recess:0};
  }
  const u = t / CAPSULE_IMPACT, v = 1 - u;
  return {
    x:v**3*a.x + 3*v*v*u*a.x + 3*v*u*u*contact.x + u**3*contact.x,
    y:v**3*a.y + 3*v*v*u*a.y + 3*v*u*u*(contact.y-180) + u**3*contact.y,
    recess:Math.sin(Math.PI*u)**2,
  };
}
