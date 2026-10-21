-- 09 탐험기: 공개 댓글 작성/승인/수정/숨김/삭제 시 기존 Netlify 자동 빌드 재사용.
-- public.albam09_explorer_netlify_rebuild() 및 Vault Build Hook은 이미 설치되어 있어야 합니다.
-- 기존 댓글/회원 데이터 및 RLS 정책은 변경하지 않습니다.
BEGIN;
DO $guard$
BEGIN
  IF to_regprocedure('public.albam09_explorer_netlify_rebuild()') IS NULL THEN
    RAISE EXCEPTION '기존 09 탐험기 Netlify 자동 빌드 함수가 설치되지 않았습니다.';
  END IF;
END
$guard$;
DROP TRIGGER IF EXISTS albam09_explorer_comments_netlify_rebuild_trigger
  ON public.albam09_explorer_comments;
CREATE TRIGGER albam09_explorer_comments_netlify_rebuild_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.albam09_explorer_comments
FOR EACH ROW EXECUTE FUNCTION public.albam09_explorer_netlify_rebuild();
COMMIT;
SELECT tgname AS trigger_name, tgenabled AS enabled
FROM pg_trigger
WHERE tgrelid='public.albam09_explorer_comments'::regclass
AND tgname='albam09_explorer_comments_netlify_rebuild_trigger';
