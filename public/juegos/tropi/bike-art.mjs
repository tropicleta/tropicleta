import {suspensionPose} from './bike-suspension.mjs';
import {stageAt} from './bike-course.mjs';
import {drawRegionalScene} from './bike-scenes.mjs';
import {riderPose} from './bike-rig.mjs';
import {ROCK_SHAPE,frameSegments} from './bike-geometry.mjs';
// Canvas artwork inspired by the owner's Tropi references. No physics lives here.
const TAU=Math.PI*2;
export function drawFaunaSign(c,x,y,kind,polys,animalX,animalBase){
 c.save();c.translate(x,y);c.scale(.72,.72);c.strokeStyle='#493b2b';c.lineWidth=4;c.beginPath();c.moveTo(0,0);c.lineTo(0,-72);c.stroke();
 c.save();c.translate(0,-64);c.rotate(Math.PI/4);c.fillStyle='#ffd02d';c.strokeStyle='#332d1d';c.lineWidth=2;c.fillRect(-23,-23,46,46);c.strokeRect(-21,-21,42,42);c.restore();
 c.fillStyle='#29281e';const scale=kind==='fox'?.43:.40,centerY=kind==='fox'?16:36,centerX=kind==='fox'?-5:2;
 for(const p of polys){c.beginPath();p.forEach((v,i)=>{const sx=(v.x-animalX-centerX)*scale,sy=-64-(v.y-animalBase-centerY)*scale;i?c.lineTo(sx,sy):c.moveTo(sx,sy);});c.closePath();c.fill();}
 c.fillStyle='#ffd02d';c.fillRect(-24,-27,48,16);c.fillStyle='#332d1d';c.font='bold 9px system-ui';c.textAlign='center';c.fillText('FAUNA',0,-16);c.restore();
}
export function drawProtected(c,o,polys,px,py,scale){
 c.save();c.lineWidth=1.5;c.strokeStyle='#38281f';
 for(const p of polys){c.beginPath();p.forEach((v,i)=>i?c.lineTo(px(v.x),py(v.y)):c.moveTo(px(v.x),py(v.y)));c.closePath();c.fillStyle=o.kind==='flower'?'#9a7cac':o.kind==='fox'?'#c6793f':'#d7bd87';c.fill();c.stroke();}
 const ax=dx=>px(o.x+(o.facing??1)*dx),x=px(o.x),y=py(o.baseY??Math.min(...polys.flatMap(p=>p.map(v=>v.y))));if(o.kind==='flower'){c.strokeStyle='#506638';c.lineWidth=3*scale;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-17*scale);c.stroke();for(let k=0;k<5;k++){c.fillStyle='#e3a8e7';c.beginPath();c.arc(x+Math.cos(k*TAU/5)*5*scale,y-20*scale+Math.sin(k*TAU/5)*5*scale,4*scale,0,TAU);c.fill();}c.fillStyle='#ffe2a0';c.beginPath();c.arc(x,y-20*scale,3*scale,0,TAU);c.fill();}
 else{const hx=ax(22),hy=y-(o.bob||0)*scale-(o.kind==='fox'?24:61)*scale;c.fillStyle='#35251d';c.beginPath();c.arc(hx,hy,1.7*scale,0,TAU);c.fill();c.fillStyle='#f3ddb0';polygon(c,[[ax(10),y-19*scale],[ax(19),y-18*scale],[ax(13),y-10*scale]],'#f3ddb0');if(o.kind==='fox')polygon(c,[[ax(-45),y-30*scale],[ax(-38),y-19*scale],[ax(-35),y-27*scale]],'#f3ddb0');}

 c.restore();
}
function polygon(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke();}}
function line(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};

