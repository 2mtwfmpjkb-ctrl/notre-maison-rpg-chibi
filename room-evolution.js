/* Notre Maison RPG Chibi — paliers 2 mois, lecture seule Firebase. */
(()=>{
'use strict';
const IDS=['cuisine','salon','dressing','chambre','bureau','wc','bain'];
const LIMITS=[20,34,49,63,104,150], MONTHS=[2,4,6,8,10,12];
const LABELS=['Pièce d’origine','Pièce aménagée','Pièce confortable','Pièce noble','Pièce enchantée','Pièce prestigieuse','Pièce royale'];
const FURNITURE={cuisine:['🍳','🫖','🥘'],salon:['🛋️','🪵','🕯️'],dressing:['🧥','👗','🧺'],chambre:['🛏️','🧸','🪞'],bureau:['🪑','📚','🖋️'],wc:['🚽','🪴','🧻'],bain:['🛁','🧼','🪞']};
const REGEX={cuisine:/cuisine|cuisin|évier|vaisselle|lave-vaisselle|gazinière|frigo|réfrig|plan de travail|préparer à manger|four|micro-onde/i,salon:/salon|salle à manger|table|poêle|bois|cheminée|canapé|poussière|aspirateur|serpillière|sols/i,dressing:/dressing|linge|lessive|machine à laver|vêtement|repass|ranger les habits/i,chambre:/chambre|drap|lit|literie/i,bureau:/bureau|ordinateur|papier|écran/i,wc:/toilette|wc/i,bain:/salle de bain|douche|lavabo|baignoire|miroir/i};
function roomFor(name){if(/salle de bain|douche|lavabo/i.test(name))return 'bain';if(/toilettes|\bwc\b/i.test(name))return 'wc';if(/salon|salle à manger|poêle|cheminée/i.test(name))return 'salon';return IDS.find(id=>REGEX[id].test(name))||null}
function monthsSince(start){const a=new Date(start),b=new Date();if(!Number.isFinite(a.getTime()))return 0;let n=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();if(b.getDate()<a.getDate())n--;return Math.max(0,n)}
function stateFor(id,state){const count=Object.values(state.done||{}).filter(r=>roomFor(String(r?.name||''))===id).length;const months=monthsSince(state.createdAt);let tier=0;for(let i=0;i<6;i++){if(count>=LIMITS[i]&&months>=MONTHS[i])tier++;else break}return {count,months,tier}}
function enhance(){const root=document.getElementById('roomDetails'),selected=document.querySelector('.house-room.selected'),rpg=window.RPG;if(!root||!rpg)return;const state=rpg.getData();if(!state)return;
 for(const id of IDS){const b=document.querySelector('.house-room[data-room="'+id+'"]');if(!b)continue;const s=stateFor(id,state);if(b.dataset.tier!==String(s.tier)){b.dataset.tier=String(s.tier)}const marker=b.querySelector('.room-decor');const badge=s.tier===0?'✧':['🌿','🛋️','💎','✨','🏰','👑'][s.tier-1];if(marker&&marker.textContent!==badge)marker.textContent=badge}
 if(!selected||!IDS.includes(selected.dataset.room))return;const id=selected.dataset.room,{count,months,tier}=stateFor(id,state),signature=[id,count,months,tier].join('|');if(root.dataset.evolutionSignature===signature&&root.querySelector('.room-scene'))return;
 root.dataset.evolutionSignature=signature;root.querySelector('.room-scene')?.remove();root.querySelector('.scene-next')?.remove();
 const scene=document.createElement('div');scene.className='room-scene';scene.dataset.room=id;scene.dataset.tier=String(tier);scene.setAttribute('role','img');scene.setAttribute('aria-label',LABELS[tier]+' : décor de la pièce');
 const furn=document.createElement('div');furn.className='scene-furniture';const list=FURNITURE[id];for(let i=0;i<Math.min(3,1+Math.floor(tier/2));i++){const span=document.createElement('span');span.textContent=list[i];furn.append(span)}scene.append(furn);
 if(tier>0){const d=document.createElement('div');d.className='scene-decor';d.textContent=['🌿','🛋️','💎','✨','🏰','👑'][tier-1];scene.append(d)}
 const label=document.createElement('div');label.className='scene-tier';label.textContent='🏰 '+LABELS[tier]+' · '+(tier+1)+'/7';scene.append(label);
 const h=root.querySelector('h3');if(h)h.insertAdjacentElement('afterend',scene);else root.prepend(scene);
 const info=root.querySelector('.decor-progress');if(info){info.innerHTML='';const heading=document.createElement('b');heading.textContent='✨ '+LABELS[tier];const p=document.createElement('p');p.className='small';p.textContent=tier===6?'👑 Pièce royale débloquée !':count+' / '+LIMITS[tier]+' quêtes · palier accessible après '+MONTHS[tier]+' mois.';const bar=document.createElement('div');bar.className='decor-bar';const fill=document.createElement('span');fill.style.width=(tier===6?100:Math.min(100,Math.round(count/LIMITS[tier]*100)))+'%';bar.append(fill);const note=document.createElement('p');note.className='small muted';note.textContent='Progression partagée entre Eddy et Karine · décorations uniquement visuelles.';info.append(heading,p,bar,note)}
 if(tier<6){const next=document.createElement('div');next.className='scene-next';const title=document.createElement('strong');title.textContent='🔒 Prochaine transformation : '+LABELS[tier+1];const detail=document.createElement('span');detail.textContent=' '+LIMITS[tier]+' quêtes ET '+MONTHS[tier]+' mois d’ancienneté. Ancienneté actuelle : '+months+' mois.';next.append(title,detail);scene.insertAdjacentElement('afterend',next)}
}
const target=document.getElementById('roomDetails');if(!target)return;let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;try{enhance()}catch(err){console.warn('Évolution de la maison indisponible',err)}})};
new MutationObserver(schedule).observe(target,{childList:true,subtree:false});
const oldSet=window.RPG?.setData;if(typeof oldSet==='function')window.RPG.setData=(value,person)=>{oldSet(value,person);schedule()};
document.addEventListener('click',e=>{if(e.target.closest('[data-room]'))queueMicrotask(schedule)});schedule();
})();
