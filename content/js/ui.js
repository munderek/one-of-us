'use strict';
/* ================= menus / network flow ================= */
let netEpoch=0;
const MENUS=['mMain','mOnline','mCreate','mPublic','mLan','mJoin','mHow','mLogin'];
function showMenu(id){
 for(const s of MENUS)$(s).classList.toggle('hide',s!==id);
 $('who').classList.toggle('hide',!CFG.logged||id==='mLogin');setT($('whoN'),CFG.name);
 if(id==='mLan'){renderLanList();if(window.lan)lan.discover(true)}else if(window.lan)lan.discover(false);
 net.list(id==='mPublic',renderPubList);
}
function showRecon(t){const r=$('recon');r.firstChild.textContent=t;r.classList.remove('hide')}
function errMsg(e){
 if(e==='timeout')return 'Przekroczono czas połączenia. Sieć może blokować połączenie - spróbuj trybu LOKALNEGO albo innego internetu.';
 if(e==='peer-unavailable'||e==='no-room')return 'Nie ma gry o takim kodzie (sprawdź kod albo czy host nadal jest w grze).';
 if(['network','server-error','socket-error','socket-closed','browser-incompatible','no-brokers'].includes(e))return 'Brak połączenia z serwerami gier. Sprawdź internet (sieć może blokować połączenie).';
 if(e==='EADDRINUSE')return 'Port 7777 jest zajęty (czy inna gra już działa?).';
 if(e==='ECONNREFUSED'||e==='EHOSTUNREACH'||e==='ENETUNREACH')return 'Nie znaleziono hosta pod tym adresem.';
 return 'Błąd połączenia ('+e+').';
}
function hostStarted(code){
 saveCfg();role='host';me=0;roomCode=code;HG=newHG();hAdd(0,CFG.name,CFG.tok);resetClient();lastJoin=null;
 applySnap(makeSnap(false));
}
function afterJoin(code){roomCode=code;sendHello()}
function sendHello(){net.send({t:'hello',name:CFG.name,tok:CFG.tok,hat:CFG.hat|0,col:CFG.col})}
async function createOnline(){
 $('crErr').textContent='Tworzę grę...';netEpoch++;
 const pub=$('tgPub').classList.contains('on');
 let r=null,code='';
 for(let i=0;i<4;i++){code=genCode();r=await net.host('online',code,{relay:CFG.relayUrl});if(r.ok||r.err!=='unavailable-id')break}
 if(!r.ok){net.stop();$('crErr').textContent=errMsg(r.err);return}
 $('crErr').textContent='';hostStarted(code);HG.pub=pub;
}
async function joinCode(v,errEl){
 v=String(v||'').trim().toUpperCase();
 if(v.length<5){errEl.textContent='Wpisz 5-znakowy kod gry.';return}
 errEl.textContent='Łączę... (do kilkunastu sekund)';netEpoch++;
 role='client';resetClient();inRoom=false;lastJoin={mode:'online',arg:v};
 const r=await net.join('online',v,{relay:CFG.relayUrl});
 if(!r.ok){role=null;net.stop();errEl.textContent=errMsg(r.err);return}
 errEl.textContent='';afterJoin(v);showRecon('Łączenie z grą...');
}
async function createLan(){
 $('lanErr').textContent='Tworzę grę lokalną...';netEpoch++;
 const r=await net.host('lan',null,{name:CFG.name+' (One of Us)'});
 if(!r.ok){net.stop();$('lanErr').textContent=errMsg(r.err);return}
 $('lanErr').textContent='';hostStarted((r.ips&&r.ips[0]?r.ips[0]:'127.0.0.1')+':7777');
}
async function joinLan(addr){
 addr=String(addr||'').trim();if(!addr){$('lanErr').textContent='Wybierz grę z listy lub wpisz adres IP.';return}
 $('lanErr').textContent='Łączę...';netEpoch++;
 role='client';resetClient();inRoom=false;lastJoin={mode:'lan',arg:addr};
 const r=await net.join('lan',addr);
 if(!r.ok){role=null;net.stop();$('lanErr').textContent=errMsg(r.err);return}
 $('lanErr').textContent='';afterJoin(addr);showRecon('Łączenie z grą...');
}
function toMenu(msg){
 const wasClient=role==='client'&&inRoom;
 if(wasClient){try{net.send({t:'bye'})}catch(e){}}
 const ep=++netEpoch;
 setTimeout(()=>{if(ep===netEpoch)net.stop()},wasClient?200:0);
 stopVoice();role=null;inRoom=false;HG=null;me=0;recon=null;lastJoin=null;resetClient();closeTask();closePanels();closeSettings();
 $('splash').className='hide';$('rep').classList.add('hide');$('recon').classList.add('hide');$('sabm').classList.add('hide');
 showMenu(CFG.logged?'mMain':'mLogin');setT($('mmsg'),msg||'');
 if(msg)setTimeout(()=>setT($('mmsg'),''),7000);
}
async function onClosed(){
 if(role!=='client')return;
 if(!inRoom){toMenu('Nie udało się dołączyć (gra trwa lub pokój jest pełny).');return}
 if(recon||!lastJoin)return;
 const rc=recon={n:0};showRecon('Ponowne łączenie z grą...');
 for(let i=0;i<8&&recon===rc;i++){
  await sleep(i?2000:700);if(recon!==rc)return;
  const r=await net.join(lastJoin.mode,lastJoin.arg,{att:1,to:8000,relay:CFG.relayUrl});
  if(recon!==rc)return;
  if(r.ok){sendHello();await sleep(9000);if(recon===rc){recon=null;onClosed()}return}
 }
 if(recon===rc){recon=null;toMenu('Nie udało się wrócić do gry. Połączenie z hostem utracone.')}
}
net.onMsg(({from,m})=>{if(role==='host')hostMsg(from,m);else if(role==='client')clientMsg(m)});
net.onEvent(e=>{
 if(role==='host'&&HG){
  if(e.type==='join')HG.pend[e.id]=HG.t;
  else if(e.type==='leave')hLeave(e.id);
 }else if(role==='client'){
  if(e.type==='welcome')me=e.id;
  else if(e.type==='closed')onClosed();
 }
});
/* LAN + public lists */
const lanFound={};
if(window.lan)lan.onFound(d=>{lanFound[d.ip+':'+d.port]=Object.assign(d,{t:Date.now()});if(!$('mLan').classList.contains('hide'))renderLanList()});
function renderLanList(){
 const now=Date.now();let h='';
 for(const k in lanFound){if(now-lanFound[k].t>5000){delete lanFound[k];continue}const g=lanFound[k];h+='<div class="lg" data-a="'+esc(k)+'"><span>'+esc(g.name)+'</span><i>'+g.n+'/'+g.max+' graczy - '+esc(g.ip)+'</i></div>'}
 setH($('lanList'),h||'<div class="none">Nie znaleziono gier. Poproś kolegę o założenie gry lokalnej (musicie być w jednej sieci).</div>');
}
function renderPubList(list){
 const h=(list||[]).map(g=>'<div class="pg" data-c="'+esc(g.code)+'"><span>'+esc(g.name)+'</span><i>'+g.n+'/'+g.max+' graczy - '+esc(MODES[g.mode]||'')+' - '+esc(g.map||'')+'</i></div>').join('');
 setH($('pubList'),h||'<div class="none">Brak publicznych gier. Załóż własną i zaznacz „Gra publiczna”, albo wpisz kod od kolegi.</div>');
}
$('lanList').onclick=e=>{const g=e.target.closest('[data-a]');if(g)joinLan(g.dataset.a)};
$('pubList').onclick=e=>{const g=e.target.closest('[data-c]');if(g)joinCode(g.dataset.c,$('pubErr'))};
$('bLan').onclick=()=>{$('lanErr').textContent='';showMenu('mLan')};
$('bOnline').onclick=()=>showMenu('mOnline');
$('bHow').onclick=()=>showMenu('mHow');
$('bSet').onclick=()=>openSettings();
$('bHostRow').onclick=()=>{$('crErr').textContent='';showMenu('mCreate')};
$('bPubRow').onclick=()=>{$('pubErr').textContent='';showMenu('mPublic')};
$('bPrivRow').onclick=()=>{$('jErr').textContent='';showMenu('mJoin');$('jcode').focus()};
$('tgPub').onclick=e=>e.currentTarget.classList.toggle('on');
for(const b of ['bBack1','bBack3','bBackL'])$(b).onclick=()=>showMenu('mMain');
for(const b of ['bBackC','bBackP','bBack2'])$(b).onclick=()=>showMenu('mOnline');
$('bCreate').onclick=createOnline;$('bJoinGo').onclick=()=>joinCode($('jcode').value,$('jErr'));$('bLanHost').onclick=createLan;
$('bLanJoin').onclick=()=>joinLan($('lanIp').value);
$('jcode').addEventListener('keydown',e=>{if(e.key==='Enter')$('bJoinGo').click()});
$('lanIp').addEventListener('keydown',e=>{if(e.key==='Enter')joinLan($('lanIp').value)});
function doLogin(){
 const n=$('lgn').value.trim().slice(0,12);
 if(n.length<2){$('lgErr').textContent='Wpisz pseudonim (min. 2 znaki).';return}
 CFG.name=n;CFG.logged=1;saveCfg();$('lgErr').textContent='';showMenu('mMain');
}
$('bLogin').onclick=doLogin;$('lgn').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
$('bWho').onclick=()=>{$('lgn').value=CFG.name;showMenu('mLogin')};
document.querySelectorAll('img[data-ic]').forEach((im,i)=>{im.src=iconURL([0,10,1][i],[1,3,0][i])});

