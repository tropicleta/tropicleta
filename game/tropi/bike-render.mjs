// Rendering only: fixed-step collision and score state are never interpolated.
export function snapshotPose(s){return {x:s.x,y:s.y,angle:s.angle,depth:s.depth,wheelTravel:[...(s.wheelTravel||[0,0])],rear:s.suspension?.rear?.compression||0,front:s.suspension?.front?.compression||0};}
export function interpolatePose(s,previous,alpha){
 if(!previous||s.status!=='riding')return s;
 const t=Math.max(0,Math.min(1,alpha)),mix=(a,b)=>a+(b-a)*t;
 return {...s,x:mix(previous.x,s.x),y:mix(previous.y,s.y),angle:previous.angle+Math.atan2(Math.sin(s.angle-previous.angle),Math.cos(s.angle-previous.angle))*t,depth:mix(previous.depth,s.depth),wheelTravel:[0,1].map(i=>mix(previous.wheelTravel[i],s.wheelTravel?.[i]||0)),suspension:{rear:{compression:mix(previous.rear,s.suspension?.rear?.compression||0)},front:{compression:mix(previous.front,s.suspension?.front?.compression||0)}}};
}
