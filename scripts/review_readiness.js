const fs = require('fs');
const path = require('path');

const targets = ['index.html', 'wesh_baed_sale_final_candidate.html', 'wesh_baed_v186_PREMIUM_UI.html'];

function parseDb(html) {
  const start = html.indexOf('const DB=') + 9;
  const end = html.indexOf(';\nconst ', start);
  if (start < 9 || end < 0) throw new Error('DB payload not found');
  return JSON.parse(html.slice(start, end));
}

function addAccessibility(html) {
  html = html.replace('<meta name="viewport" content="width=device-width,initial-scale=1">', '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer">');
  html = html.replace('<body><main class="app">', '<body><a class="skipLink" href="#screen">تجاوز إلى المحتوى</a><main class="app" id="mainContent">');
  html = html.replace('<header class="top"><div class="brand">وش بعد؟</div>', '<header class="top"><div class="brand" aria-label="وش بعد؟">وش بعد؟</div>');
  html = html.replace('<div id="progress" class="progress" hidden><i id="bar"></i></div>', '<div id="progress" class="progress" role="progressbar" aria-label="تقدم الأسئلة" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden><i id="bar"></i></div>');
  html = html.replace('<section id="screen" class="screen"></section>', '<section id="screen" class="screen" aria-live="polite" aria-atomic="true" tabindex="-1"></section>');
  html = html.replace(/PREMIUM · v186/g, 'REVIEW · v196');
  html = html.replace(/Premium UI v186/g, 'Review Edition v196');
  const oldSet = "function set(html){screen.innerHTML='<div class=\"panel\">'+html+'</div>';window.scrollTo({top:0,behavior:'instant'})}";
  const newSet = "function set(html){screen.innerHTML='<div class=\"panel\">'+html+'</div>';screen.querySelectorAll('button').forEach(b=>b.type='button');const heading=screen.querySelector('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}window.scrollTo({top:0,behavior:'instant'})}";
  if (html.includes(oldSet)) html = html.replace(oldSet, newSet);
  html = html.replace('<input class="searchInput" id="quickSearch"', '<label class="srOnly" for="quickSearch">اكتب مشكلتك بكلماتك</label><input class="searchInput" id="quickSearch" aria-describedby="searchHelp"');
  html = html.replace('<div class="searchResults" id="searchResults"></div>', '<div class="searchHint" id="searchHelp">لا تكتب اسمك أو رقم هويتك أو أي بيانات شخصية.</div><div class="searchResults" id="searchResults" aria-live="polite"></div>');
  html = html.replace("function toast(t){const e=document.createElement('div');e.className='toast';", "function toast(t){const e=document.createElement('div');e.className='toast';e.setAttribute('role','status');e.setAttribute('aria-live','polite');");
  html = html.replace("bar.style.width=Math.min(94,12+historyStack.length*9)+'%';", "const progressValue=Math.min(94,12+historyStack.length*9);bar.style.width=progressValue+'%';progress.setAttribute('aria-valuenow',String(progressValue));");
  html = html.replaceAll('rel="noopener"', 'rel="noopener noreferrer"');
  const css = `.skipLink{position:fixed;top:8px;right:8px;z-index:100;transform:translateY(-180%);background:#fff;color:var(--emerald);padding:10px 14px;border-radius:10px;font-weight:900}.skipLink:focus{transform:none}.srOnly{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.screen:focus{outline:none}button,a,input,summary{min-height:44px}summary:focus-visible{outline:3px solid rgba(185,151,88,.45);outline-offset:-3px;border-radius:14px}@media(prefers-contrast:more){:root{--muted:#42534d;--line:#8c918b}.section,.tile,.opt,.btn,.sectorCard{border-width:2px}}\n`;
  if (!html.includes('.skipLink{')) html = html.replace('</style>', css + '</style>');
  return html;
}

for (const file of targets) {
  let html = fs.readFileSync(file, 'utf8');
  html = addAccessibility(html);
  fs.writeFileSync(file, html);
}

