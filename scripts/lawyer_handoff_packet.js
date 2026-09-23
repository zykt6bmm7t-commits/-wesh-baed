const fs=require('fs');
const path=require('path');

const parseCsv=s=>{const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i],n=s[i+1];if(quoted){if(c==='"'&&n==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(c!=='\r')cell+=c}row.push(cell);if(row.some(Boolean))rows.push(row);return rows};
const toObjects=raw=>{const rows=parseCsv(raw),h=rows.shift();return rows.map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]||''])))};
const esc=v=>`"${String(v??'').replaceAll('"','""').replaceAll('\n',' ')}"`;
const csv=(rows,headers)=>[headers,...rows.map(x=>headers.map(h=>x[h]||''))].map(r=>r.map(esc).join(',')).join('\n');
const md=s=>String(s||'—').replaceAll('|','/').replace(/\s+/g,' ').trim();

const master=toObjects(fs.readFileSync('docs/LEGAL_APPROVAL_MASTER.csv','utf8'));
const html=fs.readFileSync('index.html','utf8'),a=html.indexOf('const DB=')+9,b=html.indexOf(';\nconst ',a),db=JSON.parse(html.slice(a,b));
const resultMap=db.results,sourceMap=db.sources;
const root='docs/LAWYER_FINAL_REVIEW_PACKET';
fs.mkdirSync(path.join(root,'03_HIGH_BY_SPECIALTY'),{recursive:true});
let sourceAudit=[];try{sourceAudit=toObjects(fs.readFileSync(path.join(root,'06_SOURCE_LINK_AUDIT.csv'),'utf8'))}catch{}
const sourceStatus=Object.fromEntries(sourceAudit.map(x=>[x.source_id,x]));

function specialty(row){
  const id=row['Result ID'],sector=row['القطاع'];
  if(/IP-/.test(id))return ['L','الملكية الفكرية'];
  if(/FAM|CUSTODY|VISIT|DIVORCE|KHULA|MAINT|MARRIAGE|HEIR|ESTATE|WILL/.test(id))return ['C','الأحوال الشخصية'];
  if(/EXEC/.test(id)||/تنفيذ/.test(`${row['الخدمة/المنصة']} ${row['وش تسوي الآن؟']}`))return ['B','التنفيذ'];
  if(/COMM-|COMPANY|PARTNER|ARBIT/.test(id))return ['D','التجاري والشركات'];
  if(/LABOR|DOMESTIC|GOSI/.test(id))return ['E','العمالي'];
  if(/ADMIN|GOV-EMPLOYEE|BOG/.test(id))return ['F','الإداري وديوان المظالم'];
  if(/BANK|FIN|CMA|CRSD/.test(id))return ['G','البنوك والتمويل'];
  if(/INS/.test(id))return ['H','التأمين'];
  if(/REAL|RENT|LEASE|EJAR/.test(id))return ['I','العقار والإيجار'];
  if(/CST|TELECOM/.test(id))return ['J','الاتصالات'];
  if(/ZATCA|VAT|TAX|CUSTOM/.test(id))return ['K','الزكاة والضريبة'];
  if(/COURT|JUDGMENT|PROC|CASE|NAJIZ|CIVIL|EVID/.test(id)||sector.includes('القضاء'))return ['A','القضاء العام والمرافعات'];
  return ['M','القطاعات التنظيمية الأخرى'];
}

