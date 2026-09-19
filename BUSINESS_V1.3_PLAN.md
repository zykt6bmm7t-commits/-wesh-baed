# وش بعد؟ — v1.3 Business

هذا الفرع مخصص للنسخة التجارية فقط، ومبني من v1.2.4 RC عند:
`c62a176fa2d81acae8968585f318f8dff76fbd87`

## حدود الأمان
- لا تعديل على main.
- لا نشر Production.
- لا لمس bayyinah.
- لا تغيير v1.2.4 أثناء بناء النسخة التجارية.
- أي مفاتيح API أو أسرار تبقى خارج GitHub.

## الهدف
بناء طبقة تشغيل تجارية حول المنصة الحالية تشمل:
1. إحصائيات الزيارات ومصادر الحملات.
2. لوحة إدارة خاصة.
3. تقييم النتائج من المستخدمين.
4. تذاكر خدمة العملاء.
5. حسابات المستخدمين.
6. الاشتراكات والمدفوعات في مرحلة لاحقة بعد اختيار مزود الدفع واعتماد حساب التاجر.

## المرحلة A — قبل الإعلان
### Analytics
- page_view
- session_start
- result_view
- campaign_source (utm_source / utm_campaign)
- device class
- referrer

### Feedback
- result_id
- rating 1..5
- helpful yes/no
- optional comment
- created_at

### Support
- ticket id
- category
- message
- status: new / in_progress / closed
- created_at / updated_at

### Admin dashboard
بطاقات:
- زوار اليوم
- زوار آخر 7 أيام
- زوار آخر 30 يومًا
- أكثر المسارات استخدامًا
- أكثر النتائج مشاهدة
- متوسط التقييم
- عدد التذاكر المفتوحة
- مصادر الزيارات والحملات

## المرحلة B — الحسابات
- user id
- email or phone
- created_at
- status
- plan

## المرحلة C — الدفع والاشتراكات
لا يبدأ تنفيذها قبل:
- اختيار بوابة الدفع.
- اعتماد حساب التاجر.
- تحديد الخطط والأسعار.
- تحديد سياسة الإلغاء والاسترجاع.

## بنية Cloudflare المقترحة
- Workers: API + admin endpoints
- D1: analytics/feedback/support/users/subscriptions
- Turnstile: حماية النماذج العامة
- Web Analytics: قياس الزيارات العام
- Secrets: خارج المستودع

## جداول D1 المقترحة
### events
id, event_name, session_id, path, result_id, utm_source, utm_campaign, referrer, device_class, created_at

### feedback
id, session_id, result_id, rating, helpful, comment, created_at

### support_tickets
id, session_id, user_id, category, message, status, created_at, updated_at

### users
id, email, phone, status, plan, created_at, updated_at

### subscriptions
id, user_id, provider, provider_subscription_id, plan, status, starts_at, ends_at, created_at, updated_at

### payments
id, user_id, provider, provider_payment_id, amount_sar, status, created_at

## سياسة الخصوصية التقنية
- لا تُخزن نصوص المستخدم القانونية أو إجابات المسار ضمن analytics.
- analytics يكتفي بمعرفات الأسئلة/النتائج والأحداث التقنية.
- التعليقات وخدمة العملاء تُخزن فقط عند إرسال المستخدم لها صراحة.
- لا تُخزن بيانات دفع حساسة داخل المنصة؛ بوابة الدفع تتولى ذلك.
