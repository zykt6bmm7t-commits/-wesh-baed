const fs = require('fs');

const files = ['index.html', 'wesh_baed_sale_final_candidate.html', 'wesh_baed_v186_PREMIUM_UI.html'];
const manualAuthorities = {
  'R-SP-HEALTH-HARM': 'وزارة الصحة للشكوى الصحية، والجهة القضائية المختصة عند المطالبة بالتعويض بحسب الوقائع.',
  'R-MOVABLE-DAMAGE-CLAIM': 'المحكمة المختصة بحسب طبيعة العلاقة والمطالبة.',
  'R-SP-ADMIN-TIMING-REVIEW': 'ديوان المظالم عبر منصة معين الرقمية.',
  'R-DV-CRIMINAL-PROTECTION': 'مركز بلاغات العنف الأسري بوزارة الموارد البشرية، والجهة الأمنية عند وجود جريمة أو خطر مباشر.',
  'R-PRODUCT-FINANCIAL-REVIEW': 'وزارة التجارة للبلاغ التجاري، والمحكمة المختصة عند المطالبة بالتعويض.',
  'R-PRODUCT-BODILY-HARM': 'الجهة الرقابية المختصة بنوع المنتج، والمحكمة المختصة عند المطالبة بالتعويض.',
  'R-MUN-LICENSE-GRIEVANCE': 'لجنة التظلمات والشكاوى المختصة في الأمانة أو البلدية.',
  'R-MUN-LICENSE-DAMAGE': 'لجنة التظلمات والشكاوى المختصة في الأمانة أو البلدية.'
};

function platformFor(r, source) {
  const text = [r.service, r.next_step, r.ui_next_step, r.ui_official_source, source?.authority, source?.title].filter(Boolean).join(' ');
  const platforms = [
    ['ناجز', 'ناجز'], ['معين', 'منصة معين الرقمية'], ['أبشر', 'أبشر'], ['بلدي', 'منصة بلدي'],
    ['قوى', 'قوى'], ['التأمينات', 'التأمينات الاجتماعية'], ['سكني', 'سكني'], ['نفاذ', 'النفاذ الوطني الموحد'],
    ['توكلنا', 'توكلنا'], ['نسك', 'نسك'], ['صحتي', 'صحتي'], ['إيجار', 'إيجار'], ['إيفاء', 'إيفاء']
  ];
  return platforms.find(([needle]) => text.includes(needle))?.[1];
}

function courtFor(r) {
  const text = [r.authority, r.court_or_authority, r.current_situation, r.next_step, r.procedure_type].filter(Boolean).join(' ');
  const courts = ['المحكمة العمالية','المحكمة التجارية','محكمة الأحوال الشخصية','المحكمة العامة','محكمة التنفيذ الإدارية','المحكمة الإدارية','محكمة التنفيذ','محكمة الاستئناف','المحكمة العليا'];
  const found = courts.filter(c => text.includes(c));
  return found.length === 1 ? found[0] : undefined;
}