/* ================= settings overlay (also the ESC menu) ================= */
const SET_TABS=['Dźwięk','Głos','Grafika','Interfejs','Sieć','Discord'];
const SETS=[
 ['Dźwięk','Głośność główna','vol','range',0,100,5,'%'],['Dźwięk','Głośność muzyki','music','range',0,100,5,'%'],['Dźwięk','Głośność efektów','sfx','range',0,100,5,'%'],['Dźwięk','Dźwięki czatu','chatsnd','tog'],
 ['Głos','Czat głosowy','voice','tog'],['Głos','Mikrofon','mic','dev'],['Głos','Głośniki','spk','dev'],
 ['Głos','Czułość mikrofonu','mgain','range',0,300,10,'%'],['Głos','Bramka szumów (próg)','gate','range',0,60,1,''],['Głos','Głośność innych graczy','vvol','range',0,100,5,'%'],
 ['Głos','Usuwanie echa','aec','tog'],['Głos','Redukcja szumów','ns','tog'],['Głos','Automatyczna głośność','agc','tog'],
 ['Głos','Naciśnij i mów','ptt','tog'],['Głos','Klawisz mówienia','pttkey','key'],['Głos','Głos zależny od odległości','prox','tog'],['Głos','Test mikrofonu','','meter'],
 ['Grafika','Jakość grafiki','q','sel',['Niska','Średnia','Wysoka']],['Grafika','Przybliżenie kamery','zoom','range',70,140,5,'%'],
 ['Grafika','Drżenie ekranu','shake','tog'],['Grafika','Nazwy graczy','names','tog'],['Grafika','Winieta','vig','tog'],['Grafika','Licznik FPS','fps','tog'],['Grafika','Pełny ekran (F11)','','btn'],
 ['Interfejs','Kolor obramowań','ol','col'],['Interfejs','Animacje interfejsu','anim','tog'],['Interfejs','Gwiazdy w tle','stars','tog'],['Interfejs','Gęstość gwiazd','dens','range',20,200,10,'%'],['Interfejs','Pseudonim','name','text'],
 ['Sieć','Własny serwer MQTT (wss://...) - opcjonalnie','relayUrl','text'],
 ['Discord','Discord Rich Presence','drpc','tog'],['Discord','Application ID (z Discord Developer Portal)','drpcId','text'],['Discord','Szczegóły','drpcDet','text'],['Discord','Status','drpcSt','text'],
 ['Discord','Klucz dużego obrazu','drpcLi','text'],['Discord','Opis dużego obrazu','drpcLt','text'],['Discord','Klucz małego obrazu','drpcSi','text'],
 ['Discord','Przycisk 1 - tekst','drpcB1l','text'],['Discord','Przycisk 1 - link (https://)','drpcB1u','text'],['Discord','Przycisk 2 - tekst','drpcB2l','text'],['Discord','Przycisk 2 - link (https://)','drpcB2u','text']
];
const OLC=['#ffffff','#38fedc','#50ef39','#f5f557','#ed54ba','#ef7d0d','#6fa8ff'];
let setTab=0,keyCapture=false;
function keyName(c){return c.replace('Key','').replace('Digit','').replace('Arrow','Strzałka ')}
function renderSettings(){
 setH($('settabs'),SET_TABS.map((t,i)=>'<button data-tab="'+i+'" class="'+(i===setTab?'on':'')+'">'+t+'</button>').join(''));
 let h='';
 SETS.filter(s=>s[0]===SET_TABS[setTab]).forEach((s,i)=>{
  const [,l,k,t]=s,v=CFG[k];let ctl='';
  if(t==='range')ctl='<input type="range" min="'+s[4]+'" max="'+s[5]+'" step="'+s[6]+'" value="'+v+'" data-k="'+k+'" data-u="'+s[7]+'"><span class="num">'+v+s[7]+'</span>';
  else if(t==='tog')ctl='<div class="tg'+(v?' on':'')+'" data-tg="'+k+'"></div>';
  else if(t==='sel')ctl='<select data-sel="'+k+'">'+s[4].map((o,j)=>'<option value="'+j+'"'+(j===v?' selected':'')+'>'+o+'</option>').join('')+'</select>';
  else if(t==='dev')ctl='<select data-dev="'+k+'"><option value="">Domyślne urządzenie</option></select>';
  else if(t==='key')ctl='<button class="kb" data-key="1">'+(keyCapture?'Naciśnij klawisz...':keyName(CFG.pttkey))+'</button>';
  else if(t==='meter')ctl='<div class="mtr"><div id="meterfill"></div></div><button class="kb" id="micTest">'+(voice.isTesting()?'Stop':'Test')+'</button>';
  else if(t==='btn')ctl='<button class="kb" data-fs="1">Przełącz</button>';
  else if(t==='col')ctl='<div class="swr">'+OLC.map(c=>'<div class="sw1'+(CFG.ol===c?' on':'')+'" data-ol="'+c+'" style="background:'+c+'"></div>').join('')+'</div>';
  else if(t==='text')ctl='<input class="in" style="width:300px;font-size:16px;padding:6px" maxlength="'+(k==='name'?12:120)+'" value="'+esc(v)+'" data-txt="'+k+'">';
  h+='<div class="sr" style="animation-delay:'+(i*.025).toFixed(3)+'s"><span>'+l+'</span><span class="v">'+ctl+'</span></div>';
 });
 if(SET_TABS[setTab]==='Sieć')h+='<div class="stt">Online działa przez publiczne serwery MQTT (porty 443/8084/8884/8081) - to przechodzi przez większość sieci. Jeśli masz własny serwer MQTT z WebSocket, wpisz go powyżej. Tryb LOKALNY działa bez internetu.</div>';
 if(SET_TABS[setTab]==='Discord')h+='<div class="stt" id="dstat"></div><div class="stt">W tekstach możesz użyć: {phase} {mode} {players} {map} {code}. Wymaga uruchomionego Discorda na komputerze.</div>';
 if(SET_TABS[setTab]==='Głos')h+='<div class="stt" id="vstat"></div><div class="stt">Czat głosowy wymaga internetu (działa też w trybie lokalnym). Zmiana urządzenia restartuje mikrofon.</div>';
 setH($('setbody'),h);
 if(SET_TABS[setTab]==='Głos')fillDevices();
}
async function fillDevices(){
 const d=await voice.devices();
 for(const sel of $('setbody').querySelectorAll('select[data-dev]')){
  const k=sel.dataset.dev,list=k==='mic'?d.mics:d.spks;
  sel.innerHTML='<option value="">Domyślne urządzenie</option>'+list.map(x=>'<option value="'+esc(x.deviceId)+'"'+(CFG[k]===x.deviceId?' selected':'')+'>'+esc(x.label||'Urządzenie')+'</option>').join('');
 }
}
function openSettings(){
 $('setov').classList.remove('hide');$('bLeave').classList.toggle('hide',!role);$('bSetClose').textContent=role?'WZNÓW':'ZAMKNIJ';
 renderSettings();
}
function closeSettings(){$('setov').classList.add('hide');if(voice.isTesting())voice.test(false);keyCapture=false}
function applyCfg(k){
 document.documentElement.style.setProperty('--ol',CFG.ol);
 document.body.classList.toggle('noanim',!CFG.anim);
 if(k==='mgain')voice.setGain();
 if(k==='spk')voice.setSpk();
 if(k==='q')resizeCanvas();
 if(k==='name')setT($('whoN'),CFG.name);
 if(k==='music')updateMusicVolume();
 if(k&&k.indexOf('drpc')===0)pushPresence(true);
 if(k==='voice'){if(CFG.voice&&role&&inRoom)startVoice();else stopVoice()}
 if(['mic','aec','ns','agc'].includes(k)&&voiceOn){stopVoice();setTimeout(()=>{if(CFG.voice&&role)startVoice()},300)}
 saveCfg();
}
$('settabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(b){setTab=+b.dataset.tab;renderSettings()}};
$('setbody').addEventListener('input',e=>{
 const r=e.target;
 if(r.dataset.k){CFG[r.dataset.k]=+r.value;r.parentNode.querySelector('.num').textContent=r.value+r.dataset.u;applyCfg(r.dataset.k)}
 else if(r.dataset.txt){const k=r.dataset.txt;CFG[k]=k==='name'?(r.value.trim()||'Gracz').slice(0,12):r.value.trim().slice(0,120);applyCfg(k)}
});
$('setbody').addEventListener('change',e=>{
 const r=e.target;
 if(r.dataset.sel){CFG[r.dataset.sel]=+r.value;applyCfg(r.dataset.sel)}
 else if(r.dataset.dev){CFG[r.dataset.dev]=r.value;applyCfg(r.dataset.dev)}
});
$('setbody').addEventListener('click',e=>{
 const t=e.target.closest('[data-tg]');
 if(t){const k=t.dataset.tg;CFG[k]=CFG[k]?0:1;t.classList.toggle('on',!!CFG[k]);applyCfg(k);return}
 if(e.target.closest('[data-fs]')){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen()}catch(er){}return}
 if(e.target.closest('[data-key]')){keyCapture=true;renderSettings();return}
 const o=e.target.closest('[data-ol]');if(o){CFG.ol=o.dataset.ol;applyCfg('ol');renderSettings();return}
 if(e.target.id==='micTest'){voice.test(!voice.isTesting());setTimeout(renderSettings,150)}
});
$('bSetClose').onclick=closeSettings;
$('bLeave').onclick=()=>toMenu();
$('bGear').onclick=e=>{const b=e.currentTarget;b.classList.remove('spin');void b.offsetWidth;b.classList.add('spin');if($('setov').classList.contains('hide'))openSettings();else closeSettings()};
$('bChat').onclick=()=>{chatOpen=!chatOpen;unread=false};
$('bMic').onclick=()=>{voice.setMuted(!voice.isMuted())};