function decisionTopic(row){
  const id=row['Result ID'],q=row['السؤال المحدد للمحامي'],law=row['النظام']||row['اللائحة']||'';
  if(id==='R-GOV-EMPLOYEE-ADMIN')return ['اختصاص الموظف الحكومي','فصل الخاضع لنظام العمل عن المدني/العسكري'];
  if(/IP-/.test(id))return ['إنفاذ الملكية الفكرية','شكوى الهيئة مقابل الدعوى/التعويض/تنفيذ الحكم'];
  if(/ARBIT/.test(id))return ['التحكيم','البطلان والتنفيذ والاختصاص والمهلة'];
  if(/FAM|CUSTODY|VISIT/.test(id)&&/رسوم|تكاليف|إعفاء|استثناء/.test(`${row['الرسوم']} ${q}`))return ['تكاليف الأحوال الشخصية','نطاق الإعفاء في الدعوى وطلبات التنفيذ'];
  if(/EXEC/.test(id)||/تنفيذ/.test(row['الخدمة/المنصة']))return ['التنفيذ','دعوى أم طلب أم منازعة وأثر نظام التنفيذ الجديد'];
  if(/ADMIN|GOV-EMPLOYEE/.test(id))return ['القضاء الإداري','التظلم السابق والاختصاص والمدة'];
  if(/COMM-/.test(id))return ['الاختصاص التجاري','المادة 16 والإخطار السابق وعدم سماع الدعوى'];
  if(/اعتراض|استئناف|نقض|التماس|بطلان|تظلم/.test(`${row['الخدمة/المنصة']} ${row['المدة']} ${q}`))return ['طرق الاعتراض والمدد',law||'تحديد النظام الإجرائي المطبق'];
  if(/محكمة|اختصاص|الجهة/.test(q))return ['الاختصاص والجهة',law||specialty(row)[1]];
  if(/رسوم|تكاليف|إعفاء/.test(`${row['الرسوم']} ${q}`))return ['التكاليف القضائية',specialty(row)[1]];
  if(/مدة|فوات|سقوط|لا تسمع/.test(`${row['المدة']} ${q}`))return ['المدد النظامية',law||specialty(row)[1]];
  if(row['تصنيف التحقق']==='STALE RISK')return ['التحديث النظامي والتشغيلي',row['الخدمة/المنصة']||specialty(row)[1]];
  return ['اعتماد الصياغة والمصدر',law||specialty(row)[1]];
}

const reviewRows=master.filter(r=>['CRITICAL','HIGH'].includes(r['مستوى الخطورة القانونية']));
const keyed=new Map();
for(const row of reviewRows){const [code,spec]=specialty(row),[topic,sub]=decisionTopic(row);const key=[code,topic,sub,row['السؤال المحدد للمحامي']].join('|');if(!keyed.has(key))keyed.set(key,{code,spec,topic,sub,question:row['السؤال المحدد للمحامي'],rows:[]});keyed.get(key).rows.push(row)}
const groups=[...keyed.values()].sort((x,y)=>x.code.localeCompare(y.code)||Math.max(...y.rows.map(r=>r['مستوى الخطورة القانونية']==='CRITICAL'?2:1))-Math.max(...x.rows.map(r=>r['مستوى الخطورة القانونية']==='CRITICAL'?2:1))||y.rows.length-x.rows.length);
groups.forEach((g,i)=>g.id=`LD-${String(i+1).padStart(3,'0')}`);
const groupForResult={};for(const g of groups)for(const r of g.rows)groupForResult[r['Result ID']]=g.id;

