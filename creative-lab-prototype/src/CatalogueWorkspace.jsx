import React from 'react';
import {ArrowRight, ArrowUpRight, Heart, MapTrifold, Cube} from '@phosphor-icons/react';

// Terrain starts from a region; Pixleap is a display, not a photo-generation tool.
export default function CatalogueWorkspace({product,studio,onCollapse,onSave,isSaved}) {
  const terrain=product.inputKind==='map';
  return <article ref={studio} id={`studio-${product.id}`} className="inline-studio" aria-label={`${product.title} preview`} tabIndex={-1} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();onCollapse();}}}>
    <div className="workspace-body reference-layout has-preview">
      <section className="studio-controls" aria-label={terrain?'Terrain region':'Display details'}>
        <div className="studio-scroll">
          <h3>{terrain?'Map region':'Your models, on display'}</h3>
          <p className="studio-description">{terrain?'Choose a region on the world map, or import a GPX / KML route.':'Bring your 3D creations to a dedicated desktop display.'}</p>
          {terrain&&<figure className="terrain-source"><img src={`/assets/${product.source}.webp`} alt="Example mountain region"/><figcaption>Example region</figcaption></figure>}
          <div className="workspace-note">{terrain?<MapTrifold size={18}/>:<Cube size={18}/>}<p>{terrain?'Example preview. Choose your own region in Meshy’s terrain editor.':'Pixleap is a physical display. View the product for setup and purchasing details.'}</p></div>
        </div>
        <div className="save-area">
          {terrain&&<button className="secondary-button" onClick={onSave}>{isSaved?<ArrowRight size={17}/>:<Heart size={17}/>} {isSaved?'View in My creations':'Save to My creations'}</button>}
          <a className="primary-button" href={`https://www.meshy.ai/creative-lab/${product.route}`} target="_blank" rel="noreferrer">{terrain?'Open terrain editor':'View Pixleap'}<ArrowUpRight size={17}/></a>
        </div>
      </section>
      <section className="workspace-view" aria-label={`${product.title} example`}>
        <div className="viewport-heading"><span>{terrain?'Terrain reference':'Product preview'}</span></div>
        <div className="reference-canvas"><img className="workspace-reference" src={`/assets/${product.image}.webp`} alt={`${product.title} reference`}/></div>
      </section>
    </div>
  </article>;
}
