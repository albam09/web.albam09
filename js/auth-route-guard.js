(()=>{
'use strict';

const body=document.body;
if(!body || body.dataset.authRequired!=='true') return;

const returnTo=location.pathname+location.search+location.hash;
let settled=false;

function redirectLogin(){
  if(settled) return;
  settled=true;
  try{ localStorage.setItem('ab09_return', returnTo); }catch(_e){}
  location.replace('/login/?return='+encodeURIComponent(returnTo));
}

function allow(){
  if(settled) return;
  settled=true;
  body.classList.add('auth-ready');
}

function resolveFromApp(){
  const A=window.ALBAM09;
  if(!A) return false;
  if(A.session) allow();
  else redirectLogin();
  return true;
}

// If realtime app finished before this guard ran, handle immediately.
if(resolveFromApp()) return;

// Otherwise wait for realtime initialization.
window.addEventListener('ab09-ready', function(){
  resolveFromApp();
}, {once:true});

// Also react to later auth state changes if needed.
window.addEventListener('ab09-auth', function(){
  resolveFromApp();
});

// Fallback: if initialization is delayed or broken, never leave a blank protected page.
setTimeout(function(){
  if(settled) return;
  if(!resolveFromApp()) redirectLogin();
}, 2500);
})();