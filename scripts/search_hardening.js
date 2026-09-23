const fs=require('fs');
for(const file of ['index.html','wesh_baed_sale_final_candidate.html']){
  let html=fs.readFileSync(file,'utf8');
  const marker='QUICK_EXACT.push(["Q040", ["صدر علي 46"';
  const addition='QUICK_EXACT.push(["Q080",["شركة نصبت علي","شركة احتالت علي","نصب شركة","احتيال شركة"]]);\n';
  if(!html.includes(addition)){
    const at=html.indexOf(marker);if(at<0)throw Error(`${file}: search marker missing`);
    html=html.slice(0,at)+addition+html.slice(at);
  }
  fs.writeFileSync(file,html);
}
if(fs.readFileSync('index.html','utf8')!==fs.readFileSync('wesh_baed_sale_final_candidate.html','utf8'))throw Error('candidate drift');
console.log('Search ambiguity hardening applied.');
