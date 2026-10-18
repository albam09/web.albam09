(()=>{
'use strict';
const SELECTOR='[data-explorer-preview]';
const escapeFallback=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showState(host,msg,description=''){
 host.innerHTML=`<div class="explorer-board-state"><strong>${escapeFallback(msg)}</strong><small>${escapeFallback(description)}</small></div>`;
}
function makeCard(x,A,board){
 const esc=A?.esc||escapeFallback;
 const slug=String(x.slug||'');
 if(!/^[a-z0-9._-]+$/i.test(slug))return '';
 const href=`/explore/post/${encodeURIComponent(slug)}/`;
 const img=Array.isArray(x.images)&&x.images[0]?.url?x.images[0]:null;
 const media=img?`<div class="explorer-card-media"><img src="${esc(img.url)}" alt="${esc(img.alt||x.title+' 탐험기 사진')}" loading="lazy" decoding="async"></div>`:'<div class="explorer-card-media is-empty"><span aria-hidden="true">✦</span></div>';
 const venue=String(x.venue_name||'').trim()||'지역 탐험기';
 let date='';try{date=new Date(x.published_at||x.created_at).toLocaleDateString('ko-KR')}catch(_){}
 return `<a class="explorer-card explorer-preview-card" href="${href}" aria-label="${esc(venue)} - ${esc(x.title)} 탐험기 상세보기">${media}<div class="explorer-card-body"><span class="tag explorer-venue-badge">${esc(venue)}</span><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p><span class="explorer-meta">${date} · 상세보기 →</span></div></a>`;
}
async function load(box){
 const A=window.ALBAM09,board=box.dataset.explorerPreview;
 if(!A?.sb||!board){showState(box,'탐험기 연결을 확인해 주세요.');return}
 try{
  const {data,error}=await A.sb.from('albam09_explorer_posts')
    .select('slug,title,summary,venue_name,images,published_at,created_at')
    .eq('board',board).eq('status','published').eq('is_deleted',false)
    .order('published_at',{ascending:false}).limit(5);
  if(error)throw error;
  const html=(data||[]).map(x=>makeCard(x,A,board)).filter(Boolean).join('');
  if(!html){showState(box,'아직 공개된 탐험기가 없습니다.','첫 탐험기를 기다리고 있습니다.');return}
  box.innerHTML=html;
 }catch(e){showState(box,'탐험기를 불러오지 못했습니다.','잠시 후 다시 확인해 주세요.');console.warn('[explorer preview]',e)}
}
function start(){
 const boxes=[...document.querySelectorAll(SELECTOR)];
 if(!('IntersectionObserver' in window)){boxes.forEach(load);return}
 const io=new IntersectionObserver(events=>{events.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);load(e.target)}})},{rootMargin:'600px 0px'});
 boxes.forEach(box=>io.observe(box));
}
function boot(){
 if(window.ALBAM09?.sb){start();return}
 // Supabase initializes asynchronously; do not show a false empty/error state first.
 window.addEventListener('ab09-ready',start,{once:true});
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot,{once:true})}else{boot()}
})();
