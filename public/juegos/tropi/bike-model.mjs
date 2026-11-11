import {stepSuspension,stepWheelTravel} from './bike-suspension.mjs';
import {cactusPolygons} from './bike-cactus.mjs';
import {BASE_BIKE} from './bike-spec.mjs';
import {vehicleShapes,wheelPoint,rockPolygon,circleContact,capsuleTouches,riderTouches,riderTouchesGround} from './bike-geometry.mjs';
import {FINISH,STAGES,stageLabel,stageAt,obstacles,RAMPS,FAUNA_ZONES,PROTECTED,STUNT_ZONES,SPEED_ZONES,FLOW_SECTIONS,COLLECTIBLES,HILLS,hazards,speedZoneAt,bloomAt,faunaZoneAt} from './bike-course.mjs';
export * from './bike-course.mjs';
export const RADIUS=BASE_BIKE.radius, HALF=BASE_BIKE.half, LANE_COUNT=2, LANE_TIME=.32;
export function protectedAt(o,time=0){
 if(o.posed)return o;
 if(o.kind==='flower')return {...o,originX:o.x,baseY:terrain(o.x),protected:true,posed:true};
 const z=FAUNA_ZONES.find(z=>z.lane===o.lane&&z.kind===o.kind&&z.animalX===o.x),center=z?(z.start+z.end)/2:o.x,range=z?Math.max(0,(z.end-z.start)/2-50):0,phase=(range?Math.asin(Math.max(-1,Math.min(1,(o.x-center)/range))):0)+time*(o.kind==='fox'?.85:.75),x=center+range*Math.sin(phase),gait=time*(o.kind==='fox'?11:14);
 return {...o,x,originX:o.x,facing:Math.cos(phase)>=0?1:-1,gait,bob:1.6*Math.sin(gait)**2,baseY:terrain(x),protected:true,posed:true};
}
export function protectedPolygons(object,time=0){
 const o=protectedAt(object,time),x=o.x,y=o.baseY,facing=o.facing??1,bob=o.bob||0,world=(p,lift=bob)=>p.map(([dx,dy])=>({x:x+facing*dx,y:y+dy+lift}));
 if(o.kind==='flower')return [[[-1.5,0],[-1.5,18],[1.5,18],[1.5,0]],[[-10,18],[-5,25],[5,25],[10,18],[6,14],[-6,14]]].map(p=>world(p,0));
 const body=o.kind==='fox'?[[-23,9],[-22,21],[-10,27],[16,23],[22,12],[11,8]]:[[-22,12],[-22,31],[-14,38],[15,36],[22,21],[16,12]];
 const head=o.kind==='fox'?[[9,19],[10,33],[17,28],[23,33],[25,24],[34,20],[25,15]]:[[10,28],[10,59],[12,72],[17,64],[22,72],[23,62],[32,60],[32,54],[22,52],[23,25]];
 const tail=o.kind==='fox'?[[-20,12],[-35,15],[-45,30],[-31,26],[-17,20]]:[[-22,23],[-29,31],[-26,34],[-19,29]];
 const legs=[-14,14].map((dx,i)=>{const phase=(o.gait||0)+i*Math.PI,stride=Math.sin(phase)*7,lift=Math.max(0,Math.cos(phase)-.15)*5;return world([[dx+stride-2,lift],[dx-3,18+bob],[dx+3,18+bob],[dx+stride+2,lift]],0);});
 return [world(body),world(head),...legs,world(tail)];
}
export const DIFFICULTIES={suave:{label:'Suave',maxSpeed:150,jump:280,landing:360,damping:3.6,assist:19},normal:{label:'Normal',maxSpeed:195,jump:270,landing:330,damping:2.8,assist:14},desafio:{label:'Desafío',maxSpeed:235,jump:260,landing:305,damping:2.4,assist:11}};
const smooth=t=>t*t*(3-2*t);
export function terrain(x,lane=0){let h=0;for(const [a,b,amp] of HILLS)if(x>a&&x<b)h+=amp*(1-Math.cos((x-a)/(b-a)*Math.PI*2))/2;for(const r of RAMPS){if(x>=r.x&&x<=r.crest)h+=r.h*smooth((x-r.x)/(r.crest-r.x));else if(x>r.crest&&x<r.end)h+=r.h*(1-smooth((x-r.crest)/(r.end-r.crest)));}for(const z of STUNT_ZONES){if(x>=z.start&&x<=z.lip)h+=z.h*smooth((x-z.start)/(z.lip-z.start));else if(x>z.lip&&x<=z.landing)h-=40;else if(x>z.landing&&x<z.end)h-=40*(1-smooth((x-z.landing)/(z.end-z.landing)));}return h;}

