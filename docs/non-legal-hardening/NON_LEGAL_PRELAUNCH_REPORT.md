# NON-LEGAL PRE-LAUNCH HARDENING

تاريخ الفحص: 2026-09-23

حالة المشروع القانونية: **PRE-LEGAL REVIEW COMPLETE — AWAITING LICENSED SAUDI LAWYER APPROVAL**

لم تُعدّل أي مادة أو مدة أو رسوم أو اختصاص، ولم يُحسم أي من القرارات القانونية المعلقة.

## سلامة البيانات والشجرة

- Questions: 305
- Options: 1296
- Results: 646
- Sources: 621
- Broken next_id: 0
- Unreachable Questions: 0
- Unreachable Results: 0
- Dead ends: 0
- Missing source_id: 0
- Duplicate Questions: 0
- Duplicate Options: 0
- JavaScript syntax errors: 0

## صحة الروابط الرسمية

- Sources tested: 621
- ACTIVE: 381
- REDIRECTED: 7
- BROKEN: 0
- SUPERSEDED: 0
- BLOCKED_FROM_AUTOMATED_CHECK: 167
- JAVASCRIPT_REQUIRED: 0
- LOGIN_REQUIRED: 0
- PDF_OR_DOCUMENT: 65
- REQUIRES_LEGAL_REVIEW: 1

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

- index.html: 5,396,979 bytes.
- نسخة البيع مطابقة للـindex: YES.
- أزيل تعديل HTML وقت التشغيل من Service Worker، وثُبتت مسارات Project Pages النسبية في manifest.
- بقي الهيكل الأحادي الكبير كما هو؛ فصل البيانات الآن مخاطرة غير لازمة قبل اعتماد المحامي ويتطلب اختبار تطابق مستقلًا. يوصى به كتحسين لاحق، لا كشرط يمنع التسليم للمحامي.

## Security وPrivacy التقنية

- Cookies: لا توجد.
- Analytics/trackers: لا توجد.
- External scripts: 0.
- Forms: 0.
- Unsafe target=_blank: 0.
- Secrets/tokens detected: 0.
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
