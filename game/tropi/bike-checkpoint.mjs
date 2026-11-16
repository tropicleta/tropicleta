// Per-tab progress only: no account, network request or mid-air restore.
import {STAGES} from './bike-course.mjs';
const KEY='tropi-checkpoint-v7';
export function createCheckpointStore(getStorage=()=>globalThis.sessionStorage,stageCount=STAGES.length){
 return {
  load(){try{const storage=getStorage(),current=storage.getItem(KEY),data=JSON.parse(current||storage.getItem('tropi-checkpoint-v6')||storage.getItem('tropi-checkpoint-v5')||storage.getItem('tropi-checkpoint-v4')||storage.getItem('tropi-checkpoint-v3')||storage.getItem('tropi-checkpoint-v2')||storage.getItem('tropi-checkpoint-v1')||'null');if(!Number.isInteger(data?.stage)||data.stage<0||!Number.isSafeInteger(data.score)||data.score<0||data.score>1e9)return null;if(current)return data.version===7&&data.stage>0&&data.stage<stageCount?{stage:data.stage,score:data.score}:null;let stage;if(data.version===6&&data.stage>0&&data.stage<4)stage=data.stage*5;else if(data.version===5&&data.stage>0&&data.stage<15)stage=Math.min(4,Math.floor(data.stage/3))*5;else if(data.version===4&&data.stage>0&&data.stage<5)stage=Math.min(4,data.stage)*5;else if(data.version===3&&data.stage>0&&data.stage<20)stage=Math.floor(data.stage/5)*5;else if(data.stage>0&&data.stage<15&&(data.version===2||(data.version===1&&data.stage<5)))stage=(data.stage===4?0:data.stage<4?1:data.stage<10?2:3)*5;else return null;return stage<stageCount?{stage,score:data.score}:null;}catch{return null;}},
  save(stage,score){if(!Number.isInteger(stage)||stage<=0||stage>=stageCount||!Number.isSafeInteger(score)||score<0||score>1e9)return;try{getStorage().setItem(KEY,JSON.stringify({version:7,stage,score}));}catch{}},
  clear(){try{getStorage().removeItem(KEY);getStorage().removeItem('tropi-checkpoint-v6');getStorage().removeItem('tropi-checkpoint-v5');getStorage().removeItem('tropi-checkpoint-v4');getStorage().removeItem('tropi-checkpoint-v3');getStorage().removeItem('tropi-checkpoint-v2');getStorage().removeItem('tropi-checkpoint-v1');}catch{}}
 };
}