const PALETTES=[
 ['#994426','#ec9b49','#f9d99c','#b78b71','#966346','#764b35'],
 ['#7d7663','#d9ad73','#fbe4b0','#b5a88a','#92816a','#71634d'],
 ['#835944','#d39361','#f2c78d','#ac8d79','#86664f','#664734'],
 ['#a05438','#efb45b','#ffe2a0','#c6a17b','#ac7e51','#8d5d38'],
 ['#706c83','#cf9c8b','#f8d8ac','#b6a1a0','#937e80','#766063']
];
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export function scenePalette(distance=0){const stage=(stageAt(distance).number-1),t=Math.min(1,Math.max(0,(distance-stageAt(distance).start)/900));return PALETTES[stage].map((v,i)=>mix(PALETTES[Math.max(0,stage-1)][i],v,t));}
export function drawDesert(c,camera,W,H,bloom=0,distance=camera){
 if(drawRegionalScene(c,camera,W,H,distance))return;
 const colors=scenePalette(distance),sky=c.createLinearGradient(0,0,0,310);sky.addColorStop(0,colors[0]);sky.addColorStop(.6,colors[1]);sky.addColorStop(1,colors[2]);c.fillStyle=sky;c.fillRect(0,0,W,H);
 const sunX=850-Math.sin(camera/4800)*90;
 const halo=c.createRadialGradient(sunX,116,14,sunX,116,130);halo.addColorStop(0,'#ffe7a960');halo.addColorStop(1,'#ffe7a900');c.fillStyle=halo;c.fillRect(sunX-130,0,260,260);
 c.fillStyle='#ffe9b5';c.beginPath();c.arc(sunX,116,27,0,TAU);c.fill();
 for(let i=0;i<6;i++){const x=((i*251-camera*.035)%1500+1500)%1500-160,y=45+noise(i)*55;polygon(c,[[x,y+6],[x+35,y],[x+71,y+3],[x+94,y-2],[x+132,y+5],[x+171,y+8]],'#fff0ca30');}
 for(let layer=0;layer<3;layer++){
  const step=135+layer*38,offset=camera*(.055+layer*.06),base=213+layer*23,points=[];
  for(let i=Math.floor((offset-250)/step);i<=Math.ceil((offset+W+250)/step);i++)points.push([i*step-offset,base-25-noise(i+layer*17)*(70-layer*12)]);
  c.beginPath();c.moveTo(points[0][0],H);c.lineTo(...points[0]);
  for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j];c.quadraticCurveTo(a[0]+step*.28,a[1]-5,(a[0]+b[0])/2,(a[1]+b[1])/2);c.lineTo(...b);}
  c.lineTo(points.at(-1)[0],H);c.closePath();c.fillStyle=colors[layer+3];c.fill();
  for(let j=1;j<points.length-1;j++){const [x,y]=points[j];polygon(c,[[x,y],[x+step*.32,base+24],[x+step*.65,base+36]],'#fff0cd12');line(c,[[x+4,y+10],[x+step*.12,base-3],[x+step*.25,base+25]],'#4b30351c',1.5);}
 }
 // Broad rock mesas create landmarks, separate from all interactive obstacles.
 for(let i=0;i<3;i++){const x=((i*630-camera*.11)%1900+1900)%1900-290,y=201+noise(i+6)*25,w=92+noise(i)*50;polygon(c,[[x-43,y+70],[x,y-37],[x+15,y-39],[x+26,y-56],[x+w-12,y-55],[x+w,y-35],[x+w+52,y+70]],colors[4]);polygon(c,[[x+26,y-56],[x+w-12,y-55],[x+w,y-35],[x+w+52,y+70],[x+w*.62,y+48]],colors[5]);line(c,[[x+29,y-51],[x+w-17,y-50]],'#ffdeaa60',2);for(let k=0;k<3;k++)line(c,[[x+4-k*8,y-20+k*19],[x+w+10+k*10,y-18+k*19]],'#efc29825',2);}
 if(bloom>.01){c.save();c.globalAlpha=bloom*.5;polygon(c,[[0,224],[W*.25,209],[W*.55,233],[W*.8,216],[W,231],[W,277],[0,277]],'#72745b');c.globalAlpha=bloom;for(let i=0;i<250;i++){const x=((i*83-camera*.13)%(W+80)+W+80)%(W+80)-40,y=216+noise(i+531)*48,r=.7+noise(i+90)*1.5;c.fillStyle=['#dc83b3','#f4c061','#f7dbe8','#af6398'][i%4];c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}c.restore();}
 c.fillStyle='#ffe1af15';c.fillRect(0,237,W,9);
}

