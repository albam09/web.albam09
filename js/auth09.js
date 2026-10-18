(()=>{
'use strict';

function val(id){return (document.getElementById(id)?.value||'').trim()}
function returnTarget(){
  const q=new URLSearchParams(location.search).get('return');
  if(q&&q.startsWith('/')&&!q.startsWith('//'))return q;
  try{
    const r=localStorage.getItem('ab09_return');
    if(r&&r.startsWith('/')&&!r.startsWith('//'))return r;
  }catch(_e){}
  return '/explore/';
}
function status(msg,kind=''){
  const el=document.getElementById('authMessage');
  if(!el)return;
  el.textContent=msg;
  el.dataset.kind=kind;
}
function setBusy(button,busy){
  if(!button)return;
  button.disabled=!!busy;
  button.setAttribute('aria-busy',busy?'true':'false');
}

function setupTabs(){
  const tabs=[...document.querySelectorAll('[data-auth-tab]')];
  const loginPane=document.getElementById('loginPane');
  const signupPane=document.getElementById('signupPane');
  if(!tabs.length||!loginPane||!signupPane)return;

  tabs.forEach(btn=>{
    btn.addEventListener('click',()=>{
      tabs.forEach(x=>x.classList.toggle('is-active',x===btn));
      loginPane.hidden=btn.dataset.authTab!=='login';
      signupPane.hidden=btn.dataset.authTab!=='signup';
      status('');
    });
  });
}

async function getApp(timeout=8000){
  if(window.ALBAM09?.sb)return window.ALBAM09;

  return await new Promise(resolve=>{
    let done=false;
    const finish=()=>{
      if(done)return;
      if(window.ALBAM09?.sb){
        done=true;
        resolve(window.ALBAM09);
      }
    };

    finish();
    if(done)return;

    const onReady=()=>finish();
    window.addEventListener('ab09-ready',onReady);

    const started=Date.now();
    const timer=setInterval(()=>{
      finish();
      if(done){
        clearInterval(timer);
        window.removeEventListener('ab09-ready',onReady);
        return;
      }
      if(Date.now()-started>=timeout){
        done=true;
        clearInterval(timer);
        window.removeEventListener('ab09-ready',onReady);
        resolve(null);
      }
    },120);
  });
}

async function setupAuth(){
  setupTabs();

  const loginForm=document.getElementById('loginForm');
  const signupForm=document.getElementById('signupForm');
  const googleButton=document.getElementById('googleLogin');

  if(loginForm){
    loginForm.addEventListener('submit',async e=>{
      e.preventDefault();
      const submit=loginForm.querySelector('button[type="submit"]');
      setBusy(submit,true);

      const A=await getApp();
      if(!A){
        setBusy(submit,false);
        return status('회원 기능 연결에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.','error');
      }

      const email=val('loginEmail'),password=val('loginPassword');
      if(!email||!password){
        setBusy(submit,false);
        return status('이메일과 비밀번호를 입력하세요.','error');
      }

      status('로그인 중...');
      const {error}=await A.sb.auth.signInWithPassword({email,password});
      setBusy(submit,false);
      if(error)return status('로그인 실패: '+error.message,'error');
      location.replace(returnTarget());
    });
  }

  if(signupForm){
    signupForm.addEventListener('submit',async e=>{
      e.preventDefault();
      const submit=signupForm.querySelector('button[type="submit"]');
      setBusy(submit,true);

      const A=await getApp();
      if(!A){
        setBusy(submit,false);
        return status('회원 기능 연결에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.','error');
      }

      const nickname=val('signupNickname'),phone=val('signupPhone'),email=val('signupEmail'),password=val('signupPassword');
      if(nickname.length<1){setBusy(submit,false);return status('닉네임을 입력하세요.','error')}
      const phoneDigits=phone.replace(/\D/g,'');
      if(phoneDigits.length<9||phoneDigits.length>15){setBusy(submit,false);return status('휴대폰번호를 정확히 입력하세요.','error')}
      if(password.length<6){setBusy(submit,false);return status('비밀번호는 6자 이상 입력하세요.','error')}

      status('회원가입 처리 중...');
      const {data,error}=await A.sb.auth.signUp({email,password,options:{data:{nickname,phone}}});
      setBusy(submit,false);
      if(error)return status('회원가입 실패: '+error.message,'error');

      if(data.session){
        try{
          await A.sb.from('albam09_member_private').upsert({user_id:data.session.user.id,phone},{onConflict:'user_id'});
        }catch(_e){}
        status('회원가입이 완료되었습니다. 이동합니다.','ok');
        setTimeout(()=>location.replace(returnTarget()),500);
      }else{
        status('회원가입이 접수되었습니다. 이메일 인증이 설정된 경우 메일에서 인증 후 로그인하세요.','ok');
      }
    });
  }

  if(googleButton){
    googleButton.addEventListener('click',async()=>{
      setBusy(googleButton,true);
      status('Google 로그인을 준비하고 있습니다...');
      const A=await getApp();
      if(!A){
        setBusy(googleButton,false);
        return status('회원 기능 연결에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.','error');
      }
      try{
        await A.googleLogin();
      }finally{
        setTimeout(()=>setBusy(googleButton,false),1500);
      }
    });
  }

  // If realtime initialization already completed before auth09 executed.
  if(window.ALBAM09?.session){
    location.replace(returnTarget());
    return;
  }

  window.addEventListener('ab09-ready',()=>{
    if(window.ALBAM09?.session)location.replace(returnTarget());
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',setupAuth,{once:true});
}else{
  setupAuth();
}
})();