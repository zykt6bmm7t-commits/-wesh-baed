const fs=require('fs');
const crypto=require('crypto');

const files=['index.html','wesh_baed_sale_final_candidate.html'];
const replacements={
  'SRC-HAJ-COMPLAINT-GUIDE':{
    old_url:'https://media1.haj.gov.sa/Uploads/Files/CRMGuide.pdf',
    url:'https://haj.gov.sa/ar/service-level-agreement',
    title:'اتفاقية مستوى الخدمة وقنوات الشكاوى والبلاغات',
    reason:'صفحة وزارة الحج والعمرة الحالية تعرض دليل آلية الشكاوى والبلاغات وقنوات التصعيد؛ رابط PDF القديم يعيد 404.'
  },
  'SRC-MOH-HEALTH-LICENSE':{
    old_url:'https://www.moh.gov.sa/eServices/Pages/Licensing.aspx',
    url:'https://www.moh.gov.sa/eservices/licences/pages/default.aspx',
    title:'خدمات التراخيص الصحية',
    reason:'صفحة التراخيص الصحية الحالية من وزارة الصحة؛ الرابط القديم حُذف.'
  },
  'SRC-QIWA-CONTRACT':{
    old_url:'https://www.hrsd.gov.sa/ministry-services/services/إدارة-وتوثيق-العقود',
    url:'https://www.hrsd.gov.sa/ministry-services/services/%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D9%82%D9%88%D8%AF',
    title:'إدارة وتوثيق العقود عبر قوى',
    reason:'صفحة الخدمة الحالية من وزارة الموارد البشرية؛ مسار الصفحة القديم تغيّر.'
  },
  'SRC-QIWA-WORK-PERMIT':{
    old_url:'https://www.hrsd.gov.sa/ministry-services/services/إصدار-تجديد-رخص-العمل',
    url:'https://www.hrsd.gov.sa/ministry-services/services/%D8%A5%D8%B5%D8%AF%D8%A7%D8%B1-%D9%88-%D8%AA%D8%AC%D8%AF%D9%8A%D8%AF-%D8%B1%D8%AE%D8%B5-%D8%A7%D9%84%D8%B9%D9%85%D9%84',
    title:'إصدار وتجديد رخص العمل',
    reason:'صفحة الخدمة الحالية من وزارة الموارد البشرية؛ الرابط القديم كان يفتقد الصيغة الحالية لاسم الخدمة.'
  },
  'SRC142-FAM':{
    old_url:'https://laws-gateway.moj.gov.sa/apis/legislations/v1/ExportDocument/pdf?Serial=4DC3ARZ00YqnoqpraZMxCQ',
    url:'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/4d72d829-947b-45d5-b9b5-ae5800d6bac2/1',
    title:'نظام الأحوال الشخصية',
    reason:'استبدال رابط تصدير وزارة العدل المحذوف بصفحة النص النظامي الرسمية في هيئة الخبراء دون تغيير المعلومة القانونية.'
  },
  'SRC144-FAM':{
    old_url:'https://laws-gateway.moj.gov.sa/apis/legislations/v1/ExportDocument/pdf?Serial=4DC3ARZ00YqnoqpraZMxCQ',
    url:'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/4d72d829-947b-45d5-b9b5-ae5800d6bac2/1',
    title:'نظام الأحوال الشخصية — المادة 134',
    reason:'استبدال رابط تصدير وزارة العدل المحذوف بصفحة النص النظامي الرسمية في هيئة الخبراء دون تغيير المعلومة القانونية.'
  },
  'SRC-BALADY-REPORTS-940':{
    old_url:'https://balady.gov.sa/ar/services/البلاغات-البلدية',
    url:'https://balady.gov.sa/ar/services/%D8%AA%D9%82%D8%AF%D9%8A%D9%85-%D8%A8%D9%84%D8%A7%D8%BA',
    title:'تقديم بلاغ بلدي',
    reason:'صفحة خدمة تقديم البلاغ الحالية في منصة بلدي؛ الرابط القديم أعاد 404 في إعادة الفحص.'
  },
  'SRC-QIWA-TRANSFER':{
    old_url:'https://www.hrsd.gov.sa/ministry-services/services/نقل-الموظفين',
    url:'https://www.hrsd.gov.sa/ministry-services/services/%D8%B7%D9%84%D8%A8-%D9%86%D9%82%D9%84-%D8%A7%D9%84%D8%B9%D9%85%D8%A7%D9%84%D8%A9-%D8%A7%D9%84%D9%88%D8%A7%D9%81%D8%AF%D8%A9',
    title:'طلب نقل العمالة الوافدة عبر قوى',
    reason:'صفحة الخدمة الحالية في وزارة الموارد البشرية؛ الرابط القديم أعاد 404 في إعادة الفحص.'
  }
};

