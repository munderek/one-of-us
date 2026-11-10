'use strict';
/* ================= CLIENT: shared view state (host also renders from it) ================= */
let role=null,me=0,roomCode='',inRoom=false,lastJoin=null,recon=null,voiceOn=false;
let V=newV();
let myTasks=[],chatLog=[],chatOpen=false,unread=false;
let N={task:-1,body:false,btn:false,vent:-1,tgt:-1,st:'',door:-1,fixL:false,fixC:false};
let taskOpen=-1,holdIv=null,splashUntil=0,splT=null,ejT0=0,selVote=-1,ping=-1,pingTs=0,pendEcho=[],finalHideDone=false,lastVoteN=0,lastPlN=0;
let parts=[],shake=0,flash=0,flashC='#c00',T=0,alarm=0;
const keys=new Set();
function newV(){return{mk:0,ph:'lobby',tm:0,bl:0,md:'normal',pl:{},bodies:[],tp:[0,0],vd:[],vt:[],ej:null,win:null,S:Object.assign({},DEFS),sb:[0,0],dr:[],scd:0,btnT:0}}
function resetClient(){V=newV();myTasks=[];chatLog=[];chatOpen=false;unread=false;parts=[];selVote=-1;flash=0;alarm=0;renderChat()}
function act(m){if(role==='host'&&HG)hostMsg(0,m);else if(role==='client')net.send(m)}