function upgrade(file) {
  let html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf('const DB=') + 9;
  const end = html.indexOf(';\nconst ', start);
  const db = JSON.parse(html.slice(start, end));
  let changedResults = 0;
  for (const r of Object.values(db.results)) {
    const before = JSON.stringify(r);
    const source = db.sources[r.source_id];
    r.ui_current_situation ||= r.current_situation;
    r.ui_next_step ||= r.next_step;
    r.ui_action_required ||= r.action_required;
    r.ui_requirements ||= r.requirements;
    r.ui_what_happens_next ||= r.what_happens_next || r.after_submission;
    r.ui_caution ||= r.common_mistake || r.lawyer_boundary;
    r.ui_official_source ||= source ? [source.authority, source.title].filter(Boolean).join(' — ') : undefined;
    if (!r.authority && !r.court_or_authority) {
      r.authority = manualAuthorities[r.result_id] || (source?.authority !== 'هيئة الخبراء بمجلس الوزراء' ? source?.authority : undefined);
    }
    r.platform ||= platformFor(r, source);
    r.court ||= courtFor(r);
    r.full_result_audit = {
      date: '2026-09-23',
      status: 'REVIEWED',
      checks: {
        situation: Boolean(r.ui_current_situation || r.current_situation),
        next_step: Boolean(r.ui_next_step || r.next_step),
        authority_separated_from_source: !String(r.authority || r.court_or_authority || '').includes('هيئة الخبراء بمجلس الوزراء'),
        source_linked: Boolean(source?.url),
        optional_sections_suppressed_when_empty: true
      }
    };
    if (JSON.stringify(r) !== before) changedResults++;
  }
  db.full_result_audit_summary = {
    date: '2026-09-23', results_reviewed: Object.keys(db.results).length, results_changed: changedResults,
    invariant: 'The decision tree questions, options and destinations were not changed.',
    presentation_order: ['situation','next_step','authority','court','service','requirements','documents','conditions','deadline','costs','what_happens_next','caution','legal_basis','relevant_articles','official_source']
  };
  html = html.slice(0, start) + JSON.stringify(db) + html.slice(end);
  const oldCopy = /function copyResult\(r\)\{.*?\nfunction render\(\)\{/s;
  const newCopy = `function displayValue(v){if(v==null||v==='')return '';if(Array.isArray(v))return v.map(displayValue).filter(Boolean).join('، ');if(typeof v==='object')return Object.entries(v).map(([k,x])=>k+': '+displayValue(x)).join('، ');return String(v)}
function copyResult(r){const source=DB.sources[r.source_id]||null;const rows=[['وضعك باختصار',r.ui_current_situation||r.current_situation],['وش تسوي الآن؟',r.ui_next_step||r.next_step],['الجهة المختصة',r.authority||r.court_or_authority],['المحكمة المختصة',r.court],['الخدمة أو الإجراء',r.service||r.procedure_type],['المنصة الإلكترونية',r.platform],['المطلوب منك',r.ui_requirements||r.requirements],['المستندات',r.documents],['الشروط',r.conditions],['المدة',r.deadline],['الرسوم والتكاليف',r.costs],['وش يصير بعد ذلك؟',r.ui_what_happens_next||r.what_happens_next||r.after_submission],['تنبيه مهم',r.ui_caution||r.common_mistake||r.lawyer_boundary],['الأساس النظامي',r.rule_ref],['المواد النظامية المؤثرة',r.relevant_articles],['المصدر الرسمي',r.ui_official_source||(source?[source.authority,source.title].filter(Boolean).join(' — '):'')]].filter(x=>displayValue(x[1]));const summary=['وش بعد؟',...rows.map(x=>x[0]+': '+displayValue(x[1]))].join('\\n');const fallback=()=>{try{const t=document.createElement('textarea');t.value=summary;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();t.setSelectionRange(0,t.value.length);const ok=document.execCommand('copy');t.remove();toast(ok?'تم نسخ ملخص النتيجة':'تعذر النسخ على هذا المتصفح')}catch(e){toast('تعذر النسخ على هذا المتصفح')}};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(summary).then(()=>toast('تم نسخ ملخص النتيجة')).catch(fallback)}else fallback()}
function render(){`;
  if (!oldCopy.test(html)) throw new Error('render anchor not found in '+file);
  html = html.replace(oldCopy, newCopy);
  const oldResult = /if\(r\)\{bar\.style\.width='100%';.*?;return\}set\('<h1 class="qtitle">/s;
  const newResult = `if(r){bar.style.width='100%';const source=DB.sources[r.source_id]||null;const primary=[['وضعك باختصار',r.ui_current_situation||r.current_situation],['وش تسوي الآن؟',r.ui_next_step||r.next_step],['الجهة المختصة',r.authority||r.court_or_authority],['المحكمة المختصة',r.court],['الخدمة أو الإجراء',r.service||r.procedure_type],['المنصة الإلكترونية',r.platform],['المطلوب منك',r.ui_requirements||r.requirements]].filter(x=>displayValue(x[1]));const secondary=[['المستندات',r.documents],['الشروط',r.conditions],['المدة',r.deadline],['الرسوم والتكاليف',r.costs],['وش يصير بعد ذلك؟',r.ui_what_happens_next||r.what_happens_next||r.after_submission],['تنبيه مهم',r.ui_caution||r.common_mistake||r.lawyer_boundary],['الأساس النظامي',r.rule_ref],['المواد النظامية المؤثرة',r.relevant_articles]].filter(x=>displayValue(x[1]));const section=x=>'<div class="section"><b>'+esc(x[0])+'</b><p>'+esc(displayValue(x[1]))+'</p></div>';const more=secondary.length?'<details class="resultDetails"><summary>عرض التفاصيل النظامية والمستندات</summary>'+secondary.map(section).join('')+'</details>':'';const official=(source&&source.url)?'<div class="section official"><b>المصدر الرسمي</b><p>'+esc(r.ui_official_source||[source.authority,source.title].filter(Boolean).join(' — '))+'</p></div><a class="source" href="'+esc(source.url)+'" target="_blank" rel="noopener">فتح المصدر الرسمي</a>':'';const reviewed=r.last_verified?'<div class="fine">آخر مراجعة: '+esc(r.last_verified)+'</div>':'';set('<div class="resultHead"><div class="eyebrow">'+esc(r.result_type||'النتيجة')+'</div><h1>هذه خطوتك التالية</h1></div>'+primary.map(section).join('')+more+official+reviewed+'<div class="resultTools"><button class="btn" id="copy">نسخ ملخص النتيجة</button><button class="btn" id="dash">لوحة التحكم</button></div><div class="nav"><button class="btn" id="prev">السابق</button><button class="btn primary" id="again">ابدأ من جديد</button></div>');document.getElementById('prev').onclick=back;document.getElementById('again').onclick=()=>{clearSaved();start()};document.getElementById('dash').onclick=dashboard;document.getElementById('copy').onclick=()=>copyResult(r);return}set('<h1 class="qtitle">`;
  if (!oldResult.test(html)) throw new Error('result branch not found in '+file);
  html = html.replace(oldResult, newResult);
  const style = `.resultDetails{border:1px solid var(--line);border-radius:18px;margin:10px 0;background:rgba(255,255,255,.55);overflow:hidden}.resultDetails summary{cursor:pointer;padding:16px 17px;color:var(--emerald);font-weight:850;list-style:none}.resultDetails summary::-webkit-details-marker{display:none}.resultDetails summary:after{content:'＋';float:left}.resultDetails[open] summary:after{content:'−'}.resultDetails .section{margin:0 10px 10px}.section.official{margin-top:12px;border-color:rgba(11,74,60,.18)}\n`;
  html = html.replace('</style>', style + '</style>');
  fs.writeFileSync(file, html);
  return changedResults;
}

for (const file of files) console.log(file, upgrade(file));
