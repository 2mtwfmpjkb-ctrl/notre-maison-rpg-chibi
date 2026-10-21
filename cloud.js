import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,onSnapshot,runTransaction} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig,ROOM_ID,EDDY_UID,KARINE_UID} from './firebase-config.js';
const $=s=>document.querySelector(s);
const status=$('#cloudStatus'),login=$('#loginPanel'),game=$('#gameRoot');
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const ref=doc(db,'maisons',ROOM_ID);
let uid=null,role=null,unsub=null,busy=false,lastDone=new Set(),initialSnapshot=true;
function say(msg){status.textContent=msg}
function resetUI(){game.classList.add('hidden');login.classList.remove('hidden');$('#cloudLogout').classList.add('hidden')}
$('#loginForm').addEventListener('submit',async e=>{
 e.preventDefault();$('#loginError').textContent='';
 try{await signInWithEmailAndPassword(auth,$('#loginEmail').value.trim(),$('#loginPassword').value)}
 catch(err){$('#loginError').textContent='Connexion impossible : vérifie ton adresse e-mail et ton mot de passe.'}
});
$('#cloudLogout').addEventListener('click',()=>signOut(auth));
onAuthStateChanged(auth,user=>{
 if(unsub){unsub();unsub=null}uid=user?.uid||null;role=uid===EDDY_UID?'E':uid===KARINE_UID?'C':null;
 if(!user){say('Connecte-toi pour jouer.');resetUI();return}
 if(!role){say('Ce compte ne fait pas partie du foyer.');resetUI();return}
 login.classList.add('hidden');game.classList.remove('hidden');$('#cloudLogout').classList.remove('hidden');
 say('Connexion '+(role==='E'?'Eddy':'Karine')+' · synchronisation Spark');
 initialSnapshot=true;lastDone=new Set();
 unsub=onSnapshot(ref,snap=>{
  if(!snap.exists()){
   window.RPG.setData(window.RPG.initial(),role);
   say('Maison prête · lance ta première quête pour créer la sauvegarde');return;
  }
  const state=snap.data().state;if(!state)return;
  const keys=new Set(Object.keys(state.done||{}));
  if(!initialSnapshot){
   for(const key of keys){
    if(lastDone.has(key))continue;
    const item=state.done[key];
    if(item?.by&&item.by!==role){
     const name=item.by==='E'?'Eddy':'Karine';
     window.RPG.toast('🔔 '+name+' a terminé : '+(item.name||'une quête'));
     break;
    }
   }
  }
  initialSnapshot=false;lastDone=keys;
  window.RPG.setData(state,role);
  say('✓ Synchronisé · '+(role==='E'?'Eddy':'Karine'));
 },err=>say('Erreur Firestore : '+err.message));
});
window.CloudSync={active:true,async perform(action){
 if(!uid||!role)throw Error('Connecte-toi');
 if(busy)throw Error('Une action est déjà en cours');
 if(!navigator.onLine)throw Error('Connexion Internet requise');
 busy=true;
 try{
  const message=await runTransaction(db,async tx=>{
   const snap=await tx.get(ref);
   const state=snap.exists?snap.data().state:window.RPG.initial();
   window.SparkLogic.ensure(state);
   const result=window.SparkLogic.mutate(state,action,role);
   tx.set(ref,{state});
   return result;
  });
  window.RPG.toast('✓ '+message);
 }finally{busy=false}
}};
