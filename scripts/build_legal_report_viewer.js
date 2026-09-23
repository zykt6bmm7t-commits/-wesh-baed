const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || 'docs/LEGAL_APPROVAL_MASTER.csv';
const OUTPUT = process.argv[3] || 'reports/legal-approval-master/index.html';

function parseCsv(raw) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (quoted) {
      if (char === '"' && raw[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  if (!headers || rows.some((item) => item.length !== headers.length)) throw new Error('Invalid CSV shape');
  return rows.filter((item) => item.some(Boolean)).map((item) => Object.fromEntries(headers.map((header, i) => [header, item[i]])));
}

const records = parseCsv(fs.readFileSync(INPUT, 'utf8'));
if (records.length !== 646) throw new Error(`Expected 646 results, found ${records.length}`);

const json = JSON.stringify(records).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');
const generated = new Date().toISOString().slice(0, 10);
const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'">
  <title>التقرير القانوني الكامل — وش بعد؟</title>
  <style>
    :root{--ink:#15362e;--muted:#586963;--green:#0d4f3c;--gold:#806126;--line:#dce5e1;--paper:#fff;--bg:#f5f3ed;--critical:#9f2525;--high:#a44c13;--medium:#806126;--low:#29735b}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:Tahoma,Arial,sans-serif;line-height:1.7}
    a{color:var(--green)}button,input,select{font:inherit}.skip{position:absolute;inset-inline-start:-999px}.skip:focus{inset-inline-start:1rem;top:1rem;background:#fff;padding:.7rem;z-index:9}
    header{background:linear-gradient(145deg,#0c4938,#153e34);color:#fff;padding:2rem max(1rem,calc((100% - 1180px)/2))}header h1{margin:0 0 .3rem;font-size:clamp(1.55rem,4vw,2.4rem)}header p{margin:.2rem 0;color:#e5eee9}
    .status{display:inline-block;margin-top:.8rem;padding:.35rem .7rem;border:1px solid #ffffff55;border-radius:999px;font-size:.86rem}
    main{max-width:1180px;margin:auto;padding:1rem}.toolbar,.card,.notice{background:var(--paper);border:1px solid var(--line);border-radius:18px;box-shadow:0 8px 26px #173e3110}
    .notice{margin-bottom:1rem;padding:1rem;border-inline-start:5px solid var(--gold)}.toolbar{position:sticky;top:.5rem;z-index:3;padding:1rem;margin-bottom:1rem}
    .controls{display:grid;grid-template-columns:minmax(220px,2fr) repeat(2,minmax(150px,1fr));gap:.65rem}.controls input,.controls select{width:100%;min-height:46px;border:1px solid #aabbb4;border-radius:10px;padding:.65rem;background:#fff;color:var(--ink)}
    .meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.7rem;align-items:center;margin-top:.75rem}.actions{display:flex;flex-wrap:wrap;gap:.5rem}.btn{display:inline-flex;align-items:center;min-height:44px;padding:.55rem .8rem;border:1px solid var(--green);border-radius:10px;background:#fff;color:var(--green);text-decoration:none;cursor:pointer}
    .cards{display:grid;gap:.8rem}.card{overflow:hidden}.card summary{cursor:pointer;list-style:none;padding:1rem;display:grid;grid-template-columns:auto 1fr auto;gap:.8rem;align-items:center}.card summary::-webkit-details-marker{display:none}.id{font-weight:700;direction:ltr}.sector{color:var(--muted)}.risk{color:#fff;padding:.2rem .55rem;border-radius:999px;font-size:.78rem}.CRITICAL{background:var(--critical)}.HIGH{background:var(--high)}.MEDIUM{background:var(--medium)}.LOW{background:var(--low)}
    .content{border-top:1px solid var(--line);padding:1rem}.field{display:grid;grid-template-columns:minmax(155px,22%) 1fr;gap:.8rem;padding:.65rem 0;border-bottom:1px solid #edf1ef}.field:last-child{border:0}.field dt{font-weight:700}.field dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.empty{color:var(--muted);text-align:center;padding:3rem}
    .pager{display:flex;justify-content:center;align-items:center;gap:.7rem;margin:1rem}.pager button{min-height:44px;padding:.5rem 1rem;border:1px solid var(--green);background:#fff;color:var(--green);border-radius:10px}.pager button:disabled{opacity:.4}
    @media(max-width:700px){header{padding:1.4rem 1rem}.controls{grid-template-columns:1fr}.toolbar{position:static}.card summary{grid-template-columns:1fr auto}.sector{grid-column:1/-1}.field{grid-template-columns:1fr;gap:.15rem}}
    @media print{header,.toolbar,.pager,.notice{display:none}.card{break-inside:avoid;box-shadow:none}.card details,.card .content{display:block}.cards{display:block}.card{margin-bottom:.6rem}}
  </style>
</head>
<body>
  <a class="skip" href="#results">انتقل إلى النتائج</a>
  <header><h1>التقرير القانوني الكامل</h1><p>سجل الاعتماد السابق للمراجعة القانونية — جميع النتائج وعددها 646</p><span class="status">PRE-LEGAL REVIEW COMPLETE — AWAITING LICENSED SAUDI LAWYER APPROVAL</span></header>
  <main>
    <section class="notice" aria-label="تنبيه"><strong>هذا التقرير غير معتمد قانونيًا.</strong> أُعد لتسريع مراجعة المحامي السعودي المرخص، ولا يمثل اعتمادًا أو رأيًا قانونيًا نهائيًا. تاريخ بناء العارض: ${generated}.</section>
    <section class="toolbar" aria-label="أدوات التقرير">
      <div class="controls">
        <label><span>بحث</span><input id="search" type="search" placeholder="Result ID، القطاع، النص…" autocomplete="off"></label>
        <label><span>الخطورة</span><select id="risk"><option value="">الكل</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label>
        <label><span>تصنيف التحقق</span><select id="verification"><option value="">الكل</option></select></label>
      </div>
      <div class="meta"><strong id="count" aria-live="polite"></strong><div class="actions"><a class="btn" href="../../docs/LEGAL_APPROVAL_MASTER.csv" download>تنزيل CSV الأصلي</a><a class="btn" href="../../docs/LEGAL_APPROVAL_EXECUTIVE_SUMMARY.md">الملخص التنفيذي</a><button class="btn" type="button" onclick="window.print()">طباعة</button></div></div>
    </section>
    <section id="results" class="cards" aria-label="نتائج التقرير"></section>
    <nav class="pager" aria-label="صفحات التقرير"><button id="prev" type="button">السابق</button><span id="page"></span><button id="next" type="button">التالي</button></nav>
  </main>
  <script>
    const DATA=${json};
    const FIELDS=${JSON.stringify(Object.keys(records[0])).replace(/</g, '\\u003c')};
    const PAGE_SIZE=25; let page=1,filtered=DATA;
    const el=id=>document.getElementById(id); const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const linkify=(value,field)=>field==='رابط المصدر'&&String(value||'').startsWith('https://')?'<a href="'+escapeHtml(value)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(value)+'</a>':escapeHtml(value||'—');
    [...new Set(DATA.map(x=>x['تصنيف التحقق']).filter(Boolean))].sort().forEach(v=>el('verification').insertAdjacentHTML('beforeend','<option>'+escapeHtml(v)+'</option>'));
    function apply(){const query=el('search').value.trim().toLocaleLowerCase('ar');const risk=el('risk').value,verification=el('verification').value;filtered=DATA.filter(x=>(!risk||x['مستوى الخطورة القانونية']===risk)&&(!verification||x['تصنيف التحقق']===verification)&&(!query||Object.values(x).join(' ').toLocaleLowerCase('ar').includes(query)));page=1;render()}
    function render(){const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));page=Math.min(page,pages);const items=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);el('count').textContent='المعروض: '+filtered.length+' من '+DATA.length+' نتيجة';el('page').textContent='صفحة '+page+' من '+pages;el('prev').disabled=page===1;el('next').disabled=page===pages;el('results').innerHTML=items.length?items.map(x=>'<details class="card"><summary><span class="id">'+escapeHtml(x['Result ID'])+'</span><span class="sector">'+escapeHtml(x['القطاع'])+'</span><span class="risk '+escapeHtml(x['مستوى الخطورة القانونية'])+'">'+escapeHtml(x['مستوى الخطورة القانونية'])+'</span></summary><dl class="content">'+FIELDS.map(f=>'<div class="field"><dt>'+escapeHtml(f)+'</dt><dd>'+linkify(x[f],f)+'</dd></div>').join('')+'</dl></details>').join(''):'<p class="empty">لا توجد نتائج مطابقة.</p>'}
    ['search','risk','verification'].forEach(id=>el(id).addEventListener(id==='search'?'input':'change',apply));el('prev').addEventListener('click',()=>{page--;render();scrollTo({top:0,behavior:'smooth'})});el('next').addEventListener('click',()=>{page++;render();scrollTo({top:0,behavior:'smooth'})});render();
  </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, html);
console.log(`Built ${OUTPUT} with ${records.length} results (${Buffer.byteLength(html)} bytes)`);
