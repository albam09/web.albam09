# 09 댓글·관리자 권한 수정 안내

- 기본 사용자 = user: `public.albam09_staff`에 행이 없는 경우. 공용 `public.profiles.role`은 절대 변경하지 않음.
- 기존 09 admin 승급은 초기화하며 super_admin만 보존. **주의: SQL 실행 전 이 변경을 승인한 운영자만 적용.**
- 09 최고관리자: `/admin/`에서 일반 회원을 `관리자로 승급` / `일반 회원으로 전환` 가능.
- 일반 관리자: 공개되지 않은 검토 댓글 포함 전체 댓글 조회는 `albam09_is_staff(auth.uid())` 기준. 일반 회원은 공개 댓글 + 자기 댓글만 조회.
- Supabase SQL Editor에서 `supabase/ALBAM09_ROLE_COMMENT_VISIBILITY_FIX_20261020.sql`을 **한 번** 실행해야 RLS와 권한이 반영됨.
- SQL이 실행되기 전 JS 변경만으로는 RLS 권한 문제가 해결되지 않음.
- 새 파일은 GitHub 같은 경로로 반영. 자동 배포가 일어나므로 운영 중 다른 변경과 충돌하는지 검증할 것.
- 탐험기 수정/삭제 버튼 복구와 운영자 탐험기 편집 기능은 포함하되 실제 실서버 계정 UI 클릭은 미검증.
