// /js/site-search.js - 알밤09 통합검색 실제 동작 고정판
(function(){
  'use strict';
  var SEARCH_ITEMS = [{"name":"홈","route":"https://albam09.com/","kind":"메뉴","region":"","aliases":["홈","메인","첫화면","index"]},{"name":"업소 전체 목록","route":"/","kind":"메뉴","region":"","aliases":["업소 전체 목록","업소목록","전체업소","상세페이지목록","전체목록"]},{"name":"상무지구","route":"https://albam09.com/page/karaoke1/","kind":"지역","region":"서구1","aliases":["상무지구","서구1","치평동","상무","상무 치평","상무지구 치평","상무지구 업소","상무지구 목록","상무지구가라오케","상무지구유흥주점","상무지구노래방","치평동노래방","치평동가라오케"]},{"name":"상무 · 광천동","route":"https://albam09.com/page/karaoke2/","kind":"지역","region":"서구2","aliases":["상무 · 광천동","상무","광천동","서구2","광천","상무 목록","광천동 목록","광천동노래방","광천동가라오케","광천동유흥주점","상무 광천동","화정동노래방"]},{"name":"용봉동","route":"https://albam09.com/page/karaoke4/","kind":"지역","region":"북구1","aliases":["용봉동","북구1","용봉","용봉동 목록","용봉동노래방","용봉동가라오케"]},{"name":"신안동","route":"https://albam09.com/page/karaoke3/","kind":"지역","region":"북구2","aliases":["신안동","북구2","신안","유동","신안동 목록","신안동노래방","신안동가라오케","광주역노래방","유동노래방","유동노래홀"]},{"name":"첨단지구","route":"https://albam09.com/page/karaoke5/","kind":"지역","region":"광산구","aliases":["첨단지구","첨단","광산구","첨단동","첨단지구 목록","첨단지구노래방","첨단지구노래홀","첨단지구유흥주점","쌍암동노래홀"]},{"name":"목포","route":"https://albam09.com/page/karaoke6/","kind":"지역","region":"목포","aliases":["목포","목포시","전남 목포","목포 목록"]},{"name":"동구","route":"https://albam09.com/page/karaoke7/","kind":"지역","region":"동구","aliases":["동구","광주 동구","동구 목록"]},{"name":"남구","route":"https://albam09.com/page/karaoke8/","kind":"지역","region":"남구","aliases":["남구","광주 남구","남구 목록"]},{"name":"룸소주방","route":"https://albam09.com/page/room/","kind":"업종","region":"","aliases":["룸소주방","룸쏘주방","상무지구룸소주방","상무지구룸쏘주방","광주룸소주방","광주룸쏘주방"]}];
  (Array.isArray(window.PUBLIC_VENUES)?window.PUBLIC_VENUES:[]).forEach(function(v){
    var name=String(v.name||v.title||v.id||'').trim();
    var slug=String(v.slug||v.id||'').trim();
    var region=String(v.region||'').trim();
    if(!name||!slug)return;
    SEARCH_ITEMS.push({name:name,route:'https://ilovebam11.com/place/'+encodeURIComponent(slug)+'/',kind:'업소',region:region,aliases:[name,region+' '+name,name+' '+region,name+' 업소',name+' 상세',name+' 상세페이지',name+' 지역목록']});
  });
  function normalize(s){return String(s||'').toLowerCase().replace(/\s+/g,'').replace(/[·ㆍ・.]/g,'').replace(/[^0-9a-z가-힣]/g,'');}
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function uniqueAliases(item){var arr=[item.name,item.region,item.kind].concat(item.aliases||[]);var out=[];arr.forEach(function(v){v=String(v||'').trim();if(v&&out.indexOf(v)<0)out.push(v);});return out;}
  function scoreItem(item,q){var nq=normalize(q); if(!nq) return 0; var best=0; uniqueAliases(item).forEach(function(a){var na=normalize(a); if(!na) return; if(na===nq) best=Math.max(best,1000); else if(na.indexOf(nq)>=0) best=Math.max(best,760+Math.min(nq.length,20)); else if(nq.indexOf(na)>=0) best=Math.max(best,650+Math.min(na.length,20)); }); return best;}
  function findMatches(q,limit){return SEARCH_ITEMS.map(function(item){return {item:item,score:scoreItem(item,q)};}).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score || String(a.item.name).localeCompare(String(b.item.name),'ko');}).slice(0,limit||8);}
  function routeUrl(route){
    if(!route) return '#';
    if(route==='/'||route==='https://albam09.com/'||route==='/index'||route==='/index.html') return '/';

    if(route.indexOf('https://albam09.com/page/')===0){
      var local=route.replace('https://albam09.com','').replace(/[?#].*$/,'');
      local=local.replace(/\/index\.html?$/i,'/').replace(/\.html$/i,'');
      if(/^\/page\/(?:karaoke[1-8]|room)$/i.test(local)) local+='/';
      return local;
    }

    if(route.indexOf('/page/')===0){
      var pageRoute=route.replace(/[?#].*$/,'').replace(/\/index\.html?$/i,'/').replace(/\.html$/i,'');
      if(/^\/page\/(?:karaoke[1-8]|room)$/i.test(pageRoute)) pageRoute+='/';
      return pageRoute;
    }

    if(route.indexOf('https://ilovebam11.com/place/')===0) return route.replace(/\/+$/,'')+'/';
    if(route==='/place'||route==='/place/index'||route==='/place/') return '/';
    if(route.indexOf('/place/')===0){
      var clean=route.replace(/[?#].*$/,'').replace(/\/+$/,'');
      var file=clean.slice(clean.lastIndexOf('/')+1);
      return file ? '/place/'+file : '/';
    }
    return route;
  }
  function createSearchBox(){var section=document.createElement('section');section.className='global-place-search';section.setAttribute('role','search');section.setAttribute('aria-label','업소 통합검색');section.innerHTML='<form class="global-place-search__form" autocomplete="off"><span class="global-place-search__icon" aria-hidden="true">⌕</span><input class="global-place-search__input" type="search" inputmode="search" placeholder="업소명·지역명 검색 후 바로 이동" aria-label="업소명 또는 지역명 검색"><button class="global-place-search__button" type="submit">검색</button></form><div class="global-place-search__suggestions" hidden></div>';return section;}
  function mountSearchBox(){
    var existing=document.querySelector('.global-place-search'); if(existing) return existing;
    var box=createSearchBox(); var main=document.querySelector('main');
    if(main){ var children=[].slice.call(main.children||[]); var hero=children.filter(function(el){return el.tagName&&el.tagName.toLowerCase()==='section'&&el.hasAttribute('title');})[0] || children[0]; if(hero&&hero.parentNode){hero.parentNode.insertBefore(box,hero.nextElementSibling); return box;} main.insertBefore(box,main.firstElementChild||null); return box;}
    document.body.insertBefore(box,document.body.firstElementChild||null); return box;
  }
  function renderSuggestions(box,matches,q){var panel=box.querySelector('.global-place-search__suggestions'); if(!panel) return; if(!q){panel.hidden=true;panel.innerHTML='';return;} if(!matches.length){panel.hidden=false;panel.innerHTML='<div class="global-place-search__empty">검색 결과가 없습니다. 업소명을 조금 더 정확히 입력하세요.</div>';return;} panel.hidden=false;panel.innerHTML=matches.slice(0,6).map(function(hit){var it=hit.item;var meta=[it.kind,it.region].filter(Boolean).join(' · ');return '<a class="global-place-search__suggestion"'+(it.kind==='업소'?' rel="nofollow"':'')+' href="'+escapeHtml(routeUrl(it.route))+'"><strong>'+escapeHtml(it.name)+'</strong><span>'+escapeHtml(meta)+'</span></a>';}).join('');}
  function bindSearch(box){var form=box.querySelector('form');var input=box.querySelector('input'); if(!form||!input||box.getAttribute('data-search-bound')==='1') return; box.setAttribute('data-search-bound','1'); input.addEventListener('input',function(){var q=input.value.trim(); renderSuggestions(box,findMatches(q,8),q);}); form.addEventListener('submit',function(e){e.preventDefault();var q=input.value.trim();var matches=findMatches(q,8);if(matches.length){var nq=normalize(q);var exact=matches.filter(function(hit){return uniqueAliases(hit.item).some(function(a){return normalize(a)===nq;});}); if(exact.length){location.href=routeUrl(exact[0].item.route);return;} if(matches.length===1||matches[0].score>=760){location.href=routeUrl(matches[0].item.route);return;}} renderSuggestions(box,matches,q);input.focus();});document.addEventListener('click',function(e){if(!box.contains(e.target)){var p=box.querySelector('.global-place-search__suggestions');if(p)p.hidden=true;}});}
  function init(){bindSearch(mountSearchBox());}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
