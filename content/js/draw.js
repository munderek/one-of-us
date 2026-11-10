'use strict';
/* ================= crewmate drawing ================= */
function shade(hex,a){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=a<0?0:255,t=Math.abs(a);r=Math.round((f-r)*t+r);g=Math.round((f-g)*t+g);b=Math.round((f-b)*t+b);return 'rgb('+r+','+g+','+b+')'}
function rr2(c,x,y,w,h,rt,rb){c.beginPath();c.moveTo(x+rt,y);c.arcTo(x+w,y,x+w,y+h,rt);c.arcTo(x+w,y+h,x,y+h,rb);c.arcTo(x,y+h,x,y,rb);c.arcTo(x,y,x+w,y,rt);c.closePath()}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function drawHat(c,h){
 c.lineWidth=3.5;c.strokeStyle='#050607';c.lineJoin='round';c.lineCap='round';
 if(h===1){c.fillStyle='#ffd23a';c.beginPath();c.moveTo(-11,-29);c.lineTo(-14,-47);c.lineTo(-5,-39);c.lineTo(1,-51);c.lineTo(7,-39);c.lineTo(16,-47);c.lineTo(13,-29);c.closePath();c.fill();c.stroke();c.fillStyle='#e0223a';c.beginPath();c.arc(1,-35,3.4,0,6.283);c.fill()}
 else if(h===2){c.fillStyle='#2a6bd6';c.beginPath();c.arc(1,-29,18,Math.PI,0);c.closePath();c.fill();c.stroke();c.fillStyle='#1c4aa0';rr(c,10,-33,24,7,3.5);c.fill();c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(1,-47,3,0,6.283);c.fill()}
 else if(h===3){c.fillStyle='#e8423f';c.beginPath();c.arc(1,-29,19,Math.PI,0);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';rr(c,-19,-35,40,9,4);c.fill();c.stroke();c.beginPath();c.arc(1,-50,6.5,0,6.283);c.fill();c.stroke()}
 else if(h===4){c.fillStyle='#ff5fb8';c.beginPath();c.moveTo(-11,-29);c.lineTo(1,-62);c.lineTo(13,-29);c.closePath();c.fill();c.stroke();c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(-6,-41);c.lineTo(8,-45);c.moveTo(-9,-34);c.lineTo(11,-38);c.stroke();c.fillStyle='#ffe14a';c.strokeStyle='#050607';c.lineWidth=3;c.beginPath();c.arc(1,-62,4.5,0,6.283);c.fill();c.stroke()}
 else if(h===5){c.strokeStyle='#050607';c.lineWidth=9;c.beginPath();c.ellipse(1,-47,15,5,0,0,6.283);c.stroke();c.strokeStyle='#ffe14a';c.lineWidth=5;c.beginPath();c.ellipse(1,-47,15,5,0,0,6.283);c.stroke()}
 else if(h===6){c.fillStyle='#3b3b44';c.beginPath();c.moveTo(-17,-28);c.lineTo(-15,-49);c.lineTo(-2,-32);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(5,-32);c.lineTo(19,-49);c.lineTo(21,-28);c.closePath();c.fill();c.stroke();c.fillStyle='#ff9ac8';c.beginPath();c.moveTo(-14,-33);c.lineTo(-13,-43);c.lineTo(-7,-34);c.closePath();c.fill();c.beginPath();c.moveTo(9,-34);c.lineTo(15,-43);c.lineTo(16,-33);c.closePath();c.fill()}
 else if(h===7){c.fillStyle='#8a5a2b';c.beginPath();c.ellipse(1,-30,30,8,0,0,6.283);c.fill();c.stroke();c.fillStyle='#a8723a';rr(c,-10,-50,22,22,7);c.fill();c.stroke();c.fillStyle='#4a2d10';c.fillRect(-9,-38,20,5)}
 else if(h===8){c.strokeStyle='#050607';c.lineWidth=11;c.beginPath();c.arc(1,-8,26,Math.PI*1.07,Math.PI*1.93);c.stroke();c.strokeStyle='#33363d';c.lineWidth=6;c.beginPath();c.arc(1,-8,26,Math.PI*1.07,Math.PI*1.93);c.stroke();c.fillStyle='#d33';c.strokeStyle='#050607';c.lineWidth=3.5;rr(c,-29,-14,11,20,4);c.fill();c.stroke();rr(c,19,-14,11,20,4);c.fill();c.stroke()}
 else if(h===9){c.strokeStyle='#050607';c.lineWidth=7;c.beginPath();c.moveTo(1,-29);c.lineTo(1,-40);c.stroke();c.strokeStyle='#3fae3a';c.lineWidth=3.5;c.beginPath();c.moveTo(1,-29);c.lineTo(1,-40);c.stroke();c.fillStyle='#4fd24a';c.strokeStyle='#050607';c.lineWidth=3;c.beginPath();c.ellipse(-6,-44,9,5,-.5,0,6.283);c.fill();c.stroke();c.beginPath();c.ellipse(9,-44,9,5,.5,0,6.283);c.fill();c.stroke()}
}
/* mode: 0 normal, 1 ghost, 2 body. wk: walk amount 0..1 */
function drawCrew(c,x,y,col,f,s,ph,mode,hat,wk){
 wk=wk||0;const sw=Math.sin(ph);
 c.save();c.translate(x,y-(mode===0?Math.abs(sw)*3.2*wk:0));
 c.scale(f*s,s);if(mode===0)c.rotate(sw*.045*wk);if(mode===2)c.rotate(1.3);
 const base=COLS[col],dk=shade(base,-.4),dk2=shade(base,-.22),lt=shade(base,.38);
 c.lineWidth=4.5;c.lineJoin='round';c.strokeStyle='#050607';
 c.fillStyle=dk;rr(c,-31,-8,16,30,7);c.fill();c.stroke();
 if(mode===0){
  const l1=sw*5*wk,u1=Math.max(0,sw)*9*wk,l2=-sw*5*wk,u2=Math.max(0,-sw)*9*wk;
  c.fillStyle=dk2;rr(c,-19+l1,12-u1,17,19-u1*.25,6);c.fill();c.stroke();rr(c,3+l2,12-u2,17,19-u2*.25,6);c.fill();c.stroke();
 }
 const bh=mode===2?40:(mode===1?48:54);
 const g=c.createLinearGradient(-20,-30,12,24);g.addColorStop(0,lt);g.addColorStop(.45,base);g.addColorStop(1,dk2);
 c.fillStyle=g;rr2(c,-20,-30,42,bh,21,10);c.fill();c.stroke();
 c.save();rr2(c,-20,-30,42,bh,21,10);c.clip();c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(-15,12,15,32,0,0,6.283);c.fill();c.fillStyle='rgba(255,255,255,.14)';c.beginPath();c.ellipse(-8,-20,4,10,.3,0,6.283);c.fill();c.restore();
 const vg=c.createLinearGradient(0,-27,0,-9);vg.addColorStop(0,'#dff4fc');vg.addColorStop(1,'#7fb0cc');
 c.fillStyle=vg;rr(c,2,-28,29,20,9);c.fill();c.stroke();
 c.fillStyle='rgba(255,255,255,.92)';rr(c,8,-25,15,6,3);c.fill();
 if(hat&&mode!==2)drawHat(c,hat);
 if(mode===2){c.fillStyle='#f4f1e4';c.strokeStyle='#050607';c.lineWidth=3.5;c.beginPath();c.arc(0,bh-30,6,0,6.283);c.fill();c.stroke();rr(c,-3,bh-30,6,14,3);c.fill();c.stroke()}
 c.restore();
}
const iconCache={};
function bigURL(col,hat){
 const k='g'+col+'_'+(hat||0);if(iconCache[k])return iconCache[k];
 const c=document.createElement('canvas');c.width=320;c.height=320;
 drawCrew(c.getContext('2d'),170,196,col,1,3.4,0,0,hat||0,0);return iconCache[k]=c.toDataURL();
}
function iconURL(col,hat){
 const k=col+'_'+(hat||0);if(iconCache[k])return iconCache[k];
 const c=document.createElement('canvas');c.width=c.height=72;
 drawCrew(c.getContext('2d'),38,40,col,1,.95,0,0,hat||0,0);return iconCache[k]=c.toDataURL();
}
function bodyURL(col){
 const k='b'+col;if(iconCache[k])return iconCache[k];
 const c=document.createElement('canvas');c.width=180;c.height=140;
 drawCrew(c.getContext('2d'),90,66,col,1,1.5,0,2,0,0);return iconCache[k]=c.toDataURL();
}

/* ================= map data ================= */
const MAPKEYS=['ship','lab'];
const MAPNAMES=['Statek','Laboratorium'];
const MAPS={
 lobby:{fl:[[300,200,700,420]],nr:1,th:[7],rn:[],rf:[],vents:[],tasks:[],doors:[],btn:null,spawn:[650,430],spawnR:[100,60],cw:1300,ch:820,
  stations:[{k:'set',x:480,y:380,l:'Ustawienia gry'},{k:'cus',x:820,y:380,l:'Wygląd'}],
  props:[['seat',318,206],['seat',358,206],['seat',398,206],['seat',438,206],['seat',478,206],['seat',800,206],['seat',840,206],['seat',880,206],['seat',920,206],['seat',960,206],
         ['crate',320,540,80,64,'#6a7b68'],['crate',900,540,80,64,'#6a7b68']],gr:[]},
 ship:{
  name:'Statek',music:'music_ship',cw:2200,ch:1360,
  fl:[[600,100,700,420],[100,100,400,380],[600,800,500,400],[100,700,400,350],[1500,100,500,400],[1500,800,500,400],
      [500,220,100,100],[1300,220,200,100],[820,520,100,280],[250,480,100,220],[500,880,100,100],[1100,950,400,100],[1700,500,100,300]],
  nr:6,th:[0,1,2,3,4,5],rn:['Szpital','Stołówka','Reaktor','Magazyn','Elektryczna','Ochrona'],rf:[1,0,4,2,3,5],
  vents:[[170,160],[170,760],[650,150],[1550,150],[650,860],[1550,860]],
  tasks:[[300,200,'hold','Skan medyczny','Szpital'],[160,380,'seq','Analiza próbek','Szpital'],[900,160,'wires','Napraw kable','Stołówka'],[1200,440,'hold','Pobierz dane','Stołówka'],
         [1900,200,'seq','Stabilizuj reaktor','Reaktor'],[1600,430,'wires','Połącz przewody','Reaktor'],[950,1100,'hold','Przeładuj zapasy','Magazyn'],[700,1080,'wires','Kable magazynu','Magazyn'],
         [400,800,'seq','Rozdzielnia','Elektryczna'],[150,1000,'hold','Wgraj dane','Elektryczna'],[1900,1100,'seq','Kalibracja','Ochrona'],[1600,1100,'wires','Kable ochrony','Ochrona']],
  btn:[950,300],spawn:[950,430],spawnR:[80,60],lightsP:[420,980],commsP:[1750,1000],lightsRoom:'Elektrycznej',commsRoom:'Ochronie',
  doors:[{x:535,y:220,w:30,h:100,ax:'h',tags:[0,1]},{x:1385,y:220,w:30,h:100,ax:'h',tags:[1,2]},{x:820,y:645,w:100,h:30,ax:'v',tags:[1,3]},
         {x:250,y:575,w:100,h:30,ax:'v',tags:[0,4]},{x:1285,y:950,w:30,h:100,ax:'h',tags:[3,5]},{x:1700,y:635,w:100,h:30,ax:'v',tags:[2,5]},{x:535,y:880,w:30,h:100,ax:'h',tags:[4,3]}],
  props:[['table',950,300,64],['table',760,440,40],['table',1120,420,36],['table',1150,200,34],['console',1010,104,110,'#7de06a'],['crate',1236,450,56,56,'#5f7a8a'],
         ['bed',110,230,92,64],['console',330,104,110,'#8cf0dd'],['crate',115,410,60,56,'#7fa7a0'],
         ['pad',1750,300,90],['hazard',1510,470,160,22],['hazard',1830,470,160,22],['console',1530,104,110,'#ff7b4a'],
         ['crate',1010,830,80,70,'#6a7b68'],['crate',1010,912,80,70,'#7b6a5c'],['crate',610,1120,70,70,'#5f7a8a'],['crate',1020,1110,70,72,'#6a7b68'],
         ['console',330,704,120,'#ffd23a'],['hazard',100,1028,400,20],['crate',430,830,56,56,'#7a7a5c'],
         ['console',1520,804,150,'#4aa3ff'],['console',1820,804,150,'#4aa3ff'],['hazard',1510,1170,200,22]],
  lbl:[['Szpital',300,330],['Stołówka',1100,500],['Reaktor',1750,440],['Elektryczna',300,900],['Magazyn',850,1000],['Ochrona',1750,900]],
  gr:[['t',740,92,'ONE OF US','#ff3b5c',34,-.04],['star',1160,72,15,'#ffe14a'],['t',1230,92,'SUS','#38fedc',30,.05],['t',190,92,'SHHH','#b6ff00',28,-.05],['heart',430,74,1.1,'#ff5fb8'],
      ['t',1640,92,'HOT!','#ffb000',32,.04],['arrow',1940,72,'#ff3b5c',.2],['t',700,792,'GG','#38fedc',30,-.06],['t',1020,792,'VENT?','#b6ff00',26,.05],
      ['t',165,692,'POWER','#ffe14a',28,-.04],['star',450,676,13,'#ff5fb8'],['t',1590,792,'WATCH','#4aa3ff',26,-.05],['heart',1920,776,1,'#ff3b3b']]
 },
 lab:{
  name:'Laboratorium',music:'music_radio',cw:1900,ch:1250,
  fl:[[800,450,400,300],[800,50,400,260],[800,890,400,280],[250,450,360,300],[1390,450,360,300],[1400,50,350,260],
      [950,310,100,140],[950,750,100,140],[610,560,190,80],[1200,560,190,80],[1200,140,200,80],[1550,310,100,140],[380,750,100,300],[380,950,420,100]],
  nr:6,th:[0,1,8,9,5,10],rn:['Hala','Laboratorium','Kuchnia','Silnik','Sejf','Sypialnie'],rf:[0,1,2,3,4,5],
  vents:[[850,100],[850,960],[300,500],[1710,700],[1700,100],[850,700]],
  tasks:[[1100,120,'hold','Analiza DNA','Laboratorium'],[900,250,'wires','Napraw probówki','Laboratorium'],[850,520,'wires','Panel nawigacji','Hala'],[1150,700,'seq','Mapa gwiezdna','Hala'],
         [1100,1000,'seq','Zamów zapasy','Kuchnia'],[900,1090,'hold','Posprzątaj stoły','Kuchnia'],[500,520,'wires','Przewody silnika','Silnik'],[330,700,'seq','Uruchom silnik','Silnik'],
         [1500,520,'hold','Skan sejfu','Sejf'],[1650,700,'seq','Kod sejfu','Sejf'],[1500,200,'wires','Naprawa instalacji','Sypialnie'],[1650,250,'hold','Wietrzenie','Sypialnie']],
  btn:[1000,610],spawn:[880,600],spawnR:[60,50],lightsP:[300,620],commsP:[1700,600],lightsRoom:'Silniku',commsRoom:'Sejfie',
  doors:[{x:950,y:360,w:100,h:30,ax:'v',tags:[0,1]},{x:950,y:800,w:100,h:30,ax:'v',tags:[0,2]},{x:680,y:560,w:30,h:80,ax:'h',tags:[0,3]},{x:1270,y:560,w:30,h:80,ax:'h',tags:[0,4]},
         {x:1285,y:140,w:30,h:80,ax:'h',tags:[1,5]},{x:1550,y:360,w:100,h:30,ax:'v',tags:[4,5]},{x:380,y:850,w:100,h:30,ax:'v',tags:[3,2]}],
  props:[['table',1000,610,44],['console',820,454,110,'#ff9a3a'],['console',1070,454,110,'#4aa3ff'],
         ['bench',808,150,50,120],['bench',1100,250,90,45],['console',980,54,80,'#8cf0dd'],
         ['counter',820,1128,120,40],['counter',1060,1128,120,40],['table',990,1010,36],
         ['console',400,454,120,'#ffb347'],['pad',430,640,70],['hazard',260,720,340,20],
         ['crate',1620,470,100,60,'#5d6f86'],['crate',1420,700,60,40,'#5d6f86'],
         ['bed',1415,60,80,50],['bed',1505,60,80,50],['bed',1595,60,80,50],['hazard',1400,296,350,14]],
  lbl:[['Hala',1000,720],['Laboratorium',1000,300],['Kuchnia',1000,940],['Silnik',430,740],['Sejf',1570,740],['Sypialnie',1575,290]],
  gr:[['t',870,442,'CHILL','#38fedc',28,-.05],['t',1130,442,'HEY!','#ff5fb8',28,.05],['t',850,42,'LAB RATS','#b6ff00',26,-.04],['star',1120,26,12,'#ffe14a'],
      ['t',870,882,'YUM','#ffb000',28,-.05],['heart',1130,866,1,'#ff3b5c'],['t',350,442,'VROOM','#ff9a3a',28,.04],['star',530,426,12,'#38fedc'],
      ['t',1450,442,'$$$','#ffe14a',30,-.05],['t',1700,442,'SAFE','#4aa3ff',26,.05],['t',1500,42,'ZZZ','#c9a8ff',28,-.05],['heart',1680,26,1,'#ff5fb8']]
 }
};
function propSolid(p){
 const k=p[0];
 if(k==='crate'||k==='bench'||k==='counter'||k==='safe'||k==='bed')return[p[1],p[2],p[3],p[4]];
 if(k==='console')return[p[1],p[2],p[3],36];
 if(k==='table'){const s=p[3]*.8;return[p[1]-s,p[2]-s,s*2,s*2]}
 if(k==='seat')return[p[1],p[2],34,36];
 return null;
}
for(const key in MAPS){
 const M=MAPS[key];M.solids=[];
 for(const p of M.props){const s=propSolid(p);if(s)M.solids.push(s)}
 for(const t of M.tasks)M.solids.push([t[0]-22,t[1]-17,44,34]);
 if(M.stations)for(const s of M.stations)M.solids.push([s.x-36,s.y-24,72,58]);
 for(const d of M.doors){d.cx=d.x+d.w/2;d.cy=d.y+d.h/2;d.panels=d.ax==='h'?[[d.cx-65,d.cy],[d.cx+65,d.cy]]:[[d.cx,d.cy-65],[d.cx,d.cy+65]]}
}
function gm(){return MAPS[MAPKEYS[V.mk|0]]||MAPS.ship}
function inF(m,x,y){for(const f of m.fl)if(x>=f[0]&&x<=f[0]+f[2]&&y>=f[1]&&y<=f[1]+f[3])return true;return false}
function doorHit(m,x,y,dr){if(!dr)return false;for(let i=0;i<m.doors.length;i++){if(dr[i]>0){const d=m.doors[i];if(x>=d.x&&x<=d.x+d.w&&y>=d.y&&y<=d.y+d.h)return true}}return false}
function hitSolid(m,x,y){const r2=169;for(const s of m.solids){const cx=Math.max(s[0],Math.min(x,s[0]+s[2])),cy=Math.max(s[1],Math.min(y,s[1]+s[3])),dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<r2)return true}return false}
function free(m,x,y,dr,skipS){
 const r=14,d=10,P=[[x+r,y],[x-r,y],[x,y+r],[x,y-r],[x+d,y+d],[x-d,y+d],[x+d,y-d],[x-d,y-d]];
 for(const p of P)if(!inF(m,p[0],p[1])||doorHit(m,p[0],p[1],dr))return false;
 return skipS||!hitSolid(m,x,y);
}

