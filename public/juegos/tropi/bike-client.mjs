import {cactusPolygons,drawCactus} from './bike-cactus.mjs';
import {createCheckpointStore} from './bike-checkpoint.mjs';
import {dangerCue,cameraTarget,nextDanger} from './bike-feedback.mjs';
import {createBike,stepBike,stageLabel,terrain,surface,changeLane,wheelContacts,hasLaneSupport,canBufferAction,requestLane,obstacles,hazards,HALF,RADIUS,STAGES,RAMPS,PROTECTED,protectedAt,protectedPolygons,COLLECTIBLES,FAUNA_ZONES,faunaZoneAt,STUNT_ZONES,SPEED_ZONES,bloomAt} from './bike-model.mjs';

import {drawDesert,drawTrail,drawBoulder,drawTropi,drawProtected,drawFaunaSign} from './bike-art.mjs';

import {createBikeAudio} from './bike-audio.mjs';import {initBikeView} from './bike-view.mjs';import {createBikeInput} from './bike-input.mjs';

const root=document.querySelector('#bike'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),get=id=>root.querySelector('#'+id),notice=get('notice'),pauseButton=get('pause'),soundButton=get('sound'),switchButton=root.querySelector('[data-switch]'),holdButtons=[...root.querySelectorAll('[data-hold]')];

const checkpointStore=createCheckpointStore(undefined,STAGES.length),savedCheckpoint=checkpointStore.load();
let state=createBike('normal',savedCheckpoint?.stage??0),last=0,lastPaint=0,acc=0,paused=false,frame,soundError=false,lastStatus='ready',cameraX=state.x,cameraY=0,cameraZoom=1.25,pedalPhase=0,statusAge=0,stageEntryScore=0,counters={},dust=[];

if(savedCheckpoint){state.score=savedCheckpoint.score;state.checkpointScore=savedCheckpoint.score;state.scoreMilestone=Math.floor(state.score/250);stageEntryScore=state.score;}

const controls=createBikeInput(),input=controls.input,mascot=null;

const audio=createBikeAudio({createAudio(src){const a=get('soundtrack');a.src=src;return a;},onError(){soundError=true;soundButton.textContent='♫';soundButton.title='Toca para activar sonido';}});

const view=initBikeView(root,get('expand'),{document,window,onExit(){clear();if(!paused&&state.status==='riding')pause();}});

function clear(){controls.clear();if(state){state.jumpSerial=input.jumpSerial;state.jumpBuffer=0;state.laneRequest=null;}holdButtons.forEach(b=>b.classList.remove('pressed'));}

function reset(stage=state.stage||0,score=state.checkpointScore||0){if(stage===0&&score===0)checkpointStore.clear();clear();state=createBike('normal',stage);state.jumpSerial=input.jumpSerial;state.score=score;state.checkpointScore=score;stageEntryScore=score;state.scoreMilestone=Math.floor(score/250);state.status='riding';lastStatus='riding';paused=false;acc=0;cameraX=state.x;cameraY=0;cameraZoom=1.25;dust=[];pedalPhase=0;statusAge=0;counters={};pauseButton.setAttribute('aria-pressed','false');audio.setActive(true);audio.restart();canvas.focus();}

function pause(){if(state.status!=='riding')return;paused=!paused;clear();pauseButton.setAttribute('aria-pressed',String(paused));audio.setActive(!paused);if(!paused)canvas.focus();}

function action(){if(paused){pause();return true;}if(state.status==='riding')return false;if(state.status==='finished'){stageEntryScore=0;reset(0,0);}else reset();return true;}

pauseButton.onclick=pause;canvas.addEventListener('pointerdown',e=>{if(action())e.preventDefault();});

soundButton.onclick=()=>{if(soundError){soundError=false;audio.setEnabled(true);}else audio.setEnabled(!audio.enabled);soundButton.textContent=audio.enabled?'♫':'♪';soundButton.title=audio.enabled?'Silenciar sonido':'Activar sonido';soundButton.setAttribute('aria-pressed',String(audio.enabled));};

