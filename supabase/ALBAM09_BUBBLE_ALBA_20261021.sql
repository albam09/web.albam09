-- 광주버블여지도 / 버블알바 단일 게시판
-- 선행 조건: 기존 09 테이블 public.albam09_staff 및 권한함수 public.albam09_is_super(uuid).
-- 변경 범위: albam09_bubble_alba_* 신규 테이블·함수·RLS·빌드 트리거만 추가.
-- 기존 08 profiles/auth, 09 탐험기 댓글·게시글은 변경하지 않습니다.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.albam09_staff') IS NULL OR to_regprocedure('public.albam09_is_super(uuid)') IS NULL THEN
    RAISE EXCEPTION '09 최고관리자 권한함수/테이블이 없습니다. 기존 09 스키마를 먼저 확인하세요.';
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.albam09_bubble_alba_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 5 AND 110),
  summary text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 240),
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 20 AND 8000),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  is_deleted boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS albam09_bubble_alba_posts_live_idx
  ON public.albam09_bubble_alba_posts (published_at DESC)
  WHERE status='published' AND is_deleted=false;
CREATE TABLE IF NOT EXISTS public.albam09_bubble_alba_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.albam09_bubble_alba_posts(id) ON DELETE CASCADE,
  guest_name text NOT NULL CHECK (char_length(btrim(guest_name)) BETWEEN 2 AND 24),
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 2 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected')),
  visitor_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_id uuid
);
CREATE INDEX IF NOT EXISTS albam09_bubble_alba_comments_post_idx ON public.albam09_bubble_alba_comments(post_id,created_at);
CREATE INDEX IF NOT EXISTS albam09_bubble_alba_comments_spam_idx ON public.albam09_bubble_alba_comments(visitor_fingerprint,created_at);
ALTER TABLE public.albam09_bubble_alba_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albam09_bubble_alba_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bubble_alba_posts_read ON public.albam09_bubble_alba_posts;
CREATE POLICY bubble_alba_posts_read ON public.albam09_bubble_alba_posts FOR SELECT TO anon,authenticated
 USING ((status='published' AND is_deleted=false) OR public.albam09_is_super(auth.uid()));
DROP POLICY IF EXISTS bubble_alba_comments_read ON public.albam09_bubble_alba_comments;
CREATE POLICY bubble_alba_comments_read ON public.albam09_bubble_alba_comments FOR SELECT TO anon,authenticated
 USING (
  (status='published' AND EXISTS (
   SELECT 1 FROM public.albam09_bubble_alba_posts p WHERE p.id=post_id AND p.status='published' AND p.is_deleted=false
  )) OR public.albam09_is_super(auth.uid())
 );
REVOKE ALL ON public.albam09_bubble_alba_posts,public.albam09_bubble_alba_comments FROM anon,authenticated;
GRANT SELECT ON public.albam09_bubble_alba_posts,public.albam09_bubble_alba_comments TO anon,authenticated;

