import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const bubbleInlineMedia=createRequire(import.meta.url)('../js/inline-media.js');
const forum=createRequire(import.meta.url)('../js/forum-schema.js');

const root=process.cwd();
const SUPABASE_URL=process.env.ALBAM09_SUPABASE_URL || 'https://ldyysvafgegsgmvpslui.supabase.co';
const SUPABASE_KEY=process.env.ALBAM09_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qFOVO12BzMv6U2LjgLhR4Q_IKVfM06x';
const API_BASE=`${SUPABASE_URL}/rest/v1/albam09_explorer_posts?select=id,author_id,slug,board,title,summary,content,venue_name,location_text,images,published_at,updated_at,created_at,profiles!albam09_explorer_posts_author_fkey(nickname)&status=eq.published&is_deleted=eq.false&order=published_at.desc`;
const ALBA_POSTS_API=`${SUPABASE_URL}/rest/v1/albam09_bubble_alba_posts?select=id,title,summary,content,created_at,published_at,updated_at&status=eq.published&is_deleted=eq.false&order=published_at.desc&limit=100`;
const ALBA_COMMENTS_API=`${SUPABASE_URL}/rest/v1/albam09_bubble_alba_comments?select=post_id,guest_name,content,created_at&status=eq.published&order=created_at.asc&limit=1000`;
const PAGE_SIZE=1000;
async function fetchPublicJson(url){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(url,{headers:{apikey:SUPABASE_KEY},signal:AbortSignal.timeout(15000)});
   if(response.ok){const data=await response.json();if(!Array.isArray(data))throw new Error('Supabase payload not an array');return data;}
   last=new Error('Supabase HTTP '+response.status);
   if(response.status!==429 && response.status<500)throw last;
  }catch(e){last=e;if(attempt===2)throw e;}
  if(attempt<2)await new Promise(resolve=>setTimeout(resolve,300*(attempt+1)));
 }
 throw last;
}

