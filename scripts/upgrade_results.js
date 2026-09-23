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

const resultCorrections = {
  'R-SS-ELIGIBILITY-APPEAL': {
    authority: 'وزارة الموارد البشرية والتنمية الاجتماعية — برنامج الضمان الاجتماعي المطور.',
    procedure_type: 'اعتراض إداري على نتيجة الأهلية داخل منصة الدعم والحماية الاجتماعية.',
    costs: 'لا توجد رسوم مثبتة للاعتراض الإلكتروني على أهلية الضمان في المصدر الرسمي المرتبط بالخدمة.',
    reason: 'كان الوصف يخلط اعتراض الأهلية الإداري بطلب الاستئناف القضائي ويضيف رسم 5,000 ريال غير منطبق على الخدمة.',
    source_url: 'https://www.hrsd.gov.sa/',
    reference_type: 'خدمة رسمية'
  },
  'R-GOSI-DISABILITY-APPEAL': {
    authority: 'المؤسسة العامة للتأمينات الاجتماعية — اللجنة الطبية الاستئنافية.',
    procedure_type: 'استئناف طبي إداري لقرار اللجنة الطبية الابتدائية لدى التأمينات.',
    costs: 'لا توجد رسوم قضائية مثبتة لهذه الخدمة الطبية الإدارية في المصدر الرسمي المرتبط بها.',
    reason: 'كان الوصف يعامل الاستئناف الطبي لدى التأمينات كاستئناف قضائي ويضيف رسمًا قضائيًا غير منطبق.',
    source_url: 'https://www.gosi.gov.sa/',
    reference_type: 'خدمة رسمية'
  },
  'R-SAKANI-ELIGIBILITY-APPEAL': {
    authority: 'وزارة البلديات والإسكان — برنامج سكني.',
    procedure_type: 'اعتراض إداري على نتيجة استحقاق الدعم السكني داخل سكني.',
    costs: 'لا توجد رسوم قضائية مثبتة لرفع اعتراض عدم الاستحقاق داخل سكني.',
    reason: 'كان الوصف يخلط اعتراض الاستحقاق داخل سكني بالاستئناف القضائي ويضيف رسم 5,000 ريال غير منطبق على الخدمة.',
    source_url: 'https://sakani.sa/',
    reference_type: 'خدمة رسمية'
  },
  'R-LABOR-FILE-COURT': {
    costs: 'العامل المطالب بحقوق ناشئة عن عقد العمل معفى من التكاليف القضائية وفق الاستثناء النظامي؛ وقد تختلف المعالجة إذا كان مقدم الدعوى صاحب العمل أو كان الطلب خارج نطاق الإعفاء.',
    reason: 'استبدال عبارة احتمالية مضللة بقاعدة إعفاء العامل مع إبقاء حدود نطاقها.',
    source_url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/3e368087-7b31-46e7-8005-ada100b8f703/1', reference_type: 'نظام'
  },
  'R-DOMESTIC-AFTER-FAIL': {
    costs: 'العامل المنزلي المطالب بحقوق ناشئة عن عقد العمل معفى من التكاليف القضائية وفق الاستثناء النظامي؛ وقد تختلف المعالجة للطلبات الأخرى أو إذا كان المدعي صاحب العمل.',
    reason: 'توضيح إعفاء العامل بدل الإيحاء بأن مطالبته العمالية تخضع عادةً للتكاليف.',
    source_url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/3e368087-7b31-46e7-8005-ada100b8f703/1', reference_type: 'نظام'
  },
  'R-ADMIN-APPEAL-DEADLINE': {
    deadline: 'الأصل أن مهلة الاعتراض أمام محكمة الاستئناف الإدارية 30 يومًا من تاريخ تسلم صورة الحكم أو من التاريخ المحدد للتسلم عند عدم الحضور، ما لم يوجد نص خاص.',
    reason: 'إزالة تعارض داخلي بين واجهة تقول 30 يومًا وحقل منظم يقول لا يوجد رقم.',
    source_url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/f2f7b465-b576-4f47-a8e7-a9a700f27202/1', reference_type: 'نظام'
  },
  'R-COMM-RELATION-GATE': {
    platform: null,
    reason: 'إزالة منصة إيجار من بوابة تصنيف نزاع تجاري عام؛ لا تحدد المنصة قبل ثبوت الاختصاص.',
    source_url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/38334008-3b70-4c6c-b3af-aba3016a8061/1', reference_type: 'نظام'
  },
  'R-COMM-ARBITRATION-ANNUL': {
    deadline: 'ترفع دعوى بطلان حكم التحكيم خلال 60 يومًا من اليوم التالي لتاريخ تبليغ حكم التحكيم للطرف الذي يطلب البطلان.',
    reason: 'تصحيح الصياغة التي حصرت المهلة بالمحكوم عليه رغم أن النظام يجيزها لأي طرف عند قيام سبب نظامي.',
    source_url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/5535039e-13da-43f6-8f53-a9a700f26485/1', reference_type: 'نظام'
  },
  'R-CIVIL-TORT-DAMAGES': {
    deadline: 'لا تُسمع دعوى التعويض عن الفعل الضار بعد 3 سنوات من تاريخ علم المتضرر بالضرر وبالمسؤول عنه، وبحد أقصى 10 سنوات من وقوع الضرر، مع مراعاة الاستثناء المرتبط بالجريمة.',
    reason: 'إضافة مدة صريحة مؤثرة كانت محذوفة من النتيجة.',
    source_url: 'https://www.uqn.gov.sa/details?p=23125', reference_type: 'نظام'
  },
  'R-CIVIL-INVALID-CONTRACT': {
    deadline: 'لا تُسمع دعوى البطلان بعد 10 سنوات من تاريخ العقد، مع بقاء الدفع بالبطلان ممكنًا في أي وقت وفق النص النظامي.',
    reason: 'إضافة مدة عدم سماع دعوى البطلان والتمييز بينها وبين الدفع بالبطلان.',
    source_url: 'https://www.uqn.gov.sa/details?p=23125', reference_type: 'نظام'
  },
  'R-CIVIL-SALE-DEFECT': {
    deadline: 'الأصل ألا تُسمع دعوى ضمان العيب بعد 180 يومًا من تاريخ تسليم المبيع، ما لم يلتزم البائع بمدة أطول؛ ولا يتمسك بها البائع عند ثبوت إخفاء العيب غشًا.',
    reason: 'إضافة مدة ضمان العيب المؤثرة والاستثناء من الاحتجاج بها.',
    source_url: 'https://www.uqn.gov.sa/details?p=23125', reference_type: 'نظام'
  },
  'R-CIVIL-SALE-HIDDEN-DEFECT': {
    deadline: 'الأصل ألا تُسمع دعوى ضمان العيب بعد 180 يومًا من تاريخ تسليم المبيع، ما لم يلتزم البائع بمدة أطول؛ ولا يتمسك بها البائع عند ثبوت إخفاء العيب غشًا.',
    reason: 'استكمال تاريخ بداية المهلة مع استثناء الإخفاء غشًا.',
    source_url: 'https://www.uqn.gov.sa/details?p=23125', reference_type: 'نظام'
  },
  'R-FAM-ANNUL-ABSENCE': {
    deadline: 'إذا كان عنوان الزوج معروفًا وغيابه ليس بسبب العمل، فلا يطلب الفسخ لهذا السبب إلا بعد غياب 4 أشهر على الأقل؛ وتنذره المحكمة وقد تضرب له أجلًا لا يزيد على 180 يومًا من تاريخ الإنذار.',
    reason: 'إضافة الشرط والآجال الصريحة في نظام الأحوال الشخصية.',
    source_url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/4d72d829-947b-45d5-b9b5-ae5800d6bac2/1', reference_type: 'نظام'
  },
  'R-FAM-MISSING-DEATH': {
    deadline: 'إذا كانت ظروف الفقد يغلب معها الهلاك فالحد الأدنى سنة، وفي غير ذلك لا يحكم بالموت إلا بعد مضي 4 سنوات من تاريخ إبلاغ الجهة المختصة بالفقد.',
    reason: 'إضافة فرع الأربع سنوات الذي كان مفقودًا من النتيجة.',
    source_url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/4d72d829-947b-45d5-b9b5-ae5800d6bac2/1', reference_type: 'نظام'
  },
  'R-JUDGMENT-OPPONENT-APPEAL': {
    next_step: 'افتح القضية وراجع لائحة اعتراض الخصم وحالة الطلب. قدّم مذكرة جوابية فقط من المسار المتاح داخل القضية أو عند طلب الدائرة؛ ولا تنشئ طلب استئناف جديدًا لمجرد أن الخصم اعترض.',
    ui_next_step: 'راجع اعتراض الخصم داخل القضية، وقدّم ردك من مسار المذكرات المتاح أو عند طلب الدائرة. لا ترفع استئنافًا جديدًا إلا إذا كنت تريد الاعتراض بنفسك وما زالت مهلتك قائمة.',
    reason: 'كانت النتيجة توجه المستجيب إلى تقديم استئناف جديد بدل متابعة اعتراض الخصم والرد عليه.',
    source_url: 'https://moj.gov.sa/ar/eServices/Pages/cba332a0-28b8-4ce0-ab00-ef4ddeb9ab64.aspx', reference_type: 'خدمة رسمية'
  },
  'R-DIGITAL-NAFATH-SUPPORT': {
    platform: 'النفاذ الوطني الموحد / تطبيق نفاذ',
    reason: 'تصحيح منصة أبشر التي أضيفت آليًا بسبب مطابقة نصية غير صحيحة.', source_url: 'https://www.iam.gov.sa/', reference_type: 'خدمة رسمية'
  },
  'R-CRIM-COURT': {
    court: 'المحكمة الجزائية',
    reason: 'تصحيح المحكمة العامة المخالفة لوصف النتيجة والاختصاص الجزائي.', source_url: 'https://www.moj.gov.sa/', reference_type: 'خدمة رسمية'
  },
  'R-COMM-IP-SERVICE': {platform:'الخدمات الإلكترونية للهيئة السعودية للملكية الفكرية',reason:'تصحيح إسناد الخدمة إلى النفاذ الوطني بدل منصة الجهة المختصة.',source_url:'https://www.saip.gov.sa/',reference_type:'خدمة رسمية'},
  'R-COMM-IP-COPYRIGHT-ENFORCEMENT': {platform:'الخدمات الإلكترونية للهيئة السعودية للملكية الفكرية',reason:'تصحيح المنصة الناتجة عن استدلال نصي آلي.',source_url:'https://www.saip.gov.sa/',reference_type:'خدمة رسمية'},
  'R-COMM-IP-PATENT-ENFORCEMENT': {platform:'الهيئة السعودية للملكية الفكرية أو ناجز بحسب نوع الطلب',reason:'منع حصر مسار متعدد المراحل في منصة نفاذ.',source_url:'https://www.saip.gov.sa/',reference_type:'خدمة رسمية'},
  'R-MEWA-AGRI-REGISTER': {platform:'منصة نما',reason:'تصحيح اسم منصة الخدمة الزراعية.',source_url:'https://naama.sa/',reference_type:'خدمة رسمية'},
  'R-FAM-HEIRS-CERT': {platform:'منصة التركات / ناجز بحسب الخدمة المتاحة',reason:'تصحيح منصة النفاذ الوطني بوصفها قناة دخول لا منصة تقديم.',source_url:'https://www.moj.gov.sa/',reference_type:'خدمة رسمية'},
  'R-FAM-WILL-VALIDITY': {platform:null,reason:'إزالة منصة نفاذ لعدم ثبوت أنها منصة الإجراء نفسه.',source_url:'https://www.moj.gov.sa/',reference_type:'خدمة رسمية'},
  'R-CIVIL-SALE-OTHER-OWNER': {platform:null,reason:'إزالة منصة نفاذ المضافة بالاستدلال النصي.',source_url:'https://www.moj.gov.sa/',reference_type:'خدمة رسمية'},
  'R-CIVIL-AGENCY-SCOPE': {platform:null,reason:'إزالة منصة نفاذ المضافة بالاستدلال النصي.',source_url:'https://www.moj.gov.sa/',reference_type:'خدمة رسمية'},
  'R-FAM-GUARDIAN-CONTINUE': {platform:null,reason:'إزالة معين الناتجة عن مطابقة كلمة عربية عادية.',source_url:'https://www.moj.gov.sa/',reference_type:'خدمة رسمية'},
  'R-EVID-WRITING': {platform:null,reason:'إزالة معين الناتجة عن مطابقة كلمة عربية عادية.',source_url:'https://laws.boe.gov.sa/',reference_type:'نظام'},
  'R-CIVIL-SALE-PRICE': {platform:null,reason:'إزالة معين الناتجة عن مطابقة كلمة عربية عادية.',source_url:'https://www.uqn.gov.sa/details?p=23125',reference_type:'نظام'},
  'R-CIVIL-GIFT-CONDITION': {platform:null,reason:'إزالة معين الناتجة عن مطابقة كلمة عربية عادية.',source_url:'https://www.uqn.gov.sa/details?p=23125',reference_type:'نظام'}
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
  const addReviewResult = (id, baseId, overrides) => {
    if (db.results[id]) return;
    const base = db.results[baseId];
    if (!base) throw new Error(`Missing base result ${baseId}`);
    db.results[id] = {
      ...base,
      ...overrides,
      result_id: id,
      last_verified: '2026-09-23',
      content_change_log: {
        date: '2026-09-23', risk_before: 'HIGH', before: 'حلقة أسئلة بلا مخرج',
        after: 'نتيجة تحقق عملية تمنع التخمين', reason: 'إزالة حلقة عدم المعرفة وإعطاء المستخدم خطوة قابلة للتنفيذ.',
        source_url: (db.sources[base.source_id] || {}).url, reference_type: 'خدمة رسمية', periodic_review: true,
        human_approval: 'NEEDS_REVIEW'
      }
    };
  };
  addReviewResult('R-EXECUTION-ROUTE-CHECK', 'R-EXEC-STATUS-CHECK', {
    current_situation: 'لا تعرف صفتك أو نوع الإجراء الظاهر في طلب التنفيذ.',
    ui_current_situation: 'تفاصيل طلب التنفيذ غير واضحة لك، لذلك لا يصح اختيار إجراء بالحدس.',
    next_step: 'افتح طلب التنفيذ في ناجز، وسجّل صفتك كما تظهر، ونوع السند، وآخر قرار أو حالة. بعد ذلك ارجع واختر الوصف المطابق.',
    ui_next_step: 'افتح الطلب في ناجز وخذ لقطة مكتوبة لثلاثة أشياء: صفتك، نوع السند، وآخر قرار. ثم ارجع للمسار.',
    service: 'التحقق من بيانات طلب التنفيذ القائم', procedure_type: 'تحقق قبل اختيار إجراء التنفيذ',
    requirements: 'رقم طلب التنفيذ والدخول إلى ناجز.', documents: 'صورة من صفحة تفاصيل الطلب دون مشاركة بياناتك الشخصية.',
    common_mistake: 'تقديم منازعة أو طلب رفع إجراء قبل معرفة صفتك ونوع القرار.'
  });
  addReviewResult('R-LABOR-STAGE-CHECK', 'R-LABOR-FILE-COURT', {
    current_situation: 'مرحلة نزاعك العمالي غير واضحة.', ui_current_situation: 'لا تعرف هل أنت قبل التسوية الودية أو بعدها أو داخل قضية قائمة.',
    next_step: 'تحقق أولًا من وجود طلب تسوية ودية ومحضر انتهائها، ثم تحقق من وجود رقم قضية عمالية في ناجز.',
    ui_next_step: 'افتح التسوية الودية وناجز: إذا عندك محضر تعذر صلح اختر مسار رفع الدعوى، وإذا عندك رقم قضية اختر مسار القضية القائمة.',
    service: 'التحقق من مرحلة النزاع العمالي', procedure_type: 'تحقق إجرائي قبل التقديم', costs: 'التحقق من الحالة لا يتضمن رسمًا قضائيًا.'
  });
  addReviewResult('R-FAMILY-DOCUMENT-CHECK', 'R-FAM-CUSTODY-EXEC', {
    current_situation: 'لديك اتفاق أو مستند أسري لكنك لا تعرف هل هو حكم قابل للتنفيذ.', ui_current_situation: 'المستند الذي معك يحتاج تصنيفًا قبل فتح طلب تنفيذ.',
    next_step: 'تحقق من اسم المستند وحالته في ناجز: حكم مكتسب للنفاذ، أو محضر صلح مصدق، أو اتفاق خاص غير موثق.',
    ui_next_step: 'افتح المستند واقرأ عنوانه وحالته. لا تبدأ تنفيذ حضانة أو زيارة قبل التأكد أنه سند تنفيذي.',
    service: 'التحقق من نوع المستند الأسري', procedure_type: 'فحص سند قبل التنفيذ'
  });
  addReviewResult('R-REAL-STATUS-CHECK', 'R-SALE-CHECK-CASE-STAGE', {
    current_situation: 'بيانات العقد أو التسجيل العقاري غير واضحة.', ui_current_situation: 'لا تعرف هل العقد موثق في إيجار أو مشمولًا بالتنفيذ أو هل العقار داخل نطاق التسجيل العيني.',
    next_step: 'تحقق من رقم العقد وحالته في إيجار، ومن بيانات الصك أو صحيفة العقار، ثم عد لاختيار المسار المطابق.',
    ui_next_step: 'استخرج حالة العقد من إيجار وبيانات العقار من الصك أو السجل؛ لا تبدأ دعوى أو تنفيذًا قبل تحديدها.',
    service: 'التحقق من بيانات العقد والعقار', procedure_type: 'تحقق قبل اختيار المسار العقاري', platform: 'إيجار أو ناجز بحسب المستند'
  });
  addReviewResult('R-CRIMINAL-STATUS-CHECK', 'R-CRIM-SUMMONS-CHECK', {
    current_situation: 'صفتك ومرحلة البلاغ أو القضية الجزائية غير واضحتين.', ui_current_situation: 'لا تعرف هل أنت مبلّغًا أو مدعيًا بالحق الخاص أو متهمًا، ولا المرحلة الحالية.',
    next_step: 'تحقق من نص الإشعار والجهة المرسلة ورقم البلاغ أو القضية، واطلب مساعدة قانونية عاجلة إذا كان هناك استدعاء أو توقيف.',
    ui_next_step: 'راجع نص الإشعار وحدد الجهة ورقم البلاغ وصفتك المكتوبة. عند الاستدعاء أو التوقيف استعِن بمحامٍ فورًا.',
    service: 'التحقق من حالة البلاغ أو القضية الجزائية', procedure_type: 'تحقق قبل اتخاذ إجراء جزائي'
  });
  addReviewResult('R-DOCUMENTATION-SERVICE-CHECK', 'R-DIGITAL-NAFATH-SUPPORT', {
    current_situation: 'تحتاج خدمة توثيق لكن اسمها غير واضح.', ui_current_situation: 'تعرف الغرض من التوثيق لكن لا تعرف اسم الخدمة الرسمية.',
    next_step: 'حدد نوع التصرف أولًا: وكالة، إقرار، أحوال شخصية، تركة، أو عقار؛ ثم ابحث بالاسم الرسمي في دليل خدمات ناجز.',
    ui_next_step: 'حدد الورقة التي تريد إصدارها والأطراف والغرض منها، ثم طابقها مع دليل خدمات ناجز قبل البدء.',
    authority: 'وزارة العدل', platform: 'ناجز', service: 'دليل الخدمات العدلية', procedure_type: 'تحديد خدمة التوثيق الصحيحة'
  });
  for (const [id, base, situation, step] of [
    ['R-SPECIAL-PRIVACY-START','R-SPECIAL-PRIVACY-FOLLOW','لم تبدأ شكوى حماية البيانات بعد.','ابدأ أولًا بطلب ممارسة الحق أو الشكوى لدى الجهة التي تعالج بياناتك، واحتفظ برقم الطلب والرد قبل التصعيد للجهة المختصة.'],
    ['R-SPECIAL-EDU-START','R-SPECIAL-EDU-FOLLOW','لم تبدأ شكوى رسوم المدرسة الأهلية بعد.','قدّم الشكوى أولًا عبر قناة وزارة التعليم المختصة، وأرفق العقد والفاتورة وما يثبت السداد.'],
    ['R-SPECIAL-ELECTRICITY-START','R-SPECIAL-ELECTRICITY-FOLLOW','لم تبدأ شكوى الكهرباء لدى مقدم الخدمة بعد.','قدّم الشكوى أولًا إلى مقدم الخدمة وخذ رقمًا مرجعيًا؛ صعّد إلى هيئة تنظيم المياه والكهرباء بعد الرد أو انقضاء المدة المنشورة.'],
    ['R-SPECIAL-WATER-START','R-SPECIAL-WATER-FOLLOW','لم تبدأ شكوى المياه لدى مقدم الخدمة بعد.','قدّم الشكوى أولًا إلى مقدم الخدمة وخذ رقمًا مرجعيًا؛ ثم صعّد بحسب مدة الرد ومسار الجهة التنظيمية.']
  ]) addReviewResult(id, base, {current_situation:situation,ui_current_situation:situation,next_step:step,ui_next_step:step,procedure_type:'شكوى أولية قبل التصعيد'});

  const routeFixes = {
    Q041:'R-EXECUTION-ROUTE-CHECK',
    Q033:'R-JUDGMENT-CHECK-STAGE', Q056:'R-LABOR-STAGE-CHECK', Q074:'R-FAMILY-DOCUMENT-CHECK',
    Q083:'R-REAL-STATUS-CHECK', Q085:'R-REAL-STATUS-CHECK', Q093:'R-REAL-STATUS-CHECK',
    Q090:'R-CRIMINAL-STATUS-CHECK', Q100:'R-DOCUMENTATION-SERVICE-CHECK', Q208:'R-JUDGMENT-CHECK-STAGE',
    Q219:'R-COMM-NEGOTIABLE-CHECK', Q204:'R-EXECUTION-ROUTE-CHECK', Q325:'R-EXECUTION-ROUTE-CHECK',
    Q327:'R-EXECUTION-ROUTE-CHECK', Q328:'R-EXECUTION-ROUTE-CHECK', Q332:'R-EXECUTION-ROUTE-CHECK', Q334:'R-EXECUTION-ROUTE-CHECK'
  };
  for (const [qid, target] of Object.entries(routeFixes)) {
    const option = db.options[qid].find(o => /^QD\d+$/.test(o.next_id));
    if (option) option.next_id = target;
  }
  const q20Unknown=db.options.Q020.find(o=>o.next_id==='QD09'||o.label.includes('ما أعرف')); if(q20Unknown) q20Unknown.next_id='QD09';
  const q23Unknown=db.options.Q023.find(o=>o.next_id==='QD09'||o.label.includes('ما أعرف')); if(q23Unknown) q23Unknown.next_id='QD09';
  if(db.options.QD09?.[0]) db.options.QD09[0].next_id='R-CASE-MONITOR';
  if(db.options.QD09?.[1]) db.options.QD09[1].next_id='R-JUDGMENT-CHECK-STAGE';
  const q603Return=db.options.Q603?.find(o=>o.next_id==='Q090'); if(q603Return) q603Return.next_id='R-CRIMINAL-STATUS-CHECK';
  for (const [qid,target] of Object.entries({Q251:'R-SPECIAL-PRIVACY-START',Q253:'R-SPECIAL-EDU-START',Q254:'R-SPECIAL-ELECTRICITY-START',Q255:'R-SPECIAL-WATER-START'})) db.options[qid][0].next_id=target;
  db.decision_tree_change_log = {
    date:'2026-09-23', reason:'إزالة حلقات عدم المعرفة التي تعيد المستخدم إلى السؤال نفسه دون معلومة تشخيصية جديدة.',
    changed_origins:Object.keys({...routeFixes,Q251:1,Q253:1,Q254:1,Q255:1}), review_status:'NEEDS_HUMAN_REVIEW'
  };
  const questionTextFixes = {
    Q024:'وش وضع قضيتك الآن؟', Q035:'وش تبي تسوي في مرحلة الاستئناف؟',
    Q054:'وش صفتك أو وش الخدمة العمالية اللي تحتاجها؟', Q079:'وش تبي تسوي بالحكم الأسري؟',
    Q139:'وش وضع الحكم الجزائي أو الإجراء اللي تحتاجه؟'
  };
  for (const [qid,text] of Object.entries(questionTextFixes)) { db.nodes[qid].text=text; db.nodes[qid].ui_question_text=text; }
  if (db.nodes.Q314) { db.nodes.Q314.text=db.nodes.Q314.text.replace(/\?$/,'؟'); db.nodes.Q314.ui_question_text=db.nodes.Q314.text; }
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
    const correction = resultCorrections[r.result_id];
    if (correction) {
      const metadata = new Set(['reason','source_url','reference_type']);
      const keys = Object.keys(correction).filter(k=>!metadata.has(k));
      const previous = Object.fromEntries(keys.map(k=>[k,r[k]]));
      for (const key of keys) correction[key] === null ? delete r[key] : r[key] = correction[key];
      if (['R-SS-ELIGIBILITY-APPEAL','R-GOSI-DISABILITY-APPEAL','R-SAKANI-ELIGIBILITY-APPEAL'].includes(r.result_id)) delete r.judicial_costs_verified;
      r.content_change_log = {
        date: '2026-09-23',
        risk_before: 'HIGH',
        before: previous,
        after: Object.fromEntries(keys.map(k=>[k,r[k]])),
        reason: correction.reason,
        source_url: correction.source_url,
        reference_type: correction.reference_type,
        periodic_review: true,
        human_approval: 'NEEDS_REVIEW'
      };
    }
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
