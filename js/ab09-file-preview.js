/* albam09 local file:// preview helper. No effect in http(s) Netlify production. */
(function () {
  'use strict';
  if (window.location.protocol !== 'file:') return;
  var me = document.currentScript;
  if (!me || !me.src) return;
  var root = new URL('../', me.src);
  var host = /^(?:www\.)?albam09\.com$/i;
  function fileTarget(raw) {
    if (!raw || /^(?:#|javascript:|data:|mailto:|tel:|blob:|\/\/)/i.test(raw)) return null;
    var u;
    if (raw.charAt(0) === '/') {
      u = new URL(raw, 'https://albam09.com');
    } else if (/^https?:\/\//i.test(raw)) {
      try { u = new URL(raw); } catch (_) { return null; }
      if (!host.test(u.hostname)) return null;
    } else { return null; }
    if (!host.test(u.hostname)) return null;
    var path;
    try { path = decodeURIComponent(u.pathname || '/'); } catch (_) { return null; }
    if (path.indexOf('\\') >= 0 || /(?:^|\/)\.\.(?:\/|$)/.test(path)) return null;
    if (path === '/' || path.endsWith('/')) path += 'index.html';
    else if (!/\.[^/]+$/.test(path)) path += '/index.html';
    return new URL(path.replace(/^\//, '') + u.search + u.hash, root).href;
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.hasAttribute('download') || a.target === '_blank') return;
    var target = fileTarget(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.location.assign(target);
  }, true);
  // Dynamically inserted images may still use root-relative URLs. Rebase them locally.
  var scheduled = false;
  function fixMedia() {
    scheduled = false;
    document.querySelectorAll('img[src^="/"],video[poster^="/"],source[src^="/"]').forEach(function (node) {
      var attr = node.hasAttribute('src') ? 'src' : 'poster';
      var v = node.getAttribute(attr);
      if (v && v.charAt(1) !== '/') {
        var u = fileTarget(v);
        if (u) node.setAttribute(attr, u);
      }
    });
  }
  var watcher = new MutationObserver(function () {
    if (!scheduled) { scheduled = true; requestAnimationFrame(fixMedia); }
  });
  watcher.observe(document.documentElement, {childList:true, subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fixMedia, {once:true});
  else fixMedia();
})();
