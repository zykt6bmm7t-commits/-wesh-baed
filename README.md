# وش بعد؟

منصة قرار إجرائي سعودية تساعد المستخدم على الوصول إلى الخطوة التالية والمصدر الرسمي عبر أسئلة قصيرة.

## الحالة

**PRE-LEGAL REVIEW COMPLETE — AWAITING LICENSED SAUDI LAWYER APPROVAL**

- Questions: 305
- Options: 1,296
- Results: 646
- Sources: 621

لا يجوز وصف المشروع بأنه معتمد قانونيًا قبل إدخال اعتماد المحامي السعودي المرخص في حزمة `docs/LAWYER_FINAL_REVIEW_PACKET`.

## تقارير المراجعة

- [التقرير القانوني الكامل](reports/legal-approval-master/index.html): عارض قابل للبحث والتصفية والطباعة لجميع النتائج الـ646.
- [الملخص التنفيذي](docs/LEGAL_APPROVAL_EXECUTIVE_SUMMARY.md).
- [ملف CSV الأصلي](docs/LEGAL_APPROVAL_MASTER.csv).

## ملفات التشغيل

- `index.html`: نسخة GitHub Pages.
- `wesh_baed_sale_final_candidate.html`: نسخة البيع المطابقة.
- `manifest.webmanifest`, `icon.svg`, `service-worker.js`: أصول الويب/PWA.

## اختبارات أساسية

```bash
node scripts/non_legal_qa.js
node scripts/legal_approval_qa.js
node scripts/lawyer_handoff_qa.js
```

المسودات التجارية غير المعتمدة موجودة في `docs/pre-sale-drafts/`.