function sourceText(r){
  const checks=r.legal_accuracy_audit?.checks;
  const notes=Array.isArray(checks)?checks.filter(x=>[12,13,14,15,16,17,18].includes(x.n)).map(x=>`${x.item}: ${x.note}`).join(' | '):'';
  return [r.rule_ref,typeof r.relevant_articles==='string'?r.relevant_articles:JSON.stringify(r.relevant_articles||''),typeof r.legal_articles==='string'?r.legal_articles:JSON.stringify(r.legal_articles||''),r.legal_basis,notes].filter(Boolean).join(' | ')||'لا يوجد نص حرفي مثبت داخل قاعدة المشروع؛ يلزم فتح المصدر الرسمي ومطابقة الحكم.';
}
function alternatives(row){const id=row['Result ID'];if(/EXEC/.test(id))return 'طلب داخل ملف التنفيذ / منازعة تنفيذ / دعوى موضوعية مستقلة / انتظار نفاذ النظام الجديد بحسب الأحكام الانتقالية.';if(/ADMIN/.test(id))return 'تظلم وجوبي ثم دعوى / دعوى مباشرة عند الاستثناء / اختصاص جهة أو لجنة خاصة.';if(/COMM-|COMPANY/.test(id))return 'محكمة تجارية / محكمة عامة / لجنة خاصة / تنفيذ سند / تحكيم بحسب العلاقة والمستند.';if(/IP-/.test(id))return 'شكوى إنفاذ لدى الهيئة / طعن في قرار اللجنة / دعوى تعويض / تنفيذ حكم نهائي.';if(/FAM|CUSTODY|VISIT/.test(id))return 'دعوى إنشاء أو تعديل الحق / طلب داخل قضية / تنفيذ سند قائم / منازعة تنفيذ.';return 'اعتماد النص الحالي / تقييده باستثناء / تقسيم النتيجة بحسب الوقائع / إحالتها لمراجعة بشرية.'}

const critical=master.filter(r=>r['مستوى الخطورة القانونية']==='CRITICAL');
const criticalDoc=['# 02_CRITICAL_28','',`عدد البطاقات: ${critical.length}`,'','> لا تعني أي معالجة حالية اعتمادًا قانونيًا. اختر قرارًا واحدًا وسجّل ملاحظاتك.',''];
for(const row of critical){const r=resultMap[row['Result ID']]||{},s=sourceMap[r.source_id]||{},sa=sourceStatus[r.source_id]||{};const specCode=specialty(row)[0];const execution=specCode==='B'||(specCode==='C'&&/تنفيذ/.test(`${r.procedure_type||''} ${r.service||''}`));criticalDoc.push(
  `## ${row['Result ID']} — ${groupForResult[row['Result ID']]||'UNASSIGNED'}`,'',
  `- **القطاع:** ${row['القطاع']}`,
  `- **المسار:** ${row['السؤال/المسار الذي يصل إليه']}`,
  `- **وصف الحالة:** ${row['وضعك باختصار']}`,
  `- **النص الحالي للعميل:** ${row['وش تسوي الآن؟']}`,
  `- **سبب CRITICAL:** ${row['سبب مستوى الخطورة']}`,
  `- **النقطة المطلوب حسمها:** ${row['السؤال المحدد للمحامي']}`,
  `- **النظام:** ${row['النظام']||'—'}`,
  `- **اللائحة:** ${row['اللائحة']||'—'}`,
  `- **المواد المحتملة:** ${row['المادة/المواد']||'—'}`,
  `- **النص الرسمي المرتبط:** ${sourceText(r)}`,
  `- **المصدر الرسمي:** ${row['المصدر الرسمي']}`,
  `- **الرابط:** ${row['رابط المصدر']}`,
  `- **آخر تحقق:** ${row['تاريخ آخر تحقق']||'—'}`,
  `- **صلاحية المصدر آليًا:** ${sa.classification||'PENDING LINK AUDIT'}${sa.http_status?` — HTTP ${sa.http_status}`:''}`,
  `- **نظام جديد منشور ولم ينفذ:** ${execution?'نعم — نظام التنفيذ المنشور في 2026؛ يثبت المحامي تاريخ النفاذ والانطباق.':'لم يرصد آليًا'}`,
  `- **الأحكام الانتقالية:** ${execution?'تحتاج بحثًا واعتمادًا بشريًا قبل تعديل النتيجة.':'غير مرصودة في بيانات النتيجة الحالية.'}`,
  `- **المعالجة الحالية في وش بعد؟:** ${row['تصنيف التحقق']} — ${row['سبب تصنيف التحقق']}`,
  `- **البدائل القانونية:** ${alternatives(row)}`,
  `- **السؤال المحدد جدًا للمحامي:** ${row['السؤال المحدد للمحامي']}`,'',
  '- [ ] Approved','- [ ] Needs Change','- [ ] Needs Further Research','','**Lawyer Notes:**','____________________',''
)}
fs.writeFileSync(path.join(root,'02_CRITICAL_28.md'),criticalDoc.join('\n'));

