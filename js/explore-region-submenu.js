
(()=>{
  'use strict';
  const REGION_LINKS=[
    ['상무지구','/explore/karaoke1/'],
    ['상무 · 광천동','/explore/karaoke2/'],
    ['신안동','/explore/karaoke3/'],
    ['용봉동','/explore/karaoke4/'],
    ['첨단지구','/explore/karaoke5/'],
    ['목포','/explore/karaoke6/'],
    ['광주 동구','/explore/karaoke7/'],
    ['광주 남구','/explore/karaoke8/']
  ];
  let trigger=null,pop=null;
  function createPopover(){
    if(pop) return pop;
    pop=document.createElement('div');
    pop.className='explore-region-popover';
    pop.hidden=true;
    pop.setAttribute('role','menu');
    pop.setAttribute('aria-label','지역별 탐험기 메뉴');
    pop.innerHTML=`<div class="explore-region-popover__head"><strong>지역별 탐험기</strong><a href="/explore/">탐험기 메인 →</a></div><div class="explore-region-popover__grid">${REGION_LINKS.map(([name,url])=>`<a class="explore-region-popover__link" href="${url}"><span>${name}</span><span class="explore-region-popover__arrow">›</span></a>`).join('')}</div>`;
    document.body.appendChild(pop);
    return pop;
  }
  function position(){
    if(!trigger||!pop||pop.hidden) return;
    const r=trigger.getBoundingClientRect();
    const gap=8;
    const pw=Math.min(520,window.innerWidth-24);
    let left=r.right-pw;
    left=Math.max(12,Math.min(left,window.innerWidth-pw-12));
    let top=r.bottom+gap;
    const estH=pop.offsetHeight||240;
    if(top+estH>window.innerHeight-10 && r.top-estH-gap>10) top=r.top-estH-gap;
    pop.style.left=Math.round(left)+'px';
    pop.style.top=Math.round(top)+'px';
  }
  function close(){
    if(pop) pop.hidden=true;
    if(trigger) trigger.setAttribute('aria-expanded','false');
  }
  function open(btn){
    trigger=btn;
    createPopover();
    pop.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    requestAnimationFrame(position);
  }
  function init(){
    const buttons=[...document.querySelectorAll('.area-list [data-page="explore"] > a[href="/explore/"]')];
    if(!buttons.length) return;
    buttons.forEach(btn=>{
      btn.setAttribute('aria-haspopup','menu');
      btn.setAttribute('aria-expanded','false');
      btn.addEventListener('click',e=>{
        if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey) return;
        e.preventDefault();
        const same=trigger===btn && pop && !pop.hidden;
        same?close():open(btn);
      });
    });
    document.addEventListener('click',e=>{
      if(!pop||pop.hidden) return;
      if(pop.contains(e.target) || buttons.some(b=>b.contains(e.target))) return;
      close();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape') close();});
    window.addEventListener('resize',position,{passive:true});
    window.addEventListener('scroll',position,{passive:true,capture:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
