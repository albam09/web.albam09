-- 광주버블여지도09 - 기존 albam08 Supabase 프로젝트에 안전하게 추가하는 09 전용 확장 스키마
-- 중요: auth.users / public.profiles / 08용 트리거·정책은 변경하지 않습니다.
-- 09 전용 테이블, 함수, RLS, Realtime, Storage만 추가/갱신합니다.

begin;

create extension if not exists pgcrypto;

-- 08 프로젝트의 공용 profiles를 그대로 사용합니다.
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles가 없습니다. 반드시 기존 albam08 Supabase 프로젝트에서 실행하세요.';
  end if;
end $$;

-- 09 전용 운영자 권한
create table if not exists public.albam09_staff (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  level text not null check (level in ('admin','super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 휴대폰번호 등 공개하면 안 되는 09 회원 전용 정보
create table if not exists public.albam09_member_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null check (char_length(phone) between 9 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.albam09_is_staff(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.albam09_staff where user_id=p_user);
$$;

create or replace function public.albam09_is_super(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.albam09_staff where user_id=p_user and level='super_admin');
$$;

-- 기존 08 관리자 계정은 09 최고관리자로 자동 등록
insert into public.albam09_staff(user_id,level)
select id,'super_admin' from public.profiles where role='admin'
on conflict(user_id) do update set level='super_admin',updated_at=now();

create table if not exists public.albam09_explorer_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  board text not null check (board in ('karaoke1','karaoke2','karaoke3','karaoke4','karaoke5','karaoke6','karaoke7','karaoke8')),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 300),
  content text not null check (char_length(content) between 1 and 15000),
  venue_name text not null default '' check (char_length(venue_name) <= 100),
  location_text text not null default '' check (char_length(location_text) <= 220),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images)='array' and jsonb_array_length(images) <= 8),
  status text not null default 'pending' check (status in ('pending','published','rejected','hidden')),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint albam09_explorer_posts_author_fkey foreign key(author_id) references public.profiles(id) on delete cascade
);

create table if not exists public.albam09_explorer_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  author_id uuid not null,
  content text not null check (char_length(content) between 1 and 1200),
  status text not null default 'pending' check (status in ('pending','published','rejected','hidden')),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint albam09_explorer_comments_post_fkey foreign key(post_id) references public.albam09_explorer_posts(id) on delete cascade,
  constraint albam09_explorer_comments_author_fkey foreign key(author_id) references public.profiles(id) on delete cascade
);

create table if not exists public.albam09_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists albam09_posts_board_pub_idx on public.albam09_explorer_posts(board,status,published_at desc);
create index if not exists albam09_posts_author_idx on public.albam09_explorer_posts(author_id,created_at desc);
create index if not exists albam09_comments_post_idx on public.albam09_explorer_comments(post_id,created_at);
create index if not exists albam09_messages_sender_idx on public.albam09_messages(sender_id,created_at desc);
create index if not exists albam09_messages_receiver_idx on public.albam09_messages(receiver_id,created_at desc);

alter table public.albam09_staff enable row level security;
alter table public.albam09_member_private enable row level security;
alter table public.albam09_explorer_posts enable row level security;
alter table public.albam09_explorer_comments enable row level security;
alter table public.albam09_messages enable row level security;

-- 운영자 권한
 drop policy if exists albam09_staff_read on public.albam09_staff;
create policy albam09_staff_read on public.albam09_staff for select to authenticated
using (auth.uid()=user_id or public.albam09_is_super(auth.uid()));
grant select on public.albam09_staff to authenticated;

-- 회원 비공개 정보: 본인만 읽기/등록/수정
 drop policy if exists albam09_member_private_read on public.albam09_member_private;
create policy albam09_member_private_read on public.albam09_member_private for select to authenticated
using (auth.uid()=user_id);
 drop policy if exists albam09_member_private_insert on public.albam09_member_private;
create policy albam09_member_private_insert on public.albam09_member_private for insert to authenticated
with check (auth.uid()=user_id);
 drop policy if exists albam09_member_private_update on public.albam09_member_private;
