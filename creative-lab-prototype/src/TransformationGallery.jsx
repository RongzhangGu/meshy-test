import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Play, Images } from '@phosphor-icons/react';
import { products } from './products.js';

export default function TransformationGallery({onCreate}) {
  const [photos,setPhotos]=useState(false);
  const [run,setRun]=useState(0);
  const [running,setRunning]=useState(false);
  const [only,setOnly]=useState(null);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function play(id=null) {setPhotos(false);setOnly(id);if(!reduced()){setRun(n=>n+1);setRunning(true);}}
  useEffect(()=>{if(!running)return;const t=setTimeout(()=>setRunning(false),2300);return()=>clearTimeout(t);},[run,running]);
  return <>
    <div className="exhibition-heading"><div><h2>See a photo become something new.</h2><p>Explore all 7 creations. Then make one yours.</p></div><div className="transformation-controls"><button aria-pressed={photos} onClick={()=>{setRunning(false);setPhotos(v=>!v);}}><Images size={16}/>{photos?'Show objects':'Show starting images'}</button><button className="replay-all" onClick={()=>play()}><Play size={14} weight="fill"/>Replay transformations</button></div></div>
    <div className={`exhibition transformation-gallery ${photos?'show-photos':''}`} role="group" aria-label="Seven example transformations">
      <img className="sprite-preloader" src="/assets/exhibition-objects.png" alt="" onLoad={()=>{if(!run&&!reduced())play();}}/>
      {products.map((p,i)=>{const animating=running&&(!only||only===p.id);return <article key={p.id} className={`exhibit-piece exhibit-${p.id} ${animating?'is-transforming':''}`} style={{'--reveal-delay':`${only?0:i*.11}s`}}><button className="exhibit-art transformation-replay" aria-label={`Replay ${p.title} transformation`} onClick={()=>play(p.id)}><span className="exhibit-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><span className="object-plinth"/><span key={`object-${run}`} className={`exhibit-sprite sprite-${p.id}`} role="img" aria-label={`${p.title} example result`}/><span key={`source-${run}`} className="transformation-source"><img src={`/assets/${p.source}.webp`} alt={p.id==='magnet'?'Landscape artwork reference':`${p.title} example source photo`}/><span>{p.id==='magnet'?'A favorite scene.':'It starts with a photo.'}</span></span><span className="transformation-scan" key={`scan-${run}`}/><span className="replay-hint"><Play size={10} weight="fill"/> Replay</span></button><div className="exhibit-label"><span><strong>{p.title}</strong><small>{p.mode==='ship'?'Made & shipped':'Print at home'}</small></span><button id={`object-${p.id}`} className="exhibit-cta" aria-label={`Make your own ${p.title}`} aria-controls="workbench-panel" onClick={()=>onCreate(p.id)}><span>Make yours</span><ArrowUpRight size={19}/></button></div></article>;})}
      <div className="exhibition-note"><span>PHOTO <ArrowRight size={12}/> PERSONAL OBJECT</span><span>Example transformations · Your photo is added when you start.</span></div>
    </div>
  </>;
}
