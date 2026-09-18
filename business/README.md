# Business backend — v1.3 development

هذه الطبقة منفصلة عن النسخة الحالية ولا تغيّر main أو Production.

## الموجود الآن
- D1 schema للأحداث والتقييمات وتذاكر الدعم.
- Worker API للأحداث والتقييم والدعم.
- Admin summary API.
- لوحة إدارة أولية.
- Client helper غير موصول بعد بـ index.html.

## قبل التشغيل
1. أنشئ D1 باسم wesh-baed-business-dev.
2. انسخ wrangler.jsonc.example إلى wrangler.jsonc وضع database_id الحقيقي.
3. أضف Secrets خارج GitHub:
   - TURNSTILE_SECRET_KEY
   - ADMIN_API_KEY
4. أنشئ Turnstile widget وخذ sitekey للواجهة.
5. طبّق migration ثم انشر Worker تطوير مستقل.

## حماية
لا تضع TURNSTILE_SECRET_KEY أو ADMIN_API_KEY داخل GitHub أو index.html.
التحقق من Turnstile يتم في Worker عبر Siteverify.

## الخصوصية
Analytics يخزن معرفات تقنية فقط ولا يخزن نص إجابات المستخدم أو تفاصيل القضية.
التعليقات وتذاكر الدعم تُخزن فقط عندما يرسلها المستخدم صراحة.

## ملاحظة
لوحة الإدارة الحالية Development فقط. قبل Production استبدل مفتاح الإدارة اليدوي بمصادقة أقوى مثل Cloudflare Access أو طبقة دخول مكافئة.
