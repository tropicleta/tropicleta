import {chassisPoint,suspensionPose} from './bike-suspension.mjs';
import {BASE_BIKE} from './bike-spec.mjs';
// Shared, visible collision geometry, in bicycle-local coordinates (Y up).
export const ROCK_SHAPE=[[-.5,0],[-.44,.65],[-.15,1],[.35,.9],[.5,.3],[.5,0]];
export const FRAME_SEGMENTS=[[-29,0,-12,22],[-12,22,3,1],[3,1,-29,0],[-12,22,16,25],[16,25,3,1],[16,25,29,0],[-12,22,-14,29],[-20,29,-8,29],[16,25,15,32],[15,32,...BASE_BIKE.grip]];
export function wheelPoint(s,side){return worldPoint(s,side*BASE_BIKE.half,-(s.wheelTravel?.[side<0?0:1]||0));}
export function worldPoint(s,x,y){const c=Math.cos(s.angle),n=Math.sin(s.angle);return {x:s.x+x*c-y*n,y:s.y+x*n+y*c};}
export function frameSegments(s={}){const axles=suspensionPose(s).axles;return FRAME_SEGMENTS.map(segment=>{const p=[];for(let i=0;i<4;i+=2){const x=segment[i],y=segment[i+1];p.push(...(y===0&&Math.abs(x)===BASE_BIKE.half?axles[x<0?0:1]:[x,y]));}return p;});}
export function riderPoint(s,x,y){const p=chassisPoint(s,x,y);return worldPoint(s,p.x,p.y);}
export function vehicleShapes(s){const p=suspensionPose(s),c=Math.cos(p.pitch),n=Math.sin(p.pitch),point=(x,y)=>worldPoint(s,x*c-y*n,p.heave+x*n+y*c);return {wheels:[-1,1].map(side=>({...wheelPoint(s,side),r:BASE_BIKE.radius,side})),frame:frameSegments(s).map(([ax,ay,bx,by])=>({a:point(ax,ay),b:point(bx,by),r:2})),rider:[{a:point(2,59),b:point(2,59),r:12},{a:point(-18,32),b:point(-10,43),r:4},{a:point(-10,43),b:point(-3,48),r:4},{a:point(-13,33),b:point(-6,43),r:7}]};}
export function rockPolygon(o,base){const w=o.w||16;return (o.kind==='wall'?[[-.5,0],[-.5,1],[.5,1],[.5,0]]:ROCK_SHAPE).map(([x,y])=>({x:o.x+x*w,y:base+y*o.h}));}
const sq=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
export function closest(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return {x:a.x+t*dx,y:a.y+t*dy};}
export function inside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
function edgeNormal(a,b){const length=Math.hypot(b.x-a.x,b.y-a.y)||1;return {x:-(b.y-a.y)/length,y:(b.x-a.x)/length};}
export function circleContact(p,poly){let best=Infinity,q,normal;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],point=closest(p,a,b),d=sq(p,point);if(d<best){best=d;q=point;normal=edgeNormal(a,b);}}const inner=inside(p,poly),d=Math.sqrt(best);if(!inner&&d>=p.r-.02)return null;return {nx:inner||d<1e-8?normal.x:(p.x-q.x)/d,ny:inner||d<1e-8?normal.y:(p.y-q.y)/d,depth:inner?p.r+d:p.r-d};}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function intersects(a,b,c,d){const x=cross(a,b,c),y=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);return x*y<=0&&u*v<=0&&Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))+1e-8&&Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))<=Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))+1e-8;}
export function capsuleTouches(s,poly){if(inside(s.a,poly)||inside(s.b,poly))return true;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(intersects(s.a,s.b,a,b)||sq(s.a,closest(s.a,a,b))<s.r*s.r||sq(s.b,closest(s.b,a,b))<s.r*s.r||sq(a,closest(a,s.a,s.b))<s.r*s.r||sq(b,closest(b,s.a,s.b))<s.r*s.r)return true;}return false;}
export function vehicleTouches(s,poly){const shape=vehicleShapes(s);return shape.wheels.some(w=>circleContact(w,poly))||shape.frame.some(part=>capsuleTouches(part,poly));}
export function riderTouches(s,poly){return vehicleShapes(s).rider.some(part=>capsuleTouches(part,poly));}
export function riderTouchesGround(s,height){for(const part of vehicleShapes(s).rider)for(let i=0;i<=4;i++){const t=i/4,x=part.a.x+(part.b.x-part.a.x)*t,y=part.a.y+(part.b.y-part.a.y)*t;for(let j=0;j<8;j++){const a=j*Math.PI/4,px=x+Math.cos(a)*part.r,py=y+Math.sin(a)*part.r;if(py<=height(px)+.3)return true;}}return false;}