export function surface(x,lane,level='normal'){return hazards(level).some(h=>h.kind==='pit'&&h.lane===lane&&x>h.x&&x<h.end)?-115:terrain(x,lane);}
export function rideSurface(s,x){if(!s.transition)return surface(x,s.lane,s.difficulty);const t=Math.min(1,s.transition.t/LANE_TIME),e=t*t*(3-2*t);return surface(x,s.transition.from,s.difficulty)*(1-e)+surface(x,s.transition.to,s.difficulty)*e;}
export function wheelContacts(s,tolerance=2){return [-1,1].map(side=>{const p=wheelPoint(s,side),d=p.y-RADIUS-rideSurface(s,p.x);return d>=-5&&d<=tolerance;});}

// Six world units of tyre/ground tolerance absorb tiny contact flicker. A
// deliberate jump, a real gap or sustained flight still blocks a new crossing.
export function hasLaneSupport(s){const rock=rockSupports(s).some(Boolean);return (s.jumpLock||0)<=0&&(wheelContacts(s,6).some(Boolean)||rock)&&(s.grounded||rock||((s.airTime||0)<.10&&s.vy<=35));}
export const canJump=hasLaneSupport;
// Accept intention only in the last few units of a descent; crossing still waits for support.
export function canBufferAction(s){if(s.status!=='riding'||s.transition||s.vy>=0||s.jumpLock>0)return false;const gaps=[-1,1].map(side=>(p=>p.y-RADIUS-rideSurface(s,p.x))(wheelPoint(s,side)));return Math.min(...gaps)>=-1&&Math.min(...gaps)<=16;}
export function requestLane(s,dir){if(changeLane(s,dir))return true;if(canBufferAction(s)&&[0,1].includes(s.lane+dir)){s.laneRequest={dir,ttl:.14};return true;}return false;}

