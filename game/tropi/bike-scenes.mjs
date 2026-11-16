import {stageAt,STAGE_LENGTH} from './bike-course.mjs';
const TAU=Math.PI*2;
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function poly(c,p,color){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function stroke(c,p,color,width=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
export function drawRegionalScene(c,camera,W,H,distance,time=0){const current=stageAt(distance),s={...current,start:current.start-(current.number-1)*STAGE_LENGTH,number:1};if(s.theme==='desert')return false;c.save();if(s.theme==='city')copiapo(c,camera,W,H,s,time);else if(s.theme==='coast')coast(c,camera,W,H,s);else if(s.theme==='vinita')vinita(c,camera,W,H,s);else night(c,camera,W,H,s);c.restore();return true;}

export function drawTouristLetters(c,text,x,y,size=38){
 const colors=['#2d92b3','#e87540','#efc14d','#409f92','#ce5c59','#9976aa','#6d9c57'],step=size*.78;
 c.save();c.textAlign='left';c.font='900 '+size+'px Arial Black,system-ui';c.lineJoin='round';c.lineWidth=1.2;
 c.fillStyle='#8b8e80';c.fillRect(x-8,y+6,text.length*step+14,7);c.fillStyle='#d9d5bf';c.fillRect(x-8,y+3,text.length*step+14,4);
 for(const [i,letter]of [...text].entries()){const lx=x+i*step;c.fillStyle='#665b53';c.fillText(letter,lx+3,y+3);c.strokeStyle='#f7eed7';c.fillStyle=colors[i%colors.length];c.fillText(letter,lx,y);c.strokeText(letter,lx,y);}
 c.restore();
}

function vinita(c,camera,W,H,s){
 const sky=c.createLinearGradient(0,0,0,290);sky.addColorStop(0,'#669ab9');sky.addColorStop(.65,'#b9ccd1');sky.addColorStop(1,'#e4c6a0');c.fillStyle=sky;c.fillRect(0,0,W,H);
 c.fillStyle='#ffedb8';c.beginPath();c.arc(850,75,25,0,TAU);c.fill();
 for(let layer=0;layer<3;layer++){const step=170,offset=camera*(.035+layer*.035),points=[];for(let i=Math.floor(offset/step)-1;i<Math.ceil((offset+W)/step)+1;i++)points.push([i*step-offset,185+layer*30-noise(i+layer*17)*(90-layer*15)]);poly(c,[[points[0][0],H],...points,[points.at(-1)[0],H]],['#9caeb4','#7f969f','#9d927f'][layer]);stroke(c,points,['#d6e0db','#b0c3c6','#dac5a4'][layer],2);}
 // A stylized MTB setting, without claiming an exact map of the real trails.
 const x=480-(camera-s.start)*.12;c.fillStyle='#776b57';c.fillRect(x-57,171,4,76);c.fillRect(x+57,171,4,76);c.fillStyle='#426e7e';c.fillRect(x-78,160,156,42);c.strokeStyle='#dbe6cf';c.lineWidth=2;c.strokeRect(x-74,164,148,34);c.textAlign='center';c.fillStyle='#f8efd4';c.font='bold 17px system-ui';c.fillText('VIÑITA AZUL',x,183);c.font='bold 9px system-ui';c.fillText('SENDEROS · MTB',x,196);c.textAlign='left';
 for(let i=0;i<9;i++){const px=((i*170-camera*.16)%1600+1600)%1600-120;poly(c,[[px,248],[px+12,230],[px+22,237],[px+29,249]],'#7c7f78');stroke(c,[[px+13,231],[px+18,246]],'#d3c4a7',1.5);}
}

function copiapo(c,camera,W,H,s,time){
 const sky=c.createLinearGradient(0,0,0,290);sky.addColorStop(0,'#5eacca');sky.addColorStop(1,'#f5dfb5');c.fillStyle=sky;c.fillRect(0,0,W,H);
 c.fillStyle='#fff0b4';c.beginPath();c.arc(890,64,24,0,TAU);c.fill();
 for(let layer=0;layer<2;layer++){const points=[],offset=camera*(.025+layer*.025);for(let i=Math.floor(offset/180)-1;i<Math.ceil((offset+W)/180)+1;i++)points.push([i*180-offset,194+layer*20-noise(i+layer*19)*70]);poly(c,[[points[0][0],H],...points,[points.at(-1)[0],H]],layer?'#b49a7c':'#c9b8a0');}
 c.fillStyle='#d9c9ab';c.fillRect(0,221,W,H-221);
 // Low buildings, shaded promenade, lamps and palms behind the playable lanes.
 const offset=camera*.13;
 for(let i=Math.floor(offset/155)-1;i<(offset+W)/155+1;i++){const x=i*155-offset,h=32+noise(i)*32;c.fillStyle=['#e4b881','#e6d9b3','#d6a58e','#c8ccba'][(i%4+4)%4];c.fillRect(x,225-h,133,h);c.fillStyle='#716f68';c.fillRect(x-3,222-h,139,4);for(let k=0;k<5;k++){c.fillStyle='#526c72';c.fillRect(x+10+k*25,235-h,12,14);}c.fillStyle='#846b54';c.fillRect(x+105,205,17,20);
  if((i%3+3)%3===1){
   // Repeated neighbourhood shops, behind the street and playable cycleway.
   c.fillStyle='#ead7aa';c.fillRect(x,190,133,35);
   c.fillStyle='#436b70';c.fillRect(x+7,205,49,20);c.fillRect(x+62,205,42,20);
   c.fillStyle='#a8c8bf';c.fillRect(x+10,208,43,7);c.fillRect(x+65,208,36,7);
   c.fillStyle='#837257';c.fillRect(x+109,204,17,21);
   c.fillStyle='#a94435';c.fillRect(x-2,184,137,19);
   c.strokeStyle='#eecb71';c.lineWidth=1;c.strokeRect(x,186,133,15);
   c.font='bold 13px system-ui';c.textAlign='center';c.fillStyle='#fff2bd';c.fillText('MALL CHINO',x+66.5,198);c.textAlign='left';
   for(let k=0;k<7;k++){c.fillStyle=k%2?'#edd5a1':'#b6563e';c.fillRect(x+k*19,202,19,3);}
  }
 }
 // Background-only traffic follows a separate street behind the cycleway.
 c.fillStyle='#7b8580';c.fillRect(0,226,W,13);
 for(let i=0;i<5;i++){const dir=i%2?1:-1,x=((i*293+dir*time*(26+i*3)-camera*.13)%(W+170)+(W+170))%(W+170)-85,y=225;c.save();c.translate(x,y);c.scale(dir*.65,.65);poly(c,[[-31,0],[-26,-12],[-12,-14],[-4,-25],[18,-25],[30,-13],[40,-9],[42,0]],['#c57458','#e6c269','#557f94','#c8cbb9','#769a85'][i]);poly(c,[[-1,-22],[15,-22],[25,-13],[-8,-13]],'#b9dce0');for(const wx of [-17,27]){c.fillStyle='#303b3e';c.beginPath();c.arc(wx,0,6,0,TAU);c.fill();c.fillStyle='#c7c9ba';c.beginPath();c.arc(wx,0,2.5,0,TAU);c.fill();}c.restore();}
 stroke(c,[[0,240],[W,240]],'#f7edd5',5);stroke(c,[[0,245],[W,245]],'#a4a99b',3);
 for(let i=0;i<8;i++){const x=((i*190-camera*.21)%1520+1520)%1520-130;c.fillStyle='#6d7364';c.fillRect(x,183,3,62);stroke(c,[[x,184],[x+12,178],[x+22,181]],'#6d7364',3);c.fillStyle='#fff1bb';c.fillRect(x+13,181,10,3);
 const tx=x+63;stroke(c,[[tx,242],[tx+3,187],[tx,165]],'#98754e',5);for(const dx of [-29,-17,17,29])stroke(c,[[tx,165],[tx+dx*.55,156],[tx+dx,170]],'#5b8060',5);}
 const local=camera-s.start;
 // Landmarks move with the promenade, once during the complete level.
 const welcome=460-local*.20;
 c.fillStyle='#6a756b';c.fillRect(welcome-82,185,4,57);c.fillRect(welcome+82,185,4,57);c.fillStyle='#266d68';c.fillRect(welcome-96,157,192,47);c.strokeStyle='#f7e8bc';c.lineWidth=2;c.strokeRect(welcome-92,161,184,39);c.textAlign='center';c.fillStyle='#fff1ce';c.font='bold 11px system-ui';c.fillText('BIENVENIDAS Y BIENVENIDOS',welcome,177);c.font='bold 20px system-ui';c.fillText('A COPIAPÓ',welcome,197);
 const x=890-local*.20,y=239;
 c.fillStyle='#8d8d81';c.fillRect(x-33,y-10,66,10);c.fillStyle='#c8c8b9';c.fillRect(x-24,y-21,48,12);
 // Stylized steel female figure, raised arms and wind-swept hair/drapery.
 const metal=c.createLinearGradient(x-25,0,x+27,0);metal.addColorStop(0,'#727e80');metal.addColorStop(.45,'#f0f0df');metal.addColorStop(.65,'#8a9696');metal.addColorStop(1,'#dce3d8');
 poly(c,[[x-5,y-22],[x-10,y-59],[x-20,y-77],[x-16,y-99],[x-33,y-121],[x-44,y-151],[x-38,y-148],[x-25,y-125],[x-9,y-111],[x+4,y-112],[x+25,y-137],[x+31,y-159],[x+36,y-160],[x+32,y-130],[x+15,y-103],[x+11,y-78],[x+24,y-55],[x+12,y-64],[x+4,y-83],[x+1,y-59],[x+5,y-22]],metal);
 c.fillStyle=metal;c.beginPath();c.ellipse(x-3,y-121,8,11,-.1,0,TAU);c.fill();poly(c,[[x-8,y-129],[x+6,y-134],[x+32,y-124],[x+43,y-126],[x+28,y-117],[x+8,y-120]],metal);stroke(c,[[x-5,y-109],[x-5,y-86],[x+1,y-65],[x-1,y-27]],'#f9f7e6',2);
 c.fillStyle='#495e5e';c.font='bold 9px system-ui';c.fillText('PAZ MUNDIAL',x,y+2);c.textAlign='left';drawTouristLetters(c,'COPIAPÓ',x-250,y-14,36);
}
function coast(c,camera,W,H,s){
 const j=s.number-1,sky=c.createLinearGradient(0,0,0,250);sky.addColorStop(0,['#297eaa','#3b93b3','#247ea8','#6089a0','#b57673'][j]);sky.addColorStop(1,['#c8ebd8','#d2edda','#beece0','#e0e5cf','#f6cea0'][j]);c.fillStyle=sky;c.fillRect(0,0,W,H);
 c.fillStyle='#fff1c5';c.beginPath();c.arc(875,75,23,0,TAU);c.fill();
 for(let i=0;i<4;i++){const x=((i*360-camera*.025)%1500+1500)%1500-150;c.fillStyle='#f4f3db70';c.beginPath();c.ellipse(x,55+i%2*24,80,7,0,0,TAU);c.fill();}
 const sea=c.createLinearGradient(0,146,0,290);sea.addColorStop(0,'#287e9b');sea.addColorStop(.5,'#39b4bd');sea.addColorStop(1,'#98e3cf');c.fillStyle=sea;c.fillRect(0,147,W,190);stroke(c,[[0,147],[W,147]],'#eef4de',2);
 // Horizontal swell stays in the background, never imitates a playable trail.
 for(let row=0;row<9;row++)for(let i=0;i<9;i++){const x=((i*159-camera*(.025+row*.005)+row*47)%1400+1400)%1400-130,y=164+row*14;stroke(c,[[x,y],[x+36,y-1],[x+65,y]],row%2?'#d2f7e080':'#edf5dc65',row>5?2:1);}
 for(let i=0;i<5;i++){const x=((i*260-camera*.045)%1450+1450)%1450-100,y=90+noise(i+2)*35;stroke(c,[[x-7,y],[x,y+3],[x+7,y]],'#355e66',1.5);}
 // Caldera-inspired timber waterfront, church silhouette and small fishing boats.
 if(j===0||j===4){const x=650-((camera-s.start)*.025)%250,y=192;c.fillStyle='#6e6960';c.fillRect(x-170,y+18,480,4);for(let n=-160;n<300;n+=40)c.fillRect(x+n,y+22,3,26);for(let n=0;n<6;n++){const bx=x-150+n*57;c.fillStyle=['#e6b66c','#d6d7b2','#bd8e70'][n%3];c.fillRect(bx,y-23,49,40);poly(c,[[bx-3,y-23],[bx+24,y-40],[bx+52,y-23]],'#7b7068');c.fillStyle='#5b7e83';c.fillRect(bx+12,y-10,9,13);}
 c.fillStyle='#ede2bd';c.fillRect(x+210,y-51,55,67);c.fillRect(x+229,y-89,18,38);poly(c,[[x+225,y-89],[x+238,y-110],[x+251,y-89]],'#5d6e70');poly(c,[[x+205,y-51],[x+238,y-73],[x+270,y-51]],'#67736d');stroke(c,[[x+238,y-110],[x+238,y-120]],'#ece0bd',2);stroke(c,[[x+234,y-116],[x+242,y-116]],'#ece0bd',2);c.fillStyle='#6a776d';c.fillRect(x+232,y-6,12,22);
 }
 for(let i=0;i<3;i++){const x=((i*360-camera*.06)%1250+1250)%1250-60,y=183+i%2*25;poly(c,[[x,y],[x+50,y],[x+39,y+9],[x+12,y+9]],['#b46c45','#eee5bc','#486d85'][i]);stroke(c,[[x+24,y],[x+24,y-25]],'#f0e5c4',1.4);}
 for(let layer=0;layer<2;layer++){const points=[];for(let i=-1;i<10;i++){const x=i*170-((camera*(.08+layer*.03))%170);points.push([x,255+layer*20-noise(i+Math.floor(camera*(.08+layer*.03)/170)+j*7)*23]);}poly(c,[[points[0][0],H],...points,[points.at(-1)[0],H]],layer?'#c6b486':'#e7d6a6');}
 drawTouristLetters(c,'CALDERA',420-(camera-s.start)*.12,210,42);
 if(j===3)for(let i=0;i<3;i++){const x=((i*440-camera*.11)%1600+1600)%1600-200;poly(c,[[x,282],[x+38,218],[x+65,211],[x+103,246],[x+134,282]],'#758c83');stroke(c,[[x+38,218],[x+58,248],[x+95,267]],'#b7c4a0',3);}
}
function night(c,camera,W,H,s){
 const j=s.number-1,sky=c.createLinearGradient(0,0,0,310);sky.addColorStop(0,['#121d3b','#151c36','#231d40','#121e39','#242043'][j]);sky.addColorStop(.65,'#344461');sky.addColorStop(1,'#73758a');c.fillStyle=sky;c.fillRect(0,0,W,H);
 // Fixed stars and a diffuse galactic band; no flashing or strobing.
 for(let i=0;i<160;i++){const x=((noise(i)*1450-camera*.008)%1450+1450)%1450,y=10+noise(i+300)*178,r=.45+noise(i+70)*1.1;c.globalAlpha=.3+noise(i+44)*.65;c.fillStyle='#e7edff';c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}c.globalAlpha=1;
 const moonX=880-j*28,halo=c.createRadialGradient(moonX,72,15,moonX,72,95);halo.addColorStop(0,'#c9dbff28');halo.addColorStop(1,'#c9dbff00');c.fillStyle=halo;c.fillRect(moonX-95,0,190,180);c.fillStyle='#e7ebd8';c.beginPath();c.arc(moonX,72,23,0,TAU);c.fill();for(const [x,y,r]of [[-7,-7,5],[8,3,3],[-2,12,4]]){c.fillStyle='#b3bfd0';c.beginPath();c.arc(moonX+x,72+y,r,0,TAU);c.fill();}
 for(let layer=0;layer<3;layer++){const points=[],step=130+layer*30,offset=camera*(.04+layer*.045);for(let i=Math.floor(offset/step)-1;i<Math.ceil((offset+W)/step)+1;i++)points.push([i*step-offset,230+layer*24-noise(i+layer*31+j*11)*(80-layer*15)]);poly(c,[[points[0][0],H],...points,[points.at(-1)[0],H]],['#3b4c69','#435770','#53657b'][layer]);stroke(c,points,'#96afca50',1.2);}
 for(let i=0;i<11;i++){const x=((i*127-camera*.075)%1500+1500)%1500-100,y=226+noise(i+91)*14;c.fillStyle=i%3?'#e8b56d':'#afcfef';c.fillRect(x,y,2,2);}
 if(j===2||j===4)for(let i=0;i<90;i++){const x=((i*73-camera*.13)%1200+1200)%1200-50,y=242+noise(i+611)*27;c.fillStyle=['#caabd9','#dfbddb','#c2c6e9'][i%3];c.beginPath();c.arc(x,y,1.2,0,TAU);c.fill();}
}