export function drawTrail(c,{lane,px,py,start,end,H,theme='desert'}){
 const samples=[];for(let x=start;x<=end;x+=6)samples.push([px(x),py(x)]);
 const first=samples[0],last=samples.at(-1),ground=c.createLinearGradient(0,230+lane*100,0,H+80);
 const night=theme==='night',coast=theme==='coast';ground.addColorStop(0,night?(lane?'#68798a':'#43566b'):coast?(lane?'#dfcc9c':'#b7ab84'):(lane?'#c79660':'#956340'));ground.addColorStop(1,night?'#344559':coast?'#a59572':(lane?'#9d6b48':'#6e4834'));polygon(c,[[first[0],H+100],...samples,[last[0],H+100]],ground);
 for(let band=1;band<=3;band++)line(c,samples.map(([x,y],i)=>[x,y+band*20+Math.sin((i*6+start)/130+band)*3]),band===1?'#ffe1ad22':'#432d2520',band===1?2:1);
 line(c,samples.map(([x,y])=>[x,y+7]),'#4c352d',14);line(c,samples.map(([x,y])=>[x,y+6]),night?(lane?'#c7d8db':'#95abbf'):coast?'#f4e8c5':lane?'#efd09a':'#cda46e',11);line(c,samples,lane?'#fff0c3':'#edd4a5',2);
 for(let n=Math.floor(start/80);n<end/80;n++){
  const x=n*80+noise(n+lane*71)*30,y=py(x)+26+noise(n+81)*25,w=2+noise(n+51)*4;
  polygon(c,[[px(x)-w,y+2],[px(x)-w*.3,y-1],[px(x)+w,y],[px(x)+w*.6,y+3]],n%3?'#67493245':'#f6d8a14a');
  if(n%5===0){line(c,[[px(x)+9,y+2],[px(x)+7,y-5],[px(x)+11,y]],'#655b3e70',1.2);}
 }
}

