import {createBike,stepBike,requestLane,STAGES,STAGES_PER_LEVEL} from '../bike-model.mjs';
export {RULESET} from '../ruleset.mjs';
export const MAX_TICKS=120000;

// Only the controls are recorded. Scores are recomputed with the shared model.
export function createRecorder(serial=0){
 const runs=[],events=[];let ticks=0,lastSerial=serial;
 return {step(input){if(ticks>=MAX_TICKS)throw Error('Esta etapa excede el tiempo del ranking.');const bits=(input.back?1:0)|(input.forward?2:0)|(input.jump?4:0)|(input.jumpSerial!==lastSerial?8:0);lastSerial=input.jumpSerial;const last=runs.at(-1);if(last?.[1]===bits)last[0]++;else runs.push([1,bits]);ticks++;},retry(serial){lastSerial=serial;events.push([ticks,'retry']);},lane(dir){events.push([ticks,'lane',dir]);},clear(serial){lastSerial=serial;events.push([ticks,'clear']);},proof(){return {runs,events:events.filter(e=>e[0]<ticks)};}};
}

export function replayStage(stage,score,proof){
 if(!Number.isInteger(stage)||stage<0||stage>=STAGES.length||stage%STAGES_PER_LEVEL!==0||!Number.isSafeInteger(score)||score<0)throw Error('Partida inválida.');
 if(!Array.isArray(proof?.runs)||proof.runs.length>MAX_TICKS||!Array.isArray(proof.events)||proof.events.length>10000)throw Error('Recorrido inválido.');
 let total=0;for(const r of proof.runs){if(!Array.isArray(r)||r.length!==2||!Number.isInteger(r[0])||r[0]<1||!Number.isInteger(r[1])||r[1]<0||r[1]>15)throw Error('Controles inválidos.');total+=r[0];if(total>MAX_TICKS)throw Error('Recorrido demasiado largo.');}
 if(!total)throw Error('Falta el recorrido.');let previous=-1;
 for(const e of proof.events){if(!Array.isArray(e)||!Number.isInteger(e[0])||e[0]<previous||e[0]<0||e[0]>=total||(!['clear','lane','retry'].includes(e[1]))||(e[1]==='lane'&&(e.length!==3||![-1,1].includes(e[2])))||(e[1]!=='lane'&&e.length!==2))throw Error('Acciones inválidas.');previous=e[0];}
 let s=Object.assign(createBike('normal',stage),{status:'riding',score,checkpointScore:score}),tick=0,event=0,serial=0;
 for(const [count,bits]of proof.runs)for(let i=0;i<count;i++,tick++){
  while(proof.events[event]?.[0]===tick){const e=proof.events[event++];if(e[1]==='retry'){if(s.status!=='crashed')throw Error('Acciones inválidas.');const saved=s.checkpointScore; s=Object.assign(createBike('normal',s.stage),{status:'riding',score:saved,checkpointScore:saved,jumpSerial:serial,scoreMilestone:Math.floor(saved/250)});}else if(e[1]==='lane')requestLane(s,e[2]);else{s.jumpSerial=serial;s.jumpBuffer=0;s.laneRequest=null;}}
  if(s.status!=='riding')throw Error('El recorrido contiene pasos después de su final.');
  if(bits&8)serial++;
  stepBike(s,{gas:true,back:!!(bits&1),forward:!!(bits&2),jump:!!(bits&4),jumpSerial:serial},1/120);
 }
 const expected=stage+STAGES_PER_LEVEL===STAGES.length?'finished':'intermission';
 if(s.status!==expected||s.stage!==(stage+STAGES_PER_LEVEL===STAGES.length?STAGES.length-1:stage+STAGES_PER_LEVEL)||!Number.isSafeInteger(s.score))throw Error('La etapa no se completó.');
 return {stage:stage+STAGES_PER_LEVEL,score:s.score,ticks:total};
}
