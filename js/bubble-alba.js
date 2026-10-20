/* 전용 공고 게시판: 글쓰기는 서버 RPC가 super_admin만 허용, 댓글 제출은 비회원도 가능 */
(()=>{'use strict';
const $=id=>document.getElementById(id);const list=$('balbaList'),admin=$('balbaAdmin'),status=$('balbaStatus');
const api=window.ALBAM09_REALTIME||{};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?new Date(v).toLocaleDateString('ko-KR'):'날짜 미정';
let sb=null,superAdmin=false,editing=null,posts=[];
function msg(t){if(status){status.textContent=t;}else console.info('[bubble-alba]',t)}
function el(tag,className,txt){const n=document.createElement(tag);if(className)n.className=className;if(txt!=null)n.textContent=txt;return n}
function fieldValue(id){return ($(id)?.value||'').trim()}
function showAdmin(){if(admin)admin.hidden=!superAdmin;if($('balbaAdminHint'))$('balbaAdminHint').hidden=!superAdmin}
function addButton(parent,label,style,cb){const b=el('button','balba-button balba-button--small '+(style||''),label);b.type='button';b.addEventListener('click',cb);parent.append(b);return b}
function createPostCard(p){
 const article=el('article','balba-item');article.dataset.postId=p.id;
 const head=el('div','balba-itemtop');head.append(el('span','balba-badge',p.status==='draft'?'임시저장':'운영자 안내'));head.append(el('time','balba-itemtime',date(p.published_at||p.created_at)));article.append(head);
 article.append(el('h3','',p.title));if(p.summary)article.append(el('p','balba-itemsummary',p.summary));article.append(el('div','balba-itembody',p.content));
 const tools=el('div','balba-itemtools'),left=el('div');const right=el('div');addButton(left,'댓글 보기 · 작성','balba-button--outline',()=>toggleComments(article,p));
 if(superAdmin){addButton(right,'수정','balba-button--outline',()=>startEdit(p));addButton(right,'삭제','balba-button--danger',()=>removePost(p))}
 tools.append(left,right);article.append(tools);
 const panel=el('section','balba-comment-panel');panel.hidden=true;panel.setAttribute('aria-label',p.title+' 댓글');panel.innerHTML='<h4>댓글</h4><div class="balba-commentlist"></div>';
 const form=el('form','balba-form');form.innerHTML='<label class="balba-field">닉네임<input name="guest_name" maxlength="24" minlength="2" autocomplete="nickname" required placeholder="닉네임 (2~24자)"></label><label class="balba-field">댓글<textarea name="content" maxlength="1000" minlength="2" required placeholder="궁금한 점을 남겨 주세요. 개인정보·연락처는 적지 마세요."></textarea></label><label class="balba-honeypot" aria-hidden="true">회사명<input name="company" type="text" autocomplete="off" tabindex="-1"></label>';
 const note=el('p','balba-help','모든 방문자가 댓글을 등록할 수 있습니다. 관리자 검토 후 공개되며, 개인정보나 부적절한 내용은 게시되지 않습니다.');form.append(note);
 const submit=el('button','balba-button','댓글 등록');submit.type='submit';form.append(submit);
 form.addEventListener('submit',async e=>{e.preventDefault();if(!sb){msg('댓글 서비스를 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.');return}submit.disabled=true;const data=new FormData(form);
 const {error}=await sb.rpc('albam09_alba_submit_comment',{p_post_id:p.id,p_guest_name:String(data.get('guest_name')||''),p_content:String(data.get('content')||''),p_company:String(data.get('company')||'')});submit.disabled=false;
 if(error){msg(error.message.includes('rate_limited')?'댓글을 너무 자주 등록했습니다. 잠시 뒤 다시 시도해 주세요.': '댓글 접수 실패: '+error.message);return}
 form.reset();msg('댓글이 접수됐습니다. 관리자 승인 후 공개됩니다.');if(superAdmin)await renderComments(panel,p.id);
 });panel.append(form);article.append(panel);return article;
}
async function toggleComments(article,p){const panel=article.querySelector('.balba-comment-panel');if(!panel)return;panel.hidden=!panel.hidden;if(!panel.hidden)await renderComments(panel,p.id)}
async function renderComments(panel,postId){const host=panel.querySelector('.balba-commentlist');if(!host)return;host.replaceChildren(el('p','balba-help','댓글을 불러오고 있습니다.'));
 if(!sb){host.replaceChildren(el('p','balba-help','댓글 서비스에 연결할 수 없습니다.'));return}
 let q=sb.from('albam09_bubble_alba_comments').select('id,guest_name,content,status,created_at').eq('post_id',postId).order('created_at',{ascending:true}).limit(100);
 if(!superAdmin)q=q.eq('status','published');const {data,error}=await q;
 if(error){host.replaceChildren(el('p','balba-help','댓글 조회 실패: '+error.message));return}
 host.replaceChildren();if(!data?.length)host.append(el('p','balba-help','아직 공개된 댓글이 없습니다. 첫 댓글을 남겨 주세요.'));
 (data||[]).forEach(c=>{const d=el('div','balba-comment'),h=el('div','balba-commenthead');h.append(el('strong','',c.guest_name),el('time','balba-commenttime',date(c.created_at)));if(c.status!=='published')h.append(el('span','balba-review',c.status==='pending'?'승인 대기':'반려됨'));d.append(h,el('p','',c.content));if(superAdmin&&c.status!=='published')addButton(d,'승인','balba-button--outline',async()=>{await moderate(c.id,'published');await renderComments(panel,postId)});if(superAdmin&&c.status==='pending')addButton(d,'반려','balba-button--danger',async()=>{await moderate(c.id,'rejected');await renderComments(panel,postId)});if(superAdmin&&c.status==='published')addButton(d,'공개 취소','balba-button--danger',async()=>{await moderate(c.id,'rejected');await renderComments(panel,postId)});host.append(d)})}
async function moderate(id,val){if(!superAdmin||!sb)return;const {error}=await sb.rpc('albam09_alba_moderate_comment',{p_id:id,p_status:val});msg(error?'댓글 처리 실패: '+error.message:'댓글 상태를 변경했습니다.')}
function render(postsToShow){if(!list)return;list.replaceChildren();if(!postsToShow.length){list.append(el('div','balba-empty','등록된 채용 안내가 없습니다. 안내가 올라오면 이곳에 표시됩니다.'));return}postsToShow.forEach(p=>list.append(createPostCard(p)))}
function startEdit(p){if(!superAdmin)return;editing=p.id;$('balbaTitle').value=p.title;$('balbaSummary').value=p.summary||'';$('balbaContent').value=p.content;$('balbaVisibility').value=p.status;$('balbaEditorTitle').textContent='안내글 수정';admin.scrollIntoView({behavior:'smooth',block:'start'})}
function resetEditor(){editing=null;$('balbaForm').reset();$('balbaEditorTitle').textContent='새 공고 작성'}
async function removePost(p){if(!superAdmin||!confirm('이 공고를 삭제할까요? (검색용 HTML도 다음 빌드에서 제거됩니다.)'))return;const {error}=await sb.rpc('albam09_alba_remove_post',{p_id:p.id});if(error)return msg('삭제 실패: '+error.message);msg('삭제했습니다. 자동 재빌드가 실행됩니다.');await loadPosts()}
async function loadPosts(){if(!sb){msg('사이트 정보 연결을 기다리는 중입니다.');return}
 const q=sb.from('albam09_bubble_alba_posts').select('id,title,summary,content,status,created_at,published_at,updated_at').eq('is_deleted',false).order('created_at',{ascending:false}).limit(100);if(!superAdmin)q.eq('status','published');const {data,error}=await q;
 if(error){msg('공고 갱신 실패: '+error.message+' (정적 공개 안내는 유지됩니다.)');return}
 posts=data||[];render(posts);msg('');}
async function init(){const A=window.ALBAM09;if(A?.sb){sb=A.sb;superAdmin=!!A.isSuper}else{
 try{if(window.ALBAM09_SUPABASE_READY)await window.ALBAM09_SUPABASE_READY;
 if(window.supabase?.createClient&&api.supabaseUrl&&api.supabaseAnonKey)sb=window.supabase.createClient(api.supabaseUrl,api.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}})
 }catch(e){console.warn('[bubble-alba] sdk',e)}
 }
 showAdmin();if(sb)await loadPosts();else msg('게시글을 새로 불러오지 못했습니다. 공개 안내는 페이지에 유지됩니다.');
}
$('balbaForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!superAdmin||!sb)return msg('최고관리자만 등록할 수 있습니다.');const b=$('balbaSubmit');b.disabled=true;
 const {error}=await sb.rpc('albam09_alba_save_post',{p_id:editing,p_title:fieldValue('balbaTitle'),p_summary:fieldValue('balbaSummary'),p_content:fieldValue('balbaContent'),p_status:$('balbaVisibility').value});b.disabled=false;
 if(error)return msg('저장 실패: '+error.message);resetEditor();msg('저장됐습니다. 공개 글은 Netlify 자동 빌드에도 반영됩니다.');await loadPosts()});
$('balbaReset')?.addEventListener('click',resetEditor);
if(window.ALBAM09_READY)init();else window.addEventListener('ab09-ready',init,{once:true});
// 로그인 SDK 오류 시에도 별도 public 접근을 한 번 시도
setTimeout(()=>{if(!sb)init()},4500);
})();
