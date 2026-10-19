# albam09 탐험기 정적 HTML·sitemap 자동화 (2026-10-20)

## 현재 준비 상태
- `netlify.toml`: `node scripts/build-site.mjs`, publish `.` 유지. Netlify Dashboard Build command Not set은 `netlify.toml`이 있으면 정상.
- `scripts/build-site.mjs`: 승인된(`status=published`, `is_deleted=false`) **공개 글만** Supabase REST로 조회, `/explore/post/<slug>/index.html` + `/explore/archive/index.html` + sitemap 갱신.
- Supabase API 조회가 실패하면 배포를 실패 처리(공개 탐험기가 사라지는 잘못된 배포 방지).
- 재빌드 후 비공개/삭제된 글의 이전 생성 HTML을 제거. *생성 표시가 있는 폴더만* 제거해 기존 정적 파일은 보호.
- 개별 글 HTML에 canonical, HTML 본문/H1/글 작성 정보, schema, robots=index를 삽입하고 동적 글 템플릿은 기본적으로 noindex(미승인/존재하지 않는 슬러그의 빈 페이지 방지).
- 기존 `_redirects`의 `/explore/post/* ... 200`는 **강제 규칙이 아니므로** 생성된 실제 파일이 먼저 제공된다(Netlify 기본 shadowing).
- Supabase의 08 회원/기타 데이터 및 기존 게시글/댓글/권한 정책은 수정하지 않는다.

## 남은 실제 계정 작업 (운영 사이트 임의 배포 없음)
1. **GitHub**: 최신 소스에 이 수정본의 `scripts/build-site.mjs`, `explore/post/index.html`, SQL/README 문서를 반영해 `main`으로 커밋. 기존 다른 소스가 같다면 파일 2개 + 새 문서만 적용 가능.
2. **Netlify**: https://app.netlify.com/projects/albam09/configuration/developer-settings#build-hooks → `Add build hook` → 이름 `albam09-explorer-approved` / 브랜치 `main` → 생성한 **URL을 남에게 보내거나 GitHub에 넣지 말 것**.
3. **Supabase** (08과 공유 중인 기존 프로젝트 `ldyysvafgegsgmvpslui`): https://supabase.com/dashboard/project/ldyysvafgegsgmvpslui/integrations/vault (UI 메뉴 Database → Vault로 이동 가능). pg_net/Vault가 활성인지 확인하고 Vault에 아래 보안 시크릿 저장:
   - 이름: `albam09_netlify_explore_build_hook`
   - 값: 2단계에서 생성한 Netlify Build hook URL
4. **Supabase SQL Editor**: https://supabase.com/dashboard/project/ldyysvafgegsgmvpslui/sql/new 접속 → `supabase/EXPLORER_NETLIFY_AUTOBUILD_20261020.sql` 실행.
5. 새 글 승인 테스트: 운영자 탐험기 승인 → Netlify Deploys에서 `albam09-explorer-approved` 기반 Git 배포 확인 → `/explore/post/<slug>/` 페이지를 **페이지 소스 보기(Ctrl+U)** 했을 때 `<h1>` 실제 글 제목 및 `canonical` 존재, `sitemap.xml`에 slug 존재 확인.
6. 숨김 테스트: 글 숨김 후 재빌드 → sitemap에서 해당 글 URL 삭제, 해당 URL의 예전 실제 HTML이 남아 있지 않은지 확인. 과거 색인 제거는 Google 재방문에 따라 시간 소요.

### 알림
- GitHub에 파일을 커밋하면 Netlify는 연결된 `main`에서 자동 배포할 수 있으니 먼저 수정본이 최신 운영 사이트 소스와 동일한지 확인하자. 이 ZIP은 Netlify에 자동 업로드되지 않는다.
- 수동 ZIP 재배포에서는 `node scripts/build-site.mjs`가 실행되지 않으니, 새 승인글의 정적 HTML은 **Git 기반 빌드 배포가 운영 최신본이 되었을 때** 반영된다.
- 신규 글 승인 직후에는 빌드·배포가 완료될 때까지 기존 동적 URL로 보일 수 있다.
- Netlify Build hook URL은 자격 증명과 유사하므로 **외부 공개, 채팅 첨부, GitHub 커밋 금지**.
- Google의 크롤링과 색인은 보장할 수 없다. 이 개선은 크롤링 시 서버가 실제 글 HTML과 링크를 제공하도록 만들어 기술적 색인 가능성을 높이는 작업이다.
