const fs=require('fs');
const files=['index.html','wesh_baed_sale_final_candidate.html'];

for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  html=html.replace('--muted:#6e7d77;','--muted:#596963;').replace('--champagne:#b99758;','--champagne:#806126;');
  html=html.replace('aria-live="polite" aria-atomic="true"','aria-live="polite" aria-atomic="false"');
  html=html.replace(
    "let current=null,historyStack=[];\nconst esc=",
    "let current=null,historyStack=[],view='cover',restoringBrowserState=false;\nfunction syncBrowserState(mode='push'){if(restoringBrowserState)return;try{window.history[mode+'State']({wb:true,view,current,historyStack:[...historyStack]},'',window.location.href)}catch(e){}}\nconst esc="
  );
  html=html.replace(
    "function cover(){current=null;historyStack=[];progress.hidden=true;set(",
    "function cover(){current=null;historyStack=[];view='cover';progress.hidden=true;set("
  ).replace(
    "');document.getElementById('enter').onclick=dashboard}\nfunction sectorIcon",
    "');document.getElementById('enter').onclick=dashboard;syncBrowserState('replace')}\nfunction sectorIcon"
  );
  html=html.replace(
    "function dashboard(){current=null;historyStack=[];progress.hidden=true;",
    "function dashboard(){current=null;historyStack=[];view='dashboard';progress.hidden=true;"
  ).replace(
    "const rs=document.getElementById('resume');if(rs)rs.onclick=resume}\nfunction guideInfo",
    "const rs=document.getElementById('resume');if(rs)rs.onclick=resume;syncBrowserState()}\nfunction guideInfo"
  );
  html=html.replace(
    "current=b.dataset.sector;historyStack=[];saveState();render()",
    "current=b.dataset.sector;historyStack=[];view='route';saveState();syncBrowserState();render()"
  ).replace(
    "current=b.dataset.searchNext;historyStack=[DB.start];saveState();render()",
    "current=b.dataset.searchNext;historyStack=[DB.start];view='route';saveState();syncBrowserState();render()"
  );
  html=html.replace(
    "function start(){current=DB.start;historyStack=[];saveState();render()}",
    "function start(){current=DB.start;historyStack=[];view='route';saveState();syncBrowserState();render()}"
  ).replace(
    "current=s;historyStack=Array.isArray(h)?h:[];render()",
    "current=s;historyStack=Array.isArray(h)?h:[];view='route';syncBrowserState();render()"
  ).replace(
    "function go(id){if(current)historyStack.push(current);current=id;saveState();render()}",
    "function go(id){if(current)historyStack.push(current);current=id;view='route';saveState();syncBrowserState();render()}"
  ).replace(
    "function back(){if(historyStack.length){current=historyStack.pop();saveState();render()}else dashboard()}",
    "function back(){if(window.history.state&&window.history.state.wb){window.history.back();return}if(historyStack.length){current=historyStack.pop();saveState();render()}else dashboard()}"
  );
  html=html.replace(
    "cover();\n</script>",
    "window.addEventListener('popstate',event=>{const state=event.state;if(!state||!state.wb)return;restoringBrowserState=true;try{view=state.view||'cover';current=state.current||null;historyStack=Array.isArray(state.historyStack)?state.historyStack:[];if(view==='route'&&current&&(DB.nodes[current]||DB.results[current])){saveState();render()}else if(view==='dashboard')dashboard();else cover()}finally{restoringBrowserState=false}});\ncover();\n</script>"
  );
  fs.writeFileSync(file,html);
}

if(fs.readFileSync(files[0],'utf8')!==fs.readFileSync(files[1],'utf8'))throw Error('candidate drift');
console.log('UI hardening applied to both release HTML files.');
