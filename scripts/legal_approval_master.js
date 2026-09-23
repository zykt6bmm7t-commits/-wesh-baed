const fs=require('fs');
const path=require('path');

const INPUT=process.argv[2]||'index.html';
const html=fs.readFileSync(INPUT,'utf8');
const start=html.indexOf('const DB=')+9;
const end=html.indexOf(';\nconst ',start);
if(start<9||end<0) throw new Error('DB payload not found');
const db=JSON.parse(html.slice(start,end));
const results=Object.values(db.results);
const sources=db.sources;
const today='2026-09-23';

const primaryDomains=['laws.boe.gov.sa','laws.moj.gov.sa','uqn.gov.sa','moj.gov.sa','bog.gov.sa','hrsd.gov.sa','saip.gov.sa','zatca.gov.sa','gov.sa'];
const liveCheckedTitles=[
  'نظام المرافعات أمام ديوان المظالم','نظام المحاكم التجارية','نظام التكاليف القضائية','اللائحة التنفيذية لنظام التكاليف القضائية',
  'نظام العمل','نظام التحكيم','نظام الأحوال الشخصية','نظام التنفيذ أمام ديوان المظالم','نظام المعاملات المدنية',
  'نظام حماية حقوق المؤلف','نظام براءات الاختراع','شكوى انتهاك حقوق المؤلف'
];

const text=v=>v==null?'':Array.isArray(v)?v.map(text).filter(Boolean).join(' | '):typeof v==='object'?JSON.stringify(v):String(v);
const allText=r=>Object.values(r).filter(v=>typeof v==='string').join(' ');
const official=s=>{try{return primaryDomains.some(d=>new URL(s?.url||'').hostname.endsWith(d))}catch{return false}};
const normative=s=>/(نظام|لائحة|قواعد|تنظيم|قرار)/.test(`${s?.title||''} ${s?.authority||''}`);
const liveChecked=s=>liveCheckedTitles.some(x=>(s?.title||'').includes(x));

function sector(r){
  const id=r.result_id;
  const map=[
    [/PASSPORT|TRAFFIC|CIVIL-FAMILY-RECORD/,'الخدمات الحكومية والهوية والجوازات والمرور'],
    [/FAM|CUSTODY|VISIT|DIVORCE|KHULA|MAINT|MARRIAGE|HEIR|ESTATE|WILL/,'الأحوال الشخصية والتركات'],
    [/EXEC|JUDGMENT|CASE|NAJIZ|PROC|COURT|EVID/,'القضاء والتنفيذ وناجز'],
    [/ADMIN|GOV|BOG/,'القضاء الإداري والموظف الحكومي'],
    [/LABOR|DOMESTIC|GOSI/,'العمل والتأمينات'],
    [/COMM-|COMPANY|PARTNER|ARBIT|IP-/,'التجاري والشركات والتحكيم والملكية الفكرية'],
    [/BANK|FIN|INS|CMA|CRSD/,'البنوك والتمويل والتأمين والسوق المالية'],
    [/REAL|RENT|LEASE|EJAR/,'العقار والإيجار'],
    [/ZATCA|VAT|TAX|CUSTOM/,'الزكاة والضريبة والجمارك'],
    [/PRIVACY|DATA/,'حماية البيانات'],
    [/CST|TELECOM|ELECTRIC|WATER|AIR|HEALTH|EDU|PASSPORT|TRAFFIC|CONSUMER|ECOM/,'القطاعات التنظيمية والخدمات'],
    [/CRIM|FRAUD|DV-/,'الجزائي والحماية'],
    [/CIVIL|SALE|CONTRACT|LOAN|GIFT|AGENCY|DEPOSIT|GUARANTEE|TORT/,'المعاملات المدنية'],
    [/DOC|DIGITAL|SAKANI|SS-/,'الخدمات الحكومية والتوثيق']
  ];
  return map.find(([re])=>re.test(id))?.[1]||r.domain||'عام ومتعدد القطاعات';
}

function shortestPaths(){
  const q=[{id:db.start,trail:[]}],seen=new Set(),out={};
  while(q.length){const cur=q.shift();if(seen.has(cur.id))continue;seen.add(cur.id);const node=db.nodes[cur.id];if(!node)continue;
    for(const o of db.options[cur.id]||[]){const step=`${cur.id}: ${node.ui_question_text||node.text} ← ${o.label}`;const trail=[...cur.trail,step];
      if(db.results[o.next_id]&&!out[o.next_id])out[o.next_id]=trail;
      else if(db.nodes[o.next_id]&&!seen.has(o.next_id))q.push({id:o.next_id,trail});
    }
  }
  return out;
}
const paths=shortestPaths();