-- 관리자는 UI 숨김만이 아닌 DB 함수 내부의 최고관리자 확인으로 제한.
CREATE OR REPLACE FUNCTION public.albam09_alba_save_post(
 p_id uuid,p_title text,p_summary text,p_content text,p_status text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid();v_id uuid;v_old timestamptz;
BEGIN
 IF v_uid IS NULL OR NOT public.albam09_is_super(v_uid) THEN RAISE EXCEPTION 'super_admin_required'; END IF;
 IF char_length(btrim(coalesce(p_title,''))) NOT BETWEEN 5 AND 110
 OR char_length(coalesce(p_summary,''))>240
 OR char_length(btrim(coalesce(p_content,''))) NOT BETWEEN 20 AND 8000
 OR coalesce(p_status,'') NOT IN ('draft','published') THEN RAISE EXCEPTION 'invalid_post'; END IF;
 IF p_id IS NULL THEN
   INSERT INTO public.albam09_bubble_alba_posts(author_id,title,summary,content,status,published_at)
   VALUES(v_uid,btrim(p_title),btrim(coalesce(p_summary,'')),btrim(p_content),p_status,CASE WHEN p_status='published' THEN now() ELSE NULL END)
   RETURNING id INTO v_id;
 ELSE
   UPDATE public.albam09_bubble_alba_posts SET title=btrim(p_title),summary=btrim(coalesce(p_summary,'')),
     content=btrim(p_content),status=p_status,
     published_at=CASE WHEN p_status='published' THEN coalesce(published_at,now()) ELSE NULL END,
     updated_at=now()
   WHERE id=p_id AND is_deleted=false RETURNING id INTO v_id;
   IF v_id IS NULL THEN RAISE EXCEPTION 'post_not_found'; END IF;
 END IF;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.albam09_alba_save_post(uuid,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.albam09_alba_save_post(uuid,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.albam09_alba_remove_post(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.albam09_is_super(auth.uid()) THEN RAISE EXCEPTION 'super_admin_required'; END IF;
 UPDATE public.albam09_bubble_alba_posts SET is_deleted=true,status='draft',published_at=NULL,updated_at=now()
 WHERE id=p_id AND is_deleted=false;
 IF NOT FOUND THEN RAISE EXCEPTION 'post_not_found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.albam09_alba_remove_post(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.albam09_alba_remove_post(uuid) TO authenticated;

-- 비회원도 댓글 접수 가능. DB에서는 직접 INSERT 금지, 제한된 RPC만 허용.
-- IP가 프록시 헤더로 제공될 때 날짜별 익명 해시를 이용해 과도한 반복 제출 제한.
-- X-Forwarded-For는 우회될 수 있으므로 공개 운영에서는 CAPTCHA/Turnstile 추가를 권장.
CREATE OR REPLACE FUNCTION public.albam09_alba_submit_comment(
 p_post_id uuid,p_guest_name text,p_content text,p_company text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid;v_headers jsonb;v_ip text;v_key text;
BEGIN
 IF char_length(btrim(coalesce(p_company,'')))>0 THEN RAISE EXCEPTION 'submission_blocked'; END IF;
 IF char_length(btrim(coalesce(p_guest_name,''))) NOT BETWEEN 2 AND 24 OR
    char_length(btrim(coalesce(p_content,''))) NOT BETWEEN 2 AND 1000 THEN RAISE EXCEPTION 'invalid_comment'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.albam09_bubble_alba_posts
   WHERE id=p_post_id AND status='published' AND is_deleted=false) THEN RAISE EXCEPTION 'post_unavailable'; END IF;
 BEGIN v_headers := nullif(current_setting('request.headers',true),'')::jsonb;
 EXCEPTION WHEN OTHERS THEN v_headers:='{}'::jsonb; END;
 v_ip := split_part(coalesce(v_headers->>'cf-connecting-ip',v_headers->>'x-real-ip',v_headers->>'x-forwarded-for',''),',',1);
 IF v_ip <> '' THEN
   v_key := md5('alba-visitor-'||current_date::text||'-'||left(v_ip,80));
   IF EXISTS(SELECT 1 FROM public.albam09_bubble_alba_comments
     WHERE visitor_fingerprint=v_key AND created_at>now()-interval '90 seconds') THEN
     RAISE EXCEPTION 'rate_limited'; END IF;
   IF (SELECT count(*) FROM public.albam09_bubble_alba_comments
     WHERE visitor_fingerprint=v_key AND created_at>now()-interval '1 hour')>=5 THEN
     RAISE EXCEPTION 'rate_limited'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public.albam09_bubble_alba_comments
   WHERE post_id=p_post_id AND guest_name=btrim(p_guest_name) AND content=btrim(p_content)
   AND created_at>now()-interval '10 minutes') THEN RAISE EXCEPTION 'duplicate_comment'; END IF;
 INSERT INTO public.albam09_bubble_alba_comments(post_id,guest_name,content,status,visitor_fingerprint)
 VALUES(p_post_id,btrim(p_guest_name),btrim(p_content),'pending',v_key) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.albam09_alba_submit_comment(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.albam09_alba_submit_comment(uuid,text,text,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.albam09_alba_moderate_comment(p_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.albam09_is_super(auth.uid()) THEN RAISE EXCEPTION 'super_admin_required'; END IF;
 IF p_status NOT IN ('published','rejected') THEN RAISE EXCEPTION 'invalid_status'; END IF;
 UPDATE public.albam09_bubble_alba_comments SET status=p_status,reviewed_at=now(),reviewer_id=auth.uid()
 WHERE id=p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'comment_not_found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.albam09_alba_moderate_comment(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.albam09_alba_moderate_comment(uuid,text) TO authenticated;

-- 기존 Netlify Build Hook (Vault) 사용. 신규 토큰/키는 생성하지 않음.
-- 기존 탐험기 빌드 함수를 다른 테이블에 그대로 걸면 OLD/NEW 컬럼은 동일 명칭
-- (status,is_deleted)을 사용하므로 공고 테이블에만 연동 가능.
DO $$ BEGIN
 IF to_regprocedure('public.albam09_explorer_netlify_rebuild()') IS NOT NULL THEN
  DROP TRIGGER IF EXISTS albam09_bubble_alba_netlify_rebuild ON public.albam09_bubble_alba_posts;
  CREATE TRIGGER albam09_bubble_alba_netlify_rebuild AFTER INSERT OR UPDATE OR DELETE
  ON public.albam09_bubble_alba_posts FOR EACH ROW
  EXECUTE FUNCTION public.albam09_explorer_netlify_rebuild();
 ELSE
  RAISE NOTICE '탐험기 Netlify Hook 함수가 없어 버블알바 게시글 자동 재빌드 트리거는 생략되었습니다.';
 END IF;
END $$;
-- 댓글 승인 후 HTML에서도 최신 내용 반영하려면 status 변경 시 동일 Hook을 호출하는 래퍼를 설치.
CREATE OR REPLACE FUNCTION public.albam09_alba_comment_rebuild()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_hook text;
BEGIN
 IF (OLD.status='published') IS DISTINCT FROM (NEW.status='published') THEN
  SELECT decrypted_secret INTO v_hook FROM vault.decrypted_secrets
   WHERE name='albam09_netlify_explore_build_hook' LIMIT 1;
  IF v_hook LIKE 'https://api.netlify.com/build_hooks/%' THEN
    PERFORM net.http_post(url:=v_hook, body:='{"source":"albam09_bubble_alba_comments"}'::jsonb,
     headers:='{"Content-Type":"application/json"}'::jsonb,timeout_milliseconds:=10000);
  END IF;
 END IF;
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN
 RAISE WARNING '버블알바 댓글 Netlify hook 호출 실패: %', SQLERRM;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.albam09_alba_comment_rebuild() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS albam09_bubble_alba_comment_rebuild ON public.albam09_bubble_alba_comments;
CREATE TRIGGER albam09_bubble_alba_comment_rebuild AFTER UPDATE OF status
ON public.albam09_bubble_alba_comments FOR EACH ROW
EXECUTE FUNCTION public.albam09_alba_comment_rebuild();
COMMIT;
-- 검증 쿼리: 기존 데이터 영향 없이 09 전용 게시판 설치 확인.
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'albam09_bubble_alba_%' ORDER BY table_name;
