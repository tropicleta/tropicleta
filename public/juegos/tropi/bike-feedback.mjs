export function dangerCue(kind){return ({wall:'Paso cerrado · cambia de pista',pit:'Barranco · salta o cambia',cactus:'Cactus · salta o cambia',flower:'Flor protegida · salta sin pisarla o cambia',fox:'Zorrito · deja libre su camino',llama:'Llama · deja libre su camino',rock:'Roca · salta o acomoda la bici'})[kind]||'';}
export function cameraTarget(s,ground){const flight=Math.max(0,Math.min(1,(s.y-ground-55)/160));return {zoom:1.25-.18*flight,lift:Math.max(0,s.y-165)*.65};}

// Give a reaction window based on speed and warn about the destination while crossing.
export function nextDanger(s,objects){
 const lane=s.transition?.to??s.lane,lookAhead=Math.max(240,Math.min(520,(s.vx||0)*1.8+60));
 const nearby=objects.filter(o=>{const right=o.end??o.x+(o.w||16)/2,left=o.x-(o.w||16)/2;return o.lane===lane&&right>s.x-42&&left<s.x+lookAhead;}).sort((a,b)=>(a.x-(a.w||16)/2)-(b.x-(b.w||16)/2));
 const urgent=nearby.find(o=>['wall','pit','cactus','flower','fox','llama'].includes(o.kind)&&o.x-s.x<Math.max(100,(s.vx||0)*.75));return urgent||nearby[0];
}