const criticalIds=new Set([
  'R-GOV-EMPLOYEE-ADMIN','R-ADMIN-SERVICE-RIGHTS','R-ADMIN-CANCEL-DECISION','R-ADMIN-COMPENSATION','R-ADMIN-GOV-CONTRACT',
  'R-ADMIN-APPEAL-DEADLINE','R-COMM-COURT','R-COMM-JURISDICTION-DEEP','R-COMM-PARTNERS-DISPUTE','R-COMM-ARBITRATION-ANNUL',
  'R-FAM-VISIT-EXEC','R-FAM-CUSTODY-LETTER','R-PROC-CASSATION-STAY','R-JUDGMENT-OBJECT','R-JUDGMENT-DEADLINE-REVIEW',
  'R-COMM-IP-SERVICE','R-COMM-IP-COPYRIGHT-ENFORCEMENT','R-COMM-IP-PATENT-ENFORCEMENT'
]);
const sensitiveId=/ADMIN|GOV-EMPLOYEE|COMM|ARBIT|IP-|EXEC|JUDGMENT|PROC|FAM|CUSTODY|VISIT|DIVORCE|KHULA|LABOR|CRIM|ZATCA|CMA|INS-DISPUTE/;
const deadlineTerms=/اعتراض|استئناف|نقض|التماس|بطلان|تظلم|لا تُ?سمع|سقوط|فوات|نهائي|مهلة|خلال \d|ثلاثين|ستين|تسعين/;
const jurisdictionTerms=/اختصاص|المحكمة|دعوى جديدة|طلب داخل|تنفيذ|سند تنفيذي|جهة الفصل/;
const dynamicTerms=/خدمة|منصة|ناجز|أبشر|ساعات|أيام عمل|رسوم الخدمة|SLA|فوري/;

function verification(r,s){
  const a=r.legal_accuracy_audit;
  const detailed=Array.isArray(a?.checks)&&a.checks.length>=20;
  const generic=typeof a?.checks==='number'||a?.status==='PASS';
  const combined=allText(r);
  const numericDeadline=Boolean(r.deadline)&&/(\d|يوم|شهر|سنة|مهلة|لا تُ?سمع|فوات|سقوط)/.test(r.deadline);
  const legalCosts=Boolean(r.costs)&&/(ريال|نسبة|%|معفى|إعفاء|تكاليف قضائية|استثناء)/.test(r.costs);
  const legalProcedure=/(دعوى|اعتراض|استئناف|نقض|التماس|تنفيذ|تظلم|بطلان|منازعة)/.test(`${r.procedure_type||''} ${r.result_type||''}`);
  const hasSensitiveClaim=numericDeadline||legalCosts||Boolean(r.court&&legalProcedure)||Boolean(r.relevant_articles||r.rule_ref);
  const isDynamic=dynamicTerms.test(`${r.service||''} ${r.platform||''} ${r.deadline||''} ${s?.title||''}`);
  const executionTransition=/EXEC/.test(r.result_id)||/تنفيذ/.test(`${r.procedure_type||''} ${r.service||''}`);
  if(!s?.url||!official(s))return ['HUMAN DECISION','المصدر غير موجود أو ليس على نطاق حكومي/رسمي يمكن الاعتماد عليه آليًا.'];
  if(executionTransition)return ['STALE RISK','نظام تنفيذ جديد نُشر في 2026 وسيحل محل النظام السابق بعد 180 يومًا؛ يلزم تثبيت تاريخ النفاذ وخطة تحديث النتيجة.'];
  if(!a&&hasSensitiveClaim)return ['HUMAN DECISION','تتضمن النتيجة اختصاصًا أو مدة أو رسومًا دون سجل تحقق قانوني تفصيلي.'];
  if(!a)return ['INFERENCE','النتيجة تحليل إجرائي مرتبط بمصدر رسمي، لكن لا يوجد تحقق قانوني Result-by-Result لها.'];
  if(detailed&&normative(s)&&liveChecked(s))return ['VERIFIED','تدقيق تفصيلي ومصدر نظامي أولي فُتح وتحقق من بقائه متاحًا في هذه المرحلة.'];
  if(detailed&&normative(s))return ['PARTIALLY VERIFIED','يوجد تدقيق تفصيلي ورابط لنص نظامي رسمي، لكن هذا النص بعينه لم يُعد فتحه ومطابقة جميع ادعاءات النتيجة في هذه المرحلة.'];
  if(detailed&&isDynamic&&!hasSensitiveClaim)return ['PROCEDURAL GUIDANCE','المصدر الرسمي يصف خدمة أو قناة تقديم؛ التفاصيل التشغيلية قابلة للتغيير.'];
  if(detailed&&!hasSensitiveClaim)return ['PROCEDURAL GUIDANCE','النتيجة إرشاد تشغيلي مدقق مقابل صفحة جهة رسمية، وليست حكمًا قانونيًا موضوعيًا.'];
  if(generic&&isDynamic&&!hasSensitiveClaim)return ['PROCEDURAL GUIDANCE','المرجع وصف خدمة رسمية، لا نصًا نظاميًا يحسم الحق أو الاختصاص.'];
  if(hasSensitiveClaim)return ['PARTIALLY VERIFIED','المصدر رسمي لكنه لا يثبت آليًا جميع عناصر الاختصاص/المدة/الرسوم المركبة في النتيجة.'];
  return ['PARTIALLY VERIFIED','المصدر رسمي والتغطية جزئية، لكن سجل التحقق ليس تفصيليًا بما يكفي لاعتماد النتيجة كاملة.'];
}

