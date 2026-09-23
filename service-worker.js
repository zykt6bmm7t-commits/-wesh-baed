const CACHE_NAME='wesh-baed-v196-multidisciplinary';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));
  self.clients.claim();
});

function fixResultUI(html){
  const old="['وين تروح؟',s?(s.authority+(s.title?' — '+s.title:'')):(r.ui_official_source||'')],['وش تحتاج؟',r.ui_requirements||r.requirements],['وش يصير بعد كذا؟',r.ui_what_happens_next||r.what_happens_next],['انتبه',r.ui_caution||r.lawyer_boundary]";
  const neu="['الجهة المختصة',r.authority||''],['الخدمة أو الإجراء',r.service||r.procedure_type||''],['وش تحتاج؟',r.ui_requirements||r.requirements],['المستندات',r.documents||''],['المدة',r.deadline||''],['الرسوم والتكاليف',r.costs||''],['وش يصير بعد كذا؟',r.ui_what_happens_next||r.what_happens_next],['انتبه',r.ui_caution||r.lawyer_boundary]";
  html=html.replace(old,neu);
  html=html.replace(/PREMIUM · v186/g,'PREMIUM · v194');
  html=html.replace(/\['وضعك الآن',r\.ui_current_situation\|\|r\.current_situation\]/g,"['وضعك باختصار',r.ui_current_situation||r.current_situation]");
  html=html.replace(/فتح المصدر الرسمي — /g,'المصدر الرسمي — ');
  html=html.replace(/>وين تروح\؟</g,'>الجهة المختصة<');
  html=html.replace(/>وش تحتاج\؟</g,'>المطلوب منك<');
  html=html.replace(/>وش يصير بعد كذا\؟</g,'>وش يصير بعد ذلك؟<');
  html=html.replace(/>انتبه</g,'>تنبيه مهم<');
  html=html.replace("['الجهة المختصة',r.authority||'']","['الجهة المختصة',r.authority||r.court||r.competent_authority||({'SRC-SAMA-COMPLAINT':'البنك المركزي السعودي','SRC-SAMA-CONSUMER-PROTECTION':'البنك المركزي السعودي','SRC-IA-COMPLAINT':'هيئة التأمين','SRC-CST-ESCALATE':'هيئة الاتصالات والفضاء والتقنية','SRC-ABSHER-VISAS':'المديرية العامة للجوازات — عبر منصة أبشر','SRC-ABSHER-PASSPORT-SERVICES':'المديرية العامة للجوازات — عبر منصة أبشر','SRC-ZATCA-VAT':'هيئة الزكاة والضريبة والجمارك','SRC-SDAIA-PDPL-COMPLAINT':'الهيئة السعودية للبيانات والذكاء الاصطناعي — منصة حوكمة البيانات الوطنية'}[r.source_id]||'')]");
  html=html.replace("['الخدمة أو الإجراء',r.service||r.procedure_type||'']","['الخدمة أو الإجراء',r.service||r.najiz_service||r.procedure_type||'']");
  html=html.replace("['المستندات',r.documents||'']","['المستندات',r.documents||r.required_documents||'']");
  html=html.replace("['المدة',r.deadline||'']","['المدة',r.deadline||r.duration||r.time_limit||'']");
  html=html.replace("['الرسوم والتكاليف',r.costs||'']","['الرسوم والتكاليف',r.costs||r.fees||r.court_costs||'']");
  return html;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  if(url.pathname.startsWith('/api/')) return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        const type=response.headers.get('content-type')||'';
        if(!response.ok||!type.includes('text/html')) return response;
        const html=fixResultUI(await response.text());
        return new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
      }catch(e){
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});