function clientMsg(m){
 if(m.t==='s')applySnap(m);
 else if(m.t==='role')onRole(m);
 else if(m.t==='tasks'){
  const had=myTasks.filter(t=>t.d).length,now=m.l.filter(t=>t.d).length;
  myTasks=m.l;if(now>had&&had+1===now)snd('taskdone');
 }
 else if(m.t==='pong'){ping=Math.max(0,Date.now()-m.ts)}
 else if(m.t==='chat')onChat(m);
 else if(m.t==='vmap'){if(typeof voice!=='undefined')voice.setMap(m.m,me)}
 else if(m.t==='busy')toMenu('Gra już trwa albo pokój jest pełny.');
}
function applySnap(m){
 const prev=V.ph;
 V.mk=m.mk|0;V.ph=m.ph;V.tm=m.tm;V.bl=m.bl;V.md=m.md;V.bodies=m.b;V.tp=m.tp;V.vd=m.vd;V.vt=m.vt;V.ej=m.ej;V.win=m.win;V.S=m.S||V.S;V.sb=m.sb||[0,0];V.dr=m.dr||[];V.scd=m.scd||0;
 const seen=new Set();
 for(const a of m.p){
  const id=a[0];seen.add(id);let q=V.pl[id];
  if(!q)q=V.pl[id]={id,rx:a[1],ry:a[2],ph:0,wk:0};
  q.x=a[1];q.y=a[2];q.f=a[3];q.al=!!a[4];q.v=a[5];q.col=a[6];q.name=a[7];q.mv=a[8];q.ml=a[9];q.kc=a[10];q.imp=!!a[11];q.hat=a[12]||0;q.off=!!a[13];
 }
 for(const id in V.pl)if(!seen.has(+id))delete V.pl[id];
 m.e.forEach(fx);
 const first=!inRoom;inRoom=true;
 recon=null;$('recon').classList.add('hide');
 const pn=m.p.filter(a=>!a[13]).length;
 if(!first&&V.ph==='lobby'&&prev==='lobby'){if(pn>lastPlN)snd('join');else if(pn<lastPlN)snd('discon')}
 lastPlN=pn;
 if(V.ph==='vote'){if(V.vd.length>lastVoteN&&!V.vd.includes(me)||V.vd.length>lastVoteN&&V.vd.includes(me)&&V.vd.length-lastVoteN>1)snd('avote');lastVoteN=V.vd.length}else lastVoteN=0;
 if(V.ph==='play'&&V.md!=='normal'&&!finalHideDone&&V.tm>0&&V.tm<=30){finalHideDone=true;snd('finalhide')}
 if(first)onEnterRoom();
 if(prev!==V.ph)onPhase(prev,V.ph);
}
function onEnterRoom(){
 const q=V.pl[me];
 if(role==='client'){ // push local look preferences once
  act({t:'hat',h:CFG.hat|0});if(CFG.col>=0)act({t:'col',c:CFG.col});
 }else if(HG&&HG.p[0]){HG.p[0].hat=CFG.hat|0;if(CFG.col>=0&&!Object.values(HG.p).some(p=>p.id!==0&&p.col===CFG.col))HG.p[0].col=CFG.col}
 if(CFG.voice)startVoice();
}
function onPhase(prev,cur){
 if(cur==='discuss'){chatLog=[];selVote=-1;renderChat()}
 if(prev==='lobby'&&cur!=='lobby'){chatLog=[];chatOpen=false;renderChat();closePanels()}
 if(cur==='lobby'){myTasks=[];chatLog=[];renderChat();closeTask();$('splash').className='hide';$('rep').classList.add('hide')}
 if(cur==='eject'){ejT0=performance.now();snd('eject')}
 if(cur==='play'){closeTask();$('rep').classList.add('hide');if(prev==='lobby')finalHideDone=false}
 if(cur==='result'&&V.vt.some(v=>v[1]>=0))snd('votedead')
}
function onRole(m){
 const imp=m.r==='imp',hs=m.md==='hs',inf=m.md==='inf';
 const title=imp?(hs?'Poszukiwacz':'Impostor'):'Załogant';
 let sub=imp?(m.mates.length?'Twoi wspólnicy: '+m.mates.join(', '):'Jesteś sam.'):(m.n>1?'Wśród nas jest '+m.n+' impostorów':'Wśród nas jest 1 impostor');
 if(hs)sub=imp?'Znajdź wszystkich załogantów!':'Ukryj się przed poszukiwaczami!';
 if(inf)sub=imp?'Zainfekuj całą załogę!':'Przetrwaj infekcję!';
 const html='<div><div class="sp-t '+(imp?'red':'cyan')+'">'+title+'</div><div class="sp-s">'+esc(sub)+'</div></div>';
 setTimeout(()=>{snd(imp?'roleI':'roleC');splash(html,'',4200)},2000);
}
function splash(html,cls,ms){const s=$('splash');s.className=cls||'';$('spin').innerHTML=html;splashUntil=Math.max(splashUntil,performance.now()+ms);clearTimeout(splT);splT=setTimeout(()=>{s.className='hide'},ms)}
function onChat(m){
 const mq=V.pl[me];
 if(m.gh&&!(mq&&!mq.al))return;
 if(m.id===me){const i=pendEcho.indexOf(m.text);if(i>=0){pendEcho.splice(i,1);return}}
 chatLog.push(m);if(chatLog.length>60)chatLog.shift();renderChat();
 if(CFG.chatsnd)snd('chat',m.id===me?{r:.82,v:.55}:{r:1.12,v:.8});
 if(m.id!==me&&V.ph==='lobby'&&!chatOpen)unread=true;
}
function renderChat(){
 const el=$('clog');if(!el)return;
 el.innerHTML=chatLog.map(m=>'<div class="cm'+(m.gh?' gh':'')+'"><b style="background:'+COLS[m.col]+'">'+esc(m.name)+'</b>'+esc(m.text)+'</div>').join('');
 el.scrollTop=el.scrollHeight;
}

