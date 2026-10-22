/* Prototype Spark : calcul des mutations côté navigateur.
   Les règles Firestore limitent l’accès, pas la falsification des points.
   Ne pas présenter cette version comme anti-triche. */
function spark_isoWeek(date){let d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function spark_occurrence(t,date){return t.day===8?'month:'+date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0'):'week:'+spark_isoWeek(date)}
function spark_xp(d,who){return Object.values(d.done).filter(r=>r.by===who).reduce((s,r)=>s+r.xp,0)}
function spark_balance(d,who){let pl=d.players[who];return Object.values(d.done).filter(r=>r.by===who).reduce((s,r)=>s+r.gold,0)+(pl.bonusGold||0)-(pl.spentGold||0)}
const SPARK_DIFF={easy:[10,5],medium:[25,12],hard:[60,30],epic:[120,60],legend:[200,100]};
const SPARK_REFUND={common:20,rare:65,epic:180,mythic:500};
function spark_ensure(d){if(!d.createdAt)throw Error('Date de création absente');d.custom ||= [];d.done ||= {};d.players ||= {};for(let who of ['E','C']){d.players[who] ||= {};let pl=d.players[who];pl.inventory ||= [];pl.equip ||= {};pl.opened ||= 0;pl.bonusGold ||= 0;pl.spentGold ||= 0;pl.challengeClaims ||= {};pl.collectionClaims ||= []}return d}
function spark_award(d,role,item){let pl=d.players[role];if(pl.inventory.includes(item.id)){pl.bonusGold+=SPARK_REFUND[item.rarity];return 'Doublon converti en '+SPARK_REFUND[item.rarity]+' pièces';}pl.inventory.push(item.id);return item.name}
function spark_difficulty(t){if(t.diff&&SPARK_DIFF[t.diff])return t.diff;let n=t.name.toLowerCase();if(/couper du bois|salle de bain|serpillière|vitres|frigo|grand ménage/.test(n))return 'hard';if(/aspirateur|draps|courses|linge|douche|gazinière|toilettes|préparer/.test(n))return 'medium';return 'easy'}
function spark_ageMonths(d){let a=new Date(d.createdAt),b=new Date();if(!Number.isFinite(a.getTime()))return 0;let m=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();return Math.max(0,m-(b.getDate()<a.getDate()?1:0))}
function spark_allowedPool(d){let season=Math.min(4,Math.floor(spark_ageMonths(d)/3)+1);return CHEST_POOL.filter((item,i)=>i%4<season)}
function spark_earnedSeals(d,who){let weekly=new Map();for(let r of Object.values(d.done)){if(r.by!==who||r.custom||!r.at)continue;let date=new Date(r.at);if(!Number.isFinite(date.getTime()))continue;let key=spark_isoWeek(date);weekly.set(key,(weekly.get(key)||0)+1)}return [...weekly.values()].filter(n=>n>=7).length*3}
function spark_allowedTask(t,today){if(t.repeat===false&&t.createdWeek!==spark_isoWeek(today))return false;if(t.day===8)return today.getDate()<=7;if(t.day===7)return true;return t.day===(today.getDay()+6)%7}
function spark_mutate(d,a,role){
 let pl=d.players[role],today=new Date();
 if(a.type==='complete'){
  let t=BASE_TASKS.concat(d.custom).find(x=>x.id===a.id);if(!t)throw Error('Quête inconnue');
  if(!spark_allowedTask(t,today))throw Error('Quête indisponible aujourd’hui');
  if(t.repeat===false&&t.createdWeek!==spark_isoWeek(today))throw Error('Quête expirée');
  let key=t.id+'|'+spark_occurrence(t,today);if(d.done[key])throw Error('Quête déjà terminée');
  let [points,gold]=t.custom?[0,0]:SPARK_DIFF[spark_difficulty(t)];d.done[key]={by:role,name:t.name,xp:points,gold,at:today.toISOString(),custom:!!t.custom};
  if(t.legendary){let pool=spark_allowedPool(d).filter(x=>x.rarity==='rare');if(pool.length)spark_award(d,role,pool[Math.floor(Math.random()*pool.length)])}
  return 'Quête validée : +'+points+' XP';
 }
 if(a.type==='add'){if(d.custom.length>=40)throw Error('Limite de 40 quêtes personnalisées');
  if(typeof a.name!=='string'||!a.name.trim()||a.name.length>90||!Number.isInteger(a.day)||a.day<0||a.day>8||!SPARK_DIFF[a.diff])throw Error('Quête invalide');
  d.custom.push({id:'custom_'+crypto.randomUUID(),name:a.name.trim(),day:a.day,diff:a.diff,repeat:!!a.repeat,createdWeek:spark_isoWeek(today),custom:true});return 'Quête ajoutée';
 }
 if(a.type==='delete'){let t=d.custom.find(x=>x.id===a.id);if(!t)throw Error('Quête introuvable');d.custom=d.custom.filter(x=>x.id!==a.id);return 'Quête supprimée'}
 if(a.type==='buy'){let item=SHOP.find(x=>x.id===a.id);if(!item||pl.inventory.includes(item.id)||spark_balance(d,role)<item.price)throw Error('Achat impossible');pl.spentGold+=item.price;pl.inventory.push(item.id);return item.name+' acheté'}
 if(a.type==='equip'){let item=CATALOG.find(x=>x.id===a.id);if(!item||!pl.inventory.includes(item.id))throw Error('Objet non possédé');pl.equip[item.slot]=pl.equip[item.slot]===item.id?null:item.id;return 'Équipement modifié'}
 if(a.type==='claim'){
  let goals={quest3:{kind:'tasks',need:3,gold:40},quest7:{kind:'tasks',need:7,gold:100},xp250:{kind:'xp',need:250,gold:80}};
  let c=goals[a.id];if(!c)throw Error('Défi inconnu');
  let key=spark_isoWeek(today),records=Object.values(d.done).filter(r=>r.by===role&&spark_isoWeek(new Date(r.at))===key);
  let value=c.kind==='tasks'?records.filter(r=>!r.custom).length:records.reduce((n,r)=>n+r.xp,0);
  pl.challengeClaims ||= {};if(pl.challengeClaims[key+'|'+a.id]||value<c.need)throw Error('Récompense indisponible');
  pl.challengeClaims[key+'|'+a.id]=true;pl.bonusGold+=c.gold;return 'Défi réussi : +'+c.gold+' pièces';
 }
 if(a.type==='collection'){
  let item=CHEST_POOL.find(x=>x.id===a.id);
  if(!item||!spark_allowedPool(d).some(x=>x.id===item.id))throw Error('Objet ou saison indisponible');
  if(pl.inventory.includes(item.id))throw Error('Objet déjà possédé');
  if(spark_earnedSeals(d,role)-pl.collectionClaims.length<1)throw Error('Pas assez de sceaux');
  pl.collectionClaims.push({id:item.id,at:today.toISOString()});pl.inventory.push(item.id);
  return '🔮 '+item.name+' rejoint ton inventaire';
 }
 if(a.type==='chest'){
  if(Math.floor(spark_xp(d,role)/250)-pl.opened<1)throw Error('Aucun coffre disponible');
  let roll=Math.random()*100,rarity=roll<60?'common':roll<88?'rare':roll<98?'epic':'mythic';
  let eligible=spark_allowedPool(d);let pool=eligible.filter(x=>x.rarity===rarity);let finalPool=pool.length?pool:eligible;if(!finalPool.length)throw Error('Aucun objet disponible');let item=finalPool[Math.floor(Math.random()*finalPool.length)];pl.opened++;
  return 'Coffre '+rarity+' : '+spark_award(d,role,item);
 }
 throw Error('Action inconnue');
}



window.SparkLogic={mutate:spark_mutate,ensure:spark_ensure};
