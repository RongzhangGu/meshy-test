import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceCapsuleSpring, capsuleArrival, capsuleFlightPosition, resolveSeedShellContacts, CAPSULE_IMPACT, CAPSULE_SECOND_IMPACT, CAPSULE_TRAVEL_MS, CAPSULE_TIMING } from './capsule-motion.js';
import { advanceSeeds } from './brand-journey.js';

test('particles bounce off moving, tilted hemispheres and their rims throughout opening and closing', () => {
  const shell={x:0,y:0,z:0,nx:0,ny:1,nz:0,radius:1.15,vx:0,vy:0};
  const side={x:1.15,y:.3,z:0,r:.2,vx:-2,vy:0};
  const rim={x:1.14,y:-.05,z:0,r:.2,vx:0,vy:2};
  resolveSeedShellContacts([side,rim],[shell]);
  assert.ok(side.vx>0,'inward velocity reflects from the outer surface');
  assert.ok(rim.y<-.2 && rim.vy<0,'the open rim also has a collision boundary');
  const carried={x:0,y:1.3,z:0,r:.15,vx:0,vy:0};
  resolveSeedShellContacts([carried],[{...shell,y:.3,vy:2}]);
  assert.ok(carried.y>1.6 && carried.vy>2,'a moving lid transfers momentum');

  const balls=Array.from({length:8},(_,i)=>({x:Math.cos(i)*1.9,y:Math.sin(i)*1.9,z:(i%3-1)*.35,
    homeX:Math.cos(i)*1.9,homeY:Math.sin(i)*1.9,r:.12+(i%3)*.08,vx:0,vy:0}));
  for(let frame=0;frame<720;frame++) {
    const phase=frame/60, open=(1-Math.cos(phase*2))*.5, angle=Math.sin(phase)*.35;
    const shells=[{...shell,x:-open*.24,y:open*1.18,z:-open*.12,nx:-Math.sin(angle),ny:Math.cos(angle)},
      {...shell,x:open*.12,y:-open*.42,nx:Math.sin(angle),ny:-Math.cos(angle)}];
    for(let step=0;step<4;step++) {
      advanceSeeds(balls,1/120,{x:Math.cos(phase*3)*1.6,y:Math.sin(phase*3)*1.6},{x:2.65,y:2.65});
      resolveSeedShellContacts(balls,shells);
    }
    for(const b of balls) for(const s of shells) {
      const dx=b.x-s.x,dy=b.y-s.y,dz=b.z-s.z;
      assert.ok(Math.hypot(dx,dy,dz)>=s.radius+b.r+.011 || dx*s.nx+dy*s.ny+dz*s.nz<=-b.r-.011,
        'every rendered particle clears the shell including its radius');
      assert.ok(Number.isFinite(b.vx)&&Number.isFinite(b.vy));
    }
  }
});
import { advanceSeedJourney } from './brand-journey.js';

test('capsule springs open continuously, overshoot gently and settle independently of frame rate', () => {
  const samples=[];
  for(const fps of [30,60,120]){
    let spring={position:0,velocity:0}, peak=0;
    for(let frame=0;frame<fps*3;frame++){
      const previous=spring.position;
      spring=advanceCapsuleSpring(spring,1,1/fps);
      assert.ok(Math.abs(spring.position-previous)<.18,'no instant open assignment');
      peak=Math.max(peak,spring.position);
      if(frame===fps-1)samples.push(spring.position);
    }
    assert.ok(peak>1.04&&peak<1.1,'one restrained elastic release');
    assert.ok(Math.abs(spring.position-1)<.00001);
    assert.ok(Math.abs(spring.velocity)<.00001);
  }
  assert.ok(Math.max(...samples)-Math.min(...samples)<1e-10);
});

test('impact compresses the shell before dissipating and reversing a spring preserves its position', () => {
  let impact={position:0,velocity:3}, peak=0;
  for(let frame=0;frame<180;frame++){
    impact=advanceCapsuleSpring(impact,0,1/60,true);
    peak=Math.max(peak,impact.position);
  }
  assert.ok(peak>.08&&peak<.15);
  assert.ok(Math.abs(impact.position)<.00001);
  let opening={position:0,velocity:0};
  for(let frame=0;frame<12;frame++)opening=advanceCapsuleSpring(opening,1,1/60);
  const closing=advanceCapsuleSpring(opening,0,1/60);
  assert.ok(Math.abs(closing.position-opening.position)<.1,'reversing changes force, not the current pose');
});

test('footer flight lands at its dock, rebounds above it and retraces the same continuous path', () => {
  const route={a:{x:400,y:900},b:{x:1050,y:1750}}, samples=[];
  for(let i=0;i<=1000;i++){
    const p=capsuleFlightPosition({...route,progress:i/1000});
    const previous=samples.at(-1);
    if(previous)assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<4);
    if(i/1000>CAPSULE_IMPACT)assert.ok(p.y<=route.b.y);
    samples.push(p);
  }
  assert.deepEqual(samples[0],{...route.a,recess:0});
  assert.deepEqual(capsuleFlightPosition({...route,progress:CAPSULE_IMPACT}),{...route.b,recess:0});
  assert.deepEqual(samples.at(-1),{...route.b,recess:0});
  assert.equal(capsuleFlightPosition({...route,progress:(CAPSULE_IMPACT+CAPSULE_SECOND_IMPACT)/2}).y,route.b.y-44);
  for(let i=1000;i>=0;i--)assert.deepEqual(capsuleFlightPosition({...route,progress:i/1000}),samples[i]);
  let trip=advanceSeedJourney(null,{target:5,now:0});
  trip=advanceSeedJourney(trip,{target:6,now:700,duration:CAPSULE_TRAVEL_MS});
  trip=advanceSeedJourney(trip,{target:6,now:700+CAPSULE_TRAVEL_MS/2,duration:CAPSULE_TRAVEL_MS});
  assert.equal(trip.progress,.5);
  trip=advanceSeedJourney(trip,{target:6,now:700+CAPSULE_TRAVEL_MS,duration:CAPSULE_TRAVEL_MS});
  assert.equal(trip.from,6,'the flight completes without another scroll event');
});

