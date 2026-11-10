'use strict';
/* ================= HOST: authoritative simulation ================= */
let HG=null;
function newHG(){return{ph:'lobby',tm:0,bl:0,t:0,p:{},pend:{},bodies:[],votes:{},vt:[],S:Object.assign({},DEFS),map:MAPS.lobby,mapKey:'ship',mode:'normal',ej:null,win:null,evq:[],inp:{},exId:-1,
 pm:null,sab:{l:0,c:0},dr:[],sabCd:0,tpShow:[0,0],vmap:{},pub:false}}
function ev(e){HG.evq.push(e);fx(e)}
function placeLobby(p){for(let i=0;i<40;i++){const x=650+rnd(-250,250),y=rnd(290,570);if(free(MAPS.lobby,x,y,null,false)){p.x=x;p.y=y;return}}p.x=650;p.y=460}
function hAdd(id,name,tok){
 const used=new Set(Object.values(HG.p).map(p=>p.col));let c=0;while(used.has(c))c++;
 const p=HG.p[id]={id,name,tok:tok||'',col:c%12,hat:0,x:650,y:430,f:1,al:true,imp:false,v:-1,kc:0,ml:1,mv:0,tasks:[],done:[],off:false,dc:0};placeLobby(p);return p;
}
function sendTo(id,m){if(id===0)clientMsg(m);else net.sendTo(id,m)}
function bcast(m){net.send(m);clientMsg(m)}
function sendTasks(p){sendTo(p.id,{t:'tasks',l:p.tasks.map(id=>({id,d:p.done.includes(id)?1:0}))})}
function taskProg(){let d=0,t=0;for(const p of Object.values(HG.p))if(!p.imp){t+=p.tasks.length;d+=p.done.length}return[d,t]}
function calcWin(){
 const L=Object.values(HG.p),crew=L.filter(p=>!p.imp&&p.al).length,imps=L.filter(p=>p.imp&&p.al).length,tp=taskProg();
 if(imps===0)return 'crew';
 if(HG.mode==='normal'){if(imps>=crew)return 'imp'}else if(crew===0)return 'imp';
 if(tp[1]>0&&tp[0]>=tp[1])return 'crew';
 return null;
}
function endGame(w){HG.ph='over';HG.win=w;HG.tm=9;HG.bodies=[];HG.pm=null;HG.sab={l:0,c:0};HG.dr.fill(0);for(const p of Object.values(HG.p))p.v=-1;ev(['o',w])}
function checkWin(){const w=calcWin();if(w)endGame(w);return w}
function spawnAll(){const ps=Object.values(HG.p),M=HG.map,sp=M.spawn,R=M.spawnR;ps.forEach((p,i)=>{const a=i/ps.length*6.283;p.x=sp[0]+Math.cos(a)*R[0];p.y=sp[1]+Math.sin(a)*R[1];p.v=-1})}
function hStart(){
 const G=HG,ps=shuffle(Object.values(G.p).filter(p=>!p.off));
 if(ps.length<2)return 'Potrzeba co najmniej 2 graczy.';
 G.mode=G.S.mode;G.mapKey=MAPKEYS[G.S.map|0]||'ship';G.map=MAPS[G.mapKey];G.bodies=[];G.votes={};G.vt=[];G.ej=null;G.win=null;G.pm=null;G.sab={l:0,c:0};G.dr=G.map.doors.map(()=>0);G.sabCd=20;
 for(const p of Object.values(G.p))if(p.off)delete G.p[p.id];
 const n=ps.length,ni=Math.min(G.S.imps,Math.max(1,Math.floor((n-1)/2)));
 const ids=[...Array(G.map.tasks.length).keys()];
 ps.forEach((p,i)=>{p.imp=i<ni;p.al=true;p.v=-1;p.kc=G.S.kcd;p.ml=G.S.meet;p.done=[];p.tasks=shuffle(ids.slice()).slice(0,G.S.tasks)});
 spawnAll();G.ph='play';G.bl=G.mode==='hs'?15:0;G.tm=G.mode==='normal'?0:G.S.hst;G.tpShow=taskProg();
 const names=ps.filter(p=>p.imp).map(p=>p.name);
 for(const p of ps){sendTo(p.id,{t:'role',r:p.imp?'imp':'crew',n:ni,md:G.mode,mates:p.imp?names.filter(x=>x!==p.name):[]});sendTasks(p)}
 ev(['st']);return '';
}
function toLobby(){
 HG.ph='lobby';HG.map=MAPS.lobby;HG.win=null;HG.bodies=[];HG.ej=null;HG.pm=null;HG.sab={l:0,c:0};HG.dr=[];
 for(const p of Object.values(HG.p)){p.al=true;p.imp=false;p.v=-1;p.kc=0;p.tasks=[];p.done=[];placeLobby(p);sendTasks(p)}
}
function backToPlay(){
 const G=HG;G.ph='play';G.bodies=[];G.votes={};G.vt=[];G.ej=null;spawnAll();
 for(const p of Object.values(G.p))p.kc=Math.max(10,G.S.kcd);
}
function hMove(dt){
 const G=HG;
 for(const p of Object.values(G.p)){
  const i=p.off?{}:(G.inp[p.id]||{});p.mv=0;
  if(p.v>=0)continue;
  if(G.ph==='play'&&G.mode==='hs'&&G.bl>0&&p.imp)continue;
  let mx=(i.r?1:0)-(i.l?1:0),my=(i.d?1:0)-(i.u?1:0);const l=Math.hypot(mx,my);
  if(!l)continue;mx/=l;my/=l;p.mv=1;if(mx)p.f=mx>0?1:-1;
  const sp=235*G.S.spd*dt;
  if(!p.al){p.x=Math.max(0,Math.min(2200,p.x+mx*sp));p.y=Math.max(0,Math.min(1360,p.y+my*sp))}
  else{const inS=hitSolid(G.map,p.x,p.y);if(free(G.map,p.x+mx*sp,p.y,G.dr,inS))p.x+=mx*sp;if(free(G.map,p.x,p.y+my*sp,G.dr,inS))p.y+=my*sp}
 }
}
function closeDoors(room){
 const G=HG;
 G.map.doors.forEach((d,i)=>{
  if(!d.tags.includes(room)||G.dr[i]>0)return;
  G.dr[i]=G.S.doort;
  for(const p of Object.values(G.p)){
   if(!p.al||p.v>=0)continue;
   if(p.x>d.x-16&&p.x<d.x+d.w+16&&p.y>d.y-16&&p.y<d.y+d.h+16){
    if(d.ax==='h')p.x=p.x<d.cx?d.x-26:d.x+d.w+26;else p.y=p.y<d.cy?d.y-26:d.y+d.h+26;
   }
  }
 });
}
function hStep(dt){
 const G=HG;G.t+=dt;
 for(const id in G.pend)if(G.t-G.pend[id]>8){delete G.pend[id];net.kick(+id)}
 for(const p of Object.values(G.p))if(p.off&&G.t-p.dc>30)removePlayer(p.id);
 if(!G)return;
 if(G.ph==='lobby'||G.ph==='play')hMove(dt);
 if(G.ph==='play'){
  if(G.bl>0)G.bl=Math.max(0,G.bl-dt);
  else{for(const p of Object.values(G.p))if(p.imp&&p.kc>0)p.kc=Math.max(0,p.kc-dt);G.sabCd=Math.max(0,G.sabCd-dt)}
  G.dr.forEach((v,i)=>{if(v>0){G.dr[i]=v-dt;if(G.dr[i]<=0){G.dr[i]=0;ev(['do',i])}}});
  if(G.pm){G.pm.t-=dt;if(G.pm.t<=0){const q=G.p[G.pm.id];G.pm=null;if(q&&q.al)callMeeting(q,null,true);else G.pm=null}}
  if(G.mode!=='normal'){G.tm-=dt;if(G.tm<=0)endGame('crew')}
 }else if(G.ph==='discuss'){G.tm-=dt;if(G.tm<=0){G.ph='vote';G.tm=G.S.vote}}
 else if(G.ph==='vote'){G.tm-=dt;if(G.tm<=0)resolve()}
 else if(G.ph==='result'){G.tm-=dt;if(G.tm<=0)startEject()}
 else if(G.ph==='eject'){G.tm-=dt;if(G.tm<=0)endEject()}
 else if(G.ph==='over'){G.tm-=dt;if(G.tm<=0)toLobby()}
}
function killCd(){return HG.mode==='normal'?HG.S.kcd:Math.max(5,HG.S.kcd*.4)}
function killP(k,v){
 const x=v.x,y=v.y;
 if(HG.mode==='inf'){v.imp=true;v.kc=killCd()}
 else{v.al=false;HG.bodies.push({col:v.col,x,y})}
 k.x=x;k.y=y;k.kc=killCd();
 ev(['k',v.id,x,y,k.col,v.col]);
 checkWin();
}
function doAct(p,m){
 const G=HG,M=G.map;
 if(G.ph!=='play')return;
 if(m.k==='kill'){
  if(!p.al||!p.imp||p.v>=0||p.kc>0||G.bl>0)return;
  let best=null,bd=KR[G.S.kr]||100;
  for(const q of Object.values(G.p))if(q!==p&&q.al&&!q.imp&&q.v<0){const d=dist(p.x,p.y,q.x,q.y);if(d<bd){bd=d;best=q}}
  if(best)killP(p,best);
 }else if(m.k==='vent'){
  if(!p.imp||!p.al)return;
  if(p.v<0){let bi=-1,bd=85;M.vents.forEach((v,i)=>{const d=dist(p.x,p.y,v[0],v[1]);if(d<bd){bd=d;bi=i}});if(bi>=0){p.v=bi;p.x=M.vents[bi][0];p.y=M.vents[bi][1];ev(['vo',p.x,p.y])}}
  else{const v=M.vents[p.v];p.v=-1;ev(['vo',v[0],v[1]])}
 }else if(m.k==='vmove'){
  if(p.v>=0&&p.imp){p.v=p.v^1;const v=M.vents[p.v];p.x=v[0];p.y=v[1];ev(['vm',p.x,p.y])}
 }else if(m.k==='use'){
  if(G.mode==='normal'&&!G.pm&&p.al&&p.v<0&&p.ml>0&&dist(p.x,p.y,M.btn[0],M.btn[1])<105){p.ml--;G.pm={t:.85,id:p.id};ev(['bp',p.name,p.col])}
 }else if(m.k==='report'){
  if(G.mode!=='normal'||G.pm||!p.al||p.v>=0)return;
  for(const b of G.bodies)if(dist(p.x,p.y,b.x,b.y)<130){callMeeting(p,b,false);return}
 }else if(m.k==='sab'){
  if(G.mode!=='normal'||!p.imp||!p.al||p.v>=0||G.bl>0||G.sabCd>0||G.sab.l||G.sab.c||G.pm)return;
  if(m.s==='lights'&&G.S.sl){G.sab.l=1;ev(['sab','l','Światła'])}
  else if(m.s==='comms'&&G.S.sc){G.sab.c=1;ev(['sab','c','Komunikacja'])}
  else if(m.s==='doors'&&G.S.sd&&m.r>=0&&m.r<M.rn.length){closeDoors(m.r|0);ev(['sab','d','Drzwi: '+M.rn[m.r|0]])}
  else return;
  G.sabCd=G.S.sabcd;
 }
}
function doFix(p,m){
 const G=HG,M=G.map;if(G.ph!=='play'||!p.al)return;
 if(m.k==='l'&&G.sab.l&&dist(p.x,p.y,M.lightsP[0],M.lightsP[1])<170){G.sab.l=0;ev(['fix','l'])}
 else if(m.k==='c'&&G.sab.c&&dist(p.x,p.y,M.commsP[0],M.commsP[1])<170){G.sab.c=0;ev(['fix','c'])}
}
function doDoor(p,m){
 const G=HG,d=G.map.doors[m.i|0];if(G.ph!=='play'||!p.al||!d||!(G.dr[m.i|0]>0))return;
 if(d.panels.some(q=>dist(p.x,p.y,q[0],q[1])<130)){G.dr[m.i|0]=0;ev(['do',m.i|0])}
}
function doTask(p,id){
 if(HG.ph!=='play'||HG.sab.c||!p.tasks.includes(id)||p.done.includes(id))return;
 const T=HG.map.tasks[id];if(!T||dist(p.x,p.y,T[0],T[1])>170)return;
 p.done.push(id);sendTasks(p);if(!p.imp)checkWin();
}
function callMeeting(p,body,btn){
 const G=HG;G.ph='discuss';G.tm=G.S.disc;G.votes={};G.vt=[];G.pm=null;G.dr.fill(0);G.tpShow=taskProg();
 for(const q of Object.values(G.p))q.v=-1;
 ev(['m',p.col,body?body.col:-1,p.name,btn?1:0]);
 if(G.S.disc<=0){G.ph='vote';G.tm=G.S.vote}
}
function doVote(p,to){
 const G=HG;
 if(G.ph!=='vote'||!p.al||G.votes[p.id]!==undefined)return;
 if(!(to===-1||(G.p[to]&&G.p[to].al)))return;
 G.votes[p.id]=to;checkAllVoted();
}
function checkAllVoted(){if(HG.ph==='vote'&&Object.values(HG.p).filter(p=>p.al&&!p.off).every(p=>HG.votes[p.id]!==undefined))resolve()}
function resolve(){
 const G=HG,cnt={};let best=-9,bc=0,tied=false;
 for(const id in G.votes){if(!G.p[id])continue;const to=G.votes[id];cnt[to]=(cnt[to]||0)+1}
 for(const k in cnt){if(cnt[k]>bc){bc=cnt[k];best=+k;tied=false}else if(cnt[k]===bc)tied=true}
 G.exId=(best>=0&&!tied&&G.p[best])?best:-1;
 G.vt=Object.keys(G.votes).filter(k=>G.p[k]).map(k=>[+k,G.votes[k]]);
 G.ph='result';G.tm=5;
}
function startEject(){
 const G=HG;let ej={id:-1,cf:G.S.cf};
 if(G.exId>=0&&G.p[G.exId]){const p=G.p[G.exId];p.al=false;ej={id:p.id,col:p.col,name:p.name,imp:p.imp?1:0,cf:G.S.cf}}
 ej.rem=Object.values(G.p).filter(q=>q.imp&&q.al).length;
 G.ej=ej;G.ph='eject';G.tm=7;
}
function endEject(){if(!checkWin())backToPlay()}
function doChat(p,text){
 text=String(text||'').trim().slice(0,100);if(!text)return;
 if(!(HG.ph==='lobby'||HG.ph==='discuss'||HG.ph==='vote'))return;
 bcast({t:'chat',id:p.id,name:p.name,col:p.col,text,gh:p.al?0:1});
}
function removePlayer(id){
 const G=HG;if(!G||!G.p[id])return;
 delete G.p[id];delete G.inp[id];delete G.votes[id];
 if(G.vmap[id]){delete G.vmap[id];bcast({t:'vmap',m:G.vmap})}
 if(G.ph!=='lobby'&&G.ph!=='over'){const w=calcWin();if(w){endGame(w);return}checkAllVoted()}
}
function hLeave(id){
 const G=HG;if(!G)return;
 delete G.pend[id];
 const p=G.p[id];if(!p)return;
 p.off=true;p.dc=G.t;
 if(G.ph==='vote')checkAllVoted();
}
function hostMsg(id,m){
 const G=HG;if(!G||!m)return;
 if(m.t==='hello'){
  const name=String(m.name||'Gracz').slice(0,12),tok=String(m.tok||'').slice(0,16);
  const old=tok?Object.values(G.p).find(q=>q.tok===tok&&q.id!==id&&q.id!==0):null;
  if(old){net.rebind(id,old.id);delete G.pend[id];old.off=false;old.dc=0;old.name=name;sendTo(old.id,{t:'welcome',id:old.id});sendTo(old.id,{t:'vmap',m:G.vmap});sendTasks(old);return}
  delete G.pend[id];
  if(!G.p[id]){
   if(G.ph==='lobby'&&Object.keys(G.p).length<MAXP){
    const p=hAdd(id,name,tok);
    if(m.col>=0&&m.col<12&&!Object.values(G.p).some(q=>q!==p&&q.col===m.col))p.col=m.col|0;
    p.hat=Math.max(0,Math.min(HATS.length-1,m.hat|0));
    sendTo(id,{t:'vmap',m:G.vmap});
   }else{sendTo(id,{t:'busy'});setTimeout(()=>net.kick(id),400);return}
  }else{G.p[id].name=name;G.p[id].tok=tok}
  return;
 }
 const p=G.p[id];if(!p)return;
 if(m.t==='i'){G.inp[id]=m}
 else if(m.t==='col'){if(G.ph==='lobby'&&m.c>=0&&m.c<12&&!Object.values(G.p).some(q=>q!==p&&q.col===m.c))p.col=m.c|0}
 else if(m.t==='hat'){if(G.ph==='lobby')p.hat=Math.max(0,Math.min(HATS.length-1,m.h|0))}
 else if(m.t==='act')doAct(p,m);
 else if(m.t==='task')doTask(p,m.id);
 else if(m.t==='vote')doVote(p,m.to);
 else if(m.t==='chat')doChat(p,m.text);
 else if(m.t==='fix')doFix(p,m);
 else if(m.t==='door')doDoor(p,m);
 else if(m.t==='vid'){G.vmap[id]=String(m.id).slice(0,64);bcast({t:'vmap',m:G.vmap})}
 else if(m.t==='bye'){removePlayer(id)}
 else if(m.t==='ping')sendTo(id,{t:'pong',ts:m.ts})
}
function makeSnap(withEv){
 const G=HG,tpMode=G.S.tb;
 return{t:'s',ph:G.ph,tm:+G.tm.toFixed(1),bl:+G.bl.toFixed(1),md:G.ph==='lobby'?G.S.mode:G.mode,mk:G.ph==='lobby'?(G.S.map|0):Math.max(0,MAPKEYS.indexOf(G.mapKey)),
  p:Object.values(G.p).map(q=>[q.id,Math.round(q.x),Math.round(q.y),q.f,q.al?1:0,q.v,q.col,q.name,q.mv,q.ml,+q.kc.toFixed(1),q.imp?1:0,q.hat,q.off?1:0]),
  b:G.bodies.map(b=>[b.col,Math.round(b.x),Math.round(b.y)]),e:withEv?G.evq.splice(0):[],
  tp:tpMode===0?taskProg():(tpMode===1?G.tpShow:[0,0]),
  vd:Object.keys(G.votes).map(Number),vt:(G.ph==='result'||G.ph==='eject')&&!G.S.anon?G.vt:[],ej:G.ej,win:G.win,S:G.S,
  sb:[G.sab.l,G.sab.c],dr:G.dr.map(v=>v>0?1:0),scd:Math.ceil(G.sabCd)};
}
