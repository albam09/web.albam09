import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const inlineMedia=createRequire(import.meta.url)('../js/inline-media.js');

const root=process.cwd();
const SUPABASE_URL=process.env.ALBAM09_SUPABASE_URL || 'https://ldyysvafgegsgmvpslui.supabase.co';
const SUPABASE_KEY=process.env.ALBAM09_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qFOVO12BzMv6U2LjgLhR4Q_IKVfM06x';
const API_BASE=`${SUPABASE_URL}/rest/v1/albam09_explorer_posts?select=id,slug,board,title,summary,content,venue_name,location_text,images,author_id,published_at,updated_at,created_at,profiles!albam09_explorer_posts_author_fkey(nickname)&status=eq.published&is_deleted=eq.false&order=published_at.desc`;
const FORUM_COMMENTS_API=`${SUPABASE_URL}/rest/v1/albam09_explorer_comments?select=id,post_id,author_id,content,status,created_at,profiles!albam09_explorer_comments_author_fkey(nickname)&status=eq.published&is_deleted=eq.false&order=created_at.asc`;
const ALBA_POSTS_API=`${SUPABASE_URL}/rest/v1/albam09_bubble_alba_posts?select=id,title,summary,content,created_at,published_at,updated_at&status=eq.published&is_deleted=eq.false&order=published_at.desc&limit=100`;
const ALBA_COMMENTS_API=`${SUPABASE_URL}/rest/v1/albam09_bubble_alba_comments?select=post_id,guest_name,content,created_at&status=eq.published&order=created_at.asc&limit=1000`;
const PAGE_SIZE=1000;
const labels={karaoke1:'상무지구',karaoke2:'상무·광천동',karaoke3:'신안동',karaoke4:'용봉동',karaoke5:'첨단지구',karaoke6:'목포',karaoke7:'광주 동구',karaoke8:'광주 남구'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xml=s=>esc(s);
const dateOnly=v=>{try{return new Date(v).toISOString().slice(0,10)}catch{return new Date().toISOString().slice(0,10)}};
const safeSlug=s=>/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(String(s||''))?String(s):'';
const validUuid=s=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(s||''));
const isoDate=s=>{if(!s||!Number.isFinite(Date.parse(s)))throw new Error(`Missing valid date: ${s}`);return new Date(s).toISOString()};
const authorToken=id=>validUuid(id)?createHash('sha256').update('albam09-public-forum:'+id.toLowerCase()).digest('hex').slice(0,32):null;
const authorUrl=id=>{const token=authorToken(id);return token?`https://albam09.com/explore/member/${token}/`:null};
const publicName=profile=>String(profile?.nickname||'광주버블여지도 회원').trim()||'광주버블여지도 회원';
const safeJson=obj=>JSON.stringify(obj).replace(/</g,'\\u003c');

const publicVenues=JSON.parse(await fs.readFile(path.join(root,'data/public-venues.json'),'utf8'));
function venueLink(name){
 const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase('ko-KR');
 const hits=publicVenues.filter(v=>norm(v.name)===norm(name));
 if(hits.length!==1||!/^[a-z0-9-]+$/i.test(hits[0].slug||''))return null;
 return `https://ilovebam11.com/place/${encodeURIComponent(hits[0].slug)}/`;
}