/* ================= map pre-render (tiles, walls, props, graffiti) ================= */
function hash(x,y){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263))^0x5bd1e995;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295}
const THEMES=[['#8da3bb','#8199b2'],['#b3ddd5','#a5d2c9'],['#6f757a','#676d72'],['#5c6068','#55595f'],['#4b505a','#434852'],['#4f6079','#475772'],['#6b7581','#636d79'],['#59636e','#525c67'],['#c9b99a','#bfae8e'],['#58504c','#4f4743'],['#7a6a92','#71618a']];
function tilesRect(c,f,th){
 const S=56,T=THEMES[th]||THEMES[6];
 for(let y=f[1];y<f[1]+f[3];y+=S)for(let x=f[0];x<f[0]+f[2];x+=S){
  const w=Math.min(S,f[0]+f[2]-x),h=Math.min(S,f[1]+f[3]-y),n=hash(x,y);
  c.fillStyle=T[(Math.round((x-f[0])/S+(y-f[1])/S))&1];c.fillRect(x,y,w,h);
  c.fillStyle='rgba(255,255,255,'+(.02+n*.06)+')';c.fillRect(x,y,w,h);
  c.fillStyle='rgba(0,0,0,.2)';c.fillRect(x,y+h-2,w,2);c.fillRect(x+w-2,y,2,h);
  c.fillStyle='rgba(255,255,255,.16)';c.fillRect(x,y,w,2);c.fillRect(x,y,2,h);
  if(n>.86){c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.arc(x+10+n*20,y+14,3,0,6.283);c.fill()}
 }
}
function wallFace(c,x0,x1,y){
 const g=c.createLinearGradient(0,y-46,0,y);g.addColorStop(0,'#2a323d');g.addColorStop(1,'#3e4a58');
 c.fillStyle=g;c.fillRect(x0,y-46,x1-x0,46);
 c.fillStyle='#161b22';c.fillRect(x0,y-46,x1-x0,7);
 c.fillStyle='#566477';c.fillRect(x0,y-6,x1-x0,6);
 c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;c.beginPath();
 for(let x=x0-((x0%72+72)%72)+72;x<x1;x+=72){c.moveTo(x,y-39);c.lineTo(x,y-6)}c.stroke();
 c.fillStyle='rgba(255,255,255,.18)';
 for(let x=x0+10;x<x1-6;x+=36){c.beginPath();c.arc(x,y-30,2,0,6.283);c.fill();c.beginPath();c.arc(x,y-14,2,0,6.283);c.fill()}
}
function wallSegs(M){
 const segs=[];
 for(const f of M.fl){let sx=null;for(let x=f[0];x<=f[0]+f[2];x+=4){const open=x<f[0]+f[2]&&!inF(M,x+2,f[1]-8);if(open&&sx===null)sx=x;if(!open&&sx!==null){segs.push([sx,x,f[1]]);sx=null}}}
 return segs;
}
function crateP(c,x,y,w,h,col){c.fillStyle='rgba(0,0,0,.28)';c.fillRect(x+4,y+h-3,w,9);c.fillStyle=col||'#6a7b68';rr(c,x,y,w,h,5);c.fill();c.lineWidth=3;c.strokeStyle='#0b0d10';c.stroke();c.fillStyle='rgba(255,255,255,.2)';c.fillRect(x+5,y+5,w-10,5);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;c.beginPath();c.moveTo(x+w/2,y+5);c.lineTo(x+w/2,y+h-5);c.stroke()}
function consoleP(c,x,y,w,col){c.fillStyle='#2b3947';rr(c,x,y,w,36,6);c.fill();c.lineWidth=3;c.strokeStyle='#0b0d10';c.stroke();for(let i=0;i<Math.floor((w-8)/30);i++){c.fillStyle=col||'#4be3f2';rr(c,x+7+i*30,y+7,24,15,3);c.fill();c.fillStyle='#e8c33a';c.fillRect(x+9+i*30,y+27,5,4);c.fillStyle='#e8433a';c.fillRect(x+19+i*30,y+27,5,4)}}
function tableP(c,x,y,r){c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(x+5,y+r*.8,r,r*.55,0,0,6.283);c.fill();c.fillStyle='#8f9cab';c.strokeStyle='#0b0d10';c.lineWidth=4;c.beginPath();c.arc(x,y,r,0,6.283);c.fill();c.stroke();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=3;c.beginPath();c.arc(x,y,r*.78,0,6.283);c.stroke()}
function bedP(c,x,y,w,h){c.fillStyle='#0b0d10';rr(c,x-3,y-3,w+6,h+6,9);c.fill();c.fillStyle='#dfe9ee';rr(c,x,y,w,h,7);c.fill();c.fillStyle='#8fc7d8';rr(c,x+4,y+h*.4,w-8,h*.55,6);c.fill();c.fillStyle='#fff';rr(c,x+5,y+5,w-10,h*.28,5);c.fill()}
function hazard(c,x,y,w,h){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#e9bd1a';c.fillRect(x,y,w,h);c.fillStyle='#16181c';for(let i=-h;i<w+h;i+=30){c.beginPath();c.moveTo(x+i,y+h);c.lineTo(x+i+15,y+h);c.lineTo(x+i+15+h,y);c.lineTo(x+i+h,y);c.closePath();c.fill()}c.restore();c.strokeStyle='#0b0d10';c.lineWidth=3;c.strokeRect(x,y,w,h)}
function padP(c,x,y,r){c.save();c.translate(x,y);for(let k=r;k>10;k-=20){c.fillStyle=k%40===10?'#2c333c':'#3a424d';c.beginPath();c.arc(0,0,k,0,6.283);c.fill();c.strokeStyle='#0b0d10';c.lineWidth=3;c.stroke()}c.fillStyle='#38e8ff';c.shadowColor='#38e8ff';c.shadowBlur=24;c.beginPath();c.arc(0,0,24,0,6.283);c.fill();c.restore()}
function seatP(c,x,y){c.fillStyle='#2f6fa0';rr(c,x,y,34,36,9);c.fill();c.strokeStyle='#0b0d10';c.lineWidth=3.5;c.stroke();c.fillStyle='#1e4a70';rr(c,x+4,y+4,26,12,5);c.fill()}
function drawProp(c,p){
 switch(p[0]){
  case'crate':crateP(c,p[1],p[2],p[3],p[4],p[5]);break;
  case'bench':crateP(c,p[1],p[2],p[3],p[4],'#cfe0e6');break;
  case'counter':crateP(c,p[1],p[2],p[3],p[4],'#b99a6a');break;
  case'safe':crateP(c,p[1],p[2],p[3],p[4],'#4a5666');break;
  case'console':consoleP(c,p[1],p[2],p[3],p[4]);break;
  case'table':tableP(c,p[1],p[2],p[3]);break;
  case'bed':bedP(c,p[1],p[2],p[3],p[4]);break;
  case'hazard':hazard(c,p[1],p[2],p[3],p[4]);break;
  case'pad':padP(c,p[1],p[2],p[3]);break;
  case'seat':seatP(c,p[1],p[2]);break;
 }
}
function graf(c,x,y,txt,col,size,rot){
 c.save();c.translate(x,y);c.rotate(rot||0);c.font='bold '+size+'px '+FONT;c.textAlign='center';c.lineJoin='round';
 c.lineWidth=size/4.5;c.strokeStyle='rgba(0,0,0,.8)';c.shadowColor=col;c.shadowBlur=size/3;c.strokeText(txt,0,0);
 c.fillStyle=col;c.fillText(txt,0,0);c.shadowBlur=0;
 const w=c.measureText(txt).width;c.strokeStyle=col;c.lineWidth=2.6;c.lineCap='round';
 for(let i=0;i<3;i++){const dx=(hash(x+i*7,y)-.5)*w*.8,l=5+hash(i+3,x)*13;c.beginPath();c.moveTo(dx,5);c.lineTo(dx,5+l);c.stroke()}
 c.restore();
}
function grafStar(c,x,y,r,col){c.save();c.translate(x,y);c.fillStyle=col;c.strokeStyle='rgba(0,0,0,.8)';c.lineWidth=4;c.shadowColor=col;c.shadowBlur=8;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.45:r;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}c.closePath();c.stroke();c.fill();c.restore()}
function grafHeart(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=col;c.strokeStyle='rgba(0,0,0,.8)';c.lineWidth=3;c.shadowColor=col;c.shadowBlur=6;c.beginPath();c.moveTo(0,8);c.bezierCurveTo(-14,-2,-8,-14,0,-6);c.bezierCurveTo(8,-14,14,-2,0,8);c.closePath();c.stroke();c.fill();c.restore()}
function grafArrow(c,x,y,col,rot){c.save();c.translate(x,y);c.rotate(rot);c.lineCap='round';c.lineJoin='round';for(const [w,s] of [[9,'rgba(0,0,0,.8)'],[4,col]]){c.strokeStyle=s;c.lineWidth=w;c.beginPath();c.moveTo(-22,0);c.lineTo(22,0);c.moveTo(10,-10);c.lineTo(22,0);c.lineTo(10,10);c.stroke()}c.restore()}
function decorMap(c,M,key){
 for(const p of M.props)drawProp(c,p);
 // wall panels
 for(const [p,col] of [[M.lightsP,'#ffd23a'],[M.commsP,'#4aa3ff']]){if(!p)continue;c.fillStyle='#232b36';rr(c,p[0]-22,p[1]-18,44,36,6);c.fill();c.strokeStyle='#0b0d10';c.lineWidth=3;c.stroke();c.fillStyle=col;c.fillRect(p[0]-14,p[1]-10,28,8);c.fillStyle='#e8433a';c.fillRect(p[0]-14,p[1]+4,8,6);c.fillStyle='#7de06a';c.fillRect(p[0]+6,p[1]+4,8,6)}
 // vents
 for(const v of M.vents){c.fillStyle='#262b32';rr(c,v[0]-25,v[1]-16,50,32,6);c.fill();c.strokeStyle='#0b0d10';c.lineWidth=3;c.stroke();c.strokeStyle='#4a5260';c.lineWidth=3;c.beginPath();for(let i=-2;i<=2;i++){c.moveTo(v[0]-19,v[1]+i*5.5);c.lineTo(v[0]+19,v[1]+i*5.5)}c.stroke()}
 // corridor guide lines
 c.strokeStyle='rgba(233,189,26,.45)';c.lineWidth=4;c.setLineDash([18,16]);c.beginPath();
 for(let i=M.nr;i<M.fl.length;i++){const f=M.fl[i];if(f[2]>=f[3]){c.moveTo(f[0],f[1]+f[3]/2);c.lineTo(f[0]+f[2],f[1]+f[3]/2)}else{c.moveTo(f[0]+f[2]/2,f[1]);c.lineTo(f[0]+f[2]/2,f[1]+f[3])}}
 c.stroke();c.setLineDash([]);
 // painted room names
 c.textAlign='center';c.font='bold 46px '+FONT;c.fillStyle='rgba(0,0,0,.16)';
 for(const l of M.lbl)c.fillText(l[0],l[1],l[2]);
 // wall name plates
 M.rn.forEach((n,i)=>{
  const f=M.fl[M.rf[i]];
  for(const off of [0,-140,140,-250,250]){
   const cx=f[0]+f[2]/2+off;let ok=cx-60>f[0]&&cx+60<f[0]+f[2];
   for(let x=cx-56;ok&&x<=cx+56;x+=8)if(inF(M,x,f[1]-8))ok=false;
   if(!ok)continue;
   c.fillStyle='#161b22';rr(c,cx-56,f[1]-42,112,28,7);c.fill();c.strokeStyle='#7a8798';c.lineWidth=2.5;c.stroke();
   c.font='bold 16px '+FONT;c.textAlign='center';c.fillStyle='#e8eef5';c.fillText(n,cx,f[1]-22);break;
  }
 });
 for(const g of M.gr){
  if(g[0]==='t')graf(c,g[1],g[2],g[3],g[4],g[5],g[6]);else if(g[0]==='star')grafStar(c,g[1],g[2],g[3],g[4]);
  else if(g[0]==='heart')grafHeart(c,g[1],g[2],g[3],g[4]);else if(g[0]==='arrow')grafArrow(c,g[1],g[2],g[3],g[4]);
 }
}
function decorLobby(c){
 c.strokeStyle='rgba(233,189,26,.5)';c.lineWidth=4;c.beginPath();
 for(let x=300;x<=1000;x+=168){c.moveTo(x,230);c.lineTo(x,620)}for(let y=300;y<=620;y+=112){c.moveTo(300,y);c.lineTo(1000,y)}c.stroke();
 for(const p of MAPS.lobby.props)drawProp(c,p);
 c.fillStyle='#7d8894';rr(c,610,146,80,56,10);c.fill();c.strokeStyle='#0b0d10';c.lineWidth=4;c.stroke();c.fillStyle='#39434e';rr(c,622,158,56,36,6);c.fill();c.strokeStyle='#0b0d10';c.lineWidth=3;c.beginPath();c.moveTo(650,158);c.lineTo(650,194);c.stroke();
 c.textAlign='center';c.font='bold 40px '+FONT;c.fillStyle='rgba(0,0,0,.14)';c.fillText('STATEK',650,330);
 graf(c,470,184,'ONE OF US','#ff3b5c',26,-.03);graf(c,860,184,'GG','#38fedc',26,.04);
}
const mapCaches={};
function getMapCache(key){
 const q=CFG.q,s=q===0?.75:(q===1?1:1.5);
 const mc=mapCaches[key];if(mc&&mc.q===q)return mc;
 const M=MAPS[key],cw=M.cw,ch=M.ch;
 const cv=document.createElement('canvas');cv.width=Math.round(cw*s);cv.height=Math.round(ch*s);
 const c=cv.getContext('2d');c.scale(s,s);c.imageSmoothingQuality='high';
 c.fillStyle='#07090c';c.fillRect(0,0,cw,ch);
 if(key==='lobby'){c.fillStyle='#232c36';for(const f of M.fl){rr(c,f[0]-46,f[1]-60,f[2]+92,f[3]+106,34);c.fill()}}
 c.fillStyle='#10151b';for(const f of M.fl)c.fillRect(f[0]-16,f[1]-16,f[2]+32,f[3]+32);
 const segs=wallSegs(M);
 for(const sg of segs)wallFace(c,sg[0],sg[1],sg[2]);
 M.fl.forEach((f,i)=>tilesRect(c,f,M.th[i]!==undefined?M.th[i]:6));
 for(const sg of segs){const g=c.createLinearGradient(0,sg[2],0,sg[2]+24);g.addColorStop(0,'rgba(0,0,0,.4)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(sg[0],sg[2],sg[1]-sg[0],24)}
 if(key==='lobby')decorLobby(c);else decorMap(c,M,key);
 return mapCaches[key]={cv,s,q,w:cw,h:ch};
}

/* ================= dynamic world pieces ================= */
function drawStationsDyn(t){
 const M=gm();
 M.tasks.forEach((s,i)=>{
  c0.fillStyle='#2b3948';rr(c0,s[0]-22,s[1]-17,44,34,6);c0.fill();c0.strokeStyle='#0b0d10';c0.lineWidth=3;c0.stroke();
  c0.fillStyle=s[2]==='wires'?'#ff7b4a':s[2]==='seq'?'#7de06a':'#52d6e8';c0.fillRect(s[0]-16,s[1]-11,32,13);
  const mt=myTasks.find(x=>x.id===i);
  if(mt&&!mt.d&&!(V.sb&&V.sb[1])){c0.strokeStyle='#ffe14a';c0.lineWidth=4;c0.beginPath();c0.arc(s[0],s[1],32+Math.sin(t*5)*4,0,6.283);c0.stroke()}
 });
}
function drawButtonDyn(t){
 const b=gm().btn,p=V.btnT>0?1-V.btnT/.8:-1;
 let dn=0;if(p>=0)dn=p<.25?p/.25:Math.max(0,1-(p-.25)/.5);
 c0.fillStyle='#e9bd1a';c0.strokeStyle='#050607';c0.lineWidth=4;c0.beginPath();c0.arc(b[0],b[1],36,0,6.283);c0.fill();c0.stroke();c0.fillStyle='#16181c';c0.beginPath();c0.arc(b[0],b[1],29,0,6.283);c0.fill();
 c0.fillStyle='#8a1010';c0.beginPath();c0.arc(b[0],b[1]+8,25,0,6.283);c0.fill();c0.stroke();
 const y=b[1]-6+dn*9,g=c0.createRadialGradient(b[0]-8,y-9,3,b[0],y,28);g.addColorStop(0,'#ff8a8a');g.addColorStop(.5,'#e01c1c');g.addColorStop(1,'#a50d0d');
 c0.fillStyle=g;c0.beginPath();c0.arc(b[0],y,25-dn*2,0,6.283);c0.fill();c0.stroke();
 c0.fillStyle='rgba(255,255,255,.6)';c0.beginPath();c0.ellipse(b[0]-8,y-9,8,4,-.5,0,6.283);c0.fill();
 if(p>=0&&p<.7){c0.strokeStyle='rgba(255,80,80,'+(1-p/.7)+')';c0.lineWidth=5;c0.beginPath();c0.arc(b[0],b[1],30+p*90,0,6.283);c0.stroke()}
 else if(N.btn){c0.strokeStyle='rgba(255,225,74,.9)';c0.lineWidth=4;c0.beginPath();c0.arc(b[0],b[1],46+Math.sin(t*5)*3,0,6.283);c0.stroke()}
}
function drawDoorsDyn(t){
 const M=gm();
 M.doors.forEach((d,i)=>{
  const closed=V.dr&&V.dr[i];
  if(closed){
   c0.save();c0.beginPath();c0.rect(d.x,d.y,d.w,d.h);c0.clip();c0.fillStyle='#3c4652';c0.fillRect(d.x,d.y,d.w,d.h);
   c0.fillStyle='#d8a41a';for(let k=-d.h;k<d.w+d.h;k+=22){c0.beginPath();c0.moveTo(d.x+k,d.y+d.h);c0.lineTo(d.x+k+11,d.y+d.h);c0.lineTo(d.x+k+11+d.h,d.y);c0.lineTo(d.x+k+d.h,d.y);c0.closePath();c0.fill()}
   c0.restore();c0.strokeStyle='#050607';c0.lineWidth=4;c0.strokeRect(d.x,d.y,d.w,d.h);
   c0.fillStyle=Math.sin(t*8)>0?'#ff3b3b':'#661212';c0.beginPath();c0.arc(d.cx,d.cy,6,0,6.283);c0.fill();
   for(const p of d.panels){c0.fillStyle='#232b36';rr(c0,p[0]-16,p[1]-14,32,28,5);c0.fill();c0.strokeStyle='#050607';c0.lineWidth=3;c0.stroke();c0.fillStyle='#ff3b3b';c0.beginPath();c0.arc(p[0],p[1],6,0,6.283);c0.fill();
    c0.strokeStyle='rgba(255,225,74,.85)';c0.lineWidth=3;c0.beginPath();c0.arc(p[0],p[1],26+Math.sin(t*5)*3,0,6.283);c0.stroke()}
  }
 });
 if(V.sb&&V.sb[0]){const p=M.lightsP;c0.strokeStyle='rgba(255,225,74,.9)';c0.lineWidth=4;c0.beginPath();c0.arc(p[0],p[1],36+Math.sin(t*5)*4,0,6.283);c0.stroke()}
 if(V.sb&&V.sb[1]){const p=M.commsP;c0.strokeStyle='rgba(255,225,74,.9)';c0.lineWidth=4;c0.beginPath();c0.arc(p[0],p[1],36+Math.sin(t*5)*4,0,6.283);c0.stroke()}
}
function drawLobbyStations(t){
 for(const s of MAPS.lobby.stations){
  c0.fillStyle='rgba(0,0,0,.3)';c0.beginPath();c0.ellipse(s.x+4,s.y+34,40,12,0,0,6.283);c0.fill();
  crateP(c0,s.x-36,s.y-24,72,58,'#5f7a68');
  if(s.k==='set'){c0.fillStyle='#d9dde2';rr(c0,s.x-22,s.y-44,44,30,4);c0.fill();c0.strokeStyle='#0b0d10';c0.lineWidth=3;c0.stroke();c0.fillStyle='#14301a';c0.fillRect(s.x-17,s.y-40,34,20);c0.fillStyle='#7de06a';for(let i=0;i<4;i++)c0.fillRect(s.x-14,s.y-37+i*4.5,12+((i*7)%14),2.5)}
  else{c0.fillStyle='#2a2a30';rr(c0,s.x-16,s.y-34,32,10,3);c0.fill();c0.stroke();rr(c0,s.x-9,s.y-46,18,14,3);c0.fill();c0.stroke();c0.fillStyle='#e8423f';c0.fillRect(s.x-9,s.y-38,18,3)}
  if(N.st===s.k){c0.strokeStyle='#ffe14a';c0.lineWidth=4;c0.beginPath();c0.arc(s.x,s.y,56+Math.sin(t*5)*4,0,6.283);c0.stroke();
   c0.font='bold 20px '+FONT;c0.textAlign='center';c0.lineWidth=5;c0.strokeStyle='#000';c0.strokeText(s.l,s.x,s.y-62);c0.fillStyle='#fff';c0.fillText(s.l,s.x,s.y-62)}
 }
}
