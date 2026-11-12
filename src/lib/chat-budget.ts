import "server-only";
import { claimLoginAttempt } from "./login-limit";

function limit(value:string|undefined,fallback:number,max:number){const n=Number(value);return Number.isSafeInteger(n)&&n>0?Math.min(n,max):fallback;}
export function chatBudget(env:Record<string,string|undefined>=process.env){return {enabled:env.CHAT_ENABLED!=="false",daily:limit(env.CHAT_DAILY_LIMIT,200,10_000),monthly:limit(env.CHAT_MONTHLY_LIMIT,3000,100_000)};}
export async function claimChatBudget(now=new Date(),claim=claimLoginAttempt,env:Record<string,string|undefined>=process.env){
 const config=chatBudget(env);if(!config.enabled)return false;
 const date=now.toISOString().slice(0,10);
 if(!await claim(`chat:day:${date}`,config.daily,24*60))return false;
 return claim(`chat:month:${date.slice(0,7)}`,config.monthly,32*24*60);
}
