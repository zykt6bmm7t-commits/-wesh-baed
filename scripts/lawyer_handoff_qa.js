const fs=require('fs');
const path=require('path');

const packet='docs/LAWYER_FINAL_REVIEW_PACKET';
const parseCsv=s=>{const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i],n=s[i+1];if(quoted){if(c==='"'&&n==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(c!=='\r')cell+=c}row.push(cell);if(row.some(Boolean))rows.push(row);return rows};
const objects=file=>{const rows=parseCsv(fs.readFileSync(file,'utf8')),headers=rows.shift();return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])))};
const fail=[];
const check=(ok,message)=>{if(!ok)fail.push(message)};

const master=objects('docs/LEGAL_APPROVAL_MASTER.csv');
const decisions=objects(path.join(packet,'04_LEGAL_DECISION_REGISTER.csv'));
const stale=objects(path.join(packet,'05_STALE_RISK_REGISTER.csv'));
const resultMaster=objects(path.join(packet,'07_RESULT_MASTER.csv'));
const critical=master.filter(r=>r['مستوى الخطورة القانونية']==='CRITICAL');
const high=master.filter(r=>r['مستوى الخطورة القانونية']==='HIGH');
const staleMaster=master.filter(r=>r['تصنيف التحقق']==='STALE RISK');
const criticalDoc=fs.readFileSync(path.join(packet,'02_CRITICAL_28.md'),'utf8');
const criticalHeadings=[...criticalDoc.matchAll(/^## (R-[^ ]+) — (LD-\d+)$/gm)].map(x=>({id:x[1],decision:x[2]}));
const decisionIds=new Set(decisions.map(r=>r['Decision ID']));
const affected=decisions.flatMap(r=>r['Results المتأثرة'].split(' | ').filter(Boolean));
const affectedSet=new Set(affected);
const expectedReview=new Set([...critical,...high].map(r=>r['Result ID']));
const staleAffected=stale.flatMap(r=>r['Results المتأثرة'].split(' | ').filter(Boolean));
const highFiles=fs.readdirSync(path.join(packet,'03_HIGH_BY_SPECIALTY')).filter(x=>x.endsWith('.md'));

check(master.length===646,`Result master source expected 646, found ${master.length}`);
check(resultMaster.length===646,`07_RESULT_MASTER expected 646, found ${resultMaster.length}`);
check(critical.length===28,`CRITICAL expected 28, found ${critical.length}`);
check(high.length===372,`HIGH expected 372, found ${high.length}`);
check(staleMaster.length===130,`STALE RISK expected 130, found ${staleMaster.length}`);
check(criticalHeadings.length===28,`Critical cards expected 28, found ${criticalHeadings.length}`);
check(new Set(criticalHeadings.map(x=>x.id)).size===28,'Critical card IDs are duplicated');
check(critical.every(r=>criticalHeadings.some(x=>x.id===r['Result ID'])),'At least one CRITICAL Result lacks a card');
check(criticalHeadings.every(x=>decisionIds.has(x.decision)),'At least one critical card has no valid Legal Decision');
check(affected.length===affectedSet.size,'A CRITICAL/HIGH Result is assigned to more than one Legal Decision');
check(affectedSet.size===400,`Legal Decisions should cover 400 CRITICAL/HIGH Results, found ${affectedSet.size}`);
check([...expectedReview].every(id=>affectedSet.has(id)),'Legal Decision Register misses a CRITICAL/HIGH Result');
check(staleAffected.length===new Set(staleAffected).size,'A STALE RISK Result appears in more than one monitor row');
check(new Set(staleAffected).size===130,`Stale monitor should cover 130 Results, found ${new Set(staleAffected).size}`);
check(staleMaster.every(r=>new Set(staleAffected).has(r['Result ID'])),'Stale monitor misses a STALE RISK Result');
check(highFiles.length===13,`Expected 13 specialty files, found ${highFiles.length}`);
check(fs.readFileSync(path.join(packet,'08_APPROVAL_CHECKLIST.md'),'utf8').includes('AWAITING LICENSED SAUDI LAWYER APPROVAL'),'Approval checklist has wrong status');
check(!/^\s*\*\*LEGALLY APPROVED\*\*\s*$/m.test(fs.readFileSync(path.join(packet,'01_EXECUTIVE_BRIEF.md'),'utf8')),'Executive brief incorrectly claims legal approval');

const sourceAuditFile=path.join(packet,'06_SOURCE_LINK_AUDIT.csv');
let sourcesTested=0;
if(fs.existsSync(sourceAuditFile)){
  const sourceAudit=objects(sourceAuditFile);sourcesTested=sourceAudit.length;
  const allowed=new Set(['ACTIVE','REDIRECTED','SUPERSEDED','STALE','BROKEN','BLOCKED_FROM_AUTOMATED_CHECK','JAVASCRIPT_REQUIRED','LOGIN_REQUIRED','PDF_OR_DOCUMENT','REQUIRES_LEGAL_REVIEW']);
  check(sourceAudit.length===621,`Source link audit expected 621, found ${sourceAudit.length}`);
  check(new Set(sourceAudit.map(r=>r.source_id)).size===621,'Source link audit contains duplicate source IDs');
  check(sourceAudit.every(r=>allowed.has(r.classification)), 'Source link audit contains an invalid classification');
}

const report={status:fail.length?'FAIL':'PASS',critical_cards:criticalHeadings.length,high_results:high.length,legal_decisions:decisions.length,decision_results_covered:affectedSet.size,stale_results_covered:new Set(staleAffected).size,specialty_files:highFiles.length,sources_tested:sourcesTested,failures:fail};
fs.writeFileSync(path.join(packet,'qa-summary.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(fail.length)process.exit(1);
