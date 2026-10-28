/* Homepage-only explorer coupon promotion.
 * '닫기' — this page view only.
 * '오늘 그만보기' — persist through local midnight across pages/tabs/reloads.
 * Leave Google-indexable page text/metadata unchanged.
 */
(()=>{
  'use strict';
  // Included only by the homepage; pathname may be a Windows file:// path.

  const key='albam09.explorerCoupon.hideDate.v1';
  const cookieKey='albam09_explorer_coupon_hide_date';
  const overlay=document.getElementById('ab09-coupon-popup');
  if(!overlay)return;
  const dialog=overlay.querySelector('.ab09-coupon-dialog');
  const focusable='a[href],button:not([disabled])';
  let lastFocused=null;
  const forcePreview = new URLSearchParams(window.location.search).get('showCoupon')==='1';
  let resizeObserver=null;

  function localDay(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function cookieDay(){
    // Browsers may reject cookie reads (privacy settings, sandboxed previews, file://).
    // A storage error must never prevent opening the popup.
    try {
      const v=document.cookie.split('; ').find(s=>s.startsWith(cookieKey+'='));
      return v?decodeURIComponent(v.slice(cookieKey.length+1)):null;
    } catch(_){ return null; }
  }
  function shouldHide(){
    if(forcePreview)return false;
    const today=localDay();
    try{if(window.localStorage.getItem(key)===today)return true;}catch(_){/* cookie fallback */}
    return cookieDay()===today;
  }
  function rememberToday(){
    const today=localDay();
    try{window.localStorage.setItem(key,today);}catch(_){/* cookie fallback */}
    const now=new Date();
    const midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
    try {
      document.cookie=`${cookieKey}=${encodeURIComponent(today)}; expires=${midnight.toUTCString()}; path=/; SameSite=Lax`;
    } catch(_){ /* Cookie access can be disabled; localStorage remains primary. */ }
  }
  function close(){
    if(overlay.hidden)return;
    overlay.hidden=true;
    document.body.classList.remove('ab09-coupon-is-open');
    document.removeEventListener('keydown',onKeydown);
    if(resizeObserver){resizeObserver.disconnect();resizeObserver=null;}
    if(scheduledFit){window.cancelAnimationFrame(scheduledFit);scheduledFit=0;}
    if(lastFocused?.isConnected)lastFocused.focus({preventScroll:true});
  }
  function onKeydown(e){
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key!=='Tab')return;
    const els=[...dialog.querySelectorAll(focusable)].filter(el=>el.getClientRects().length);
    if(!els.length)return;
    if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1].focus();}
    else if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0].focus();}
  }
  let scheduledFit=0;
  function fitMobile(){
    if(scheduledFit){window.cancelAnimationFrame(scheduledFit);scheduledFit=0;}
    dialog.style.removeProperty('zoom');
    if(!window.matchMedia('(max-width:600px)').matches)return;
    // Do not read scrollHeight synchronously after a style mutation. That was the
    // exact forced reflow reported by Lighthouse for this popup.
    scheduledFit=window.requestAnimationFrame(()=>{
      scheduledFit=window.requestAnimationFrame(()=>{
        scheduledFit=0;
        if(overlay.hidden)return;
        const available=Math.max(250,window.innerHeight-16);
        const actual=dialog.scrollHeight;
        if(actual>available){
          const factor=Math.max(.58,Math.min(1,available/actual));
          window.requestAnimationFrame(()=>{
            if(!overlay.hidden)dialog.style.zoom=String(factor);
          });
        }
      });
    });
  }
  function open(){
    if(shouldHide())return;
    lastFocused=document.activeElement;
    overlay.hidden=false;
    document.body.classList.add('ab09-coupon-is-open');
    document.addEventListener('keydown',onKeydown);
    fitMobile();
    // Height adaptation also runs on viewport resize; no observation loop needed.
    const closeButton=overlay.querySelector('[data-coupon-action="close"]');
    closeButton?.focus({preventScroll:true});
  }
  overlay.addEventListener('click',e=>{
    const action=e.target.closest('[data-coupon-action]')?.dataset.couponAction;
    if(!action)return;
    if(action==='today'){rememberToday();close();}
    if(action==='close')close();
  });
  window.addEventListener('resize',()=>{if(!overlay.hidden)fitMobile();},{passive:true});
  window.addEventListener('storage',e=>{
    if(e.key===key && shouldHide())close();
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',open,{once:true});
  else open();
})();
