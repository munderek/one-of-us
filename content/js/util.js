'use strict';
const $=id=>document.getElementById(id);
const W=1280,H=720,MAXP=10,STEP=1/60;
const FONT="'Comic Sans MS','Chalkboard SE','Comic Neue','Marker Felt',cursive";
const COLS=['#c51111','#132ed1','#117f2d','#ed54ba','#ef7d0d','#f5f557','#3f474e','#d6e0f0','#6b2fbb','#71491e','#38fedc','#50ef39','#7b2d3e','#f5c9d8','#f2eaa8','#7e8fa3','#9b8e7e','#e9757a'];
const CNAMES=['Czerwony','Niebieski','Zielony','Różowy','Pomarańczowy','Żółty','Czarny','Biały','Fioletowy','Brązowy','Turkusowy','Limonkowy','Bordowy','Jasnoróżowy','Bananowy','Szary','Beżowy','Koralowy'];
const HATS=['Brak','Korona','Czapka z daszkiem','Czapka zimowa','Czapeczka urodzinowa','Aureola','Kocie uszy','Kapelusz kowbojski','Słuchawki','Kiełek'];
const DEFS={mode:'normal',map:0,imps:1,kcd:25,kr:1,cv:1,iv:1.25,spd:1,tasks:3,tb:0,meet:1,disc:15,vote:30,anon:0,cf:1,hst:180,sl:1,sc:1,sd:1,sabcd:30,doort:25};
const KR=[75,100,130];
const MODES={normal:'Klasyczny',hs:'Chowany',inf:'Infekcja'};
const MODE_TXT={normal:'Załoga robi zadania, impostorzy zabijają i sabotują. Zgłaszaj ciała, rozmawiaj i głosuj.',hs:'Poszukiwacze są ślepi przez 15 s i widzą mało. Reszta ukrywa się do końca czasu lub robi zadania. Bez spotkań i sabotaży.',inf:'Zabici stają się impostorami. Załoga przetrwa do końca czasu lub skończy zadania. Bez spotkań i sabotaży.'};
/* [key,label,min,max,step,unit('' ' s' 'x' 'tog' 'sel'),options] */
const ROWS=[
 ['map','Mapa',0,1,1,'sel',['Statek','Laboratorium']],['imps','Impostorzy',1,3,1,''],['kcd','Odnowienie zabicia',10,60,5,' s'],['kr','Dystans zabicia',0,2,1,'sel',['Krótki','Średni','Długi']],
 ['cv','Widzenie załogi',.5,2,.25,'x'],['iv','Widzenie impostora',.5,2.5,.25,'x'],['spd','Prędkość graczy',.75,1.5,.25,'x'],
 ['tasks','Zadania na gracza',1,6,1,''],['tb','Pasek zadań',0,2,1,'sel',['Zawsze','Tylko po spotkaniach','Ukryty']],
 ['meet','Spotkania awaryjne',0,3,1,''],['disc','Czas dyskusji',0,60,5,' s'],['vote','Czas głosowania',15,120,15,' s'],
 ['anon','Anonimowe głosowanie',0,1,1,'tog'],['cf','Pokazuj kim był wyrzucony',0,1,1,'tog'],
 ['sl','Sabotaż: światła',0,1,1,'tog'],['sc','Sabotaż: komunikacja',0,1,1,'tog'],['sd','Sabotaż: drzwi',0,1,1,'tog'],
 ['sabcd','Odnowienie sabotażu',10,60,5,' s'],['doort','Czas zamknięcia drzwi',10,60,5,' s'],['hst','Czas rundy (Chowany/Infekcja)',60,300,30,' s']
];

/* ---------- local settings ---------- */
const CFG0={vol:70,sfx:100,music:45,logged:0,relayUrl:'',drpc:0,drpcId:'',drpcDet:'{phase}',drpcSt:'{mode} - graczy: {players}',drpcLi:'',drpcLt:'One of Us',drpcSi:'',drpcB1l:'',drpcB1u:'',drpcB2l:'',drpcB2u:'',chatsnd:1,voice:0,mic:'',spk:'',mgain:100,gate:6,aec:1,ns:1,agc:1,ptt:0,pttkey:'KeyT',vvol:100,prox:1,
 q:2,shake:1,names:1,fps:0,zoom:100,vig:1,stars:1,dens:100,anim:1,ol:'#ffffff',name:'Gracz',hat:0,col:-1,tok:''};