function risk(r,verificationClass){
  const combined=allText(r),id=r.result_id;
  const numericDeadline=Boolean(r.deadline)&&/(\d|يوم|شهر|سنة|مهلة|لا تُ?سمع|فوات|سقوط)/.test(r.deadline);
  const legalCosts=Boolean(r.costs)&&/(ريال|نسبة|%|معفى|إعفاء|تكاليف قضائية|استثناء)/.test(r.costs);
  const legalProcedure=/(دعوى|اعتراض|استئناف|نقض|التماس|تنفيذ|تظلم|بطلان|منازعة)/.test(`${r.procedure_type||''} ${r.result_type||''}`);
  const consequence=numericDeadline||legalCosts||Boolean(r.court&&legalProcedure)||sensitiveId.test(id);
  if(criticalIds.has(id)&&['HUMAN DECISION','INFERENCE','PARTIALLY VERIFIED','STALE RISK'].includes(verificationClass))return ['CRITICAL','خطأ محتمل قد يوجه لمحكمة/إجراء غير صحيح أو يفوّت مهلة؛ وهو من الحالات الحساسة المحددة للاعتماد.'];
  if(consequence&&['HUMAN DECISION','INFERENCE'].includes(verificationClass))return ['CRITICAL','ادعاء عالي الأثر دون تحقق رسمي مباشر كافٍ.'];
  if(consequence||criticalIds.has(id))return ['HIGH','النتيجة تمس الاختصاص أو طريق الاعتراض/التنفيذ أو مدة/رسومًا مؤثرة.'];
  if(['STALE RISK','PARTIALLY VERIFIED','PROCEDURAL GUIDANCE'].includes(verificationClass))return ['MEDIUM','معلومة إجرائية أو متغيرة أو مدعومة جزئيًا؛ الخطأ قابل للتدارك غالبًا لكنه يربك المستخدم.'];
  return ['LOW','نتيجة محدودة الأثر ومدعومة بمصدر رسمي دون مدة سقوط أو اختيار قضائي حاسم ظاهر.'];
}

