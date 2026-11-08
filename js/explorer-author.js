/* Public nickname and published activity only. Never query auth.users. */
(function(){
 'use strict';
 const box=document.getElementById('explorerAuthor');if(!box||box.dataset.prerendered==='true')return;
 const key=(location.pathname.match(/\/explore\/author\/(member-[a-f0-9]{24})\/?$/)||[])[1];
 function robots(value){let m=document.head.querySelector('meta[name="robots"]');if(m)m.content=value;}
 async function pages(A,table,select){
  const result=[];
  for(let offset=0;;offset+=500){
   const {data,error}=await A.sb.from(table).select(select).eq('status','published').eq('is_deleted',false).order('created_at',{ascending:false}).range(offset,offset+499);
   if(error)throw error;
   result.push(...(data||[]));if(!data||data.length<500)return result;
  }
 }
 async function load(){
  const A=window.ALBAM09,F=window.ALBAM09_FORUM_SCHEMA;
  if(!key||!A?.sb||!F){robots('noindex, follow');box.innerHTML='<div class="explorer-empty">공개 프로필을 확인할 수 없습니다. <a href="/explore/">탐험기 목록 보기</a></div>';return;}
  try{
   const posts=await pages(A,'albam09_explorer_posts','id,slug,author_id,board,title,summary,content,published_at,created_at,profiles!albam09_explorer_posts_author_fkey(nickname)');
   const publicPostIds=new Set(posts.map(p=>p.id));
   let author=null,comments=[];const keys=new Map();
   async function matches(row){if(!keys.has(row.author_id))keys.set(row.author_id,await F.authorKey(row.author_id));return keys.get(row.author_id)===key;}
   for(const row of posts){if(await matches(row)){author=row;break;}}
   if(!author){
    comments=(await pages(A,'albam09_explorer_comments','id,post_id,author_id,content,created_at,profiles!albam09_explorer_comments_author_fkey(nickname)')).filter(c=>publicPostIds.has(c.post_id));
    for(const row of comments){if(await matches(row)){author=row;break;}}
   }
   if(!author){robots('noindex, follow');box.innerHTML='<div class="explorer-empty">현재 공개된 활동이 없는 회원입니다. <a href="/explore/">탐험기 목록 보기</a></div>';return;}
   const person=await F.author(author),items=posts.filter(p=>p.author_id===author.author_id);
   const markup=items.map(p=>`<a class="explorer-card" href="/explore/post/${A.esc(p.slug)}/"><div class="explorer-card-body"><h2>${A.esc(p.title)}</h2><p>${A.esc(p.summary||p.content.slice(0,150))}</p><div class="explorer-meta">${A.esc(A.fmt(F.published(p)))}</div></div></a>`).join('');
   const replies=comments.filter(c=>c.author_id===author.author_id).map(c=>{const p=posts.find(p=>p.id===c.post_id);return `<a class="explorer-card" href="/explore/post/${A.esc(p.slug)}/#comment-${A.esc(c.id)}"><div class="explorer-card-body"><h2>${A.esc(p.title)}에 남긴 댓글</h2><p>${A.esc(c.content.slice(0,200))}</p></div></a>`;}).join('');
   box.innerHTML=`<section class="explorer-panel"><span class="explorer-eyebrow">탐험기 작성자</span><h1>${A.esc(person.name)}</h1><p>공개 탐험기 ${items.length}개</p></section><div class="explorer-grid explorer-author-posts">${markup||replies}</div>`;
   let link=document.head.querySelector('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link);}link.href=person.url;
   document.title=person.name+' 공개 탐험기 | 광주버블여지도';robots('index, follow');
   const ld=document.createElement('script');ld.id='explorer-author-ld';ld.type='application/ld+json';ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'ProfilePage',url:person.url,mainEntity:person});document.head.appendChild(ld);
  }catch(error){robots('noindex, follow');box.innerHTML='<div class="explorer-empty">프로필을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';console.warn('[explorer-author]',error.message);}
 }
 if(window.ALBAM09_READY)load();else window.addEventListener('ab09-ready',load,{once:true});
})();
