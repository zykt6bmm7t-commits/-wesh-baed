const fs=require('fs');

const input=process.argv[2]||'index.html';
const html=fs.readFileSync(input,'utf8');
const a=html.indexOf('const DB=')+9,b=html.indexOf(';\nconst ',a);
if(a<9||b<0)throw Error('DB not found');
const db=JSON.parse(html.slice(a,b));
const sources=Object.values(db.sources);
const results=Object.values(db.results);
const resultsBySource=Object.groupBy(results,r=>r.source_id);
const checkedAt=new Date().toISOString();
const checkedDate=checkedAt.slice(0,10);
const officialHosts=['gov.sa','boe.gov.sa','uqn.gov.sa','saip.gov.sa','sama.gov.sa','bfc.gov.sa','ejar.sa','sakani.sa','najiz.sa','absher.sa','iam.gov.sa','gosi.gov.sa','my.gov.sa','mc.gov.sa','cst.gov.sa','rega.gov.sa','zatca.gov.sa','bog.gov.sa','rer.sa','scfhs.org.sa','crsd.org.sa','saudieng.sa','socpa.org.sa','business.sa','freelance.sa','bankruptcy.gov.sa'];
const legalHosts=['laws.boe.gov.sa','laws.moj.gov.sa','uqn.gov.sa'];
const regulatorNames=/البنك المركزي|هيئة السوق|هيئة التأمين|هيئة الاتصالات|هيئة العقار|هيئة الملكية الفكرية|الزكاة والضريبة|لجنة|مركز الإسناد|ديوان المظالم/;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hostOf=u=>{try{return new URL(u).hostname.toLowerCase()}catch{return ''}};
const isOfficial=u=>{const h=hostOf(u);return officialHosts.some(x=>h===x||h.endsWith('.'+x))};
const significant=s=>String(s||'').replace(/[—–-]/g,' ').split(/\s+/).filter(x=>x.length>=4&&!/^(وزارة|هيئة|خدمة|منصة|نظام|اللائحة|المملكة|العربية|السعودية)$/.test(x)).slice(0,10);
const plainText=body=>String(body||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim();

function sourceType(s,url){
  const x=`${s.title||''} ${s.authority||''} ${url||''}`;
  if(legalHosts.some(h=>hostOf(url)===h)||/(^|\s)(نظام|لائحة|قواعد|تنظيم|مرسوم|قرار)(\s|$)|المادة\s*\d|LawDetails|الجريدة الرسمية/.test(x))return 'LEGAL_SOURCE';
  if(/\.pdf(?:$|\?)|\/Files\/Download|دليل|guide|handbook|إرشاد/i.test(x))return 'OFFICIAL_PROCEDURAL_GUIDE';
  if(/\/services?\/|\/eservices?\/|خدمة|طلب|إصدار|تجديد|شكوى|بلاغ/.test(x))return 'OFFICIAL_SERVICE_PAGE';
  if(regulatorNames.test(x))return 'REGULATOR_PAGE';
  return 'GENERAL_GOVERNMENT_INFORMATION';
}

async function request(url,method){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(url,{method,redirect:'follow',signal:controller.signal,headers:{'user-agent':'WeshBaed-OfficialSourceAudit/2.0','accept':'text/html,application/xhtml+xml,application/pdf,application/json;q=0.9,*/*;q=0.5',...(method==='GET'?{'range':'bytes=0-260000'}:{})}});
    let body='';if(method==='GET'&&/text|json|xml|html/.test(r.headers.get('content-type')||''))body=(await r.text()).slice(0,260000);
    return {ok:true,status:r.status,final_url:r.url,content_type:r.headers.get('content-type')||'',body,method,error:''};
  }catch(e){return {ok:false,status:0,final_url:url,error:e.name==='AbortError'?'TIMEOUT':String(e.message||e),content_type:'',body:'',method}}finally{clearTimeout(timer)}
}

async function requestBest(url){
  const head=await request(url,'HEAD');
  const headDocument=/pdf|msword|officedocument|octet-stream/i.test(head.content_type);
  if(head.ok&&head.status>=200&&head.status<400&&headDocument)return head;
  if(!head.ok||[400,401,403,405,406,408,409,425,429,500,501,502,503,504].includes(head.status)||head.status>=200&&head.status<400)return request(url,'GET');
  return head;
}