let CFG=Object.assign({},CFG0);
try{Object.assign(CFG,JSON.parse(localStorage.getItem('oou2')||'{}'))}catch(e){}
function saveCfg(){try{localStorage.setItem('oou2',JSON.stringify(CFG))}catch(e){}}
if(!CFG.tok){CFG.tok=Math.random().toString(36).slice(2,12);saveCfg()}

/* ---------- helpers ---------- */
const rnd=(a,b)=>a+Math.random()*(b-a);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return a}
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function setH(el,h){if(el._h!==h){el._h=h;el.innerHTML=h}}
function setT(el,t){if(el._t!==t){el._t=t;el.textContent=t}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function genCode(){const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=a[(Math.random()*a.length)|0];return s}

/* ---------- sounds: short effects decoded to buffers (low latency), music as looping streams ---------- */
const SFX_LIST=['sabotage','kill','killmusic','eject','start','button','chat','report','roleC','roleI','taskdone','taskprog','hover','select','vent1','vent2','vent3','ventopen','avote','lockin','votedead','votetimer','step','join','discon','dooropen','doorclose','wire1','wire2','wire3','wiresopen','wiresclose','scan','wifiopen','wificlose','wifislider','finalhide'];
let AC=null;const BUF={},SND={};
function audioCtx(){if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)()}if(AC.state==='suspended')AC.resume().catch(()=>{});return AC}
async function loadSounds(){
 if(window.app&&app.readFile){
  for(const n of SFX_LIST){try{const u8=await app.readFile('assets/snd/'+n+'.mp3');const ab=u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength);BUF[n]=await audioCtx().decodeAudioData(ab)}catch(e){}}
 }
 for(const n of SFX_LIST)if(!BUF[n]){try{const a=new Audio('assets/snd/'+n+'.mp3');a.preload='auto';SND[n]=a}catch(e){}}
}
function snd(n,o){
 o=o||{};
 const vol=Math.min(1,(CFG.vol/100)*(CFG.sfx/100)*(o.v==null?1:o.v));
 if(vol<=0)return null;
 try{
  if(BUF[n]){
   const c=audioCtx(),s=c.createBufferSource(),g=c.createGain();
   s.buffer=BUF[n];s.playbackRate.value=o.r||1;g.gain.value=vol;s.connect(g);g.connect(c.destination);s.start(0);
   return{stop:()=>{try{s.stop()}catch(e){}}};
  }
  const b=SND[n];if(!b)return null;
  const a=b.cloneNode();a.volume=vol;a.playbackRate=o.r||1;try{a.preservesPitch=false}catch(e){}a.play().catch(()=>{});
  return{stop:()=>{try{a.pause()}catch(e){}}};
 }catch(e){return null}
}
const MUS={},MUS_VOL={music_menu:.55,music_lobby:.3,music_ship:.35,music_radio:.35};
let curMus=null;
function musVol(n){return Math.min(1,(MUS_VOL[n]||.35)*(CFG.music/100)*(CFG.vol/100)*1.6)}
function setMusic(n){
 if(curMus===n)return;
 curMus=n;
 if(!n)return;
 let a=MUS[n];
 if(!a){try{a=new Audio('assets/snd/'+n+'.mp3');a.loop=true;a.volume=0;MUS[n]=a}catch(e){return}}
 a.play().catch(()=>{});
}
function updateMusicVolume(){}
setInterval(()=>{
 for(const n in MUS){
  const a=MUS[n],target=n===curMus?musVol(n):0;
  const d=target-a.volume;
  if(Math.abs(d)<.012)a.volume=Math.max(0,Math.min(1,target));else a.volume=Math.max(0,Math.min(1,a.volume+Math.sign(d)*.03));
  if(n!==curMus&&a.volume<=.005&&!a.paused)a.pause();
 }
},60);

/* ---------- toasts ---------- */
function toast(t,cls){
 const c=$('toasts');if(!c)return;
 const el=document.createElement('div');el.className='toast '+(cls||'');el.textContent=t;c.appendChild(el);
 while(c.children.length>4)c.firstChild.remove();
 setTimeout(()=>el.classList.add('out'),2600);setTimeout(()=>el.remove(),3200);
}