create policy albam09_member_private_update on public.albam09_member_private for update to authenticated
using (auth.uid()=user_id) with check (auth.uid()=user_id);
grant select,insert,update on public.albam09_member_private to authenticated;

-- 탐험기: 공개 승인 글은 비로그인도 조회, 작성자/운영자는 자기/검토 글 조회
 drop policy if exists albam09_posts_read on public.albam09_explorer_posts;
create policy albam09_posts_read on public.albam09_explorer_posts for select
using (
  (status='published' and is_deleted=false)
  or auth.uid()=author_id
  or public.albam09_is_staff(auth.uid())
);
revoke insert,update,delete on public.albam09_explorer_posts from anon,authenticated;
grant select on public.albam09_explorer_posts to anon,authenticated;

-- 댓글 조회 정책
 drop policy if exists albam09_comments_read on public.albam09_explorer_comments;
create policy albam09_comments_read on public.albam09_explorer_comments for select
using (
  (status='published' and is_deleted=false)
  or auth.uid()=author_id
  or public.albam09_is_staff(auth.uid())
);
revoke insert,update,delete on public.albam09_explorer_comments from anon,authenticated;
grant select on public.albam09_explorer_comments to anon,authenticated;

-- 쪽지: 당사자만 조회, 발신자는 등록, 수신자만 읽음 처리
 drop policy if exists albam09_messages_read on public.albam09_messages;
create policy albam09_messages_read on public.albam09_messages for select to authenticated
using (auth.uid()=sender_id or auth.uid()=receiver_id);
 drop policy if exists albam09_messages_insert on public.albam09_messages;
create policy albam09_messages_insert on public.albam09_messages for insert to authenticated
with check (auth.uid()=sender_id);
 drop policy if exists albam09_messages_update on public.albam09_messages;
create policy albam09_messages_update on public.albam09_messages for update to authenticated
using (auth.uid()=receiver_id) with check (auth.uid()=receiver_id);
grant select,insert,update on public.albam09_messages to authenticated;

