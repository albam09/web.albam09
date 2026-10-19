-- 광주버블여지도09: 승인된 공개 탐험기 변경 시 Netlify 정적 빌드 재시작.
-- 기존 08 테이블·정책·회원 기능 변경 없음. albam09_explorer_posts 트리거만 추가.
-- 실행 전: Netlify Build hook 생성 (main 브랜치)
-- Supabase Vault Secret: name=albam09_netlify_explore_build_hook, value=Build hook URL
-- 사전 조건: Supabase pg_net, Vault 활성화.
-- Build hook URL은 절대로 GitHub/웹사이트/이 SQL에 직접 넣지 마세요.

DO $guard$
BEGIN
  IF to_regclass('public.albam09_explorer_posts') IS NULL THEN
    RAISE EXCEPTION '09 explorer posts table missing';
  END IF;
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE EXCEPTION 'Supabase Vault를 먼저 활성화하세요.';
  END IF;
  IF to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL THEN
    RAISE EXCEPTION 'Supabase pg_net 확장을 먼저 활성화하세요.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
    WHERE name = 'albam09_netlify_explore_build_hook'
      AND decrypted_secret LIKE 'https://api.netlify.com/build_hooks/%'
  ) THEN
    RAISE EXCEPTION 'Vault에 albam09_netlify_explore_build_hook 시크릿을 먼저 만들어 주세요.';
  END IF;
END;
$guard$;

CREATE OR REPLACE FUNCTION public.albam09_explorer_netlify_rebuild()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $body$
DECLARE
  hook_url text;
  needs_rebuild boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    needs_rebuild := NEW.status = 'published' AND NEW.is_deleted = false;
  ELSIF TG_OP = 'UPDATE' THEN
    -- 공개된 글의 수정, 승인, 숨김, 논리 삭제 포함. 대기 글끼리의 수정은 빌드하지 않음.
    needs_rebuild := (OLD.status = 'published' AND OLD.is_deleted = false)
                  OR (NEW.status = 'published' AND NEW.is_deleted = false);
  ELSIF TG_OP = 'DELETE' THEN
    needs_rebuild := OLD.status = 'published' AND OLD.is_deleted = false;
  END IF;

  IF needs_rebuild THEN
    SELECT decrypted_secret INTO hook_url
    FROM vault.decrypted_secrets
    WHERE name = 'albam09_netlify_explore_build_hook'
    LIMIT 1;
    IF hook_url IS NULL OR hook_url NOT LIKE 'https://api.netlify.com/build_hooks/%' THEN
      RAISE WARNING 'albam09 explorer: missing/invalid Netlify build hook in Vault';
    ELSE
      PERFORM net.http_post(
        url := hook_url,
        body := jsonb_build_object('source','albam09_explorer_posts','event',TG_OP),
        headers := '{"Content-Type":"application/json"}'::jsonb,
        timeout_milliseconds := 10000
      );
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 탐험기 승인/숨김 자체는 빌드 트리거 오류와 관계없이 진행. 오류는 Supabase 로그에 남김.
  RAISE WARNING 'albam09 explorer Netlify rebuild call failed: %', SQLERRM;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$body$;

REVOKE ALL ON FUNCTION public.albam09_explorer_netlify_rebuild() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS albam09_explorer_netlify_rebuild_trigger ON public.albam09_explorer_posts;
CREATE TRIGGER albam09_explorer_netlify_rebuild_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.albam09_explorer_posts
FOR EACH ROW EXECUTE FUNCTION public.albam09_explorer_netlify_rebuild();

-- 등록 확인(민감한 Build hook URL은 노출하지 않음)
SELECT tgname AS trigger_name, tgenabled AS enabled
FROM pg_trigger WHERE tgrelid='public.albam09_explorer_posts'::regclass
  AND tgname='albam09_explorer_netlify_rebuild_trigger';
