/* Extension purement visuelle : aucune écriture Firebase, aucun changement de progression. */
(()=>{
'use strict';
const FURNITURE={
 cuisine:['🍳','🫖','🥘'],salon:['🛋️','🪵','🕯️'],dressing:['🧥','👗','🧺'],
 chambre:['🛏️','🧸','🪞'],bureau:['🪑','📚','🖋️'],wc:['🚽','🪴','🧻'],bain:['🛁','🧼','🪞']
};
const LABELS=['Pièce d’origine','Pièce aménagée','Pièce noble','Pièce légendaire'];
const THRESHOLDS=[8,35,75],MONTHS=[1,6,12];
const original=window.RPG?.render;
if(typeof original!=='function')return;
function monthsSince(date){const a=new Date(date),b=new Date();if(!Number.isFinite(a.getTime()))return 0;let n=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();if(b.getDate()<a.getDate())n--;return Math.max(0,n)}
function enhance(){
 const root=document.getElementById('roomDetails'),selected=document.querySelector('.house-room.selected');
 if(!root||!selected)return;
 const id=selected.dataset.room,state=window.RPG.getData();
 const tier=Math.max(0,Math.min(3,Number(selected.dataset.tier)||0));
 if(!FURNITURE[id])return;
 const existing=root.querySelector('.room-scene');if(existing)existing.remove();
 const scene=document.createElement('div');scene.className='room-scene';scene.dataset.room=id;scene.dataset.tier=String(tier);
 scene.setAttribute('role','img');scene.setAttribute('aria-label',LABELS[tier]+' : illustration décorative');
 const furn=document.createElement('div');furn.className='scene-furniture';
 const count=Math.min(FURNITURE[id].length,1+tier);
 for(const emoji of FURNITURE[id].slice(0,count)){const span=document.createElement('span');span.textContent=emoji;furn.appendChild(span)}
 scene.appendChild(furn);
 if(tier>0){const decor=document.createElement('div');decor.className='scene-decor';decor.textContent=tier===1?'✨':tier===2?'🌟':'👑';scene.appendChild(decor)}
 const label=document.createElement('div');label.className='scene-tier';label.textContent='🏰 '+LABELS[tier]+' · '+(tier+1)+'/4';scene.appendChild(label);
 const h=root.querySelector('h3');if(h)h.insertAdjacentElement('afterend',scene);else root.prepend(scene);
 const old=root.querySelector('.scene-next');if(old)old.remove();
 if(tier<3){const next=document.createElement('div');next.className='scene-next';const strong=document.createElement('strong');strong.textContent='🔒 Prochaine transformation';const txt=document.createElement('span');txt.textContent=' Déblocage : '+THRESHOLDS[tier]+' quêtes dans cette pièce ET '+MONTHS[tier]+' mois d’ancienneté. Ancienneté actuelle : '+monthsSince(state.createdAt)+' mois.';next.append(strong,txt);scene.insertAdjacentElement('afterend',next)}
}
const renderRoom=()=>{try{enhance()}catch(e){console.warn('Décor indisponible',e)}};
const observer=new MutationObserver(()=>{if(!document.querySelector('#roomDetails .room-scene'))renderRoom()});
const target=document.getElementById('roomDetails');if(target)observer.observe(target,{childList:true});
const oldSet=window.RPG.setData;
window.RPG.setData=(value,person)=>{oldSet(value,person);renderRoom()};
renderRoom();
})();