function articleHtml(d,comments=[]){
  const label=labels[d.board]||'지역';
  const author=publicName(d.profiles);
  const authorHref=authorUrl(d.author_id);
  const when=d.published_at||d.created_at||'';
  const imgs=Array.isArray(d.images)?d.images:[];
  const gallery=imgs.length?`<div class="explorer-gallery">${imgs.map((im,i)=>`<figure><img src="${esc(im.url||'')}" alt="${esc(im.alt||`${d.title} 탐험기 사진 ${i+1}`)}" loading="${i?'lazy':'eager'}" decoding="async"${i?'':' fetchpriority="high"'}><figcaption>${esc(im.caption||im.alt||`${d.title} 현장 이미지`)}</figcaption></figure>`).join('')}</div>`:'';
  const venue=d.venue_name?(venueLink(d.venue_name)?`<a class="explorer-post-venue explorer-post-venue--link" href="${esc(venueLink(d.venue_name))}" aria-label="${esc(d.venue_name)} 업소 상세페이지 바로가기"><span class="explorer-post-venue__label">업소</span><strong>${esc(d.venue_name)}</strong><span class="explorer-post-venue__hint" aria-hidden="true">상세보기 ↗</span></a>`:`<div class="explorer-post-venue"><span class="explorer-post-venue__label">업소</span><strong>${esc(d.venue_name)}</strong></div>`):'';
  const summary=d.summary?`<div class="explorer-post-summary">${esc(d.summary)}</div>`:'';
  return `<article class="explorer-post" data-explorer-id="${esc(d.id)}" data-explorer-board="${esc(d.board)}"><div><span class="explorer-status published">공개</span> <span class="explorer-eyebrow">${esc(label)} 탐험기</span></div><h1>${esc(d.title)}</h1>${venue}<div class="explorer-meta">${authorHref?`<a href="${esc(authorHref)}" rel="author">${esc(author)}</a>`:esc(author)} · ${esc(when?new Date(when).toLocaleDateString('ko-KR'):'')}${d.location_text?' · '+esc(d.location_text):''}</div>${summary}${gallery}<div class="explorer-post-content">${inlineMedia.render(d.content||'')}</div></article><section class="explorer-panel explorer-comments"><h2>댓글</h2><div id="explorerComments">${comments.length?comments.map(c=>`<div class="explorer-comment" id="comment-${esc(c.id)}"><div class="explorer-comment__head"><strong>${authorUrl(c.author_id)?`<a href="${esc(authorUrl(c.author_id))}" rel="author">${esc(publicName(c.profiles))}</a>`:esc(publicName(c.profiles))}</strong><time datetime="${isoDate(c.created_at)}">${esc(dateOnly(c.created_at))}</time></div><p>${inlineMedia.render(c.content)}</p></div>`).join(''):'<div class="explorer-empty">아직 공개된 댓글이 없습니다.</div>'}</div></section>`;
}