/* ================= lobby ================= */
function closePanels(){$('custom').classList.add('hide');$('gset').classList.add('hide')}
function openPanel(id){closePanels();$(id).classList.remove('hide');if(id==='custom')renderCustom(true)}
$('bCustomX').onclick=()=>$('custom').classList.add('hide');
$('bGsetX').onclick=()=>$('gset').classList.add('hide');
$('gset').addEventListener('mousedown',e=>{if(e.target===$('gset'))$('gset').classList.add('hide')});
$('rcode').onclick=()=>{try{navigator.clipboard.writeText(roomCode);toast('Skopiowano','good')}catch(e){}};
$('bStart').onclick=()=>{if(role!=='host'||!HG||HG.ph!=='lobby')return;const r=hStart();if(r){setT($('lobMsg'),r);setTimeout(()=>setT($('lobMsg'),''),3000)}};
let cusTab=0;
document.querySelectorAll('.ct').forEach(b=>b.onclick=()=>{cusTab=+b.dataset.ct;renderCustom(true)});
$('cgrid').onclick=e=>{
 const s=e.target.closest('[data-c]');if(s){CFG.col=+s.dataset.c;saveCfg();act({t:'col',c:CFG.col});return}
 const h=e.target.closest('[data-h]');if(h){CFG.hat=+h.dataset.h;saveCfg();act({t:'hat',h:CFG.hat})}
};
$('gset').onclick=e=>{
 if(role!=='host'||!HG)return;
 const m=e.target.closest('[data-m]');
 if(m){HG.S.mode=m.dataset.m;return}
 const b=e.target.closest('[data-k]');
 if(b){const r=ROWS.find(x=>x[0]===b.dataset.k),d=+b.dataset.d;let v=+(HG.S[r[0]]+d*r[4]).toFixed(2);HG.S[r[0]]=Math.max(r[2],Math.min(r[3],v))}
};
function rowTxt(r,v){
 if(r[5]==='tog')return v?'TAK':'NIE';
 if(r[5]==='sel')return r[6][v]||v;
 return (+(+v).toFixed(2))+r[5];
}
function renderSet(){
 const S=V.S,host=role==='host';
 setH($('gmode'),Object.keys(MODES).map(k=>'<button class="mb'+(S.mode===k?' on':'')+'" '+(host?'data-m="'+k+'"':'')+'>'+MODES[k]+'</button>').join(''));
 setT($('gdesc'),MODE_TXT[S.mode]+(host?'':' (zmienia tylko host)'));
 setH($('grows'),ROWS.map(r=>'<div class="gr"><span>'+r[1]+'</span><span class="gv">'+(host?'<b data-k="'+r[0]+'" data-d="-1">-</b>':'')+'<i>'+rowTxt(r,S[r[0]])+'</i>'+(host?'<b data-k="'+r[0]+'" data-d="1">+</b>':'')+'</span></div>').join(''));
}
let cusKey='';
function renderCustom(force){
 const mq=V.pl[me],mine=mq?mq.col:0,hat=mq?mq.hat:0,taken=Object.values(V.pl).filter(q=>q.id!==me).map(q=>q.col).join(',');
 const key=cusTab+'|'+mine+'|'+hat+'|'+taken;
 if(!force&&key===cusKey)return;cusKey=key;
 document.querySelectorAll('.ct').forEach(b=>b.classList.toggle('on',+b.dataset.ct===cusTab));
 $('ctHat').src=iconURL(mine,1);
 const g=$('cgrid');g.className=cusTab===1?'hats':'';
 if(cusTab===0){
  setT($('ctitle'),'KOLORY');
  const tk=new Set(Object.values(V.pl).filter(q=>q.id!==me).map(q=>q.col));
  g.innerHTML=COLS.map((c,i)=>'<div class="sw'+(i===mine?' me':'')+(tk.has(i)?' tk':'')+'" data-c="'+i+'" style="background:'+c+'"></div>').join('');
  setT($('cname'),(CNAMES[mine]||'').toUpperCase());
 }else{
  setT($('ctitle'),'KOSMETYKI');
  g.innerHTML=HATS.map((n,i)=>'<div class="sw ht'+(i===hat?' me':'')+'" data-h="'+i+'" title="'+n+'" style="background-image:url('+(i?iconURL(mine,i):iconURL(mine,0))+')"></div>').join('');
  setT($('cname'),HATS[hat].toUpperCase());
 }
 $('cprev').src=bigURL(mine,hat);
}
function renderLobby(){
 const L=Object.values(V.pl).filter(q=>!q.off);
 setT($('rcode'),(net.mode()==='lan'?'IP: ':'KOD: ')+roomCode);
 setT($('pcount'),'Gracze: '+L.length+'/'+MAXP);
 $('bStart').classList.toggle('hide',role!=='host');
 $('waitTxt').classList.toggle('hide',role==='host');
 if(!$('custom').classList.contains('hide'))renderCustom(false);
 if(!$('gset').classList.contains('hide'))renderSet();
}

