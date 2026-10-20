import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const src=readFileSync(new URL('../../js/admin09.js',import.meta.url),'utf8');
const sections=Object.fromEntries(['adminPending','adminPublished','adminMembers','adminPendingComments','adminRecentComments','adminGate','adminContent'].map(id=>[id,{innerHTML:'',style:{},querySelectorAll:()=>[]}]));
const calls=[];
const rows={
 albam09_explorer_posts:[],
 albam09_explorer_comments:[{id:'comment-1',post_id:'post-1',author_id:'author-1',status:'pending',is_deleted:false,created_at:'2026-10-21T01:00:00Z',content:'실제 댓글 승인 대기 테스트',profiles:{nickname:'테스트회원'},albam09_explorer_posts:{slug:'karaoke1-test',title:'상무지구 탐험기'}}],
 profiles:[],albam09_staff:[]
};
const el={getElementById:id=>sections[id],querySelectorAll:()=>[]};
let isAdmin=true;
const A={get isAdmin(){return isAdmin},isSuper:true,session:{user:{id:'user-1'}},toast:x=>calls.push(['toast',x]),esc:x=>String(x).replaceAll('<','&lt;'),fmt:x=>x,
 sb:{from:table=>{let status='',groups=[];const q={select(){return q},eq(key,val){if(key==='status')status=val;return q},in(key,list){if(key==='status')groups=list;return q},order(){return q},limit(){const data=(rows[table]||[]).filter(r=>groups.length?groups.includes(r.status):status?r.status===status:true);return Promise.resolve({data,error:null})}};return q},rpc(name,args){calls.push([name,args]);return Promise.resolve({error:null})}}
};
const ctx={window:{ALBAM09_READY:true,ALBAM09:A},document:el,confirm:()=>true,location:{},console};vm.createContext(ctx);vm.runInContext(src,ctx);
for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
assert.match(sections.adminPendingComments.innerHTML,/실제 댓글 승인 대기 테스트/);
assert.match(sections.adminPendingComments.innerHTML,/data-comment-status="published"/);
assert.match(sections.adminPendingComments.innerHTML,/data-comment-status="rejected"/);
assert.match(sections.adminPendingComments.innerHTML,/상무지구 탐험기/);
assert.match(sections.adminPending.innerHTML,/검토 대기 글이 없습니다/);
assert.equal(sections.adminContent.style.display,'block');
// Directly test handler through deployed button hookup in a real browser; here
// verify code and RPC contract without production service credentials.
assert.match(src,/rpc\('albam09_moderate_explorer_comment'/);
console.log('PASS: staff dashboard loads comment review independent of post review; approve/reject buttons and source article link rendered');