const labels={A:'القضاء العام والمرافعات',B:'التنفيذ',C:'الأحوال الشخصية',D:'التجاري والشركات',E:'العمالي',F:'الإداري وديوان المظالم',G:'البنوك والتمويل',H:'التأمين',I:'العقار والإيجار',J:'الاتصالات',K:'الزكاة والضريبة',L:'الملكية الفكرية',M:'القطاعات التنظيمية الأخرى'};
const high=master.filter(r=>r['مستوى الخطورة القانونية']==='HIGH');
for(const code of Object.keys(labels)){const rows=high.filter(r=>specialty(r)[0]===code);const gs=groups.filter(g=>g.code===code&&g.rows.some(r=>r['مستوى الخطورة القانونية']==='HIGH'));const lines=[`# ${code}. ${labels[code]}`,'',`HIGH Results: ${rows.length}`,'',`Legal Decisions: ${gs.length}`,''];for(const g of gs){const affected=g.rows.filter(r=>r['مستوى الخطورة القانونية']==='HIGH');if(!affected.length)continue;lines.push(`## ${g.id} — ${g.topic}`,'',`- **المسألة المشتركة:** ${g.sub}`,`- **السؤال القانوني:** ${g.question}`,`- **Results المتأثرة (${affected.length}):** ${affected.map(r=>r['Result ID']).join('، ')}`,'','| Result ID | الحالة | الإجراء الحالي | المدة | الرسوم | التحقق |','|---|---|---|---|---|---|',...affected.map(r=>`| ${r['Result ID']} | ${md(r['وضعك باختصار'])} | ${md(r['وش تسوي الآن؟'])} | ${md(r['المدة'])} | ${md(r['الرسوم'])} | ${r['تصنيف التحقق']} |`),'','- [ ] Approved for all listed Results','- [ ] Needs per-Result changes','- [ ] Needs Further Research','- **Approved wording / rule:**','- **Lawyer Notes:**','')}
  fs.writeFileSync(path.join(root,'03_HIGH_BY_SPECIALTY',`${code}_${labels[code].replaceAll(' ','_')}.md`),lines.join('\n'));
}

const decisionRows=groups.map(g=>{const all=g.rows,first=all[0],laws=[...new Set(all.map(r=>r['النظام']).filter(Boolean))].join(' | '),arts=[...new Set(all.map(r=>r['المادة/المواد']).filter(Boolean))].join(' | '),sources=[...new Set(all.map(r=>r['رابط المصدر']).filter(Boolean))].join(' | '),risk=all.some(r=>r['مستوى الخطورة القانونية']==='CRITICAL')?'CRITICAL':'HIGH';return {
  'Decision ID':g.id,'الموضوع':`${g.topic} — ${g.sub}`,'التخصص':g.spec,'Results المتأثرة':all.map(r=>r['Result ID']).join(' | '),'عدد Results':all.length,'السؤال القانوني':g.question,'النظام':laws,'المادة':arts,'المصدر الرسمي':sources,'الوضع الحالي':[...new Set(all.map(r=>r['تصنيف التحقق']))].join(' | '),'مستوى الخطورة':risk,'Recommendation from audit':'لا تعدّل آليًا؛ اعتمد قاعدة واحدة ثم طبّقها على جميع Results المرتبطة.','Lawyer Decision':'','Approved wording':'','Date approved':'','Lawyer name / reference':'','Requires future monitoring?':all.some(r=>r['تصنيف التحقق']==='STALE RISK')?'YES':'NO','Review date':''
}});
const decisionHeaders=Object.keys(decisionRows[0]);fs.writeFileSync(path.join(root,'04_LEGAL_DECISION_REGISTER.csv'),csv(decisionRows,decisionHeaders));

