(()=>{
'use strict';

const protectedPaths=['/messages/','/explore/write/','/member/','/admin/'];

function normalize(href){
  try{
    const u=new URL(href,location.origin);
    return {url:u,path:u.pathname,returnTo:u.pathname+u.search+u.hash};
  }catch(_e){ return null; }
}

function needsAuth(path){
  return protectedPaths.some(p=>path===p || path.startsWith(p));
}

async function hasSession(){
  const A=window.ALBAM09;
  if(A) return !!A.session;

  const S=window.ALBAM09_REALTIME||{};
  if(!S.supabaseUrl || !S.supabaseAnonKey || !window.supabase?.createClient) return false;

  try{
    const sb=window.supabase.createClient(S.supabaseUrl,S.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data}=await sb.auth.getSession();
    return !!data?.session;
  }catch(_e){
    return false;
  }
}

document.addEventListener('click',async function(e){
  const a=e.target.closest('a[href]');
  if(!a) return;
  const info=normalize(a.getAttribute('href'));
  if(!info || info.url.origin!==location.origin || !needsAuth(info.path)) return;

  e.preventDefault();
  e.stopPropagation();

  if(await hasSession()){
    location.href=info.url.href;
    return;
  }

  try{ localStorage.setItem('ab09_return',info.returnTo); }catch(_e){}
  location.href='/login/?return='+encodeURIComponent(info.returnTo);
},true);
})();