import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { smooth01 } from '../lib/brand-journey.js';
import { advanceSeeds, advanceCapsuleSpring, resolveSeedShellContacts } from '../lib/capsule-motion.js';

// Bespoke small scene inspired by React Bits' Ballpit: shared Three.js lighting,
// bounded sphere collisions, and pointer forces. No global touch/scroll handlers.
export default function SeedCapsule({ sectionRef }) {
  const host = useRef(null),
    api = useRef(null);
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const target = host.current,
      interaction = target.parentElement,
      section = sectionRef.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    target.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 1.4, 9.5);
    camera.lookAt(0, 0.25, 0);
    const room = new RoomEnvironment(),
      pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.7;
    room.dispose();
    pmrem.dispose();
    const hemisphere = new THREE.HemisphereLight('#f5ffd3', '#172006', 0.8);
    scene.add(hemisphere);
    const key = new THREE.DirectionalLight('#f9ffe7', 2);
    key.position.set(-3, 5, 5);
    scene.add(key);
    const rim = new THREE.PointLight('#b8ff37', 12, 12);
    rim.position.set(2, 1, -2);
    scene.add(rim);
    const geometries = [],
      materials = [];
    const geometry = (item) => {
      geometries.push(item);
      return item;
    };
    const material = (options) => {
      const item = new THREE.MeshPhysicalMaterial(options);
      materials.push(item);
      return item;
    };
    const lime = material({
      color: '#a4ed21',
      metalness: 0.14,
      roughness: 0.23,
      clearcoat: 1,
      clearcoatRoughness: 0.13,
      side: THREE.DoubleSide,
    });
    const dark = material({
      color: '#16220d',
      metalness: 0.55,
      roughness: 0.32,
      side: THREE.DoubleSide,
    });
    const chrome = material({ color: '#e6f1ce', metalness: 0.92, roughness: 0.16 });
    const soft = material({ color: '#e0ff92', metalness: 0.12, roughness: 0.32 });
    const capsule = new THREE.Group();
    scene.add(capsule);
    const lid = new THREE.Group(),
      bowl = new THREE.Group();
    capsule.add(lid, bowl);
    const shell = geometry(new THREE.SphereGeometry(1.14, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2));
    const lining = geometry(new THREE.SphereGeometry(1.11, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2));
    const lip = geometry(new THREE.TorusGeometry(1.125, 0.024, 10, 96));
    for (const [group, flip] of [
      [lid, false],
      [bowl, true],
    ]) {
      const outer = new THREE.Mesh(shell, lime),
        inner = new THREE.Mesh(lining, dark),
        edge = new THREE.Mesh(lip, chrome);
      if (flip) {
        outer.rotation.z = inner.rotation.z = Math.PI;
      }
      edge.rotation.x = Math.PI / 2;
      group.add(outer, inner, edge);
    }
    const coreTexture = new THREE.TextureLoader().load('/assets/meshy-icon.svg', () => {
      if (alive) wake();
    });
    coreTexture.colorSpace = THREE.SRGBColorSpace;
    const coreMaterial = new THREE.SpriteMaterial({
      map: coreTexture,
      transparent: true,
      toneMapped: false,
    });
    materials.push(coreMaterial);
    const core = new THREE.Sprite(coreMaterial);
    capsule.add(core);
    const ballGeometry = geometry(new THREE.SphereGeometry(1, 32, 24));
    const homes = [
      [-1.88, 0.4, 0.22],
      [1.65, 1.22, 0.28],
      [-1.35, 1.75, 0.15],
      [1.92, -0.85, 0.19],
      [-1.5, -1.3, 0.32],
      [0.87, -1.8, 0.16],
      [0.22, 2.18, 0.12],
      [2.18, 0.15, 0.1],
    ];
    const balls = homes.map(([x, y, r], i) => {
      const mesh = new THREE.Mesh(ballGeometry, [lime, chrome, soft][i % 3]);
      mesh.scale.setScalar(r);
      scene.add(mesh);
      return { x, y, vx: 0, vy: 0, homeX: x, homeY: y, r, mesh, z: ((i % 3) - 1) * 0.35 };
    });
    const contacts = [
      { group: lid, side: 1 },
      { group: bowl, side: -1 },
    ];
    const contactCenter = new THREE.Vector3(),
      contactNormal = new THREE.Vector3(),
      normalMatrix = new THREE.Matrix3();
    let frame = 0,
      visible = false,
      last = 0,
      isOpen = false;
    let openMotion = { position: 0, velocity: 0 },
      targetOpen = 0;
    let growth = Number(section.dataset.seedMorph) || 0,
      smallScale = 0.07;
    let idleUntil = performance.now() + 1800,
      alive = true,
      pointer = null,
      tiltX = 0,
      tiltY = 0;
    let viewTiltX = 0,
      viewTiltY = 0;
    const mouse = new THREE.Vector2(),
      raycaster = new THREE.Raycaster(),
      hit = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    function setOpen(value, manual = false) {
      const now = performance.now();
      section.style.setProperty('--capsule-manual', Number(manual));
      targetOpen = value ? 1 : 0;
      isOpen = value;
      setOpened(value);
      idleUntil = now + 5000;
      if (value)
        for (const [i, b] of balls.entries()) {
          b.vx = Math.cos(i * 2.4) * 3;
          b.vy = 2.4 + Math.sin(i);
        }
      wake();
    }
    function contact(event) {
      setOpen(event.detail);
    }
    function morph(event) {
      growth = event.detail;
      wake();
    }
    function draw(now) {
      frame = 0;
      if (!visible || document.hidden || !alive) return;
      const dt = Math.min((now - last) / 1000 || 1 / 60, 1 / 30);
      last = now;
      openMotion = reduced.matches
        ? { position: targetOpen, velocity: 0 }
        : advanceCapsuleSpring(openMotion, targetOpen, dt);
      const e = Math.max(0, openMotion.position);
      const scale = smallScale + (1 - smallScale) * growth;
      const reveal = smooth01((e - 0.12) / 0.88);
      viewTiltX = THREE.MathUtils.damp(viewTiltX, tiltX, 7, dt);
      viewTiltY = THREE.MathUtils.damp(viewTiltY, tiltY, 7, dt);
      capsule.scale.setScalar(scale);
      capsule.rotation.set(viewTiltY * 0.13, viewTiltX * 0.22, -0.13);
      lid.position.set(-e * 0.24, e * 1.18, -e * 0.12);
      lid.rotation.set(-e * 0.42, 0, -e * 0.18);
      bowl.position.set(e * 0.12, -e * 0.42, 0);
      bowl.rotation.z = e * 0.12;
      core.scale.setScalar(2.16 * reveal);
      capsule.updateWorldMatrix(true, true);
      for (const contact of contacts) {
        contactCenter.setFromMatrixPosition(contact.group.matrixWorld).divideScalar(scale);
        normalMatrix.getNormalMatrix(contact.group.matrixWorld);
        contactNormal.set(0, contact.side, 0).applyMatrix3(normalMatrix).normalize();
        contact.vx = contact.x === undefined ? 0 : (contactCenter.x - contact.x) / dt;
        contact.vy = contact.y === undefined ? 0 : (contactCenter.y - contact.y) / dt;
        Object.assign(contact, {
          x: contactCenter.x,
          y: contactCenter.y,
          z: contactCenter.z,
          nx: contactNormal.x,
          ny: contactNormal.y,
          nz: contactNormal.z,
          radius: (1.15 * contact.group.matrixWorld.getMaxScaleOnAxis()) / scale,
        });
      }
      if (reduced.matches)
        for (const b of balls) {
          b.x = b.homeX;
          b.y = b.homeY;
          b.vx = b.vy = 0;
        }
      const steps = Math.max(1, Math.ceil(dt * 120));
      for (let step = 0; step < steps; step++) {
        if (!reduced.matches && reveal > 0.01)
          advanceSeeds(balls, dt / steps, pointer, { x: 2.65, y: 2.65 });
        resolveSeedShellContacts(balls, contacts);
      }
      for (const b of balls) {
        b.mesh.position.set(b.x * scale, b.y * scale, b.z * scale);
        b.mesh.scale.setScalar(b.r * reveal * scale);
      }
      renderer.render(scene, camera);
      target.dataset.open = String(isOpen);
      target.style.setProperty('--capsule-open', e);
      section.style.setProperty('--capsule-scale', scale);
      section.style.setProperty('--capsule-shadow-scale', capsule.scale.x);
      // The orbit bursts out on the same spring as the shell, including its rebound.
      section.style.setProperty('--orbit-open', e);
      section.dataset.orbitSettled = String(
        targetOpen === 1 && Math.abs(e - 1) < 0.015 && Math.abs(openMotion.velocity) < 0.12,
      );
      const moving =
        Math.abs(targetOpen - openMotion.position) > 0.001 || Math.abs(openMotion.velocity) > 0.001;
      if (!reduced.matches && (moving || now < idleUntil)) frame = requestAnimationFrame(draw);
    }
    function wake() {
      if (!frame && visible && !document.hidden && alive) frame = requestAnimationFrame(draw);
    }
    function move(event) {
      if (event.pointerType === 'touch' || reduced.matches) return;
      const rect = target.getBoundingClientRect();
      mouse.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      tiltX = mouse.x;
      tiltY = mouse.y;
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, hit);
      pointer = { x: hit.x, y: hit.y };
      idleUntil = performance.now() + 1600;
      wake();
    }
    function leave() {
      pointer = null;
      tiltX = tiltY = 0;
      idleUntil = performance.now() + 1800;
      wake();
    }
    function resize() {
      const { width, height } = target.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < 1 ? 10.6 : 9.5;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      // Exchange the DOM dot and 3D sphere at the same center and pixel diameter.
      const center = new THREE.Vector3(0, 0, 0).project(camera);
      const edge = new THREE.Vector3(1.14, 0, 0).project(camera);
      const diameter = (edge.x - center.x) * width;
      smallScale = 14 / diameter;
      const dock = section.querySelector('[data-seed-anchor=finale]');
      dock.style.left = `${(center.x * 0.5 + 0.5) * 100}%`;
      dock.style.top = `${(-center.y * 0.5 + 0.5) * 100}%`;
      wake();
    }
    // Relight the existing scene when the theme changes, preserving its motion.
    function updateTheme() {
      const light = document.documentElement.dataset.theme === 'light';
      renderer.toneMappingExposure = light ? 0.9 : 0.85;
      scene.environmentIntensity = light ? 0.8 : 0.7;
      hemisphere.groundColor.set(light ? '#b8c8a9' : '#172006');
      hemisphere.intensity = 0.8;
      key.intensity = light ? 1.8 : 2;
      rim.color.set(light ? '#c7ff57' : '#b8ff37');
      rim.intensity = light ? 8 : 12;
      lime.color.set(light ? '#91ef00' : '#a4ed21');
      lime.roughness = light ? 0.3 : 0.23;
      dark.color.set(light ? '#bddf73' : '#16220d');
      dark.metalness = light ? 0.22 : 0.55;
      dark.roughness = light ? 0.4 : 0.32;
      chrome.color.set(light ? '#e7eee4' : '#e6f1ce');
      soft.color.set(light ? '#c9ff47' : '#e0ff92');
      wake();
    }
    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    updateTheme();
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          last = 0;
          wake();
        } else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { threshold: 0.01 },
    );
    observer.observe(target);
    const resizer = new ResizeObserver(resize);
    resizer.observe(target);
    const motion = () => {
      wake();
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        last = 0;
        wake();
      }
    };
    const lost = (event) => {
      event.preventDefault();
      setFailed(true);
      cancelAnimationFrame(frame);
      alive = false;
    };
    interaction.addEventListener('pointermove', move);
    interaction.addEventListener('pointerleave', leave);
    section.addEventListener('lab:seed-contact', contact);
    section.addEventListener('lab:seed-morph', morph);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', motion);
    api.current = { toggle: () => setOpen(!isOpen, true) };
    if (section.dataset.seedContact === 'true') setOpen(true);
    resize();
    setReady(true);
    return () => {
      alive = false;
      api.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      themeObserver.disconnect();
      section.style.removeProperty('--orbit-open');
      delete section.dataset.orbitSettled;
      section.style.removeProperty('--capsule-manual');
      section.style.removeProperty('--capsule-shadow-scale');
      interaction.removeEventListener('pointermove', move);
      interaction.removeEventListener('pointerleave', leave);
      section.removeEventListener('lab:seed-contact', contact);
      document.removeEventListener('visibilitychange', visibility);
      section.removeEventListener('lab:seed-morph', morph);
      reduced.removeEventListener('change', motion);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      coreTexture.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sectionRef]);
  return (
    <div className="capsule-experience" data-ready={ready && !failed}>
      <div className="capsule-canvas" ref={host} />
      {!failed && (
        <button
          className="capsule-toggle"
          aria-label={opened ? 'Close the creative sphere' : 'Open the creative sphere'}
          aria-pressed={opened}
          disabled={!ready}
          onClick={() => api.current?.toggle()}
        >
          <span className="capsule-hit" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
