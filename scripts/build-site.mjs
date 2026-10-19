import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const SUPABASE_URL=process.env.ALBAM09_SUPABASE_URL || 'https://ldyysvafgegsgmvpslui.supabase.co';
const SUPABASE_KEY=process.env.ALBAM09_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qFOVO12BzMv6U2LjgLhR4Q_IKVfM06x';
const API_BASE=`${SUPABASE_URL}/rest/v1/albam09_explorer_posts?select=slug,board,title,summary,content,venue_name,location_text,images,published_at,updated_at,created_at&status=eq.published&is_deleted=eq.false&order=published_at.desc`;
const PAGE_SIZE=1000;
const labels={karaoke1:'상무지구',karaoke2:'상무·광천동',karaoke3:'신안동',karaoke4:'용봉동',karaoke5:'첨단지구',karaoke6:'목포',karaoke7:'광주 동구',karaoke8:'광주 남구'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xml=s=>esc(s);
const dateOnly=v=>{try{return new Date(v).toISOString().slice(0,10)}catch{return new Date().toISOString().slice(0,10)}};
const safeSlug=s=>/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(String(s||''))?String(s):'';
const publicVenues=JSON.parse(await fs.readFile(path.join(root,'data/public-venues.json'),'utf8'));
function venueLink(name){
 const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase('ko-KR');
 const hits=publicVenues.filter(v=>norm(v.name)===norm(name));
 if(hits.length!==1||!/^[a-z0-9-]+$/i.test(hits[0].slug||''))return null;
 return `https://ilovebam11.com/place/${encodeURIComponent(hits[0].slug)}/`;
}


function articleHtml(d){
  const label=labels[d.board]||'지역';
  const author=d.profiles?.nickname||'광주버블여지도 회원';
  const when=d.published_at||d.created_at||'';
  const imgs=Array.isArray(d.images)?d.images:[];
  const gallery=imgs.length?`<div class="explorer-gallery">${imgs.map((im,i)=>`<figure><img src="${esc(im.url||'')}" alt="${esc(im.alt||`${d.title} 탐험기 사진 ${i+1}`)}" loading="${i?'lazy':'eager'}" decoding="async"${i?'':' fetchpriority="high"'}><figcaption>${esc(im.caption||im.alt||`${d.title} 현장 이미지`)}</figcaption></figure>`).join('')}</div>`:'';
  const venue=d.venue_name?(venueLink(d.venue_name)?`<a class="explorer-post-venue explorer-post-venue--link" href="${esc(venueLink(d.venue_name))}" aria-label="${esc(d.venue_name)} 업소 상세페이지 바로가기"><span class="explorer-post-venue__label">업소</span><strong>${esc(d.venue_name)}</strong><span class="explorer-post-venue__hint" aria-hidden="true">상세보기 ↗</span></a>`:`<div class="explorer-post-venue"><span class="explorer-post-venue__label">업소</span><strong>${esc(d.venue_name)}</strong></div>`):'';
  const summary=d.summary?`<div class="explorer-post-summary">${esc(d.summary)}</div>`:'';
  return `<article class="explorer-post" itemscope itemtype="https://schema.org/DiscussionForumPosting"><div><span class="explorer-status published">공개</span> <span class="explorer-eyebrow">${esc(label)} 탐험기</span></div><h1 itemprop="headline">${esc(d.title)}</h1>${venue}<div class="explorer-meta">${esc(author)} · ${esc(when?new Date(when).toLocaleDateString('ko-KR'):'')}${d.location_text?' · '+esc(d.location_text):''}</div>${summary}${gallery}<div class="explorer-post-content" itemprop="text">${esc(d.content||'')}</div></article><section class="explorer-panel explorer-comments"><h2>댓글</h2><div id="explorerComments"><div class="explorer-empty">댓글은 페이지 실행 후 표시됩니다.</div></div></section>`;
}

function withMeta(template,d){
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
  const schema={'@context':'https://schema.org','@type':'DiscussionForumPosting',mainEntityOfPage:url,url,headline:d.title,text:d.content||'',datePublished:d.published_at||d.created_at,dateModified:d.updated_at||d.published_at||d.created_at,author:{'@type':'Person',name:d.profiles?.nickname||'광주버블여지도 회원'}};
  if(first)schema.image=(d.images||[]).map(x=>x.url).filter(Boolean);
  s=s.replace('</head>',`<script id="explorer-post-ld" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>`);
  s=s.replace('<div id="explorerPost"><div class="explorer-empty">탐험기를 불러오는 중입니다.</div></div>',`<div id="explorerPost" data-prerendered="true">${articleHtml(d)}</div>`);
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
      const r=await fetch(`${API_BASE}&limit=${PAGE_SIZE}&offset=${offset}`,{headers:{apikey:SUPABASE_KEY},signal:AbortSignal.timeout(15000)});
      if(!r.ok)throw new Error(`Supabase ${r.status}`);
      const batch=await r.json();
      if(!Array.isArray(batch))throw new Error('Invalid Supabase response');
      for(const item of batch){
        if(!item || !safeSlug(item.slug) || item.slug!==safeSlug(item.slug) || !labels[item.board] || !item.title){
          throw new Error('Supabase 공개 탐험기에 유효하지 않은 slug/board/title이 있습니다.');
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
    await fs.writeFile(path.join(dir,'index.html'),withMeta(template,d),'utf8');
  }

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

await main();
