(()=>{
'use strict';
let loaded=false;
function load(){
  if(loaded)return;loaded=true;
  const s=document.createElement('script');
  s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-KG9Z9ZBBGD';
  try{s.fetchPriority='low'}catch(_e){}
  s.dataset.ab09Ga='1';document.head.appendChild(s);
}
function later(){setTimeout(load,700)}
if(document.readyState==='complete')later();
else window.addEventListener('load',later,{once:true});
})();
