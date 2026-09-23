const fs = require('fs');

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf('const DB=') + 9;
const end = html.indexOf(';\nconst ', start);
if (start < 9 || end < 0) throw new Error('DB payload not found');
const db = JSON.parse(html.slice(start, end));
const results = Object.values(db.results);
const questions = Object.keys(db.nodes);
const resultIds = new Set(Object.keys(db.results));
const nodeIds = new Set(questions);
const sourceIds = new Set(Object.keys(db.sources));
const options = Object.entries(db.options).flatMap(([question, list]) => list.map(option => ({question, ...option})));
const destinations = new Set(options.map(o => o.next_id));
const empty = value => value == null || value === '' || (Array.isArray(value) && value.length === 0);
const present = field => results.filter(r => !empty(r[field])).length;
const expertSource = /هيئة الخبراء/;
const falseAuthority = results.filter(r => expertSource.test(String(r.authority || r.court_or_authority || '')));
const sourceAsAuthority = results.filter(r => {
  const s = db.sources[r.source_id];
  const renderedSource = s ? [s.authority,s.title].filter(Boolean).join(' — ').trim() : '';
  return renderedSource && String(r.authority || '').trim() === renderedSource;
});
const noAction = results.filter(r => empty(r.ui_next_step) && empty(r.next_step) && empty(r.action_required) && empty(r.ui_action_required));
const noAuthority = results.filter(r => empty(r.authority) && empty(r.court) && empty(r.court_or_authority));
const missingSource = results.filter(r => empty(r.source_id) || !sourceIds.has(r.source_id));
const broken = options.filter(o => !nodeIds.has(o.next_id) && !resultIds.has(o.next_id));
const unreachableQuestions = questions.filter(id => id !== db.start && !destinations.has(id));
const unreachableResults = [...resultIds].filter(id => !destinations.has(id));
const deadEnds = questions.filter(id => !Array.isArray(db.options[id]) || db.options[id].length === 0);
const duplicateQuestions = Object.entries(Object.groupBy(questions, id => db.nodes[id].text)).filter(([,v]) => v.length > 1);
const duplicateOptions = Object.entries(db.options).flatMap(([qid,list]) => {
  const groups = Object.groupBy(list, o => `${o.label}\u0000${o.next_id}`);
  return Object.values(groups).filter(g => g.length > 1).map(g => ({qid,label:g[0].label,next_id:g[0].next_id,count:g.length}));
});
const immediateLoops = options.flatMap(o => {
  if (!nodeIds.has(o.next_id)) return [];
  const reverse = (db.options[o.next_id] || []).filter(x => x.next_id === o.question);
  return reverse.map(x => ({from:o.question,to:o.next_id,forward_label:o.label,reverse_label:x.label}));
}).filter((x,i,a)=>i===a.findIndex(y=>[x.from,x.to].sort().join('|')===[y.from,y.to].sort().join('|')));
const duplicateDestinations = Object.entries(db.options).flatMap(([qid,list]) => {
  const groups=Object.groupBy(list,o=>o.next_id);
  return Object.entries(groups).filter(([,g])=>g.length>1).map(([next_id,g])=>({qid,next_id,labels:g.map(x=>x.label)}));
});
const fields = ['current_situation','ui_current_situation','next_step','ui_next_step','action_required','ui_action_required','authority','court','court_or_authority','service','procedure_type','requirements','ui_requirements','documents','deadline','costs','what_happens_next','ui_what_happens_next','common_mistake','lawyer_boundary','ui_caution','relevant_articles','rule_ref','source_id','ui_official_source'];
const report = {
  file,
  counts:{questions:questions.length,options:options.length,results:results.length,sources:sourceIds.size},
  coverage:Object.fromEntries(fields.map(f => [f,present(f)])),
  qa:{broken_next_id:broken.length,unreachable_questions:unreachableQuestions.length,unreachable_results:unreachableResults.length,dead_ends:deadEnds.length,missing_source_id:missingSource.length,duplicate_questions:duplicateQuestions.length,duplicate_options:duplicateOptions.length,immediate_two_node_loops:immediateLoops.length,duplicate_destinations:duplicateDestinations.length,results_without_action:noAction.length,results_without_authority:noAuthority.length,expert_bureau_as_authority:falseAuthority.length,source_title_in_authority:sourceAsAuthority.length},
  offenders:{broken,unreachableQuestions,unreachableResults,deadEnds,missingSource:missingSource.map(r=>r.result_id),noAction:noAction.map(r=>r.result_id),noAuthority:noAuthority.map(r=>r.result_id),expertBureauAsAuthority:falseAuthority.map(r=>({id:r.result_id,authority:r.authority||r.court_or_authority})),sourceTitleInAuthority:sourceAsAuthority.map(r=>r.result_id),duplicateOptions,immediateLoops,duplicateDestinations}
};
console.log(JSON.stringify(report,null,2));
