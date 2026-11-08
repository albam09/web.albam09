/* V9: slides to the left with a visible next venue, pauses on hover/touch and keyboard focus.
   Only two preview links per region: full venue lists stay on their own pages. */
(function(){
 'use strict';
 const DELAY_MS=4200;
 const SWIPE_MS=660;
 function start(){
  const all=Array.isArray(window.PUBLIC_VENUES)?window.PUBLIC_VENUES:[];
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.querySelectorAll('[data-region-preview]').forEach(function(card,regionIndex){
    const board=card.getAttribute('data-region-preview');
    const items=all.filter(v=>v.board===board&&v.slug&&v.name);
    const holder=card.querySelector('[data-preview-item]');
    if(!holder||!items.length)return;
    let current=Math.floor(Math.random()*items.length),next=(current+1)%items.length;
    let busy=false,paused=false,timeout=null,finishTimer=null;
    const href=v=>'/map/'+encodeURIComponent(v.board)+'/?venue='+encodeURIComponent(v.slug);
    const label=v=>'<a href="'+esc(href(v))+'" aria-label="'+esc(v.name)+' 지도에서 위치 보기" title="'+esc(v.name)+' 지도 열기"><span>'+esc(v.name)+'</span></a>';
    holder.innerHTML='<div class="ab09-venue-rail" role="group" aria-label="'+esc(board)+' 업소 미리보기"></div>';
    const rail=holder.firstElementChild;
    const draw=()=>{rail.innerHTML=label(items[current])+(items.length>1?label(items[next]):'');};
    draw();
    function stop(){if(timeout!==null){clearTimeout(timeout);timeout=null;}}
    function schedule(){stop();if(paused||reduce||items.length<2)return;timeout=setTimeout(step,DELAY_MS);}
    function step(){
      if(paused||busy||document.hidden||!holder.isConnected){schedule();return;}
      busy=true;
      rail.classList.add('is-sliding');
      finishTimer=setTimeout(function(){
        finishTimer=null;
        rail.classList.remove('is-sliding');
        rail.style.transition='none';
        current=next;next=(next+1)%items.length;
        draw();
        // Flush layout before re-enabling the next animation to avoid flicker.
        void rail.offsetWidth;
        rail.style.transition='';
        busy=false;schedule();
      },SWIPE_MS+30);
    }
    function pause(){paused=true;stop();}
    function resume(){paused=false;if(!busy)schedule();}
    card.addEventListener('mouseenter',pause);
    card.addEventListener('mouseleave',resume);
    card.addEventListener('focusin',pause);
    card.addEventListener('focusout',function(e){if(!card.contains(e.relatedTarget))resume();});
    card.addEventListener('touchstart',pause,{passive:true});
    card.addEventListener('touchend',function(){setTimeout(resume,1800);},{passive:true});
    window.addEventListener('pagehide',function(){stop();if(finishTimer!==null)clearTimeout(finishTimer);},{once:true});
    schedule();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
