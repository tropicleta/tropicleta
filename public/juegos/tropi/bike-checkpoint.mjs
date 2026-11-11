// Per-tab progress only: no account, network request or mid-air restore.
const KEY='tropi-checkpoint-v2';
export function createCheckpointStore(getStorage=()=>globalThis.sessionStorage,stageCount=15){
 return {
  load(){try{const storage=getStorage(),current=storage.getItem(KEY),legacy=!current,data=JSON.parse(current||storage.getItem('tropi-checkpoint-v1')||'null');return (data?.version===2||legacy&&data?.version===1&&data.stage<5)&&Number.isInteger(data.stage)&&data.stage>0&&data.stage<stageCount&&Number.isSafeInteger(data.score)&&data.score>=0&&data.score<=1e9?{stage:data.stage,score:data.score}:null;}catch{return null;}},
  save(stage,score){if(!Number.isInteger(stage)||stage<=0||stage>=stageCount||!Number.isSafeInteger(score)||score<0||score>1e9)return;try{getStorage().setItem(KEY,JSON.stringify({version:2,stage,score}));}catch{}},
  clear(){try{getStorage().removeItem(KEY);getStorage().removeItem('tropi-checkpoint-v1');}catch{}}
 };
}