function readDb(html){
  const a=html.indexOf('const DB=')+9,b=html.indexOf(';\nconst ',a);
  if(a<9||b<0)throw Error('DB not found');
  return {a,b,db:JSON.parse(html.slice(a,b))};
}
function shape(db){return {questions:Object.keys(db.nodes).length,options:Object.values(db.options).flat().length,results:Object.keys(db.results).length,sources:Object.keys(db.sources).length}}
function topology(db){return crypto.createHash('sha256').update(JSON.stringify({start:db.start,nodes:db.nodes,options:db.options,results:Object.fromEntries(Object.entries(db.results).map(([id,r])=>[id,{result_id:r.result_id,source_id:r.source_id}]))})).digest('hex')}

let canonicalBefore=null,canonicalAfter=null,log=[];
for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  const {a,b,db}=readDb(html),beforeShape=shape(db),beforeTopology=topology(db);
  for(const [id,next] of Object.entries(replacements)){
    const source=db.sources[id];if(!source)throw Error(`${file}: missing ${id}`);
    if(file==='index.html')log.push({source_id:id,old_url:next.old_url||source.url,new_url:next.url,old_title:source.title,new_title:next.title,reason:next.reason,verified_on:'2026-09-23'});
    source.url=next.url;source.title=next.title;source.last_verified='2026-09-23';source.status='current';
  }
  html=html.slice(0,a)+JSON.stringify(db)+html.slice(b);
  html=html.replace('</title><style>','</title><link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon.svg" type="image/svg+xml"><style>');
  const duplicateCss=".resultDetails{border:1px solid var(--line);border-radius:18px;margin:10px 0;background:rgba(255,255,255,.55);overflow:hidden}.resultDetails summary{cursor:pointer;padding:16px 17px;color:var(--emerald);font-weight:850;list-style:none}.resultDetails summary::-webkit-details-marker{display:none}.resultDetails summary:after{content:'＋';float:left}.resultDetails[open] summary:after{content:'−'}.resultDetails .section{margin:0 10px 10px}.section.official{margin-top:12px;border-color:rgba(11,74,60,.18)}\n";
  const first=html.indexOf(duplicateCss),second=html.indexOf(duplicateCss,first+duplicateCss.length);if(second>=0)html=html.slice(0,second)+html.slice(second+duplicateCss.length);
  const displayFn="function displayValue(v){if(v==null||v==='')return '';if(Array.isArray(v))return v.map(displayValue).filter(Boolean).join('، ');if(typeof v==='object')return Object.entries(v).map(([k,x])=>k+': '+displayValue(x)).join('، ');return String(v)}\n";
  const d1=html.indexOf(displayFn),d2=html.indexOf(displayFn,d1+displayFn.length);if(d2>=0)html=html.slice(0,d2)+html.slice(d2+displayFn.length);
  const after=readDb(html).db,afterShape=shape(after),afterTopology=topology(after);
  if(JSON.stringify(beforeShape)!==JSON.stringify(afterShape))throw Error(`${file}: DB counts changed`);
  if(beforeTopology!==afterTopology)throw Error(`${file}: decision topology changed`);
  fs.writeFileSync(file,html);
  if(file==='index.html'){canonicalBefore=beforeShape;canonicalAfter=afterShape}
}

fs.mkdirSync('docs/non-legal-hardening',{recursive:true});
const headers=['source_id','old_url','new_url','old_title','new_title','reason','verified_on'];
const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;
fs.writeFileSync('docs/non-legal-hardening/source-replacements.csv',[headers,...log.map(x=>headers.map(h=>x[h]))].map(r=>r.map(esc).join(',')).join('\n'));
fs.writeFileSync('docs/non-legal-hardening/data-invariants.json',JSON.stringify({before:canonicalBefore,after:canonicalAfter,decision_tree_changed:false,legal_decisions_changed:false,sources_replaced:log.length},null,2));
console.log(JSON.stringify({before:canonicalBefore,after:canonicalAfter,sources_replaced:log.length},null,2));
