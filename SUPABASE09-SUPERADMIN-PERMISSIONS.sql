-- LEGACY PATCH: 신규 설치에서는 실행하지 마세요. SUPABASE09.sql에 이미 통합되어 있습니다.
-- 광주버블여지도09 권한 보정
-- 기존 08 Supabase 구조는 건드리지 않고 09 탐험기 수정/삭제 권한만 강화합니다.

begin;

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
  v_slug text;
  v_status text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.albam09_is_super(v_uid) then raise exception 'super_admin_required'; end if;
  select slug,status into v_slug,v_status from public.albam09_explorer_posts where id=p_post_id and is_deleted=false;
  if v_slug is null then raise exception 'post_not_found'; end if;
  if p_board not in ('karaoke1','karaoke2','karaoke3','karaoke4','karaoke5','karaoke6','karaoke7','karaoke8') then raise exception 'invalid_board'; end if;
  if char_length(btrim(coalesce(p_title,''))) not between 1 and 120 then raise exception 'invalid_title'; end if;
  if char_length(btrim(coalesce(p_content,''))) not between 1 and 15000 then raise exception 'invalid_content'; end if;
  if p_images is null then p_images:='[]'::jsonb; end if;
  if jsonb_typeof(p_images) <> 'array' or jsonb_array_length(p_images)>8 then raise exception 'invalid_images'; end if;

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
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.albam09_is_super(v_uid) then raise exception 'super_admin_required'; end if;
  if not exists(select 1 from public.albam09_explorer_posts where id=p_post_id and is_deleted=false) then raise exception 'post_not_found'; end if;
  update public.albam09_explorer_posts set is_deleted=true,status='hidden',updated_at=now() where id=p_post_id;
end;
$$;
revoke all on function public.albam09_delete_explorer_post(uuid) from public;
grant execute on function public.albam09_delete_explorer_post(uuid) to authenticated;


-- 댓글 수정/삭제는 최고관리자만 가능합니다.
create or replace function public.albam09_update_explorer_comment(p_comment_id uuid,p_content text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  if not public.albam09_is_super(auth.uid()) then raise exception 'super_admin_required'; end if;
  if char_length(btrim(coalesce(p_content,''))) not between 1 and 1200 then raise exception 'invalid_content'; end if;
  if not exists(select 1 from public.albam09_explorer_comments where id=p_comment_id and is_deleted=false) then raise exception 'comment_not_found'; end if;
  update public.albam09_explorer_comments set content=btrim(p_content),updated_at=now() where id=p_comment_id and is_deleted=false;
end;
$$;
revoke all on function public.albam09_update_explorer_comment(uuid,text) from public;
grant execute on function public.albam09_update_explorer_comment(uuid,text) to authenticated;

create or replace function public.albam09_delete_explorer_comment(p_comment_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  if not public.albam09_is_super(auth.uid()) then raise exception 'super_admin_required'; end if;
  if not exists(select 1 from public.albam09_explorer_comments where id=p_comment_id and is_deleted=false) then raise exception 'comment_not_found'; end if;
  update public.albam09_explorer_comments set is_deleted=true,status='hidden',updated_at=now() where id=p_comment_id;
end;
$$;
revoke all on function public.albam09_delete_explorer_comment(uuid) from public;
grant execute on function public.albam09_delete_explorer_comment(uuid) to authenticated;

commit;
