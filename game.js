
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const NAMES=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche','Toute la semaine','Début du mois'];
const DIFF={easy:{xp:10,gold:5,label:'Facile'},medium:{xp:25,gold:12,label:'Moyenne'},hard:{xp:60,gold:30,label:'Difficile'},epic:{xp:120,gold:60,label:'Épique'},legend:{xp:200,gold:100,label:'Légendaire'}};
const CATALOG=[
{id:'cap',name:'Bonnet du novice',slot:'hat',emoji:'🧢',rarity:'common'},
{id:'wood',name:'Épée en bois',slot:'weapon',emoji:'🪵',rarity:'common'},
{id:'guard',name:'Petit bouclier',slot:'shield',emoji:'🛡️',rarity:'common'},
{id:'chef',name:'Toque du chef',slot:'hat',emoji:'👨‍🍳',rarity:'common'},
{id:'blue',name:'Couronne d’azur',slot:'hat',emoji:'👑',rarity:'rare'},
{id:'sword',name:'Lame de cristal',slot:'weapon',emoji:'🗡️',rarity:'rare'},
{id:'flower',name:'Bouclier fleuri',slot:'shield',emoji:'🌺',rarity:'rare'},
{id:'magic',name:'Baguette enchantée',slot:'weapon',emoji:'🪄',rarity:'epic'},
{id:'star',name:'Aura stellaire',slot:'aura',emoji:'✨',rarity:'epic'},
{id:'dragon',name:'Couronne du dragon',slot:'hat',emoji:'🐉',rarity:'mythic'},
{id:'sun',name:'Aura solaire',slot:'aura',emoji:'🌟',rarity:'mythic'}];
const SHOP=[
{id:'shop_beret',name:'Béret de l’aventurier',slot:'hat',emoji:'🎩',rarity:'rare',price:150},
{id:'shop_flower',name:'Couronne fleurie',slot:'hat',emoji:'🌸',rarity:'rare',price:180},
{id:'shop_blade',name:'Sabre de lumière',slot:'weapon',emoji:'⚔️',rarity:'epic',price:420},
{id:'shop_broom',name:'Balai héroïque',slot:'weapon',emoji:'🧹',rarity:'rare',price:220},
{id:'shop_guard',name:'Bouclier royal',slot:'shield',emoji:'🛡️',rarity:'epic',price:400},
{id:'shop_aura',name:'Aura des lucioles',slot:'aura',emoji:'✨',rarity:'epic',price:550},
{id:'shop_crown',name:'Couronne céleste',slot:'hat',emoji:'👑',rarity:'mythic',price:950},
{id:'shop_star',name:'Aura de constellation',slot:'aura',emoji:'🌠',rarity:'mythic',price:1200}];
CATALOG.push(...SHOP,...NEW_COSMETICS);
const CHEST_POOL=CATALOG.filter(i=>!i.id.startsWith('shop_'));
function cosmeticImg(item,cls='cosmetic-thumb'){return item?`<img class="${cls}" src="${item.asset||'assets/'+item.id+'.svg'}" alt="${escapeHtml(item.name)}" loading="lazy">`:''}
const DUPLICATE_GOLD={common:20,rare:65,epic:180,mythic:500};
const STORAGE='notre-maison-rpg-chibi-v1';
function initial(){return {createdAt:new Date().toISOString(),custom:[],done:{},players:{E:{inventory:[],equip:{},opened:0},C:{inventory:[],equip:{},opened:0}}}}
let data;try{data=JSON.parse(localStorage.getItem(STORAGE))||initial()}catch(e){data=initial()}
data.createdAt ||= Object.values(data.done).map(r=>r.at).filter(Boolean).sort()[0] || new Date().toISOString();data.custom ||= [];data.done ||= {};data.players ||= initial().players;
for(let p of ['E','C']){data.players[p] ||= {inventory:[],equip:{},opened:0};data.players[p].inventory ||= [];data.players[p].equip ||= {};data.players[p].opened ||= 0;data.players[p].bonusGold ||= 0;data.players[p].spentGold ||= 0;data.players[p].challengeClaims ||= {};data.players[p].collectionClaims ||= []}
let current=localStorage.getItem('nm_rpg_person')==='C'?'C':'E',day=(new Date().getDay()+6)%7,tab='home';
function save(){if(window.CloudSync?.active)return;try{localStorage.setItem(STORAGE,JSON.stringify(data))}catch(e){toast('Enregistrement local indisponible')}}
function cloudWrite(action){if(!window.CloudSync?.active)return false;window.CloudSync.perform(action).catch(err=>toast('Synchronisation refusée : '+err.message));return true}

