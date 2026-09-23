const fs = require('fs');

const files = ['index.html', 'wesh_baed_sale_final_candidate.html'];

const popstateListener = "window.addEventListener('popstate',event=>{const state=event.state;if(!state||!state.wb)return;restoringBrowserState=true;try{view=state.view||'cover';current=state.current||null;historyStack=Array.isArray(state.historyStack)?state.historyStack:[];if(view==='route'&&current&&(DB.nodes[current]||DB.results[current])){saveState();render()}else if(view==='dashboard')dashboard();else cover()}finally{restoringBrowserState=false}});";

const oldQuickScores = "function quickScores(v){const q=norm(v),words=q.split(' ').filter(x=>x.length>1),base=[...QUICK];for(const [id] of QUICK_EXACT)if(!base.some(x=>x[0]===id))base.push([id,'']);return base.map(([id,terms])=>{const set=new Set(norm(terms).split(' '));let score=words.reduce((n,w)=>n+(set.has(w)?3:0),0);for(const [pid,phrases] of QUICK_PHRASES)if(pid===id)for(const phrase of phrases)if(q.includes(norm(phrase)))score+=12;for(const [pid,phrases] of QUICK_EXACT)if(pid===id)for(const phrase of phrases){const p=norm(phrase);if(q===p)score+=120;else if(q.includes(p))score+=80}return{id,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)}";
const newQuickScores = "function quickScores(v){const q=norm(v),words=q.split(' ').filter(x=>x.length>1),base=QUICK.map(([id,terms])=>[id,Array.isArray(terms)?terms:[terms]]);for(const [id,node] of Object.entries(DB.nodes)){const aliases=Array.isArray(node.search_aliases)?node.search_aliases:[];if(!aliases.length)continue;const row=base.find(x=>x[0]===id);if(row)row[1].push(...aliases);else base.push([id,[...aliases]])}for(const group of [QUICK_PHRASES,QUICK_EXACT])for(const [id] of group)if(!base.some(x=>x[0]===id))base.push([id,[]]);return base.map(([id,terms])=>{const aliases=terms.map(norm).filter(Boolean),set=new Set(aliases.flatMap(x=>x.split(' '))),padded=' '+q+' ';let score=words.reduce((n,w)=>n+(set.has(w)?3:0),0);for(const alias of aliases){if(q===alias)score+=100;else if(alias.includes(' ')&&padded.includes(' '+alias+' '))score+=55}for(const [pid,phrases] of QUICK_PHRASES)if(pid===id)for(const phrase of phrases){const p=norm(phrase);if(q===p)score+=100;else if(p.includes(' ')&&padded.includes(' '+p+' '))score+=30}for(const [pid,phrases] of QUICK_EXACT)if(pid===id)for(const phrase of phrases){const p=norm(phrase);if(q===p)score+=120;else if(p.includes(' ')&&padded.includes(' '+p+' '))score+=80}return{id,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)}";

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  const listenerCount = html.split(popstateListener).length - 1;
  if (listenerCount < 1) throw new Error(`${file}: popstate listener missing`);
  if (listenerCount > 1) {
    html = html.split(popstateListener).join('');
    html = html.replace('cover();\n</script>', `${popstateListener}\ncover();\n</script>`);
  }

  html = html.replace(
    '@supports(padding:max(0px)){body{padding-top:max(0px,env(safe-area-inset-top));padding-bottom:max(0px,env(safe-area-inset-bottom));}.wrap{padding-left:max(18px,env(safe-area-inset-left));padding-right:max(18px,env(safe-area-inset-right));}}',
    '@supports(padding:max(0px)){body{padding-top:max(0px,env(safe-area-inset-top));padding-bottom:max(0px,env(safe-area-inset-bottom));}.app{padding-left:max(18px,env(safe-area-inset-left));padding-right:max(18px,env(safe-area-inset-right));}}'
  );
  html = html.replace('.dashboard .resume .btn{min-height:43px', '.dashboard .resume .btn{min-height:44px');
  if (!html.includes('.section p,.infoRow span,.lead,.qtitle,.tile,.opt,.source{overflow-wrap:anywhere}')) {
    html = html.replace(
      '</style>',
      '.section p,.infoRow span,.lead,.qtitle,.tile,.opt,.source{overflow-wrap:anywhere}\n</style>'
    );
  }

  html = html.replace(
    "function norm(s){return String(s||'').toLowerCase()",
    "function norm(s){return String(s||'').slice(0,500).toLowerCase()"
  );
  if (html.includes(oldQuickScores)) html = html.replace(oldQuickScores, newQuickScores);
  else if (!html.includes(newQuickScores)) throw new Error(`${file}: quickScores signature not found`);
  html = html.replace(
    "function renderQuickSearch(v,box){const q=norm(v);box.innerHTML='';if(q.length<2)return;",
    "function renderQuickSearch(v,box){const q=norm(v);box.innerHTML='';if(q.length<2){if(String(v||'').trim())box.innerHTML='<div class=\"searchHint\">اكتب كلمة واضحة من حرفين على الأقل.</div>';return;}"
  );
  html = html.replace(
    'autocomplete="off" placeholder="مثال: فصلوني من العمل، عندي حكم، حسابي محجوز..."',
    'autocomplete="off" maxlength="500" placeholder="مثال: فصلوني من العمل، عندي حكم، حسابي محجوز..."'
  );
  html = html.replace(
    "function dashboard(){current=null;historyStack=[];view='dashboard';progress.hidden=true;const saved=localStorage.getItem('wb_current');",
    "function dashboard(){current=null;historyStack=[];view='dashboard';progress.hidden=true;let saved='';try{saved=localStorage.getItem('wb_current')||''}catch(e){}"
  );
  html = html.replace(
    "};return icons[kind]||icons.docs}",
    "};return (icons[kind]||icons.docs).replace('<svg ','<svg aria-hidden=\"true\" focusable=\"false\" ')}"
  );
  if (!html.includes('function safeUrl(v)')) {
    html = html.replace(
      "function displayValue(v){if(v==null||v==='')return '';",
      "function safeUrl(v){try{const u=new URL(String(v||''));return u.protocol==='https:'?u.href:''}catch(e){return ''}}\nfunction displayValue(v){if(v==null||v==='')return '';"
    );
  }
  html = html.replace(
    "const official=(source&&source.url)?'<div class=\"section official\"><b>المصدر الرسمي</b><p>'+esc(r.ui_official_source||[source.authority,source.title].filter(Boolean).join(' — '))+'</p></div><a class=\"source\" href=\"'+esc(source.url)+'\" target=\"_blank\" rel=\"noopener noreferrer\">فتح المصدر الرسمي</a>':'';",
    "const officialUrl=source?safeUrl(source.url):'';const official=officialUrl?'<div class=\"section official\"><b>المصدر الرسمي</b><p>'+esc(r.ui_official_source||[source.authority,source.title].filter(Boolean).join(' — '))+'</p></div><a class=\"source\" href=\"'+esc(officialUrl)+'\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"فتح المصدر الرسمي في نافذة جديدة\">فتح المصدر الرسمي</a>':'';"
  );

  fs.writeFileSync(file, html);
}

if (fs.readFileSync(files[0], 'utf8') !== fs.readFileSync(files[1], 'utf8')) {
  throw new Error('candidate drift after safe fixes');
}

console.log('Applied safe pre-launch fixes to canonical files.');
