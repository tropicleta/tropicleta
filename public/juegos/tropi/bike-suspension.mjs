import {BASE_BIKE} from './bike-spec.mjs';
export const SUSPENSION_TRAVEL=7;
export function suspensionPose(s={}){const front=s.suspension?.front?.compression||0,rear=s.suspension?.rear?.compression||0,heave=-(front+rear)/2,pitch=Math.atan2(rear-front,BASE_BIKE.half*2),c=Math.cos(pitch),n=Math.sin(pitch);return {front,rear,heave,pitch,axles:[-1,1].map(side=>{const x=side*BASE_BIKE.half;const y=-(s.wheelTravel?.[side<0?0:1]||0);return [x*c+(y-heave)*n,-x*n+(y-heave)*c];})};}
export function chassisPoint(s,x,y){const p=suspensionPose(s),c=Math.cos(p.pitch),n=Math.sin(p.pitch);return {x:x*c-y*n,y:p.heave+x*n+y*c};}
// Sprung chassis with independent damped travel; wheel contacts remain at the tyres.
export function stepSuspension(s,dt,{contacts=[false,false],loads={rear:.5,front:.5},landingSpeed=0,roughness=0}={}){
 s.suspension??={front:{compression:0,velocity:0},rear:{compression:0,velocity:0},bumps:s.bumps||0};const q=s.suspension,bump=(s.bumps||0)>q.bumps;q.bumps=s.bumps||0;
 for(const [i,key]of ['rear','front'].entries()){const leg=q[key],supported=contacts[i],load=loads[key]||0,target=supported?.75+load*2.6+Math.min(3,Math.abs(roughness)*load):0;if(supported&&landingSpeed>0)leg.velocity+=Math.min(75,landingSpeed*.16)*Math.max(.2,load);if(supported&&bump)leg.velocity+=15*load;const force=120*(target-leg.compression)-17*leg.velocity;leg.velocity+=force*dt;leg.compression+=leg.velocity*dt;if(leg.compression<0){leg.compression=0;leg.velocity=Math.max(0,leg.velocity);}if(leg.compression>SUSPENSION_TRAVEL){leg.compression=SUSPENSION_TRAVEL;leg.velocity=Math.min(0,leg.velocity);}}
 // Damper reaction absorbs pitch chatter on a loaded chassis, not deliberate air rotation.
 if(contacts[0]&&contacts[1]){const absorbing=Math.max(0,q.front.velocity)+Math.max(0,q.rear.velocity);s.spin*=Math.exp(-Math.min(2,absorbing*.06)*dt);}
 return q;
}

// Small independent axle extension follows shallow terrain ripples, never real gaps.
export function stepWheelTravel(s,dt,height,lean=0){
 s.wheelTravel??=[0,0];const c=Math.cos(s.angle),n=Math.sin(s.angle),slope=s.groundSlope||0,neutral=!lean&&Math.abs(s.angle-slope)<.28,following=(s.grounded||(s.airTime||0)<.08)&&s.jumpLock<=0&&s.vy<40;
 const gaps=[-1,1].map(side=>{const x=s.x+side*BASE_BIKE.half*c;return s.y+side*BASE_BIKE.half*n-BASE_BIKE.radius-height(x);}),minimum=Math.min(...gaps);
 for(let i=0;i<2;i++){const relative=gaps[i]-minimum,target=following&&neutral&&gaps[i]>=-1&&gaps[i]<=14&&relative<=8?Math.max(0,Math.min(6,relative)):0;s.wheelTravel[i]+=(target-s.wheelTravel[i])*(1-Math.exp(-(following?24:14)*dt));}
}
