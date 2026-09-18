let active, revision=0;

export function transitionLabView(update, align, animate=true) {
  const current=++revision;
  active?.skipTransition();
  function render() {
    if(current!==revision)return;
    update();
    align();
  }
  if(!animate||!document.startViewTransition||matchMedia('(prefers-reduced-motion: reduce)').matches)return render();
  document.documentElement.dataset.labTransition='capturing';
  const transition=document.startViewTransition(render);
  active=transition;
  transition.ready.then(()=>{
    if(active===transition)document.documentElement.dataset.labTransition='running';
  }).catch(error=>{if(error.name!=='AbortError')console.warn('Lab transition skipped:',error);});
  transition.finished.finally(()=>{
    if(active===transition){active=null;delete document.documentElement.dataset.labTransition;}
  }).catch(()=>{});
  return transition.updateCallbackDone;
}