/* ================= HUD (in game) ================= */
function renderHud(){
 const q=V.pl[me];if(!q)return;
 const lobby=V.ph==='lobby',play=V.ph==='play';
 $('game').classList.toggle('hide',!play);
 if(play){
  const tp=V.tp,pc=tp[1]?tp[0]/tp[1]*100:0;
  $('pfill').style.width=pc+'%';
  setT($('ptxt'),V.S.tb===2?'Postęp ukryty':'Postęp zadań');
  setH($('tlist'),V.sb[1]?'<div style="color:#ff8a8a">Komunikacja zakłócona - lista zadań niedostępna</div>':
   (q.imp?'<div style="color:#ff8a8a">Fałszywe zadania:</div>':'<div style="color:#9ee">Zadania:</div>')+myTasks.map(t=>{const Tt=gm().tasks[t.id];return '<div class="'+(t.d?'d':'')+'">'+Tt[4]+': '+Tt[3]+'</div>'}).join(''));
  const m=Math.max(0,Math.ceil(V.tm));
  setT($('tmr'),V.md!=='normal'?(V.md==='hs'?'Czas: ':'Przetrwaj: ')+Math.floor(m/60)+':'+String(m%60).padStart(2,'0'):'');
  const sb=$('sabbar');
  if(V.sb[0]||V.sb[1]){sb.classList.remove('hide');setT(sb,V.sb[0]?'Światła wyłączone - napraw w: '+gm().lightsRoom:'Komunikacja zakłócona - napraw w: '+gm().commsRoom)}
  else sb.classList.add('hide');
 }
 const imp=q.imp&&play;
 $('bKill').classList.toggle('hide',!imp);$('bVent').classList.toggle('hide',!imp);
 $('bSab').classList.toggle('hide',!(imp&&V.md==='normal'));$('bVm').classList.toggle('hide',!(imp&&q.v>=0));
 $('bRep').classList.toggle('hide',!(play&&V.md==='normal'));
 $('bUse').classList.toggle('off',!(N.task>=0||N.btn||N.st||N.door>=0||N.fixL||N.fixC));
 $('bUse').classList.toggle('hide',!(lobby||play));
 $('bRep').classList.toggle('off',!N.body);
 $('bKill').classList.toggle('off',!(N.tgt>=0));
 $('bVent').classList.toggle('off',N.vent<0);
 $('bSab').classList.toggle('off',!(imp&&q.v<0&&V.scd<=0&&!V.sb[0]&&!V.sb[1]&&V.bl<=0));
 setT($('ventlbl'),q.v>=0?'WYJDŹ (V)':'SZYB (V)');
 setT($('killcd'),q.kc>0?String(Math.ceil(q.kc))+' s':'Q');
 setT($('sabcd'),V.scd>0?String(V.scd)+' s':'SABOTAŻ');
 if(!play)$('sabm').classList.add('hide');
}
$('bUse').onclick=useAct;$('bRep').onclick=repAct;$('bKill').onclick=killAct;$('bVent').onclick=ventAct;$('bVm').onclick=vmAct;
$('bSab').onclick=()=>{
 const m=$('sabm');if(!m.classList.contains('hide')){m.classList.add('hide');return}
 const S=V.S;let h='<h2>SABOTAŻ</h2>';
 if(S.sl)h+='<button class="ob" data-s="lights">Światła</button>';
 if(S.sc)h+='<button class="ob" data-s="comms">Komunikacja</button>';
 if(S.sd)gm().rn.forEach((n,i)=>{h+='<button class="ob" data-s="doors" data-r="'+i+'">Drzwi: '+n+'</button>'});
 m.style.maxHeight='520px';m.style.overflow='auto';m.innerHTML=h;m.classList.remove('hide');
};
$('sabm').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;act({t:'act',k:'sab',s:b.dataset.s,r:+b.dataset.r||0});$('sabm').classList.add('hide')};

