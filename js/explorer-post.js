(()=>{
'use strict';
const box=document.getElementById('explorerPost');if(!box)return;
const hasPrerender=()=>box.dataset.prerendered==='true';
const slug=decodeURIComponent((location.pathname.match(/\/explore\/post\/([^/]+)\/?/)||[])[1]||new URLSearchParams(location.search).get('slug')||'');
let loaded=null,commentRows=[];
const labels={karaoke1:'상무지구',karaoke2:'상무·광천동',karaoke3:'신안동',karaoke4:'용봉동',karaoke5:'첨단지구',karaoke6:'목포',karaoke7:'광주 동구',karaoke8:'광주 남구'};

// Only link to an existing, exact-match registered business: never guess destination.
function businessDetailUrl(name){
 const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase('ko-KR');
 const list=window.PUBLIC_VENUES;
 if(!Array.isArray(list)||!name)return null;
 const matches=list.filter(v=>norm(v.name)===norm(name));
 if(matches.length!==1||!/^[a-z0-9-]+$/i.test(matches[0].slug||''))return null;
 return `https://ilovebam11.com/place/${encodeURIComponent(matches[0].slug)}/`;
}
function venueBadge(d,A){
 const name=String(d.venue_name||'').trim();if(!name)return '';
 const url=businessDetailUrl(name),content=`<span class="explorer-post-venue__label">업소</span><strong>${A.esc(name)}</strong>`;
 return url?`<a class="explorer-post-venue explorer-post-venue--link" href="${A.esc(url)}" aria-label="${A.esc(name)} 업소 상세페이지 바로가기">${content}<span class="explorer-post-venue__hint" aria-hidden="true">상세보기 ↗</span></a>`:
 `<div class="explorer-post-venue">${content}</div>`;
}

function setMeta(name,content,prop=false){let q=prop?`meta[property="${name}"]`:`meta[name="${name}"]`;let el=document.head.querySelector(q);if(!el){el=document.createElement('meta');el.setAttribute(prop?'property':'name',name);document.head.appendChild(el)}el.content=content}
function setCanonical(url){let el=document.head.querySelector('link[rel="canonical"]');if(!el){el=document.createElement('link');el.rel='canonical';document.head.appendChild(el)}el.href=url}
function setRobots(content){setMeta('robots',content)}
function canManagePost(A,d){
 return !!(A?.session && d?.id && (A.isAdmin || (d.author_id && A.session.user.id===d.author_id)));
}
function syncManageTools(A){
 const article=box.querySelector('article.explorer-post');
 if(!article)return;
 article.querySelector('[data-explorer-management]')?.remove();
 if(!canManagePost(A,loaded))return;
 const actions=document.createElement('div');
 actions.className='explorer-actions';
 actions.dataset.explorerManagement='true';
 actions.setAttribute('aria-label','탐험기 관리');
 actions.innerHTML=`<a class="explorer-btn secondary" href="/explore/write/?edit=${encodeURIComponent(loaded.id)}&board=${encodeURIComponent(loaded.board)}">수정</a><button class="explorer-btn danger" type="button">삭제</button>`;
 article.appendChild(actions);
 actions.querySelector('button').addEventListener('click',deletePost);
}
// 정적 생성 HTML은 글 본문만 포함한다. 관리자라도 데이터 요청 실패 시
// 검색용 본문을 지우지 않고 승인된 운영자에게만 관리 기능을 복원한다.
function recoverPrerenderTools(A){
 if(!hasPrerender() || !A?.session || !A.isAdmin)return;
 const article=box.querySelector('article.explorer-post');
 const id=article?.dataset.explorerId;
 const board=article?.dataset.explorerBoard;
 if(!/^[a-f\d]{8}-[a-f\d-]{27,}$/i.test(id||'') || !Object.hasOwn(labels,board||''))return;
 loaded={id,board,slug,status:'published'};
 syncManageTools(A);
}
function statusText(s){return({pending:'관리자 검토중',published:'공개',rejected:'보완 필요',hidden:'숨김'}[s]||s)}
function renderImages(images,title,A){if(!Array.isArray(images)||!images.length)return'';return `<div class="explorer-gallery">${images.map((im,i)=>`<figure><img src="${A.esc(im.url)}" alt="${A.esc(im.alt||title+' 탐험기 사진 '+(i+1))}" title="${A.esc(im.alt||title)}" loading="${i?'lazy':'eager'}" decoding="async" ${i?'':'fetchpriority="high"'}><figcaption>${A.esc(im.caption||im.alt||title+' 현장 이미지')}</figcaption></figure>`).join('')}</div>`}
function injectSchema(d,comments){
 let old=document.getElementById('explorer-post-ld');if(old)old.remove();
 const url=`${location.origin}/explore/post/${d.slug}/`;
 const images=(d.images||[]).map(x=>x.url).filter(Boolean);
 if(!Number.isFinite(Date.parse(d.published_at||d.created_at)))return;
 const obj={'@context':'https://schema.org','@type':'DiscussionForumPosting',mainEntityOfPage:url,url,headline:d.title,text:d.content,datePublished:d.published_at||d.created_at,dateModified:d.updated_at||d.published_at||d.created_at,author:{'@type':'Person',name:d.profiles?.nickname||'광주버블여지도 회원'}};
 if(images.length)obj.image=images;
 if(comments?.length)obj.comment=comments.map(c=>({'@type':'Comment',text:c.content,url:url+'#comment-'+encodeURIComponent(c.id),datePublished:c.created_at,author:{'@type':'Person',name:c.profiles?.nickname||'회원'}}));
 const s=document.createElement('script');s.id='explorer-post-ld';s.type='application/ld+json';s.textContent=JSON.stringify(obj);document.head.appendChild(s);
}
async function load(){
 const A=window.ALBAM09;
 if(!slug){setRobots('noindex, follow');box.innerHTML='<div class="explorer-empty">게시물 주소가 올바르지 않습니다.</div>';return}
 if(!A?.sb){if(hasPrerender()){recoverPrerenderTools(A);return;} setRobots('noindex, follow');box.innerHTML='<div class="explorer-empty">탐험기 데이터 연결을 준비하지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';return}
 const {data,error}=await A.sb.from('albam09_explorer_posts').select('id,slug,board,title,summary,content,venue_name,location_text,images,status,is_deleted,author_id,created_at,updated_at,published_at,profiles!albam09_explorer_posts_author_fkey(nickname)').eq('slug',slug).maybeSingle();
 if(error){if(hasPrerender()){recoverPrerenderTools(A);return;} setRobots('noindex, follow');box.innerHTML='<div class="explorer-empty">탐험기 데이터를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';return}
 if(!data||data.is_deleted){setRobots('noindex, follow');box.innerHTML='<div class="explorer-empty">공개된 탐험기를 찾을 수 없습니다.</div>';return}
 loaded=data;const canViewPrivate=!!A.session&&(A.session.user.id===data.author_id||A.isAdmin);const label=labels[data.board]||'지역';
 if(data.status!=='published'&&!canViewPrivate){setRobots('noindex, follow');box.innerHTML='<div class="explorer-empty">관리자 검토가 끝난 뒤 공개되는 글입니다.</div>';return}
 const summary=data.summary?`<div class="explorer-post-summary">${A.esc(data.summary)}</div>`:'';
 const venue=venueBadge(data,A);
 box.innerHTML=`<article class="explorer-post"><div><span class="explorer-status ${A.esc(data.status)}">${A.esc(statusText(data.status))}</span> <span class="explorer-eyebrow">${A.esc(label)} 탐험기</span></div><h1>${A.esc(data.title)}</h1>${venue}<div class="explorer-meta">${A.esc(data.profiles?.nickname||'회원')} · ${A.fmt(data.published_at||data.created_at)}${data.location_text?' · '+A.esc(data.location_text):''}</div>${summary}${renderImages(data.images,data.title,A)}<div class="explorer-post-content">${A.esc(data.content)}</div></article><section class="explorer-panel explorer-comments"><h2>댓글</h2><div id="explorerComments"><div class="explorer-empty">댓글을 불러오는 중입니다.</div></div><form id="explorerCommentForm" class="explorer-two" style="margin-top:12px"><input class="explorer-input" id="explorerComment" maxlength="1200" placeholder="지역 이용 정보와 경험을 남겨주세요"><button class="explorer-btn" type="submit">댓글 등록</button></form><div class="explorer-help">회원 댓글도 안전성 확인을 거쳐 공개될 수 있습니다.</div></section>`;
 const url=`${location.origin}/explore/post/${data.slug}/`;const desc=(data.summary||data.content.slice(0,155)).trim();document.title=`${data.title} | ${label} 탐험기 | 광주버블여지도`;setCanonical(url);setRobots(data.status==='published'?'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1':'noindex, follow');setMeta('description',desc);setMeta('og:title',data.title,true);setMeta('og:description',desc,true);setMeta('og:url',url,true);setMeta('og:type','article',true);setMeta('twitter:card','summary_large_image');if(data.published_at)setMeta('article:published_time',data.published_at,true);if(data.updated_at)setMeta('article:modified_time',data.updated_at,true);if(data.images?.[0]?.url){setMeta('og:image',data.images[0].url,true);setMeta('twitter:image',data.images[0].url)}
 syncManageTools(A);await loadComments();document.getElementById('explorerCommentForm')?.addEventListener('submit',submitComment);
}
async function loadComments(){const A=window.ALBAM09;if(!loaded)return;const {data,error}=await A.sb.from('albam09_explorer_comments').select('id,content,status,author_id,created_at,updated_at,profiles!albam09_explorer_comments_author_fkey(nickname)').eq('post_id',loaded.id).eq('is_deleted',false).order('created_at');if(error){const area=document.getElementById('explorerComments');if(area)area.innerHTML='<div class="explorer-empty">댓글을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</div>';console.warn('[explorer-comments] 조회 오류:',error.message);return}const rows=(data||[]).filter(c=>A.isAdmin||c.status==='published'||(A.session&&c.author_id===A.session.user.id));commentRows=rows;const list=document.getElementById('explorerComments');if(list){list.innerHTML=rows.length?rows.map(c=>`<div class="explorer-comment" id="comment-${A.esc(c.id)}"><div class="explorer-comment__head"><div><strong>${A.esc(c.profiles?.nickname||'회원')}</strong><span class="explorer-meta"> · ${A.fmt(c.created_at)}${c.status!=='published'?' · 검토중':''}</span></div>${A.isSuper?`<div class="explorer-comment-tools"><button class="explorer-comment-tool" type="button" data-comment-edit="${c.id}">수정</button><button class="explorer-comment-tool danger" type="button" data-comment-delete="${c.id}">삭제</button></div>`:''}</div><p>${A.esc(c.content)}</p></div>`).join(''):'<div class="explorer-empty">아직 공개된 댓글이 없습니다.</div>';if(A.isSuper){list.querySelectorAll('[data-comment-edit]').forEach(b=>b.onclick=()=>editComment(b.dataset.commentEdit));list.querySelectorAll('[data-comment-delete]').forEach(b=>b.onclick=()=>deleteComment(b.dataset.commentDelete))}}if(loaded.status==='published')injectSchema(loaded,rows.filter(c=>c.status==='published'))}

async function editComment(id){const A=window.ALBAM09;if(!A?.isSuper)return A?.toast('최고관리자만 댓글을 수정할 수 있습니다.');const row=commentRows.find(x=>x.id===id);if(!row)return;const value=prompt('댓글 수정',row.content||'');if(value===null)return;const content=value.trim();if(!content)return A.toast('댓글 내용을 입력하세요.');const {error}=await A.sb.rpc('albam09_update_explorer_comment',{p_comment_id:id,p_content:content});if(error)return A.toast('댓글 수정 실패: '+(error.message||''));A.toast('댓글을 수정했습니다.');loadComments()}
async function deleteComment(id){const A=window.ALBAM09;if(!A?.isSuper)return A?.toast('최고관리자만 댓글을 삭제할 수 있습니다.');if(!confirm('이 댓글을 삭제할까요?'))return;const {error}=await A.sb.rpc('albam09_delete_explorer_comment',{p_comment_id:id});if(error)return A.toast('댓글 삭제 실패: '+(error.message||''));A.toast('댓글을 삭제했습니다.');loadComments()}
async function submitComment(e){e.preventDefault();const A=window.ALBAM09;if(!A.requireAuth())return;const input=document.getElementById('explorerComment');const v=input.value.trim();if(!v)return;const {error}=await A.sb.rpc('albam09_create_comment',{p_post_id:loaded.id,p_content:v});if(error)return A.toast('댓글 등록 실패: '+(error.message||''));input.value='';A.toast(A.isAdmin?'댓글을 등록했습니다.':'댓글이 관리자 검토 대기열에 등록되었습니다.');loadComments()}
async function deletePost(e){
 const A=window.ALBAM09;
 if(!canManagePost(A,loaded))return A?.toast('삭제 권한이 없습니다. 로그인 상태를 확인하세요.');
 if(!confirm('이 탐험기를 삭제할까요? 삭제되면 검색용 HTML도 다음 자동 빌드에서 제거됩니다.'))return;
 const btn=e?.currentTarget;
 if(btn){btn.disabled=true;btn.textContent='삭제 중…'}
 try{
  const {error}=await A.sb.rpc('albam09_delete_explorer_post',{p_post_id:loaded.id});
  if(error)throw error;
  A.toast('삭제 처리했습니다. 검색용 페이지와 사이트맵은 자동 빌드 후 반영됩니다.');
  location.href=`/explore/${loaded.board}/`;
 }catch(err){A.toast('삭제 실패: '+(err.message||err));if(btn){btn.disabled=false;btn.textContent='삭제'}}
}
if(window.ALBAM09_READY)load();else window.addEventListener('ab09-ready',load,{once:true});
window.addEventListener('ab09-auth',()=>{
 const A=window.ALBAM09;
 if(loaded){syncManageTools(A);if(loaded.content)loadComments()}
 else if(A?.sb)load();
});
})();