/* ---------- effects ---------- */
function burst(x,y,c,n,sp,l,s){const k=CFG.q===0?.5:1;for(let i=0;i<n*k;i++){const a=Math.random()*6.283,v=sp*rnd(.3,1);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:l*rnd(.6,1.2),m:l,c,s:s||3})}}
function fx(e){
 const k=e[0],mq=V.pl[me];
 const near=(x,y)=>!mq||!mq.al||V.ph==='lobby'||dist(mq.rx,mq.ry,x,y)<650;
 if(k==='k'){
  const x=e[2],y=e[3];
  if(near(x,y)||e[1]===me){snd('kill');burst(x,y,COLS[e[5]],28,320,.7,4);burst(x,y,'#ffffff',8,200,.3,2);if(CFG.shake)shake=Math.max(shake,e[1]===me?20:10)}
  if(e[1]===me){snd('killmusic',{v:.8});flash=.9;flashC='#c00'}
 }else if(k==='vo'||k==='vm'){
  if(near(e[1],e[2])){burst(e[1],e[2],'#9aa7b4',14,140,.5,5);if(k==='vo')snd('ventopen',{v:.8});else snd('vent'+(1+((Math.random()*3)|0)),{v:.8})}
 }else if(k==='m'){
  const body=e[2]>=0;
  snd('report');
  showReport(body?'ZGŁOSZONO CIAŁO':'SPOTKANIE AWARYJNE',body?e[2]:-1,e[3]);
 }else if(k==='bp'){
  V.btnT=.8;snd('button');toast(e[1]+' nacisnął przycisk awaryjny','warn');
 }else if(k==='sab'){
  snd('sabotage');alarm=4;toast('SABOTAŻ: '+e[2],'bad');if(e[1]==='d')snd('doorclose');
 }else if(k==='fix'){
  alarm=0;toast(e[1]==='l'?'Światła naprawione':'Komunikacja naprawiona','good');
 }else if(k==='do'){
  const d=gm().doors[e[1]];if(d&&near(d.cx,d.cy)){burst(d.cx,d.cy,'#aab4c0',10,120,.4,4);snd('dooropen',{v:.7})}
 }else if(k==='st'){
  snd('start');splash('<div class="sp-t wh" style="font-size:96px">Startujemy!</div>','',2000);
 }
}
function showReport(text,bodyCol,name){
 const r=$('rep');r.classList.remove('hide');
 let h='';for(let i=0;i<16;i++)h+='<div class="bar" style="top:'+rnd(2,96).toFixed(1)+'%;width:'+rnd(25,70).toFixed(0)+'%;animation-duration:'+rnd(.6,1.6).toFixed(2)+'s;animation-delay:-'+rnd(0,1.5).toFixed(2)+'s;height:'+rnd(2,8).toFixed(0)+'px"></div>';
 const letters=[...text].map((ch,i)=>ch===' '?'<span class="sp"></span>':'<span style="animation-delay:'+(.35+i*.04).toFixed(2)+'s">'+esc(ch)+'</span>').join('');
 h+='<div class="band">'+(bodyCol<0?'<img src="assets/img/report.png" alt="">':'')+'<div class="tx">'+letters+'</div></div>';
 if(bodyCol>=0)h+='<div class="bd"><div class="sk"><svg viewBox="0 0 40 40" width="52" height="52"><path d="M20 4C11 4 6 10 6 18c0 5 2 8 5 10v6h18v-6c3-2 5-5 5-10 0-8-5-14-14-14z" fill="#f2f4f6" stroke="#1a2128" stroke-width="2.5"/><path d="M11 14l6 6m0-6l-6 6M23 14l6 6m0-6l-6 6" stroke="#1a2128" stroke-width="2.6" stroke-linecap="round"/><path d="M18 26h4M16 30v4M20 30v4M24 30v4" stroke="#1a2128" stroke-width="2.2"/></svg></div><img src="'+bodyURL(bodyCol)+'" alt=""></div>';
 h+='<div class="haz"></div>';
 r.innerHTML=h;
 splashUntil=Math.max(splashUntil,performance.now()+2700);
 clearTimeout(r._t);r._t=setTimeout(()=>r.classList.add('hide'),2700);
}