/* ================= meeting & end ================= */
$('mgrid').onclick=e=>{
 const mq=V.pl[me];if(!mq||!mq.al||V.ph!=='vote'||V.vd.includes(me))return;
 const y=e.target.closest('[data-y]');
 if(y){if(selVote>=0){act({t:'vote',to:selVote});snd('vote');selVote=-1}return}
 if(e.target.closest('[data-n]')){selVote=-1;return}
 const c=e.target.closest('.card');if(c)selVote=+c.dataset.id;
};
$('mskip').onclick=()=>{const mq=V.pl[me];if(mq&&mq.al&&V.ph==='vote'&&!V.vd.includes(me)){act({t:'vote',to:-1});snd('vote')}};
function renderMeet(){
 const mq=V.pl[me],alive=!!(mq&&mq.al),can=V.ph==='vote'&&alive&&!V.vd.includes(me),showImp=mq&&(mq.imp||!mq.al);
 const L=Object.values(V.pl).sort((a,b)=>a.id-b.id);
 setH($('mgrid'),L.map(q=>{
  const chips=V.vt.filter(v=>v[1]===q.id&&V.pl[v[0]]).map(v=>'<img src="'+iconURL(V.pl[v[0]].col,V.pl[v[0]].hat)+'">').join('');
  return '<div class="card'+(q.al?'':' dead')+(selVote===q.id&&can?' sel':'')+(showImp&&q.imp?' imp':'')+'" data-id="'+q.id+'"><img src="'+iconURL(q.col,q.hat)+'"><span class="nm">'+esc(q.name)+(q.id===me?' (Ty)':'')+(q.off?' (rozł.)':'')+'</span>'+
   (V.ph==='vote'&&V.vd.includes(q.id)?'<span class="vb">GŁOS</span>':'')+'<div class="vts">'+chips+'</div>'+
   (can&&selVote===q.id&&q.al?'<div class="cf"><b data-y="1">TAK</b><b data-n="1">NIE</b></div>':'')+'</div>'}).join(''));
 setH($('mskipv'),V.vt.filter(v=>v[1]===-1&&V.pl[v[0]]).map(v=>'<img src="'+iconURL(V.pl[v[0]].col,V.pl[v[0]].hat)+'">').join(''));
 $('mskip').classList.toggle('off',!can);
 setT($('mtitle'),V.ph==='discuss'?'Kto jest Impostorem?':V.ph==='vote'?'Głosowanie':'Wyniki głosowania');
 setT($('mtimer'),V.ph==='result'?'':(V.ph==='discuss'?'Dyskusja ':'Czas ')+Math.max(0,Math.ceil(V.tm))+' s');
}
function renderEnd(){
 const mq=V.pl[me],iWin=(V.win==='imp')===!!(mq&&mq.imp);
 const t=$('endt');setT(t,iWin?'ZWYCIĘSTWO':'PORAŻKA');t.style.color=V.win==='imp'?'#e11':'#38b6ff';
 setH($('endl'),Object.values(V.pl).sort((a,b)=>a.id-b.id).map((q,i)=>'<div class="'+(q.imp?'im':'')+'" style="animation-delay:'+(i*.08).toFixed(2)+'s"><img src="'+iconURL(q.col,q.hat)+'">'+esc(q.name)+'<br>'+(q.imp?(V.md==='hs'?'Poszukiwacz':'Impostor'):'Załogant')+'</div>').join(''));
}
$('csend').onclick=sendChat;
function sendChat(){
 const el=$('ctext'),t=el.value.trim().slice(0,100);if(!t)return;el.value='';
 if(role==='client'){const q=V.pl[me];if(q&&(V.ph==='lobby'||V.ph==='discuss'||V.ph==='vote')){pendEcho.push(t);chatLog.push({t:'chat',id:me,name:q.name,col:q.col,text:t,gh:q.al?0:1});if(chatLog.length>60)chatLog.shift();renderChat();if(CFG.chatsnd)snd('chat',{r:.82,v:.55})}}
 act({t:'chat',text:t});
}
$('ctext').addEventListener('keydown',e=>{if(e.key==='Enter')sendChat()});

