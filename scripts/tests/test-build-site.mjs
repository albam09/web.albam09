import {mkdtemp, mkdir, cp, copyFile, writeFile, readFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const source=path.resolve(import.meta.dirname,'../..');
const temp=await mkdtemp(path.join(tmpdir(),'albam09-explore-test-'));
const slug='karaoke1-20261020010101-abcd1234';
const post={slug,board:'karaoke1',title:'상무지구 탐험기 자동 색인 테스트',summary:'실제 탐험기 요약',content:'탐험기 내용 본문입니다.',venue_name:'',location_text:'상무지구',images:[],created_at:'2026-10-20T00:00:00Z',published_at:'2026-10-20T00:10:00Z',updated_at:'2026-10-20T00:10:00Z'};
function run(data,fail=false){
 const env={...process.env,TEST_POSTS:JSON.stringify(data),TEST_FAIL:fail?'1':''};
 const res=spawnSync('node',['--import',path.join(temp,'mock-fetch.mjs'),'scripts/build-site.mjs'],{cwd:temp,env,encoding:'utf8'});
 if(fail)assert.notEqual(res.status,0,'Supabase 오류 시 빌드 실패해야 함');
 else assert.equal(res.status,0,`빌드 실패: ${res.stdout}\n${res.stderr}`);
 return res;
}
try{
 for(const rel of ['scripts/build-site.mjs','explore/post/index.html','explore/archive/index.html','data/public-venues.json','sitemap.xml']){
  const target=path.join(temp,rel);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,rel),target);
 }
 await writeFile(path.join(temp,'mock-fetch.mjs'),`globalThis.fetch=async()=>{
   if(process.env.TEST_FAIL==='1')return {ok:false,status:503};
   return {ok:true,json:async()=>JSON.parse(process.env.TEST_POSTS||'[]')};
 };`);
 run([post]);
 const html=await readFile(path.join(temp,'explore/post',slug,'index.html'),'utf8');
 const map=await readFile(path.join(temp,'sitemap.xml'),'utf8');
 assert.match(html,/<h1 itemprop="headline">상무지구 탐험기 자동 색인 테스트<\/h1>/);
 assert.match(html,new RegExp(`<link rel="canonical" href="https://albam09.com/explore/post/${slug}/">`));
 assert.match(html,/<meta name="robots" content="index, follow, max-image-preview:large">/);
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
