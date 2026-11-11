import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const write=(f,t)=>fs.writeFileSync(path.join(root,f),t);
const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const decode=s=>String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const main={
index:['알밤주점','알밤 광주 노래방','알밤 광주 가라오케','광주노래방','광주가라오케','광주 노래주점','광주 노래홀','상무지구노래방','상무지구가라오케','광천동노래방','신안동노래방','용봉동노래방','첨단지구가라오케','목포 하당 노래방','광주역 노래홀','광주 업소 지도'],
karaoke1:['알밤주점','알밤 상무지구 노래방','알밤 상무지구 가라오케','상무지구노래방','상무지구가라오케','상무지구 노래주점','상무지구 노래홀','치평동 노래방','치평동 가라오케','상무역 부근 노래방','상무역 부근 가라오케','상무역 근처 노래홀','상무중앙로 노래방','상무연하로 가라오케','광주광역시청 근처 노래방','라마다호텔 부근 가라오케','상무지구 룸카페','상무지구 하이퍼블릭'],
karaoke2:['알밤주점','알밤 광천동 노래방','알밤 광천동 가라오케','광천동노래방','광천동가라오케','유스퀘어 노래방','유스퀘어 부근 가라오케','광주종합버스터미널 노래방','광주신세계 근처 노래방','금호월드 근처 가라오케','화정동 노래방','화정동 가라오케','광주 서구 노래홀','광천동 노래주점'],
karaoke3:['알밤주점','알밤 신안동 노래방','알밤 신안동 가라오케','신안동노래방','신안동가라오케','광주 신안동 노래방','광주역 노래방','광주역 부근 가라오케','광주역 노래홀','유동 노래방','유동 가라오케','중흥로 노래홀','경양로 노래방','무등로 노래홀','북구 신안동 노래주점'],
karaoke4:['알밤주점','알밤 용봉동 노래방','알밤 용봉동 가라오케','용봉동노래방','용봉동가라오케','전남대 후문 노래방','전남대 후문 가라오케','전남대학교 후문 노래홀','전대후문 노래방','저불로 노래홀','용봉동 노래주점','전철우사거리 노래방','광주비엔날레 근처 가라오케'],
karaoke5:['알밤주점','알밤 첨단지구 노래방','알밤 첨단지구 가라오케','첨단지구노래방','첨단지구가라오케','첨단 노래방','첨단중앙로 노래방','첨단중앙로 가라오케','쌍암동 노래방','쌍암동 가라오케','쌍암공원 근처 노래홀','첨단지구 노래홀','첨단지구 노래주점'],
karaoke6:['알밤주점','알밤 목포 노래방','알밤 목포 가라오케','목포노래방','목포가라오케','목포 하당 노래방','목포 하당 가라오케','목포 상동 노래홀','평화광장 부근 노래방','평화광장 가라오케','남악 가라오케','남악 가요주점','목포역 노래방','하당 노래주점'],
karaoke7:['알밤주점','알밤 광주 동구 노래방','알밤 광주 동구 가라오케','광주동구노래방','광주동구가라오케','충장로 노래방','충장로 가라오케','금남로 노래방','문화전당역 노래홀','동명동 노래방','광주 동구 노래주점','광주 동구 업소 안내'],
karaoke8:['알밤주점','알밤 광주 남구 노래방','알밤 광주 남구 가라오케','광주남구노래방','광주남구가라오케','봉선동 노래방','봉선동 가라오케','백운광장 노래방','백운광장 가라오케','진월동 노래방','진월동 가라오케','주월동 노래홀','광주 남구 노래주점','광주 남구 업소 안내']};
const venues=JSON.parse(read('data/venue-directory.json')).venues;
const bySlug=Object.fromEntries(venues.map(v=>[v.slug,v]));
const tax=JSON.parse(read('data/bbs-region-taxonomy.json'));
function walk(d=''){
 return fs.readdirSync(path.join(root,d),{withFileTypes:true}).flatMap(e=>{
  let name=path.posix.join(d,e.name);
  if(e.isDirectory())return !['dist','.git','node_modules','reports'].includes(e.name)?walk(name):[];
  return e.isFile() && name.endsWith('.html')?[name]:[];
 });
}
const attr=(s,a)=>s.match(new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'])[^>]*\\bcontent=["']([^"']*)["'][^>]*>`,'i'))?.[1]||'';
const titleOf=s=>decode(s.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'');
const metaOf=(s,key,type='name')=>{
 let re=new RegExp(`<meta\\b(?=[^>]*\\b${type}=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'])[^>]*>`,'gi');
 let m=s.match(re)?.[0]; return m?decode(m.match(/\bcontent=["']([^"']*)["']/i)?.[1]||''):'';
};
function put(s,key,value,type='name'){
 const re=new RegExp(`<meta\\b(?=[^>]*\\b${type}=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'])[^>]*>`,'gi');
 const tag=`<meta ${type}="${key}" content="${esc(value)}">`;
 return re.test(s)?s.replace(re,tag):s.replace('</head>',tag+'\n</head>');
}
function boardFor(f,s){
 if(f==='index.html')return 'index';
 const route=f.match(/(?:page|map|explore|bbs\/region)\/(karaoke[1-8])\//)?.[1];if(route)return route;
 const article=f.match(/^bbs\/(\d+)\//)?.[1];if(article){return tax.articles?.[article]?.region || null;}
 const v=f.match(/\bplace\/([^/]+)\//)?.[1];if(v&&bySlug[v])return bySlug[v].board;
 const canonical=s.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]||'';
 return canonical.match(/\/(?:page|map|explore|bbs\/region)\/(karaoke[1-8])\//)?.[1] || null;
}
function unique(a){return [...new Set(a.map(x=>String(x||'').trim()).filter(Boolean))];}
const rows=[];const seenCount=new Map();
for(const f of walk()){
 let s=read(f);
 if(!/<head[\s>]/i.test(s)||!/<title>/i.test(s))continue;
 if(/<meta\s+http-equiv=["']refresh["']/i.test(s)||/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(s))continue;
 const title=titleOf(s);if(!title)continue;
 const r=boardFor(f,s);
 // Base terms are scoped: unrelated regional keywords never bleed into other areas.
 const b=main[r||'index'];
 const titleTerms=unique(title.split(/[|｜:·,/]/).map(x=>x.trim()).filter(x=>x.length>2)).slice(0,3);
 const venue=Object.values(bySlug).find(v=>f.includes(`/place/${v.slug}/`));
 let keys=unique([...(b||[]),...titleTerms, ...(venue?[venue.name,venue.name+' 노래홀']:[])]);
 if(!r){keys=unique([titleTerms[0],titleTerms[1],'광주 노래방','광주 가라오케','알밤주점']).filter(Boolean);}
 const desc=metaOf(s,'description');
 const canonical=s.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]||'';
 const url=canonical.startsWith('https://albam09.com/')?canonical:'https://albam09.com/'+(f==='index.html'?'':f.replace(/index\.html$/,''));
 const image=metaOf(s,'og:image','property')||'https://albam09.com/img/og-image.jpg';
 s=put(s,'keywords',keys.join(', '));s=put(s,'ab09-content-revision','20261112-v18');
 // Normalize social previews only for actual indexable HTML; retain page descriptions and existing images.
 s=put(s,'og:title',title,'property');s=put(s,'og:description',desc,'property');s=put(s,'og:url',url,'property');s=put(s,'og:image',image,'property');
 s=put(s,'twitter:card','summary_large_image');s=put(s,'twitter:title',title);s=put(s,'twitter:description',desc);s=put(s,'twitter:image',image);
 write(f,s);
 rows.push({page:f,regional_group:r||'sitewide',title,canonical:url,keywords:keys.join(', '),keyword_count:keys.length,description:desc,og_image:image});
 seenCount.set(r||'sitewide',(seenCount.get(r||'sitewide')||0)+1);
}
const header=['page','regional_group','title','canonical','keywords','keyword_count','description','og_image'];
const csv=v=> '"'+String(v??'').replace(/"/g,'""')+'"';
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
write('reports/V18_09_전체페이지_메타키워드.csv',[header.join(','),...rows.map(x=>header.map(k=>csv(x[k])).join(','))].join('\n')+'\n');
write('reports/V18_09_지역핵심키워드.json',JSON.stringify({notes:'지정 핵심어 + 지역·랜드마크·업종을 결합한 관련 검색어 후보. 공개 검색 결과 및 기존 GSC 대화 이력 참고. 개별 후보의 검색량은 검증되지 않음. Google 검색은 meta keywords를 순위/색인에 사용하지 않음.',keywords:main},null,2)+'\n');
console.log('[V18-meta]',rows.length,'indexable HTML metadata updated',Object.fromEntries(seenCount));