function toast(message){let el=$('#toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.add('hidden'),3000)}
function localDay(date){return new Date(date.getFullYear(),date.getMonth(),date.getDate())}
function week(date){let d=localDay(date);d.setDate(d.getDate()-(d.getDay()+6)%7);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function month(date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')}
function occurrence(t,date){return t.day===8?'month:'+month(date):'week:'+week(date)}
function taskKey(t,date){return t.id+'|'+occurrence(t,date)}
function difficulty(t){if(t.diff&&DIFF[t.diff])return t.diff;let n=t.name.toLowerCase();if(/couper du bois|salle de bain|serpillière|vitres|frigo|grand ménage/.test(n))return 'hard';if(/aspirateur|draps|courses|linge|douche|gazinière|toilettes|préparer/.test(n))return 'medium';return 'easy'}
function tasks(){return BASE_TASKS.concat(data.custom)}
function validTask(t,date){if(t.repeat===false&&t.createdWeek!==week(date))return false;if(t.day===8)return date.getDate()<=7;if(t.day===7)return true;return t.day===(date.getDay()+6)%7}
function records(person,monthStr){return Object.values(data.done).filter(r=>r.by===person&&(!monthStr||r.at.slice(0,7)===monthStr))}
function xp(person,monthStr){return records(person,monthStr).reduce((s,r)=>s+r.xp,0)}
function allXp(person){return xp(person)}
function gold(person){return records(person).reduce((s,r)=>s+r.gold,0)+data.players[person].bonusGold-data.players[person].spentGold}
function awardItem(person,item){let player=data.players[person];if(player.inventory.includes(item.id)){let refund=DUPLICATE_GOLD[item.rarity];player.bonusGold+=refund;return {duplicate:true,refund}}player.inventory.push(item.id);return {duplicate:false}}
function renderShop(){let player=data.players[current];$('#shopBalance').textContent=gold(current)+' 🪙 disponibles';
$('#shopList').innerHTML=SHOP.map(item=>{let owned=player.inventory.includes(item.id),affordable=gold(current)>=item.price;return `<div class="item">${cosmeticImg(item)}<div class="description"><b>${item.name}</b><div class="rarity ${item.rarity}">${{common:'COMMUN',rare:'RARE',epic:'ÉPIQUE',mythic:'MYTHIQUE'}[item.rarity]}</div><div class="small muted">Cosmétique · ${item.slot==='hat'?'Chapeau':item.slot==='weapon'?'Arme':item.slot==='shield'?'Bouclier':'Aura'}</div></div><button class="button alt" data-buy="${item.id}" ${owned||!affordable?'disabled':''}>${owned?'Acquis':item.price+' 🪙'}</button></div>`}).join('')}

// Saison 1 : 100 niveaux. Environ 59 000 XP nécessaires par joueur pour le niveau 100.
function xpForLevel(n){return 6*(n-1)*(n-1)}
function anniversaryReached(){const start=new Date(data.createdAt);if(!Number.isFinite(start.getTime()))return false;const target=new Date(start);target.setFullYear(target.getFullYear()+1);return new Date()>=target}
function monthsElapsed(){const a=new Date(data.createdAt),b=new Date();if(!Number.isFinite(a.getTime()))return 0;let n=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();if(b.getDate()<a.getDate())n--;return Math.max(0,n)}
function rawLevel(person){let lo=1,hi=100;while(lo<hi){let mid=Math.ceil((lo+hi)/2);if(allXp(person)>=xpForLevel(mid))lo=mid;else hi=mid-1}return lo}
function level(person){return Math.min(rawLevel(person),anniversaryReached()?100:99)}
function season(){return Math.min(4,Math.floor(monthsElapsed()/3)+1)}
function eligibleCosmetics(){return CHEST_POOL.filter((item,i)=>i%4<season())}
// Collection garantie : trois sceaux par semaine avec au moins 7 quêtes de base
// effectuées par le joueur. Les sceaux non utilisés restent disponibles.
const SEALS_PER_WEEK=3, SEAL_WEEKLY_TARGET=7;
function collectionEligibleWeeks(person){
 const weekly=new Map();
 for(const r of records(person)){
  if(r.custom||!r.at||!Number.isFinite(new Date(r.at).getTime()))continue;
  const key=week(new Date(r.at));weekly.set(key,(weekly.get(key)||0)+1);
 }
 return [...weekly.values()].filter(count=>count>=SEAL_WEEKLY_TARGET).length;
}
function earnedSeals(person){return collectionEligibleWeeks(person)*SEALS_PER_WEEK}
function availableSeals(person){return Math.max(0,earnedSeals(person)-(data.players[person].collectionClaims||[]).length)}
function collectionOwned(person){return CHEST_POOL.filter(i=>data.players[person].inventory.includes(i.id)).length}
function claimCollectionItem(person,id){
 const item=CHEST_POOL.find(i=>i.id===id);
 if(!item)throw Error('Objet introuvable');
 if(!eligibleCosmetics().some(i=>i.id===id))throw Error('Collection saisonnière non débloquée');
 if(data.players[person].inventory.includes(id))throw Error('Objet déjà possédé');
 if(availableSeals(person)<1)throw Error('Pas assez de sceaux');
 data.players[person].collectionClaims.push({id,at:new Date().toISOString()});
 data.players[person].inventory.push(id);
 return item;
}
function totalQuests(){return Object.values(data.done).filter(r=>!r.custom).length}
function sharedChallengeWeeks(){let weeks=new Set();for(let p of ['E','C'])for(let key of Object.keys(data.players[p].challengeClaims||{})){if(key.endsWith('|quest7')&&data.players[p].challengeClaims[key])weeks.add(key.split('|')[0])}return weeks.size}
function finalEligible(){return anniversaryReached()&&totalQuests()>=3000&&sharedChallengeWeeks()>=40}
function yearPanel(){const months=monthsElapsed(),total=totalQuests(),weeks=sharedChallengeWeeks(),done=finalEligible();return `<div class="year-card"><h3>🌟 Saison 1 · La Fondation du Royaume</h3><p>Ancienneté : <b>${Math.min(months,12)}/12 mois</b> · Quêtes du foyer : <b>${Math.min(total,3000)}/3000</b> · Semaines de défi : <b>${Math.min(weeks,40)}/40</b></p><p>Collection de coffres : <b>Saison ${season()}/4</b> · nouveaux cosmétiques chaque trimestre.</p><div class="decor-bar"><span style="width:${Math.min(100,Math.round(total/3000*100))}%"></span></div><div class="throne-showcase ${done?'throne-unlocked':'throne-locked'}"><img src="assets/throne_guardians.svg" alt="Trône des deux Gardiens" loading="lazy"><p>${done?'👑 Le Trône des deux Gardiens est installé dans le salon !':'🔒 Trône des deux Gardiens : disponible après le premier anniversaire et les objectifs communs.'}</p></div><p>Les niveaux 100 et les récompenses ultimes attendent aussi le premier anniversaire. Les quêtes personnalisées n’ajoutent pas d’XP et ne comptent pas pour la saison.</p></div>`}

const MILESTONES=[
{level:5,name:'Étincelles magiques',detail:'Petites étincelles autour du héros',aura:'spark'},
{level:10,name:'Cadre d’argent',detail:'Cadre argenté autour du nom',frame:'silver'},
{level:15,name:'Aura céleste',detail:'Halo bleu et rose autour du héros',aura:'celestial'},
{level:20,name:'Coffre royal',detail:'Apparence de coffre royal',chest:'royal'},
{level:25,name:'Cadre doré',detail:'Cadre doré autour du nom',frame:'gold'},
{level:30,name:'Aura mythique',detail:'Aura rayonnante violette et or',aura:'mythic'},
{level:40,name:'Coffre astral',detail:'Apparence de coffre astral',chest:'astral'},
{level:50,name:'Cadre légendaire',detail:'Cadre animé multicolore',frame:'legendary'},
{level:70,name:'Aura divine',detail:'Halo divin de la saison 1',aura:'mythic'},
{level:90,name:'Couronne éternelle',detail:'Distinction des anciens gardiens',frame:'legendary'},
{level:100,name:'Légende du Royaume',detail:'Réservée au premier anniversaire',frame:'legendary'}];
function rewardAt(person,type){return MILESTONES.filter(m=>level(person)>=m.level&&m[type]).slice(-1)[0]?.[type]||null}
function chestLook(person){return rewardAt(person,'chest')||'wood'}
function chestIcon(person){return {wood:'🧰',royal:'🎁',astral:'💠'}[chestLook(person)]}
function chestLabel(person){return {wood:'Coffre d’aventurier',royal:'Coffre royal',astral:'Coffre astral'}[chestLook(person)]}
function milestonePanel(person){return MILESTONES.map(m=>`<div class="milestone ${level(person)>=m.level?'unlocked':''}"><span class="milestone-level">NV ${m.level}</span><span><b>${m.name}</b><small>${m.detail}</small></span><span>${level(person)>=m.level?'✓':'🔒'}</span></div>`).join('')}
function availableChests(person){return Math.max(0,Math.floor(allXp(person)/250)-data.players[person].opened)}
function avatar(person,large=false){
let eq=data.players[person].equip;let item=id=>CATALOG.find(i=>i.id===id);
let hat=item(eq.hat),weapon=item(eq.weapon),shield=item(eq.shield),aura=item(eq.aura);
return `<div class="avatar sprite-avatar ${large?'sprite-large':''} ${rewardAt(person,'aura')?'level-aura aura-'+rewardAt(person,'aura'):''}"><div class="sprite-stage">${aura?cosmeticImg(aura,'worn worn-aura'):''}<img class="hero-base" src="assets/hero_${person==='E'?'eddy':'karine'}.svg" alt="${person==='E'?'Gardien d’Azur':'Gardienne des Étoiles'}">${hat?cosmeticImg(hat,'worn worn-hat'):''}${weapon?cosmeticImg(weapon,'worn worn-weapon'):''}${shield?cosmeticImg(shield,'worn worn-shield'):''}${level(person)===100?`<img class="ultimate-overlay" src="assets/ultimate_${person==='E'?'eddy':'karine'}.svg" alt="Parure éternelle">`:''}</div></div>`
}

function chestImage(person){return `<img src="assets/chest_${chestLook(person)}.svg" alt="Coffre ${chestLook(person)}">`}

const ACHIEVEMENTS=[
{id:'first',icon:'🧹',name:'Premier pas',desc:'Accomplir 1 quête',need:1,kind:'tasks',title:'Apprenti du foyer'},
{id:'ten',icon:'🗡️',name:'Aventurier assidu',desc:'Accomplir 10 quêtes',need:10,kind:'tasks',title:'Écuyer du quotidien'},
{id:'fifty',icon:'🏰',name:'Gardien du château',desc:'Accomplir 50 quêtes',need:50,kind:'tasks',title:'Gardien du foyer'},
{id:'hundred',icon:'👑',name:'Légende domestique',desc:'Accomplir 100 quêtes',need:100,kind:'tasks',title:'Souverain des corvées'},
{id:'xp1000',icon:'🌟',name:'Lueur héroïque',desc:'Gagner 1 000 XP',need:1000,kind:'xp',title:'Porteur de lumière'},
{id:'xp5000',icon:'🔮',name:'Élu des étoiles',desc:'Gagner 5 000 XP',need:5000,kind:'xp',title:'Champion astral'},
{id:'collector',icon:'🎒',name:'Collectionneur',desc:'Posséder 10 équipements',need:10,kind:'items',title:'Chasseur de reliques'},
{id:'treasure',icon:'💎',name:'Maître des coffres',desc:'Ouvrir 25 coffres',need:25,kind:'chests',title:'Chercheur de trésors'}
];
const WEEKLY_CHALLENGES=[{id:'quest3',icon:'⚔️',name:'Trois victoires',desc:'Valider 3 quêtes cette semaine',need:3,kind:'tasks',gold:40},{id:'quest7',icon:'🛡️',name:'Protecteur du foyer',desc:'Valider 7 quêtes cette semaine',need:7,kind:'tasks',gold:100},{id:'xp250',icon:'✨',name:'Énergie enchantée',desc:'Gagner 250 XP cette semaine',need:250,kind:'xp',gold:80}];
function weekRecords(person){let monday=week(new Date());return records(person).filter(r=>week(new Date(r.at))===monday)}
function achievementValue(a,person){let p=data.players[person];return a.kind==='tasks'?records(person).length:a.kind==='xp'?xp(person):a.kind==='items'?p.inventory.length:p.opened}
function unlockedAchievements(person){return ACHIEVEMENTS.filter(a=>achievementValue(a,person)>=a.need)}
function heroTitle(person){return level(person)===100?(person==='E'?'Gardien éternel d’Azur':'Reine éternelle des Étoiles'):(unlockedAchievements(person).slice(-1)[0]?.title||'Novice du royaume')}
function challengeValue(c,person){let r=weekRecords(person);return c.kind==='tasks'?r.length:r.reduce((n,t)=>n+t.xp,0)}
function renderAchievements(){let person=current,p=data.players[person];p.challengeClaims ||= {};
$('#achievementList').innerHTML=ACHIEVEMENTS.map(a=>{let value=achievementValue(a,person),unlocked=value>=a.need;return `<div class="achievement ${unlocked?'':'locked'}"><div class="seal">${a.icon}</div><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.desc)} · ${Math.min(value,a.need)}/${a.need}</small><small>${unlocked?'🏅 Titre : '+escapeHtml(a.title):'🔒 À débloquer'}</small></div>`}).join('');
let key=week(new Date());$('#weeklyChallenges').innerHTML=WEEKLY_CHALLENGES.map(c=>{let value=challengeValue(c,person),claimed=!!p.challengeClaims[key+'|'+c.id],ready=value>=c.need;return `<div class="weekly-card"><div><b>${c.icon} ${c.name}</b><div class="small">${c.desc}</div><div class="progress">${Math.min(value,c.need)} / ${c.need} · +${c.gold} 🪙</div></div><button class="button alt" data-claim="${c.id}" ${claimed||!ready?'disabled':''}>${claimed?'✓ Reçu':ready?'Réclamer':'🔒'}</button></div>`}).join('')}
function claimChallenge(id){let c=WEEKLY_CHALLENGES.find(x=>x.id===id);if(!c)return;if(cloudWrite({type:'claim',id}))return;let p=data.players[current],key=week(new Date())+'|'+id;p.challengeClaims ||= {};if(p.challengeClaims[key]||challengeValue(c,current)<c.need)return;p.challengeClaims[key]=true;p.bonusGold+=c.gold;save();toast('🏆 Défi accompli : +'+c.gold+' pièces !');render()}
function renderHome(){
for(let p of ['E','C']){$('#fighter'+p).classList.toggle('me',p===current);$('#fighter'+p).innerHTML=`${avatar(p)}<div class="name-frame ${rewardAt(p,'frame')?'frame-'+rewardAt(p,'frame'):''}">${p==='E'?'💙 Eddy':'💗 Karine'}</div><div class="muted small">Niveau ${level(p)}</div><div class="hero-title">✦ ${heroTitle(p)}</div><div class="stat">${xp(p,month(new Date()))} XP ce mois</div>`}
let e=xp('E',month(new Date())),c=xp('C',month(new Date()));$('#duelBar').style.width=(e+c?e/(e+c)*100:50)+'%';
$('#duelSummary').textContent=e===c?'Égalité pour le moment !':(e>c?'Eddy':'Karine')+' mène de '+Math.abs(e-c)+' XP.';
let ch=availableChests(current);$('#chestCount').textContent=chestIcon(current)+' '+chestLabel(current)+' · '+ch+' coffre(s) à ouvrir';$('#openChest').disabled=ch<1;
$('#myMetrics').innerHTML=`<div class="metric">⭐ <strong>${allXp(current)}</strong><br><span class="small">XP total</span></div><div class="metric">🪙 <strong>${gold(current)}</strong><br><span class="small">Solde disponible</span></div><div class="metric">🎒 <strong>${data.players[current].inventory.length}</strong><br><span class="small">Objets trouvés</span></div><div class="metric">🏆 <strong>${level(current)}</strong><br><span class="small">Niveau</span></div>`;
$('#milestoneList').innerHTML=milestonePanel(current);$('#chestPreview').innerHTML=`<div class="chest-art chest-${chestLook(current)}">${chestImage(current)}</div><div><b>${chestLabel(current)}</b><div class="small muted">Apparence uniquement · les chances d’obtenir un objet commun, rare, épique ou mythique restent inchangées.</div></div>`;let l=level(current),start=xpForLevel(l),end=xpForLevel(Math.min(100,l+1));$('#levelProgress').textContent=l===100?'Niveau 100 · légende du royaume':(l===99&&rawLevel(current)===100&&!anniversaryReached()?'Niveau 100 : premier anniversaire requis':(allXp(current)-start)+' / '+(end-start)+' XP vers le prochain niveau');$('#levelBar').style.width=(l===100?100:Math.min(100,(allXp(current)-start)/(end-start)*100))+'%';$('#yearProgress').innerHTML=yearPanel();
}

const ROOMS={cuisine:{name:'Cuisine',emoji:'🍲',words:/cuisine|cuisin|évier|vaisselle|lave-vaisselle|gazinière|frigo|réfrig|plan de travail|préparer à manger|four|micro-onde/i},salon:{name:'Salon · salle à manger',emoji:'🔥',words:/salon|salle à manger|table|poêle|bois|cheminée|canapé|poussière|aspirateur|serpillière|sols/i},dressing:{name:'Dressing',emoji:'👗',words:/dressing|linge|lessive|machine à laver|vêtement|repass|ranger les habits/i},chambre:{name:'Chambre',emoji:'🛏️',words:/chambre|drap|lit|literie/i},bureau:{name:'Bureau',emoji:'📚',words:/bureau|ordinateur|papier|écran/i},wc:{name:'Toilettes',emoji:'🚽',words:/toilette|wc/i},bain:{name:'Salle de bain',emoji:'🛁',words:/salle de bain|douche|lavabo|baignoire|miroir/i}};
let selectedRoom=null;
function roomForTask(t){let hay=(t.name+' '+(t.area||''));if(/salle de bain|douche|lavabo/i.test(hay))return 'bain';if(/toilettes|\bwc\b/i.test(hay))return 'wc';if(/salon|salle à manger|poêle|cheminée/i.test(hay))return 'salon';for(let [id,room] of Object.entries(ROOMS))if(room.words.test(hay))return id;return null}
function roomTasks(room){return tasks().filter(t=>roomForTask(t)===room)}
const ROOM_DECOR={
 cuisine:[['🕯️','Bougies du cuisinier'],['🍯','Étagères d’alchimiste'],['✨','Cuisine enchantée']],
 salon:[['🪴','Plantes du foyer'],['🛋️','Salon royal'],['🔥','Âtre légendaire']],
 dressing:[['🧺','Paniers enchantés'],['🪞','Miroir précieux'],['👑','Vestiaire royal']],
 chambre:[['🧸','Compagnon de nuit'],['🌙','Lune de velours'],['⭐','Chambre des étoiles']],
 bureau:[['📜','Parchemins anciens'],['🔮','Orbe de sagesse'],['📚','Bibliothèque mystique']],
 wc:[['🌿','Herbes parfumées'],['🪄','Rituel de propreté'],['💎','Sanctuaire étincelant']],
 bain:[['🫧','Bulles magiques'],['🪷','Bain des fées'],['🌈','Source arc-en-ciel']]
};
const DECOR_THRESHOLDS=[8,35,75];const DECOR_MONTHS=[1,6,12];
function roomCompleted(id){return Object.values(data.done).filter(r=>roomForTask({name:r.name||''})===id).length}
function roomTier(id){let n=roomCompleted(id);return DECOR_THRESHOLDS.filter((t,i)=>n>=t&&monthsElapsed()>=DECOR_MONTHS[i]).length}
function roomDecorMarkup(id){let tier=roomTier(id);return `<span class="room-decor" aria-hidden="true">${id==='salon'&&finalEligible()?'👑':tier?ROOM_DECOR[id][tier-1][0]:'✧'}</span>`}
function roomDecorInfo(id){let count=roomCompleted(id),tier=roomTier(id),next=DECOR_THRESHOLDS[tier];return `<div class="decor-progress"><b>✨ Décor du foyer : ${tier?ROOM_DECOR[id][tier-1][1]:'Pièce à embellir'}</b><p class="small">${tier===3?'🏆 Décoration légendaire débloquée !':`${count} / ${next} quêtes dans cette pièce · palier accessible après ${DECOR_MONTHS[tier]} mois.`}</p><div class="decor-bar"><span style="width:${tier===3?100:Math.min(100,Math.round(count/next*100))}%"></span></div><p class="small muted">Décorations partagées entre Eddy et Karine · purement visuelles · aucun achat requis.</p></div>`}
function renderRoom(){for(let [id,r] of Object.entries(ROOMS)){let count=roomTasks(id).length,el=$('#room-count-'+id);if(el)el.textContent=count+' quêtes';let button=document.querySelector('[data-room=\"'+id+'\"]');if(button){button.dataset.tier=roomTier(id);let decor=button.querySelector('.room-decor');if(decor)decor.outerHTML=roomDecorMarkup(id)}}$$('[data-room]').forEach(b=>{b.classList.toggle('selected',b.dataset.room===selectedRoom);b.setAttribute('aria-pressed',String(b.dataset.room===selectedRoom))});let el=$('#roomDetails');if(!el)return;if(!selectedRoom){el.innerHTML='<p class="muted">Choisis une pièce sur la carte.</p>';return}let r=ROOMS[selectedRoom],list=roomTasks(selectedRoom);let date=new Date(),pending=list.filter(t=>validTask(t,date)&&!data.done[taskKey(t,date)]);el.innerHTML=`<h3>${r.emoji} ${r.name}</h3>${roomDecorInfo(selectedRoom)}${selectedRoom==='salon'&&finalEligible()?'<div class="throne-showcase throne-unlocked"><img src="assets/throne_guardians.svg" alt="Trône des deux Gardiens installé dans le salon"><b>👑 Le Trône des deux Gardiens</b></div>':''}<p class="small muted">${list.length} quêtes associées · ${pending.length} disponibles maintenant. Certaines quêtes reviennent chaque semaine ou chaque mois.</p>${pending.slice(0,8).map(t=>{let d=DIFF[difficulty(t)];return `<div class="task"><span class="name"><b>${escapeHtml(t.name)}</b><span class="small muted"> · +${t.custom?0:d.xp} XP</span></span><button class="button" data-room-complete="${escapeHtml(t.id)}">Valider</button></div>`}).join('')||'<p class="small muted">Aucune quête disponible pour cette pièce en ce moment.</p>'}<button class="button alt" id="roomSeeAll" type="button">Voir toutes les quêtes</button>`}
function renderTasks(){
$('#dayTabs').innerHTML=NAMES.map((n,i)=>`<button data-day="${i}" class="${i===day?'on':''}">${n}</button>`).join('');
let date=new Date(),selected=tasks().filter(t=>t.day===day&&validTask(t,date));
$('#taskList').innerHTML=selected.map(t=>{let key=taskKey(t,date),done=data.done[key],d=DIFF[difficulty(t)];
return `<div class="task"><div class="name"><b>${escapeHtml(t.name)}</b>${t.bonus?'<div class="small" style="color:#9b6a37">✨ Quête bonus spécifique</div>':''}${t.legendary?'<div class="small" style="color:#a05cb0">👑 Quête légendaire · '+escapeHtml(t.area)+' · 1 fois par mois · objet rare garanti</div>':''}<div class="small muted">${t.custom?'Personnalisée · sans XP ni or':d.label+' · +'+d.xp+' XP · +'+d.gold+' 🪙'}</div></div>${done?`<span class="tag">✓ ${done.by==='E'?'Eddy':'Karine'}</span>`:`<button class="button ${current==='E'?'blue':'pink'}" data-complete="${escapeHtml(t.id)}">Valider</button>`}${t.custom?`<button class="button alt" data-delete="${escapeHtml(t.id)}">×</button>`:''}</div>`}).join('')||'<p class="muted">Aucune quête pour cette période.</p>';
}
function renderInventory(){
$('#wardrobeAvatar').innerHTML=avatar(current,true);$('#wardrobeTitle').textContent=current==='E'?'Eddy · Le Gardien d’Azur':'Karine · La Gardienne des Étoiles';
let inv=data.players[current].inventory,eq=data.players[current].equip;
$('#inventoryList').innerHTML=inv.length?inv.map((id,i)=>{let item=CATALOG.find(x=>x.id===id);if(!item)return '';return `<div class="item">${cosmeticImg(item)}<div class="description"><b>${item.name}</b><div class="rarity ${item.rarity}">${{common:'COMMUN',rare:'RARE',epic:'ÉPIQUE',mythic:'MYTHIQUE'}[item.rarity]}</div></div><button class="button alt" data-equip="${item.id}">${eq[item.slot]===item.id?'Retirer':'Équiper'}</button></div>`}).join(''):'<p class="muted">Ton sac est vide. Termine des quêtes pour gagner des coffres !</p>';
}
function renderCatalog(){
 let owned=data.players[current].inventory,seal=availableSeals(current),n=collectionOwned(current);
 let rarity=$('#catalogRarity').value,slot=$('#catalogSlot').value;
 let filtered=CHEST_POOL.filter(i=>(rarity==='all'||i.rarity===rarity)&&(slot==='all'||i.slot===slot));
 $('#catalogCount').textContent=filtered.length+' objets affichés · '+n+'/'+CHEST_POOL.length+' obtenus';
 $('#collectionSeals').innerHTML=`<strong>🔮 ${seal} sceau${seal>1?'x':''} de collection disponible${seal>1?'s':''}</strong><p class="small">Chaque semaine où tu réalises au moins ${SEAL_WEEKLY_TARGET} quêtes de base, tu gagnes automatiquement ${SEALS_PER_WEEK} sceaux. Un sceau permet de choisir un cosmétique manquant de la saison accessible, quelle que soit sa rareté. Ils se conservent sans expiration.</p><p class="small">Semaines validées : ${collectionEligibleWeeks(current)} · Sceaux obtenus : ${earnedSeals(current)} · Choix déjà effectués : ${(data.players[current].collectionClaims||[]).length}</p><p class="small">Objectif : 40 semaines actives donnent 120 sceaux, suffisants pour obtenir les ${CHEST_POOL.length} cosmétiques de coffres, même sans chance. Les 8 objets exclusifs de boutique restent à acheter avec des pièces d'or.</p>`;
 $('#catalogGrid').innerHTML=filtered.map(item=>{
  let have=owned.includes(item.id),unlocked=eligibleCosmetics().includes(item);
  return `<div class="catalog-card ${have?'owned':''}">${cosmeticImg(item,'catalog-art')}<div class="catalog-name">${escapeHtml(item.name)}</div><span class="rarity ${item.rarity}">${{common:'COMMUN',rare:'RARE',epic:'ÉPIQUE',mythic:'MYTHIQUE'}[item.rarity]}</span><div class="small muted">${have?'✓ Possédé':unlocked?'✨ Disponible':'⏳ Saison future'}</div>${!have&&unlocked?`<button class="button alt" data-claim-cosmetic="${item.id}" ${seal<1?'disabled':''}>🔮 Choisir · 1 sceau</button>`:''}</div>`
 }).join('');
}

function renderStats(){
let m=$('#monthSelect').value||month(new Date()),e=records('E',m),c=records('C',m);
$('#statsMetrics').innerHTML=`<div class="metric">💙 Eddy<br><strong>${e.reduce((s,r)=>s+r.xp,0)} XP</strong><div class="small">${e.length} tâches</div></div><div class="metric">💗 Karine<br><strong>${c.reduce((s,r)=>s+r.xp,0)} XP</strong><div class="small">${c.length} tâches</div></div>`;
let all=e.concat(c),weeks=[0,1,2,3,4,5].map(i=>({e:0,c:0}));all.forEach(r=>{let idx=Math.min(5,Math.floor((Number(r.at.slice(8,10))-1)/7));weeks[idx][r.by.toLowerCase()]+=r.xp});
let max=Math.max(1,...weeks.map(w=>w.e+w.c));
$('#monthChart').innerHTML=weeks.map((w,i)=>`<div class="chartrow"><span class="label">J. ${i*7+1}–${Math.min((i+1)*7,31)}</span><div class="bars"><div style="width:${w.e/max*100}%;background:#538bdc"></div><div style="width:${w.c/max*100}%;background:#e37da5"></div></div><span class="small">${w.e+w.c}</span></div>`).join('');
$('#history').innerHTML=all.sort((a,b)=>b.at.localeCompare(a.at)).slice(0,12).map(r=>`<div class="task"><span class="name">${escapeHtml(r.name)}<div class="small muted">${r.at.slice(0,10)} · ${r.by==='E'?'Eddy':'Karine'}</div></span><b>+${r.xp} XP</b></div>`).join('')||'<p class="muted">Aucune tâche ce mois-ci.</p>';
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){for(let p of ['home','tasks','inventory','shop','catalog','achievements','stats'])$('#'+p).classList.toggle('hidden',p!==tab);$$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('#profile').value=current;$('#profile').disabled=!!window.CloudSync?.active;renderHome();renderRoom();renderTasks();renderInventory();renderShop();renderCatalog();renderAchievements();renderStats()}
document.addEventListener('click',e=>{
let b=e.target.closest('button');if(!b)return;
if(b.dataset.claim){claimChallenge(b.dataset.claim);return}
if(b.dataset.room){selectedRoom=b.dataset.room;renderRoom();return}
if(b.id==='roomSeeAll'){tab='tasks';render();return}
if(b.dataset.roomComplete){let id=b.dataset.roomComplete;let target=document.querySelector('[data-complete="'+CSS.escape(id)+'"]');if(target){target.click();renderRoom()}else{tab='tasks';render();toast('Retrouve cette quête dans la liste des quêtes.')}return}
if(b.dataset.tab){tab=b.dataset.tab;render();return}
if(b.dataset.day){day=Number(b.dataset.day);renderTasks();return}
if(b.dataset.complete){if(cloudWrite({type:'complete',id:b.dataset.complete}))return;let t=tasks().find(x=>x.id===b.dataset.complete);if(!t)return;if(!validTask(t,new Date())){toast('Cette quête n’est pas disponible à cette date.');return}let key=taskKey(t,new Date());if(data.done[key]){toast('Cette quête a déjà été validée.');return}let oldLevel=level(current);let d=t.custom?{xp:0,gold:0}:DIFF[difficulty(t)];data.done[key]={by:current,name:t.name,xp:d.xp,gold:d.gold,at:new Date().toISOString(),custom:!!t.custom};let prize='';if(t.legendary){let pool=eligibleCosmetics().filter(i=>i.rarity==='rare');let item=pool[Math.floor(Math.random()*pool.length)];let result=awardItem(current,item);prize=result.duplicate?' · Doublon rare : +'+result.refund+' 🪙':' · Objet rare : '+item.name}save();let gained=MILESTONES.filter(m=>m.level>oldLevel&&m.level<=level(current));toast(gained.length?'🏆 Nouveau palier ! '+gained.map(m=>m.name).join(', '):'Quête accomplie ! +'+d.xp+' XP ✨'+prize);render();return}
if(b.dataset.delete){if(window.CloudSync?.active){let t=data.custom.find(x=>x.id===b.dataset.delete);if(t&&confirm('Supprimer cette quête personnalisée ?'))cloudWrite({type:'delete',id:t.id});return}let t=data.custom.find(x=>x.id===b.dataset.delete);if(t&&confirm('Supprimer cette quête personnalisée ?')){data.custom=data.custom.filter(x=>x.id!==t.id);save();render()}return}
if(b.dataset.claimCosmetic){
 if(window.CloudSync?.active){if(confirm('Dépenser 1 sceau pour cet objet ?'))cloudWrite({type:'collection',id:b.dataset.claimCosmetic});return}
 const item=CHEST_POOL.find(i=>i.id===b.dataset.claimCosmetic);if(!item)return;
 if(!confirm('Dépenser 1 sceau pour obtenir « '+item.name+' » ?'))return;
 try{claimCollectionItem(current,item.id);save();toast('🔮 '+item.name+' rejoint ton inventaire !');render()}
 catch(err){toast(err.message)}return;
 }
 if(b.dataset.buy){if(cloudWrite({type:'buy',id:b.dataset.buy}))return;let item=SHOP.find(x=>x.id===b.dataset.buy);if(!item)return;let player=data.players[current];if(player.inventory.includes(item.id)||gold(current)<item.price)return;player.spentGold+=item.price;player.inventory.push(item.id);save();toast('🛍️ '+item.name+' acheté !');render();return}
if(b.dataset.equip){if(cloudWrite({type:'equip',id:b.dataset.equip}))return;let item=CATALOG.find(x=>x.id===b.dataset.equip);if(!item)return;let eq=data.players[current].equip;eq[item.slot]=eq[item.slot]===item.id?null:item.id;save();render();return}
});
$('#profile').addEventListener('change',e=>{if(window.CloudSync?.active){render();return}current=e.target.value;localStorage.setItem('nm_rpg_person',current);render()});
let chestAnimating=false;
function chestReveal(item,result,rarity,look){
 const overlay=$('#chestOverlay'),scene=$('#chestScene'),button=$('#closeChest');
 scene.className='chest-scene '+rarity;overlay.classList.remove('hidden');
 $('#chestTitle').textContent='✨ '+chestLabel(current);
 $('#chestGraphic').innerHTML=`<img src="assets/chest_${look}.svg" alt="Coffre ${look}">`;
 $('#chestReward').innerHTML='';button.disabled=true;button.textContent='Le coffre s’ouvre…';
 $('#chestParticles').innerHTML=Array.from({length:24},(_,i)=>{let a=(i*137.5)*Math.PI/180,r=80+(i%5)*23;return `<span class="chest-particle" style="--x:${Math.round(Math.cos(a)*r)}px;--y:${Math.round(Math.sin(a)*r)}px;--delay:${(i%6)*.065}s"></span>`}).join('');
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 setTimeout(()=>scene.classList.add('open'),reduced?0:750);
 setTimeout(()=>{
 const label={common:'Commun',rare:'Rare',epic:'Épique',mythic:'Mythique'}[rarity];
 $('#chestReward').innerHTML=`<div class="reward-label">${label}</div>${cosmeticImg(item,'cosmetic-thumb')}<b>${escapeHtml(item.name)}</b><div class="small">${result.duplicate?`<span class="duplicate-note">♻️ Déjà possédé : +${result.refund} 🪙</span>`:'🎒 Ajouté à ton inventaire !'}</div>`;
 scene.classList.add('revealed');button.disabled=false;button.textContent='Continuer ✓';button.focus();
 },reduced?150:1900);
}
$('#openChest').addEventListener('click',()=>{if(cloudWrite({type:'chest'}))return;
 if(chestAnimating||availableChests(current)<1)return;
 chestAnimating=true;
 const roll=Math.random()*100,rarity=roll<60?'common':roll<88?'rare':roll<98?'epic':'mythic';
 const eligible=eligibleCosmetics();const pool=eligible.filter(i=>i.rarity===rarity);const actualPool=pool.length?pool:eligible;const item=actualPool[Math.floor(Math.random()*actualPool.length)];
 const look=chestLook(current);
 data.players[current].opened++;
 const result=awardItem(current,item);
 save();render();chestReveal(item,result,rarity,look);
});
$('#closeChest').addEventListener('click',()=>{
 if($('#closeChest').disabled)return;
 $('#chestOverlay').classList.add('hidden');chestAnimating=false;render();
});
$('#addTask').addEventListener('submit',e=>{
e.preventDefault();if(window.CloudSync?.active){let name=$('#newName').value.trim();if(name)cloudWrite({type:'add',name,day:Number($('#newDay').value),diff:$('#newDifficulty').value,repeat:$('#newRepeat').checked});$('#newName').value='';return;}let name=$('#newName').value.trim();if(!name)return;
data.custom.push({id:'custom_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),name,day:Number($('#newDay').value),diff:$('#newDifficulty').value,repeat:$('#newRepeat').checked,createdWeek:week(new Date()),custom:true});
save();$('#newName').value='';day=Number($('#newDay').value);toast('Nouvelle quête créée !');render();
});
$('#catalogRarity').addEventListener('change',renderCatalog);$('#catalogSlot').addEventListener('change',renderCatalog);$('#monthSelect').value=month(new Date());$('#monthSelect').addEventListener('change',renderStats);
$('#newDay').innerHTML=NAMES.map((name,i)=>`<option value="${i}">${name}</option>`).join('');
window.RPG={getData:()=>data,setData:(value,person)=>{data=value;current=person;$('#profile').value=person;render()},getCurrent:()=>current,toast,render,initial};
render();