/* ================= tasks ================= */
let taskKind='',scanH=null;
function closeTask(){if(taskOpen!==-1){if(taskKind==='wires')snd('wiresclose');else if(taskKind==='comms')snd('wificlose')}taskKind='';if(scanH&&scanH.stop){scanH.stop();scanH=null}taskOpen=-1;clearInterval(holdIv);$('task').classList.add('hide')}
$('tclose').onclick=closeTask;
function buildHold(b,done,ms,scan){
 const bar=document.createElement('div'),fill=document.createElement('div'),btn=document.createElement('button');
 bar.className='hbar';bar.appendChild(fill);btn.className='hbtn';btn.textContent='TRZYMAJ';let pr=0,fin=false;
 btn.onmousedown=()=>{if(fin)return;clearInterval(holdIv);if(scan)scanH=snd('scan');else snd('taskprog');holdIv=setInterval(()=>{pr+=40/ms;fill.style.width=Math.min(100,pr*100)+'%';if(pr>=1){fin=true;clearInterval(holdIv);if(scanH&&scanH.stop){scanH.stop();scanH=null}done()}},40)};
 const rel=()=>{if(fin)return;clearInterval(holdIv);if(scanH&&scanH.stop){scanH.stop();scanH=null}pr=0;fill.style.width='0%'};
 btn.onmouseup=rel;btn.onmouseleave=rel;b.append(bar,btn);
}
function buildSeq(b,done){
 let nxt=1;const g=document.createElement('div');g.className='sg';
 shuffle([1,2,3,4,5,6,7,8,9]).forEach(n=>{const e=document.createElement('button');e.className='sb';e.textContent=n;
  e.onclick=()=>{if(n===nxt){e.classList.add('ok');snd('taskprog',{v:.7});nxt++;if(nxt>9)done()}else{nxt=1;g.querySelectorAll('.sb').forEach(x=>x.classList.remove('ok'))}};g.appendChild(e)});
 b.appendChild(g);
}
function buildWires(b,done){
 const ns='http://www.w3.org/2000/svg',WC=['#e8332e','#2f6fe8','#f0c935','#e85bc0'],ys=[42,110,178,246],R=shuffle([0,1,2,3]);
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 440 300');svg.setAttribute('class','wsvg');
 const mk=(par,tag,at)=>{const e=document.createElementNS(ns,tag);for(const k in at)e.setAttribute(k,at[k]);par.appendChild(e);return e};
 mk(svg,'rect',{x:0,y:0,width:62,height:300,fill:'#1d242c'});mk(svg,'rect',{x:378,y:0,width:62,height:300,fill:'#1d242c'});
 const lay=mk(svg,'g',{});
 const dd=(x1,y1,x2,y2)=>'M'+x1+' '+y1+' C'+(x1+90)+' '+y1+' '+(x2-90)+' '+y2+' '+x2+' '+y2;
 const cable=col=>({a:mk(lay,'path',{fill:'none',stroke:'#050607','stroke-width':15,'stroke-linecap':'round'}),b:mk(lay,'path',{fill:'none',stroke:col,'stroke-width':9,'stroke-linecap':'round'})});
 const setD=(o,x1,y1,x2,y2)=>{const d=dd(x1,y1,x2,y2);o.a.setAttribute('d',d);o.b.setAttribute('d',d)};
 const lp=[],connected=[false,false,false,false];let cnt=0,drag=null;
 for(let i=0;i<4;i++){mk(svg,'rect',{x:30,y:ys[i]-14,width:30,height:28,rx:6,fill:WC[i],stroke:'#050607','stroke-width':4});lp[i]=mk(svg,'circle',{cx:44,cy:ys[i],r:11,fill:'#222',stroke:'#050607','stroke-width':3,style:'cursor:pointer'})}
 for(let j=0;j<4;j++){mk(svg,'rect',{x:380,y:ys[j]-14,width:30,height:28,rx:6,fill:WC[R[j]],stroke:'#050607','stroke-width':4});mk(svg,'circle',{cx:396,cy:ys[j],r:9,fill:'#222',stroke:'#050607','stroke-width':3})}
 const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
 lp.forEach((el,i)=>el.addEventListener('pointerdown',e=>{if(connected[i]||drag)return;e.preventDefault();svg.setPointerCapture(e.pointerId);drag={i,o:cable(WC[i])};const p=pt(e);setD(drag.o,44,ys[i],p.x,p.y)}));
 svg.addEventListener('pointermove',e=>{if(!drag)return;const p=pt(e);setD(drag.o,44,ys[drag.i],p.x,p.y)});
 svg.addEventListener('pointerup',e=>{
  if(!drag)return;const p=pt(e);let hit=-1;
  for(let j=0;j<4;j++)if(Math.hypot(p.x-396,p.y-ys[j])<32)hit=j;
  if(hit>=0&&R[hit]===drag.i&&!connected[drag.i]){connected[drag.i]=true;setD(drag.o,44,ys[drag.i],396,ys[hit]);mk(svg,'circle',{cx:396,cy:ys[hit],r:5,fill:'#7de06a'});snd('wire'+(1+((Math.random()*3)|0)));cnt++;if(cnt===4)done()}
  else{drag.o.a.remove();drag.o.b.remove()}
  drag=null;
 });
 b.appendChild(svg);
}
function buildLights(b,done){
 const w=document.createElement('div');w.className='lsw';
 let st=[1,1,1,1,1].map(()=>Math.random()<.5?1:0);if(st.every(x=>x))st[(Math.random()*5)|0]=0;
 const els=st.map((v,i)=>{const e=document.createElement('div');e.className='ls'+(v?' on':'');e.onclick=()=>{st[i]=st[i]?0:1;e.classList.toggle('on',!!st[i]);snd('wifislider',{v:.7});if(st.every(x=>x))done()};w.appendChild(e);return e});
 const t=document.createElement('div');t.style.cssText='font-size:17px;color:#bcd';t.textContent='Przestaw wszystkie przełączniki do góry';
 b.append(w,t);
}
function openTask(id,kind){
 taskOpen=typeof id==='number'?id:-9;$('task').classList.remove('hide');
 const b=$('tbody');b.innerHTML='';let fin=false;
 const myId=taskOpen;
 const finish=fn=>()=>{if(fin)return;fin=true;setTimeout(()=>{if(taskOpen===myId){closeTask();fn()}},400)};
 taskKind=kind||'';
 if(kind==='lights'){$('ttitle').textContent='Napraw światła';buildLights(b,finish(()=>act({t:'fix',k:'l'})));return}
 if(kind==='comms'){snd('wifiopen');$('ttitle').textContent='Napraw komunikację';buildHold(b,finish(()=>act({t:'fix',k:'c'})),2500);return}
 const Tk=gm().tasks[id];$('ttitle').textContent=Tk[3];taskKind=Tk[2];if(Tk[2]==='wires')snd('wiresopen');
 const done=finish(()=>act({t:'task',id}));
 if(Tk[2]==='seq')buildSeq(b,done);else if(Tk[2]==='wires')buildWires(b,done);else buildHold(b,done,2200,/^Skan/.test(Tk[3]));
}