/* ---------- interaction ---------- */
function calcNear(){
 N={task:-1,body:false,btn:false,vent:-1,tgt:-1,st:'',door:-1,fixL:false,fixC:false};
 const q=V.pl[me];if(!q)return;
 if(V.ph==='lobby'){for(const s of MAPS.lobby.stations)if(dist(q.rx,q.ry,s.x,s.y)<85){N.st=s.k;break}return}
 if(V.ph!=='play')return;
 const M=gm();
 if(q.v<0&&!V.sb[1])for(let i=0;i<myTasks.length;i++){const t=myTasks[i];if(t.d)continue;const Ts=M.tasks[t.id];if(dist(q.rx,q.ry,Ts[0],Ts[1])<80){N.task=i;break}}
 if(q.al&&q.v<0){
  M.doors.forEach((d,i)=>{if(V.dr[i]&&d.panels.some(p=>dist(q.rx,q.ry,p[0],p[1])<80))N.door=i});
  if(V.sb[0]&&dist(q.rx,q.ry,M.lightsP[0],M.lightsP[1])<85)N.fixL=true;
  if(V.sb[1]&&dist(q.rx,q.ry,M.commsP[0],M.commsP[1])<85)N.fixC=true;
 }
 if(q.al&&q.v<0&&V.md==='normal'){
  for(const b of V.bodies)if(dist(q.rx,q.ry,b[1],b[2])<120){N.body=true;break}
  if(q.ml>0&&dist(q.rx,q.ry,M.btn[0],M.btn[1])<95)N.btn=true;
 }
 if(q.imp&&q.al){
  if(q.v>=0)N.vent=q.v;else for(let i=0;i<M.vents.length;i++)if(dist(q.rx,q.ry,M.vents[i][0],M.vents[i][1])<80){N.vent=i;break}
  if(q.v<0&&q.kc<=0&&V.bl<=0){let bd=(KR[V.S.kr]||100)-6;for(const o of Object.values(V.pl))if(o.al&&!o.imp&&o.v<0&&o.id!==me){const d=dist(q.rx,q.ry,o.rx,o.ry);if(d<bd){bd=d;N.tgt=o.id}}}
 }
}
function useAct(){
 if(taskOpen>=0||performance.now()<splashUntil)return;
 if(V.ph==='lobby'){if(N.st==='set')openPanel('gset');else if(N.st==='cus')openPanel('custom');return}
 if(N.fixL)openTask(-1,'lights');
 else if(N.fixC)openTask(-2,'comms');
 else if(N.door>=0)act({t:'door',i:N.door});
 else if(N.task>=0)openTask(myTasks[N.task].id);
 else if(N.btn)act({t:'act',k:'use'});
}
function repAct(){if(N.body)act({t:'act',k:'report'})}
function killAct(){if(N.tgt>=0)act({t:'act',k:'kill'})}
function ventAct(){if(N.vent>=0)act({t:'act',k:'vent'})}
function vmAct(){const q=V.pl[me];if(q&&q.v>=0)act({t:'act',k:'vmove'})}
function getInput(){
 if(taskOpen>=0||performance.now()<splashUntil||!$('setov').classList.contains('hide')||document.activeElement===$('ctext'))return{u:0,d:0,l:0,r:0};
 return{u:keys.has('KeyW')||keys.has('ArrowUp')?1:0,d:keys.has('KeyS')||keys.has('ArrowDown')?1:0,l:keys.has('KeyA')||keys.has('ArrowLeft')?1:0,r:keys.has('KeyD')||keys.has('ArrowRight')?1:0};
}

/* ---------- voice glue ---------- */
function startVoice(){
 if(voiceOn||typeof voice==='undefined')return;voiceOn=true;
 voice.start(pid=>act({t:'vid',id:pid}));
}
function stopVoice(){if(typeof voice!=='undefined')voice.stop();voiceOn=false}
function voiceVol(pid){
 const mq=V.pl[me],q=V.pl[pid];if(!mq||!q)return 0;
 const ph=V.ph;
 if(ph==='lobby'||ph==='over'||ph==='eject')return 1;
 if(ph==='discuss'||ph==='vote'||ph==='result')return !mq.al?1:(q.al?1:0);
 if(q.v>=0&&mq.v<0)return 0;
 if(!mq.al)return 1;
 if(!q.al)return 0;
 if(!CFG.prox)return 1;
 const d=dist(mq.rx,mq.ry,q.rx,q.ry),R=visR()*1.1;
 return d>R?0:1-.75*(d/R);
}
