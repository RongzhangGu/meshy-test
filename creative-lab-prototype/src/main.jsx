import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Check } from '@phosphor-icons/react';
import { validateImage } from './upload.js';
import { products } from './products.js';
import { creationSettings } from './creation-settings.js';
import LabSections from './LabSections.jsx';
import InlineWorkspace from './InlineWorkspace.jsx';
import Discovery from './Discovery.jsx';
import LabNavigation, {LabCreationTools} from './LabNavigation.jsx';
import PhotoChoice from './PhotoChoice.jsx';
import {transitionLabView} from './lab-transition.js';
import '@fontsource-variable/manrope';
import './style.css';
import './sections.css';
import './studio.css';
import './playground.css';
import './discovery.css';
import './lab-navigation.css';
import './lab-transition.css';
import './workflow.css';

const sample = {url:'/assets/keychain-hover.webp',filename:'Example photo',isSample:true};
const findProduct = id => products.find(p => p.id === id);

function App() {
  const [query,setQuery] = useState('');
  const [catalogueFilter,setCatalogueFilter] = useState('all');
  const [selected,setSelected] = useState('keychain');
  const [source,setSource] = useState(sample);
  const [pendingPhoto,setPendingPhoto] = useState(null);
  const [designs,setDesigns] = useState({});
  const [workspace,setWorkspace] = useState(false);
  const [catalogReady,setCatalogReady] = useState(false);
  const [stage,setStage] = useState('setup');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [progress,setProgress] = useState(0);
  const [saved,setSaved] = useState({});
  
  const [toast,setToast] = useState('');
  const [theme,setTheme] = useState(()=>localStorage.getItem('meshy-lab-theme-v3')||'dark');
  const input = useRef(null), studio = useRef(null), play = useRef(null);
  const readVersion = useRef(0), urls = useRef(new Set());
  const uploadIntent = useRef('choose');
  const product=findProduct(selected);
  const draft={...(source.isSample||product.inputKind?{url:product.inputKind?`/assets/${product.source}.webp`:'',filename:product.inputKind==='map'?'Example region':'Example photo',isSample:true}:source),...designs[selected]};
  const hasSaved=Boolean(saved[selected] && saved[selected].url===draft.url && saved[selected].revision===draft.revision);

  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('meshy-lab-theme-v3',theme);},[theme]);
  useEffect(()=>()=>{readVersion.current++;urls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4200);return()=>clearTimeout(t);},[toast]);
  useEffect(()=>{if(stage!=='generating')return;const t=setInterval(()=>setProgress(p=>Math.min(100,p+10)),120);return()=>clearInterval(t);},[stage]);
  useEffect(()=>{if(stage==='generating'&&progress===100)setStage('result');},[stage,progress]);

  function openWorkspace(id=selected,nextStage='setup') {
    return transitionLabView(()=>{
      flushSync(()=>{setSelected(id);setCatalogReady(true);setWorkspace(true);setStage(nextStage);});
    },()=>{
      studio.current?.focus({preventScroll:true});
      studio.current?.closest('.discovery-scene')?.scrollIntoView({block:'start',behavior:'instant'});
    },!workspace);
  }
  function closeWorkspace() {
    return transitionLabView(()=>{
      flushSync(()=>{setWorkspace(false);setCatalogReady(true);});
    },()=>{
      document.getElementById('page-title')?.focus({preventScroll:true});
      document.querySelector('.kinetic-catalog')?.dispatchEvent(new Event('lab:browse'));
    },workspace);
  }
  function searchCreations(value) {
    setQuery(value);
    if(value.trim()||query.trim()){setWorkspace(false);setCatalogReady(true);}
  }
  function upload(intent='choose') {uploadIntent.current=intent;input.current.value='';input.current.click();}
  function cancelPhotoChoice(){if(pendingPhoto){URL.revokeObjectURL(pendingPhoto.url);urls.current.delete(pendingPhoto.url);}setPendingPhoto(null);}
  function choosePhotoCreation(id){setSource(pendingPhoto);setDesigns({});setPendingPhoto(null);setQuery('');openWorkspace(id);}
  async function acceptFile(file,intent=uploadIntent.current) {
    if(!file)return;
    const version=++readVersion.current;
    setError('');setBusy(false);
    const invalid=validateImage(file,intent==='replace'?creationSettings[selected]?.maxMB:10);if(invalid){setError(invalid);return;}
    setBusy(true);const url=URL.createObjectURL(file);
    try {
      const image=new Image();image.src=url;await image.decode();
      if(version!==readVersion.current){URL.revokeObjectURL(url);return;}
      if(image.width*image.height>40000000)throw new Error('large');
      urls.current.add(url);
      const photo={url,filename:file.name,isSample:false};
      if(intent==='choose')setPendingPhoto(photo);
      else {setSource(photo);updateDesign({...photo,inspiration:null,referenceExample:null});setStage('setup');setToast('Photo updated.');}
    } catch(e) {URL.revokeObjectURL(url);if(version===readVersion.current)setError(e.message==='large'?'Choose a photo smaller than 40 megapixels.':'We couldn’t read this photo. Try another JPG, PNG or WebP file.');}
    finally {if(version===readVersion.current)setBusy(false);}
  }
  function useSample(inspiration) {
    const settings=creationSettings[selected], item=settings?.examples[inspiration-1];
    if(!item)return;
    readVersion.current++;setBusy(false);setError('');setStage('setup');
    if(settings.exampleKind==='model')updateDesign({referenceExample:inspiration});
    else updateDesign({url:`/assets/${item.image}.webp`,filename:item.label,isSample:true,inspiration});
  }
  function drop(e) {e.preventDefault();if(stage!=='generating')acceptFile(e.dataTransfer.files[0],'replace');}
  function paste(e) {if(stage==='generating'||e.target.closest('input,textarea,[contenteditable=true]'))return;const file=[...e.clipboardData.files].find(file=>file.type.startsWith('image/'));if(file){e.preventDefault();acceptFile(file,'replace');}}
  function updateDesign(patch) {setDesigns(previous=>({...previous,[selected]:{...previous[selected],...patch,revision:(previous[selected]?.revision||0)+1}}));}
  async function openSaved(id) {setQuery('');readVersion.current++;setBusy(false);setError('');const savedDraft=saved[id];setSource({url:savedDraft.url,filename:savedDraft.filename,isSample:savedDraft.isSample});setDesigns(previous=>savedDraft.url===source.url?{...previous,[id]:savedDraft}:{[id]:savedDraft});await openWorkspace(id,'result');}
  function showCreations() {document.getElementById('my-creations-title')?.focus({preventScroll:true});document.getElementById('my-creations-panel')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  function saveCreation() {
    if(hasSaved){showCreations();return;}
    setSaved(previous=>({...previous,[selected]:draft}));
    setToast('Saved to My creations.');
  }

  return <>
    <LabNavigation onBrowse={closeWorkspace} theme={theme} onTheme={()=>setTheme(theme==='light'?'dark':'light')} onSaved={showCreations} savedCount={Object.keys(saved).length}/>
    <main className="playground-page capability-page">
      <section id="playground" className="creative-playground" ref={play} aria-label="Creative Lab inspiration and creations">
        <Discovery query={query} catalogueFilter={catalogueFilter} onFilter={value=>{setCatalogueFilter(value);setCatalogReady(true);}} previewId={selected} stage={stage} startExpanded={catalogReady} onCreate={openWorkspace} onCollapse={closeWorkspace} selected={workspace?selected:null} tools={<LabCreationTools query={query} onQuery={searchCreations} onBrowse={closeWorkspace} onBrowseAll={()=>{setCatalogueFilter('all');closeWorkspace();}} onCreate={openWorkspace} onUpload={()=>upload()} busy={busy} error={error}/>}>
          {workspace&&<InlineWorkspace key={selected} product={product} studio={studio} stage={stage} setStage={setStage} draft={draft} busy={busy} error={error} progress={progress} isSaved={hasSaved} onCollapse={closeWorkspace} onUpload={()=>upload('replace')} onDrop={drop} onPaste={paste} onSample={useSample} onChange={updateDesign} onGenerate={()=>{setProgress(0);setStage('generating');}} onSave={saveCreation} onExample={example=>updateDesign({example})}/>}
        </Discovery>
      </section>
      <LabSections saved={saved} onOpenSaved={openSaved} onStartCreation={()=>openWorkspace(selected)} onBrowseCreations={closeWorkspace}/>
    </main><PhotoChoice photo={pendingPhoto} onChoose={choosePhotoCreation} onClose={cancelPhotoChoice}/><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Choose a local photo" onChange={e=>acceptFile(e.target.files[0])}/>{toast&&<div className="toast" role="status"><Check size={19}/>{toast}</div>}
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