test('the dot docks before its matched-size handoff and grows without an endpoint snap', () => {
  assert.deepEqual(capsuleArrival(0),{flight:0,handoff:0,growth:0,letterImpact:0,letterAbsorb:0});
  assert.deepEqual(capsuleArrival(1),{flight:1,handoff:1,growth:1,letterImpact:0,letterAbsorb:1});
  const samples=[];
  for(let i=0;i<=1000;i++){
    const p=capsuleArrival(i/1000);
    if(p.handoff>0)assert.equal(p.flight,1,'renderers exchange only after the landing is complete');
    if(p.growth>0)assert.equal(p.handoff,1,'growth cannot start while the DOM dot is visible');
    assert.ok(p.growth>=0&&p.growth<1.12);
    const previous=samples.at(-1);
    if(previous)assert.ok(Math.abs(p.growth-previous.growth)<.02);
    samples.push(p);
  }
  assert.ok(1-capsuleArrival(.9999).growth<.00001,'growth settles without an endpoint snap');
  for(let i=1000;i>=0;i--)assert.deepEqual(capsuleArrival(i/1000),samples[i]);
});

test('the first hit squashes and releases the letter; only the second hit absorbs it', () => {
  const route={a:{x:400,y:900},b:{x:1050,y:1750},contact:{x:1050,y:1705}};
  const touch=CAPSULE_TIMING.firstHit/CAPSULE_TRAVEL_MS, secondTouch=CAPSULE_TIMING.secondHit/CAPSULE_TRAVEL_MS;
  const before=capsuleArrival(touch-.04), at=capsuleArrival(touch), pressed=capsuleArrival(touch+50/CAPSULE_TRAVEL_MS);
  assert.equal(before.letterImpact,0,'anticipation must not look like an early collision');
  assert.deepEqual(capsuleFlightPosition({...route,progress:at.flight}),{...route.contact,recess:0});
  assert.equal(at.letterAbsorb,0,'the full letter is still present at contact');
  assert.equal(pressed.letterImpact,.85);
  assert.equal(pressed.letterAbsorb,0,'show the compression before dissolving the glyph');
  assert.equal(capsuleArrival(secondTouch-.02).letterImpact,0,'the letter recovers before the second hit');
  for(let p=touch;p<=secondTouch;p+=.005)assert.equal(capsuleArrival(p).letterAbsorb,0,'the full letter remains throughout the rebound');
  const second=capsuleArrival(secondTouch);
  assert.deepEqual(capsuleFlightPosition({...route,progress:second.flight}),{...route.contact,recess:0});
  assert.equal(second.letterAbsorb,0);
  const merging=capsuleArrival(secondTouch+60/CAPSULE_TRAVEL_MS);
  assert.ok(merging.letterAbsorb>0 && merging.letterAbsorb<1);
  assert.equal(capsuleArrival(CAPSULE_TIMING.open/CAPSULE_TRAVEL_MS).letterAbsorb,1,'the letter is absorbed as the local sphere takes over');
  assert.deepEqual(capsuleFlightPosition({...route,progress:1}),{...route.b,recess:0});
  let previous=capsuleArrival(0), point=capsuleFlightPosition({...route,progress:0});
  for(let i=1;i<=1000;i++){
    const next=capsuleArrival(i/1000), nextPoint=capsuleFlightPosition({...route,progress:next.flight});
    for(const key of ['letterImpact','letterAbsorb']) {
      assert.ok(next[key]>=0 && next[key]<=1);
      assert.ok(Math.abs(next[key]-previous[key])<.08,'the letter has no pose discontinuity');
    }
    assert.ok(Math.hypot(nextPoint.x-point.x,nextPoint.y-point.y)<7,'contact and dock remain one continuous path');
    previous=next;point=nextPoint;
  }
});

test('growth and natural-speed opening overlap to finish around 1.5 seconds', () => {
  for(const fps of [30,60,120]) {
    let spring={position:0,velocity:0}, lastUnsettled=0, overlap=false;
    for(let frame=1;frame<=fps*2.5;frame++) {
      const elapsed=frame/fps*1000, arrival=capsuleArrival(elapsed/CAPSULE_TRAVEL_MS);
      spring=advanceCapsuleSpring(spring,arrival.handoff===1?1:0,1/fps);
      if(arrival.growth>0 && arrival.growth<1 && spring.position>.1)overlap=true;
      if(Math.abs(spring.position-1)>=.015 || Math.abs(spring.velocity)>=.12)lastUnsettled=elapsed;
    }
    assert.ok(overlap,'the shell unfolds as it grows instead of waiting for another animation');
    const total=lastUnsettled+1000/fps;
    assert.ok(total>=1450 && total<=1550,`complete and settled after ${Math.round(total)} ms at ${fps} fps`);
  }
});
