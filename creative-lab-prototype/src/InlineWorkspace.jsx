import React, { lazy, Suspense, useState } from 'react';
import { UploadSimple, ImageSquare, ArrowUp, ArrowRight, ArrowUpRight, ArrowCounterClockwise, WarningCircle, Sparkle, Check, Package, Printer, Heart, Plus, Minus, Coins, CaretDown } from '@phosphor-icons/react';

import CatalogueWorkspace from './CatalogueWorkspace.jsx';
import {creationSettings,creationEstimate} from './creation-settings.js';

const ThreePreview = lazy(()=>import('./ThreePreview.jsx'));
const asset = name => `/assets/${name}.webp`;

export default function InlineWorkspace({product, studio, stage, setStage, draft, busy, error, progress, isSaved, onCollapse, onUpload, onDrop, onPaste, onSample, onChange, onGenerate, onSave, onExample}) {
  const lamp=product.id==='lamp';
  const settings=creationSettings[product.id];
  const estimate=settings?creationEstimate(product.id,draft?.imageCount):null;
  const imageCount=estimate?.quantity;
  const referenceExample=settings?.exampleKind==='model'?settings.examples[(draft?.referenceExample||0)-1]:null;
  const changeCount=value=>{onChange({imageCount:Number(value)});setStage('setup');};
  const has3D=(lamp||product.id==='keychain')&&!referenceExample;
  const example=draft?.example||0;
  const examples=lamp?[{image:'lamp-dog',name:'Puppy lamp'},{image:'lamp-mountain',name:'Alpine lamp'}]:[{image:'corgi',name:'Corgi'},{image:'cat',name:'Cat'}];
  const preview=stage==='result';
  const size=draft?.size||150;
  const finish=draft?.finish||'#624632';
  const name=draft?.name||'';
  const [imageZoom,setImageZoom]=useState(1);
  if(product.inputKind) return <CatalogueWorkspace product={product} studio={studio} onCollapse={onCollapse} onSave={onSave} isSaved={isSaved}/>;
  const saveActions=<div className="save-area"><div className="output-note">{product.mode==='ship'?<Package size={19}/>:<Printer size={19}/>}<div><strong>{product.mode==='ship'?'Made & shipped':'Print at home'}</strong></div></div><button className="primary-button" onClick={onSave}>{isSaved?<ArrowRight size={17}/>:<Heart size={17}/>} {isSaved?'View in My Creations':'Save to My Creations'}</button><a className="workspace-continue" href={`https://www.meshy.ai/creative-lab/${product.route}`} target="_blank" rel="noreferrer">Continue in Meshy <ArrowUpRight size={15}/></a></div>;
  return <article ref={studio} id={`studio-${product.id}`} className={`inline-studio has-create-parameters ${preview&&has3D?'is-editing':''}`} aria-label={`${product.title} creation studio`} tabIndex={-1} onPaste={onPaste} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onCollapse();}}}>
    <div className={`workspace-body ${has3D||(lamp&&!preview)?'model-layout':'reference-layout'} ${preview?'has-preview':'is-setup'}`}>
      <section className="studio-controls" aria-label="Photo and design settings">
        <div className="studio-scroll">
        <h3>Source Photo</h3>
        <p className="studio-description">{product.input}.</p>
        <div className={`photo-uploader ${draft?.url?'populated':''} ${error?'invalid':''}`} onDragOver={e=>e.preventDefault()} onDrop={onDrop} aria-busy={busy}>
          {busy?<div className="photo-reading" role="status">Reading your photo…</div>:draft?.url?<><button className="workspace-photo" aria-label="Change photo" onClick={onUpload} disabled={stage==='generating'}><img src={draft.url} alt="Selected source photo"/><span><UploadSimple size={17}/>Change photo</span></button>{!draft.isSample&&<div className="workspace-photo-meta"><strong title={draft.filename}>{draft.filename}</strong></div>}</>:<button className="upload-dropzone" onClick={onUpload} aria-label="Click / Drag & Drop / Paste Image" aria-describedby={error?'upload-error':'upload-help'}><span className="upload-image-icon" aria-hidden="true"><ImageSquare size={32}/><ArrowUp size={17}/></span><strong>Click / Drag &amp; Drop / Paste Image</strong><span id="upload-help" className="upload-specs"><span>Supported Formats: .png, .jpg, .jpeg, .webp</span><span>Max size: {settings.maxMB}MB</span></span></button>}
        </div>
        {error&&<p id="upload-error" className="input-error" role="alert"><WarningCircle size={17}/>{error}</p>}
        {product.id==='keychain'&&<label className="name-field"><span>Name <small>Optional</small></span><div><input aria-label="Name" maxLength={10} value={name} disabled={stage==='generating'} onChange={e=>onChange({name:e.target.value})} placeholder="A name to remember…"/><span>{name.length}/10</span></div></label>}
        {settings.styles&&<label className="creation-style"><span>Style</span><select value={draft?.style||settings.styles[0]} disabled={busy||stage==='generating'} onChange={e=>{onChange({style:e.target.value});setStage('setup');}}>{settings.styles.map(style=><option key={style}>{style}</option>)}</select></label>}
        {product.id==='pet'&&<fieldset className="pose-control" disabled={busy||stage==='generating'}><legend>Pose</legend><div>{[['sitting','Sitting'],['curled','Curled up']].map(([value,label])=><label key={value}><input type="radio" name="pet-pose" value={value} checked={(draft?.pose||'sitting')===value} onChange={()=>{onChange({pose:value});setStage('setup');}}/><span>{label}</span></label>)}</div></fieldset>}
        {settings.maxCount&&<fieldset className="image-count-control" disabled={busy||stage==='generating'}><legend>Number of images</legend><div className="image-count-options"><div className="image-count-presets">{[1,2,3,4].map(count=><label key={count}><input type="radio" name="image-count" value={count} checked={imageCount===count} onChange={()=>changeCount(count)}/><span>{count}</span></label>)}</div>{settings.maxCount>4&&<div className="image-count-more" data-selected={imageCount>4}><select aria-label="More image counts" value={imageCount>4?imageCount:''} onChange={e=>changeCount(e.target.value)}><option value="" disabled>More</option>{[5,6,7,8].map(count=><option key={count} value={count}>{count}</option>)}</select><CaretDown size={14} aria-hidden="true"/></div>}</div></fieldset>}
        {settings.examples.length>0&&<div className="design-inspiration"><p>{settings.exampleKind==='model'?'Explore examples':'Need inspiration? Try these'}</p><div style={{'--example-columns':settings.examples.length>5?3:settings.examples.length}}>{settings.examples.map((item,i)=><button key={item.image} aria-label={settings.exampleKind==='model'?`Preview ${item.label}`:`Use ${item.label} example`} aria-pressed={(settings.exampleKind==='model'?draft?.referenceExample:draft?.inspiration)===i+1} disabled={busy||stage==='generating'} onClick={()=>{setImageZoom(1);onSample(i+1);}}><img src={asset(item.image)} alt={item.label}/></button>)}</div></div>}
        </div>
        <div className="generation-action creation-generation"><div className="generation-estimate" aria-live="polite"><span>{estimate.duration}</span><span aria-label={`${estimate.credits} credits`}><Coins size={16}/>{imageCount===1?settings.credits:`${settings.credits} × ${imageCount} = ${estimate.credits}`}</span></div><button className="primary-button" disabled={!draft?.url||busy||stage==='generating'} onClick={onGenerate}><Sparkle size={18}/>{stage==='generating'?'Preparing…':preview?'Redesign':'Start Design'}</button></div>
        {preview&&(!has3D?saveActions:<button className="secondary-button edit-source" onClick={()=>setStage('setup')}><ArrowCounterClockwise size={16}/> Edit photo</button>)}
      </section>

      <section className="workspace-view" aria-label={has3D?'3D example viewport':'Design reference'}>
        {has3D&&<div className="viewport-heading"><span>{lamp?'Example Model':'Photo Preview'}</span></div>}
        {has3D?<Suspense fallback={<div className="viewer-status" role="status">Opening 3D workspace…</div>}><ThreePreview product={product.id} example={example} size={size} finish={finish} lit={draft?.lit||false} photoUrl={product.id==='keychain'?draft?.url:undefined}/></Suspense>:<><div className="reference-canvas"><img className="workspace-reference" src={asset(referenceExample?.image||product.image)} alt={`${product.title}${referenceExample?` ${referenceExample.label}`:' design reference'}`} style={{transform:`scale(${imageZoom})`}}/></div><div className="viewer-toolbar" role="group" aria-label="Example image controls"><button aria-label="Zoom out example image" disabled={imageZoom<=0.8} onClick={()=>setImageZoom(z=>Math.max(.8,z-.2))}><Minus size={18}/></button><button aria-label="Zoom in example image" disabled={imageZoom>=1.8} onClick={()=>setImageZoom(z=>Math.min(1.8,z+.2))}><Plus size={18}/></button><i/><button aria-label="Reset example image" onClick={()=>setImageZoom(1)}><ArrowCounterClockwise size={18}/></button></div></>}
        {lamp&&has3D&&<div className="workspace-examples"><span>Examples</span><div>{examples.map((item,i)=><button key={item.name} onClick={()=>onExample(i,item.image)} aria-pressed={example===i} aria-label={`Explore ${item.name} 3D example`}><img src={asset(item.image)} alt=""/><span>{item.name}</span></button>)}</div></div>}
        {stage==='generating'&&<div className="generation-overlay"><div className="scanning-line"/><Sparkle size={40}/><h3>Preparing Preview…</h3><div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Preparing demo preview"><span style={{transform:`scaleX(${progress/100})`}}/></div></div>}
      </section>

      {preview&&has3D&&<section className="workspace-inspector" aria-label="Preview settings">
        <div className="inspector-fields"><h3>{lamp?'Size & Light':'Appearance'}</h3>
        {lamp?<>
          <label className="dimension-control"><span>Model width <strong>{size} mm</strong></span><input type="range" min="100" max="200" step="10" value={size} aria-label="Model width" onChange={e=>onChange({size:Number(e.target.value)})}/></label>
          <button className="light-toggle" aria-pressed={draft?.lit||false} onClick={()=>onChange({lit:!draft?.lit})}><span>Warm light</span><span className="switch-track"><i/></span></button>
          <details className="preparation-note"><summary>Print preparation</summary><p>Level the base, choose a light kit, then hollow and process the shell. These manufacturing steps are available in the full Meshy tool.</p><a href="https://www.meshy.ai/creative-lab/lamp" target="_blank" rel="noreferrer">Open lamp tool ↗</a></details>
        </>:has3D?<fieldset className="finish-control"><legend>Case color</legend><div>{[['#624632','Chestnut'],['#262d32','Midnight'],['#aa9772','Sand']].map(([color,label])=><label key={label} title={label}><input type="radio" name="case-color" value={color} checked={finish===color} onChange={()=>onChange({finish:color})}/><span style={{background:color}}>{finish===color&&<Check size={15}/>}</span><small>{label}</small></label>)}</div></fieldset>:null}
        </div>{saveActions}
      </section>}
    </div>

  </article>;
}
