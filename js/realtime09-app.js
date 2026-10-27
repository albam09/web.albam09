(()=>{
'use strict';
const S=window.ALBAM09_REALTIME||{};
let sb=null,session=null,profile=null,staff=null,presenceChannel=null,presenceRows=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v?new Date(v).toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
function toast(msg){const d=document.createElement('div');d.className='ab09-toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2800)}
function currentReturn(){return location.pathname+location.search+location.hash}
function goLogin(returnTo=currentReturn()){
  try{localStorage.setItem('ab09_return',returnTo)}catch(_e){}
  const p=S.loginPath||'/login/';location.href=p+'?return='+encodeURIComponent(returnTo);
}
async function googleLogin(){
  if(!sb){toast('회원 기능 설정이 아직 완료되지 않았습니다.');return}
  try{localStorage.setItem('ab09_return',new URLSearchParams(location.search).get('return')||currentReturn())}catch(_e){}
  const redirect=S.oauthRedirect||'https://albam09.com/auth/callback/';
  const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect}});
  if(error)toast('Google 로그인 시작 실패: '+error.message);
}
async function logout(){if(sb){await sb.auth.signOut();location.href='/'}}
function requireAuth(){if(session)return true;toast('회원가입 또는 로그인이 필요합니다.');goLogin();return false}
async function ensureProfile(){
  if(!session)return null;
  let q=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
  if(!q.data){
    const nick=session.user.user_metadata?.nickname||session.user.user_metadata?.full_name||session.user.user_metadata?.name||('회원'+session.user.id.slice(0,6));
    await sb.from('profiles').upsert({id:session.user.id,nickname:nick,avatar_url:session.user.user_metadata?.avatar_url||null});
    q=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
  }
  profile=q.data||null;
  const phone=session.user.user_metadata?.phone;
  if(phone){try{await sb.from('albam09_member_private').upsert({user_id:session.user.id,phone},{onConflict:'user_id'})}catch(_e){}}
  return profile;
}
async function loadStaff(){staff=null;if(!session)return null;try{const q=await sb.from('albam09_staff').select('user_id,level').eq('user_id',session.user.id).maybeSingle();staff=q.data||null}catch(_e){}return staff}
async function unreadCount(){if(!session)return 0;try{const {count}=await sb.from('albam09_messages').select('id',{count:'exact',head:true}).eq('receiver_id',session.user.id).is('read_at',null);return count||0}catch(_e){return 0}}
function flattenPresence(state){const out=[];Object.entries(state||{}).forEach(([key,list])=>(list||[]).forEach(x=>out.push({...x,_key:key})));return out}
function presenceSummary(){const rows=presenceRows.slice();return {total:rows.length,members:rows.filter(x=>x.member).length,rows}}
function publishPresence(){window.dispatchEvent(new CustomEvent('ab09-presence',{detail:presenceSummary()}))}
async function setupPresence(){
  if(!sb||presenceChannel)return;
  let tab=sessionStorage.getItem('ab09_presence_tab');if(!tab){tab=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('ab09_presence_tab',tab)}
  const key=(session?'m:'+session.user.id:'g')+':'+tab;
  presenceChannel=sb.channel('albam09-online',{config:{presence:{key}}});
  presenceChannel.on('presence',{event:'sync'},()=>{presenceRows=flattenPresence(presenceChannel.presenceState());publishPresence()});
  await presenceChannel.subscribe(async status=>{if(status==='SUBSCRIBED'){await presenceChannel.track({member:!!session,user_id:session?.user?.id||null,nickname:profile?.nickname||'손님',path:location.pathname,at:new Date().toISOString()})}});
}
async function refreshPresenceIdentity(){if(presenceChannel){try{await presenceChannel.untrack()}catch(_e){}try{await sb.removeChannel(presenceChannel)}catch(_e){}presenceChannel=null;presenceRows=[]}setupPresence()}
async function renderBar(configured=true){
  let bar=document.getElementById('ab09-memberbar');
  const customHost=document.querySelector('[data-ab09-account-host]');
  const header=document.querySelector('header.site-menu-host');
  const host=customHost||header;
  if(!host){if(bar)bar.remove();return}
  if(!bar){
    bar=document.createElement('div');
    bar.id='ab09-memberbar';
    bar.className='ab09-memberbar site-member-tools';
  }
  if(bar.parentElement!==host){
    if(header&&host===header){
      const trigger=header.querySelector('.site-menu-trigger');
      trigger?header.insertBefore(bar,trigger):header.appendChild(bar);
    }else host.appendChild(bar);
  }
  if(!configured){bar.innerHTML='<a href="/login/" class="site-member-login">로그인</a>';return}
  if(!session){bar.innerHTML='<a href="/login/" class="site-member-login">로그인</a>';return}
  const n=profile?.nickname||session.user.email?.split('@')[0]||'회원';
  const uc=await unreadCount();
  const admin=staff?`<a class="site-member-admin" href="${S.adminPath||'/admin/'}">${staff.level==='super_admin'?'최고관리자':'관리자'}</a>`:'';
  bar.innerHTML=`<a class="ab09-member-name" href="${S.memberPath||'/member/'}">${esc(n)}</a><a href="${S.messagesPath||'/messages/'}" aria-label="쪽지함">쪽지${uc?`<b class="ab09-badge">${uc}</b>`:''}</a>${admin}<button type="button" data-ab09-logout>로그아웃</button>`;
  bar.querySelector('[data-ab09-logout]').onclick=logout;
}
function subscribeUnread(){if(!sb||!session)return;sb.channel('albam09-message-badge-'+session.user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'albam09_messages',filter:`receiver_id=eq.${session.user.id}`},()=>{renderBar();toast('새 쪽지가 도착했습니다.')}).subscribe()}
async function init(){
  try{
    if(window.ALBAM09_SUPABASE_READY){
      const sdkReady=await window.ALBAM09_SUPABASE_READY;
      if(!sdkReady)throw new Error('supabase_sdk_load_failed');
    }
    if(!S.supabaseUrl||!S.supabaseAnonKey||!window.supabase?.createClient)throw new Error('missing_config');
    sb=window.supabase.createClient(S.supabaseUrl,S.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const x=await sb.auth.getSession();session=x.data.session||null;if(session){await ensureProfile();await loadStaff()}
    await renderBar(true);
    if(session){
      subscribeUnread();
      await setupPresence();
    } else {
      // Presence is optional for anonymous visitors. Wait for a genuine interaction
      // rather than making a WebSocket attempt during passive page/audit loading.
      // This does not delay authentication, posts, or member message subscriptions.
      let started=false;
      const activatePresence=()=>{
        if(started)return;
        started=true;
        window.removeEventListener('pointerdown',activatePresence);
        window.removeEventListener('keydown',activatePresence);
        window.removeEventListener('touchstart',activatePresence);
        setupPresence().catch(e=>console.warn('[presence activation]',e));
      };
      window.addEventListener('pointerdown',activatePresence,{passive:true});
      window.addEventListener('keydown',activatePresence);
      window.addEventListener('touchstart',activatePresence,{passive:true});
    }
    window.ALBAM09={sb,get session(){return session},get profile(){return profile},get staff(){return staff},get isAdmin(){return !!staff},get isSuper(){return staff?.level==='super_admin'},requireAuth,goLogin,login:goLogin,googleLogin,logout,toast,esc,fmt,presenceSummary,refreshProfile:ensureProfile,refreshStaff:loadStaff,renderBar,config:S};
    window.ALBAM09_READY=true;
    window.dispatchEvent(new CustomEvent('ab09-ready',{detail:{session,profile,staff}}));publishPresence();
    sb.auth.onAuthStateChange(async(_e,sess)=>{const changed=(session?.user?.id||null)!==(sess?.user?.id||null);session=sess||null;profile=null;staff=null;if(session){await ensureProfile();await loadStaff()}await renderBar(true);if(changed)refreshPresenceIdentity();window.dispatchEvent(new CustomEvent('ab09-auth',{detail:{session,profile,staff}}))});
  }catch(e){
    console.warn('[albam09 realtime]',e);
    window.ALBAM09={
      sb:null,
      get session(){return null},
      get profile(){return null},
      get staff(){return null},
      get isAdmin(){return false},
      get isSuper(){return false},
      requireAuth(){goLogin();return false},
      goLogin,login:goLogin,
      googleLogin(){toast('회원 기능 연결에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.')},
      logout,toast,esc,fmt,
      presenceSummary(){return {total:0,members:0,rows:[]}},
      config:S,
      initError:e
    };
    window.ALBAM09_READY=true;
    renderBar(false);
    window.dispatchEvent(new CustomEvent('ab09-ready',{detail:{session:null,profile:null,staff:null,error:true}}));
  }
}
const immediate=/^\/(?:auth|login|member|messages|admin|explore)(?:\/|$)/.test(location.pathname);if(immediate){init()}else if('requestIdleCallback' in window){requestIdleCallback(()=>init(),{timeout:1200})}else{setTimeout(()=>init(),350)}
})();
