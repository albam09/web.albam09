(()=>{
'use strict';

if(window.ALBAM09_SUPABASE_READY) return;

const sources=[
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/@supabase/supabase-js@2'
];

function available(){
  return !!(window.supabase && typeof window.supabase.createClient==='function');
}

window.ALBAM09_SUPABASE_READY=new Promise(resolve=>{
  if(available()){ resolve(true); return; }

  let i=0;
  const next=()=>{
    if(available()){ resolve(true); return; }
    if(i>=sources.length){ resolve(false); return; }

    const src=sources[i++];
    const script=document.createElement('script');
    script.src=src;
    script.async=true;
    script.crossOrigin='anonymous';
    script.onload=()=>available()?resolve(true):next();
    script.onerror=next;
    document.head.appendChild(script);
  };
  next();
});
})();