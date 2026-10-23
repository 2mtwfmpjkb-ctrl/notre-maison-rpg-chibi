/* Notre Maison RPG Chibi — décors isométriques, lecture seule Firebase. */
(()=>{
'use strict';
const IDS=['cuisine','salon','dressing','chambre','bureau','wc','bain'];
const LIMITS=[20,34,49,63,104,150],MONTHS=[2,4,6,8,10,12];
const LABELS=['Pièce d’origine','Pièce aménagée','Pièce confortable','Pièce noble','Pièce enchantée','Pièce prestigieuse','Pièce royale'];
const REGEX={cuisine:/cuisine|cuisin|évier|vaisselle|lave-vaisselle|gazinière|frigo|réfrig|plan de travail|préparer à manger|four|micro-onde/i,salon:/salon|salle à manger|table|poêle|bois|cheminée|canapé|poussière|aspirateur|serpillière|sols/i,dressing:/dressing|linge|lessive|machine à laver|vêtement|repass|ranger les habits/i,chambre:/chambre|drap|lit|literie/i,bureau:/bureau|ordinateur|papier|écran/i,wc:/toilette|wc/i,bain:/salle de bain|douche|lavabo|baignoire|miroir/i};
const FURNITURE={
 cuisine:[['🍳',24,67],['🪑',61,70],['🧺',75,51],['🫖',39,43],['🍲',54,52],['🪴',77,34],['👑',50,25]],
 salon:[['🔥',51,32],['🛋️',29,62],['🪑',70,68],['📚',24,35],['🪴',76,43],['🕯️',49,58],['👑',51,22]],
 dressing:[['👗',28,47],['🧺',62,69],['👞',40,75],['🪞',75,38],['🧥',60,43],['🪴',23,62],['👑',49,26]],
 chambre:[['🛏️',50,62],['🪴',75,55],['🧸',28,65],['🪞',75,37],['🕯️',25,43],['✨',49,34],['👑',49,22]],
 bureau:[['📚',25,42],['🪑',53,67],['🖋️',70,59],['🪴',76,42],['📜',41,53],['🔮',59,38],['👑',50,24]],
 wc:[['🚽',51,63],['🧻',75,54],['🪴',27,54],['🪞',48,35],['🧼',65,42],['✨',32,37],['👑',50,23]],
 bain:[['🛁',50,64],['🧼',74,58],['🪴',27,54],['🪞',52,35],['🧴',75,42],['🕯️',29,40],['👑',51,23]]
};
function roomFor(name){if(/salle de bain|douche|lavabo/i.test(name))return 'bain';if(/toilettes|\bwc\b/i.test(name))return 'wc';if(/salon|salle à manger|poêle|cheminée/i.test(name))return 'salon';return IDS.find(id=>REGEX[id].test(name))||null}
function monthsSince(start){const a=new Date(start),b=new Date();if(!Number.isFinite(a.getTime()))return 0;let n=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();if(b.getDate()<a.getDate())n--;return Math.max(0,n)}
function stateFor(id,state){const count=Object.values(state.done||{}).filter(r=>roomFor(String(r?.name||''))===id).length;const months=monthsSince(state.createdAt);let tier=0;for(let i=0;i<6;i++){if(count>=LIMITS[i]&&months>=MONTHS[i])tier++;else break}return {count,months,tier}}
function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
function enhance(){const root=document.getElementById('roomDetails'),selected=document.querySelector('.house-room.selected'),rpg=window.RPG;if(!root||!rpg?.getData)return;const state=rpg.getData();if(!state)return;
 for(const id of IDS){const b=document.querySelector('.house-room[data-room="'+id+'"]');if(!b)continue;const s=stateFor(id,state);b.dataset.tier=String(s.tier);const marker=b.querySelector('.room-decor');if(marker)marker.textContent=s.tier===0?'✧':['🌿','🛋️','💎','✨','🏰','👑'][s.tier-1]}
 if(!selected||!IDS.includes(selected.dataset.room))return;const id=selected.dataset.room,{count,months,tier}=stateFor(id,state),signature=[id,count,months,tier].join('|');if(root.dataset.evolutionSignature===signature&&root.querySelector('.room-scene'))return;
 root.dataset.evolutionSignature=signature;root.querySelector('.room-scene')?.remove();root.querySelector('.scene-next')?.remove();
 const scene=make('div','room-scene');scene.dataset.room=id;scene.dataset.tier=String(tier);scene.setAttribute('role','img');scene.setAttribute('aria-label',LABELS[tier]+' : maquette isométrique de la pièce');
 const world=make('div','iso-world');world.append(make('div','iso-wall iso-wall-left'),make('div','iso-wall iso-wall-right'),make('div','iso-floor'));
 world.append(make('div','iso-window'),make('div','iso-wall-art'));
 const items=FURNITURE[id];const visible=Math.min(7,1+tier);items.slice(0,visible).forEach(([emoji,x,y],i)=>{const item=make('span','iso-item',emoji);item.style.left=x+'%';item.style.top=y+'%';item.style.zIndex=String(10+Math.round(y));item.style.setProperty('--item-delay',(i*.07)+'s');world.append(item)});
 if(tier>=3)world.append(make('div','iso-rug'));if(tier>=4)world.append(make('div','iso-sparkles','✦ ✧ ✦'));if(tier>=6)world.append(make('div','iso-crown','♛'));
 scene.append(world,make('div','scene-tier','🏰 '+LABELS[tier]+' · '+(tier+1)+'/7'));
 const h=root.querySelector('h3');if(h)h.insertAdjacentElement('afterend',scene);else root.prepend(scene);
 const info=root.querySelector('.decor-progress');if(info){info.replaceChildren();const heading=make('b','', '✨ '+LABELS[tier]);const p=make('p','small',tier===6?'👑 Pièce royale débloquée !':count+' / '+LIMITS[tier]+' quêtes · palier accessible après '+MONTHS[tier]+' mois.');const bar=make('div','decor-bar');const fill=make('span');fill.style.width=(tier===6?100:Math.min(100,Math.round(count/LIMITS[tier]*100)))+'%';bar.append(fill);const note=make('p','small muted','Progression partagée entre Eddy et Karine · décorations uniquement visuelles.');info.append(heading,p,bar,note)}
 if(tier<6){const next=make('div','scene-next');next.append(make('strong','', '🔒 Prochaine transformation : '+LABELS[tier+1]),make('span','',LIMITS[tier]+' quêtes ET '+MONTHS[tier]+' mois d’ancienneté. Ancienneté actuelle : '+months+' mois.'));scene.insertAdjacentElement('afterend',next)}
}
const target=document.getElementById('roomDetails');if(!target)return;let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;try{enhance()}catch(err){console.warn('Évolution de la maison indisponible',err)}})};
new MutationObserver(schedule).observe(target,{childList:true,subtree:false});
const oldSet=window.RPG?.setData;if(typeof oldSet==='function')window.RPG.setData=(value,person)=>{const result=oldSet.call(window.RPG,value,person);schedule();return result};
document.addEventListener('click',e=>{if(e.target.closest('[data-room]'))queueMicrotask(schedule)});schedule();
})();
