
const H={"content-type":"application/json; charset=utf-8"};
const j=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{...H,...h}});
const clean=(v,n=255)=>v==null?null:String(v).trim().slice(0,n)||null;
const cors=(r,e)=>{const o=r.headers.get("origin")||"";const a=(e.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);return o&&a.includes(o)?{"access-control-allow-origin":o,"access-control-allow-methods":"GET,POST,PATCH,OPTIONS","access-control-allow-headers":"content-type,authorization","access-control-max-age":"86400","vary":"Origin"}:{}};
const finish=(res,ch)=>{const h=new Headers(res.headers);Object.entries(ch).forEach(([k,v])=>h.set(k,v));h.set("cache-control","no-store");h.set("x-content-type-options","nosniff");return new Response(res.body,{status:res.status,headers:h})};
const isAdmin=(r,e)=>{const a=r.headers.get("authorization")||"";return !!e.ADMIN_API_KEY&&a==="Bearer "+e.ADMIN_API_KEY};
async function verify(r,e,t,a){
  if(e.TURNSTILE_BYPASS==="true"&&e.ENVIRONMENT!=="production") return true;
  if(!e.TURNSTILE_SECRET_KEY||!t) return false;
  const f=new FormData(); f.append("secret",e.TURNSTILE_SECRET_KEY); f.append("response",t);
  const ip=r.headers.get("CF-Connecting-IP"); if(ip) f.append("remoteip",ip);
  const x=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:f});
  if(!x.ok) return false; const d=await x.json();
  return !!d.success && (!a||!d.action||d.action===a) && (!e.TURNSTILE_HOSTNAME||d.hostname===e.TURNSTILE_HOSTNAME);
}
async function body(r){if(!(r.headers.get("content-type")||"").includes("application/json"))throw 0;return r.json()}
async function event(r,e){
  const b=await body(r), ok=new Set(["page_view","session_start","question_view","result_view","restart"]);
  if(!ok.has(b.event_name)) return j({error:"invalid_event"},400);
  const id=crypto.randomUUID();
  await e.DB.prepare("INSERT INTO events (id,event_name,session_id,path,question_id,result_id,utm_source,utm_campaign,referrer,device_class,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))")
    .bind(id,b.event_name,clean(b.session_id,80),clean(b.path,300),clean(b.question_id,80),clean(b.result_id,100),clean(b.utm_source,120),clean(b.utm_campaign,160),clean(b.referrer,500),clean(b.device_class,40)).run();
  return j({ok:true,id},201);
}
async function feedback(r,e){
  const b=await body(r); if(!(await verify(r,e,b.turnstile_token,"feedback"))) return j({error:"verification_failed"},403);
  const rating=Number(b.rating); if(!Number.isInteger(rating)||rating<1||rating>5) return j({error:"invalid_rating"},400);
  const id=crypto.randomUUID();
  await e.DB.prepare("INSERT INTO feedback (id,session_id,result_id,rating,helpful,comment,created_at) VALUES (?,?,?,?,?,?,datetime('now'))")
    .bind(id,clean(b.session_id,80),clean(b.result_id,100),rating,typeof b.helpful==="boolean"?(b.helpful?1:0):null,clean(b.comment,1000)).run();
  return j({ok:true,id},201);
}
async function support(r,e){
  const b=await body(r); if(!(await verify(r,e,b.turnstile_token,"support"))) return j({error:"verification_failed"},403);
  if(!new Set(["technical","billing","account","content","suggestion","other"]).has(b.category)) return j({error:"invalid_category"},400);
  const m=clean(b.message,3000); if(!m||m.length<5) return j({error:"invalid_message"},400);
  const id=crypto.randomUUID();
  await e.DB.prepare("INSERT INTO support_tickets (id,session_id,contact,category,message,status,created_at,updated_at) VALUES (?,?,?,?,?,'new',datetime('now'),datetime('now'))")
    .bind(id,clean(b.session_id,80),clean(b.contact,160),b.category,m).run();
  return j({ok:true,ticket_id:id,status:"new"},201);
}
async function tickets(e,u){const s=u.searchParams.get("status"),l=Math.min(Math.max(Number(u.searchParams.get("limit"))||50,1),100);const q=s?e.DB.prepare("SELECT id,contact,category,message,status,created_at,updated_at FROM support_tickets WHERE status=? ORDER BY created_at DESC LIMIT ?").bind(s,l):e.DB.prepare("SELECT id,contact,category,message,status,created_at,updated_at FROM support_tickets ORDER BY created_at DESC LIMIT ?").bind(l);const x=await q.all();return j({tickets:x.results||[]})}
async function patchTicket(r,e,id){const b=await body(r);if(!new Set(["new","in_progress","closed"]).has(b.status))return j({error:"invalid_status"},400);const x=await e.DB.prepare("UPDATE support_tickets SET status=?,updated_at=datetime('now') WHERE id=?").bind(b.status,id).run();return j({ok:true,changed:x.meta?.changes||0})}
async function summary(e){
  const [a,b,c,d,f,g,h]=await Promise.all([
    e.DB.prepare("SELECT COUNT(DISTINCT session_id) n FROM events WHERE created_at>=datetime('now','-1 day')").first(),
    e.DB.prepare("SELECT COUNT(DISTINCT session_id) n FROM events WHERE created_at>=datetime('now','-7 day')").first(),
    e.DB.prepare("SELECT COUNT(DISTINCT session_id) n FROM events WHERE created_at>=datetime('now','-30 day')").first(),
    e.DB.prepare("SELECT ROUND(AVG(rating),2) avg, COUNT(*) n FROM feedback").first(),
    e.DB.prepare("SELECT COUNT(*) n FROM support_tickets WHERE status!='closed'").first(),
    e.DB.prepare("SELECT result_id,COUNT(*) views FROM events WHERE event_name='result_view' AND result_id IS NOT NULL GROUP BY result_id ORDER BY views DESC LIMIT 10").all(),
    e.DB.prepare("SELECT COALESCE(utm_source,'direct') source,COUNT(DISTINCT session_id) sessions FROM events WHERE created_at>=datetime('now','-30 day') GROUP BY COALESCE(utm_source,'direct') ORDER BY sessions DESC LIMIT 10").all()
  ]);
  return j({visitors:{today:a?.n||0,days7:b?.n||0,days30:c?.n||0},feedback:{average_rating:d?.avg||null,count:d?.n||0},support:{open:f?.n||0},top_results:g.results||[],campaigns:h.results||[]});
}
export default {async fetch(r,e){
  const u=new URL(r.url),ch=cors(r,e);
  if(r.method==="OPTIONS")return new Response(null,{status:204,headers:ch});
  try{
    if(u.pathname==="/api/health"&&r.method==="GET") return finish(j({ok:true,service:"wesh-baed-business-api"}),ch);
    if(u.pathname==="/api/events"&&r.method==="POST") return finish(await event(r,e),ch);
    if(u.pathname==="/api/feedback"&&r.method==="POST") return finish(await feedback(r,e),ch);
    if(u.pathname==="/api/support"&&r.method==="POST") return finish(await support(r,e),ch);
    let res;
    if(u.pathname==="/api/admin/summary"&&r.method==="GET"){if(!isAdmin(r,e))return j({error:"unauthorized"},401);res=await summary(e)}
    else if(u.pathname==="/api/admin/tickets"&&r.method==="GET"){if(!isAdmin(r,e))return j({error:"unauthorized"},401);res=await tickets(e,u)}
    else if(u.pathname.startsWith("/api/admin/tickets/")&&r.method==="PATCH"){if(!isAdmin(r,e))return j({error:"unauthorized"},401);res=await patchTicket(r,e,decodeURIComponent(u.pathname.split("/").pop()))}
    else return j({error:"not_found"},404);
    return finish(res,ch);
  }catch(_){return finish(j({error:"internal_error"},500),ch)}
}};
