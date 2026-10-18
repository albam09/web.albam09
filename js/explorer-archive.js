(()=>{
'use strict';
const host=document.getElementById('explorerArchiveList');
if(!host)return;
const labels={karaoke1:'상무지구',karaoke2:'상무·광천동',karaoke3:'신안동',karaoke4:'용봉동',karaoke5:'첨단지구',karaoke6:'목포',karaoke7:'광주 동구',karaoke8:'광주 남구'};
function fmt(v){try{return new Date(v).toLocaleDateString('ko-KR')}catch{return''}}
function render(rows,A){
  if(!rows.length){host.innerHTML='<div class="explorer-empty">아직 공개된 탐험기가 없습니다.</div>';return}
  host.innerHTML=rows.map(x=>{
    const area=labels[x.board]||'지역';
    const image=Array.isArray(x.images)&&x.images[0]?.url?`<div class="explorer-card-media"><img src="${A.esc(x.images[0].url)}" alt="${A.esc(x.images[0].alt||x.title+' 탐험기 사진')}" loading="lazy" decoding="async"></div>`:'<div class="explorer-card-media is-empty"><span><svg aria-hidden="true" class="ab09-official-map-icon" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M560.02 32c-1.96 0-3.98.37-5.96 1.16L384.01 96H384L212 35.28A64.252 64.252 0 0 0 191.76 32c-6.69 0-13.37 1.05-19.81 3.14L20.12 87.95A32.006 32.006 0 0 0 0 117.66v346.32C0 473.17 7.53 480 15.99 480c1.96 0 3.97-.37 5.96-1.16L192 416l172 60.71a63.98 63.98 0 0 0 40.05.15l151.83-52.81A31.996 31.996 0 0 0 576 394.34V48.02c0-9.19-7.53-16.02-15.98-16.02zM224 90.42l128 45.19v285.97l-128-45.19V90.42zM48 418.05V129.07l128-44.53v286.2l-.64.23L48 418.05zm480-35.13l-128 44.53V141.26l.64-.24L528 93.95v288.97z" fill="currentColor"/></svg></span></div>';
    return `<a class="explorer-card" href="/explore/post/${encodeURIComponent(x.slug)}/">${image}<div class="explorer-card-body"><span class="tag explorer-venue-badge">${A.esc(x.venue_name||area+' 탐험기')}</span><h2>${A.esc(x.title)}</h2><p>${A.esc(x.summary||x.content?.slice(0,150)||'')}</p><div class="explorer-meta">${A.esc(area)} · ${A.esc(fmt(x.published_at||x.created_at))}</div></div></a>`;
  }).join('');
  let old=document.getElementById('explorer-archive-ld');if(old)old.remove();
  const s=document.createElement('script');s.id='explorer-archive-ld';s.type='application/ld+json';s.textContent=JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:'전체 공개 탐험기',url:location.origin+location.pathname,mainEntity:{'@type':'ItemList',itemListElement:rows.map((x,i)=>({'@type':'ListItem',position:i+1,url:`${location.origin}/explore/post/${x.slug}/`,name:x.title}))}});document.head.appendChild(s);
}
async function load(){
  const A=window.ALBAM09;
  if(!A?.sb)return;
  const {data,error}=await A.sb.from('albam09_explorer_posts').select('slug,board,title,summary,content,venue_name,images,published_at,created_at').eq('status','published').eq('is_deleted',false).order('published_at',{ascending:false}).limit(1000);
  if(error){host.innerHTML='<div class="explorer-empty">탐험기 목록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';return}
  render(data||[],A);
}
if(window.ALBAM09_READY||window.ALBAM09)load();else window.addEventListener('ab09-ready',load,{once:true});
})();
