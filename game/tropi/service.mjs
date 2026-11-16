import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {RULESET,replayStage} from './ranking/replay.mjs';
import {STAGES} from './bike-course.mjs';
const LIFE=7*24*60*60*1000;
export function normalizeName(value){if(typeof value!=='string')throw Error('Escribe un nombre.');const name=value.normalize('NFKC').trim().replace(/\s+/g,' ');if([...name].length<2||[...name].length>20||!/^\p{L}[\p{L}\p{M}\p{N} _.-]*$/u.test(name))throw Error('Usa entre 2 y 20 letras o números, comenzando por una letra.');return name;}
export function createRankingService({secret,store,now=Date.now,uuid=randomUUID,verify=replayStage}){
 if(!secret||!store)throw Error('Ranking sin configurar.');
 const mac=text=>createHmac('sha256',secret).update(text).digest('base64url');
 function sign(data){const text=Buffer.from(JSON.stringify(data)).toString('base64url');return text+'.'+mac(text);}
 function open(token){if(typeof token!=='string'||token.length>2000)throw Error('Partida inválida.');const [text,sig,...extra]=token.split('.');if(!text||!sig||extra.length)throw Error('Partida inválida.');const a=Buffer.from(sig),b=Buffer.from(mac(text));if(a.length!==b.length||!timingSafeEqual(a,b))throw Error('Partida inválida.');let data;try{data=JSON.parse(Buffer.from(text,'base64url').toString());}catch{throw Error('Partida inválida.');}if(data.rules!==RULESET||!Number.isSafeInteger(data.expires)||data.expires<now()||data.expires>now()+LIFE+60000||!Number.isInteger(data.stage)||data.stage<0||data.stage>STAGES.length||!Number.isSafeInteger(data.score)||data.score<0||!/^[-a-f0-9]{36}$/.test(data.id))throw Error('Esta partida ya no es válida para el ranking.');return data;}
 const result=d=>({token:sign(d),stage:d.stage,score:d.score,id:d.id});
 return {
  async list(){return {entries:await store.list(20)};},
  start(){return result({id:uuid(),rules:RULESET,stage:0,score:0,expires:now()+LIFE});},
  advance(token,proof){const d=open(token);if(d.stage>=STAGES.length)throw Error('El recorrido ya está completo.');const next=verify(d.stage,d.score,proof);return result({...d,stage:next.stage,score:next.score});},
  async submit(token,name){const d=open(token);if(d.stage!==STAGES.length)throw Error(`Completa las ${STAGES.length} etapas para registrar tu puntuación.`);const entry=await store.save({run_id:d.id,name:normalizeName(name),score:d.score,completed_at:new Date(now()).toISOString()});return {entry,entries:await store.list(20)};}
 };
}