function lawyerQuestion(r,level,verificationClass){
  const id=r.result_id,combined=allText(r);
  if(id==='R-GOV-EMPLOYEE-ADMIN')return 'ما الاختبار النظامي الذي يفصل خضوع الموظف الحكومي لنظام العمل عن الخدمة المدنية/العسكرية، وما الجهة المختصة لكل فرع؟';
  if(/ADMIN/.test(id))return 'هل التظلم السابق واجب؟ وما المدة وبدايتها وأثر فواتها والاستثناءات لهذه الحالة تحديدًا أمام ديوان المظالم؟';
  if(/COMM-/.test(id)&&!(/IP-/.test(id)))return 'هل تتحقق ولاية المحكمة التجارية وشروط الإخطار السابق ومدة عدم سماع الدعوى والحد المالي في هذه الوقائع؟';
  if(/ARBIT/.test(id))return 'هل الإجراء دعوى بطلان أم تنفيذ/رفض تنفيذ، وما المحكمة والمهلة وبدايتها في هذه الحالة؟';
  if(/IP-/.test(id))return 'هل المسار شكوى إنفاذ لدى الهيئة أم دعوى تعويض/طعن قضائي، وما الجهة والمهلة لكل مرحلة؟';
  if(/FAM|CUSTODY|VISIT/.test(id)&&r.costs)return 'هل استثناء الأحوال الشخصية من التكاليف يشمل هذا الطلب التنفيذي تحديدًا، وما الاستثناءات؟';
  if(/EXEC/.test(id))return 'هل الإجراء الصحيح طلب داخل ملف التنفيذ أم منازعة تنفيذ أم دعوى مستقلة، وما أثر نظام التنفيذ الجديد عند نفاذه؟';
  if(deadlineTerms.test(combined))return 'ما مقدار المدة وبدايتها ونهايتها والاستثناءات وأثر فواتها وفق النص المطبق على هذه الحالة؟';
  if(jurisdictionTerms.test(combined))return 'هل الجهة والمحكمة ونوع الإجراء المحددة صحيحة لكل صور الحالة والاستثناءات المحتملة؟';
  if(r.costs)return 'هل الرسم/الإعفاء المذكور منطبق على مقدم الطلب ونوع الطلب، وهل يوجد تعديل حديث؟';
  if(level==='LOW'&&verificationClass==='VERIFIED')return 'هل تعتمد النتيجة كما هي دون تعديل؟';
  return 'هل يدعم المصدر الرسمي جميع الادعاءات العملية في النتيجة، أم يلزم تقييدها أو تقسيمها؟';
}

function lawFields(r,s){
  const title=s?.title||'';
  const law=/(نظام[^—|]*)/.exec(`${r.rule_ref||''} ${title}`)?.[1]?.trim()||'';
  const regulation=/(اللائحة[^—|]*)/.exec(`${r.rule_ref||''} ${title}`)?.[1]?.trim()||'';
  const articles=[r.relevant_articles,r.legal_articles,r.rule_ref].map(text).filter(Boolean).join(' | ');
  return {law,regulation,articles};
}

const rows=results.map(r=>{
  const s=sources[r.source_id]||{};
  const [verificationClass,verificationReason]=verification(r,s);
  const [riskLevel,riskReason]=risk(r,verificationClass);
  const lf=lawFields(r,s);
  const lawyerRequired=['CRITICAL','HIGH'].includes(riskLevel)||['HUMAN DECISION','INFERENCE'].includes(verificationClass);
  const stability=verificationClass==='STALE RISK'||dynamicTerms.test(`${r.service||''} ${r.platform||''} ${s.title||''}`)?'قابلة للتغير':'ثابتة نظاميًا نسبيًا';
  return {
    'Result ID':r.result_id,
    'القطاع':sector(r),
    'السؤال/المسار الذي يصل إليه':(paths[r.result_id]||[]).join(' → '),
    'وضعك باختصار':r.ui_current_situation||r.current_situation||'',
    'وش تسوي الآن؟':r.ui_next_step||r.next_step||r.ui_action_required||r.action_required||'',
    'الجهة المختصة':r.authority||r.court_or_authority||'',
    'المحكمة إن وجدت':r.court||'',
    'الخدمة/المنصة':[r.service,r.platform,r.procedure_type].filter(Boolean).join(' | '),
    'المتطلبات':r.ui_requirements||r.requirements||'',
    'المستندات':r.documents||'',
    'المدة':r.deadline||'',
    'الرسوم':r.costs||r.judicial_costs||'',
    'الاعتراض':r.next_path||(/اعتراض|استئناف|نقض|تظلم/.test(allText(r))?(r.ui_what_happens_next||r.what_happens_next||'يحدد بحسب القرار'):'غير منطبق ظاهرًا'),
    'الخطوة التالية':r.ui_what_happens_next||r.what_happens_next||r.after_submission||'',
    'النظام':lf.law,
    'اللائحة':lf.regulation,
    'المادة/المواد':lf.articles,
    'المصدر الرسمي':[s.authority,s.title].filter(Boolean).join(' — '),
    'رابط المصدر':s.url||'',
    'تاريخ آخر تحقق':r.last_verified||s.last_verified||'',
    'الثبات':stability,
    'تصنيف التحقق':verificationClass,
    'سبب تصنيف التحقق':verificationReason,
    'مستوى الخطورة القانونية':riskLevel,
    'سبب مستوى الخطورة':riskReason,
    'هل تحتاج اعتماد محامٍ؟':lawyerRequired?'نعم':'اعتماد سريع',
    'السؤال المحدد للمحامي':lawyerQuestion(r,riskLevel,verificationClass),
    'Approved / Needs Change':'NEEDS REVIEW',
    'Lawyer Notes':'',
    '_score':{CRITICAL:4,HIGH:3,MEDIUM:2,LOW:1}[riskLevel],
    '_priority':criticalIds.has(r.result_id)?100:(/GOV-EMPLOYEE|ADMIN/.test(r.result_id)?90:/COMM-|ARBIT|IP-/.test(r.result_id)?80:/JUDGMENT|PROC|EXEC/.test(r.result_id)?70:/FAM|CUSTODY|VISIT/.test(r.result_id)?60:10)
  };
}).sort((a,b)=>b._score-a._score||b._priority-a._priority||a['القطاع'].localeCompare(b['القطاع'],'ar')||a['Result ID'].localeCompare(b['Result ID']));

