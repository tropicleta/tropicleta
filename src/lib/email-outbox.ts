import "server-only";
import { createHash } from "node:crypto";
import { and, eq, isNull, lt, lte, or } from "drizzle-orm";
import { db, schema } from "@/db";
import type { DB } from "@/db/client";

export type Mail = { recipient:string; subject:string; html:string; id:string };
export function createEmailOutbox(database:DB, deliver:(mail:Mail)=>Promise<void>, clock=()=>new Date()) {
 const t=schema.emailOutbox;
 return {
  async enqueue(recipient:string,subject:string,html:string) {
   const id=createHash("sha256").update(JSON.stringify([recipient,subject,html])).digest("hex");
   await database.insert(t).values({id,recipient,subject,html,nextAttemptAt:clock()}).onConflictDoNothing();
   return id;
  },
  async flush(limit=2, id?:string) {
   let sent=0;
   for(let i=0;i<Math.max(0,Math.min(10,limit));i++) {
    const now=clock();
    const mail=await database.transaction(async tx=>{
     const [row]=await tx.select().from(t).where(and(id?eq(t.id,id):undefined,isNull(t.sentAt),lt(t.attempts,8),lte(t.nextAttemptAt,now),or(isNull(t.lockedUntil),lte(t.lockedUntil,now)))).orderBy(t.nextAttemptAt).limit(1).for("update",{skipLocked:true});
     if(!row)return null;
     const [claimed]=await tx.update(t).set({attempts:row.attempts+1,lockedUntil:new Date(now.getTime()+60_000)}).where(eq(t.id,row.id)).returning();
     return claimed;
    });
    if(!mail)break;
    const owned=and(eq(t.id,mail.id),eq(t.attempts,mail.attempts));
    try {
     await deliver(mail);
     // Keep only the deduplication key after delivery; remove personal payloads.
     await database.update(t).set({sentAt:clock(),lockedUntil:null,lastError:null,recipient:"",subject:"",html:""}).where(owned);
     sent++;
    } catch {
     await database.update(t).set({lockedUntil:null,lastError:"El proveedor no confirmó el envío. Se conservará para reintentar.",nextAttemptAt:new Date(clock().getTime()+Math.min(6*3600_000,60_000*2**(mail.attempts-1)))}).where(owned);
    }
   }
   return sent;
  }
 };
}

/** Bounded provider call, stable key for retries. No secrets are logged. */
export async function deliverEmail(mail:Mail) {
 const response=await fetch("https://api.resend.com/emails",{
  method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":mail.id},
  body:JSON.stringify({from:process.env.EMAIL_FROM??"Tropicleta <onboarding@resend.dev>",to:[mail.recipient],subject:mail.subject,html:mail.html}),signal:AbortSignal.timeout(10_000)
 });
 if(!response.ok)throw new Error("Email provider did not accept delivery");
}
export const emailQueue=createEmailOutbox(db,deliverEmail);
export async function retryQueuedEmails(limit=2) { if(process.env.RESEND_API_KEY) return emailQueue.flush(limit);return 0; }
