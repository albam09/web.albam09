/* One visible preview per region; complete venue lists live on regional pages. */
(function(){
 'use strict';
 function start(){
  var all=Array.isArray(window.PUBLIC_VENUES)?window.PUBLIC_VENUES:[];
  var cards=Array.from(document.querySelectorAll('[data-region-preview]'));
  function update(){
   cards.forEach(function(card){
    var board=card.getAttribute('data-region-preview');
    var rows=all.filter(function(v){return v.board===board;});
    var item=card.querySelector('[data-preview-item]');
    if(!rows.length||!item)return;
    var previous=item.getAttribute('data-current-slug');
    var choices=rows.filter(function(v){return rows.length===1||v.slug!==previous;});
    var v=choices[Math.floor(Math.random()*choices.length)];
    var link=item.querySelector('a'),img=item.querySelector('img'),label=item.querySelector('span');
    link.href='/map/'+v.board+'/?venue='+encodeURIComponent(v.slug);
    if(img){img.src=v.image;img.alt=v.name+' 등록 이미지';}
    link.setAttribute('aria-label',v.name+' 지도에서 위치 보기');label.textContent=v.name;
    item.setAttribute('data-current-slug',v.slug);
   });
  }
  update();
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   window.setInterval(function(){if(!document.hidden)update();},6500);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
