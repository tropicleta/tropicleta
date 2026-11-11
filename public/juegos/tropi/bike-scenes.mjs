import {stageAt} from './bike-course.mjs';
const TAU=Math.PI*2;
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function poly(c,p,color){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function stroke(c,p,color,width=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
export function drawRegionalScene(c,camera,W,H,distance){const s=stageAt(distance);if(s.theme==='desert')return false;c.save();if(s.theme==='coast')coast(c,camera,W,H,s);else night(c,camera,W,H,s);c.restore();return true;}
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
