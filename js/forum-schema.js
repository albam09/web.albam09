/* The same public-post schema rules run in Node and in the browser.
   Authentication providers, email addresses and login tokens are never markup. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('node:crypto').webcrypto);
 else root.ALBAM09_FORUM_SCHEMA=factory(root.crypto);
})(typeof globalThis==='object'?globalThis:this,function(cryptoApi){
 'use strict';
 const origin='https://albam09.com';
 const slugOK=v=>/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(String(v||''));
 function iso(value){
  if(typeof value!=='string'||!value.trim())return null;
  const time=Date.parse(value);return Number.isFinite(time)?new Date(time).toISOString():null;
 }
 function published(d){return iso(d.published_at)||iso(d.created_at);}
 function name(d){return String(d.profiles?.nickname||'').trim()||'광주버블여지도 회원';}
 async function authorKey(id){
  if(typeof id!=='string'||!id.trim())return null;
  const bytes=new TextEncoder().encode('albam09-public-author-v1:'+id.trim());
  const digest=await cryptoApi.subtle.digest('SHA-256',bytes);
  return 'member-'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,24);
 }
 async function author(d){
  const person={'@type':'Person',name:name(d)},key=await authorKey(d.author_id);
  if(key){person.url=origin+'/explore/author/'+key+'/';person['@id']=person.url+'#person';}
  return person;
 }
 function imageUrls(d){return (Array.isArray(d.images)?d.images:[]).map(x=>x?.url).filter(u=>typeof u==='string'&&/^https?:\/\//i.test(u));}
 async function post(d,comments){
  if(!d||!slugOK(d.slug)||d.is_deleted||(d.status&&d.status!=='published'))return null;
  const date=published(d),text=String(d.content||'').trim(),images=imageUrls(d);
  if(!date||(!text&&!images.length))return null;
  const url=origin+'/explore/post/'+d.slug+'/';
  const obj={'@context':'https://schema.org','@type':'DiscussionForumPosting','@id':url+'#posting',mainEntityOfPage:url,url,headline:String(d.title||''),datePublished:date,author:await author(d)};
  if(text)obj.text=text;
  if(images.length)obj.image=images;
  const modified=iso(d.updated_at);if(modified&&modified>=date)obj.dateModified=modified;
  const replies=[];
  for(const c of comments||[]){
   const when=iso(c?.created_at),body=String(c?.content||'').trim();
   if(!c?.id||!when||!body||c.is_deleted||(c.status&&c.status!=='published'))continue;
   replies.push({'@type':'Comment',text:body,url:url+'#comment-'+encodeURIComponent(c.id),datePublished:when,author:await author(c)});
  }
  if(replies.length)obj.comment=replies;
  return obj;
 }
 function issues(obj){
  const errors=[];
  if(!obj||obj['@type']!=='DiscussionForumPosting')return ['Missing DiscussionForumPosting'];
  if(!obj.author?.name?.trim())errors.push('author.name');
  if(!/^https:\/\/albam09\.com\/explore\/author\/member-[a-f0-9]{24}\/$/.test(obj.author?.url||''))errors.push('author.url');
  if(!iso(obj.datePublished))errors.push('datePublished');
  if(!/^https:\/\/albam09\.com\/explore\/post\/[A-Za-z0-9_-]+\/$/.test(obj.url||''))errors.push('url');
  if(!obj.text&&!obj.image?.length&&!obj.video)errors.push('text/image/video');
  for(const c of obj.comment||[]){if(!c.author?.name?.trim()||!iso(c.datePublished)||!c.text)errors.push('comment');}
  return errors;
 }
 return {origin,slugOK,iso,published,name,authorKey,author,post,issues};
});
