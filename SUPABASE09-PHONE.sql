-- LEGACY PATCH: 신규 설치에서는 실행하지 마세요. SUPABASE09.sql에 이미 통합되어 있습니다.
-- 광주버블여지도09 회원 휴대폰번호 저장용 확장
-- 08과 공유하는 public.profiles에는 전화번호를 넣지 않습니다.
-- 회원 본인과 09 최고관리자만 조회할 수 있는 별도 비공개 테이블입니다.

begin;

create table if not exists public.albam09_member_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text not null check (char_length(phone) between 8 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.albam09_member_private enable row level security;

drop policy if exists albam09_member_private_select on public.albam09_member_private;
create policy albam09_member_private_select
on public.albam09_member_private
for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.albam09_staff s
    where s.user_id = auth.uid() and s.level = 'super_admin'
  )
);

drop policy if exists albam09_member_private_insert on public.albam09_member_private;
create policy albam09_member_private_insert
on public.albam09_member_private
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists albam09_member_private_update on public.albam09_member_private;
create policy albam09_member_private_update
on public.albam09_member_private
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
