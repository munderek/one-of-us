'use strict';
const cv=$('cv'),ctx=cv.getContext('2d'),c0=ctx;
const fogc=document.createElement('canvas'),fogx=fogc.getContext('2d');
let K=1,camX=650,camY=420,last=performance.now(),acc=0,tick=0,lastSend=0,fpsN=0,fpsT=0,fps=0,slowT=0,pingSend=0,lastInpKey='',lastVT=-1,lastHovEl=null,lastHov=0;
let drpcStatus='Wyłączone',lastPresKey='',lastPresT=0,lastOn=null,lastId=null;const presStart=Date.now();

function resizeCanvas(){
 const s=Math.min(innerWidth/W,innerHeight/H),dpr=window.devicePixelRatio||1;
 K=s*dpr*(CFG.q===0?.75:1);
 const w=Math.max(2,Math.round(W*K)),h=Math.max(2,Math.round(H*K));
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;fogc.width=w;fogc.height=h}
 cv.style.width=W+'px';cv.style.height=H+'px';
}
function fit(){
 const s=Math.min(innerWidth/W,innerHeight/H);
 $('stage').style.transform='translate(-50%,-50%) scale('+s+')';
 resizeCanvas();
}
addEventListener('resize',fit);

/* ---------- vision ---------- */
function visR(){
 const q=V.pl[me];if(!q)return 300;const S=V.S,r=280;
 if(V.md==='hs'){if(q.imp)return V.bl>0?0:r*.6*S.iv;return r*1.3*S.cv}
 let m=q.imp?S.iv:S.cv;
 if(V.sb&&V.sb[0]&&!q.imp)m*=.28;
 return r*m;
}

/* ---------- background space (menus, meeting, eject) ---------- */
const stars=Array.from({length:280},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.5,2.3),s:rnd(6,46),t:rnd(0,6)}));
const floaters=Array.from({length:8},(_,i)=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-30,30)||12,vy:rnd(-20,20),a:rnd(0,6),va:rnd(-.6,.6),col:(i*3)%12,hat:i%3===0?(i%9)+1:0,s:rnd(.9,1.9)}));
let shoot=null;
function drawSpace(dt,t,withCrew,force){
 ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 if(!(CFG.stars||force))return;
 const n=Math.floor(stars.length*(force?100:CFG.dens)/200);
 ctx.fillStyle='#fff';
 for(let i=0;i<n;i++){const s=stars[i];s.x-=s.s*dt;if(s.x<0){s.x=W;s.y=rnd(0,H)}ctx.globalAlpha=.45+.55*Math.sin(t*2+s.t);ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill()}
 ctx.globalAlpha=1;
 if(withCrew){
  if(!shoot&&Math.random()<dt*.25)shoot={x:rnd(W*.3,W),y:rnd(0,H*.4),l:0};
  if(shoot){shoot.l+=dt;shoot.x-=900*dt;shoot.y+=450*dt;ctx.strokeStyle='rgba(255,255,255,'+Math.max(0,1-shoot.l*1.6)+')';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(shoot.x,shoot.y);ctx.lineTo(shoot.x+90,shoot.y-45);ctx.stroke();if(shoot.l>.7)shoot=null}
  for(const f of floaters){
   f.x+=f.vx*dt;f.y+=f.vy*dt;f.a+=f.va*dt;
   if(f.x<-130)f.x=W+130;if(f.x>W+130)f.x=-130;if(f.y<-130)f.y=H+130;if(f.y>H+130)f.y=-130;
   ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);drawCrew(ctx,0,0,f.col,1,f.s,0,0,f.hat,0);ctx.restore();
  }
 }
}

