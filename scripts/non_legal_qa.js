const fs=require('fs');
const vm=require('vm');

const html=fs.readFileSync('index.html','utf8');
const candidate=fs.readFileSync('wesh_baed_sale_final_candidate.html','utf8');
const a=html.indexOf('const DB=')+9,b=html.indexOf(';\nconst ',a);
if(a<9||b<0)throw Error('DB not found');
const db=JSON.parse(html.slice(a,b));
const nodes=db.nodes,options=db.options,results=db.results,sources=db.sources;
const nodeIds=new Set(Object.keys(nodes)),resultIds=new Set(Object.keys(results));
const allIds=new Set([...nodeIds,...resultIds]);
const flatOptions=Object.entries(options).flatMap(([question,rows])=>rows.map(row=>({question,...row})));
const brokenNext=flatOptions.filter(x=>!allIds.has(x.next_id));
const deadEnds=[...nodeIds].filter(id=>!(options[id]||[]).length);
const reachable=new Set(),stack=[db.start];while(stack.length){const id=stack.pop();if(!id||reachable.has(id))continue;reachable.add(id);for(const o of options[id]||[])stack.push(o.next_id)}
const duplicateQuestions=Object.values(Object.groupBy(Object.values(nodes),x=>String(x.text||'').trim())).filter(x=>x.length>1);
const duplicateOptions=[];for(const [id,rows] of Object.entries(options)){const groups=Object.values(Object.groupBy(rows,x=>String(x.label||'').trim()));for(const g of groups)if(g.length>1)duplicateOptions.push({question:id,label:g[0].label,count:g.length})}
let jsErrors=[];for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())try{new vm.Script(m[1],{filename:`index-inline-${i}.js`})}catch(e){jsErrors.push(String(e.message))}
const externalScripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)/gi)].map(x=>x[1]);
const blankLinks=[...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)].map(x=>x[0]);
const unsafeBlankLinks=blankLinks.filter(x=>!(/rel=["'][^"']*noopener/.test(x)&&/rel=["'][^"']*noreferrer/.test(x)));
const thirdPartyRequests=[...html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/gi)].map(x=>x[1]);
const secretPatterns={private_key:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,github_token:/\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,generic_secret:/(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"']{12,}/i};
const secrets=Object.entries(secretPatterns).filter(([,re])=>re.test(html)).map(([name])=>name);
const report={
  generated_at:'2026-09-23',
  counts:{questions:nodeIds.size,options:flatOptions.length,results:resultIds.size,sources:Object.keys(sources).length},
  structural:{broken_next_id:brokenNext.length,unreachable_questions:[...nodeIds].filter(id=>!reachable.has(id)).length,unreachable_results:[...resultIds].filter(id=>!reachable.has(id)).length,dead_ends:deadEnds.length,missing_source_id:Object.values(results).filter(r=>!r.source_id||!sources[r.source_id]).length,duplicate_questions:duplicateQuestions.length,duplicate_options:duplicateOptions.length},
  javascript:{syntax_errors:jsErrors.length,details:jsErrors},
  security:{external_scripts:externalScripts,third_party_embeds:thirdPartyRequests,unsafe_target_blank:unsafeBlankLinks.length,cookies_used:/document\.cookie/.test(html),analytics_detected:/gtag\(|google-analytics|googletagmanager|plausible|matomo/i.test(html),forms:([...html.matchAll(/<form\b/gi)]).length,secrets_detected:secrets,inner_html_assignments:([...html.matchAll(/\.innerHTML\s*=/g)]).length,escaping_function_present:/const esc=/.test(html)},
  release:{candidate_matches_index:candidate===html,manifest_link_relative:/rel="manifest" href="\.\/manifest\.webmanifest"/.test(html),service_worker_registered:/serviceWorker\.register/.test(html),index_bytes:Buffer.byteLength(html),candidate_bytes:Buffer.byteLength(candidate)},
  pass:false
};
report.pass=report.counts.questions===305&&report.counts.options===1296&&report.counts.results===646&&report.counts.sources===621&&Object.values(report.structural).every(v=>v===0)&&report.javascript.syntax_errors===0&&report.security.unsafe_target_blank===0&&report.security.secrets_detected.length===0&&report.release.candidate_matches_index;
fs.mkdirSync('docs/non-legal-hardening',{recursive:true});
fs.writeFileSync('docs/non-legal-hardening/non-legal-qa.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exit(1);
