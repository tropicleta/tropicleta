// Distances use ten world units per metre. Five regions, five original 500 metre sections per level.
export const STAGE_LENGTH=5000, STAGES_PER_LEVEL=5;
export const LEVELS=[
 {id:1,name:'Copiapó',theme:'city',stages:Array.from({length:5},(_,i)=>'Copiapó · '+(i+1))},
 {id:2,name:'Desierto florido',theme:'desert',stages:Array.from({length:5},(_,i)=>'Desierto florido · '+(i+1))},
 {id:3,name:'Caldera',theme:'coast',stages:Array.from({length:5},(_,i)=>'Caldera · '+(i+1))},
 {id:4,name:'Noche',theme:'night',stages:Array.from({length:5},(_,i)=>'Noche · '+(i+1))},
 {id:5,name:'Viñita Azul',theme:'vinita',stages:Array.from({length:5},(_,i)=>'Viñita Azul · '+(i+1))}
];
export const STAGES=LEVELS.flatMap((level,l)=>level.stages.map((name,j)=>({start:(l*STAGES_PER_LEVEL+j)*STAGE_LENGTH,end:(l*STAGES_PER_LEVEL+j+1)*STAGE_LENGTH,name,level:level.id,levelName:level.name,number:j+1,theme:level.theme,pace:.78+l*.12+j*.018,bloom:level.theme==='desert'?1:0})));
export const FINISH=STAGES.length*STAGE_LENGTH;
export const stageAt=x=>STAGES[Math.max(0,Math.min(STAGES.length-1,Math.floor(x/STAGE_LENGTH)))];
export const stageLabel=stage=>`${stage.levelName}`;
export const SECTIONS=STAGES.map(s=>({x:s.start,name:s.name}));
export const obstacles=[],RAMPS=[],FAUNA_ZONES=[],PROTECTED=[],STUNT_ZONES=[],SPEED_ZONES=[],FLOW_SECTIONS=[],COLLECTIBLES=[],HILLS=[],normalHazards=[],hardHazards=[];
for(const [i,s]of STAGES.entries()){
 const b=i*5000,flip=i%2,level=s.theme==='desert'?1:s.theme==='coast'?2:3,shift=[0,80,-60,100,-40][i%5],lane=n=>n^flip;
 if(s.theme==='vinita'){
  for(const [dx,l,h]of [[560,0,21],[940,1,24],[2370,0,26],[2220,1,24],[3320,0,28],[3500,1,25],[4660,0,28]])obstacles.push({x:b+dx,lane:lane(l),h});
  normalHazards.push({kind:'cactus',x:b+3332,end:b+3362,lane:lane(0),h:34},{kind:'cactus',x:b+4672,end:b+4702,lane:lane(0),h:35});
  for(const [j,start]of [1100,2500,3700].entries()){
   const lip=start+200,landing=lip+310,end=landing+150;
   STUNT_ZONES.push({start:b+start,lip:b+lip,landing:b+landing,end:b+end,h:125+j*12,launch:315+j*10,name:'Rampa de madera',material:'wood'});
   for(const l of [0,1])normalHazards.push({kind:'pit',x:b+lip+16,end:b+landing-25,lane:l});
   SPEED_ZONES.push({start:b+start-350,end:b+start-120,lane:lane(j%2),kind:'boost'},{start:b+start-370,end:b+start-140,lane:lane(1-j%2),kind:'sand'});
   COLLECTIBLES.push({id:'vinita-'+i+'-'+j,x:b+lip+80,lane:lane(j%2),h:150});
  }
  continue;
 }
 if(s.theme==='city'){
  SPEED_ZONES.push({start:b+340,end:b+650,lane:lane(0),kind:'boost'},{start:b+2950,end:b+3220,lane:lane(1),kind:'boost'});
  if(s.theme==='city')normalHazards.push({kind:'pothole',x:b+3160,end:b+3270,lane:0,depth:18});
  // Encounters are separated and always leave the other lane available.
  for(const [dx,l,kind]of (s.theme==='city'?[[820,0,'pedestrian'],[1180,1,'cyclist'],[2750,1,'pedestrian'],[3500,0,'cyclist'],[4260,1,'pedestrian']]:[[820,1,'cyclist'],[4260,0,'cyclist']]))PROTECTED.push({x:b+dx,lane:lane(l),kind,w:kind==='cyclist'?58:24,h:kind==='cyclist'?62:65,range:kind==='cyclist'?65:18,direction:lane(l)===1?1:-1,speed:18,trafficStart:b,trafficEnd:b+5000});
  STUNT_ZONES.push({start:b+1450+shift,lip:b+1590+shift,landing:b+2010+shift,end:b+2180+shift,h:110,launch:285,name:'Puente de la ciclovía'});
  RAMPS.push({x:b+1010,crest:b+1110,end:b+1210,h:18});
  const f={x:b+4750,lane:0};RAMPS.push({x:f.x-180,crest:f.x-60,end:f.x+100,h:18});
  for(const [g,anchor]of [{x:b+1140,lane:0},f].entries())for(const [j,[dx,h]]of [[-30,100],[45,125],[120,105]].entries())COLLECTIBLES.push({id:`ray-${i}-${g}-${j}`,x:anchor.x+dx,lane:anchor.lane,h});
  if(s.theme==='vinita'){HILLS.push([b+350,b+1080,32],[b+2380,b+2600,20],[b+3270,b+3650,22]);obstacles.push({x:b+2720,lane:0,h:18},{x:b+3500,lane:1,h:20});}
  continue;
 }
 obstacles.push({x:b+830,lane:lane(0),h:15+level},{x:b+1270+shift,lane:lane(1),h:16+level},{x:b+2720,lane:lane(1),h:17+level},{x:b+3500,lane:lane(0),w:70,h:210,kind:'wall'});
 if(level>1)obstacles.push({x:b+3000,lane:lane(1),h:17+level});
 if(level===3)obstacles.push({x:b+3900,lane:lane(0),h:20});
 normalHazards.push({kind:'cactus',x:b+2280+shift,end:b+2310+shift,lane:lane(1),h:30+level},{kind:'pit',x:b+3730,end:b+3840,lane:lane(0)});
 hardHazards.push({kind:'cactus',x:b+3100,end:b+3135,lane:lane(0),h:32});
 const species=s.theme==='coast'?'dog':(i%3===1?'llama':'fox');
 const z={start:b+4050,end:b+4450,lane:lane(1),kind:species,animalX:b+4250,w:species==='seabird'?58:species==='dog'?54:species==='llama'?44:46,h:species==='seabird'?48:species==='llama'?72:33};FAUNA_ZONES.push(z);
 if(s.theme==='coast'){const bird={start:b+2820,end:b+3060,lane:lane(1),kind:'seabird',animalX:b+2940,w:58,h:48};FAUNA_ZONES.push(bird);PROTECTED.push({x:bird.animalX,lane:bird.lane,kind:bird.kind,w:bird.w,h:bird.h});}else PROTECTED.push({x:b+2940,lane:lane(1),kind:'flower',w:22,h:25});PROTECTED.push({x:z.animalX,lane:z.lane,kind:z.kind,w:z.w,h:z.h});
 RAMPS.push({x:b+1010,crest:b+1110,end:b+1210,h:32});
 STUNT_ZONES.push({start:b+1450+shift,lip:b+1590+shift,landing:b+2010+shift,end:b+2180+shift,h:110,launch:285,name:`Vuelo · ${s.name}`});
 SPEED_ZONES.push({start:b+550,end:b+780,lane:lane(0),kind:'boost'},{start:b+550,end:b+1050,lane:lane(1),kind:'sand'},{start:b+3050,end:b+3300,lane:lane(0),kind:'boost'},{start:b+3050,end:b+3400,lane:lane(1),kind:'sand'});
 const f={x:b+4750,lane:lane(0)};FLOW_SECTIONS.push(f);RAMPS.push({x:f.x-180,crest:f.x-60,end:f.x+100,h:18});SPEED_ZONES.push({start:f.x-260,end:f.x-80,lane:f.lane,kind:'boost'},{start:f.x-220,end:f.x+100,lane:1-f.lane,kind:'sand'});
 for(const [g,anchor]of [{x:b+1140,lane:lane(0)},f].entries())for(const [j,[dx,h]]of [[-30,100],[45,125],[120,105]].entries())COLLECTIBLES.push({id:`ray-${i}-${g}-${j}`,x:anchor.x+dx,lane:anchor.lane,h});
 HILLS.push([b+350,b+1080,44],[b+1200,b+1420+shift,14],[b+2380+shift,b+2600,22],[b+2820,b+3100,20],[b+3270,b+3650,22]);
}
// Original 500 metre layouts: no compacting between checkpoints.
const descentStart=STAGES.find(s=>s.theme==='vinita').start;
export const downhillAt=x=>x<=descentStart?0:-.08*(Math.min(FINISH,x)-descentStart);
const EMPTY={hills:[],ramps:[],stunts:[],obstacles:[],protectedObjects:[],collectibles:[],speedZones:[],faunaZones:[],normal:[],hard:[]};
const groups=STAGES.map(s=>({hills:HILLS.filter(o=>o[0]>=s.start&&o[0]<s.end),ramps:RAMPS.filter(o=>o.x>=s.start&&o.x<s.end),stunts:STUNT_ZONES.filter(o=>o.start>=s.start&&o.start<s.end),obstacles:obstacles.filter(o=>o.x>=s.start&&o.x<s.end),protectedObjects:PROTECTED.filter(o=>o.x>=s.start&&o.x<s.end),collectibles:COLLECTIBLES.filter(o=>o.x>=s.start&&o.x<s.end),speedZones:SPEED_ZONES.filter(o=>o.start>=s.start&&o.start<s.end),faunaZones:FAUNA_ZONES.filter(o=>o.start>=s.start&&o.start<s.end),normal:normalHazards.filter(o=>o.x>=s.start&&o.x<s.end),hard:[...normalHazards,...hardHazards].filter(o=>o.x>=s.start&&o.x<s.end)}));
const windows=groups.map((_,i)=>Object.fromEntries(Object.keys(EMPTY).map(key=>[key,groups.slice(Math.max(0,i-1),i+2).flatMap(g=>g[key])])));
export const featuresAt=x=>groups[Math.floor(x/STAGE_LENGTH)]||EMPTY;
export const featuresNear=x=>windows[Math.max(0,Math.min(STAGES.length-1,Math.floor(x/STAGE_LENGTH)))]||EMPTY;
const challengeHazards=[...normalHazards,...hardHazards],noHazards=[];
export function hazardsAt(x,level='normal'){const g=featuresAt(x);return level==='suave'?noHazards:level==='desafio'?g.hard:g.normal;}
export function speedZoneAt(x,lane){return featuresAt(x).speedZones.find(z=>z.lane===lane&&x>=z.start&&x<=z.end);}
export function faunaZoneAt(x,lane){return featuresAt(x).faunaZones.find(z=>z.lane===lane&&x>=z.start&&x<=z.end);}
export function hazards(level='normal'){return level==='suave'?noHazards:level==='desafio'?challengeHazards:normalHazards;}
export function bloomAt(x){const s=stageAt(x),prev=STAGES[Math.max(0,Math.floor(s.start/STAGE_LENGTH)-1)],t=Math.max(0,Math.min(1,(x-s.start)/600));return prev.bloom+(s.bloom-prev.bloom)*t;}
