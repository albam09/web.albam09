/* Random regional previews: 3.6 s to tap, then a 650 ms leftward transition. */
(function(){
 'use strict';
 var DWELL=3600,TRAVEL=650;
 function start(){
  var all=Array.isArray(window.PUBLIC_VENUES)?window.PUBLIC_VENUES:[];
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var hover=window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.home-region-rail[data-region-preview]').forEach(function(card,cardIndex){
   if(card.dataset.railReady)return;
   var board=card.dataset.regionPreview,rows=all.filter(function(v){return v.board===board;});
   var track=card.querySelector('.venue-rail__track'),viewport=card.querySelector('.venue-rail__window');
   if(!track||!viewport||rows.length<2)return;
   card.dataset.railReady='true';
   var footer=card.querySelector('.venue-rail__footer'),toggle=card.querySelector('.venue-rail__toggle');
   var next=card.querySelector('.venue-rail__next'),counter=card.querySelector('.venue-rail__count');
   var label=card.querySelector('h3 a').textContent.replace(/\s*\(\d+개\)\s*$/,'').trim();
   var timer=0,fallback=0,moving=false,userPaused=reduced.matches,hovered=false,focused=false;
   var visible=!('IntersectionObserver' in window),pointer=null,suppressClick=false,bag=[],lastSlug='',position=1,first=true;
   function take(){
    if(!bag.length){
     bag=rows.slice();
     for(var i=bag.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),tmp=bag[i];bag[i]=bag[j];bag[j]=tmp;}
     if(bag[0].slug===lastSlug){var swap=bag[0];bag[0]=bag[1];bag[1]=swap;}
    }
    var venue=bag.shift();lastSlug=venue.slug;return venue;
   }
   function tile(venue){
    var a=document.createElement('a'),name=document.createElement('span'),hint=document.createElement('span');
    a.className='venue-rail__tile';a.dataset.venueSlug=venue.slug;
    a.href='/map/'+venue.board+'/?venue='+encodeURIComponent(venue.slug);
    a.setAttribute('aria-label',venue.name+' 지도에서 위치 보기');a.draggable=false;
    name.className='venue-rail__name';name.textContent=venue.name;
    hint.className='venue-rail__hint';hint.setAttribute('aria-hidden','true');hint.textContent='지도 보기 ↗';
    a.append(name,hint);return a;
   }
   function current(){
    Array.from(track.children).forEach(function(a,i){
     if(i){a.setAttribute('aria-hidden','true');a.tabIndex=-1;}else{a.removeAttribute('aria-hidden');a.removeAttribute('tabindex');}
    });
    counter.textContent=position+' / '+rows.length;
    card.dataset.currentSlug=track.firstElementChild.dataset.venueSlug;
   }
   function clear(){if(timer){window.clearTimeout(timer);timer=0;}}
   function blocked(){return userPaused||hovered||focused||pointer||document.hidden||!visible;}
   function schedule(){
    clear();
    if(moving||blocked())return;
    timer=window.setTimeout(function(){timer=0;advance();},DWELL+(first?cardIndex*160:0));first=false;
   }
   function controls(){
    toggle.setAttribute('aria-pressed',String(userPaused));
    toggle.setAttribute('aria-label',label+' 업소 자동 넘김 '+(userPaused?'시작':'멈추기'));
    toggle.title=userPaused?'자동 넘김 시작':'자동 넘김 멈추기';
    toggle.firstElementChild.textContent=userPaused?'▶':'Ⅱ';
   }
   function finish(){
    if(!moving)return;
    window.clearTimeout(fallback);fallback=0;
    track.style.transition='none';
    track.firstElementChild.remove();track.appendChild(tile(take()));
    track.style.transform='translate3d(0,0,0)';
    moving=false;card.dataset.moving='false';
    position=position%rows.length+1;current();schedule();
   }
   function advance(){
    clear();
    if(moving)return;
    moving=true;card.dataset.moving='true';
    var children=track.children,step=children[1].getBoundingClientRect().left-children[0].getBoundingClientRect().left;
    if(reduced.matches||step<=0){finish();return;}
    // Lay out the resting track before starting. Keep names and links together.
    track.getBoundingClientRect();
    track.style.transition='transform '+TRAVEL+'ms cubic-bezier(.22,.78,.22,1)';
    track.style.transform='translate3d(-'+step+'px,0,0)';
    fallback=window.setTimeout(finish,TRAVEL+100);
   }
   track.replaceChildren(tile(take()),tile(take()),tile(take()));current();controls();footer.hidden=false;
   card.setAttribute('aria-roledescription','업소 슬라이드');
   track.addEventListener('transitionend',function(e){if(e.target===track&&e.propertyName==='transform')finish();});
   next.addEventListener('click',function(){advance();});
   toggle.addEventListener('click',function(){userPaused=!userPaused;if(!userPaused)focused=false;controls();schedule();});
   card.addEventListener('mouseenter',function(){if(hover.matches){hovered=true;clear();}});
   card.addEventListener('mouseleave',function(){hovered=false;schedule();});
   card.addEventListener('focusin',function(){focused=true;clear();});
   card.addEventListener('focusout',function(e){if(!card.contains(e.relatedTarget)){focused=false;schedule();}});
   viewport.addEventListener('dragstart',function(e){e.preventDefault();});
   viewport.addEventListener('pointerdown',function(e){
    if(e.isPrimary===false||e.button!==0)return;
    suppressClick=moving;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,drag:false};clear();
   });
   viewport.addEventListener('pointermove',function(e){
    if(!pointer||e.pointerId!==pointer.id)return;
    var dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
    if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3){pointer.drag=true;suppressClick=true;}
   });
   window.addEventListener('pointerup',function(e){
    if(!pointer||e.pointerId!==pointer.id)return;
    var dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,swipe=pointer.drag&&dx<-32&&Math.abs(dx)>Math.abs(dy)*1.3;
    pointer=null;
    if(swipe)advance();else schedule();
   });
   window.addEventListener('pointercancel',function(e){if(pointer&&e.pointerId===pointer.id){pointer=null;suppressClick=true;schedule();}});
   viewport.addEventListener('click',function(e){if(moving||suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}},true);
   viewport.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();next.focus();advance();}});
   document.addEventListener('visibilitychange',function(){if(document.hidden){clear();finish();}else schedule();});
   window.addEventListener('blur',function(){pointer=null;clear();});
   window.addEventListener('focus',schedule);
   window.addEventListener('resize',function(){if(moving)finish();});
   reduced.addEventListener('change',function(){if(reduced.matches){userPaused=true;finish();}controls();schedule();});
   if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;if(!visible){clear();finish();}else schedule();},{threshold:0.15}).observe(card);
   }
   schedule();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
