import test from 'node:test';import assert from 'node:assert/strict';
import {createRecorder,replayStage} from '../game/tropi/ranking/replay.mjs';
import {createBike,stepBike,actorTime,requestLane,terrain,obstacles,hazards,PROTECTED,protectedAt,HALF,RADIUS,STAGES} from '../game/tropi/bike-model.mjs';
import {createRankingService,normalizeName} from '../game/tropi/service.mjs';
import {createRankingClient} from '../game/tropi/ranking/client.mjs';

const secret='test-secret-only-not-a-production-key-12345',id='00000000-0000-4000-8000-000000000001';
function memoryStore(){const rows=new Map();return {rows,async list(n){return [...rows.values()].sort((a,b)=>b.score-a.score).slice(0,n).map(e=>({id:e.run_id,name:e.name,score:e.score,completedAt:e.completed_at}));},async save(e){if(!rows.has(e.run_id))rows.set(e.run_id,e);const r=rows.get(e.run_id);return {id:r.run_id,name:r.name,score:r.score,completedAt:r.completed_at};}};}
test('a genuine stage replays with the same points, including lane choices, jump serial and cleared controls',()=>{
 const s=Object.assign(createBike(),{status:'riding',jumpSerial:70}),rec=createRecorder(70);let serial=70;
 for(let tick=0;tick<24000&&s.status==='riding';tick++){
  if(tick===90){rec.clear(serial);s.jumpSerial=serial;s.jumpBuffer=0;s.laneRequest=null;}
  const objects=[...obstacles,...hazards(),...PROTECTED.map(o=>protectedAt(o,actorTime(s,o)))],right=o=>o.end??o.x+(o.protected?45:(o.w||16)/2),clearance=HALF+RADIUS+8;
  if(objects.some(o=>o.lane===s.lane&&right(o)>s.x-clearance&&o.x-s.x<300)&&!objects.some(o=>o.lane!==s.lane&&right(o)>s.x-clearance&&o.x-s.x<160)){const dir=s.lane===0?1:-1;rec.lane(dir);requestLane(s,dir);}
  const jump=tick===120;if(jump)serial++;const input={gas:true,jump,jumpSerial:serial};rec.step(input);stepBike(s,input,1/120);
 }
 assert.equal(s.status,'intermission');const verified=replayStage(0,0,rec.proof());assert.equal(verified.score,s.score);assert.equal(verified.stage,5);assert.ok(verified.ticks>1000);
 assert.throws(()=>replayStage(1,0,rec.proof()),/inválida|completó|después/);
});
test('replay rejects malformed controls, incomplete stages and excessive work',()=>{for(const proof of [{runs:[[120001,0]],events:[]},{runs:[[1,16]],events:[]},{runs:[[10,0]],events:[[11,'lane',1]]},{runs:[[10,0]],events:[[0,'lane',9]]},{runs:[[10,0]],events:[]}])assert.throws(()=>replayStage(0,0,proof));});
test('signed runs require all stages, reject altered tokens and submit idempotently',async()=>{
 const store=memoryStore(),api=createRankingService({secret,store,uuid:()=>id,now:()=>1000,verify:(stage,score)=>({stage:stage+5,score:score+25})});let state=api.start();
 await assert.rejects(api.submit(state.token,'Tropi'),/25 etapas/);
 const [text,sig]=state.token.split('.'),forged=JSON.parse(Buffer.from(text,'base64url'));forged.stage=STAGES.length;forged.score=999999;const token=Buffer.from(JSON.stringify(forged)).toString('base64url')+'.'+sig;assert.throws(()=>api.advance(token,{}),/inválida/);
 for(let i=0;i<STAGES.length;i+=5)state=api.advance(state.token,{});assert.equal(state.score,STAGES.length/5*25);const result=await api.submit(state.token,'  José   Rider  ');assert.equal(result.entry.name,'José Rider');assert.equal(result.entries[0].score,STAGES.length/5*25);await api.submit(state.token,'Otro nombre');assert.equal(store.rows.size,1);assert.equal((await api.list()).entries[0].name,'José Rider');
});
test('tokens expire and public aliases reject markup, links and overlong text',()=>{const store=memoryStore(),api=createRankingService({secret,store,uuid:()=>id,now:()=>1000});const started=api.start(),later=createRankingService({secret,store,now:()=>8*86400000});assert.throws(()=>later.advance(started.token,{}),/válida/);for(const name of ['x','<img src=x>','https://spam.cl','A'.repeat(21),'🚲🚲'])assert.throws(()=>normalizeName(name));assert.equal(normalizeName('Ana Ñandú 2'),'Ana Ñandú 2');});
test('ranking client queues checkpoint verification, retries network failure and preserves the finished result',async()=>{
 const map=new Map(),store=memoryStore(),api=createRankingService({secret,store,uuid:()=>id,verify:(stage,score)=>({stage:stage+5,score:score+25})});let fail=true;
 const client=createRankingClient({storage:()=>({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}),fetchImpl:async(url,init)=>{const b=JSON.parse(init.body);if(b.action==='stage'&&fail){fail=false;throw Error('Offline');}const data=b.action==='start'?api.start():b.action==='stage'?api.advance(b.token,b.proof):await api.submit(b.token,b.name);return {ok:true,json:async()=>data};}});
 client.reset(0,0,0);for(let stage=0;stage<STAGES.length;stage+=5){client.step({jumpSerial:0});client.complete((stage/5+1)*25);if(stage<STAGES.length-5)client.reset(stage+5,(stage/5+1)*25,0);}
 try{await client.submit('Tropi');}catch{}const result=await client.submit('Tropi');assert.equal(result.entry.score,STAGES.length/5*25);assert.equal(client.validating,false);assert.equal(store.rows.size,1);client.reset(4,0,0);assert.equal(client.eligible,false);
});

test('a fall and retry from a checkpoint remain verifiable',()=>{
 let s=Object.assign(createBike(),{status:'riding'}),serial=0;const rec=createRecorder();
 // Deliberately ride into a pedestrian, then recover normally.
 while(s.status==='riding'){const input={gas:true,jumpSerial:serial};rec.step(input);stepBike(s,input,1/120);}
 assert.equal(s.status,'crashed');
 rec.clear(serial);rec.retry(serial);const checkpoint=s.checkpointScore;
 s=Object.assign(createBike('normal',s.stage),{status:'riding',score:checkpoint,checkpointScore:checkpoint});
 for(let tick=0;tick<24000&&s.status==='riding';tick++){
  const objects=[...obstacles,...hazards(),...PROTECTED.map(o=>protectedAt(o,actorTime(s,o)))],right=o=>o.end??o.x+(o.protected?45:(o.w||16)/2),clearance=HALF+RADIUS+8;
  if(objects.some(o=>o.lane===s.lane&&right(o)>s.x-clearance&&o.x-s.x<300)&&!objects.some(o=>o.lane!==s.lane&&right(o)>s.x-clearance&&o.x-s.x<160)){const dir=s.lane===0?1:-1;rec.lane(dir);requestLane(s,dir);}
  const input={gas:true,jumpSerial:serial};rec.step(input);stepBike(s,input,1/120);
 }
 assert.equal(s.status,'intermission');assert.equal(replayStage(0,0,rec.proof()).score,s.score);
 assert.throws(()=>replayStage(0,0,{runs:[[1,0]],events:[[0,'retry']]}),/inválidas/);
});
