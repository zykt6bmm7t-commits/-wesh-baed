const fs=require('fs');
const source=JSON.parse(fs.readFileSync('docs/LAWYER_FINAL_REVIEW_PACKET/source-link-audit-summary.json','utf8'));
const qa=JSON.parse(fs.readFileSync('docs/non-legal-hardening/non-legal-qa.json','utf8'));
const c=source.counts||{};
const report=`# NON-LEGAL PRE-LAUNCH HARDENING

تاريخ الفحص: 2026-09-23

حالة المشروع القانونية: **PRE-LEGAL REVIEW COMPLETE — AWAITING LICENSED SAUDI LAWYER APPROVAL**

لم تُعدّل أي مادة أو مدة أو رسوم أو اختصاص، ولم يُحسم أي من القرارات القانونية المعلقة.

## سلامة البيانات والشجرة

- Questions: ${qa.counts.questions}
- Options: ${qa.counts.options}
- Results: ${qa.counts.results}
- Sources: ${qa.counts.sources}
- Broken next_id: ${qa.structural.broken_next_id}
- Unreachable Questions: ${qa.structural.unreachable_questions}
- Unreachable Results: ${qa.structural.unreachable_results}
- Dead ends: ${qa.structural.dead_ends}
- Missing source_id: ${qa.structural.missing_source_id}
- Duplicate Questions: ${qa.structural.duplicate_questions}
- Duplicate Options: ${qa.structural.duplicate_options}
- JavaScript syntax errors: ${qa.javascript.syntax_errors}

## صحة الروابط الرسمية

- Sources tested: ${source.total||0}
- ACTIVE: ${c.ACTIVE||0}
- REDIRECTED: ${c.REDIRECTED||0}
- BROKEN: ${c.BROKEN||0}
- SUPERSEDED: ${c.SUPERSEDED||0}
- BLOCKED_FROM_AUTOMATED_CHECK: ${c.BLOCKED_FROM_AUTOMATED_CHECK||0}
- REQUIRES_LEGAL_REVIEW: ${c.REQUIRES_LEGAL_REVIEW||0}

المشكلة التقنية منفصلة عن المراجعة القانونية: الحظر أو انتهاء المهلة لا يعني أن الرابط مكسور، وصلته القانونية بالادعاء لا تعتمد آليًا عند غياب دليل قطعي.

## Mobile وCommercial UX

- تم اختبار الغلاف، لوحة التحكم، البحث، القطاعات، الأسئلة، السابق، Progress، النتيجة، التفاصيل، المصدر، Refresh، حفظ المسار، وإعادة البداية في المتصفح المنشور.
- لا توجد أقسام نتيجة فارغة لأن العرض يرشح الحقول الفارغة.
- الجهة المختصة تأتي من Result فقط؛ المصدر الرسمي لا يستخدم بوصفه وجهة للمستخدم.
- أضيف دعم Browser Back/Forward لحالة التطبيق.
- أصلح التباس بحث «شركة نصبت علي» ليوجه إلى بوابة الشركات والتجارة التشخيصية.
- حد اللمس الأدنى 44px، والأزرار الرئيسية المرصودة 50–174px.
- اختبار iPhone/Safari وVoiceOver الفعلي مدرج في HUMAN_DEVICE_TEST ولا يُدعى نجاحه آليًا.

## Accessibility

- Semantic main/header/section، رابط تجاوز، عناوين مرتبة، Labels للبحث، أزرار أصلية، focus-visible، ونقل التركيز إلى عنوان الشاشة.
- خُفضت مبالغة live-region بجعل aria-atomic=false.
- رُفعت نسبة ألوان النصوص الثانوية والذهبية إلى حد AA للنص العادي على الخلفية الأساسية.
- لوحة المفاتيح والعناصر القابلة للفتح تستخدم عناصر HTML أصلية.

## Performance

- index.html: ${qa.release.index_bytes.toLocaleString('en-US')} bytes.
- نسخة البيع مطابقة للـindex: ${qa.release.candidate_matches_index?'YES':'NO'}.
- أزيل تعديل HTML وقت التشغيل من Service Worker، وثُبتت مسارات Project Pages النسبية في manifest.
- بقي الهيكل الأحادي الكبير كما هو؛ فصل البيانات الآن مخاطرة غير لازمة قبل اعتماد المحامي ويتطلب اختبار تطابق مستقلًا. يوصى به كتحسين لاحق، لا كشرط يمنع التسليم للمحامي.

## Security وPrivacy التقنية

- Cookies: ${qa.security.cookies_used?'موجودة':'لا توجد'}.
- Analytics/trackers: ${qa.security.analytics_detected?'موجودة':'لا توجد'}.
- External scripts: ${qa.security.external_scripts.length}.
- Forms: ${qa.security.forms}.
- Unsafe target=_blank: ${qa.security.unsafe_target_blank}.
- Secrets/tokens detected: ${qa.security.secrets_detected.length}.
- LocalStorage محدود إلى حالة المسار؛ لا توجد حسابات أو إرسال إجابات إلى خادم المنتج.
- أضيفت Content Security Policy وReferrer Policy. تبقى unsafe-inline لازمة للملف الأحادي حتى إعادة الهيكلة.
- استخدام innerHTML محصور في قوالب التطبيق، والقيم القادمة من قاعدة البيانات تمر عبر esc قبل العرض.

## Release hygiene

- ثُبت README وحالة الاعتماد القانونية.
- صححت start_url/scope/icon إلى مسارات نسبية مناسبة لـ /-wesh-baed/.
- رُفع إصدار cache إلى v197 وأزيلت ترقيعات المحتوى القديمة من Service Worker.
- لم تُحذف النسخ التاريخية لأن الغرض منها واحتياج الرجوع إليها لم يحسما؛ سجلت للمراجعة بدل الحذف.

## ما يحتاج بشرًا

1. اعتماد المحامي السعودي للقرارات القانونية الـ59.
2. فتح المصادر المصنفة BLOCKED_FROM_AUTOMATED_CHECK يدويًا عند الاعتماد.
3. اعتماد المسودات التجارية والخصوصية من المختصين.
4. اختبار iPhone/Safari وVoiceOver على جهاز فعلي وفق القائمة المرفقة.
5. قرار مالك المنتج بشأن أرشفة النسخ التاريخية بعد أخذ نسخة رجوع.
`;
fs.writeFileSync('docs/non-legal-hardening/NON_LEGAL_PRELAUNCH_REPORT.md',report);
console.log(JSON.stringify({sources:source.total,counts:c,qa:qa.pass},null,2));