fs.mkdirSync('docs/legal-approval',{recursive:true});
const headers=Object.keys(rows[0]).filter(k=>!k.startsWith('_'));
const csv=[headers,...rows.map(r=>headers.map(h=>r[h]))].map(row=>row.map(v=>`"${text(v).replaceAll('"','""').replaceAll('\r',' ').replaceAll('\n',' ')}"`).join(',')).join('\n');
fs.writeFileSync('docs/LEGAL_APPROVAL_MASTER.csv',csv);

const countBy=key=>Object.fromEntries(Object.entries(Object.groupBy(rows,r=>r[key])).map(([k,v])=>[k,v.length]));
const verificationCounts=countBy('تصنيف التحقق'),riskCounts=countBy('مستوى الخطورة القانونية');
const needsLawyer=rows.filter(r=>r['هل تحتاج اعتماد محامٍ؟']==='نعم').length;
const quick=rows.length-needsLawyer;
const top20=rows.slice(0,20);
const systemCounts={};for(const r of rows){for(const x of [r['النظام'],r['اللائحة']].filter(Boolean)){systemCounts[x]=(systemCounts[x]||0)+1}}
const topSystems=Object.entries(systemCounts).sort((a,b)=>b[1]-a[1]).slice(0,15);
const decisions=[...new Set(rows.filter(r=>r._score>=3).map(r=>r['السؤال المحدد للمحامي']))];
const summary=[
  '# LEGAL_APPROVAL_EXECUTIVE_SUMMARY','',`تاريخ الإعداد: ${today}`,'','> هذا تدقيق تحضيري داخل Work، وليس اعتمادًا قانونيًا. القرار النهائي للمحامي السعودي المرخص.','',
  '## الأعداد','',
  `- إجمالي Results: ${rows.length}`,
  ...['VERIFIED','PARTIALLY VERIFIED','PROCEDURAL GUIDANCE','INFERENCE','STALE RISK','HUMAN DECISION'].map(k=>`- ${k}: ${verificationCounts[k]||0}`),
  ...['CRITICAL','HIGH','MEDIUM','LOW'].map(k=>`- ${k}: ${riskCounts[k]||0}`),
  `- تحتاج المحامي فعلًا: ${needsLawyer}`,
  `- قابلة للاعتماد السريع: ${quick}`,'',
  '## أكثر 20 Result خطورة','',
  '| # | Result ID | القطاع | التحقق | الخطورة | سؤال المحامي |','|---:|---|---|---|---|---|',
  ...top20.map((r,i)=>`| ${i+1} | ${r['Result ID']} | ${r['القطاع']} | ${r['تصنيف التحقق']} | ${r['مستوى الخطورة القانونية']} | ${r['السؤال المحدد للمحامي'].replaceAll('|','/')} |`),
  '','## أكثر الأنظمة/اللوائح حضورًا في المراجعة','',
  ...topSystems.map(([k,v])=>`- ${k}: ${v} Result`),
  '','## القرارات التي يجب على المحامي حسمها','',...decisions.map(x=>`- ${x}`),
  '','## تنبيه تحديث قريب','',
  '- نُشر نظام تنفيذ جديد في أم القرى بتاريخ 1 مايو 2026، ونص على العمل به بعد 180 يومًا وإحلاله محل النظام السابق. لذلك صُنفت نتائج التنفيذ كـ STALE RISK حتى يثبت المحامي تاريخ النفاذ ويعتمد خطة التحويل.',
  '- الخدمات الإلكترونية والأسماء والمسارات التشغيلية تعامل كـ PROCEDURAL GUIDANCE وتحتاج تحققًا دوريًا حتى لو كانت صفحة الخدمة رسمية.',
  '','## منهج التصنيف','',
  '- VERIFIED لا يعني اعتماد المحامي؛ يعني وجود تدقيق تفصيلي ومرجع أولي رسمي يدعم جوهر الادعاء.',
  '- PARTIALLY VERIFIED يعني أن المصدر يدعم جزءًا من النتيجة، لا جميع تفاصيلها المركبة.',
  '- HUMAN DECISION يعني أن الحسم يعتمد على تفسير أو وقائع أو اختصاص لا ينبغي اعتماده آليًا.',
  '- جميع الصفوف تبدأ بحالة NEEDS REVIEW حتى يوقّع المحامي عليها.'
].join('\n');
fs.writeFileSync('docs/LEGAL_APPROVAL_EXECUTIVE_SUMMARY.md',summary);

