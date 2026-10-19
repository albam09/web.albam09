-- albam09 ONLY. DO NOT change public.profiles.role: shared with albam08.
-- CAUTION: existing 09 admin users will revert to user. Run only if this is intended.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.albam09_staff') IS NULL OR to_regclass('public.albam09_explorer_comments') IS NULL THEN
   RAISE EXCEPTION 'Required albam09 tables are missing';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.albam09_staff WHERE level='super_admin') THEN
   RAISE EXCEPTION 'No super_admin found. Refusing permission migration.';
 END IF;
END $$;
-- Reset all NON-superadmin 09 staff members to default user.
DELETE FROM public.albam09_staff WHERE level='admin';
-- Normalize staff-read and comment-read RLS; do not touch shared profiles permissions.
DROP POLICY IF EXISTS albam09_staff_read ON public.albam09_staff;
CREATE POLICY albam09_staff_read ON public.albam09_staff FOR SELECT TO authenticated
USING (auth.uid()=user_id OR public.albam09_is_super(auth.uid()));
DROP POLICY IF EXISTS albam09_comments_read ON public.albam09_explorer_comments;
CREATE POLICY albam09_comments_read ON public.albam09_explorer_comments FOR SELECT
USING ((status='published' AND is_deleted=false) OR auth.uid()=author_id OR public.albam09_is_staff(auth.uid()));
GRANT SELECT ON public.albam09_staff TO authenticated;
GRANT SELECT ON public.albam09_explorer_comments TO anon,authenticated;
-- A 09 superadmin may ONLY promote to admin or revoke staff here;
-- never accidentally create additional superadmins through this UI.
CREATE OR REPLACE FUNCTION public.albam09_set_staff(p_user_id uuid,p_level text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.albam09_is_super(auth.uid()) THEN RAISE EXCEPTION 'super_admin_required'; END IF;
 IF p_user_id IS NULL THEN RAISE EXCEPTION 'user_required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id) THEN RAISE EXCEPTION 'profile_not_found'; END IF;
 IF EXISTS(SELECT 1 FROM public.albam09_staff WHERE user_id=p_user_id AND level='super_admin') THEN
   RAISE EXCEPTION 'cannot_modify_super_admin';
 END IF;
 IF p_level='admin' THEN
   INSERT INTO public.albam09_staff(user_id,level) VALUES(p_user_id,'admin')
   ON CONFLICT(user_id) DO UPDATE SET level='admin',updated_at=now();
 ELSIF p_level IS NULL THEN
   DELETE FROM public.albam09_staff WHERE user_id=p_user_id;
 ELSE RAISE EXCEPTION 'invalid_level'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.albam09_set_staff(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.albam09_set_staff(uuid,text) TO authenticated;
COMMIT;
-- Results show 09 staff only. Everyone else is user by default.
SELECT level,count(*) AS accounts FROM public.albam09_staff GROUP BY level ORDER BY level;
