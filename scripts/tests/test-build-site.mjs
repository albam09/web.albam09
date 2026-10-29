import {mkdtemp, mkdir, cp, copyFile, writeFile, readFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const source=path.resolve(import.meta.dirname,'../..');
const temp=await mkdtemp(path.join(tmpdir(),'albam09-explore-test-'));
const slug='karaoke1-20261020010101-abcd1234';
const post={slug,board:'karaoke1',title:'상무지구 탐험기 자동 색인 테스트',summary:'실제 탐험기 요약',content:'탐험기 내용 본문입니다.',venue_name:'',location_text:'상무지구',images:[],created_at:'2026-10-20T00:00:00Z',published_at:'2026-10-20T00:10:00Z',updated_at:'2026-10-20T00:10:00Z',profiles:{nickname:'실제 테스트 작성자'}};
function run(data,fail=false){
 const env={...process.env,TEST_POSTS:JSON.stringify(data),TEST_FAIL:fail?'1':'',
 TEST_ALBA_POSTS:JSON.stringify([{id:'job-1',title:'기존 관리자 구인 공고',content:'모집 내용을 유지하는 테스트',created_at:'2026-10-20T00:00:00Z',published_at:'2026-10-20T00:01:00Z',updated_at:'2026-10-20T00:01:00Z'}]),
 TEST_ALBA_COMMENTS:JSON.stringify([{post_id:'job-1',guest_name:'테스트 댓글',content:'문의 글 유지',created_at:'2026-10-20T00:02:00Z'}])};
 const res=spawnSync('node',['--import',path.join(temp,'mock-fetch.mjs'),'scripts/build-site.mjs'],{cwd:temp,env,encoding:'utf8'});
 if(fail)assert.notEqual(res.status,0,'Supabase 오류 시 빌드 실패해야 함');
 else assert.equal(res.status,0,`빌드 실패: ${res.stdout}\n${res.stderr}`);
 return res;
}
try{
 for(const rel of ['scripts/build-site.mjs','explore/post/index.html','explore/archive/index.html','data/public-venues.json','js/inline-media.js','bubble-alba/index.html','sitemap.xml']){
  const target=path.join(temp,rel);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,rel),target);
 }
 await writeFile(path.join(temp,'mock-fetch.mjs'),`globalThis.fetch=async(url)=>{
   if(process.env.TEST_FAIL==='1')return {ok:false,status:503};
   url=String(url||'');
   if(url.includes('albam09_bubble_alba_posts'))return {ok:true,json:async()=>JSON.parse(process.env.TEST_ALBA_POSTS||'[]')};
   if(url.includes('albam09_bubble_alba_comments'))return {ok:true,json:async()=>JSON.parse(process.env.TEST_ALBA_COMMENTS||'[]')};
   return {ok:true,json:async()=>JSON.parse(process.env.TEST_POSTS||'[]')};
 };`);
 run([post]);
 const bubbleHtml=await readFile(path.join(temp,'bubble-alba/index.html'),'utf8');
 assert.match(bubbleHtml,/기존 관리자 구인 공고/);
 assert.match(bubbleHtml,/모집 내용을 유지하는 테스트/);
 assert.match(bubbleHtml,/문의 글 유지/);
 const html=await readFile(path.join(temp,'explore/post',slug,'index.html'),'utf8');
 const map=await readFile(path.join(temp,'sitemap.xml'),'utf8');
 assert.match(html,/<h1>상무지구 탐험기 자동 색인 테스트<\/h1>/);
 assert.match(html,new RegExp(`<link rel="canonical" href="https://albam09.com/explore/post/${slug}/">`));
 assert.match(html,/<meta name="robots" content="index, follow, max-image-preview:large">/);
 assert.doesNotMatch(html,/itemscope itemtype="https:\/\/schema.org\/DiscussionForumPosting"/, '중복 Microdata 노드는 없어야 함');
 const scripts=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
 const forum=scripts.filter(o=>o['@type']==='DiscussionForumPosting');
 assert.equal(forum.length,1,'DiscussionForumPosting은 정확히 한 개여야 함');
 assert.equal(forum[0].author.name,'실제 테스트 작성자');
 assert.equal(forum[0].datePublished,'2026-10-20T00:10:00Z');
 assert.equal(forum[0].url,`https://albam09.com/explore/post/${slug}/`);
 assert.equal(forum[0].text,post.content);

 assert.match(html,/name="albam09-generated" content="explore-post"/);
 assert.match(map,new RegExp(slug));
 assert.match(await readFile(path.join(temp,'explore/archive/index.html'),'utf8'),new RegExp(slug));
 const prevMap=map;
 run([],true);
 assert.equal(await readFile(path.join(temp,'sitemap.xml'),'utf8'),prevMap,'실패시 기존 sitemap 변경 금지');
 run([]);
 assert.doesNotMatch(await readFile(path.join(temp,'sitemap.xml'),'utf8'),new RegExp(slug));
 try{await stat(path.join(temp,'explore/post',slug,'index.html'));assert.fail('숨김 글의 HTML이 남음')}catch(e){if(e.code!=='ENOENT')throw e;}
 console.log('PASS: published => 정적 HTML/canonical/index/sitemap/archive; fetch error => 빌드 실패 & 기존 sitemap 보존; hidden => 정적 HTML/sitemap 제거');
}finally{await rm(temp,{recursive:true,force:true});}
