import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const digest=data=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
const MAX_AGE=24*60*60*1000;

// A short outage must not erase public posts or make a CSS release impossible.
// Only a complete, validated, recent public snapshot can be reused. Permission,
// schema and malformed-data errors always stop a build; stale data never wins.
export async function resolvePublicContent({refresh,validate,cacheFile,source,strict=false,now=Date.now()}){
 let payload;
 try{
  payload=await refresh();
 }catch(error){
  if(strict||error.transient!==true)throw error;
  let saved;
  try{saved=JSON.parse(await fs.readFile(cacheFile,'utf8'));}catch{throw new Error('공개 글 조회 실패: 검증된 백업이 없어 배포를 중단합니다.',{cause:error});}
  const age=now-Date.parse(saved.fetchedAt);
  if(saved.version!==1||saved.source!==source||!Number.isFinite(age)||age<0||age>MAX_AGE||saved.sha256!==digest(saved.payload)){
   throw new Error('공개 글 조회 실패: 백업이 만료되었거나 손상되어 배포를 중단합니다.',{cause:error});
  }
  await validate(saved.payload);
  console.warn(`[public-content] 일시 장애: ${saved.fetchedAt} 검증 자료 사용. 새 글·삭제·숨김 변경은 이번 빌드에 반영되지 않습니다. 정상 연결 후 재빌드하세요.`);
  return {payload:saved.payload,mode:'recent-snapshot',fetchedAt:saved.fetchedAt};
 }
 await validate(payload);
 const fetchedAt=new Date(now).toISOString();
 const record={version:1,source,fetchedAt,sha256:digest(payload),payload};
 await fs.mkdir(path.dirname(cacheFile),{recursive:true});
 await fs.writeFile(cacheFile+'.tmp',JSON.stringify(record,null,2)+'\n');
 await fs.rename(cacheFile+'.tmp',cacheFile);
 return {payload,mode:'live',fetchedAt};
}
