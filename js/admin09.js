(()=>{
'use strict';
const pending=document.getElementById('adminPending'),published=document.getElementById('adminPublished'),members=document.getElementById('adminMembers');
const pendingComments=document.getElementById('adminPendingComments'),recentComments=document.getElementById('adminRecentComments');
async function loadPosts(){const A=window.ALBAM09;if(!A?.isAdmin)return;const q=await A.sb.from('albam09_explorer_posts').select('id,slug,board,title,status,author_id,created_at,profiles!albam09_explorer_posts_author_fkey(nickname)').eq('is_deleted',false).in('status',['pending','rejected','hidden']).order('created_at',{ascending:false}).limit(100);pending.innerHTML=(q.data||[]).length?(q.data||[]).map(x=>row(x,A,true)).join(''):'<div class="explorer-empty">검토 대기 글이 없습니다.</div>';const p=await A.sb.from('albam09_explorer_posts').select('id,slug,board,title,status,author_id,published_at,profiles!albam09_explorer_posts_author_fkey(nickname)').eq('is_deleted',false).eq('status','published').order('published_at',{ascending:false}).limit(30);published.innerHTML=(p.data||[]).map(x=>row(x,A,false)).join('')||'<div class="explorer-empty">공개 글이 없습니다.</div>';bindActions()}

async function loadComments(){
 const A=window.ALBAM09;if(!A?.isAdmin||!pendingComments||!recentComments)return;
 const fields='id,post_id,author_id,content,status,created_at,profiles!albam09_explorer_comments_author_fkey(nickname),albam09_explorer_posts!albam09_explorer_comments_post_fkey(slug,title)';
 const [q,p]=await Promise.all([
  A.sb.from('albam09_explorer_comments').select(fields).eq('is_deleted',false).in('status',['pending','rejected']).order('created_at',{ascending:false}).limit(100),
  A.sb.from('albam09_explorer_comments').select(fields).eq('is_deleted',false).eq('status','published').order('created_at',{ascending:false}).limit(30)
 ]);
 function render(rows,review){return rows.map(c=>{
  const post=c.albam09_explorer_posts;const href=post?.slug?'/explore/post/'+encodeURIComponent(post.slug)+'/':null;
  return `<div class="explorer-admin-row"><div style="min-width:0"><strong>${A.esc(c.profiles?.nickname||'회원')}</strong><div class="explorer-meta">${A.esc(c.status)} · ${A.fmt(c.created_at)}${href?` · <a href="${href}" target="_blank" rel="noopener">${A.esc(post.title||'탐험기 원문')}</a>`:''}</div><p style="white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0 0">${A.esc(c.content)}</p></div><div class="explorer-admin-tools">${review?`<button type="button" class="explorer-btn" data-comment-status="published" data-comment-id="${c.id}">승인</button><button type="button" class="explorer-btn secondary" data-comment-status="rejected" data-comment-id="${c.id}">반려</button>`:''}${A.isSuper?`<button type="button" class="explorer-btn danger" data-comment-delete="${c.id}">삭제</button>`:''}</div></div>`;
 }).join('')}
 if(q.error)pendingComments.innerHTML='<div class="explorer-empty">승인 대기 댓글 조회 실패: '+A.esc(q.error.message)+'</div>';
 else pendingComments.innerHTML=q.data?.length?render(q.data,true):'<div class="explorer-empty">승인 대기 댓글이 없습니다.</div>';
 if(p.error)recentComments.innerHTML='<div class="explorer-empty">공개 댓글 조회 실패: '+A.esc(p.error.message)+'</div>';
 else recentComments.innerHTML=p.data?.length?render(p.data,false):'<div class="explorer-empty">공개 댓글이 없습니다.</div>';
 document.querySelectorAll('[data-comment-status]').forEach(b=>b.onclick=()=>moderateComment(b.dataset.commentId,b.dataset.commentStatus));
 document.querySelectorAll('[data-comment-delete]').forEach(b=>b.onclick=()=>deleteComment(b.dataset.commentDelete));
}
async function moderateComment(id,status){
 const A=window.ALBAM09;if(!A?.isAdmin)return;
 if(!confirm(status==='published'?'이 댓글을 승인하여 전체 공개할까요?':'이 댓글을 반려할까요?'))return;
 const {error}=await A.sb.rpc('albam09_moderate_explorer_comment',{p_comment_id:id,p_status:status});
 if(error)return A.toast('댓글 처리 실패: '+error.message);
 A.toast(status==='published'?'댓글을 공개했습니다.':'댓글을 반려했습니다.');await loadComments();
}
async function deleteComment(id){
 const A=window.ALBAM09;if(!A?.isSuper)return;if(!confirm('이 댓글을 삭제할까요?'))return;
 const {error}=await A.sb.rpc('albam09_delete_explorer_comment',{p_comment_id:id});
 if(error)return A.toast('댓글 삭제 실패: '+error.message);A.toast('댓글을 삭제했습니다.');await loadComments();
}

function row(x,A,review){return `<div class="explorer-admin-row"><div><strong>${A.esc(x.title)}</strong><div class="explorer-meta">${A.esc(x.board)} · ${A.esc(x.profiles?.nickname||'회원')} · ${A.esc(x.status)}</div></div><div class="explorer-admin-tools"><a class="explorer-btn secondary" href="/explore/post/${encodeURIComponent(x.slug)}/" target="_blank">보기</a><a class="explorer-btn secondary" href="/explore/write/?edit=${encodeURIComponent(x.id)}&board=${encodeURIComponent(x.board)}">수정</a>${review?`<button class="explorer-btn" data-mod="published" data-id="${x.id}">승인</button><button class="explorer-btn danger" data-mod="rejected" data-id="${x.id}">반려</button>`:`<button class="explorer-btn secondary" data-mod="hidden" data-id="${x.id}">숨김</button>`}${A.isAdmin?`<button class="explorer-btn danger" data-delete="${x.id}">삭제</button>`:''}</div></div>`}
function bindActions(){document.querySelectorAll('[data-mod]').forEach(b=>b.onclick=()=>moderate(b.dataset.id,b.dataset.mod));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>del(b.dataset.delete))}
async function moderate(id,status){const A=window.ALBAM09;const {error}=await A.sb.rpc('albam09_moderate_post',{p_post_id:id,p_status:status});if(error)return A.toast('처리 실패: '+error.message);A.toast('상태를 변경했습니다.');loadPosts()}
async function del(id){const A=window.ALBAM09;if(!A?.isAdmin)return A?.toast('운영자 권한을 확인하세요.');if(!confirm('삭제 처리할까요?'))return;const {error}=await A.sb.rpc('albam09_delete_explorer_post',{p_post_id:id});if(error)return A.toast('삭제 실패: '+error.message);A.toast('글을 삭제했습니다. 자동 재빌드 후 검색용 HTML과 사이트맵에서 제거됩니다.');loadPosts()}
async function loadMembers(){const A=window.ALBAM09;if(!A?.isSuper){members.innerHTML='<div class="explorer-empty">최고관리자만 운영자 권한을 관리할 수 있습니다.</div>';return}const q=await A.sb.from('profiles').select('id,nickname,role,created_at').order('created_at',{ascending:false}).limit(100);const s=await A.sb.from('albam09_staff').select('user_id,level');const sm=new Map((s.data||[]).map(x=>[x.user_id,x.level]));members.innerHTML=(q.data||[]).map(x=>`<div class="explorer-admin-row"><div><strong>${A.esc(x.nickname||'회원')}</strong><div class="explorer-meta">${sm.get(x.id)==='super_admin'?'최고관리자':sm.get(x.id)==='admin'?'관리자':'일반 회원(user)'} · ${x.id.slice(0,8)}</div></div><div class="explorer-admin-tools">${x.id===A.session.user.id?'<span class="explorer-status published">현재 계정</span>':`<button class="explorer-btn" data-staff="admin" data-user="${x.id}">관리자로 승급</button><button class="explorer-btn danger" data-staff="remove" data-user="${x.id}">일반 회원으로 전환</button>`}</div></div>`).join('');members.querySelectorAll('[data-staff]').forEach(b=>b.onclick=()=>setStaff(b.dataset.user,b.dataset.staff))}
async function setStaff(uid,level){const A=window.ALBAM09;if(!confirm(level==='admin'?'이 회원을 09 관리자(admin)로 승급하시겠습니까?':'이 회원의 09 관리자 권한을 해제하고 일반 회원(user)으로 전환할까요?'))return;const {error}=await A.sb.rpc('albam09_set_staff',{p_user_id:uid,p_level:level==='remove'?null:level});if(error)return A.toast('권한 변경 실패: '+error.message);A.toast('권한을 변경했습니다.');loadMembers()}
function initAdmin(){const A=window.ALBAM09;if(!A?.session){document.getElementById('adminGate').innerHTML='<div class="explorer-empty">로그인이 필요합니다.</div>';return}if(!A.isAdmin){document.getElementById('adminGate').innerHTML='<div class="explorer-empty">관리자 권한이 없습니다.</div>';return}document.getElementById('adminGate').style.display='none';document.getElementById('adminContent').style.display='block';loadPosts();loadComments();loadMembers()}
if(window.ALBAM09_READY)initAdmin();else window.addEventListener('ab09-ready',initAdmin,{once:true});
})();
