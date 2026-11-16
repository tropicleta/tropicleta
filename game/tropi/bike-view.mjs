// Native landscape when available; reversible in-page landscape on other devices.
export function initBikeView(root,button,{document:doc,window:win,onExit=()=>{}}){
 let disposed=false,wanted=false,pending=false,ownsOrientation=false;
 const expanded=()=>root.dataset.bikeExpanded==='true';
 const orientation=win.screen?.orientation;
 function unlock(){if(ownsOrientation){ownsOrientation=false;try{orientation?.unlock?.();}catch{}}}
 function layout(){
  const rotated=expanded()&&win.innerHeight>win.innerWidth;
  root.dataset.bikeRotated=String(rotated);
  root.style.setProperty('--bike-wide',`${Math.max(win.innerWidth,win.innerHeight)}px`);
  root.style.setProperty('--bike-short',`${Math.min(win.innerWidth,win.innerHeight)}px`);
 }
 function set(value){
  root.dataset.bikeExpanded=String(value);doc.body.classList.toggle('bike-is-expanded',value);doc.documentElement?.classList.toggle('bike-is-expanded',value);
  button.textContent=value?'✕':'⛶';button.setAttribute('aria-label',value?'Salir de pantalla completa':'Pantalla completa');button.title=value?'Salir de pantalla completa':'Pantalla completa';button.setAttribute('aria-pressed',String(value));layout();
 }
 async function close(){wanted=false;set(false);unlock();onExit();if(doc.fullscreenElement===root)try{await doc.exitFullscreen();}catch{}}
 async function toggle(){
  if(disposed)return;if(expanded()){await close();return;}if(pending)return;
  wanted=true;pending=true;set(true);
  try{
   if(root.requestFullscreen&&doc.fullscreenEnabled)await root.requestFullscreen();
   if(!disposed&&wanted&&doc.fullscreenElement===root&&orientation?.lock){
    try{await orientation.lock('landscape');ownsOrientation=true;if(!wanted||disposed)unlock();}catch{/* The CSS landscape view remains available. */}
   }
  }catch{/* Rejected fullscreen does not prevent an expanded game. */}
  finally{pending=false;layout();if(!wanted||disposed){set(false);unlock();if(doc.fullscreenElement===root)try{await doc.exitFullscreen();}catch{}}}
 }
 function changed(){if(doc.fullscreenElement===root){if(!wanted||disposed){doc.exitFullscreen().catch(()=>{});return;}set(true);}else if(expanded()&&!pending){wanted=false;set(false);unlock();onExit();}}
 function keys(event){
  if(!expanded())return;
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key!=='Tab')return;
  const items=[...root.querySelectorAll('button:not(:disabled),a[href],select,canvas[tabindex]')].filter(node=>node.getClientRects().length);
  if(!items.length)return;const first=items[0],last=items.at(-1);
  if(event.shiftKey&&(doc.activeElement===first||!root.contains(doc.activeElement))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(doc.activeElement===last||!root.contains(doc.activeElement))){event.preventDefault();first.focus();}
 }
 button.hidden=false;button.addEventListener('click',toggle);doc.addEventListener('fullscreenchange',changed);doc.addEventListener('keydown',keys);win.addEventListener('resize',layout);
 return {get expanded(){return expanded();},get rotated(){return root.dataset.bikeRotated==='true';},close,dispose(){disposed=true;wanted=false;button.removeEventListener('click',toggle);doc.removeEventListener('fullscreenchange',changed);doc.removeEventListener('keydown',keys);win.removeEventListener('resize',layout);set(false);unlock();if(doc.fullscreenElement===root)doc.exitFullscreen().catch(()=>{});}};
}
