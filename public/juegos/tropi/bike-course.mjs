// Distances use ten world units per metre. Fifteen authored sections.
export const STAGE_LENGTH=5000, STAGES_PER_LEVEL=5;
export const LEVELS=[
 {id:1,name:'Desierto florido',theme:'desert',stages:['La quebrada','Valle florido','La cantera','Mar de arena','Cumbre en flor']},
 {id:2,name:'Costa de Atacama',theme:'coast',stages:['Camino a Caldera','Dunas de Loreto','Bahía Inglesa','Rocas del Pacífico','Puerto de Caldera']},
 {id:3,name:'Bajo las estrellas',theme:'night',stages:['Sale la luna','Quebrada azul','Flores de medianoche','Cerro de las estrellas','Última luz']}
];
export const STAGES=LEVELS.flatMap((level,l)=>level.stages.map((name,j)=>({start:(l*5+j)*STAGE_LENGTH,end:(l*5+j+1)*STAGE_LENGTH,name,level:level.id,levelName:level.name,number:j+1,theme:level.theme,pace:.82+(l*5+j)*.035,bloom:l===1?0:[.05,1,.2,.85,.65][j]})));
export const FINISH=STAGES.length*STAGE_LENGTH;
export const stageAt=x=>STAGES[Math.max(0,Math.min(STAGES.length-1,Math.floor(x/STAGE_LENGTH)))];
export const stageLabel=stage=>`Nivel ${stage.level}/3 · Etapa ${stage.number}/5`;
export const SECTIONS=STAGES.map(s=>({x:s.start,name:s.name}));
export const obstacles=[],RAMPS=[],FAUNA_ZONES=[],PROTECTED=[],STUNT_ZONES=[],SPEED_ZONES=[],FLOW_SECTIONS=[],COLLECTIBLES=[],HILLS=[],normalHazards=[],hardHazards=[];
for(const [i,s]of STAGES.entries()){
 const b=s.start,flip=i%2,level=s.level,shift=[0,80,-60,100,-40][i%5],lane=n=>n^flip;
 obstacles.push({x:b+830,lane:lane(0),h:15+level},{x:b+1380+shift,lane:lane(1),h:16+level},{x:b+2720,lane:lane(1),h:17+level},{x:b+3500,lane:lane(0),w:70,h:210,kind:'wall'});
 if(level>1)obstacles.push({x:b+3200,lane:lane(1),h:17+level});
 if(level===3)obstacles.push({x:b+3900,lane:lane(0),h:20});
 normalHazards.push({kind:'cactus',x:b+2280+shift,end:b+2310+shift,lane:lane(1),h:30+level},{kind:'pit',x:b+3730,end:b+3840,lane:lane(0)});
 hardHazards.push({kind:'cactus',x:b+3100,end:b+3135,lane:lane(0),h:32});
 const z={start:b+4050,end:b+4450,lane:lane(1),kind:i%3===1?'llama':'fox',animalX:b+4250,w:i%3===1?44:46,h:i%3===1?72:33};FAUNA_ZONES.push(z);
 PROTECTED.push({x:b+2940,lane:lane(1),kind:'flower',w:22,h:25},{x:z.animalX,lane:z.lane,kind:z.kind,w:z.w,h:z.h});
 RAMPS.push({x:b+1010,crest:b+1110,end:b+1210,h:32});
 STUNT_ZONES.push({start:b+1450+shift,lip:b+1590+shift,landing:b+2010+shift,end:b+2180+shift,h:110,launch:285,name:`Vuelo · ${s.name}`});
 SPEED_ZONES.push({start:b+550,end:b+780,lane:lane(0),kind:'boost'},{start:b+550,end:b+1050,lane:lane(1),kind:'sand'},{start:b+3050,end:b+3300,lane:lane(0),kind:'boost'},{start:b+3050,end:b+3400,lane:lane(1),kind:'sand'});
 const f={x:b+4750,lane:lane(0)};FLOW_SECTIONS.push(f);RAMPS.push({x:f.x-180,crest:f.x-60,end:f.x+100,h:18});SPEED_ZONES.push({start:f.x-260,end:f.x-80,lane:f.lane,kind:'boost'},{start:f.x-220,end:f.x+100,lane:1-f.lane,kind:'sand'});
 for(const [g,anchor]of [{x:b+1140,lane:lane(0)},f].entries())for(const [j,[dx,h]]of [[-30,100],[45,125],[120,105]].entries())COLLECTIBLES.push({id:`ray-${i}-${g}-${j}`,x:anchor.x+dx,lane:anchor.lane,h});
 HILLS.push([b+350,b+1080,44],[b+1200,b+1420+shift,14],[b+2380+shift,b+2600,22],[b+2820,b+3100,20],[b+3270,b+3650,22]);
}
export function speedZoneAt(x,lane){return SPEED_ZONES.find(z=>z.lane===lane&&x>=z.start&&x<=z.end);}
export function faunaZoneAt(x,lane){return FAUNA_ZONES.find(z=>z.lane===lane&&x>=z.start&&x<=z.end);}
export function hazards(level='normal'){return level==='suave'?[]:level==='desafio'?[...normalHazards,...hardHazards]:normalHazards;}
export function bloomAt(x){const s=stageAt(x),prev=STAGES[Math.max(0,Math.floor(s.start/STAGE_LENGTH)-1)],t=Math.max(0,Math.min(1,(x-s.start)/600));return prev.bloom+(s.bloom-prev.bloom)*t;}