/* ---------- world ---------- */
function drawWorld(key){
 const mc=getMapCache(key),z=CFG.zoom/100,vw=W/z,vh=H/z,sx=camX-vw/2,sy=camY-vh/2;
 const x0=Math.max(sx,0),y0=Math.max(sy,0),x1=Math.min(sx+vw,mc.w),y1=Math.min(sy+vh,mc.h);
 if(x1>x0&&y1>y0)ctx.drawImage(mc.cv,x0*mc.s,y0*mc.s,(x1-x0)*mc.s,(y1-y0)*mc.s,x0,y0,x1-x0,y1-y0);
}
function drawEntities(t){
 const mq=V.pl[me],dead=!!(mq&&!mq.al),R=visR(),lobby=V.ph==='lobby';
 const vis=(x,y)=>dead||!mq||lobby||dist(x,y,mq.rx,mq.ry)<R+30;
 for(const b of V.bodies)if(vis(b[1],b[2])){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(b[1],b[2]+16,28,10,0,0,6.283);ctx.fill();drawCrew(ctx,b[1],b[2],b[0],1,1,0,2,0,0)}
 const list=Object.values(V.pl).filter(q=>{if(q.v>=0)return false;if(!q.al)return dead;return vis(q.rx,q.ry)}).sort((a,b)=>a.ry-b.ry);
 for(const q of list){
  const g=!q.al,bob=g?Math.sin(t*3+q.id)*4:0;
  ctx.globalAlpha=g?.55:(q.off?.4:1);
  if(!g){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(q.rx,q.ry+28,22,8,0,0,6.283);ctx.fill()}
  drawCrew(ctx,q.rx,q.ry+bob,q.col,q.f,1,q.ph,g?1:0,q.hat,q.wk);
  ctx.globalAlpha=1;
  if(CFG.names){
   ctx.font='bold 15px '+FONT;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#000';
   const nm=q.name+(q.off?' (rozł.)':''),ny=q.ry-(q.hat?64:46)+bob;
   ctx.strokeText(nm,q.rx,ny);ctx.fillStyle=((mq&&mq.imp)||dead)&&q.imp?'#ff4d4d':'#fff';ctx.fillText(nm,q.rx,ny);
  }
  if(voice.talk[q.id]){ctx.fillStyle='#7de06a';ctx.strokeStyle='#050607';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.rx+30,q.ry-30,8,0,6.283);ctx.fill();ctx.stroke()}
 }
}
function drawParts(dt){
 for(const p of parts){p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const d=Math.pow(.03,dt);p.vx*=d;p.vy*=d}
 parts=parts.filter(p=>p.l>0);
 for(const p of parts){ctx.globalAlpha=Math.max(0,p.l/p.m);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.5,p.s*p.l/p.m),0,6.283);ctx.fill()}
 ctx.globalAlpha=1;
}
function drawFog(){
 const mq=V.pl[me];if(!mq||V.ph!=='play'||!mq.al)return;
 const R=visR()*(CFG.zoom/100);
 fogx.setTransform(K,0,0,K,0,0);fogx.globalCompositeOperation='source-over';fogx.clearRect(0,0,W,H);fogx.fillStyle='#000';fogx.fillRect(0,0,W,H);
 if(R>0){const g=fogx.createRadialGradient(W/2,H/2,R*.5,W/2,H/2,R);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');fogx.globalCompositeOperation='destination-out';fogx.fillStyle=g;fogx.fillRect(0,0,W,H)}
 ctx.drawImage(fogc,0,0,W,H);
}
function outText(s,x,y,size,col){ctx.font='bold '+size+'px '+FONT;ctx.textAlign='center';ctx.lineWidth=Math.max(4,size/6);ctx.strokeStyle='#000';ctx.strokeText(s,x,y);ctx.fillStyle=col||'#fff';ctx.fillText(s,x,y)}
function drawHudCanvas(){
 const mq=V.pl[me];if(!mq||V.ph!=='play')return;
 if(V.md==='hs'&&V.bl>0)outText(mq.imp?'Odliczanie... '+Math.ceil(V.bl):'UKRYJ SIĘ! '+Math.ceil(V.bl),W/2,120,48,mq.imp?'#ff6a6a':'#38fedc');
 if(mq.v>=0)outText('Jesteś w szybie',W/2,H-60,30,'#c9a8ff');
 else if(!mq.al)outText('Jesteś duchem - dokończ zadania',W/2,H-30,22,'#cfe');
 if(alarm>0||V.sb[0]||V.sb[1]){
  const a=.35+.25*Math.sin(T*7);ctx.strokeStyle='rgba(255,40,40,'+a+')';ctx.lineWidth=14;ctx.strokeRect(7,7,W-14,H-14);
 }
}
function drawEject(dt){
 drawSpace(dt,T,false,true);
 const te=(performance.now()-ejT0)/1000,e=V.ej;
 if(e&&e.id>=0){const p=Math.min(1,te/5.2);ctx.save();ctx.translate(-120+(W+240)*p,H/2-80+Math.sin(te*1.6)*40);ctx.rotate(te*3.2);drawCrew(ctx,0,0,e.col,1,2.2,0,0,0,0);ctx.restore()}
 let l1='Nikt nie został wyrzucony.',l2='';
 if(e&&e.id>=0){
  if(e.cf){l1=e.name+(e.imp?' był Impostorem.':' nie był Impostorem.');l2=e.rem>0?'Pozostało impostorów: '+e.rem:'Nie ma już impostorów.'}
  else l1=e.name+' został wyrzucony.';
 }
 outText(l1.slice(0,Math.max(0,Math.floor(te*16))),W/2,H-120,50,'#fff');
 if(l2)outText(l2.slice(0,Math.max(0,Math.floor((te-2.4)*16))),W/2,H-62,34,'#cfe');
}
function render(dt){
 ctx.setTransform(K,0,0,K,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const ph=V.ph;
 if(!role||!inRoom){drawSpace(dt,T,true,false);return}
 if(ph==='discuss'||ph==='vote'||ph==='result'){drawSpace(dt,T,false,false);return}
 if(ph==='eject'){drawEject(dt);return}
 ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 const mq=V.pl[me],lobby=ph==='lobby',z=CFG.zoom/100;
 if(lobby){camX=650;camY=410}else if(mq){camX=mq.rx;camY=mq.ry}
 shake*=Math.pow(.02,dt);const sx=shake>.3?rnd(-.5,.5)*shake:0,sy=shake>.3?rnd(-.5,.5)*shake:0;
 ctx.save();ctx.translate(W/2+sx,H/2+sy);ctx.scale(z,z);ctx.translate(-camX,-camY);
 drawWorld(lobby?'lobby':MAPKEYS[V.mk|0]);
 if(lobby)drawLobbyStations(T);else{drawStationsDyn(T);drawButtonDyn(T);drawDoorsDyn(T)}
 drawEntities(T);drawParts(dt);
 ctx.restore();
 if(!lobby){drawFog()}
 if(CFG.vig){const g=ctx.createRadialGradient(W/2,H/2,H*.5,W/2,H/2,H*.98);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.5)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
 drawHudCanvas();
 if(flash>0){ctx.globalAlpha=Math.min(1,flash)*.55;ctx.fillStyle=flashC;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;flash=Math.max(0,flash-dt*1.6)}
 if(alarm>0)alarm=Math.max(0,alarm-dt);
 if(V.btnT>0)V.btnT=Math.max(0,V.btnT-dt);
}

/* ---------- main loop ---------- */
function update(dt,now){
 if(role==='host'&&HG){
  acc+=dt;
  while(acc>=STEP){hStep(STEP);acc-=STEP;tick++;if(tick%3===0)net.send(makeSnap(true));if(tick%60===0){net.reserve(Object.keys(HG.p).map(Number));net.players(Object.keys(HG.p).length)}
   if(tick%300===0){if(HG.pub&&HG.ph==='lobby')net.publish({name:CFG.name+' - gra',n:Object.keys(HG.p).length,max:MAXP,mode:HG.S.mode,map:MAPNAMES[HG.S.map|0]});else net.publish(null)}}
  applySnap(makeSnap(false));
 }
 if(role&&inRoom&&(V.ph==='lobby'||V.ph==='play')){
  const inp=getInput();inp.t='i';
  const ik=''+inp.u+inp.d+inp.l+inp.r;
  if(role==='host'&&HG)HG.inp[0]=inp;
  else if(role==='client'&&now-lastSend>40&&(ik!==lastInpKey||now-lastSend>250)){net.send(inp);lastSend=now;lastInpKey=ik}
 }
 for(const q of Object.values(V.pl)){
  if((role==='host'&&q.id===0)||dist(q.x,q.y,q.rx,q.ry)>160){q.rx=q.x;q.ry=q.y}
  else{const k=1-Math.exp(-dt*20);q.rx+=(q.x-q.rx)*k;q.ry+=(q.y-q.ry)*k}
  if(q.mv)q.ph+=dt*13;
  q.wk+=((q.mv?1:0)-q.wk)*Math.min(1,dt*12);
 }
 calcNear();
 if(voiceOn)voice.tick(voiceVol);
 setMusic(musicFor());
 stepSounds(dt);
 if(role==='client'&&inRoom&&now-pingSend>2000){net.send({t:'ping',ts:Date.now()});pingSend=now}
 if(V.ph==='vote'){const sc=Math.ceil(V.tm);if(sc!==lastVT&&sc<=5&&sc>0)snd('votetimer',{v:.8});lastVT=sc}else lastVT=-1;
 updatePing();
 pushPresence(false);
 if(!$('mLan').classList.contains('hide')){slowT+=dt;if(slowT>1){slowT=0;renderLanList()}}
}
function frame(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
 try{update(dt,now);render(dt);syncUI()}catch(e){console.error(e)}
 if(CFG.fps){fpsN++;fpsT+=dt;if(fpsT>=.5){fps=Math.round(fpsN/fpsT);fpsN=0;fpsT=0}ctx.setTransform(K,0,0,K,0,0);ctx.font='bold 14px monospace';ctx.fillStyle='#7de06a';ctx.textAlign='left';ctx.fillText(fps+' FPS',10,H-10)}
 requestAnimationFrame(frame);
}


/* ---------- music, footsteps, ping, UI sounds, Discord presence ---------- */
function musicFor(){
 if(!role||!inRoom)return 'music_menu';
 if(V.ph==='lobby')return 'music_lobby';
 if(V.ph==='play')return gm().music||null;
 return null;
}
function stepSounds(dt){
 if(V.ph!=='lobby'&&V.ph!=='play')return;
 const mq=V.pl[me];
 for(const q of Object.values(V.pl)){
  if(!q.mv||!q.al||q.v>=0||q.off)continue;
  q.stT=(q.stT||0)-dt;
  if(q.stT>0)continue;
  q.stT=.33;
  const d=mq?dist(mq.rx,mq.ry,q.rx,q.ry):0,vol=q.id===me?.5:Math.max(0,.45*(1-d/450));
  if(vol>.03)snd('step',{v:vol,r:.95+Math.random()*.1});
 }
}
function updatePing(){
 const pe=$('ping');
 if(!(role&&inRoom)){pe.classList.add('hide');return}
 pe.classList.remove('hide');
 setT(pe,role==='host'?'Host':(ping<0?'Ping: --':'Ping: '+ping+' ms'));
 pe.classList.toggle('bad',role==='client'&&ping>200);pe.classList.toggle('mid',role==='client'&&ping>100&&ping<=200);
}
document.addEventListener('mouseover',e=>{
 const t=e.target.closest&&e.target.closest('button,.card,.lg,.pg,.sw,.tg,.sb,.ls');
 if(!t||t===lastHovEl)return;lastHovEl=t;
 const n=performance.now();if(n-lastHov>60){lastHov=n;snd('hover',{v:.5})}
});
document.addEventListener('mouseout',()=>{lastHovEl=null});
document.addEventListener('click',e=>{
 const t=e.target.closest&&e.target.closest('button,.pg,.lg,.sw,.tg');
 if(t&&!e.target.closest('#bKill,#bRep,.hbtn'))snd('select',{v:.6});
},true);
function presText(tpl){
 const ph=!role?'W menu głównym':!inRoom?'Łączenie z grą':V.ph==='lobby'?'W lobby':V.ph==='play'?'Gra w toku':(V.ph==='over'?'Koniec rundy':'Głosowanie');
 const mode=MODES[V.S.mode]||'',players=Object.keys(V.pl).length;
 return String(tpl||'').replace(/\{phase\}/g,ph).replace(/\{mode\}/g,mode).replace(/\{players\}/g,players).replace(/\{map\}/g,MAPNAMES[V.mk|0]||'').replace(/\{code\}/g,roomCode||'');
}
function pushPresence(force){
 if(!window.drpc)return;
 const now=Date.now();
 if(!force&&now-lastPresT<5000)return;
 if(force||CFG.drpc!==lastOn||CFG.drpcId!==lastId){lastOn=CFG.drpc;lastId=CFG.drpcId;drpc.set({on:!!CFG.drpc,id:CFG.drpcId})}
 if(!CFG.drpc)return;
 const pad=t=>{t=String(t||'').slice(0,120);return t.length<2?(t+'  ').slice(0,2):t};
 const act={details:pad(presText(CFG.drpcDet)),state:pad(presText(CFG.drpcSt)),startTimestamp:presStart};
 if(CFG.drpcLi){act.largeImageKey=CFG.drpcLi;act.largeImageText=pad(CFG.drpcLt||'One of Us')}
 if(CFG.drpcSi)act.smallImageKey=CFG.drpcSi;
 const bt=[];
 for(const [l,u] of [[CFG.drpcB1l,CFG.drpcB1u],[CFG.drpcB2l,CFG.drpcB2u]])if(l&&/^https?:\/\//.test(u||''))bt.push({label:String(l).slice(0,32),url:u});
 if(bt.length)act.buttons=bt;
 if(role&&inRoom){act.partySize=Math.max(1,Math.min(MAXP,Object.keys(V.pl).length));act.partyMax=MAXP}
 const key=JSON.stringify(act,(k,v)=>k==='startTimestamp'?0:v);
 if(force||key!==lastPresKey){lastPresKey=key;lastPresT=now;drpc.act(act)}
}

/* ---------- keyboard ---------- */
addEventListener('keydown',e=>{
 if(keyCapture){e.preventDefault();CFG.pttkey=e.code;keyCapture=false;saveCfg();renderSettings();return}
 if(e.code==='Escape'){
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  if(!$('setov').classList.contains('hide'))closeSettings();
  else if(taskOpen>=0)closeTask();
  else if(!$('sabm').classList.contains('hide'))$('sabm').classList.add('hide');
  else if(!$('custom').classList.contains('hide')||!$('gset').classList.contains('hide'))closePanels();
  else if(!role&&$('mMain').classList.contains('hide'))showMenu('mMain');
  else openSettings();
  return;
 }
 const tg=e.target.tagName;if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA')return;
 keys.add(e.code);
 if(!role||!inRoom)return;
 if(e.code===CFG.pttkey)voice.setPtt(true);
 if(e.repeat)return;
 if(e.code==='KeyM'&&voiceOn)voice.setMuted(!voice.isMuted());
 if(V.ph==='play'||V.ph==='lobby'){
  if(e.code==='KeyE'||e.code==='Space'){useAct();e.preventDefault()}
  else if(e.code==='KeyR')repAct();else if(e.code==='KeyQ')killAct();else if(e.code==='KeyV')ventAct();else if(e.code==='KeyF')vmAct();
 }
});
addEventListener('keyup',e=>{keys.delete(e.code);if(e.code===CFG.pttkey)voice.setPtt(false)});
addEventListener('blur',()=>{keys.clear();voice.setPtt(false)});
addEventListener('mousedown',e=>{const t=e.target.tagName;if(t!=='INPUT'&&t!=='SELECT'&&document.activeElement&&document.activeElement.blur)document.activeElement.blur()});
addEventListener('contextmenu',e=>e.preventDefault());

/* ---------- init ---------- */
applyCfg();
$('lgn').value=CFG.logged?CFG.name:'';
showMenu(CFG.logged?'mMain':'mLogin');
loadSounds();
if(window.drpc){drpc.onStatus(s=>{drpcStatus=s});pushPresence(true)}
fit();
requestAnimationFrame(frame);
setTimeout(()=>{try{getMapCache('lobby')}catch(e){}},300);
setTimeout(()=>{try{getMapCache('ship')}catch(e){}},1800);
window.addEventListener('load',()=>{
 setTimeout(()=>{document.body.classList.add('ready');$('boot').classList.add('gone');setTimeout(()=>$('boot').remove(),700)},650);
});