function staleCategory(r){const id=r['Result ID'],x=`${r['الخدمة/المنصة']} ${r['الرسوم']} ${r['المدة']}`;if(/EXEC/.test(id)||/نظام جديد|تنفيذ/.test(r['سبب تصنيف التحقق']))return 'F. نظام جديد منشور ولم يدخل حيز النفاذ';if(/رسوم|تكاليف|ريال/.test(r['الرسوم']))return 'C. رسوم قابلة للتغيير';if(/منصة|رابط|ناجز|أبشر/.test(x))return 'E. رابط/منصة قابلة للتغيير';if(/مدة|يوم|شهر|إجراء/.test(`${r['المدة']} ${r['وش تسوي الآن؟']}`))return 'D. مدة أو إجراء تنظيمي قابل للتغيير';if(/خدمة/.test(x))return 'B. خدمة إلكترونية قابلة للتغيير';return 'A. نظام أو لائحة ستتغير'}
const stale=master.filter(r=>r['تصنيف التحقق']==='STALE RISK');const monitorGroups=Object.entries(Object.groupBy(stale,r=>`${staleCategory(r)}|${r['المصدر الرسمي']}|${r['رابط المصدر']}`)).map(([key,rows],i)=>{const [category,source,url]=key.split('|');const execution=category.startsWith('F.');return {'Monitor ID':`LCM-${String(i+1).padStart(3,'0')}`,'الفئة':category,'الموضوع':execution?'انتقال نظام التنفيذ 2026':source,'Results المتأثرة':rows.map(r=>r['Result ID']).join(' | '),'عدد Results':rows.length,'المصدر الرسمي':url,'الوضع الحالي':execution?'النظام السابق مطبق حتى ثبوت تاريخ نفاذ النظام الجديد وأحكامه الانتقالية.':'المعلومة مستخدمة حاليًا لكنها قابلة للتغيير.','تاريخ النشر':execution?'2026-05-01':'','تاريخ النفاذ':execution?'بعد 180 يومًا من النشر — يثبتها المحامي رسميًا':'','النظام القديم':execution?'نظام التنفيذ السابق وتعديلاته':'','النظام الجديد':execution?'نظام التنفيذ المنشور في أم القرى عام 2026':'','هل يلزم تعديل المشروع الآن؟':execution?'لا قبل ثبوت النفاذ والانطباق؛ جهّز تحديثًا مؤرخًا.':'لا، إلا عند تحقق Trigger.','Trigger for update':execution?'بلوغ تاريخ النفاذ ونشر اللائحة/الأحكام الانتقالية.':'تغير صفحة الخدمة أو الرسوم أو المدة أو الرابط الرسمي.','Last checked':'2026-09-23','Next review':execution?'2026-10-15':'2026-10-23'} });
const monitorHeaders=Object.keys(monitorGroups[0]);fs.writeFileSync(path.join(root,'05_STALE_RISK_REGISTER.csv'),csv(monitorGroups,monitorHeaders));

