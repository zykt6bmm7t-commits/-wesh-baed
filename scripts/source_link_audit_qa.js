const fs=require('fs');

function parseCsv(raw){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<raw.length;i+=1){const c=raw[i];if(quoted){if(c==='"'&&raw[i+1]==='"'){field+='"';i+=1}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){row.push(field);field=''}else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}else field+=c}
  if(field||row.length){row.push(field);rows.push(row)}const headers=rows.shift();return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
}

const html=fs.readFileSync('index.html','utf8');const a=html.indexOf('const DB=')+9,b=html.indexOf(';\nconst ',a);if(a<9||b<0)throw Error('DB not found');const db=JSON.parse(html.slice(a,b));
const packet='docs/LAWYER_FINAL_REVIEW_PACKET/06_SOURCE_LINK_AUDIT.csv';const root='docs/SOURCE_LINK_AUDIT.csv';
const raw=fs.readFileSync(packet,'utf8'),rows=parseCsv(raw),failures=[];
const allowedStatus=new Set(['ACTIVE','REDIRECTED','BROKEN','SUPERSEDED','BLOCKED_FROM_AUTOMATED_CHECK','JAVASCRIPT_REQUIRED','LOGIN_REQUIRED','PDF_OR_DOCUMENT','REQUIRES_LEGAL_REVIEW']);
const allowedType=new Set(['LEGAL_SOURCE','OFFICIAL_SERVICE_PAGE','OFFICIAL_PROCEDURAL_GUIDE','REGULATOR_PAGE','GENERAL_GOVERNMENT_INFORMATION']);
const sourceIds=new Set(Object.keys(db.sources)),auditIds=new Set(rows.map(r=>r.source_id)),resultSourceIds=new Set(Object.values(db.results).map(r=>r.source_id));
const missingResultSources=[...resultSourceIds].filter(id=>!sourceIds.has(id));const unaudited=[...sourceIds].filter(id=>!auditIds.has(id));const unknownAudit=[...auditIds].filter(id=>!sourceIds.has(id));
if(rows.length!==621)failures.push(`audit rows ${rows.length}`);if(auditIds.size!==621)failures.push(`unique audit IDs ${auditIds.size}`);
if(missingResultSources.length)failures.push(`missing Result source IDs: ${missingResultSources.join(', ')}`);if(unaudited.length)failures.push(`unaudited Sources: ${unaudited.join(', ')}`);if(unknownAudit.length)failures.push(`unknown audit Sources: ${unknownAudit.join(', ')}`);
if(rows.some(r=>!allowedStatus.has(r.classification)))failures.push('invalid verification status');if(rows.some(r=>!allowedType.has(r.source_type)))failures.push('invalid source type');
if(rows.some(r=>!r.original_url||!r.verification_date||!r.official_domain))failures.push('missing required audit fields');if(fs.readFileSync(root,'utf8')!==raw)failures.push('root and packet audit files differ');
const orphans=[...sourceIds].filter(id=>!resultSourceIds.has(id));
const report={status:failures.length?'FAIL':'PASS',sources:sourceIds.size,audit_rows:rows.length,unique_source_ids:auditIds.size,missing_source_id:missingResultSources.length,broken_source_references:missingResultSources.length,unaudited_sources:unaudited.length,unknown_audit_sources:unknownAudit.length,orphan_sources:orphans.length,orphan_source_ids:orphans,technical_source_mapping_errors:missingResultSources.length+unaudited.length+unknownAudit.length,failures};
fs.writeFileSync('docs/source-link-audit-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(failures.length)process.exit(1);
