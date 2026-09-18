import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ArrowCounterClockwise, Minus, Plus, ArrowsClockwise, GridFour, WarningCircle } from '@phosphor-icons/react';

export default function ThreePreview({ product, example = 0, photoUrl, finish = '#624632', size = 150, lit = false }) {
  const host = useRef(null);
  const api = useRef(null);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [spin, setSpin] = useState(false);
  const [grid, setGrid] = useState(true);
  const isLamp = product === 'lamp';

  useEffect(() => {
    const target = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setStatus('error'); return; }
    setStatus('loading'); setSpin(false);
    let alive = true;
    const abort = new AbortController();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .9;
    target.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D model');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
    const home = isLamp ? new THREE.Vector3(3.5, 2.8, 4.8) : new THREE.Vector3(2, 1.4, 5.2);
    camera.position.copy(home);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    // Wheel continues scrolling the catalog. Dedicated buttons/pinch handle zoom.
    controls.enableZoom = false;
    controls.minDistance = 2.2; controls.maxDistance = 10;
    controls.target.set(0, isLamp ? .8 : 1.2, 0);
    controls.maxPolarAngle = Math.PI * .86;
    controls.update(); controls.saveState();
    renderer.domElement.style.touchAction = 'pan-y';
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .55;
    room.dispose(); pmrem.dispose();
    scene.add(new THREE.HemisphereLight('#fff7e9', '#313c27', .65));
    const light = new THREE.DirectionalLight('#fff4dc', 1.9);
    light.position.set(3, 6, 4); scene.add(light);
    const floor = new THREE.GridHelper(5.1, 22, '#6c745a', '#41483a');
    floor.material.transparent = true; floor.material.opacity = .36;
    scene.add(floor);
    const model = new THREE.Group(); scene.add(model);
    const render = () => renderer.render(scene, camera);
    const materials = [];
    const textures = [];
    const makeMaterial = options => { const m = new THREE.MeshStandardMaterial(options); materials.push(m); return m; };
    const add = (geometry, material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x,y,z); model.add(mesh); return mesh;
    };
    let bodyMaterial;
    async function build() {
      try {
        if (isLamp) {
          const response = await fetch(`/models/lamp-${example === 1 ? 'mountain' : 'dog'}.stl`, {signal:abort.signal});
          if (!response.ok) throw new Error('Model unavailable');
          const geometry = new STLLoader().parse(await response.arrayBuffer());
          if (!alive) { geometry.dispose(); return; }
          geometry.rotateX(-Math.PI / 2); geometry.computeBoundingBox();
          const box = geometry.boundingBox;
          const center = box.getCenter(new THREE.Vector3());
          const extent = box.getSize(new THREE.Vector3());
          const scale = 2.6 / Math.max(extent.x, extent.z);
          geometry.translate(-center.x, -box.min.y, -center.z); geometry.scale(scale, scale, scale);
          bodyMaterial = makeMaterial({color:'#e3dcc9', roughness:.7, metalness:0});
          add(geometry, bodyMaterial);
        } else {
          bodyMaterial = makeMaterial({color:finish, roughness:.86});
          const metal = makeMaterial({color:'#c4ab73', metalness:.85, roughness:.27});
          const rim = add(new THREE.CylinderGeometry(1,1,.15,96), bodyMaterial,0,1.2,0);
          rim.rotation.x = Math.PI / 2;
          const bezel = add(new THREE.TorusGeometry(.87,.034,12,96),metal,0,1.2,.104);
          const stitch = makeMaterial({color:'#c3b598', roughness:1});
          for(let i=0;i<44;i++){
            const angle = i * Math.PI * 2 / 44;
            const s=add(new THREE.CapsuleGeometry(.006,.032,2,4),stitch,Math.cos(angle)*.94,1.2+Math.sin(angle)*.94,.082);
            s.rotation.z = angle;
          }
          const strap=add(new THREE.BoxGeometry(.26,.65,.12),bodyMaterial,0,2.28,-.04);
          add(new THREE.TorusGeometry(.26,.035,12,64),metal,0,2.75,0);
          add(new THREE.SphereGeometry(.065,16,12),metal,0,2.39,.05).scale.z=.35;
          const texture = await new THREE.TextureLoader().loadAsync(photoUrl || `/assets/${example === 1 ? 'cat' : 'corgi'}.webp`);
          if (!alive) { texture.dispose(); return; }
          textures.push(texture); texture.colorSpace = THREE.SRGBColorSpace;
          const ratio=texture.image.width/texture.image.height;
          if(ratio>1){texture.repeat.x=1/ratio;texture.offset.x=(1-1/ratio)/2;}
          else{texture.repeat.y=ratio;texture.offset.y=(1-ratio)/2;}
          add(new THREE.CircleGeometry(.84,96),makeMaterial({map:texture,roughness:.68}),0,1.2,.101);
          model.rotation.y=-.18;
        }
        if(!alive) return;
        api.current = {render, camera, controls, floor, model, bodyMaterial, renderer, scene, isLamp};
        setStatus('ready'); render();
      } catch(error) { if(alive && error.name!=='AbortError') setStatus('error'); }
    }
    build();
    const resize = () => { const {width,height}=target.getBoundingClientRect(); if(!width||!height)return; renderer.setSize(width,height); camera.aspect=width/height; camera.updateProjectionMatrix(); render(); };
    const observer=new ResizeObserver(resize); observer.observe(target); resize();
    controls.addEventListener('change',render);
    const lost = event => {event.preventDefault(); if(alive)setStatus('error');};
    renderer.domElement.addEventListener('webglcontextlost',lost);
    return () => {
      alive=false; abort.abort(); api.current=null; observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null);
      scene.traverse(object=>object.geometry?.dispose());
      materials.forEach(m=>m.dispose()); textures.forEach(t=>t.dispose()); floor.material.dispose();
      environment.dispose(); renderer.domElement.removeEventListener('webglcontextlost',lost); renderer.dispose(); renderer.domElement.remove();
    };
  },[product,example,photoUrl,attempt]);

  useEffect(()=>{
    const a=api.current; if(!a)return;
    a.floor.visible=grid;
    if(a.isLamp){a.model.scale.setScalar(size/150);a.bodyMaterial.color.set(lit?'#ffde97':'#e3dcc9');a.bodyMaterial.emissive.set(lit?'#ffa63f':'#000000');a.bodyMaterial.emissiveIntensity=lit?.55:0;}
    else a.bodyMaterial.color.set(finish);
    a.controls.autoRotate=spin; a.controls.autoRotateSpeed=1.2;
    a.renderer.setAnimationLoop(spin?()=>{a.controls.update();a.render();}:null);a.render();
  },[size,lit,finish,grid,spin,status]);
  function zoomBy(factor){const a=api.current;if(!a)return;const d=a.camera.position.clone().sub(a.controls.target);d.setLength(THREE.MathUtils.clamp(d.length()*factor,2.2,10));a.camera.position.copy(a.controls.target).add(d);a.controls.update();a.render();}

  return <div className="three-preview" data-viewer-state={status}>
    <div className="three-canvas" ref={host}/>
    {status==='loading'&&<div className="viewer-status" role="status"><span className="model-spinner"/>Loading 3D example…</div>}
    {status==='error'&&<div className="viewer-status viewer-error" role="alert"><WarningCircle size={28}/><strong>3D preview couldn’t load</strong><span>Your photo and settings are still here.</span><button className="secondary-button" onClick={()=>setAttempt(n=>n+1)}>Retry 3D preview</button></div>}
    <div className="viewer-toolbar" role="group" aria-label="3D view controls">
      <button aria-label="Zoom out 3D model" disabled={status!=='ready'} onClick={()=>zoomBy(1.2)}><Minus size={17}/></button>
      <button aria-label="Zoom in 3D model" disabled={status!=='ready'} onClick={()=>zoomBy(.8)}><Plus size={17}/></button><i/>
      <button aria-label="Reset 3D view" disabled={status!=='ready'} onClick={()=>{setSpin(false);api.current?.controls.reset();}}><ArrowCounterClockwise size={17}/></button>
      <button aria-label="Rotate 3D model automatically" aria-pressed={spin} disabled={status!=='ready'} onClick={()=>setSpin(v=>!v)}><ArrowsClockwise size={17}/></button>
      <button aria-label="Show ground grid" aria-pressed={grid} disabled={status!=='ready'} onClick={()=>setGrid(v=>!v)}><GridFour size={17}/></button>
    </div>
    <span className="viewer-hint">Drag to rotate · + / − to zoom</span>
  </div>;
}
