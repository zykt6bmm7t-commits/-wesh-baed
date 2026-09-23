const fs=require('fs');

const input=process.argv[2]||'index.html';
const html=fs.readFileSync(input,'utf8');
const a=html.indexOf('const DB=')+9,b=html.indexOf(';\nconst ',a);
if(a<9||b<0)throw Error('DB not found');
const db=JSON.parse(html.slice(a,b));
const sources=Object.values(db.sources);
const resultsBySource=Object.groupBy(Object.values(db.results),r=>r.source_id);
const checkedAt=new Date().toISOString();
const officialHosts=['gov.sa','boe.gov.sa','uqn.gov.sa','saip.gov.sa','sama.gov.sa','bfc.gov.sa','ejar.sa','sakani.sa','najiz.sa','absher.sa','iam.gov.sa','gosi.gov.sa','my.gov.sa','mc.gov.sa','cst.gov.sa','rega.gov.sa','zatca.gov.sa','bog.gov.sa'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const isOfficial=u=>{try{const h=new URL(u).hostname.toLowerCase();return officialHosts.some(x=>h===x||h.endsWith('.'+x))}catch{return false}};
const significant=s=>String(s||'').replace(/[—–-]/g,' ').split(/\s+/).filter(x=>x.length>=4&&!/^(وزارة|هيئة|خدمة|منصة|نظام|اللائحة|المملكة|العربية|السعودية)$/.test(x)).slice(0,8);

async function request(url,method){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const r=await fetch(url,{method,redirect:'follow',signal:controller.signal,headers:{'user-agent':'WeshBaed-LegalSourceAudit/1.0','accept':'text/html,application/pdf;q=0.9,*/*;q=0.5',...(method==='GET'?{'range':'bytes=0-180000'}:{})}});
    let body='';if(method==='GET'&&/text|json|xml|html/.test(r.headers.get('content-type')||''))body=(await r.text()).slice(0,180000);
    return {ok:true,status:r.status,final_url:r.url,content_type:r.headers.get('content-type')||'',body};
  }catch(e){return {ok:false,status:0,final_url:url,error:e.name==='AbortError'?'TIMEOUT':String(e.message||e)}}finally{clearTimeout(timer)}
}

async function check(s){
  const url=s.url||'';let result={ok:false,status:0,final_url:url,error:'NO_URL',content_type:'',body:''};
  if(url){result=await request(url,'HEAD');if(!result.ok||[400,401,403,405,406,429,500,501,502,503,504].includes(result.status))result=await request(url,'GET')}
  let classification='REQUIRES HUMAN CHECK',reason='تعذر التحقق الآلي.';
  let redirected=false,https=false,finalOfficial=false,relevance='REQUIRES HUMAN CHECK';
  try{https=new URL(url).protocol==='https:';redirected=Boolean(result.final_url&&result.final_url!==url);finalOfficial=isOfficial(result.final_url||url)}catch{}
  if(s.status==='superseded'||s.status==='repealed'){classification='SUPERSEDED';reason='بيانات المصدر داخل المشروع تصفه بأنه مستبدل/ملغى.'}
  else if(s.status==='stale'||s.status==='obsolete'){classification='STALE';reason='بيانات المصدر داخل المشروع تصفه بأنه قديم.'}
  else if([404,410].includes(result.status)){classification='BROKEN';reason=`الرابط أعاد HTTP ${result.status}.`}
  else if(result.ok&&result.status>=200&&result.status<400&&https&&finalOfficial){classification=redirected?'REDIRECTED':'ACTIVE';reason=redirected?'الرابط يعمل لكنه انتقل إلى عنوان رسمي آخر.':'الرابط يعمل على HTTPS ونطاق رسمي.'}
  else if(result.ok&&result.status>=200&&result.status<400&&!finalOfficial){classification='REQUIRES HUMAN CHECK';reason='الرابط استجاب لكن العنوان النهائي ليس ضمن قائمة النطاقات الرسمية المعتمدة آليًا.'}
  else if(result.status===401||result.status===403||result.status===429){classification='REQUIRES HUMAN CHECK';reason=`المصدر الرسمي منع الفحص الآلي أو قيّده (HTTP ${result.status})؛ لا يعد رابطًا مكسورًا.`}
  else if(result.status>=500){classification='REQUIRES HUMAN CHECK';reason=`عطل مؤقت أو استجابة خادم HTTP ${result.status}.`}
  else if(!https){classification='REQUIRES HUMAN CHECK';reason='الرابط ليس HTTPS أو تعذر تحليله.'}
  if(result.body){const plain=result.body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');const keys=significant(s.title);const hits=keys.filter(k=>plain.includes(k)).length;relevance=keys.length===0?'REQUIRES HUMAN CHECK':hits>=Math.min(2,keys.length)?'LIKELY_RELEVANT':'REQUIRES HUMAN CHECK'}
  else if(/pdf/i.test(result.content_type))relevance='PDF_LINK_ONLY';
  return {
    source_id:s.source_id,title:s.title||'',authority:s.authority||'',original_url:url,final_url:result.final_url||'',http_status:result.status||'',https:https?'YES':'NO',official_domain:finalOfficial?'YES':'NO',redirected:redirected?'YES':'NO',classification,relation_check:relevance,reason,last_verified:s.last_verified||'',checked_at:checkedAt,affected_results:(resultsBySource[s.source_id]||[]).map(r=>r.result_id).join(' | '),affected_count:(resultsBySource[s.source_id]||[]).length
  };
}

async function main(){
  const out=new Array(sources.length);let next=0;
  const workers=Array.from({length:40},async()=>{while(true){const i=next++;if(i>=sources.length)return;out[i]=await check(sources[i]);if(i%40===0)process.stderr.write(`checked ${i+1}/${sources.length}\n`)}});
  await Promise.all(workers);
  out.sort((x,y)=>x.classification.localeCompare(y.classification)||x.source_id.localeCompare(y.source_id));
  const headers=Object.keys(out[0]);const esc=v=>`"${String(v??'').replaceAll('"','""').replaceAll('\n',' ')}"`;
  fs.mkdirSync('docs/LAWYER_FINAL_REVIEW_PACKET',{recursive:true});
  fs.writeFileSync('docs/LAWYER_FINAL_REVIEW_PACKET/06_SOURCE_LINK_AUDIT.csv',[headers,...out.map(x=>headers.map(h=>x[h]))].map(r=>r.map(esc).join(',')).join('\n'));
  const counts=Object.fromEntries(Object.entries(Object.groupBy(out,x=>x.classification)).map(([k,v])=>[k,v.length]));
  const meta={checked_at:checkedAt,total:out.length,counts,broken:out.filter(x=>x.classification==='BROKEN').map(x=>x.source_id),superseded:out.filter(x=>x.classification==='SUPERSEDED').map(x=>x.source_id),requires_human_check:out.filter(x=>x.classification==='REQUIRES HUMAN CHECK').length};
  fs.writeFileSync('docs/LAWYER_FINAL_REVIEW_PACKET/source-link-audit-summary.json',JSON.stringify(meta,null,2));
  console.log(JSON.stringify(meta,null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