export function drawBoulder(c,x,y,w,h,kind='rock'){
 const shape=kind==='wall'?[[-.5,0],[-.5,1],[.5,1],[.5,0]]:ROCK_SHAPE;
 c.lineWidth=1.2;polygon(c,shape.map(([a,b])=>[x+a*w,y-b*h]),'#72513c','#33291f');
 if(kind==='wall'){polygon(c,[[x-w/2,y-h],[x,y-h],[x-w*.1,y],[x-w/2,y]],'#aa7950');line(c,[[x+w*.3,y-h+12],[x+w*.17,y-h*.5],[x+w*.35,y-10]],'#d6a875',2);for(let i=0;i<5;i++)line(c,[[x-w/2+i*w/5,y-h*.12],[x-w/2+(i+1)*w/5,y-h*.21]],i%2?'#e8bb62':'#392d22',7);return;}
 polygon(c,[[x-w*.44,y-h*.65],[x-w*.15,y-h],[x+w*.35,y-h*.9],[x+w*.08,y-h*.35]],'#d4a06b');polygon(c,[[x+w*.08,y-h*.35],[x+w*.35,y-h*.9],[x+w/2,y-h*.3],[x+w/2,y]],'#865333');
}
// Coordinates use the model's upward-facing Y axis. Wheels retain their exact
// physical centers and radius; the rider's animation is decorative only.
function drawComicHead(c){
 const ink='#241e1b',orange='#ef8c22',light='#ffb847';c.lineWidth=1.8;c.strokeStyle=ink;c.lineJoin='round';
 // Reference: upright/folded ears, swept eyelids and a long, cheeky canine muzzle.
 c.beginPath();c.moveTo(-14,9);c.quadraticCurveTo(-17,25,-8,37);c.quadraticCurveTo(-3,27,-3,15);c.closePath();c.fillStyle=orange;c.fill();c.stroke();
 c.beginPath();c.moveTo(-11,17);c.quadraticCurveTo(-11,27,-8,32);c.quadraticCurveTo(-5,24,-6,17);c.closePath();c.fillStyle='#b85c27';c.fill();
 c.beginPath();c.moveTo(5,15);c.quadraticCurveTo(8,29,15,27);c.lineTo(24,21);c.quadraticCurveTo(24,15,19,12);c.quadraticCurveTo(14,13,12,20);c.lineTo(8,18);c.closePath();c.fillStyle=orange;c.fill();c.stroke();line(c,[[12,23],[16,17],[19,15]],'#b85c27',1.5);c.strokeStyle=ink;
 c.beginPath();c.moveTo(-14,12);c.quadraticCurveTo(-10,20,-5,18);c.lineTo(-2,20);c.quadraticCurveTo(9,20,16,12);c.quadraticCurveTo(21,7,19,0);c.quadraticCurveTo(29,1,30,-6);c.quadraticCurveTo(30,-12,23,-15);c.quadraticCurveTo(15,-20,5,-16);c.lineTo(-6,-13);c.quadraticCurveTo(-11,-12,-14,-6);c.lineTo(-18,-3);c.lineTo(-14,-2);c.lineTo(-18,3);c.lineTo(-14,2);c.lineTo(-16,7);c.quadraticCurveTo(-14,8,-14,12);c.closePath();c.fillStyle=orange;c.fill();c.stroke();
 c.beginPath();c.moveTo(-13,-5);c.quadraticCurveTo(-7,-13,2,-13);c.quadraticCurveTo(15,-18,24,-13);c.quadraticCurveTo(17,-21,5,-17);c.quadraticCurveTo(-7,-16,-13,-9);c.closePath();c.fillStyle='#c26929';c.fill();
 // Swept eye silhouettes replace round eyes to match the workshop mascot.
 c.fillStyle='#fff1cf';c.beginPath();c.moveTo(12,1);c.quadraticCurveTo(12,10,17,13);c.quadraticCurveTo(22,14,20,8);c.lineTo(18,1);c.closePath();c.fill();c.stroke();c.fillStyle=ink;c.beginPath();c.ellipse(18,5,2.5,5,-.18,0,TAU);c.fill();
 c.fillStyle='#fff1cf';c.beginPath();c.moveTo(-4,1);c.quadraticCurveTo(-5,12,0,14);c.quadraticCurveTo(4,13,8,5);c.lineTo(5,0);c.closePath();c.fill();c.stroke();c.fillStyle=ink;c.beginPath();c.ellipse(4.5,4,3.1,5.2,-.3,0,TAU);c.fill();c.fillStyle='#fff1cf';for(const [x,y]of [[5.4,6.5],[18.7,7]]){c.beginPath();c.arc(x,y,1,0,TAU);c.fill();}
 c.beginPath();c.moveTo(7,-4);c.quadraticCurveTo(18,-8,26,-5);c.quadraticCurveTo(32,-8,26,-13);c.quadraticCurveTo(17,-18,8,-13);c.lineTo(4,-9);c.closePath();c.fillStyle=light;c.fill();
 c.strokeStyle=ink;c.lineWidth=1.2;c.beginPath();c.moveTo(-5,16);c.quadraticCurveTo(0,22,5,14);c.quadraticCurveTo(7,11,9,13);c.stroke();c.lineWidth=2.2;c.beginPath();c.moveTo(12,13);c.quadraticCurveTo(17,19,21,15);c.stroke();
 // Low eyelids give the confident, mischievous expression of the supplied photo.
 line(c,[[1,13],[6,7],[9,8]],ink,1.2);line(c,[[15,12],[19,9],[21,10]],ink,1.8);
 c.fillStyle=ink;c.beginPath();c.moveTo(23,0);c.quadraticCurveTo(28,3,32,-1);c.quadraticCurveTo(36,-5,29,-8);c.quadraticCurveTo(24,-7,23,-3);c.closePath();c.fill();c.beginPath();c.moveTo(25,-2);c.quadraticCurveTo(27,1,28,-2);c.moveTo(30,-3);c.quadraticCurveTo(33,-2,32,-4);c.strokeStyle='#fff1cf';c.lineWidth=.85;c.stroke();
 c.beginPath();c.moveTo(-2,-8);c.quadraticCurveTo(6,-19,21,-13);c.quadraticCurveTo(26,-13,27,-9);c.strokeStyle=ink;c.lineWidth=1.6;c.stroke();line(c,[[27,-7],[27,-10]],ink,1.1);
 c.fillStyle=ink;for(const [x,y]of [[14,-9],[18,-11],[11,-12]]){c.beginPath();c.arc(x,y,.65,0,TAU);c.fill();}
 line(c,[[-11,10],[-8,13],[-4,12]],'#ffbd55',1.5);line(c,[[-12,-3],[-8,-8],[-5,-9]],'#bd6828',1);
}

