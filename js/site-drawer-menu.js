
(function(){
  'use strict';

  function q(sel, root){ return (root || document).querySelector(sel); }
  function qa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function init(){
    var drawer = q('#site-drawer-menu');
    var trigger = q('.site-menu-trigger');
    if(!drawer || !trigger) return;

    var closeBtn = q('.site-drawer__close', drawer);
    var panel = q('.site-drawer__panel', drawer);
    var lastFocus = null;

    function openDrawer(){
      lastFocus = document.activeElement;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden','false');
      trigger.setAttribute('aria-expanded','true');
      document.documentElement.classList.add('site-drawer-open');
      if(closeBtn) closeBtn.focus({preventScroll:true});
    }

    function closeDrawer(returnFocus){
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden','true');
      trigger.setAttribute('aria-expanded','false');
      document.documentElement.classList.remove('site-drawer-open');
      if(returnFocus !== false && lastFocus && lastFocus.focus){
        try{ lastFocus.focus({preventScroll:true}); }catch(e){ lastFocus.focus(); }
      }
    }

    trigger.addEventListener('click', function(){
      if(drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });
    if(closeBtn) closeBtn.addEventListener('click', function(){ closeDrawer(); });

    drawer.addEventListener('click', function(e){
      if(e.target === drawer) closeDrawer();
    });
    if(panel) panel.addEventListener('click', function(e){ e.stopPropagation(); });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });

    // 좌측 카테고리 탭
    qa('.site-drawer__tab', drawer).forEach(function(tab){
      tab.addEventListener('click', function(){
        var target = tab.getAttribute('data-menu-tab');
        qa('.site-drawer__tab', drawer).forEach(function(x){
          x.classList.toggle('is-active', x === tab);
          x.setAttribute('aria-selected', x === tab ? 'true' : 'false');
        });
        qa('.site-drawer__section', drawer).forEach(function(sec){
          sec.classList.toggle('is-active', sec.getAttribute('data-menu-panel') === target);
        });
      });
    });

    // 통합검색 바로가기: 메뉴 닫고 기존 검색창으로 이동
    qa('[data-menu-action="search"]', drawer).forEach(function(btn){
      btn.addEventListener('click', function(){
        closeDrawer(false);
        var input = q('.global-place-search__input');
        var box = q('.global-place-search');
        if(box) box.scrollIntoView({behavior:'smooth', block:'center'});
        window.setTimeout(function(){
          if(input) input.focus();
        }, 330);
      });
    });

    // 현재 페이지 표시
    var current = (location.pathname || '/').replace(/\/+$/,'') || '/';
    qa('.site-drawer__link[href]', drawer).forEach(function(a){
      var href = a.getAttribute('href') || '';
      if(!href || href.indexOf('http') === 0) return;
      var normalized = href.replace(/\/+$/,'') || '/';
      if(normalized === current){
        a.setAttribute('aria-current','page');
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }
})();