const labels={karaoke1:'상무지구',karaoke2:'광천동·서구권',karaoke3:'신안동',karaoke4:'용봉동',karaoke5:'첨단지구',karaoke6:'목포',karaoke7:'광주 동구',karaoke8:'광주 남구'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xml=s=>esc(s);
const dateOnly=v=>{try{return new Date(v).toISOString().slice(0,10)}catch{return new Date().toISOString().slice(0,10)}};
const safeSlug=s=>/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(String(s||''))?String(s):'';
const publicVenues=JSON.parse(await fs.readFile(path.join(root,'data/public-venues.json'),'utf8'));
const regionForBoard={karaoke1:'서구1',karaoke2:'서구2',karaoke3:'북구2',karaoke4:'북구1',karaoke5:'광산구',karaoke6:'목포',karaoke7:'동구',karaoke8:'남구'};
function venueLink(name,board){
 const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase('ko-KR');
 if(!Object.hasOwn(regionForBoard,board))return null;
 const hits=publicVenues.filter(v=>norm(v.name)===norm(name));
 if(hits.length!==1||!/^[a-z0-9_-]+$/i.test(hits[0].slug||''))return null;
 const targetBoard=Object.hasOwn(regionForBoard,hits[0].board)?hits[0].board:board;
 return `/map/${encodeURIComponent(targetBoard)}/?venue=${encodeURIComponent(hits[0].slug)}`;
}

function articleHtml(d,person){
  const label=labels[d.board]||'지역';
  const author=forum.name(d);
  const when=forum.published(d)||'';
  const byline=person.url?`<a class="explorer-author-link" rel="author" href="${esc(person.url.replace(forum.origin,''))}">${esc(author)}</a>`:esc(author);
  const imgs=Array.isArray(d.images)?d.images:[];
  const gallery=imgs.length?`<div class="explorer-gallery">${imgs.map((im,i)=>`<figure><img src="${esc(im.url||'')}" alt="${esc(im.alt||`${d.title} 탐험기 사진 ${i+1}`)}" loading="${i?'lazy':'eager'}" decoding="async"${i?'':' fetchpriority="high"'}><figcaption>${esc(im.caption||im.alt||`${d.title} 현장 이미지`)}</figcaption></figure>`).join('')}</div>`:'';
  const venue=d.venue_name?(venueLink(d.venue_name,d.board)?`<a class="explorer-post-venue explorer-post-venue--link" href="${esc(venueLink(d.venue_name,d.board))}" aria-label="${esc(d.venue_name)} 지도에서 위치 보기"><span class="explorer-post-venue__label">업소</span><strong>${esc(d.venue_name)}</strong><span class="explorer-post-venue__hint" aria-hidden="true">지도 보기 ↗</span></a>`:`<div class="explorer-post-venue"><span class="explorer-post-venue__label">업소</span><strong>${esc(d.venue_name)}</strong></div>`):'';
  const summary=d.summary?`<div class="explorer-post-summary">${esc(d.summary)}</div>`:'';
  return `<article class="explorer-post" data-explorer-id="${esc(d.id)}" data-explorer-board="${esc(d.board)}"><div><span class="explorer-status published">공개</span> <span class="explorer-eyebrow">${esc(label)} 탐험기</span></div><h1>${esc(d.title)}</h1>${venue}<div class="explorer-meta">${byline} · <time datetime="${esc(when)}">${esc(when?new Date(when).toLocaleDateString('ko-KR'):'')}</time>${d.location_text?' · '+esc(d.location_text):''}</div>${summary}${gallery}<div class="explorer-post-content">${esc(d.content||'')}</div></article><section class="explorer-panel explorer-comments"><h2>댓글</h2><div id="explorerComments"><div class="explorer-empty">댓글은 페이지 실행 후 표시됩니다.</div></div></section>`;
}

async function withMeta(template,d){
  const label=labels[d.board]||'지역';
  const url=`https://albam09.com/explore/post/${d.slug}/`;
  const desc=(d.summary||d.content||'').trim().slice(0,155);
  let s=template;
  s=s.replace(/<title>.*?<\/title>/i,`<title>${esc(d.title)} | ${esc(label)} 탐험기 | 광주버블여지도</title>`);
  s=s.replace(/<meta name="description" content="[^"]*">/i,`<meta name="description" content="${esc(desc)}">`);
  s=s.replace(/<meta name="robots" content="[^"]*">/i,'<meta name="robots" content="index, follow, max-image-preview:large">');
  s=s.replace(/<meta property="og:title" content="[^"]*">/i,`<meta property="og:title" content="${esc(d.title)}">`);
  s=s.replace(/<meta property="og:description" content="[^"]*">/i,`<meta property="og:description" content="${esc(desc)}">`);
  s=s.replace(/<meta property="og:type" content="[^"]*">/i,'<meta property="og:type" content="article">');
  if(!/rel="canonical"/i.test(s)) s=s.replace('</head>',`<link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary_large_image"></head>`);
  const first=Array.isArray(d.images)&&d.images[0]?.url?d.images[0].url:'';
  if(first) s=s.replace('</head>',`<meta property="og:image" content="${esc(first)}"><meta name="twitter:image" content="${esc(first)}"></head>`);
  const schema=await forum.post(d);
  const errors=forum.issues(schema);
  if(errors.length)throw new Error(`탐험기 구조화 데이터 오류 (${d.slug}): ${errors.join(', ')}`);
  // One authoritative node, even when an older template is supplied.
  s=s.replace(/<script\b[^>]*id=["']explorer-post-ld["'][^>]*>[\s\S]*?<\/script>/gi,'');
  s=s.replace('</head>',`<script id="explorer-post-ld" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>`);
  s=s.replace('<div id="explorerPost"><div class="explorer-empty">탐험기를 불러오는 중입니다.</div></div>',`<div id="explorerPost" data-prerendered="true">${articleHtml(d,schema.author)}</div>`);
  s=s.replace('</head>','<meta name="albam09-generated" content="explore-post"></head>');
  return s;
}

function sitemapBlock(posts){
  return posts.map(d=>{
    const first=Array.isArray(d.images)&&d.images[0]?.url?d.images[0].url:'';
    const image=first?`\n    <image:image><image:loc>${xml(first)}</image:loc></image:image>`:'';
    return `  <url>\n    <loc>https://albam09.com/explore/post/${xml(d.slug)}/</loc>\n    <lastmod>${dateOnly(d.updated_at||d.published_at||d.created_at)}</lastmod>${image}\n  </url>`;
  }).join('\n');
}

function archiveBlock(posts){
  if(!posts.length)return '<div class="explorer-empty">아직 공개된 탐험기가 없습니다.</div>';
  return posts.map(d=>`<a class="explorer-card" href="/explore/post/${esc(d.slug)}/"><div class="explorer-card-body"><span class="tag explorer-venue-badge">${esc(d.venue_name||labels[d.board]||'지역 탐험기')}</span><h2>${esc(d.title)}</h2><p>${esc(d.summary||String(d.content||'').slice(0,150))}</p><div class="explorer-meta">${esc(labels[d.board]||'지역')} · ${esc(dateOnly(d.published_at||d.created_at))}</div></div></a>`).join('');
}

async function main(){
  let posts=[];
  try{
    for(let offset=0;;offset+=PAGE_SIZE){
      const batch=await fetchPublicJson(`${API_BASE}&limit=${PAGE_SIZE}&offset=${offset}`);
      if(!Array.isArray(batch))throw new Error('Invalid Supabase response');
      for(const item of batch){
        if(!item || !safeSlug(item.slug) || item.slug!==safeSlug(item.slug) || !labels[item.board] || !item.title || !forum.published(item)){
          throw new Error('Supabase 공개 탐험기에 유효하지 않은 slug/board/title/datePublished가 있습니다.');
        }
      }
      posts.push(...batch);
      if(batch.length<PAGE_SIZE)break;
    }
  }catch(e){
    console.error('[build-site] 공개 탐험기 조회 실패 — 누락된 HTML 배포를 방지하기 위해 빌드를 중단합니다:',e.message);
    throw e;
  }

  const seen=new Set();
  for(const d of posts){
    if(seen.has(d.slug))throw new Error(`중복 탐험기 slug: ${d.slug}`);
    seen.add(d.slug);
  }

  // Previously generated static HTML for a hidden/deleted post must not survive
  // a subsequent build. Only remove folders marked as generated by this builder.
  const postRoot=path.join(root,'explore/post');
  for(const ent of await fs.readdir(postRoot,{withFileTypes:true})){
    if(!ent.isDirectory() || seen.has(ent.name) || safeSlug(ent.name)!==ent.name)continue;
    const target=path.join(postRoot,ent.name,'index.html');
    const html=await fs.readFile(target,'utf8').catch(()=>null);
    if(html && (html.includes('name="albam09-generated" content="explore-post"') || html.includes('id="explorerPost" data-prerendered="true"'))){
      await fs.rm(path.join(postRoot,ent.name),{recursive:true,force:true});
      console.log(`[build-site] 비공개/삭제 탐험기 정적 파일 제거: ${ent.name}`);
    }
  }

  const templatePath=path.join(root,'explore/post/index.html');
  const template=await fs.readFile(templatePath,'utf8');
  for(const d of posts){
    const slug=safeSlug(d.slug);
    if(!slug||slug!==d.slug)continue;
    const dir=path.join(root,'explore/post',slug);
    await fs.mkdir(dir,{recursive:true});
    // Root-absolute asset paths also work when Netlify serves this HTML
    // via a 200 rewrite for /explore/post/<slug>/.
    const generated=await withMeta(template,d);
    await fs.writeFile(path.join(dir,'index.html'),generated,'utf8');
  }
  await buildAuthors(posts);

  const sitemapPath=path.join(root,'sitemap.xml');
  let map=await fs.readFile(sitemapPath,'utf8');
  const postUrls=`\n  <!-- EXPLORE_POSTS_START -->\n${sitemapBlock(posts)}\n  <!-- EXPLORE_POSTS_END -->`;
  const postMarker=/\s*<!-- EXPLORE_POSTS_START -->[\s\S]*?<!-- EXPLORE_POSTS_END -->/m;
  if(postMarker.test(map))map=map.replace(postMarker,postUrls);
  else if(map.includes('</urlset>'))map=map.replace('</urlset>',postUrls+'\n</urlset>');
  else throw new Error('Cannot update sitemap.xml: closing urlset tag missing');
  await fs.writeFile(sitemapPath,map,'utf8');

  const archivePath=path.join(root,'explore/archive/index.html');
  let archive=await fs.readFile(archivePath,'utf8');
  const archiveMarker=/<!-- EXPLORER_ARCHIVE_STATIC_START -->[\s\S]*?<!-- EXPLORER_ARCHIVE_STATIC_END -->/m;
  if(!archiveMarker.test(archive))throw new Error('explore/archive/index.html 정적 영역 마커를 찾을 수 없습니다.');
  archive=archive.replace(archiveMarker,`<!-- EXPLORER_ARCHIVE_STATIC_START -->${archiveBlock(posts)}<!-- EXPLORER_ARCHIVE_STATIC_END -->`);
  await fs.writeFile(archivePath,archive,'utf8');

  console.log(`[build-site] 공개 탐험기 ${posts.length}개: 정적 상세페이지 + sitemap + archive 생성 완료`);
}

async function buildAuthors(posts){
 const template=await fs.readFile(path.join(root,'explore/author/index.html'),'utf8');
 const groups=new Map();
 for(const d of posts){
  const key=await forum.authorKey(d.author_id);if(!key)continue;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(d);
 }
 const authorRoot=path.join(root,'explore/author');
 for(const ent of await fs.readdir(authorRoot,{withFileTypes:true})){
  if(!ent.isDirectory()||groups.has(ent.name)||!/^member-[a-f0-9]{24}$/.test(ent.name))continue;
  const p=path.join(authorRoot,ent.name,'index.html'),old=await fs.readFile(p,'utf8').catch(()=>null);
  if(old?.includes('name="albam09-generated" content="explore-author"'))await fs.rm(path.dirname(p),{recursive:true,force:true});
 }
 for(const [key,items] of groups){
  const person=await forum.author(items[0]),url=person.url;
  let html=template.replace(/<title>.*?<\/title>/i,`<title>${esc(person.name)} 공개 탐험기 | 광주버블여지도</title>`);
  html=html.replace(/<meta name="robots" content="[^"]*">/i,'<meta name="robots" content="index, follow">');
  html=html.replace(/<meta name="description" content="[^"]*">/i,`<meta name="description" content="${esc(person.name)} 회원이 공개한 지역 탐험기를 확인하세요.">`);
  const markup=`<section class="explorer-panel"><span class="explorer-eyebrow">탐험기 작성자</span><h1>${esc(person.name)}</h1><p>공개 탐험기 ${items.length}개</p></section><div class="explorer-grid explorer-author-posts">${archiveBlock(items)}</div>`;
  html=html.replace('<div id="explorerAuthor"><div class="explorer-empty">공개 프로필을 불러오는 중입니다.</div></div>',`<div id="explorerAuthor" data-prerendered="true" data-author-key="${key}">${markup}</div>`);
  const schema={'@context':'https://schema.org','@type':'ProfilePage',url,mainEntity:person};
  html=html.replace('</head>',`<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}"><script id="explorer-author-ld" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><meta name="albam09-generated" content="explore-author"></head>`);
  await fs.mkdir(path.join(authorRoot,key),{recursive:true});
  await fs.writeFile(path.join(authorRoot,key,'index.html'),html);
 }
 console.log(`[build-site] 공개 작성자 프로필 ${groups.size}개 생성 완료`);
}


// Restored 2026-10-21 bubble-alba feature. Independent of explore-post output.
async function buildBubbleAlba(){
  const page=path.join(root,'bubble-alba/index.html');
  const rx=/<!-- ALBA_STATIC_START -->[\s\S]*?<!-- ALBA_STATIC_END -->/;
  let html=await fs.readFile(page,'utf8');
  if(!rx.test(html))throw new Error('bubble-alba static markers missing');
  const get=async(url)=>fetchPublicJson(url);
  const [posts,comments]=await Promise.all([get(ALBA_POSTS_API),get(ALBA_COMMENTS_API)]);
  const markup=posts.map(p=>{
    if(!p.id || !p.title || !p.content || !Number.isFinite(Date.parse(p.published_at||p.created_at)))throw new Error('bubble-alba incomplete published post');
    const when=dateOnly(p.published_at||p.created_at);
    const replies=comments.filter(c=>c.post_id===p.id).slice(0,30);
    const cHtml=replies.map(c=>`<div class="balba-comment"><strong>${esc(c.guest_name)}</strong><p>${bubbleInlineMedia.render(c.content)}</p></div>`).join('');
    return `<article class="balba-item" data-post-id="${esc(p.id)}"><span class="balba-badge">운영자 안내</span><time class="balba-itemtime" datetime="${when}">${when}</time><h3>${esc(p.title)}</h3>${p.summary?`<p class="balba-itemsummary">${esc(p.summary)}</p>`:''}<div class="balba-itembody">${bubbleInlineMedia.render(p.content)}</div>${cHtml?`<div class="balba-static-comments"><h4>공개 댓글</h4>${cHtml}</div>`:''}<p class="balba-help">최신 댓글 및 공고는 페이지 실행 후 갱신됩니다.</p></article>`;
  }).join('')||'<div class="balba-empty">현재 공개된 모집 안내가 없습니다. 공고가 등록되면 이곳에서 확인할 수 있습니다.</div>';
  html=html.replace(rx,'<!-- ALBA_STATIC_START -->'+markup+'<!-- ALBA_STATIC_END -->');
  await fs.writeFile(page,html,'utf8');
  if(posts.length){
    const sitemap=path.join(root,'sitemap.xml');let map=await fs.readFile(sitemap,'utf8');
    const dates=posts.map(p=>Date.parse(p.updated_at||p.published_at||p.created_at)).filter(Number.isFinite);
    const last=dates.length?new Date(Math.max(...dates)).toISOString().slice(0,10):null;
    if(last)map=map.replace(/(<loc>https:\/\/albam09\.com\/bubble-alba\/<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/,'$1'+last+'$2');
    await fs.writeFile(sitemap,map,'utf8');
  }
  console.log('[build-site] bubble-alba '+posts.length+' published notices, '+comments.length+' comments');
}

await main();
try { await buildBubbleAlba(); }
catch(e) {
  if(process.env.ALBAM09_BUBBLE_ALBA_STRICT==='1' || process.env.NETLIFY==='true')throw e;
  // Avoid failing an otherwise valid main-site deployment if the bubble tables were not yet installed.
  console.warn('[build-site] bubble-alba static hydration skipped; client-side data retrieval remains available:',e.message);
}

