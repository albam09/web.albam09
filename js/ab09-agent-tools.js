/* albam09 WebMCP progressive enhancement (2026-10-27).
   Read-only tools; no database writes, no navigation, and no UI mutations.
   In unsupported browsers the script exits without affecting the site. */
(function () {
  'use strict';
  if (!document.modelContext || typeof document.modelContext.registerTool !== 'function') return;
  var ctx = document.modelContext;
  var ORIGIN = 'https://albam09.com';
  var pages = [
    ['상무지구·치평동','/page/karaoke1/'],
    ['상무·광천동','/page/karaoke2/'],
    ['신안동·광주역권','/page/karaoke3/'],
    ['용봉동·전남대권','/page/karaoke4/'],
    ['첨단지구·쌍암동','/page/karaoke5/'],
    ['목포·하당','/page/karaoke6/'],
    ['광주 동구','/page/karaoke7/'],
    ['광주 남구','/page/karaoke8/'],
    ['룸소주·룸쏘주','/page/room/']
  ];
  function getVenues() {
    var els = document.querySelectorAll('.business-desc-card, .index-venue-preview-card');
    var hits = [], seen = new Set();
    Array.from(els).forEach(function(card) {
      var a = card.querySelector('.business-desc-card__title-link, h4 a, .business-desc-card__button');
      if (!a || !a.textContent.trim()) return;
      var name = a.textContent.trim();
      var href = a.getAttribute('href') || '';
      var key = name + '|' + href;
      if (seen.has(key)) return;
      seen.add(key);
      var location = card.querySelector('.business-desc-fact--location,.index-venue-preview-location');
      hits.push({name: name, region: document.body.getAttribute('data-current-page') || 'index', location: location ? location.textContent.replace(/\s+/g,' ').trim().slice(0,180) : '', profile_url: new URL(href, locationOrigin()).href});
    });
    return hits;
  }
  function locationOrigin(){ return window.location.protocol === 'file:' ? ORIGIN : window.location.origin; }
  function register(tool) {
    Promise.resolve(ctx.registerTool(tool)).catch(function(e){
      if (window.location.search.indexOf('webmcp_debug=1') >= 0) console.warn('[WebMCP]', tool.name, e);
    });
  }
  function ready() {
    register({
      name: 'albam09_list_regions',
      description: '광주버블여지도에 등록된 지역 안내 페이지의 이름과 정식 웹 주소를 조회합니다. 페이지 이동이나 예약은 실행하지 않습니다.',
      inputSchema: {type:'object',properties:{},additionalProperties:false},
      annotations: {readOnlyHint:true,untrustedContentHint:false},
      execute: function () { return JSON.stringify({site:ORIGIN, regions:pages.map(function(p){return {name:p[0],url:ORIGIN+p[1]};})}); }
    });
    register({
      name: 'albam09_search_visible_venues',
      description: '현재 열려 있는 광주버블여지도 페이지의 실제 HTML에 표시된 업소명과 링크를 검색합니다. 없는 업체를 생성하지 않으며, 외부 상세 프로필 링크는 외부 링크라고 명시합니다.',
      inputSchema: {type:'object',properties:{query:{type:'string',description:'업소명 일부 또는 위치 키워드. 빈 문자열은 표시된 업소 최대 15개를 반환합니다.'}},required:['query'],additionalProperties:false},
      annotations: {readOnlyHint:true,untrustedContentHint:true},
      execute: function (args) {
        var q=String(args.query||'').trim().toLocaleLowerCase('ko');
        var matched=getVenues().filter(function(v){return !q||(v.name+' '+v.location).toLocaleLowerCase('ko').includes(q);});
        return JSON.stringify({page:window.location.protocol==='file:' ? '(local preview)' : window.location.href,total:matched.length,results:matched.slice(0,15).map(function(v){return Object.assign(v,{profile_is_external: v.profile_url.indexOf('https://ilovebam11.com/')===0});})});
      }
    });
    register({
      name: 'albam09_page_information',
      description: '현재 안내 페이지의 제목, 핵심 헤딩 및 canonical을 읽기 전용으로 반환합니다. 검색 노출이나 순위를 예측하지 않습니다.',
      inputSchema: {type:'object',properties:{},additionalProperties:false},
      annotations: {readOnlyHint:true,untrustedContentHint:true},
      execute: function () {
        var canonical=document.querySelector('link[rel="canonical"]');
        var heading=document.querySelector('main h1, h1');
        return JSON.stringify({title:document.title,heading:heading?heading.textContent.replace(/\s+/g,' ').trim().slice(0,220):'',canonical:canonical?canonical.href:null,visible_venue_count:getVenues().length});
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
})();