function relevanceFor(s,result){
  if(!result.body)return {status:/pdf|msword|officedocument|octet-stream/i.test(result.content_type)?'DOCUMENT_LINK_ONLY':'NOT_MACHINE_READABLE',hits:0,keys:significant(s.title)};
  const plain=plainText(result.body);const keys=significant(s.title);const hits=keys.filter(k=>plain.includes(k)).length;
  return {status:keys.length===0?'NEEDS_MANUAL_CONTENT_CHECK':hits>=Math.min(2,keys.length)?'LIKELY_RELEVANT':'NEEDS_MANUAL_CONTENT_CHECK',hits,keys};
}

function detectSoftError(body){
  return /<(?:title|h1)[^>]*>[^<]*(?:404|not found|page not found|الصفحة غير موجودة|تعذر العثور|عفوًا[^<]*غير موجود)/i.test(String(body||'').slice(0,120000));
}

function documentHint(url,contentType){return /\.pdf(?:$|[?#])|\.docx?(?:$|[?#])|\/Files\/Download/i.test(url)||/pdf|msword|officedocument|octet-stream/i.test(contentType)}
function loginHint(result,relevance){
  const u=result.final_url||'';if(result.status===401)return true;
  if(/\/(login|signin|sso|oauth|auth)(?:\/|\?|$)/i.test(u))return true;
  const p=plainText(result.body).slice(0,3000);return relevance.hits===0&&/(تسجيل الدخول|الدخول عبر النفاذ الوطني|sign in|log in)/i.test(p)&&p.length<1500;
}
function javascriptHint(result,relevance){
  if(!(result.status>=200&&result.status<400)||!result.body)return false;
  const p=plainText(result.body);return relevance.hits===0&&(/enable javascript|javascript is required|يجب تفعيل جافا|يتطلب جافا سكربت/i.test(p)||(p.length<500&&/<(?:div|main)[^>]+id=["'](?:root|app)["']/i.test(result.body)));
}

async function check(s){
  const url=s.url||'';let result={ok:false,status:0,final_url:url,error:'NO_URL',content_type:'',body:'',method:''};
  if(url)result=await requestBest(url);
  let redirected=false,https=false,finalOfficial=false;
  try{https=new URL(url).protocol==='https:';redirected=Boolean(result.final_url&&decodeURI(result.final_url)!==decodeURI(url));finalOfficial=isOfficial(result.final_url||url)}catch{}
  const relevance=relevanceFor(s,result);const isDocument=documentHint(result.final_url||url,result.content_type);const softError=detectSoftError(result.body);
  let classification='BLOCKED_FROM_AUTOMATED_CHECK',reason='تعذر الفحص الآلي دون دليل على كسر الرابط.';
  if(s.status==='superseded'||s.status==='repealed'){classification='SUPERSEDED';reason='بيانات المصدر داخل المشروع تصفه بأنه مستبدل/ملغى.'}
  else if([404,410].includes(result.status)||softError){classification='BROKEN';reason=softError?`استجابة HTTP ${result.status||200} تعرض صفحة خطأ صريحة.`:`الرابط أعاد HTTP ${result.status}.`}
  else if(!https||!finalOfficial){classification='REQUIRES_LEGAL_REVIEW';reason=!https?'الرابط ليس HTTPS؛ يلزم اعتماد بديل رسمي قبل الاستعمال.':'تعذر إثبات الصفة الرسمية للنطاق النهائي؛ لا يستبدل آليًا.'}
  else if(loginHint(result,relevance)){classification='LOGIN_REQUIRED';reason=`الوصول إلى المحتوى يتطلب تسجيل دخول${result.status?` (HTTP ${result.status})`:''}.`}
  else if(javascriptHint(result,relevance)){classification='JAVASCRIPT_REQUIRED';reason='الصفحة الرسمية استجابت، لكن المحتوى المقصود يحتاج JavaScript ولا يمكن التحقق منه من HTML الخام.'}
  else if(isDocument&&(!result.status||(result.status>=200&&result.status<400)||[403,429].includes(result.status))){classification='PDF_OR_DOCUMENT';reason=result.status>=200&&result.status<400?'رابط وثيقة رسمية استجاب؛ يلزم فتح الوثيقة للتحقق من مضمونها.':`الرابط وثيقة رسمية لكن الوصول الآلي تعذر${result.error?` (${result.error})`:result.status?` (HTTP ${result.status})`:''}.`}
  else if(!result.ok||result.status===0||[403,408,425,429].includes(result.status)||result.status>=500){classification='BLOCKED_FROM_AUTOMATED_CHECK';reason=result.status?`المصدر الرسمي منع/قيّد الفحص أو أعاد عطلًا مؤقتًا (HTTP ${result.status})؛ لا يعد رابطًا مكسورًا.`:`تعذر الاتصال الآلي بالمصدر الرسمي (${result.error||'NETWORK_ERROR'})؛ لا يعد رابطًا مكسورًا.`}
  else if(result.status>=200&&result.status<400){
    const originalPath=(()=>{try{return new URL(url).pathname}catch{return ''}})();const finalPath=(()=>{try{return new URL(result.final_url).pathname}catch{return ''}})();
    const homeLanding=redirected&&originalPath!=='/'&&/^\/?(?:ar|en)?\/?$/.test(finalPath)&&relevance.status!=='LIKELY_RELEVANT';
    if(homeLanding){classification='BLOCKED_FROM_AUTOMATED_CHECK';reason='الرابط انتهى إلى الصفحة الرئيسية دون دليل آلي كافٍ على بقاء المحتوى المقصود.'}
    else{classification=redirected?'REDIRECTED':'ACTIVE';reason=redirected?'الرابط انتقل إلى عنوان رسمي وما زال مرتبطًا تقنيًا بالمصدر.':'الرابط يعمل على HTTPS ونطاق رسمي.'}
  }else{classification='BLOCKED_FROM_AUTOMATED_CHECK';reason=`استجابة غير حاسمة HTTP ${result.status||'NONE'}؛ يلزم فحص يدوي.`}

  const affected=(resultsBySource[s.source_id]||[]).map(r=>r.result_id);
  const manual=['BLOCKED_FROM_AUTOMATED_CHECK','JAVASCRIPT_REQUIRED','LOGIN_REQUIRED'].includes(classification)||relevance.status==='NEEDS_MANUAL_CONTENT_CHECK';
  return {source_id:s.source_id,title:s.title||'',authority:s.authority||'',source_type:sourceType(s,result.final_url||url),original_url:url,final_url:result.final_url||url,official_domain:hostOf(result.final_url||url),official_domain_verified:finalOfficial?'YES':'NO',http_status:result.status||'',access_status:result.status?`HTTP_${result.status}`:(result.error||'NO_RESPONSE'),response_method:result.method||'',content_type:result.content_type||'',https:https?'YES':'NO',redirected:redirected?'YES':'NO',verification_status:classification,classification,relation_check:relevance.status,keyword_hits:relevance.hits,notes:reason,reason,verification_date:checkedDate,checked_at:checkedAt,last_verified:s.last_verified||'',manual_check_required:manual?'YES':'NO',legal_review_required:classification==='REQUIRES_LEGAL_REVIEW'?'YES':'NO',affected_results:affected.join(' | '),affected_count:affected.length};
}

const esc=v=>`"${String(v??'').replaceAll('"','""').replaceAll('\n',' ')}"`;
const toCsv=(rows,headers)=>[headers,...rows.map(x=>headers.map(h=>x[h]))].map(r=>r.map(esc).join(',')).join('\n');
const countBy=(rows,key)=>Object.fromEntries(Object.entries(Object.groupBy(rows,x=>x[key])).map(([k,v])=>[k,v.length]));

function writeCleanupReport(out,counts){
  const replacementsFile='docs/non-legal-hardening/source-replacements.csv';
  const replacements=fs.existsSync(replacementsFile)?fs.readFileSync(replacementsFile,'utf8').trim():'لا توجد تغييرات موثقة.';
  const list=status=>out.filter(x=>x.classification===status).map(x=>`- ${x.source_id}: ${x.original_url}${x.final_url&&x.final_url!==x.original_url?` → ${x.final_url}`:''} — ${x.reason}`).join('\n')||'- لا يوجد.';
  const special=/EXEC|PLEAD|COMMERCIAL-COURTS|PERSONAL-STATUS|EVIDENCE|CIVIL-TRANSACTIONS|ARBITRATION|JUDICIAL-COSTS|ADMIN|BOG|LABOR|IP|BANK|FIN|INS|CMA/;
  const specialRows=out.filter(x=>special.test(x.source_id)).map(x=>`- ${x.source_id} — ${x.source_type} — ${x.classification} — ${x.original_url}`).join('\n');
  const report=`# SOURCE_CLEANUP_REPORT\n\nتاريخ الفحص: ${checkedAt}\n\nالحالة القانونية: **PRE-LEGAL REVIEW COMPLETE — AWAITING LICENSED SAUDI LAWYER APPROVAL**\n\nهذا فحص تقني للمصدر والرابط والنطاق. لا يعتمد السريان أو التفسير القانوني ولا يغيّر أيًا من القرارات القانونية الـ59.\n\n## الملخص\n\n- Total Sources: ${out.length}\n${Object.entries(counts).sort().map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n- Manual check required: ${out.filter(x=>x.manual_check_required==='YES').length}\n- Requires licensed-lawyer review: ${out.filter(x=>x.legal_review_required==='YES').length}\n\n## تغييرات الروابط الرسمية الموثقة\n\n\`\`\`csv\n${replacements}\n\`\`\`\n\n## BROKEN\n\n${list('BROKEN')}\n\n## REDIRECTED\n\n${list('REDIRECTED')}\n\n## BLOCKED_FROM_AUTOMATED_CHECK\n\n${list('BLOCKED_FROM_AUTOMATED_CHECK')}\n\n## JAVASCRIPT_REQUIRED\n\n${list('JAVASCRIPT_REQUIRED')}\n\n## LOGIN_REQUIRED\n\n${list('LOGIN_REQUIRED')}\n\n## PDF_OR_DOCUMENT\n\n${list('PDF_OR_DOCUMENT')}\n\n## REQUIRES_LEGAL_REVIEW\n\n${list('REQUIRES_LEGAL_REVIEW')}\n\n## فحص خاص للمصادر النظامية والتنظيمية الحساسة\n\n${specialRows||'- لا يوجد.'}\n\n## ضوابط التطبيق\n\n- HTTP 403/429 أو TIMEOUT لا يصنف BROKEN تلقائيًا.\n- HTTP 200 لا يكفي وحده؛ تسجل صفحة الخطأ الناعم أو التحويل للصفحة الرئيسية كحالة تحتاج تحققًا.\n- صفحة الخدمة لا تعامل كنص نظامي؛ حقل source_type يفصل LEGAL_SOURCE عن OFFICIAL_SERVICE_PAGE وبقية الأنواع.\n- لا يطبق نظام جديد أو انتقال تشريعي من خلال هذا الفحص؛ تسجل الحالة للمحامي.\n`;
  fs.writeFileSync('docs/SOURCE_CLEANUP_REPORT.md',report);
}

async function main(){
  const out=new Array(sources.length);let next=0;
  const workers=Array.from({length:32},async()=>{while(true){const i=next++;if(i>=sources.length)return;out[i]=await check(sources[i]);if(i%40===0)process.stderr.write(`checked ${i+1}/${sources.length}\n`);await sleep(10)}});
  await Promise.all(workers);
  out.sort((x,y)=>x.classification.localeCompare(y.classification)||x.source_id.localeCompare(y.source_id));
  const headers=Object.keys(out[0]);const csv=toCsv(out,headers);
  fs.mkdirSync('docs/LAWYER_FINAL_REVIEW_PACKET',{recursive:true});
  fs.writeFileSync('docs/LAWYER_FINAL_REVIEW_PACKET/06_SOURCE_LINK_AUDIT.csv',csv);
  fs.writeFileSync('docs/SOURCE_LINK_AUDIT.csv',csv);
  const counts=countBy(out,'classification');
  const meta={checked_at:checkedAt,total:out.length,counts,broken:out.filter(x=>x.classification==='BROKEN').map(x=>x.source_id),superseded:out.filter(x=>x.classification==='SUPERSEDED').map(x=>x.source_id),blocked_from_automated_check:counts.BLOCKED_FROM_AUTOMATED_CHECK||0,javascript_required:counts.JAVASCRIPT_REQUIRED||0,login_required:counts.LOGIN_REQUIRED||0,pdf_or_document:counts.PDF_OR_DOCUMENT||0,requires_legal_review:counts.REQUIRES_LEGAL_REVIEW||0,manual_check_required:out.filter(x=>x.manual_check_required==='YES').length};
  fs.writeFileSync('docs/LAWYER_FINAL_REVIEW_PACKET/source-link-audit-summary.json',JSON.stringify(meta,null,2));
  writeCleanupReport(out,counts);
  console.log(JSON.stringify(meta,null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
