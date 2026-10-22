/* Améliorations d'ergonomie, sans modifier les règles du jeu. */
(()=>{
const nav=document.querySelector('.nav');
if(!nav)return;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
function refresh(){
 const selected=nav.querySelector('[data-tab].active');
 nav.querySelectorAll('[data-tab]').forEach(b=>{
   const active=b===selected;
   b.setAttribute('aria-current',active?'page':'false');
   b.setAttribute('aria-pressed',String(active));
 });
}
nav.addEventListener('click',event=>{
 const btn=event.target.closest('[data-tab]');if(!btn)return;
 // L'événement de jeu gère la navigation ; attendre son rendu synchrone.
 queueMicrotask(()=>{
   refresh();
   if(window.matchMedia('(max-width:680px)').matches)
      window.scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'});
 });
});
const observer=new MutationObserver(refresh);
observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
refresh();
const chest=document.querySelector('#chestOverlay'),close=document.querySelector('#closeChest');
if(chest&&close){
 let previous=null;
 const watch=new MutationObserver(()=>{
  const visible=!chest.classList.contains('hidden');
  if(visible){
    if(!previous)previous=document.activeElement;
    if(!close.disabled)close.focus({preventScroll:true});
  }else if(previous){previous.focus?.({preventScroll:true});previous=null;}
 });
 watch.observe(chest,{attributes:true,attributeFilter:['class']});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!chest.classList.contains('hidden')&&!close.disabled)close.click();
 });
}
})();