// Prevent deploying a valid + invalid duplicate discussion item for the same post.
// A previous template/microdata can coexist with the JSON-LD injected below.
function assertSingleForumSchema(html,slug){
  const scripts=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const forum=[];
  for(const [,json] of scripts){
    let obj;
    try{obj=JSON.parse(json)}catch{throw new Error(`Invalid JSON-LD on ${slug}`)}
    const nodes=Array.isArray(obj?.['@graph'])?obj['@graph']:[obj];
    for(const node of nodes){
      const types=Array.isArray(node?.['@type'])?node['@type']:[node?.['@type']];
      if(types.includes('DiscussionForumPosting'))forum.push(node);
    }
  }
  if(/itemscope[^>]*itemtype=["']https?:\/\/schema\.org\/DiscussionForumPosting["']/i.test(html)||
     /itemtype=["']https?:\/\/schema\.org\/DiscussionForumPosting["'][^>]*itemscope/i.test(html)){
    throw new Error(`Duplicate DiscussionForumPosting microdata on ${slug}`);
  }
  if(forum.length!==1)throw new Error(`Expected exactly one DiscussionForumPosting on ${slug}, found ${forum.length}`);
  const post=forum[0];
  const canonical=`https://albam09.com/explore/post/${slug}/`;
  if(post.url!==canonical||post.mainEntityOfPage!==canonical||!post.author?.name||!Number.isFinite(Date.parse(post.datePublished)))
    throw new Error(`Missing required forum metadata on ${slug}`);
  if(!post.author.url||!/^https:\/\/albam09\.com\/explore\/member\/[a-f0-9]{32}\/$/.test(post.author.url))
    throw new Error(`Missing real public author profile URL on ${slug}`);
  for(const c of post.comment||[]){
    if(c['@type']!=='Comment'||!c.text||!c.author?.name||!c.author?.url||!Number.isFinite(Date.parse(c.datePublished))||!c.url?.startsWith(canonical+'#comment-'))
      throw new Error(`Invalid published comment schema on ${slug}`);
  }
}

function withMeta(template,d,comments=[]){
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
  const schema={'@context':'https://schema.org','@type':'DiscussionForumPosting',mainEntityOfPage:url,url,headline:d.title,text:d.content||'',datePublished:isoDate(d.published_at||d.created_at),dateModified:isoDate(d.updated_at||d.published_at||d.created_at),author:{'@type':'Person',name:publicName(d.profiles),url:authorUrl(d.author_id)}};
  if(!schema.author.url)throw new Error(`Missing author_id for published post ${d.slug}`);
  if(comments.length){
    schema.comment=comments.map(c=>{
      const personUrl=authorUrl(c.author_id);
      if(!personUrl)throw new Error(`Missing author_id for published comment ${c.id}`);
      return {'@type':'Comment',url:url+'#comment-'+encodeURIComponent(c.id),text:c.content,datePublished:isoDate(c.created_at),author:{'@type':'Person',name:publicName(c.profiles),url:personUrl}};
    });
    schema.commentCount=comments.length;
  }
  if(first)schema.image=(d.images||[]).map(x=>x.url).filter(Boolean);
  s=s.replace('</head>',`<script id="explorer-post-ld" type="application/ld+json">${safeJson(schema)}</script></head>`);
  s=s.replace('<div id="explorerPost"><div class="explorer-empty">탐험기를 불러오는 중입니다.</div></div>',`<div id="explorerPost" data-prerendered="true">${articleHtml(d,comments)}</div>`);
  s=s.replace('</head>','<meta name="albam09-generated" content="explore-post"></head>');
  return s;
}

// Public member pages contain ONLY an already-public nickname and published
// posts/comments. Never expose emails, user UUIDs, or private profiles fields.
function profileHtml(token,item){
 const name=publicName({nickname:item.name}),url=`https://albam09.com/explore/member/${token}/`;
 const links=[...item.posts.map(d=>({url:`https://albam09.com/explore/post/${d.slug}/`,label:d.title,kind:'탐험기'})),
  ...item.comments.map(c=>({url:`https://albam09.com/explore/post/${c.postSlug}/#comment-${c.id}`,label:c.content.slice(0,90),kind:'공개 댓글'}))];
 const schema={'@context':'https://schema.org','@type':'ProfilePage',url,mainEntity:{'@type':'Person','@id':url+'#author',name,url}};
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="description" content="${esc(name)} 회원이 공개한 탐험기와 댓글"><title>${esc(name)} 회원 공개 활동 | 광주버블여지도</title><link rel="canonical" href="${esc(url)}"><script type="application/ld+json">${safeJson(schema)}</script><style>body{margin:0;background:#f9f7fc;color:#252333;font-family:system-ui,Arial,sans-serif;line-height:1.65}a{color:#6a34af}.wrap{max-width:850px;margin:auto;padding:32px 20px}.panel{background:white;border:1px solid #e7dff0;border-radius:22px;padding:28px;box-shadow:0 8px 30px #2b1b460a}.eyebrow{color:#7d58b2;font-size:12px;font-weight:800;letter-spacing:2px}.item{display:block;padding:15px 0;border-top:1px solid #eee;text-decoration:none}.item strong{display:block;color:#30243e}.item small{color:#816998}.nav{margin-bottom:24px;display:flex;gap:16px}h1{margin:8px 0 5px;font-size:clamp(24px,4vw,38px)}p{color:#756b7b}</style></head><body><div class="wrap"><nav class="nav"><a href="/">광주버블여지도</a><a href="/explore/">탐험기</a></nav><main class="panel"><div class="eyebrow">PUBLIC MEMBER PROFILE</div><h1>${esc(name)}</h1><p>회원이 공개한 탐험기와 댓글만 표시합니다. 비공개 회원정보는 공개되지 않습니다.</p><h2>공개 활동</h2>${links.map(l=>`<a class="item" href="${esc(l.url)}"><small>${l.kind}</small><strong>${esc(l.label)}</strong></a>`).join('')}</main></div></body></html>`;
}
function profileSitemap(profiles){return [...profiles.keys()].sort().map(token=>`  <url>\n    <loc>https://albam09.com/explore/member/${token}/</loc>\n  </url>`).join('\n')}
function buildProfiles(posts,comments){
 const index=new Map(),byPost=new Map(posts.map(p=>[p.id,p]));
 function add(id,name,post,comment){const token=authorToken(id);if(!token)throw new Error('Public forum author has no usable author_id');let p=index.get(token);if(!p){p={name,posts:[],comments:[]};index.set(token,p)}if(post)p.posts.push(post);if(comment)p.comments.push(comment)}
 for(const p of posts)add(p.author_id,publicName(p.profiles),p,null);
 for(const c of comments){const post=byPost.get(c.post_id);if(post)add(c.author_id,publicName(c.profiles),null,{...c,postSlug:post.slug});}
 return index;
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

// 버블알바 공고는 별도 URL 수백 개를 만들지 않고 /bubble-alba/ 한 페이지에 정적 삽입.
async function fetchAlba(url,label){
  const r=await fetch(url,{headers:{apikey:SUPABASE_KEY},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error(`${label}: Supabase ${r.status}`);
  const rows=await r.json();if(!Array.isArray(rows))throw new Error(`${label}: invalid API result`);
  return rows;
}
function renderAlbaStatic(posts,comments){
  if(!posts.length)return '<div class="balba-empty">현재 공개된 모집 안내가 없습니다. 공고가 등록되면 이곳에서 확인할 수 있습니다.</div>';
  return posts.map(p=>{
    if(!p.id||!p.title||!p.content||!Number.isFinite(Date.parse(p.published_at||p.created_at)))throw new Error('버블알바 공개 공고 데이터가 불완전합니다.');
    const replies=comments.filter(c=>c.post_id===p.id).slice(0,30);
    const commentList=replies.length?`<div class="balba-static-comments"><h4>공개 댓글</h4>${replies.map(c=>`<div class="balba-comment"><strong>${esc(c.guest_name)}</strong> <span class="balba-commenttime">${esc(dateOnly(c.created_at))}</span><p>${inlineMedia.render(c.content)}</p></div>`).join('')}</div>`:'';
    return `<article class="balba-item" data-post-id="${esc(p.id)}"><div class="balba-itemtop"><span class="balba-badge">운영자 안내</span><time class="balba-itemtime" datetime="${dateOnly(p.published_at||p.created_at)}">${dateOnly(p.published_at||p.created_at)}</time></div><h3>${esc(p.title)}</h3>${p.summary?`<p class="balba-itemsummary">${esc(p.summary)}</p>`:''}<div class="balba-itembody">${inlineMedia.render(p.content)}</div>${commentList}<p class="balba-help">댓글 작성과 최신 반영은 페이지 실행 후 가능합니다.</p></article>`;
  }).join('');
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
        if(!item || !safeSlug(item.slug) || item.slug!==safeSlug(item.slug) || !labels[item.board] || !item.title || !validUuid(item.author_id) || !Number.isFinite(Date.parse(item.published_at||item.created_at))){
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

  // Include only actually published public comments in the server HTML and schema.
  // Abort rather than publishing partial/incorrect comment markup if REST fails.
  let forumComments=[];
  try{
    for(let offset=0;;offset+=PAGE_SIZE){
      const r=await fetch(`${FORUM_COMMENTS_API}&limit=${PAGE_SIZE}&offset=${offset}`,{headers:{apikey:SUPABASE_KEY},signal:AbortSignal.timeout(15000)});
      if(!r.ok)throw new Error(`forum comments Supabase ${r.status}`);
      const batch=await r.json();if(!Array.isArray(batch))throw new Error('invalid comments REST response');
      forumComments.push(...batch);
      if(batch.length<PAGE_SIZE)break;
    }
  }catch(e){console.error('[build-site] 공개 댓글 조회 실패, 잘못된 마크업 배포 차단:',e.message);throw e}
  const postIDs=new Set(posts.map(d=>d.id));
  forumComments=forumComments.filter(c=>postIDs.has(c.post_id));
  for(const c of forumComments){if(!validUuid(c.author_id)||!c.id||!c.content||!Number.isFinite(Date.parse(c.created_at)))throw new Error(`공개 댓글 메타데이터 누락: ${c.id}`)}
  const commentsByPost=new Map();
  for(const c of forumComments){const a=commentsByPost.get(c.post_id)||[];a.push(c);commentsByPost.set(c.post_id,a)}
  const profiles=buildProfiles(posts,forumComments);
  // 반드시 모든 공개 데이터를 성공적으로 조회한 뒤에만 HTML/sitemap 쓰기 수행.
  // 가입자·08 프로필과 무관한 09 전용 테이블 두 개만 조회.
  let albaPosts=[],albaComments=[];
  try{
    [albaPosts,albaComments]=await Promise.all([
      fetchAlba(ALBA_POSTS_API,'버블알바 공고'),
      fetchAlba(ALBA_COMMENTS_API,'버블알바 댓글')
    ]);
  }catch(e){
    console.error('[build-site] 버블알바 조회 실패 — 잘못된 빈 페이지 배포를 방지하기 위해 빌드 중단:',e.message);
    throw e;
  }
  // 필수 필드가 누락되면 잘못된 Google 색인용 HTML을 생성하지 않습니다.
  for(const p of albaPosts){
    if(!p.id||!p.title||!p.content||!Number.isFinite(Date.parse(p.published_at||p.created_at)))
      throw new Error('버블알바 공개 공고 필수 데이터 누락');
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
    const generated=withMeta(template,d,commentsByPost.get(d.id)||[]);
    assertSingleForumSchema(generated,slug);
    await fs.writeFile(path.join(dir,'index.html'),generated,'utf8');
  }

  // Generate real public, permalinked author profiles for author.url.
  // Remove profiles with no remaining public contributions on the next build.
  const memberRoot=path.join(root,'explore/member');
  await fs.mkdir(memberRoot,{recursive:true});
  for(const ent of await fs.readdir(memberRoot,{withFileTypes:true})){
    if(!ent.isDirectory()||profiles.has(ent.name)||!/^[a-f0-9]{32}$/.test(ent.name))continue;
    const generated=await fs.readFile(path.join(memberRoot,ent.name,'index.html'),'utf8').catch(()=>null);
    if(generated?.includes('PUBLIC MEMBER PROFILE'))await fs.rm(path.join(memberRoot,ent.name),{recursive:true,force:true});
  }
  for(const [token,data] of profiles){
    const dir=path.join(memberRoot,token);await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(path.join(dir,'index.html'),profileHtml(token,data),'utf8');
  }
  const sitemapPath=path.join(root,'sitemap.xml');
  let map=await fs.readFile(sitemapPath,'utf8');
  const postUrls=`\n  <!-- EXPLORE_POSTS_START -->\n${sitemapBlock(posts)}\n${profileSitemap(profiles)}\n  <!-- EXPLORE_POSTS_END -->`;
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

  // 독립 URL 1개: 정적 안내와 실제 승인된 공고·댓글을 동일 HTML에 포함.
  const albaPath=path.join(root,'bubble-alba/index.html');
  let albaHtml=await fs.readFile(albaPath,'utf8');
  const albaMarker=/<!-- ALBA_STATIC_START -->[\s\S]*?<!-- ALBA_STATIC_END -->/;
  if(!albaMarker.test(albaHtml))throw new Error('버블알바 정적 삽입 마커가 없습니다.');
  albaHtml=albaHtml.replace(albaMarker,'<!-- ALBA_STATIC_START -->'+renderAlbaStatic(albaPosts,albaComments)+'<!-- ALBA_STATIC_END -->');
  await fs.writeFile(albaPath,albaHtml,'utf8');
  // 공개 공고가 갱신될 때에만 사이트맵 마지막 수정일 갱신.
  if(albaPosts.length){
    const dates=albaPosts.map(x=>Date.parse(x.updated_at||x.published_at||x.created_at)).filter(Number.isFinite);
    const updated=dateOnly(new Date(Math.max(...dates)).toISOString());
    const map2=await fs.readFile(sitemapPath,'utf8');
    const albaUrlRe=/(<loc>https:\/\/albam09\.com\/bubble-alba\/<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/;
    if(!albaUrlRe.test(map2))throw new Error('버블알바 sitemap URL이 없습니다.');
    await fs.writeFile(sitemapPath,map2.replace(albaUrlRe,'$1'+updated+'$2'),'utf8');
  }
  console.log(`[build-site] 버블알바 공개 공고 ${albaPosts.length}개 · 공개 댓글 ${albaComments.length}개: /bubble-alba/ 정적 렌더링 완료`);

  console.log(`[build-site] 공개 탐험기 ${posts.length}개 · 공개 댓글 ${forumComments.length}개 · 공개 작성자 프로필 ${profiles.size}개: 정적 상세페이지 + sitemap + archive 생성 완료`);
}

await main();
