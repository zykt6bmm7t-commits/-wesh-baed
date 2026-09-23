# Release Hygiene

## ملفات التشغيل الفعلية

- `index.html`
- `wesh_baed_sale_final_candidate.html` — مطابق للـindex
- `manifest.webmanifest`
- `icon.svg`
- `service-worker.js`

## نسخ تاريخية محفوظة ولم تُحذف

- `wesh_baed_offline_interactive.html`
- `wesh_baed_premium_v2.html` إلى `wesh_baed_premium_v5.html`
- `wesh_baed_sale_final.html`
- `wesh_baed_sale_final_v14.html`
- `wesh_baed_sale_final_candidate_court_master_v183_FULL_QUESTION_OPTION_AUDIT_FINAL.html`
- `wesh_baed_v186_PREMIUM_UI.html`

السبب: يحتمل أن تكون نقاط رجوع أو آثار تدقيق. حذفها قرار منفصل بعد تأكيد المالك وإنشاء Tag/Release قابل للاستعادة.

## ملاحظات

- لا توجد تبعيات تشغيل خارجية للواجهة.
- ملفات `business/` وWorkflows منفصلة عن صفحة الدليل ولم تُحذف.
- مسارات manifest والأيقونة أصبحت نسبية لصفحة المشروع.
- Service Worker لا يغير HTML أو المحتوى القانوني وقت التشغيل.
