const fs=require('fs');
const marker='<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';
const security=marker+'<meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\'; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'; manifest-src \'self\'; worker-src \'self\'; upgrade-insecure-requests">';
for(const file of ['index.html','wesh_baed_sale_final_candidate.html']){
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('Content-Security-Policy'))html=html.replace(marker,security);
  fs.writeFileSync(file,html);
}
if(fs.readFileSync('index.html','utf8')!==fs.readFileSync('wesh_baed_sale_final_candidate.html','utf8'))throw Error('candidate drift');
console.log('CSP and referrer policy added.');