fs.copyFileSync('docs/LEGAL_APPROVAL_MASTER.csv',path.join(root,'07_RESULT_MASTER.csv'));
const checklist=`# 08_APPROVAL_CHECKLIST\n\nحالة المشروع: **PRE-LEGAL REVIEW COMPLETE — AWAITING LICENSED SAUDI LAWYER APPROVAL**\n\n- [ ] الاختصاصات القضائية معتمدة\n- [ ] أنواع الإجراءات معتمدة\n- [ ] المحاكم معتمدة\n- [ ] خدمات ناجز معتمدة\n- [ ] التنفيذ معتمد\n- [ ] الاعتراضات والمدد معتمدة\n- [ ] الأحوال الشخصية معتمدة\n- [ ] الإداري معتمد\n- [ ] العمالي معتمد\n- [ ] التجاري معتمد\n- [ ] القطاعات التنظيمية معتمدة\n- [ ] المواد النظامية معتمدة\n- [ ] الرسوم معتمدة\n- [ ] التنبيهات القانونية معتمدة\n- [ ] إخلاء المسؤولية معتمد\n\n## Final Legal Approval\n\nName:\n\nLicense:\n\nDate:\n\nVersion:\n\nSignature/Approval Reference:\n`;
fs.writeFileSync(path.join(root,'08_APPROVAL_CHECKLIST.md'),checklist);
const sourceSummary=(()=>{try{return JSON.parse(fs.readFileSync(path.join(root,'source-link-audit-summary.json'),'utf8'))}catch{return {total:0,counts:{}}}})();
const topDecisions=[...groups].sort((a,b)=>Number(b.rows.some(r=>r['مستوى الخطورة القانونية']==='CRITICAL'))-Number(a.rows.some(r=>r['مستوى الخطورة القانونية']==='CRITICAL'))||b.rows.length-a.rows.length).slice(0,10);
const topDecisionLines=topDecisions.map((g,i)=>`${i+1}. **${g.id} — ${g.topic}:** ${g.question} (${g.rows.length} Results)`).join('\n');
const brief=`# 01_EXECUTIVE_BRIEF\n\n## حالة التسليم\n\n**PRE-LEGAL REVIEW COMPLETE — AWAITING LICENSED SAUDI LAWYER APPROVAL**\n\n- Results: 646\n- CRITICAL: ${critical.length}\n- HIGH: ${high.length}\n- Legal Decisions المجمعة: ${groups.length}\n- STALE RISK Results: ${stale.length}\n- Source links tested: ${sourceSummary.total||0}\n- Broken Sources: ${sourceSummary.counts?.BROKEN||0}\n- Superseded Sources: ${sourceSummary.counts?.SUPERSEDED||0}\n\n## أهم 10 قرارات للبدء\n\n${topDecisionLines}\n\n## طريقة المراجعة الأسرع\n\n1. راجع 02_CRITICAL_28 واتخذ قرارًا لكل بطاقة.\n2. استخدم 04_LEGAL_DECISION_REGISTER لاعتماد المسائل المشتركة مرة واحدة.\n3. انتقل إلى ملفات 03_HIGH_BY_SPECIALTY وطبّق القرار على كل Results المرتبطة.\n4. راجع 05_STALE_RISK_REGISTER قبل الإطلاق، خصوصًا انتقال نظام التنفيذ.\n5. أكمل 08_APPROVAL_CHECKLIST ولا تغيّر حالة المشروع إلى LEGALLY APPROVED قبل إدخال اسم المحامي وترخيصه ومرجع الاعتماد.\n\n> فحص الروابط يثبت حالة الوصول التقني والنطاق الرسمي وقت الفحص. أما السريان، والإحلال، وصلة المصدر بكل حكم قانوني فتظل ضمن قرار المحامي عند عدم وجود دلالة رسمية قطعية قابلة للتحقق آليًا.\n`;
fs.writeFileSync(path.join(root,'01_EXECUTIVE_BRIEF.md'),brief);
const metrics={generated_at:'2026-09-23',status:'PRE-LEGAL REVIEW COMPLETE — AWAITING LICENSED SAUDI LAWYER APPROVAL',critical:critical.length,high:high.length,legal_decisions:groups.length,stale_risk:stale.length,sources_tested:sourceSummary.total||0,source_counts:sourceSummary.counts||{},specialty_high_counts:Object.fromEntries(Object.entries(labels).map(([k])=>[k,high.filter(r=>specialty(r)[0]===k).length]))};
fs.writeFileSync(path.join(root,'lawyer-handoff-metrics.json'),JSON.stringify(metrics,null,2));
console.log(JSON.stringify(metrics,null,2));