export function addTrick(s,points,label){s.score=(s.score||0)+points;s.trickLabel=`${label} +${points}`;s.trickTime=s.time;s.scoreMilestone=Math.floor(s.score/250);}
export function rockSupports(s){const c=Math.cos(s.angle),n=Math.sin(s.angle),wheels=[-1,1].map(side=>({...wheelPoint(s,side),r:RADIUS}));return wheels.map(w=>obstacles.some(o=>o.lane===s.lane&&Math.abs(w.x-o.x)<80&&(hit=>hit&&hit.ny>.35)(circleContact({...w,r:w.r+1.2},rockPolygon(o,terrain(o.x,o.lane))))));}
export function rearSupported(s){return (s.jumpLock||0)<=0&&((s.grounded&&wheelContacts(s)[0])||rockSupports(s)[0]);}
export function axleLoads(s,lean=0){const rock=rockSupports(s),contacts=wheelContacts(s,3).map((v,i)=>v||rock[i]);if(!contacts[0]&&!contacts[1])return {rear:0,front:0};if(!contacts[1])return {rear:1,front:0};if(!contacts[0])return {rear:0,front:1};const rear=Math.max(.25,Math.min(.78,.56+lean*.17+Math.sin(s.angle)*.12));return {rear,front:1-rear};}
// Project lane geometry into the moving bicycle's coordinates. Both lanes can
// participate during a crossing, but only their visible shapes can touch it.
export function laneContactPolygon(s,poly,lane){
 const depth=s.transition?s.depth:s.lane,scale=.86+depth*.14,other=.86+lane*.14;
 return poly.map(p=>({x:s.x+(p.x-s.x)*other/scale,y:(p.y*other+(depth-lane)*100)/scale}));
}
export function createBike(difficulty='normal',stage=0){stage=Math.max(0,Math.min(STAGES.length-1,Math.trunc(stage)||0));const x=STAGES[stage].start+100;return{x,y:terrain(x)+RADIUS,vx:0,vy:0,angle:0,spin:0,lane:1,depth:1,stage,checkpointScore:0,checkpointSerial:0,checkpointTime:0,score:0,scoreMilestone:0,transition:null,grounded:true,airTime:0,jumpLock:0,status:'ready',jumpHeld:false,jumpSerial:0,jumpBuffer:0,laneRequest:null,time:0,jumps:0,landings:0,changes:0,bumps:0,lastBumpTime:-1,impact:0,groundSlope:0,driving:false,rearGrace:0,difficulty:DIFFICULTIES[difficulty]?difficulty:'normal',message:'Toca Saltar o el escenario para empezar'};}
// Only the trail under the tyres can supply sand/boost or obstacle contacts.
export function occupiedLanes(s){return s.transition?[s.transition.from,s.transition.to].filter(lane=>Math.abs(s.depth-lane)<=.3):[s.lane];}
export function changeLane(s,dir){
 const lane=s.lane+dir;
 if(s.status!=='riding'||s.transition||!Number.isInteger(lane)||lane<0||lane>=LANE_COUNT||!hasLaneSupport(s))return false;
 s.transition={from:s.lane,to:lane,t:0};s.changes++;return true;
}
function crash(s,message){if(s.status==='riding'){s.status='crashed';s.message=message;}}
export function stepBike(s,input,dt){
 if(s.status!=='riding')return s;
 const base=DIFFICULTIES[s.difficulty]||DIFFICULTIES.normal,settings={...base,maxSpeed:base.maxSpeed*STAGES[s.stage||0].pace};
 dt=Math.max(0,Math.min(dt,1/30));s.time+=dt;s.impact*=Math.exp(-9*dt);s.jumpLock=Math.max(0,(s.jumpLock||0)-dt);s.jumpBuffer=Math.max(0,(s.jumpBuffer||0)-dt);if(s.laneRequest){s.laneRequest.ttl-=dt;if(s.laneRequest.ttl<=0)s.laneRequest=null;}
 const oldX=s.x,oldY=s.y,oldAngle=s.angle,wasGrounded=s.grounded,wasLaunchSupported=s.grounded||((s.airTime||0)<.16&&s.vy<=35&&wheelContacts(s,8).some(Boolean)),lean=(input.back?1:0)-(input.forward?1:0);
 stepWheelTravel(s,dt,x=>rideSurface(s,x),lean);
 // Brief contact loss keeps drive; front-only rolling retains momentum.
 const rear=rearSupported(s);s.rearGrace=rear?.42:Math.max(0,(s.rearGrace||0)-dt);
 const groundLane=occupiedLanes(s)[0],zone=s.grounded&&groundLane!==undefined?speedZoneAt(s.x,groundLane):null;s.surfaceKind=zone?.kind||'trail';
 if(zone?.kind==='boost'&&s.lastBoost!==zone.start){s.lastBoost=zone.start;s.boostUntil=s.time+1.8;s.vx+=45;s.boosts=(s.boosts||0)+1;}
 const boosted=(s.boostUntil||0)>s.time,cap=boosted?settings.maxSpeed*1.35:s.boostUntil?Math.max(settings.maxSpeed,s.vx-70*dt):settings.maxSpeed;
 s.driving=!!input.gas&&(rear||s.rearGrace>0);s.vx+=(s.driving?(zone?.kind==='sand'?45:100):0)*dt;s.vx*=Math.exp(-(zone?.kind==='sand'?1.8:s.grounded?(s.driving?.17:.055):.012)*dt);s.vx=Math.max(0,Math.min(cap,s.vx));
 s.spin+=lean*(s.grounded?5.2:19)*dt;s.spin*=Math.exp(-(s.grounded?settings.damping:(lean?.9:2.8))*dt);s.spin=Math.max(-6.2,Math.min(6.2,s.spin));s.angle+=s.spin*dt;if(s.airTrick)s.airTrick.rotation=(s.airTrick.rotation||0)+s.spin*dt;

 const newTap=(input.jump&&!s.jumpHeld)||((input.jumpSerial||0)!==(s.jumpSerial||0));
 if(newTap)s.jumpBuffer=.14;s.jumpSerial=input.jumpSerial||0;s.jumpHeld=!!input.jump;
 if(s.jumpBuffer>0&&canJump(s)){s.vy=settings.jump;s.grounded=false;s.jumpLock=.18;s.jumps++;s.jumpBuffer=0;}

 if(s.transition){s.transition.t=Math.min(LANE_TIME,s.transition.t+dt);const t=s.transition.t/LANE_TIME;s.depth=s.transition.from+(s.transition.to-s.transition.from)*(t*t*(3-2*t));}
 s.x+=s.vx*dt;
 for(const z of STUNT_ZONES)if(oldX<z.lip-30&&s.x>=z.lip-30&&wasLaunchSupported&&s.jumpLock<=0){s.vy=Math.max(s.vy,z.launch);s.jumpLock=.22;s.grounded=false;s.launches=(s.launches||0)+1;}
 s.vy-=470*dt;s.y+=s.vy*dt;
  // A vertical bank is a physical wall, not a way to snap a wheel up a cliff.
 for(const side of [-1,1]){const axle=wheelPoint(s,side),dx=axle.x-s.x,dy=axle.y-s.y,now=rideSurface(s,s.x+dx),before=rideSurface(s,oldX+dx);if(now-before>30&&oldY+dy-RADIUS<now-15){s.x=oldX;s.vx=0;s.spin+=side*.02;break;}}
 const falling=s.vy;
 const gaps=[-1,1].map(side=>{const axle=wheelPoint(s,side),dx=axle.x-s.x,dy=axle.y-s.y;return s.y+dy-RADIUS-rideSurface(s,s.x+dx);});
 const minimum=Math.min(...gaps),twoWheels=Math.abs(gaps[0]-gaps[1])<=4&&Math.cos(s.angle)>.35;
 // Rolling adhesion only spans tiny gaps on continuous terrain, never jumps or drops.
 const supportedSpan=Math.abs(rideSurface(s,s.x+HALF)-rideSurface(s,s.x-HALF))<32;
 const adhere=wasGrounded&&s.jumpLock<=0&&s.vy<45&&minimum<7&&supportedSpan&&Math.cos(s.angle)>.65;
 s.grounded=minimum<=0||adhere;
 if(s.grounded){
  // Resolve the chassis once, not one wheel after the other. A deep impact
  // must not inject an enormous artificial spin through the first wheel.
  s.y-=minimum;s.vy=0;
  if(twoWheels||(!wasGrounded&&falling<-45&&Math.abs(gaps[0]-gaps[1])<=12&&Math.cos(s.angle)>.35)){s.spin*=.35;}
  else{s.spin+=Math.max(-.08,Math.min(.08,(gaps[0]<gaps[1]?-1:1)*(-minimum)*.012));}
 }

 s.airTime=s.grounded?0:(s.airTime||0)+dt;
 if(s.grounded&&!wasGrounded&&falling<-45){s.landings++;s.impact=Math.min(1,Math.abs(falling)/330);}
 if(s.grounded){s.angle=Math.atan2(Math.sin(s.angle),Math.cos(s.angle));const slope=Math.atan2(rideSurface(s,s.x+HALF)-rideSurface(s,s.x-HALF),HALF*2);s.vx=Math.max(0,s.vx-Math.sin(slope)*65*dt);
  const target=slope+lean*.48,delta=Math.atan2(Math.sin(target-s.angle),Math.cos(target-s.angle)),loads=axleLoads(s,lean),nearBoth=Math.abs(gaps[0]-gaps[1])<=8||(!lean&&supportedSpan&&Math.abs(delta)<.32);
  s.axleLoad=loads;
  if(nearBoth){s.pivotWheel=null;s.spin+=delta*settings.assist*1.5*dt;if(!lean&&supportedSpan&&s.jumpLock<=0){s.angle+=Math.max(-.06,Math.min(.06,delta*(1-Math.exp(-9*dt))));s.spin*=Math.exp(-8*dt);}}
  else{const pivot=loads.rear>loads.front?-1:1;s.pivotWheel=pivot===-1?'rear':'front';s.spin+=pivot*Math.cos(s.angle)*2.5*dt;s.spin*=Math.exp(-.5*dt);s.x+=pivot*HALF*(Math.cos(oldAngle)-Math.cos(s.angle));}
  // Re-project after pitch correction: both tyres follow the same visible trail.
  s.y=Math.max(...[-1,1].map(side=>{const axle=wheelPoint(s,side),dx=axle.x-s.x,dy=axle.y-s.y;return rideSurface(s,s.x+dx)+RADIUS-dy;}));s.groundSlope=slope;
 }

 if(!s.grounded){s.axleLoad={rear:0,front:0};s.pivotWheel=null;}
 stepSuspension(s,dt,{contacts:wheelContacts(s,5),loads:s.axleLoad||{rear:.5,front:.5},landingSpeed:s.grounded&&!wasGrounded?Math.max(0,-falling):0,roughness:(s.groundSlope-(s.suspensionSlope??s.groundSlope))*s.vx*.2});s.suspensionSlope=s.groundSlope;
 // Vehicle contacts produce a physical bump. Only the rider touching solid
 // ground (including the solid rock face) ends the run.
 const lanes=occupiedLanes(s);
 const movingProtected=PROTECTED.map(o=>({...protectedAt(o,s.time),previousX:protectedAt(o,s.time-dt).x}));
 for(const o of movingProtected.filter(o=>lanes.includes(o.lane)&&Math.abs(s.x-o.x)<110))for(const shape of protectedPolygons(o)){const poly=laneContactPolygon(s,shape,o.lane);if(vehicleShapes(s).wheels.some(w=>circleContact(w,poly))||vehicleShapes(s).frame.some(p=>capsuleTouches(p,poly))||riderTouches(s,poly))crash(s,o.kind==='flower'?'Flor protegida · salta sin pisarla':'Cuida la fauna · deja libre su camino');}
 if(s.status!=='riding')return s;
 const nearby=obstacles.filter(o=>lanes.includes(o.lane)&&Math.abs(s.x-o.x)<100+(o.w||16));
 const solids=nearby.map(o=>({o,poly:laneContactPolygon(s,rockPolygon(o,terrain(o.x,o.lane)),o.lane)}));
 for(const h of hazards(s.difficulty).filter(h=>h.kind==='cactus'&&lanes.includes(h.lane)&&s.x>h.x-90&&s.x<h.end+90))for(const shape of cactusPolygons(h,terrain))solids.push({o:h,poly:laneContactPolygon(s,shape,h.lane)});
 for(const {o,poly} of solids){
  let touched=false;if(o.kind==='cactus'&&(vehicleShapes(s).wheels.some(w=>circleContact(w,poly))||vehicleShapes(s).frame.some(part=>capsuleTouches(part,poly))||riderTouches(s,poly))){crash(s,'¡Cactus! Cambia de pista o salta antes');return s;}
  for(const wheel of vehicleShapes(s).wheels){const hit=circleContact(wheel,poly);if(!hit)continue;touched=true;s.x+=hit.nx*(hit.depth+.04);s.y+=hit.ny*(hit.depth+.04);const normalSpeed=s.vx*hit.nx+s.vy*hit.ny;if(normalSpeed<0){s.vx-=normalSpeed*hit.nx;s.vy-=normalSpeed*hit.ny;}
   if(o.kind!=='wall'&&s.time-s.lastBumpTime>.16){s.vy=Math.max(s.vy,Math.min(155,35+s.vx*.40));s.spin=Math.max(-2.2,Math.min(2.2,s.spin+wheel.side*.45));s.grounded=false;}
  }
  if(!touched&&vehicleShapes(s).frame.some(part=>capsuleTouches(part,poly))){touched=true;if(o.kind!=='wall'){s.vy=Math.max(s.vy,95);s.vx*=.72;s.spin+=.25;}else{s.x=Math.min(s.x,o.x-(o.w||16)/2-30);s.vx=0;}}
  if(touched&&s.time-s.lastBumpTime>.16){s.bumps++;s.lastBumpTime=s.time;s.impact=.55;s.message=o.kind==='wall'?'Paso cerrado · cambia de pista':'¡Bote! Acomoda la bici';}
  if(riderTouches(s,poly)){crash(s,'Tropi tocó el terreno con el cuerpo');return s;}
 }
 s.vx=Math.max(0,Math.min(cap,s.vx));
 if(riderTouchesGround(s,x=>rideSurface(s,x))){crash(s,'¡Caída! Tropi tocó el suelo con la cabeza o el cuerpo');return s;}
 if(s.transition?.t===LANE_TIME){s.lane=s.transition.to;s.depth=s.lane;s.transition=null;}
 if(s.status==='riding'){
  s.collected??=new Set();for(const c of COLLECTIBLES.filter(c=>c.lane===s.lane&&!s.transition&&!s.collected.has(c.id)&&Math.abs(c.x-s.x)<65)){const y=terrain(c.x)+c.h,poly=Array.from({length:8},(_,i)=>({x:c.x+Math.cos(i*Math.PI/4)*8,y:y+Math.sin(i*Math.PI/4)*8})),shape=vehicleShapes(s);if(shape.wheels.some(w=>circleContact(w,poly))||shape.frame.some(p=>capsuleTouches(p,poly))||riderTouches(s,poly)){s.collected.add(c.id);s.pickups=(s.pickups||0)+1;addTrick(s,25,'Rayo');}}
  if(s.laneRequest&&hasLaneSupport(s)){const dir=s.laneRequest.dir;s.laneRequest=null;changeLane(s,dir);}
  const rock=rockSupports(s),contacts=wheelContacts(s).map((v,i)=>v||rock[i]);
  const raisedGap=Math.max(...vehicleShapes(s).wheels.map(w=>w.y-RADIUS-rideSurface(s,w.x)));const balanced=contacts[0]!==contacts[1]&&raisedGap>9&&s.vx>25&&Math.abs(s.angle)>.18;
  const balanceKind=contacts[0]?'Manual':'Rueda delantera';
  if(balanced){if(s.balanceKind!==balanceKind){s.balanceTime=0;s.manualEarned=0;s.balanceKind=balanceKind;}s.balanceTime=(s.balanceTime||0)+dt;const earned=Math.floor(s.balanceTime*(contacts[0]?40:45)),delta=earned-(s.manualEarned||0);if(s.balanceTime>=.25&&delta>0){addTrick(s,delta,balanceKind);s.manualEarned=earned;s.trickLabel=`${balanceKind} · ${s.balanceTime.toFixed(1).replace('.',',')} s · +${earned}`;}s.longestManual=Math.max(s.longestManual||0,s.balanceTime);}else{s.balanceTime=0;s.manualEarned=0;s.balanceKind=null;}
  if(!s.grounded&&!s.airTrick)s.airTrick={x:oldX,angle:s.angle,bumps:s.bumps,cleared:new Set()};
  if(s.airTrick){const a=s.airTrick;a.protectedCleared??=new Set();a.passed??=new Map();
   for(const o of [...obstacles,...movingProtected,...hazards(s.difficulty).filter(o=>o.kind==='cactus')]){
    const center=o.end?(o.x+o.end)/2:o.x,previousCenter=o.previousX??center;
    if(!s.transition&&o.lane===s.lane&&a.x<previousCenter&&oldX<=previousCenter&&s.x>center){
     const t=(previousCenter-oldX)/((s.x-oldX)-(center-previousCenter)),y=oldY+(s.y-oldY)*t,angle=oldAngle+Math.atan2(Math.sin(s.angle-oldAngle),Math.cos(s.angle-oldAngle))*t;
     if(y-RADIUS-Math.abs(Math.sin(angle))*HALF>terrain(center)+(o.h||0))a.passed.set(o.originX??o.x,{o,lane:s.lane,right:o.end??o.x+(o.w||16)/2});
    }
   }
   for(const [key,p]of a.passed){const right=p.o.protected?protectedAt({...p.o,x:p.o.originX,posed:false},s.time).x+(p.o.w||16)/2:p.right;if(p.lane===s.lane&&!s.transition&&s.x>right+HALF+RADIUS){a.cleared.add(key);if(p.o.protected||PROTECTED.includes(p.o))a.protectedCleared.add(key);a.passed.delete(key);}}

   if(s.grounded){const flips=Math.floor((Math.abs(a.rotation||0)+.1)/(Math.PI*2));if(flips)addTrick(s,flips*150,'Voltereta');if(a.bumps===s.bumps){const regular=a.cleared.size-a.protectedCleared.size;if(regular)addTrick(s,regular*75,'Salto limpio');if(a.protectedCleared.size)addTrick(s,a.protectedCleared.size*125,'¡Esquive! Vida protegida');}s.airTrick=null;}
  }
 }
 while(s.status==='riding'&&s.stage<STAGES.length-1&&s.x>=STAGES[s.stage].end){s.stage++;s.checkpointScore=s.score;s.checkpointTime=s.time;s.checkpointSerial++;s.controlHint=`${stageLabel(STAGES[s.stage])} · checkpoint guardado`;s.hintUntil=s.time+3;s.message=s.controlHint;}
 if(s.x>=FINISH&&s.status==='riding'){s.status='finished';s.message='¡Completaste los tres niveles!';}

 return s;
}
