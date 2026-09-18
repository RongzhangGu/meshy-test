import React, {useEffect, useRef} from 'react';
import {ArrowUpRight} from '@phosphor-icons/react';
import {products, openingProducts} from './products.js';
import {catalogueFilters,matchingCreations} from './discovery-data.js';
import {clamp, catalogueLayout, openingLayout} from './opening-layout.js';
import {OPENING_SETTLE, openingProgress, holdCatalogueScroll} from './opening-scroll.js';
import ProductCutout from './ProductCutout.jsx';
import {GlowButton} from './components/ui/glow-button.jsx';
import './creative-opening.css';


export default function CreativeOpening({query,catalogueFilter,onFilter,onCreate,startExpanded,tools}) {
  const root = useRef(null), scene = useRef(null), cards = useRef([]);
  const phase = useRef(-.4), paused = useRef(false), reveal = useRef(()=>{});
  const matches = new Set(matchingCreations(query,catalogueFilter));
  const searching=Boolean(query.trim());
  const filtering=searching||catalogueFilter!=='all';
  const shownProducts=products.filter(product=>matches.has(product.id));

  useEffect(()=>{
    const element=root.current, surface=scene.current;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const pointer=matchMedia('(hover: hover) and (pointer: fine)');
    let frame=0, last=0, visible=true, width=0, height=0, top=0, travel=0, settledTravel=0, inset=0;
    let stop=null, stopUsed=false, lastWheel=0, previousY=window.scrollY;
    const landing=()=>Math.max(0,top+settledTravel-inset);
    const canStop=()=>!filtering&&!reduced.matches&&pointer.matches;
    function dock(){
      stopUsed=true;
      stop={since:performance.now(),effort:0,events:0};
      element.dataset.scrollLocked='true';
      window.scrollTo({top:landing(),behavior:'instant'});
    }
    function releaseStop(){stop=null;stopUsed=true;lastWheel=0;delete element.dataset.scrollLocked;}
    function measure(){
      if(stop&&!canStop())releaseStop();
      width=surface.clientWidth; height=element.querySelector('.opening-size-reference').clientHeight;
      top=element.getBoundingClientRect().top+window.scrollY;
      inset=parseFloat(getComputedStyle(surface).top)||0;
      travel=parseFloat(getComputedStyle(element).getPropertyValue('--opening-travel'))||260;
      settledTravel=Math.round(travel*OPENING_SETTLE);
      schedule();
    }
    function draw(time,settled=false){
      frame=0;
      const progress=settled||reduced.matches||filtering?1:openingProgress(window.scrollY-top+inset,travel);
      const moving=visible&&!paused.current&&!document.hidden&&!reduced.matches&&progress<1;
      if(moving&&last)phase.current+=Math.min(time-last,50)*.00024*(1-progress);
      last=time;
      surface.style.setProperty('--unfold',progress);
      const mobile=window.innerWidth<=760;
      const ease=progress*progress*(3-2*progress);
      surface.style.setProperty('--detail',ease);
      surface.style.setProperty('--photo-reveal',clamp((progress-.38)/.42));
      surface.style.setProperty('--arrow-reveal',clamp((progress-.65)/.3));
      const layout=catalogueLayout(width,mobile,shownProducts.length);
      const catalogueHeight=shownProducts.length?layout.height:340;
      const sceneHeight=height+(catalogueHeight-height)*ease;
      surface.style.height=`${sceneHeight}px`;
      element.style.height=`${sceneHeight+(reduced.matches||filtering?0:settledTravel)}px`;
      element.dataset.travel=reduced.matches||filtering?0:settledTravel;
      element.dataset.expanded=progress===1?'true':'false';
      element.dataset.browsing=progress>.32?'true':'false';
      openingLayout(width,height,progress,phase.current,mobile,shownProducts.length,openingProducts.length).forEach((pose,index)=>{
        const card=cards.current[index];
        // Scale the complete card so artwork, typography and spacing keep their proportions.
        const renderWidth=pose.width/layout.cardScale, renderHeight=pose.height/layout.cardScale;
        card.style.width=`${renderWidth}px`; card.style.height=`${renderHeight}px`;
        card.style.transform=`translate3d(${pose.x-(renderWidth-pose.width)/2}px,${pose.y-(renderHeight-pose.height)/2}px,${pose.z}px) rotateY(${pose.rotateY}deg) rotateZ(${pose.rotateZ}deg) scale(${pose.scale*layout.cardScale})`;
        card.style.opacity=pose.opacity;
        card.style.visibility=pose.opacity === 0?'hidden':'visible';
        card.tabIndex=index>=openingProducts.length&&progress<1?-1:0;
        card.style.pointerEvents=index>=openingProducts.length&&progress<1?'none':'';
      });
      if(moving)frame=requestAnimationFrame(draw);
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
    function scroll(){
      const y=window.scrollY, target=landing();
      if(!stop&&y<target-12)stopUsed=false;
      // Catch native momentum/uncancelable wheel scrolling at the same dock.
      if(canStop()&&!stop&&!stopUsed&&lastWheel&&performance.now()-lastWheel<300&&previousY<=target&&y>=target)dock();
      if(stop&&Math.abs(window.scrollY-target)>.5)window.scrollTo({top:target,behavior:'instant'});
      previousY=window.scrollY;
      schedule();
    }
    function wheel(event){
      if(!canStop()||event.ctrlKey||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
      if(event.target.closest('input,textarea,select,[role="dialog"],.nav-search-panel'))return;
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);
      const target=landing(), y=window.scrollY;
      if(delta<0){releaseStop();return;}
      lastWheel=performance.now();
      if(y<target-12)stopUsed=false;
      if(stop){
        if(event.cancelable)event.preventDefault();
        if(!holdCatalogueScroll(stop,delta,performance.now())){
          releaseStop();
          window.scrollTo({top:target+Math.min(delta,120),behavior:'instant'});
        }
      }else if(!stopUsed&&y<=target+1&&y+delta>=target){
        if(event.cancelable)event.preventDefault();
        dock();
      }
      schedule();
    }
    function pointerDown(event){
      if(event.pointerType==='touch'||event.target.closest('a,button,input,textarea,select')||event.clientX>=document.documentElement.clientWidth)releaseStop();
    }
    function browse(instant=false,focusHeading=false){
      releaseStop();
      // A direct visit still needs the dock on its next downward wheel input.
      stopUsed=false;
      measure();
      if(instant||reduced.matches){
        // Resolve the new result height before positioning the scroll dock.
        cancelAnimationFrame(frame);draw(performance.now(),true);measure();
      }
      if(focusHeading)document.getElementById('page-title')?.focus({preventScroll:true});
      window.scrollTo({top:Math.max(0,top+(reduced.matches||filtering?0:settledTravel)-inset),behavior:instant||reduced.matches?'instant':'smooth'});
      // Instant navigation must be settled before a View Transition captures it.
      if(instant||reduced.matches){cancelAnimationFrame(frame);draw(performance.now());}else schedule();
    }
    reveal.current=browse;
    function browseFromNavigation(){browse(true);}
    element.addEventListener('lab:browse',browseFromNavigation);
    const resize=new ResizeObserver(measure);resize.observe(surface);resize.observe(element.querySelector('.opening-size-reference'));
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=0;schedule();});observer.observe(element);
    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('wheel',wheel,{passive:false});
    window.addEventListener('keydown',releaseStop);
    window.addEventListener('pointerdown',pointerDown,{passive:true});
    document.addEventListener('visibilitychange',schedule);
    reduced.addEventListener('change',measure);
    measure();
    if(startExpanded||filtering)browse(true);
    return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();element.removeEventListener('lab:browse',browseFromNavigation);window.removeEventListener('scroll',scroll);window.removeEventListener('wheel',wheel);window.removeEventListener('keydown',releaseStop);window.removeEventListener('pointerdown',pointerDown);document.removeEventListener('visibilitychange',schedule);reduced.removeEventListener('change',measure);delete element.dataset.scrollLocked;};
  },[startExpanded,query,catalogueFilter]);

  function pauseMotion(value){paused.current=value;window.dispatchEvent(new Event('scroll'));}

  return <section className="kinetic-catalog" ref={root} aria-label="Creative Lab creations">
    <div className="opening-size-reference" aria-hidden="true"/>
    <div className="opening-sticky" ref={scene}>
      <header className="opening-toolbar">
        <h1 id="page-title" tabIndex={-1}>Creative Lab<span aria-hidden="true"/></h1>
        <div className="opening-controls">
          <nav className="opening-filters" aria-label="Creation filters">{catalogueFilters.map(filter=><button key={filter.id} aria-pressed={catalogueFilter===filter.id} onClick={()=>onFilter(filter.id)}>{filter.label}</button>)}</nav>
          {tools}
        </div>
      </header>
      <div className="ribbon-scene">
        <div className="opening-wordmark" aria-hidden="true"><span>Creative</span><span>Lab<span className="opening-period">.</span></span></div>
        {shownProducts.map((product,index)=><button key={product.id} ref={element=>cards.current[index]=element} className="opening-model" aria-label={`${product.mode==='device'?'Explore':'Try Now:'} ${product.title}`} aria-describedby={`creation-description-${product.id}${product.badge ? ` creation-badge-${product.id}` : ''}`} onClick={()=>onCreate(product.id)} onPointerEnter={()=>pauseMotion(true)} onPointerLeave={()=>pauseMotion(false)} onFocus={event=>{if(event.currentTarget.matches(':focus-visible')){pauseMotion(true);reveal.current();}}} onBlur={()=>pauseMotion(false)}>
          <div className={`opening-model-art ${product.mode==='device'?'is-device':''}`} data-creation={product.id} aria-hidden="true">
            {product.mode!=='device'&&<span className="opening-source">
              <img src={`/assets/${product.source}.webp`} alt="" draggable="false"/>
            </span>}
            <span className="opening-result"><ProductCutout product={product}/></span>
          </div>
          <span className="opening-product-scene" aria-hidden="true"><img src={`/assets/${product.image}.webp`} alt="" draggable="false"/></span>
          <span className="opening-model-caption">
            <span className="opening-model-title">
              <span>{product.title}</span>
              {product.badge&&<span id={`creation-badge-${product.id}`} className={`opening-model-badge opening-model-badge--${product.badge.toLowerCase()}`}><span>{product.badge}</span></span>}
            </span>
            <span className="opening-model-description" id={`creation-description-${product.id}`}>{product.detail}</span>
            <GlowButton as="span" className="opening-model-cta" aria-hidden="true">{product.mode==='device'?'Explore':'Try Now'}<ArrowUpRight size={16}/></GlowButton>
          </span>
        </button>)}
      </div>
      {searching&&<p className={matches.size?'opening-feedback':'opening-empty'} role="status">{matches.size?`${matches.size} matching ${matches.size===1?'creation':'creations'}`:'No creations found. Try another filter or search.'}</p>}
    </div>
  </section>;
}
