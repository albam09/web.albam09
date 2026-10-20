# 게시판 이미지·카카오 이모티콘 붙여넣기 수정 (2026-10-21)

- /bubble-alba/ 최고관리자 공고 본문: 카카오 CDN 이미지 주소, [image](주소), ![설명](주소)를 안전하게 렌더링. 이미지 파일 Ctrl+V 또는 파일 선택은 Supabase `albam09-explore` 버킷으로 관리자 로그인 상태에서 저장 시 업로드. 기존 8MB/8장 제한 유지.
- /bubble-alba/ 비회원 댓글: 이미지 URL/카카오 이모티콘 주소를 텍스트로 붙여넣으면 승인 후 화면에 이미지로 렌더링. **비회원 이미지 파일 바이너리 직접 업로드는 불가** (스토리지 악용 방지).
- /explore/write/: 복사한 JPG/PNG/WEBP 이미지의 붙여넣기를 첨부 이미지로 추가. URL 이미지는 본문에 작성하면 이미지로 렌더링.
- /explore/post/: 본문·댓글에서 URL 기반 이미지 렌더링.
- 정적 Netlify 빌드 `scripts/build-site.mjs`는 브라우저와 공통 `js/inline-media.js` 렌더러를 사용하여 Googlebot용 HTML과 실제 화면 일치.
- 원격 Kakao CDN에서 직접 이미지를 제공하는 경우 서비스 측 핫링크 차단/만료로 안 보일 수 있으므로, 확실한 공개 이미지는 원본 파일 복사·붙여넣기로 업로드 권장. 애니메이션은 브라우저 클립보드 형식에 따라 단일 프레임으로 변할 수 있음.
- GitHub의 기존 경로를 유지해서 변경 파일을 올려야 하며 Netlify 빌드 성공을 확인. DB SQL 변경 불필요.
- 원격 HTML 임의 삽입 금지, https 안전 URL만 허용, 텍스트는 HTML escape, 외부 URL은 noreferrer 적용.
