'use strict';
/* Voice chat: WebRTC audio calls (PeerJS) between players, mic processing (gain + noise gate), device selection. */
const voice=(()=>{
 let ctx=null,stream=null,gainN=null,an=null,gate=null,out=null,peer=null,myPid='',running=false,raf=0;
 let muted=false,pttDown=false,lvl=0,status='',meId=-1,testing=false,testStream=null,testCtx=null,testAn=null;
 const calls={},auds={},ana={},seen={},talk={};
 function rms(a){const b=new Uint8Array(a.fftSize);a.getByteTimeDomainData(b);let s=0;for(let i=0;i<b.length;i++){const v=(b[i]-128)/128;s+=v*v}return Math.sqrt(s/b.length)}
 async function start(onPid){
  if(running)return;running=true;status='Uruchamianie mikrofonu...';
  try{
   stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:CFG.mic?{exact:CFG.mic}:undefined,echoCancellation:!!CFG.aec,noiseSuppression:!!CFG.ns,autoGainControl:!!CFG.agc}});
  }catch(e){
   try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e2){stream=null;status='Brak dostępu do mikrofonu - tylko słuchasz'}
  }
  if(!running){if(stream)stream.getTracks().forEach(t=>t.stop());return}
  try{
   ctx=new (window.AudioContext||window.webkitAudioContext)();
   const dest=ctx.createMediaStreamDestination();gate=ctx.createGain();gate.connect(dest);
   if(stream){
    const src=ctx.createMediaStreamSource(stream);gainN=ctx.createGain();an=ctx.createAnalyser();an.fftSize=512;
    src.connect(gainN);gainN.connect(an);an.connect(gate);setGain();
   }else{const o=ctx.createOscillator(),g=ctx.createGain();g.gain.value=0;o.connect(g);g.connect(gate);o.start()}
   out=dest.stream;
  }catch(e){status='Błąd audio';running=false;return}
  try{
   peer=new Peer(undefined,{config:ICE,debug:0});
   peer.on('open',id=>{myPid=id;if(stream)status='Czat głosowy aktywny';if(onPid)onPid(id)});
   peer.on('call',call=>{const pid=call.metadata&&call.metadata.pid;if(pid==null)return;call.answer(out);attach(call,+pid)});
   peer.on('error',e=>{status='Błąd głosu: '+(e.type||'')});
  }catch(e){status='Brak biblioteki głosu'}
  raf=requestAnimationFrame(loop);
 }
 function attach(call,pid){
  if(calls[pid]&&calls[pid]!==call){try{calls[pid].close()}catch(e){}}
  calls[pid]=call;
  call.on('stream',rs=>{
   let a=auds[pid];if(!a){a=new Audio();a.autoplay=true;auds[pid]=a}
   a.srcObject=rs;a.volume=0;
   if(CFG.spk&&a.setSinkId)a.setSinkId(CFG.spk).catch(()=>{});
   a.play().catch(()=>{});
   try{const s=ctx.createMediaStreamSource(rs),n=ctx.createAnalyser();n.fftSize=256;s.connect(n);ana[pid]=n}catch(e){}
  });
  const gone=()=>{if(calls[pid]===call){delete calls[pid];delete ana[pid];talk[pid]=false;if(auds[pid]){auds[pid].srcObject=null;delete auds[pid]}}};
  call.on('close',gone);call.on('error',gone);
 }
 function setMap(m,me){
  meId=me;if(!running||!peer||!out||!myPid)return;
  for(const k in m){
   const pid=+k;if(pid===me)continue;
   if(seen[pid]!==m[k]){seen[pid]=m[k];if(calls[pid]){try{calls[pid].close()}catch(e){}delete calls[pid]}}
   if(me<pid&&!calls[pid]){try{const c=peer.call(m[k],out,{metadata:{pid:me}});if(c)attach(c,pid)}catch(e){}}
  }
  for(const k in calls)if(!(k in m)){try{calls[k].close()}catch(e){}delete calls[k]}
 }
 function setGain(){if(gainN)gainN.gain.value=CFG.mgain/100}
 function loop(){
  if(!running)return;
  if(an){
   lvl=Math.min(1,rms(an)*4*(CFG.mgain/100));
   const open=lvl*100>CFG.gate&&!muted&&(!CFG.ptt||pttDown);
   if(gate)gate.gain.setTargetAtTime(open?1:0,ctx.currentTime,.03);
   talk[meId]=open;
  }
  for(const pid in ana)talk[pid]=rms(ana[pid])>.02;
  raf=requestAnimationFrame(loop);
 }
 function tick(volFn){
  for(const pid in auds){let v=0;try{v=volFn(+pid)}catch(e){}auds[pid].volume=Math.max(0,Math.min(1,v*CFG.vvol/100))}
 }
 function stop(){
  running=false;cancelAnimationFrame(raf);
  for(const k in calls){try{calls[k].close()}catch(e){}delete calls[k]}
  for(const k in auds){auds[k].srcObject=null;delete auds[k]}
  for(const k in ana)delete ana[k];for(const k in seen)delete seen[k];for(const k in talk)delete talk[k];
  if(peer){try{peer.destroy()}catch(e){}peer=null}
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  if(ctx){try{ctx.close()}catch(e){}ctx=null}
  out=null;gainN=null;an=null;gate=null;myPid='';status='';lvl=0;
 }
 async function devices(){
  try{const t=await navigator.mediaDevices.getUserMedia({audio:true});t.getTracks().forEach(x=>x.stop())}catch(e){}
  try{const d=await navigator.mediaDevices.enumerateDevices();return{mics:d.filter(x=>x.kind==='audioinput'),spks:d.filter(x=>x.kind==='audiooutput')}}catch(e){return{mics:[],spks:[]}}
 }
 async function test(on){
  if(!on){testing=false;if(testStream){testStream.getTracks().forEach(t=>t.stop());testStream=null}if(testCtx){try{testCtx.close()}catch(e){}testCtx=null}testAn=null;return}
  testing=true;
  try{
   testStream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:CFG.mic?{exact:CFG.mic}:undefined,echoCancellation:!!CFG.aec,noiseSuppression:!!CFG.ns,autoGainControl:!!CFG.agc}});
   testCtx=new (window.AudioContext||window.webkitAudioContext)();
   const s=testCtx.createMediaStreamSource(testStream),g=testCtx.createGain();g.gain.value=CFG.mgain/100;testAn=testCtx.createAnalyser();testAn.fftSize=512;s.connect(g);g.connect(testAn);
  }catch(e){testing=false}
 }
 return{
  start,stop,setMap,tick,devices,test,setGain,talk,
  level:()=>running&&an?lvl:(testAn?Math.min(1,rms(testAn)*4*(CFG.mgain/100)):0),
  isRunning:()=>running,status:()=>status,isTesting:()=>testing,
  setMuted:b=>{muted=b},isMuted:()=>muted,setPtt:b=>{pttDown=b},
  setSpk:()=>{for(const k in auds)if(CFG.spk&&auds[k].setSinkId)auds[k].setSinkId(CFG.spk).catch(()=>{})}
 };
})();
