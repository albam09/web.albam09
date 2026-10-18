(()=>{
'use strict';

const host=document.getElementById('explorer-latest-index');
const list=document.getElementById('indexLatestExploreList');
if(!host||!list)return;

const LABELS={
  karaoke1:'상무지구',
  karaoke2:'상무·광천동',
  karaoke3:'신안동',
  karaoke4:'용봉동',
  karaoke5:'첨단지구',
  karaoke6:'목포',
  karaoke7:'광주 동구',
  karaoke8:'광주 남구'
};

const MAP_ICON=`<svg aria-hidden="true" class="home-latest-explore-map-icon" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M560.02 32c-1.96 0-3.98.37-5.96 1.16L384.01 96H384L212 35.28A64.252 64.252 0 0 0 191.76 32c-6.69 0-13.37 1.05-19.81 3.14L20.12 87.95A32.006 32.006 0 0 0 0 117.66v346.32C0 473.17 7.53 480 15.99 480c1.96 0 3.97-.37 5.96-1.16L192 416l172 60.71a63.98 63.98 0 0 0 40.05.15l151.83-52.81A31.996 31.996 0 0 0 576 394.34V48.02c0-9.19-7.53-16.02-15.98-16.02zM224 90.42l128 45.19v285.97l-128-45.19V90.42zM48 418.05V129.07l128-44.53v286.2l-.64.23L48 418.05zm480-35.13l-128 44.53V141.26l.64-.24L528 93.95v288.97z" fill="currentColor"/></svg>`;

function shortDate(v){
  try{
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return '';
    return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  }catch(_e){return ''}
}

function snippet(x){
  return (x.summary||x.venue_name||'최근 공개된 지역 탐험기입니다.').toString().trim().slice(0,92);
}

function render(rows,A){
  list.innerHTML=rows.map((x,i)=>{
    const area=LABELS[x.board]||'탐험기';
    const first=Array.isArray(x.images)&&x.images[0]?.url?x.images[0]:null;
    const media=first
      ? `<span class="home-latest-explore-card__media"><img src="${A.esc(first.url)}" alt="${A.esc(first.alt||x.title+' 탐험기 사진')}" loading="lazy" decoding="async" width="720" height="450"></span>`
      : `<span class="home-latest-explore-card__media is-empty">${MAP_ICON}</span>`;

    return `<a class="home-latest-explore-card" href="/explore/post/${encodeURIComponent(x.slug)}/">
      ${media}
      <span class="home-latest-explore-card__body">
        <span class="home-latest-explore-card__top">
          <span class="home-latest-explore-card__rank">${String(i+1).padStart(2,'0')}</span>
          <span class="home-latest-explore-card__area">${A.esc(area)}</span>
        </span>
        <strong>${A.esc(x.title)}</strong>
        <span class="home-latest-explore-card__summary">${A.esc(snippet(x))}</span>
        <span class="home-latest-explore-card__meta">
          <span>${A.esc(shortDate(x.published_at||x.created_at))}</span>
          <span aria-hidden="true" class="home-latest-explore-card__arrow">→</span>
        </span>
      </span>
    </a>`;
  }).join('');

}

async function load(){
  const A=window.ALBAM09;
  if(!A?.sb)return;

  try{
    const {data,error}=await A.sb
      .from('albam09_explorer_posts')
      .select('slug,title,summary,venue_name,board,images,published_at,created_at')
      .eq('status','published')
      .eq('is_deleted',false)
      .order('published_at',{ascending:false})
      .limit(1000);

    if(error){
      list.innerHTML='<div class="home-latest-explore-empty">탐험기를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';
      return;
    }
    if(!data?.length){
      list.innerHTML='<div class="home-latest-explore-empty">아직 공개된 탐험기가 없습니다.</div>';
      return;
    }
    const pool=data.slice();
    for(let i=pool.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }
    render(pool.slice(0,5),A);
  }catch(_e){
    list.innerHTML='<div class="home-latest-explore-empty">탐험기를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';
  }
}

if(window.ALBAM09?.sb) load();
else window.addEventListener('ab09-ready',load,{once:true});
})();