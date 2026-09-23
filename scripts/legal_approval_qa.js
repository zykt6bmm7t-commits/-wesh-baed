const fs=require('fs');
const parseCsv=s=>{const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i],n=s[i+1];if(quoted){if(c==='"'&&n==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(c!=='\r')cell+=c}row.push(cell);if(row.some(Boolean))rows.push(row);return rows};
const raw=fs.readFileSync('docs/LEGAL_APPROVAL_MASTER.csv','utf8');
const rows=parseCsv(raw),headers=rows.shift();
const objects=rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
const required=['Result ID','القطاع','السؤال/المسار الذي يصل إليه','وضعك باختصار','وش تسوي الآن؟','الجهة المختصة','الخدمة/المنصة','المصدر الرسمي','رابط المصدر','تصنيف التحقق','مستوى الخطورة القانونية','هل تحتاج اعتماد محامٍ؟','السؤال المحدد للمحامي','Approved / Needs Change','Lawyer Notes'];
const missingColumns=required.filter(x=>!headers.includes(x));
const dupIds=Object.entries(Object.groupBy(objects,x=>x['Result ID'])).filter(([,v])=>v.length>1).map(([k])=>k);
const riskOrder={CRITICAL:4,HIGH:3,MEDIUM:2,LOW:1};
let sortErrors=0;for(let i=1;i<objects.length;i++)if(riskOrder[objects[i-1]['مستوى الخطورة القانونية']]<riskOrder[objects[i]['مستوى الخطورة القانونية']])sortErrors++;
const report={
  rows:objects.length,unique_ids:new Set(objects.map(x=>x['Result ID'])).size,missing_columns:missingColumns.length,duplicate_ids:dupIds.length,
  empty_paths:objects.filter(x=>!x['السؤال/المسار الذي يصل إليه']).length,
  empty_sources:objects.filter(x=>!x['رابط المصدر']).length,
  empty_lawyer_questions:objects.filter(x=>!x['السؤال المحدد للمحامي']).length,
  invalid_risk:objects.filter(x=>!riskOrder[x['مستوى الخطورة القانونية']]).length,
  invalid_verification:objects.filter(x=>!['VERIFIED','PARTIALLY VERIFIED','PROCEDURAL GUIDANCE','INFERENCE','STALE RISK','HUMAN DECISION'].includes(x['تصنيف التحقق'])).length,
  sort_errors:sortErrors
};
fs.writeFileSync('docs/legal-approval/legal-approval-qa.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.rows!==646||report.unique_ids!==646||Object.entries(report).some(([k,v])=>!['rows','unique_ids'].includes(k)&&v!==0))process.exit(1);
