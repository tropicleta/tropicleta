import {STAGES,STAGES_PER_LEVEL} from '../bike-course.mjs';
import {createRecorder,RULESET} from './replay.mjs';
const KEY='tropi-ranked-run-v1';
export function createRankingClient({fetchImpl=fetch,storage=()=>sessionStorage,onChange=()=>{}}={}){
 let run=null,recorder=null;
 const read=()=>{try{return JSON.parse(storage().getItem(KEY)||'null');}catch{return null;}};
 function persist(value){try{if(value)storage().setItem(KEY,JSON.stringify({...value,rules:RULESET}));else storage().removeItem(KEY);}catch{}}
 async function request(body){const res=await fetchImpl('/api/tropi/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const data=await res.json();if(!res.ok)throw Error(data.error||'No pudimos conectar con el ranking.');return data;}
 async function sync(r){
  if(r.busy)return r.busy;
  r.busy=Promise.resolve().then(async()=>{try{r.error='';if(!r.verified){r.verified=await request({action:'start'});if(run===r)persist(r.verified);}
    while(r.proofs.length){const proof=r.proofs[0];const next=await request({action:'stage',token:r.verified.token,proof:proof.proof});if(next.stage!==proof.stage+STAGES_PER_LEVEL||next.score!==proof.score)throw Error('El resultado no coincide con el recorrido comprobado.');r.verified=next;r.proofs.shift();if(run===r)persist(r.verified);}
   }catch(error){r.error=error.message||'No pudimos conectar con el ranking.';throw error;}finally{r.busy=null;if(run===r)onChange();}});
  return r.busy;
 }
 const quiet=r=>{sync(r).catch(()=>{});};
 return {
  reset(stage,score,serial,retry=false){
   if(retry&&run&&recorder){recorder.retry(serial);onChange();return;}
   if(stage===0&&score===0){run={expectedStage:0,expectedScore:0,verified:null,proofs:[],busy:null,error:''};persist(null);quiet(run);}
   else if(!run||run.expectedStage!==stage||run.expectedScore!==score){const saved=read();run=saved?.rules===RULESET&&saved.stage===stage&&saved.score===score?{expectedStage:stage,expectedScore:score,verified:saved,proofs:[],busy:null,error:''}:null;if(!run)persist(null);}
   recorder=run?createRecorder(serial):null;onChange();
  },
  step(input){if(recorder)try{recorder.step(input);}catch(error){recorder=null;if(run)run.error=error.message;run=null;onChange();}},
  lane(dir){recorder?.lane(dir);},clear(serial){recorder?.clear(serial);},
  complete(score){if(!run||!recorder)return;run.proofs.push({stage:run.expectedStage,score,proof:recorder.proof()});run.expectedStage+=STAGES_PER_LEVEL;run.expectedScore=score;recorder=null;quiet(run);onChange();},
  get eligible(){return !!run;},get error(){return run?.error||'';},get validating(){return !!run&&(!!run.busy||!!run.proofs.length);},
  async submit(name){if(!run||run.expectedStage!==STAGES.length)throw Error('Para entrar al ranking, juega el recorrido completo desde el inicio.');const selected=run;await sync(selected);if(run!==selected)throw Error('La partida cambió. Termina el recorrido actual para registrar sus puntos.');if(selected.proofs.length||selected.verified?.stage!==STAGES.length)throw Error('Todavía falta comprobar el recorrido. Vuelve a intentarlo.');return request({action:'submit',token:selected.verified.token,name});},
  async list(){const res=await fetchImpl('/api/tropi/',{signal:AbortSignal.timeout(15000)});const data=await res.json();if(!res.ok)throw Error(data.error||'Ranking no disponible.');return data.entries;}
 };
}
