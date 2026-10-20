/* albam09: HTML-escaped, allowlisted inline image/link rendering.
   Same module is used in browsers and Netlify's Node build. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ALBAM09_INLINE_MEDIA = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]}); }
  function safeUrl(v) {
    try {
      var u = new URL(String(v || ''));
      if (u.protocol !== 'https:' || u.username || u.password || u.hostname.length>253 || u.href.length>2200) return null;
      return u.href;
    } catch (_) { return null; }
  }
  function imageUrl(v) {
    var url=safeUrl(v); if(!url)return null;
    var u=new URL(url),host=u.hostname.toLowerCase();
    if (host === 'item.kakaocdn.net' || host.endsWith('.kakaocdn.net')) return url;
    if (host === 'ldyysvafgegsgmvpslui.supabase.co' && u.pathname.startsWith('/storage/v1/object/public/albam09-explore/')) return url;
    if (/\.(?:png|jpe?g|webp|gif|avif)$/i.test(u.pathname)) return url;
    return null;
  }
  function render(v) {
    var text=String(v==null?'':v);
    var pattern=/(!?)\[([^\]\n]{1,120})\]\((https:\/\/[^\s<>"')]{1,2000})\)|(https:\/\/[^\s<>"'()]{1,2000})/g;
    var out='',offset=0,match;
    while ((match=pattern.exec(text)) !== null) {
      out+=esc(text.slice(offset,match.index));
      var url=match[3]||match[4],label=match[2]||url,requestedImage=match[1]==='!'||/^(?:image|img|이미지|사진|이모티콘)$/i.test(label.trim());
      var img=imageUrl(url),link=safeUrl(url);
      if (img && (requestedImage || !match[3] || match[1]==='!')) {
        out+='<a class="ab09-inline-image-link" href="'+esc(img)+'" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="no-referrer"><img class="ab09-inline-image" src="'+esc(img)+'" alt="'+esc((label==='image'||label==='img')?'첨부 이미지':label)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a>';
      } else if (link) {
        out+='<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="no-referrer">'+esc(label)+'</a>';
      } else out+=esc(match[0]);
      offset=pattern.lastIndex;
    }
    return out+esc(text.slice(offset));
  }
  function pastedHtmlImages(e) {
    var h=e.clipboardData && e.clipboardData.getData('text/html');
    if(!h || typeof DOMParser==='undefined')return [];
    var doc=new DOMParser().parseFromString(h,'text/html'),found=[];
    doc.querySelectorAll('img[src]').forEach(function(img){var url=imageUrl(img.getAttribute('src'));if(url && !found.includes(url))found.push(url);});
    return found.slice(0,8);
  }
  function insertAtCursor(input,text) {
    if(!input)return;
    var start=input.selectionStart==null?input.value.length:input.selectionStart;
    var end=input.selectionEnd==null?input.value.length:input.selectionEnd;
    var joined=input.value.slice(0,start)+text+input.value.slice(end);
    if(input.maxLength>0&&joined.length>input.maxLength)return false;
    input.value=joined;input.setSelectionRange(start+text.length,start+text.length);
    input.dispatchEvent(new Event('input',{bubbles:true}));return true;
  }
  return {render:render,imageUrl:imageUrl,safeUrl:safeUrl,esc:esc,pastedHtmlImages:pastedHtmlImages,insertAtCursor:insertAtCursor};
});
