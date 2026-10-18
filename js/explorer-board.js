(()=>{
'use strict';
const host=document.querySelector('[data-explorer-board]');if(!host)return;
const board=host.dataset.explorerBoard;
const label=host.dataset.explorerLabel||board;
function date(v){try{return new Date(v).toLocaleDateString('ko-KR')}catch{return ''}}
function card(x,A){
  const first=Array.isArray(x.images)&&x.images[0]?.url?x.images[0]:null;
  const media=first?`<div class="explorer-card-media"><img src="${A.esc(first.url)}" alt="${A.esc(first.alt||x.title+' 탐험기 사진')}" loading="lazy" decoding="async"></div>`:'<div class="explorer-card-media is-empty"><span><svg aria-hidden="true" class="ab09-official-map-icon" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M560.02 32c-1.96 0-3.98.37-5.96 1.16L384.01 96H384L212 35.28A64.252 64.252 0 0 0 191.76 32c-6.69 0-13.37 1.05-19.81 3.14L20.12 87.95A32.006 32.006 0 0 0 0 117.66v346.32C0 473.17 7.53 480 15.99 480c1.96 0 3.97-.37 5.96-1.16L192 416l172 60.71a63.98 63.98 0 0 0 40.05.15l151.83-52.81A31.996 31.996 0 0 0 576 394.34V48.02c0-9.19-7.53-16.02-15.98-16.02zM224 90.42l128 45.19v285.97l-128-45.19V90.42zM48 418.05V129.07l128-44.53v286.2l-.64.23L48 418.05zm480-35.13l-128 44.53V141.26l.64-.24L528 93.95v288.97z" fill="currentColor"/></svg></span></div>';
  return `<a class="explorer-card" href="/explore/post/${encodeURIComponent(x.slug)}/">${media}<div class="explorer-card-body"><span class="tag explorer-venue-badge">${A.esc(x.venue_name||label+' 탐험기')}</span><h2>${A.esc(x.title)}</h2><p>${A.esc(x.summary||x.content?.slice(0,140)||'')}</p><div class="explorer-meta">${date(x.published_at||x.created_at)}</div></div></a>`;
}
function state(type,title,sub){
  return `<div class="explorer-board-state ${type||''}"><span class="explorer-board-state__icon" aria-hidden="true"><svg aria-hidden="true" class="ab09-official-map-icon" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M560.02 32c-1.96 0-3.98.37-5.96 1.16L384.01 96H384L212 35.28A64.252 64.252 0 0 0 191.76 32c-6.69 0-13.37 1.05-19.81 3.14L20.12 87.95A32.006 32.006 0 0 0 0 117.66v346.32C0 473.17 7.53 480 15.99 480c1.96 0 3.97-.37 5.96-1.16L192 416l172 60.71a63.98 63.98 0 0 0 40.05.15l151.83-52.81A31.996 31.996 0 0 0 576 394.34V48.02c0-9.19-7.53-16.02-15.98-16.02zM224 90.42l128 45.19v285.97l-128-45.19V90.42zM48 418.05V129.07l128-44.53v286.2l-.64.23L48 418.05zm480-35.13l-128 44.53V141.26l.64-.24L528 93.95v288.97z" fill="currentColor"/></svg></span><strong>${title}</strong><small>${sub||''}</small></div>`;
}
function schema(rows){
  let old=document.getElementById('explorer-board-ld');if(old)old.remove();
  const s=document.createElement('script');s.type='application/ld+json';s.id='explorer-board-ld';
  s.textContent=JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:`${label} 탐험기게시판`,url:location.origin+location.pathname,mainEntity:{'@type':'ItemList',itemListElement:rows.map((x,i)=>({'@type':'ListItem',position:i+1,url:`${location.origin}/explore/post/${x.slug}/`,name:x.title}))}});
  document.head.appendChild(s);
}
async function load(){
 const A=window.ALBAM09;
 host.innerHTML=state('is-loading','탐험기를 불러오고 있습니다','잠시만 기다려 주세요.');
 if(!A?.sb)return;
 const {data,error}=await A.sb.from('albam09_explorer_posts').select('slug,title,summary,content,venue_name,images,published_at,created_at').eq('board',board).eq('status','published').eq('is_deleted',false).order('published_at',{ascending:false}).limit(60);
 if(error){host.innerHTML=state('is-error','탐험기 목록을 불러오지 못했습니다','잠시 후 다시 확인해 주세요.');return}
 const rows=data||[];
 host.innerHTML=rows.length?rows.map(x=>card(x,A)).join(''):state('is-empty','아직 공개된 탐험기가 없습니다','첫 글을 작성해 주세요.');
 schema(rows);
}
if(window.ALBAM09_READY||window.ALBAM09)load();else window.addEventListener('ab09-ready',load,{once:true});
})();