/* ================= HUD sync (visibility of every layer) ================= */
function syncUI(){
 const inR=!!role&&inRoom,ph=V.ph;
 $('menu').classList.toggle('hide',!!role);
 $('hudw').classList.toggle('hide',!inR);
 $('lobby').classList.toggle('hide',!(inR&&ph==='lobby'));
 const meet=inR&&(ph==='discuss'||ph==='vote'||ph==='result');
 $('meet').classList.toggle('hide',!meet);
 $('end').classList.toggle('hide',!(inR&&ph==='over'));
 $('side').classList.toggle('hide',meet&&false);
 $('bChat').classList.toggle('hide',!(inR&&(ph==='lobby'||ph==='discuss'||ph==='vote')));
 $('chatDot').classList.toggle('hide',!unread);
 $('bMic').classList.toggle('hide',!(inR&&voiceOn));
 $('bMic').classList.toggle('talk',!!(voice.talk&&voice.talk[me]));
 $('micX').classList.toggle('hide',!voice.isMuted());
 const chat=inR&&((ph==='lobby'&&chatOpen)||ph==='discuss'||ph==='vote');
 $('chat').classList.toggle('hide',!chat);
 $('chat').classList.toggle('c-m',ph!=='lobby');
 if(!chat&&document.activeElement===$('ctext'))$('ctext').blur();
 if(inR&&ph==='lobby')renderLobby();
 if(meet)renderMeet();
 if(inR&&ph==='over')renderEnd();
 if(inR)renderHud();
 if(!$('setov').classList.contains('hide')&&SET_TABS[setTab]==='Głos'){
  const mf=$('meterfill');if(mf)mf.style.width=Math.round(voice.level()*100)+'%';
  const vs=$('vstat');if(vs)setT(vs,voice.status()||(CFG.voice?'':'Czat głosowy wyłączony'));
  const ds=$('dstat');if(ds)setT(ds,drpcStatus);
 }
}
