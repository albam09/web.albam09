-- 광주버블여지도09 전용 보정 / 2026-10-21
-- SAFE: 기존 게시글/댓글/회원정보 삭제 없음. albam08의 public.profiles.role 수정 없음.
-- Run ONCE in existing Supabase 08/09 shared project after backing up the current functions.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.albam09_staff') IS NULL
    OR to_regclass('public.albam09_explorer_posts') IS NULL
    OR to_regclass('public.albam09_explorer_comments') IS NULL THEN
   RAISE EXCEPTION 'Missing 09 tables; abort';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.albam09_staff WHERE level='super_admin') THEN
   RAISE EXCEPTION 'No 09 super_admin; abort';
 END IF;
END $$;

-- Restore consistent RPC authorization: same 09 staff table used in the UI.
-- Post owner may edit their post, 09 admin/super_admin may edit any post.
CREATE OR REPLACE FUNCTION public.albam09_update_explorer_post(
 p_post_id uuid,p_board text,p_title text,p_summary text,p_content text,
 p_venue_name text,p_location_text text,p_images jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_uid uuid := auth.uid(); v_author uuid; v_slug text; v_status text;
 v_staff boolean;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
 SELECT author_id,slug,status INTO v_author,v_slug,v_status
 FROM public.albam09_explorer_posts WHERE id=p_post_id AND is_deleted=false FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'post_not_found'; END IF;
 v_staff:=public.albam09_is_staff(v_uid);
 IF v_uid<>v_author AND NOT v_staff THEN RAISE EXCEPTION 'not_allowed'; END IF;
 IF p_board NOT IN ('karaoke1','karaoke2','karaoke3','karaoke4','karaoke5','karaoke6','karaoke7','karaoke8') THEN RAISE EXCEPTION 'invalid_board'; END IF;
 IF char_length(btrim(coalesce(p_title,''))) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'invalid_title'; END IF;
 IF char_length(btrim(coalesce(p_content,''))) NOT BETWEEN 1 AND 15000 THEN RAISE EXCEPTION 'invalid_content'; END IF;
 IF p_images IS NULL THEN p_images:='[]'::jsonb; END IF;
 IF jsonb_typeof(p_images)<>'array' OR jsonb_array_length(p_images)>8 THEN RAISE EXCEPTION 'invalid_images'; END IF;
 -- Edits made by normal members must be reviewed again; staff edits preserve current state.
 IF NOT v_staff THEN v_status:='pending'; END IF;
 UPDATE public.albam09_explorer_posts SET
  board=p_board,title=btrim(p_title),summary=left(btrim(coalesce(p_summary,'')),300),
  content=btrim(p_content),venue_name=left(btrim(coalesce(p_venue_name,'')),100),
  location_text=left(btrim(coalesce(p_location_text,'')),220),images=p_images,
  status=v_status,updated_at=now(),
  published_at=CASE WHEN v_status='published' THEN coalesce(published_at,now()) ELSE NULL END
 WHERE id=p_post_id;
 RETURN jsonb_build_object('id',p_post_id,'slug',v_slug,'status',v_status);
END; $$;
REVOKE ALL ON FUNCTION public.albam09_update_explorer_post(uuid,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.albam09_update_explorer_post(uuid,text,text,text,text,text,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.albam09_delete_explorer_post(p_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_uid uuid:=auth.uid(); v_author uuid;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
 SELECT author_id INTO v_author FROM public.albam09_explorer_posts
 WHERE id=p_post_id AND is_deleted=false FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'post_not_found'; END IF;
 IF v_uid<>v_author AND NOT public.albam09_is_staff(v_uid) THEN RAISE EXCEPTION 'not_allowed'; END IF;
 UPDATE public.albam09_explorer_posts SET is_deleted=true,status='hidden',updated_at=now() WHERE id=p_post_id;
END; $$;
REVOKE ALL ON FUNCTION public.albam09_delete_explorer_post(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.albam09_delete_explorer_post(uuid) TO authenticated;

-- 09 staff approves/rejects comments; never exposes unpublished comments to anon.
CREATE OR REPLACE FUNCTION public.albam09_moderate_explorer_comment(p_comment_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.albam09_is_staff(auth.uid()) THEN
   RAISE EXCEPTION 'admin_required';
 END IF;
 IF p_status NOT IN ('published','rejected') THEN RAISE EXCEPTION 'invalid_status'; END IF;
 UPDATE public.albam09_explorer_comments SET status=p_status,updated_at=now()
 WHERE id=p_comment_id AND is_deleted=false AND status IN ('pending','rejected');
 IF NOT FOUND THEN RAISE EXCEPTION 'comment_not_found_or_already_reviewed'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.albam09_moderate_explorer_comment(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.albam09_moderate_explorer_comment(uuid,text) TO authenticated;

-- Read access for public approved comments, own comments, 09 staff (not 08 roles).
DROP POLICY IF EXISTS albam09_comments_read ON public.albam09_explorer_comments;
CREATE POLICY albam09_comments_read ON public.albam09_explorer_comments FOR SELECT
USING ((status='published' AND is_deleted=false)
       OR (auth.uid()=author_id AND is_deleted=false)
       OR public.albam09_is_staff(auth.uid()));
GRANT SELECT ON public.albam09_explorer_comments TO anon,authenticated;
COMMIT;
-- Only schema and permissions changed; no rows deleted and no staff roles modified.
SELECT 'albam09_admin_comments_patch_applied' AS result;