get('help-link').onclick=()=>{if(!paused&&state.status==='riding')pause();get('como-jugar').open=true;};

function lane(dir=state.lane===0?1:-1){if(paused)return;if(!requestLane(state,dir))state.laneDeniedUntil=state.time+.9;else state.laneDeniedUntil=0;}

const keys={ArrowLeft:'back',ArrowRight:'forward',Space:'jump'};

window.addEventListener('keydown',e=>{const held=e.target?.closest?.('[data-hold]')?.dataset.hold;if(held&&['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat&&held==='jump'&&action())return;controls.set('button:'+e.code,held,true);return;}if(e.target?.matches?.('summary,a,button')&&['Space','ArrowLeft','ArrowRight'].includes(e.code))return;if(keys[e.code]||['KeyC','KeyQ','KeyE','KeyR'].includes(e.code)){e.preventDefault();if(keys[e.code]&&!(e.code==='Space'&&!e.repeat&&action()))controls.set(e.code,keys[e.code],true);if(!e.repeat){if(e.code==='KeyC')lane();if(e.code==='KeyQ')lane(-1);if(e.code==='KeyE')lane(1);if(e.code==='KeyR')reset();}}if(e.code==='Escape'&&!view.expanded&&!paused)pause();});

window.addEventListener('keyup',e=>{controls.set('button:'+e.code,'jump',false);if(keys[e.code])controls.set(e.code,keys[e.code],false);});

for(const b of holdButtons){b.addEventListener('pointerdown',e=>{e.preventDefault();if(b.dataset.hold==='jump'&&action())return;b.setPointerCapture(e.pointerId);controls.set(e.pointerId,b.dataset.hold,true);b.classList.add('pressed');});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>{controls.set(e.pointerId,b.dataset.hold,false);b.classList.remove('pressed');});}

switchButton.onclick=()=>{lane();canvas.focus();};for(const type of ['contextmenu','selectstart','dragstart'])root.querySelector('.stage').addEventListener(type,e=>e.preventDefault());

function inactive(){clear();if(!paused&&state.status==='riding')pause();else audio.setActive(false);}window.addEventListener('blur',inactive);document.addEventListener('visibilitychange',()=>{if(document.hidden)inactive();});

function effects(dt){if(paused)return;if((state.checkpointSerial||0)>(counters.checkpoints||0)){stageEntryScore=state.checkpointScore;checkpointStore.save(state.stage,state.checkpointScore);audio.effect('points');}cameraX+=(state.x-cameraX)*(1-Math.exp(-10*dt));const target=cameraTarget(state,terrain(state.x));cameraY+=(target.lift-cameraY)*(1-Math.exp(-6*dt));cameraZoom+=(target.zoom-cameraZoom)*(1-Math.exp(-5*dt));for(const p of dust){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=70*dt;}dust=dust.filter(p=>p.age<p.life);if(state.driving)pedalPhase-=Math.min(7,2+state.vx*.025)*dt;for(const [field,sound]of [['pickups','points'],['boosts','boost'],['jumps','jump'],['launches','jump'],['landings','land'],['changes','lane'],['bumps','land']])if((state[field]||0)>(counters[field]||0)){audio.effect(sound,state.impact||.6);if(['landings','launches','jumps','bumps'].includes(field))for(let i=0;i<7;i++)dust.push({x:state.x-24+Math.random()*20,y:terrain(state.x)+4,depth:state.depth,vx:-15-Math.random()*45,vy:15+Math.random()*30,age:0,life:.3+Math.random()*.35});dust=dust.slice(-48);}if((state.scoreMilestone||0)>(counters.points||0))audio.effect('points');counters={pickups:state.pickups,boosts:state.boosts,checkpoints:state.checkpointSerial,launches:state.launches,jumps:state.jumps,landings:state.landings,changes:state.changes,bumps:state.bumps,points:state.scoreMilestone||0};if(lastStatus!==state.status){lastStatus=state.status;statusAge=0;if(state.status!=='riding'){if(state.status==='finished')checkpointStore.clear();clear();audio.finish(state.status==='finished');}}statusAge+=dt;}

function sign(x,y,text){ctx.font='bold 9px system-ui';const width=Math.max(42,Math.min(80,ctx.measureText(text).width+12));ctx.fillStyle='#3b2a20';ctx.fillRect(x-1,y+2,2,22);ctx.fillStyle='#ffe2a3';ctx.fillRect(x-width/2,y-13,width,17);ctx.fillStyle='#35251c';ctx.textAlign='center';ctx.fillText(text,x,y-1);ctx.textAlign='left';}

function text(id,value){const el=get(id);if(el.textContent!==value)el.textContent=value;}
function draw(){const W=1100,H=460,stage=STAGES[state.stage];if(root.dataset.theme!==stage.theme)root.dataset.theme=stage.theme;ctx.clearRect(0,0,W,H);drawDesert(ctx,Math.max(0,cameraX-270),W,H,bloomAt(state.x),state.x);ctx.save();ctx.translate(300,365+cameraY*cameraZoom);ctx.scale(cameraZoom,cameraZoom);ctx.translate(-300,-365);

 for(let l=0;l<2;l++){const base=265+l*100,scale=.86+l*.14,px=x=>300+(x-cameraX)*scale,py=(x,h=0)=>base-(surface(x,l,state.difficulty)+h)*scale;

 drawTrail(ctx,{lane:l,px,py,start:cameraX-500,end:cameraX+1500,H,theme:stage.theme});if(l===(state.transition?.to??state.lane)){ctx.strokeStyle='#ffe4a5';ctx.lineWidth=2;ctx.globalAlpha=.65;ctx.beginPath();for(let x=cameraX-400;x<cameraX+1100;x+=8){const sx=px(x),sy=py(x)+4;x===cameraX-400?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);}ctx.stroke();ctx.globalAlpha=1;}ctx.font='bold 12px system-ui';ctx.fillStyle='#36271d';ctx.fillText(['FONDO','CERCA'][l],20,base-15);

 for(const o of obstacles.filter(o=>o.lane===l&&Math.abs(o.x-cameraX)<1500)){drawBoulder(ctx,px(o.x),py(o.x),(o.w||16)*scale,o.h*scale,o.kind);}

 for(const h of hazards(state.difficulty).filter(h=>h.lane===l&&Math.abs(h.x-cameraX)<1500)){if(h.kind==='cactus')drawCactus(ctx,cactusPolygons(h,terrain),px,y=>base-y*scale,scale);}

 for(const o of PROTECTED.map(o=>protectedAt(o,state.time)).filter(o=>o.lane===l&&Math.abs(o.x-cameraX)<1500)){drawProtected(ctx,o,protectedPolygons(o),px,y=>base-y*scale,scale);if(o.kind==='flower')sign(px(o.x-180),py(o.x-180)-28,'FLOR');}

 for(const z of FAUNA_ZONES.filter(z=>z.lane===l&&Math.abs(z.start-cameraX)<1500)){const animal=PROTECTED.find(o=>o.x===z.animalX&&o.kind===z.kind&&o.lane===z.lane);drawFaunaSign(ctx,px(z.start-100),py(z.start-100),z.kind,protectedPolygons(animal),animal.x,terrain(animal.x));ctx.strokeStyle='#ffcf42';ctx.lineWidth=3;for(const x of [z.start,z.end]){ctx.beginPath();ctx.moveTo(px(x)-7,py(x)-5);ctx.lineTo(px(x)+7,py(x)-5);ctx.stroke();}}

 for(const z of STUNT_ZONES.filter(z=>Math.abs(z.start-cameraX)<1500)){ctx.strokeStyle='#ffd98c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px(z.lip-18),py(z.lip-18)-2);ctx.lineTo(px(z.lip),py(z.lip)-2);ctx.stroke();}
 for(const r of RAMPS.filter(r=>Math.abs(r.x-cameraX)<1500)){ctx.strokeStyle='#ffdb8e';ctx.lineWidth=4;ctx.beginPath();for(let x=r.x;x<=r.crest;x+=4)x===r.x?ctx.moveTo(px(x),py(x)-2):ctx.lineTo(px(x),py(x)-2);ctx.stroke();}

 for(const z of SPEED_ZONES.filter(z=>z.lane===l&&z.end>cameraX-500&&z.start<cameraX+1500)){ctx.strokeStyle=z.kind==='boost'?'#66f4cd':'#f0b953';ctx.lineWidth=z.kind==='boost'?6:9;ctx.globalAlpha=.85;ctx.beginPath();for(let x=z.start;x<=z.end;x+=8)x===z.start?ctx.moveTo(px(x),py(x)-2):ctx.lineTo(px(x),py(x)-2);ctx.stroke();ctx.globalAlpha=1;for(let x=z.start+25;x<z.end;x+=50){ctx.strokeStyle=z.kind==='boost'?'#e6fff0':'#8d5b2d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px(x)-5,py(x)-12);ctx.lineTo(px(x)+3,py(x)-8);ctx.lineTo(px(x)-5,py(x)-4);ctx.stroke();}}
 const finish=stage.end;
 if(state.stage===STAGES.length-1){ctx.fillStyle='#30271d';ctx.fillRect(px(finish),py(finish,80),3,80*scale);for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#fff1d1':'#302923';ctx.fillRect(px(finish)+(i%4)*9,py(finish,80)+Math.floor(i/4)*9,9,9);}}
 else{ctx.strokeStyle='#bfe7cd';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px(finish),py(finish)-2);ctx.lineTo(px(finish),py(finish)+10);ctx.stroke();if(l===0){const x=px(finish),y=py(finish);ctx.fillStyle='#44352a';ctx.fillRect(x-1,y-54,2,54);ctx.fillStyle='#5dba9d';ctx.beginPath();ctx.moveTo(x,y-54);ctx.lineTo(x+32,y-54);ctx.lineTo(x+27,y-34);ctx.lineTo(x,y-34);ctx.closePath();ctx.fill();ctx.fillStyle='#173b33';ctx.font='bold 13px system-ui';ctx.fillText(STAGES[state.stage+1].number===1?'N'+STAGES[state.stage+1].level:String(STAGES[state.stage+1].number),x+9,y-39);}}


 for(const c of COLLECTIBLES.filter(c=>c.lane===l&&!state.collected?.has(c.id)&&Math.abs(c.x-cameraX)<1200)){const x=px(c.x),y=py(c.x,c.h);ctx.save();ctx.fillStyle='#ffe465';ctx.strokeStyle='#fff8da';ctx.lineWidth=1.3;ctx.beginPath();for(const [i,[dx,dy]]of [[-2,-10],[6,-10],[1,-2],[6,-2],[-5,11],[-2,2],[-7,2]].entries())i?ctx.lineTo(x+dx*scale,y+dy*scale):ctx.moveTo(x+dx*scale,y+dy*scale);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 for(const p of dust.filter(p=>Math.round(p.depth)===l)){ctx.globalAlpha=Math.max(0,1-p.age/p.life);ctx.fillStyle='#f5c68b';ctx.beginPath();ctx.arc(px(p.x),base-p.y*scale,1.5+p.age*4,0,7);ctx.fill();ctx.globalAlpha=1;}
 if(Math.round(state.depth)===l){const bs=.86+state.depth*.14,bx=300+(state.x-cameraX)*bs,bikeBase=265+state.depth*100;ctx.save();ctx.fillStyle='#37251c44';ctx.beginPath();ctx.ellipse(bx,bikeBase-terrain(state.x)*bs,38*bs,5*bs,0,0,7);ctx.fill();ctx.translate(bx,bikeBase-state.y*bs);ctx.scale(bs,-bs);ctx.rotate(state.angle);drawTropi(ctx,{...state,pedalPhase},mascot,HALF,RADIUS);ctx.restore();}}

 ctx.restore();
 const meters=Math.min((stage.end-stage.start)/10,Math.max(0,Math.floor((state.x-stage.start)/10)));text('progress',`${stageLabel(stage)} · ${meters} / 500 m`);get('stage-progress').max=(stage.end-stage.start)/10;if(get('stage-progress').value!==meters)get('stage-progress').value=meters;text('stage-title',`${stage.levelName} · ${stage.name}`);text('score',`${state.score||0} puntos`);text('trick',!paused&&state.status==='riding'&&state.time-(state.trickTime??-10)<2?state.trickLabel||'':'');text('lane',state.transition?`${state.transition.from===0?'FONDO':'CERCA'} → ${state.transition.to===0?'FONDO':'CERCA'}`:state.lane===0?'FONDO':'CERCA');
 const danger=nextDanger(state,[...obstacles.map(o=>({...o,kind:o.kind||'rock'})),...PROTECTED.map(o=>protectedAt(o,state.time)),...hazards(state.difficulty)]),longJump=STUNT_ZONES.some(z=>state.x>z.start-120&&state.x<z.lip),hint=state.laneDeniedUntil>state.time&&!hasLaneSupport(state)?'Apoya una rueda para cambiar':state.hintUntil>state.time?state.controlHint:'',critical=danger&&danger.kind!=='rock'&&danger.x-state.x<Math.max(100,state.vx*.75);
 text('notice',paused?'En pausa':state.status==='riding'?(critical?dangerCue(danger.kind):state.checkpointSerial&&state.time-state.checkpointTime<3?(stage.number===1?`¡Nivel ${stage.level}: ${stage.levelName}!`:'¡Checkpoint guardado!'):state.laneRequest?'Cambio preparado · al apoyar':hint?hint:danger?dangerCue(danger.kind):longJump?'Salto largo · Atrás gira / Adelante corrige':COLLECTIBLES.some(c=>c.lane===state.lane&&!state.collected?.has(c.id)&&c.x>state.x&&c.x-state.x<220)?'Rayos · salta para sumar puntos':faunaZoneAt(state.x,state.lane)?'Zona de fauna · deja libre su camino':state.surfaceKind==='sand'?'Arena · pierde velocidad':state.boostUntil>state.time?'¡Impulso de velocidad!':!hasLaneSupport(state)?'En el aire · equilibra':state.time<8?'Tropi acelera solo · tú eliges la pista':state.vx<12?'Poca velocidad · salta o cambia de pista':''):state.message);
 notice.dataset.danger=danger&&(critical||(!hint&&!state.laneRequest))?(danger.kind==='rock'?'bump':'fatal'):'';


 const playing=state.status==='riding';pauseButton.disabled=!playing;for(const b of holdButtons)b.disabled=b.dataset.hold==='jump'?false:!playing||paused;switchButton.disabled=!playing||paused||!!state.transition||(!hasLaneSupport(state)&&!canBufferAction(state));switchButton.setAttribute('aria-label','Cambiar pista');

 const showPanel=paused||state.status==='ready'||(['crashed','finished'].includes(state.status)&&statusAge>.5);get('state-panel').hidden=!showPanel;notice.hidden=showPanel||!notice.textContent;
 if(showPanel){ctx.fillStyle='#241a1499';ctx.fillRect(0,0,W,H);text('state-heading',paused?'En pausa':state.status==='ready'?'¡Vamos, Tropi!':state.status==='finished'?'¡Tres niveles completados!':'Nuevo intento');text('state-detail',paused?'Toca Saltar o la pista para seguir':state.status==='ready'?(state.stage>0?`${stageLabel(stage)} recuperada · Toca Saltar para seguir`:'Toca Saltar o la pista para empezar'):state.status==='finished'?`${state.score} puntos · Toca para volver a jugar`:`${state.message} · Toca para reintentar`);}}


function tick(t){const dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(!paused){acc+=dt;while(acc>=1/120){stepBike(state,input,1/120);acc-=1/120;}}else acc=0;effects(dt);if((state.status==='riding'&&!paused)||t-lastPaint>=100){draw();lastPaint=t;}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);

window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);inactive();view.close();});window.addEventListener('pageshow',e=>{if(e.persisted){last=0;frame=requestAnimationFrame(tick);}});
