import {mkdtemp, mkdir, cp, copyFile, writeFile, readFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const source=path.resolve(import.meta.dirname,'../..');
const temp=await mkdtemp(path.join(tmpdir(),'albam09-explore-test-'));
const slug='karaoke1-20261020010101-abcd1234';
const authorId='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const commenterId='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const commentId='cccccccc-cccc-4ccc-cccc-cccccccccccc';
const post={id:'dddddddd-dddd-4ddd-dddd-dddddddddddd',author_id:authorId,slug,board:'karaoke1',title:'상무지구 탐험기 자동 색인 테스트',summary:'실제 탐험기 요약',content:'탐험기 내용 본문입니다.',venue_name:'',location_text:'상무지구',images:[],created_at:'2026-10-20T00:00:00Z',published_at:'2026-10-20T00:10:00Z',updated_at:'2026-10-20T00:10:00Z',profiles:{nickname:'실제 테스트 작성자'}};
const comment={id:commentId,post_id:post.id,author_id:commenterId,content:'실제 공개 댓글입니다.',status:'published',created_at:'2026-10-20T02:00:00Z',profiles:{nickname:'댓글 작성자'}};
function run(data,fail=false,comments=[comment]){
 const env={...process.env,TEST_POSTS:JSON.stringify(data),TEST_COMMENTS:JSON.stringify(comments),TEST_FAIL:fail?'1':''};
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
   let rows=String(url).includes('albam09_bubble_alba_')?[]:String(url).includes('albam09_explorer_comments')?JSON.parse(process.env.TEST_COMMENTS||'[]'):JSON.parse(process.env.TEST_POSTS||'[]');
   return {ok:true,json:async()=>rows};
 };`);
 run([post]);
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
 assert.equal(forum[0].datePublished,'2026-10-20T00:10:00.000Z');
 assert.equal(forum[0].url,`https://albam09.com/explore/post/${slug}/`);
 assert.equal(forum[0].text,post.content);
 assert.match(forum[0].author.url,/^https:\/\/albam09\.com\/explore\/member\/[a-f0-9]{32}\/$/);
 assert.equal(forum[0].comment.length,1);
 assert.equal(forum[0].comment[0].author.name,'댓글 작성자');
 assert.match(forum[0].comment[0].author.url,/^https:\/\/albam09\.com\/explore\/member\/[a-f0-9]{32}\/$/);
 assert.equal(forum[0].comment[0].url,`https://albam09.com/explore/post/${slug}/#comment-${commentId}`);
 assert.equal(forum[0].comment[0].datePublished,'2026-10-20T02:00:00.000Z');
 assert.match(html,/id="comment-cccccccc-cccc-4ccc-cccc-cccccccccccc"/,'댓글이 정적 HTML에도 표시돼야 함');
 assert.doesNotMatch(html,/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/,'원본 회원 UUID는 공개 HTML에 직접 나타나면 안 됨');
 const profileSlug=forum[0].author.url.match(/\/member\/([a-f0-9]{32})\/$/)[1];
 const authorHtml=await readFile(path.join(temp,'explore/member',profileSlug,'index.html'),'utf8');
 assert.match(authorHtml,/<h1>실제 테스트 작성자<\/h1>/);
 assert.match(authorHtml,/"@type":"ProfilePage"/);
 assert.match(authorHtml,new RegExp(slug));
 const commentProfileSlug=forum[0].comment[0].author.url.match(/\/member\/([a-f0-9]{32})\/$/)[1];
 const commentProfile=await readFile(path.join(temp,'explore/member',commentProfileSlug,'index.html'),'utf8');
 assert.match(commentProfile,/댓글 작성자/);
 assert.match(commentProfile,new RegExp(commentId));

 // Regression: a legacy duplicate forum JSON-LD must abort before deployment.
 const templatePath=path.join(temp,'explore/post/index.html');
 const cleanTemplate=await readFile(templatePath,'utf8');
 const legacySchema='<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'DiscussionForumPosting',headline:'outdated duplicate'})+'</script>';
 await writeFile(templatePath,cleanTemplate.replace('</head>',legacySchema+'</head>'));
 const duplicateAttempt=spawnSync('node',['--import',path.join(temp,'mock-fetch.mjs'),'scripts/build-site.mjs'],{
   cwd:temp,env:{...process.env,TEST_POSTS:JSON.stringify([post]),TEST_COMMENTS:JSON.stringify([comment]),TEST_FAIL:'0'},encoding:'utf8'
 });
 assert.notEqual(duplicateAttempt.status,0,'legacy duplicate forum schema must make the build fail');
 assert.match(duplicateAttempt.stderr,/Expected exactly one DiscussionForumPosting/);
 await writeFile(templatePath,cleanTemplate);
 assert.match(html,/name="albam09-generated" content="explore-post"/);
 assert.match(map,new RegExp(slug));
 assert.match(map,new RegExp(profileSlug));
 assert.match(map,new RegExp(commentProfileSlug));
 assert.match(await readFile(path.join(temp,'explore/archive/index.html'),'utf8'),new RegExp(slug));
 const prevMap=map;
 run([],true);
 assert.equal(await readFile(path.join(temp,'sitemap.xml'),'utf8'),prevMap,'실패시 기존 sitemap 변경 금지');
 run([]);
 assert.doesNotMatch(await readFile(path.join(temp,'sitemap.xml'),'utf8'),new RegExp(slug));
 assert.doesNotMatch(await readFile(path.join(temp,'sitemap.xml'),'utf8'),new RegExp(profileSlug));
 try{await stat(path.join(temp,'explore/post',slug,'index.html'));assert.fail('숨김 글의 HTML이 남음')}catch(e){if(e.code!=='ENOENT')throw e;}
 console.log('PASS: public post+comment => complete DiscussionForumPosting/Comment required+recommended URL fields; public profile URLs resolve, no member UUID leaks; sitemap/archive; duplicate schema blocks build; fetch error => fail; hidden => cleanup');
}finally{await rm(temp,{recursive:true,force:true});}