-- 탐험기 작성: 일반 회원 pending, 운영자는 즉시 published
create or replace function public.albam09_create_explorer_post(
  p_board text,
  p_title text,
  p_summary text,
  p_content text,
  p_venue_name text,
  p_location_text text,
  p_images jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid := gen_random_uuid();
  v_slug text;
  v_status text;
  v_meta jsonb;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if p_board not in ('karaoke1','karaoke2','karaoke3','karaoke4','karaoke5','karaoke6','karaoke7','karaoke8') then raise exception 'invalid_board'; end if;
  if char_length(btrim(coalesce(p_title,''))) not between 1 and 120 then raise exception 'invalid_title'; end if;
  if char_length(btrim(coalesce(p_content,''))) not between 1 and 15000 then raise exception 'invalid_content'; end if;
  if p_images is null then p_images:='[]'::jsonb; end if;
  if jsonb_typeof(p_images) <> 'array' or jsonb_array_length(p_images)>8 then raise exception 'invalid_images'; end if;

  select raw_user_meta_data into v_meta from auth.users where id=v_uid;
  insert into public.profiles(id,nickname,avatar_url)
  values(v_uid,coalesce(v_meta->>'nickname',v_meta->>'full_name',v_meta->>'name','회원'||substr(v_uid::text,1,6)),v_meta->>'avatar_url')
  on conflict(id) do nothing;

  v_slug := p_board||'-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(replace(v_id::text,'-',''),1,10);
  v_status := case when public.albam09_is_staff(v_uid) then 'published' else 'pending' end;

  insert into public.albam09_explorer_posts(
    id,author_id,board,slug,title,summary,content,venue_name,location_text,images,status,published_at
  ) values(
    v_id,v_uid,p_board,v_slug,btrim(p_title),left(btrim(coalesce(p_summary,'')),300),btrim(p_content),left(btrim(coalesce(p_venue_name,'')),100),left(btrim(coalesce(p_location_text,'')),220),p_images,v_status,case when v_status='published' then now() else null end
  );
  return jsonb_build_object('id',v_id,'slug',v_slug,'status',v_status);
end;
$$;
revoke all on function public.albam09_create_explorer_post(text,text,text,text,text,text,jsonb) from public;
grant execute on function public.albam09_create_explorer_post(text,text,text,text,text,text,jsonb) to authenticated;

create or replace function public.albam09_update_explorer_post(
  p_post_id uuid,
  p_board text,
  p_title text,
  p_summary text,
  p_content text,
  p_venue_name text,
  p_location_text text,
  p_images jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_author uuid;
  v_staff boolean;
  v_slug text;
  v_status text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select author_id,slug,status into v_author,v_slug,v_status from public.albam09_explorer_posts where id=p_post_id and is_deleted=false;
  if v_author is null then raise exception 'post_not_found'; end if;
  v_staff:=public.albam09_is_staff(v_uid);
  if v_uid<>v_author and not v_staff then raise exception 'not_allowed'; end if;
  if p_board not in ('karaoke1','karaoke2','karaoke3','karaoke4','karaoke5','karaoke6','karaoke7','karaoke8') then raise exception 'invalid_board'; end if;
  if char_length(btrim(coalesce(p_title,''))) not between 1 and 120 then raise exception 'invalid_title'; end if;
  if char_length(btrim(coalesce(p_content,''))) not between 1 and 15000 then raise exception 'invalid_content'; end if;
  if p_images is null then p_images:='[]'::jsonb; end if;
  if jsonb_typeof(p_images) <> 'array' or jsonb_array_length(p_images)>8 then raise exception 'invalid_images'; end if;

  if not v_staff then v_status:='pending'; end if;
  update public.albam09_explorer_posts set
    board=p_board,title=btrim(p_title),summary=left(btrim(coalesce(p_summary,'')),300),content=btrim(p_content),venue_name=left(btrim(coalesce(p_venue_name,'')),100),location_text=left(btrim(coalesce(p_location_text,'')),220),images=p_images,status=v_status,updated_at=now(),published_at=case when v_status='published' then coalesce(published_at,now()) else null end
  where id=p_post_id;
  return jsonb_build_object('id',p_post_id,'slug',v_slug,'status',v_status);
end;
$$;
revoke all on function public.albam09_update_explorer_post(uuid,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.albam09_update_explorer_post(uuid,text,text,text,text,text,text,jsonb) to authenticated;

create or replace function public.albam09_delete_explorer_post(p_post_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_author uuid;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select author_id into v_author from public.albam09_explorer_posts where id=p_post_id and is_deleted=false;
  if v_author is null then raise exception 'post_not_found'; end if;
  if v_uid<>v_author and not public.albam09_is_staff(v_uid) then raise exception 'not_allowed'; end if;
  update public.albam09_explorer_posts set is_deleted=true,status='hidden',updated_at=now() where id=p_post_id;
end;
$$;
revoke all on function public.albam09_delete_explorer_post(uuid) from public;
grant execute on function public.albam09_delete_explorer_post(uuid) to authenticated;

create or replace function public.albam09_moderate_post(p_post_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.albam09_is_staff(auth.uid()) then raise exception 'admin_required'; end if;
  if p_status not in ('pending','published','rejected','hidden') then raise exception 'invalid_status'; end if;
  update public.albam09_explorer_posts set status=p_status,updated_at=now(),published_at=case when p_status='published' then coalesce(published_at,now()) else published_at end where id=p_post_id and is_deleted=false;
end;
$$;
revoke all on function public.albam09_moderate_post(uuid,text) from public;
grant execute on function public.albam09_moderate_post(uuid,text) to authenticated;

create or replace function public.albam09_create_comment(p_post_id uuid,p_content text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_id uuid:=gen_random_uuid(); v_status text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if char_length(btrim(coalesce(p_content,''))) not between 1 and 1200 then raise exception 'invalid_content'; end if;
  if not exists(select 1 from public.albam09_explorer_posts where id=p_post_id and status='published' and is_deleted=false) then raise exception 'post_not_public'; end if;
  v_status:=case when public.albam09_is_staff(v_uid) then 'published' else 'pending' end;
  insert into public.albam09_explorer_comments(id,post_id,author_id,content,status) values(v_id,p_post_id,v_uid,btrim(p_content),v_status);
  return v_id;
end;
$$;
revoke all on function public.albam09_create_comment(uuid,text) from public;
grant execute on function public.albam09_create_comment(uuid,text) to authenticated;

-- 현재 09 UI에서 최고관리자가 사용하는 댓글 수정/삭제 RPC
create or replace function public.albam09_update_explorer_comment(p_comment_id uuid,p_content text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.albam09_is_super(auth.uid()) then raise exception 'super_admin_required'; end if;
  if char_length(btrim(coalesce(p_content,''))) not between 1 and 1200 then raise exception 'invalid_content'; end if;
  update public.albam09_explorer_comments
  set content=btrim(p_content),updated_at=now()
  where id=p_comment_id and is_deleted=false;
  if not found then raise exception 'comment_not_found'; end if;
end;
$$;
revoke all on function public.albam09_update_explorer_comment(uuid,text) from public;
grant execute on function public.albam09_update_explorer_comment(uuid,text) to authenticated;

create or replace function public.albam09_delete_explorer_comment(p_comment_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.albam09_is_super(auth.uid()) then raise exception 'super_admin_required'; end if;
  update public.albam09_explorer_comments
  set is_deleted=true,status='hidden',updated_at=now()
  where id=p_comment_id and is_deleted=false;
  if not found then raise exception 'comment_not_found'; end if;
end;
$$;
revoke all on function public.albam09_delete_explorer_comment(uuid) from public;
grant execute on function public.albam09_delete_explorer_comment(uuid) to authenticated;

create or replace function public.albam09_set_staff(p_user_id uuid,p_level text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.albam09_is_super(auth.uid()) then raise exception 'super_admin_required'; end if;
  if p_user_id=auth.uid() and p_level is null then raise exception 'cannot_remove_self'; end if;
  if p_level is null then delete from public.albam09_staff where user_id=p_user_id;
  elsif p_level in ('admin','super_admin') then
    insert into public.albam09_staff(user_id,level) values(p_user_id,p_level)
    on conflict(user_id) do update set level=excluded.level,updated_at=now();
  else raise exception 'invalid_level';
  end if;
end;
$$;
revoke all on function public.albam09_set_staff(uuid,text) from public;
grant execute on function public.albam09_set_staff(uuid,text) to authenticated;

-- Realtime
do $$ begin alter publication supabase_realtime add table public.albam09_explorer_posts; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.albam09_explorer_comments; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.albam09_messages; exception when duplicate_object then null; end $$;

-- 탐험기 공개 이미지 버킷
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('albam09-explore','albam09-explore',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

-- Public bucket의 공개 URL은 별도 SELECT 정책 없이 읽을 수 있습니다.
-- 파일 목록 전체 노출을 막기 위해 과거 broad SELECT 정책이 있으면 제거합니다.
drop policy if exists albam09_explore_public_read on storage.objects;

 drop policy if exists albam09_explore_user_upload on storage.objects;
create policy albam09_explore_user_upload on storage.objects for insert to authenticated
with check (bucket_id='albam09-explore' and (storage.foldername(name))[1]=auth.uid()::text);

 drop policy if exists albam09_explore_user_delete on storage.objects;
create policy albam09_explore_user_delete on storage.objects for delete to authenticated
using (bucket_id='albam09-explore' and ((storage.foldername(name))[1]=auth.uid()::text or public.albam09_is_staff(auth.uid())));

commit;

-- 실행 후 확인용: 아래 결과가 나오면 정상입니다.
select 'profiles(shared-08)' as item, count(*)::bigint as rows from public.profiles
union all select 'albam09_staff',count(*) from public.albam09_staff
union all select 'albam09_member_private',count(*) from public.albam09_member_private
union all select 'albam09_explorer_posts',count(*) from public.albam09_explorer_posts
union all select 'albam09_explorer_comments',count(*) from public.albam09_explorer_comments
union all select 'albam09_messages',count(*) from public.albam09_messages;
