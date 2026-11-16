export const LEVEL_MUSIC={city:'/juegos/tropi/tropi-surf-rock-v8-extended.mp3',desert:'/juegos/tropi/tropi-surf-rock-v8-extended.mp3',coast:'/juegos/tropi/tropi-surf-rock-v8-extended.mp3',night:'/juegos/tropi/tropi-surf-rock-v8-extended.mp3'};
export function createBikeAudio({createAudio=src=>new Audio(src),createContext=()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null;},onError=()=>{}}={}){
 let theme='city',audio=null,enabled=true,active=false,disposed=false,context=null,voices=new Set(),playAttempt=0;
 function stopMusic(){playAttempt++;if(audio){audio.muted=true;audio.pause();}}
 function stopEffects(){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
 function prepare(){if(context)return;try{context=createContext();}catch{}if(context?.state==='suspended')context.resume().catch(()=>{});}
 function tone(at,f,end,length,volume,type='sine'){
  if(!context||voices.size>=12)return;const o=context.createOscillator(),g=context.createGain(),start=context.currentTime+at;o.type=type;o.frequency.setValueAtTime(f,start);o.frequency.exponentialRampToValueAtTime(Math.max(25,end),start+length);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+length);o.connect(g);g.connect(context.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(start);o.stop(start+length+.015);
 }
 function effect(name,intensity=1,terminal=false){
  if(!enabled||disposed||(!active&&!terminal))return;
  prepare();const gain=Math.min(1,Math.max(.2,intensity));
  try{
   if(name==='boost'){tone(0,160,480,.2,.06);tone(.04,330,660,.12,.025,'triangle');}
   if(name==='jump'){tone(0,180,550,.14,.10);tone(.04,310,780,.15,.045);}
   if(name==='land'){tone(0,100,38,.11,.11*gain);tone(.015,240,80,.08,.035*gain,'triangle');}
   if(name==='lane'){tone(0,430,650,.085,.06,'triangle');tone(.045,650,840,.09,.045);}
   if(name==='points')for(let i=0;i<3;i++)tone(i*.07,[660,830,990][i],[660,830,990][i],.16,.065,'triangle');
   if(name==='crash'){tone(0,230,48,.30,.10,'triangle');tone(.06,340,65,.22,.045);}
   if(name==='finish')for(let i=0;i<5;i++)tone(i*.10,[330,415,494,660,830][i],[330,415,494,660,830][i],.28,.07,'triangle');
  }catch{/* Sound effects remain optional if Web Audio is unavailable. */}
 }
 function sync(rewind=false){
  if(!enabled||!active||disposed){stopMusic();stopEffects();return;}
  if(!audio){audio=createAudio(LEVEL_MUSIC[theme]);audio.loop=true;audio.volume=.30;}
  if(rewind)try{audio.currentTime=0;}catch{}prepare();audio.muted=false;const attempt=++playAttempt;
  try{const current=audio,playing=current.play();playing?.then?.(()=>{if(attempt!==playAttempt)return;if(!enabled||!active||disposed||current!==audio){current.muted=true;current.pause();}}).catch(()=>{if(attempt!==playAttempt)return;current.muted=true;current.pause();onError();});}catch{stopMusic();onError();}
 }
 return {start(){active=true;stopEffects();sync(true);},setTheme(value){const next=LEVEL_MUSIC[value]?value:'city';if(LEVEL_MUSIC[theme]===LEVEL_MUSIC[next]){theme=next;return;}stopMusic();audio=null;theme=next;sync();},get enabled(){return enabled;},setEnabled(value){enabled=!!value;sync();},setActive(value){active=!!value;sync();},restart(){stopEffects();if(audio)try{audio.currentTime=0;}catch{}sync();},effect,finish(success){active=false;stopMusic();stopEffects();effect(success?'finish':'crash',1,true);},dispose(){disposed=true;active=false;stopMusic();stopEffects();if(context)context.close().catch(()=>{});}};
}
