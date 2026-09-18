import React from 'react';
import {CaretRight, Check} from '@phosphor-icons/react';
import {products} from './products.js';
import CreativeOpening from './CreativeOpening.jsx';

const steps=['Create','Design','3D Preview','Checkout'];

export default function Discovery({query,catalogueFilter,onFilter,onCreate,onCollapse,selected,previewId,stage,startExpanded,tools,children}) {
  const product=products.find(p=>p.id===previewId);
  const has3D=product.id==='keychain'||product.id==='lamp';
  const currentStep=stage==='setup'?0:stage==='result'&&has3D?2:1;
  return <section className={`discovery-scene ${selected?'is-editing':'has-opening'}`} aria-labelledby="page-title">
    {selected?<>
      <header className="workspace-header">
        <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><button onClick={onCollapse}>Creative Lab</button></li>
            <li><CaretRight size={14} aria-hidden="true"/><h1 id="page-title" aria-current="page">{product.title}</h1></li>
          </ol>
        </nav>
        {product.mode!=='device'&&<ol className="workspace-progress" aria-label="Creation progress">
          {steps.map((label,index)=><li key={label} className={index<currentStep?'is-complete':index===currentStep?'is-current':'is-upcoming'} aria-current={index===currentStep?'step':undefined}>
            <span className="workspace-step-number" aria-hidden="true">{index<currentStep?<Check size={16} weight="bold"/>:index+1}</span>
            <span>{label}{index<currentStep&&<span className="sr-only"> — completed</span>}</span>
          </li>)}
        </ol>}
      </header>
    </>:<CreativeOpening query={query} catalogueFilter={catalogueFilter} onFilter={onFilter} onCreate={onCreate} startExpanded={startExpanded} tools={tools}/>}
    <div id="workbench-panel" className="catalog-workbench" hidden={!selected}>{children}</div>
  </section>;
}