const packet=[
  '# LEAD_LAWYER_PRIORITY_PACKET','',
  '> راجع الحالات بالترتيب. لا تنتقل إلى HIGH قبل حسم CRITICAL.','',
  `- CRITICAL: ${riskCounts.CRITICAL||0}`,
  `- HIGH: ${riskCounts.HIGH||0}`,
  `- نتائج تحتاج قرار محامٍ: ${needsLawyer}`,'',
  '## أول عشرين حالة','',
  ...top20.flatMap((r,i)=>[
    `### ${i+1}. ${r['Result ID']} — ${r['مستوى الخطورة القانونية']}`,'',
    `- القطاع: ${r['القطاع']}`,
    `- المسار: ${r['السؤال/المسار الذي يصل إليه']||'راجع سجل المسارات'}`,
    `- الوضع: ${r['وضعك باختصار']}`,
    `- الإجراء الحالي: ${r['وش تسوي الآن؟']}`,
    `- الجهة/المحكمة: ${r['الجهة المختصة']} ${r['المحكمة إن وجدت']?`/ ${r['المحكمة إن وجدت']}`:''}`,
    `- المدة: ${r['المدة']||'غير مذكورة'}`,
    `- الرسوم: ${r['الرسوم']||'غير مذكورة'}`,
    `- التحقق: ${r['تصنيف التحقق']} — ${r['سبب تصنيف التحقق']}`,
    `- المصدر: ${r['رابط المصدر']}`,
    `- السؤال المطلوب حسمه: ${r['السؤال المحدد للمحامي']}`,
    '- القرار: [ ] Approved  [ ] Needs Change',
    '- Lawyer Notes:',''
  ]),
  '## ترتيب المراجعة المقترح','',
  '1. الاختصاص وطريق الإجراء: دعوى/طلب داخل قضية/تنفيذ/منازعة تنفيذ.',
  '2. المدد وبدايتها والاستثناءات وأثر الفوات.',
  '3. الرسوم والإعفاءات، خصوصًا الأحوال الشخصية والتنفيذ.',
  '4. الإداري والموظف الحكومي والتجاري والتحكيم والملكية الفكرية.',
  '5. نتائج التنفيذ المتأثرة بالنظام الجديد قبل تاريخ نفاذه.'
].join('\n');
fs.writeFileSync('docs/legal-approval/LEAD_LAWYER_PRIORITY_PACKET.md',packet);

const meta={generated_at:today,input:INPUT,counts:{questions:Object.keys(db.nodes).length,options:Object.values(db.options).reduce((n,a)=>n+a.length,0),results:rows.length,sources:Object.keys(sources).length},verification:verificationCounts,risk:riskCounts,needs_lawyer:needsLawyer,quick_approval:quick,top20:top20.map(r=>r['Result ID'])};
fs.writeFileSync('docs/legal-approval/legal-approval-metrics.json',JSON.stringify(meta,null,2));
console.log(JSON.stringify(meta,null,2));