export function drawTropi(c,s,mascot,half,radius){
 c.lineCap='round';c.lineJoin='round';
 const phase=s.pedalPhase??-s.x/26,compress=(s.impact||0)*3,pose=riderPose(phase,compress),rig=pose.legs;
 // Back leg and tail stay behind the frame and near leg.

 function leg(part,far=false){const {knee,ankle,foot}=part;line(c,[pose.hip,knee,ankle],far?'#322a24':'#241e1b',9);line(c,[knee,ankle],far?'#bd691b':'#ef8c22',5.8);const thigh=[pose.hip[0]+(knee[0]-pose.hip[0])*.68,pose.hip[1]+(knee[1]-pose.hip[1])*.68];line(c,[pose.hip,thigh],far?'#252924':'#38322c',10);line(c,[[thigh[0]-2,thigh[1]+1],[thigh[0]+2,thigh[1]+1]],'#ef9e2e',1);c.fillStyle='#252a23';c.beginPath();c.arc(...knee,3.5,0,TAU);c.fill();const sock=[ankle[0]+(knee[0]-ankle[0])*.23,ankle[1]+(knee[1]-ankle[1])*.23];line(c,[sock,ankle],far?'#b9baaa':'#f3ecda',5.3);line(c,[[sock[0]-2,sock[1]],[sock[0]+2,sock[1]]],'#282d26',1);polygon(c,[[ankle[0]-3,ankle[1]+1],[ankle[0]+2,ankle[1]],[foot[0]+6,foot[1]+2],[foot[0]+6,foot[1]-1],[foot[0]-5,foot[1]-1]],far?'#272d26':'#1d231d','#101510');line(c,[[foot[0]-4,foot[1]],[foot[0]+6,foot[1]]],far?'#929988':'#e5dfc9',1.5);if(!far)for(let i=0;i<3;i++)line(c,[[ankle[0]+i,ankle[1]-1-i*.7],[ankle[0]+i+2,ankle[1]-1-i*.7]],'#b7bba9',.6);}

 for(const x of [-half,half]){c.save();c.translate(0,-(s.wheelTravel?.[x<0?0:1]||0));
  c.fillStyle='#181b17';c.beginPath();c.arc(x,0,radius,0,TAU);c.fill();c.strokeStyle='#0c110d';c.lineWidth=2.1;c.stroke();
  c.strokeStyle='#d5d5c0';c.lineWidth=1.7;c.beginPath();c.arc(x,0,radius-3,0,TAU);c.stroke();
  for(let a=0;a<16;a++){const t=a*TAU/16-s.x/radius;line(c,[[x,0],[x+Math.cos(t)*(radius-3),Math.sin(t)*(radius-3)]],'#92998a',.7);line(c,[[x+Math.cos(t)*(radius-.7),Math.sin(t)*(radius-.7)],[x+Math.cos(t)*(radius+.5),Math.sin(t)*(radius+.5)]],'#777b67',1.5);}
  c.fillStyle='#6a7466';c.beginPath();c.arc(x,0,5,0,TAU);c.fill();c.strokeStyle='#b6c1ad';c.lineWidth=.7;c.stroke();for(let k=0;k<6;k++){const a=k*TAU/6;line(c,[[x+Math.cos(a)*2,Math.sin(a)*2],[x+Math.cos(a+.3)*4.5,Math.sin(a+.3)*4.5]],'#dbe1ce',.7);}c.fillStyle='#ed4654';c.beginPath();c.arc(x,0,1.6,0,TAU);c.fill();c.restore();
 }
 const suspension=suspensionPose(s),rearAxle=suspension.axles[0],frontAxle=suspension.axles[1];c.save();c.translate(0,suspension.heave);c.rotate(suspension.pitch);
 c.save();c.translate(-18,30-compress);c.rotate(Math.sin(s.time*8)*.08);polygon(c,[[0,4],[-10,5],[-19,14],[-17,2],[-10,-4],[1,-2]],'#ef8c22','#241e1b');polygon(c,[[-10,5],[-19,14],[-17,2],[-12,0]],'#ffb847');c.restore();
 leg(rig[1],true);
 // Shared frame geometry retains exactly the same visible contact positions.
 for(const [i,[ax,ay,bx,by]]of frameSegments(s).entries()){line(c,[[ax,ay],[bx,by]],'#241e1b',6);line(c,[[ax,ay],[bx,by]],i<=6?'#d52b3e':'#302923',i===4?4.5:3.7);line(c,[[ax,ay+.7],[bx,by+.7]],i<=6?'#ff9a9f':'#c9bea9',.9);}
 line(c,[rearAxle,[3,1],[-12,4],rearAxle],'#939b87',.9);line(c,[[16,25],frontAxle],'#181f18',5);const forkTop=[16+(frontAxle[0]-16)*.3,25+(frontAxle[1]-25)*.3],forkBottom=[16+(frontAxle[0]-16)*.8,25+(frontAxle[1]-25)*.8];line(c,[forkTop,forkBottom],'#d9ded9',2.5);line(c,[forkBottom,frontAxle],'#cf293b',3.5);line(c,[[-20,29],[-8,29]],'#151b15',4);line(c,[[-19,30],[-10,30]],'#8c9581',.8);
 c.save();c.translate(9,11);c.rotate(1.03);c.scale(1,-1);c.fillStyle='#1e2119';c.font='bold 3px sans-serif';c.fillText('TROPICLETA',-2,0);c.restore();
 line(c,[pose.farArm.shoulder,pose.farArm.elbow,pose.farArm.hand],'#241e1b',7);line(c,[pose.farArm.elbow,pose.farArm.hand],'#ba6428',4.5);line(c,[pose.farArm.hand,[pose.farArm.hand[0]+3,pose.farArm.hand[1]]],'#292522',4.8);
 c.strokeStyle='#41493b';c.lineWidth=.8;c.beginPath();c.moveTo(27,33);c.quadraticCurveTo(37,28,27,11);c.stroke();const lowerShock=[-8+suspension.rear*.45,10+suspension.rear*.75+rearAxle[1]*.15],upperShock=[8,21],sx=upperShock[0]-lowerShock[0],sy=upperShock[1]-lowerShock[1],length=Math.hypot(sx,sy),spring=[];line(c,[rearAxle,lowerShock],'#343a32',2.2);line(c,[lowerShock,upperShock],'#241e1b',4.5);line(c,[lowerShock,upperShock],'#d4dcd2',2.3);for(let i=0;i<12;i++){const t=.15+i*.06,offset=i%2?1.35:-1.35;spring.push([lowerShock[0]+sx*t-sy/length*offset,lowerShock[1]+sy*t+sx/length*offset]);}line(c,spring,'#63bddb',1.5);for(const mount of [lowerShock,upperShock]){c.fillStyle='#f2bd63';c.beginPath();c.arc(...mount,1.5,0,TAU);c.fill();}

 for(const [x,y]of [[-12,22],[16,25],[3,2]]){c.fillStyle='#ecb75a';c.beginPath();c.arc(x,y,1.4,0,TAU);c.fill();}
 c.fillStyle='#252d22';c.beginPath();c.arc(3,2,4.4,0,TAU);c.fill();for(const part of rig){line(c,[[3,2],part.foot],'#b8c3a8',1.7);line(c,[[part.foot[0]-3,part.foot[1]],[part.foot[0]+3,part.foot[1]]],'#1d261c',2.4);}
 leg(rig[0]);
 c.save();c.translate(0,-compress);
 // Comic jersey and shorts use the same black/orange/cream palette as the head.
 c.beginPath();c.moveTo(-21,28);c.quadraticCurveTo(-18,38,-11,46);c.quadraticCurveTo(-7,49,-2,49);c.lineTo(7,45);c.quadraticCurveTo(10,39,8,35);c.lineTo(-2,28);c.closePath();c.fillStyle='#292522';c.strokeStyle='#241e1b';c.lineWidth=1.8;c.fill();c.stroke();line(c,[[-5,49],[-2,47],[2,47]],'#ffb847',1.7);line(c,[[-21,29],[-4,28]],'#d8d9bf',1);polygon(c,[[-6,43],[1,43],[-2,39],[2,39],[-5,32],[-3,38],[-8,38]],'#ffb32b');line(c,[[-19,35],[-13,33]],'#616b58',.7);c.restore();
 line(c,[pose.shoulder,pose.elbow],'#241e1b',9);line(c,[[pose.shoulder[0]+1,pose.shoulder[1]],pose.elbow],'#38322c',6.2);line(c,[pose.elbow,pose.hand],'#241e1b',7.3);line(c,[pose.elbow,pose.hand],'#ef8c22',4.8);line(c,[[pose.hand[0]-2,pose.hand[1]+1],[pose.hand[0]+2,pose.hand[1]]],'#292522',5.5);line(c,[[pose.hand[0]-1,pose.hand[1]+2],[pose.hand[0]+2,pose.hand[1]+1]],'#c0c8ad',1);
 c.save();c.translate(3,58-compress);c.rotate(-.04+Math.sin(phase)*.009);c.scale(.66,.66);drawComicHead(c);c.restore();c.restore();
}
