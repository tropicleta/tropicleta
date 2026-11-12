import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { readRequestJson } from "./request-json";
import { visitSource } from "./visit-source";

const input=z.object({path:z.string().max(200).regex(/^\/(?!\/)[a-zA-Z0-9/_.%~-]*$/),first:z.boolean(),referrer:z.string().max(2048),source:z.string().max(200),campaign:z.string().max(200)});
type Dependencies={secret:string;getCookie:()=>Promise<string|undefined>;setCookie:(value:string)=>Promise<void>;save:(entry:{path:string;source:string;campaign:string})=>Promise<void>;clock?:()=>number};
/** Only a session entry reaches SQL. Cookie/Do Not Track/bot rejections do not. */
export function createVisitRecorder(deps:Dependencies){
 const recent=new Map<string,number>(),clock=deps.clock??Date.now;
 const sign=(value:string)=>createHmac("sha256",deps.secret).update(value).digest("hex");
 function valid(value:string|undefined){if(!value)return false;const[stamp,sig]=value.split(".");const age=clock()-Number(stamp);if(!Number.isFinite(age)||age<0||age>=1800_000||!sig)return false;const a=Buffer.from(sig),b=Buffer.from(sign(stamp));return a.length===b.length&&timingSafeEqual(a,b);}
 return async(request:Request)=>{
  const done=(status=204)=>new Response(null,{status});
  const origin=new URL(request.url).origin;
  if(request.headers.get("origin")!==origin)return done(403);
  if(/bot|crawler|spider|headless/i.test(request.headers.get("user-agent")||"")||request.headers.get("dnt")==="1")return done();
  try{
   if(valid(await deps.getCookie()))return done();
   const parsed=input.safeParse(await readRequestJson(request,4096));
   if(!parsed.success||/^\/(admin|api)(\/|$)/.test(parsed.data.path))return done(400);
   if(!parsed.data.first)return done();
   const key=sign(request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown"),now=clock();
   if((recent.get(key)||0)>now)return done(429);
   if(recent.size>=5000){for(const[k,until]of recent)if(until<=now)recent.delete(k);if(recent.size>=5000)return done(429);}
   recent.set(key,now+5000);
   const data=parsed.data,{source,campaign}=visitSource(data.referrer,data.source,data.campaign,origin);
   await deps.save({path:data.path,source,campaign});
   const stamp=String(now);await deps.setCookie(stamp+"."+sign(stamp));return done();
  }catch{return done(503);}
 };
}