if (fs.existsSync('service-worker.js')) {
  let sw=fs.readFileSync('service-worker.js','utf8');
  sw=sw.replace(/wesh-baed-v[^'"`]+/g,'wesh-baed-v196-multidisciplinary');
  fs.writeFileSync('service-worker.js',sw);
}

const db = parseDb(fs.readFileSync('index.html', 'utf8'));
const results = Object.values(db.results);
const sources = db.sources;
const esc = value => String(value ?? '').replaceAll('"', '""').replaceAll('\n', ' ');

function packFor(r) {
  const id = r.result_id;
  if (/FAM|CUSTODY|VISIT|DIVORCE|KHULA|EXEC|JUDGMENT|PROC|NAJIZ|COURT/.test(id)) return '02-القضاء-والتنفيذ-والأحوال';
  if (/ADMIN|GOV|LABOR|COMM|COMPANY|PARTNER/.test(id)) return '03-الإداري-والعمالي-والتجاري';
  if (/BANK|FIN|INS|CST|ZATCA|AIR|WATER|ELECTRIC|PRIVACY|HEALTH|PASSPORT|MOTOR|CONSUMER|ECOM|REAL|RENT/.test(id)) return '04-القطاعات-التنظيمية';
  return '01-القائد-القانوني-العام';
}

function riskFor(r) {
  if (!r.authority || !r.source_id || !sources[r.source_id]) return 'HIGH';
  if ((r.deadline || r.costs || r.relevant_articles) && r.legal_accuracy_audit?.status !== 'PASS_VERIFIED') return 'HIGH';
  if (!r.legal_accuracy_audit) return 'MEDIUM';
  return 'LOW';
}

fs.mkdirSync('docs/review-packets', {recursive:true});
const csv = [['result_id','package','risk','authority','court','service','platform','deadline','costs','articles','source_id','source_authority','source_title','source_url','last_verified','automated_review','human_status','human_notes']];
for (const r of results) {
  const s = sources[r.source_id] || {};
  csv.push([r.result_id,packFor(r),riskFor(r),r.authority,r.court,r.service,r.platform,r.deadline,r.costs,JSON.stringify(r.relevant_articles||''),r.source_id,s.authority,s.title,s.url,r.last_verified,r.full_result_audit?.status||'', 'NEEDS_REVIEW','']);
}
fs.writeFileSync('docs/result-audit-register.csv', csv.map(row=>row.map(x=>`"${esc(x)}"`).join(',')).join('\n'));

const groups = Object.groupBy(results, packFor);
for (const [name, rows] of Object.entries(groups)) {
  const lines = [`# حزمة ${name}`, '', '> أُعدت آليًا لتسريع المراجعة البشرية، ولا تعني اعتمادًا قانونيًا.', '', '| Result ID | الخطورة | الجهة | الخدمة | المصدر | Approved / Needs Change | ملاحظات |', '|---|---:|---|---|---|---|---|'];
  for (const r of rows) {
    const s=sources[r.source_id]||{};
    lines.push(`| ${r.result_id} | ${riskFor(r)} | ${(r.authority||'—').replaceAll('|','/')} | ${(r.service||r.procedure_type||'—').replaceAll('|','/')} | ${s.url?`[${(s.title||r.source_id).replaceAll('|','/')}](${s.url})`:'—'} | NEEDS REVIEW | |`);
  }
  lines.push('', '## أسئلة الاعتماد', '', '- هل الجهة والمحكمة ونوع الإجراء صحيح لكل حالة؟', '- هل المدة وبدايتها والاستثناءات موثقة بالمصدر الرسمي الحالي؟', '- هل الرسوم والتكاليف محدثة ومفصولة عن رسوم الخدمة؟', '- هل المادة النظامية مؤثرة فعلًا، وهل شرح أثرها دقيق؟', '- هل الخدمة الإلكترونية واسمها ومسارها ما زالت متاحة؟');
  fs.writeFileSync(path.join('docs/review-packets', `${name}.md`), lines.join('\n'));
}

const specialistPackets = {
  '05-حماية-البيانات-والأمن.md': ['مختص حماية البيانات والأمن','راجع localStorage، وعدم وجود تحليلات في النسخة الحالية، وقيّم PDPL قبل أي حسابات أو نماذج أو Analytics.','هل إشعار الخصوصية كافٍ؟ ما مدد الاحتفاظ؟ وما ضوابط الحوادث والأطراف الثالثة؟'],
  '06-التجارة-الإلكترونية-والملكية-الفكرية.md': ['محامي التجارة الإلكترونية والملكية الفكرية','اعتمد شروط الاستخدام وإخلاء المسؤولية والترخيص ومنع إعادة البيع وسياسة الاسترجاع ووصف المنتج.','هل نموذج الترخيص قابل للإنفاذ؟ وهل وصف المنتج أو الاسترجاع متوافقان مع النظام؟'],
  '07-الضرائب-والتشغيل.md': ['محاسب أو مستشار ضريبي','احسم صفة البائع والفوترة وضريبة القيمة المضافة والعمولات والاستردادات والاشتراكات.','هل يلزم التسجيل؟ وكيف تصدر الفواتير وتعالج العمولات والاسترداد؟'],
  '08-تجربة-المستخدم-وإمكانية-الوصول.md': ['مختبر UX / Accessibility','اختبر الجوال وVoiceOver والتكبير ولوحة المفاتيح وفهم النتيجة خلال خمس ثوانٍ.','هل يصل المستخدم السعودي غير المتخصص للنتيجة ويفرق بين الجهة والخدمة والمصدر دون مساعدة؟']
};
for(const [file,[expert,scope,questions]] of Object.entries(specialistPackets)) fs.writeFileSync(path.join('docs/review-packets',file), `# حزمة ${expert}\n\n> هذه ورقة تسليم للاعتماد البشري، وليست اعتمادًا آليًا.\n\n## النطاق\n\n${scope}\n\n## المواد المسلّمة\n\n- docs/result-audit-register.csv\n- docs/privacy-security-review.md\n- docs/commercial-readiness.md\n- docs/accessibility-review.md\n\n## الأسئلة المطلوب حسمها\n\n${questions}\n\n## القرار\n\n- [ ] Approved\n- [ ] Needs Change\n\n## الملاحظات\n\n`);

const privacy = `# مراجعة الخصوصية والأمن\n\n## ما يجمعه الإصدار الحالي\n\n- لا توجد حسابات مستخدمين أو نماذج ترسل الحالة إلى خادم المشروع.\n- لا توجد Cookies أو أدوات Analytics داخل الملف الحالي.\n- يُحفظ محليًا فقط معرّف السؤال/النتيجة الحالية ومسار الرجوع في localStorage بالمفتاحين \`wb_current\` و\`wb_history\`.\n- البحث يعمل محليًا داخل المتصفح.\n- فتح المصدر الرسمي ينقل المستخدم إلى جهة خارجية تطبق سياستها المستقلة.\n\n## ضوابط منفذة\n\n- تنبيه المستخدم لعدم كتابة الاسم أو الهوية أو البيانات الشخصية في البحث.\n- تقليل البيانات إلى حالة تنقل غير معرفّة مباشرة.\n- إمكانية حذف الحالة المحلية عند البدء من جديد.\n- الروابط الخارجية تستخدم \`noopener\`.\n\n## قبل إضافة حسابات أو تحليلات أو دفع\n\nيلزم تقييم نظام حماية البيانات الشخصية، تحديد المسوغ والغرض والاحتفاظ والحذف والأطراف الثالثة، وإجراء مراجعة أمنية واختبار اختراق مناسب. لا يدّعي المشروع امتثالًا كاملًا لـPDPL.\n`;
fs.writeFileSync('docs/privacy-security-review.md', privacy);

const commercial = `# الجاهزية التجارية\n\n## الحالة\n\nREADY WITH HUMAN GATES — جاهز تقنيًا للاختبار والبيع التجريبي المقيد، وليس معتمدًا قانونيًا أو ضريبيًا.\n\n## يلزم قبل البيع العام\n\n1. اعتماد المحتوى بواسطة محامٍ سعودي مرخص.\n2. شروط استخدام وإخلاء مسؤولية وسياسة استرجاع وترخيص شخصي يعتمدها محامي تجارة إلكترونية.\n3. حسم صفة البائع والمنشأة والفوترة وضريبة القيمة المضافة مع محاسب/مستشار ضريبي.\n4. عدم استخدام عبارات: «استشارة قانونية»، «نتيجة مضمونة»، «معتمد من وزارة العدل»، أو «بديل عن المحامي».\n5. وصف مقترح: «دليل إجرائي تفاعلي يساعدك على تحديد المسار الأقرب والرجوع إلى المصدر الرسمي».\n\n## نموذج البيع المبدئي\n\n- نسخة أفراد: شراء مرة واحدة مع مدة تحديث معلنة.\n- النسخة المهنية أو الاشتراك: تؤجل حتى وجود آلية تحديث ومراجعة بشرية دورية واتفاقية ترخيص منفصلة.\n`;
fs.writeFileSync('docs/commercial-readiness.md', commercial.replace('READY WITH HUMAN GATES — جاهز تقنيًا للاختبار والبيع التجريبي المقيد، وليس معتمدًا قانونيًا أو ضريبيًا.','NO-GO للبيع العام حتى إكمال بوابات الاعتماد البشري أدناه. النسخة الحالية مناسبة للاختبار الداخلي فقط، وليست معتمدة قانونيًا أو ضريبيًا.'));

const accessibility = `# مراجعة إمكانية الوصول\n\n## إصلاحات منفذة\n\n- رابط تجاوز إلى المحتوى.\n- live region للشاشة ونتائج البحث والتنبيهات.\n- Progressbar بأدوار وقيم ARIA.\n- Label فعلي لحقل البحث وتعليمات خصوصية مرتبطة به.\n- إدارة التركيز عند تغير السؤال أو النتيجة.\n- حد أدنى 44px للأهداف اللمسية.\n- دعم prefers-reduced-motion وprefers-contrast.\n- focus-visible للملخص القابل للفتح.\n\n## يحتاج اختبارًا بشريًا\n\n- VoiceOver على iPhone/Safari.\n- تكبير 200% و400%.\n- اختبار مستخدم كفيف أو ضعيف بصر.\n- مراجعة تباين آلية بالأداة المعتمدة على جميع الحالات.\n`;
fs.writeFileSync('docs/accessibility-review.md', accessibility);

const summary = `# سجل المراجعة متعددة التخصصات\n\n- Questions: ${Object.keys(db.nodes).length}\n- Options: ${Object.values(db.options).reduce((n,a)=>n+a.length,0)}\n- Results: ${results.length}\n- Sources: ${Object.keys(sources).length}\n- Results with automated full-result marker: ${results.filter(r=>r.full_result_audit).length}\n- Results requiring human approval: ${results.length}\n- High-risk automated flags: ${results.filter(r=>riskFor(r)==='HIGH').length}\n- Medium-risk automated flags: ${results.filter(r=>riskFor(r)==='MEDIUM').length}\n\nهذا السجل فحص آلي/تحريري داخلي، ولا يحل محل اعتماد المختص البشري. راجع حزم \`docs/review-packets/\`.\n`;
fs.writeFileSync('docs/multidisciplinary-review-summary.md', summary);

console.log(JSON.stringify({results:results.length,packets:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),highRisk:results.filter(r=>riskFor(r)==='HIGH').length,mediumRisk:results.filter(r=>riskFor(r)==='MEDIUM').length},null,2));
