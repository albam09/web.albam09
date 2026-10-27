# albam09 2026-10-27 교차 점검 결과

기준: albam09_20261027_POPUP_FULL_CODE_REPAIR.zip (기존 콘텐츠/디자인/DB 파일 보존)

## 1. 쿠폰 팝업 실제 오류 해결
- 파일: js/index-coupon-popup.js
- 수정: document.cookie 접근이 SecurityError로 차단될 때 팝업 초기화가 중단되는 예외를 방지
- 수정: 오늘 그만보기 저장 시 쿠키 접근이 차단된 상황도 안전하게 처리
- 로컬 독립 브라우저 재현: 수정 전 320/375/390px에서 JS 예외와 hidden=true; 수정 후 모두 visible
- 화면 캡처로 320x568, 375x667, 390x760, 390x844에서 닫기/오늘 그만보기 가시성 확인
- ?showCoupon=1 진단용 강제 열기 유지. 기존 하루 숨기기 정책도 유지

## 2. Supabase WebSocket
- 회원/쪽지/탐험기, API 주소와 키, DB 설정은 변경하지 않음
- 수정: 익명 방문자가 상호작용하지 않은 페이지 첫 로드에서는 온라인 접속자 Presence WebSocket을 즉시 연결하지 않음
- 로그인 회원은 기존처럼 Presence와 쪽지 실시간 채널을 연결함
- 익명 방문자가 클릭/키 입력/터치하면 Presence를 시작함
- 제한: 이 변경은 검사 중 불필요한 익명 Presence 연결을 줄이는 것으로, DNS 장애 자체를 해결하지 않음
- 안내: 비상호작용 익명 이용자는 온라인 인원 집계에 포함되지 않는 동작 변화 있음

## 3. Google 토론 포럼 구조화 데이터
- BBS 정적 Article 61개에 datePublished, author, url이 있는 것을 파일에서 확인함
- DiscussionForumPosting은 js/explorer-post.js에서 동적으로 생성
- 수정: 댓글 데이터에 실제 본문/날짜/ID가 없으면 부정확한 Comment 구조화 데이터를 생성하지 않음
- author.url: 공개 작성자 프로필이 없으면 가짜 URL을 넣지 않음 (권장 속성 경고가 남을 수 있음)
- 기존 게시물 datePublished/author 및 글쓰기·댓글 작성/권한/DB 요청 코드는 그대로 유지

## 4. CLS
- index.html의 Albam09Cute.ttf preload를 스타일시트보다 먼저 선언해 글꼴 우선 로딩
- 기존 사용 글꼴, 본문/제목 글자 크기, CSS 선언은 변경하지 않음
- 0.162 CLS 하락은 아직 확인 불가: PageSpeed 재측정 및 실제 이동 요소 기록이 필요함

## 5. 유지 및 검증
- SQL/CSS/사진/BBS 본문/지역별 키워드/SEO Title·H1·canonical/sitemap 변경 없음
- 실제 외부 호스트 배포/모바일 실기기 및 Search Console 실시간 검사는 미완료
- ZIP 무결성, JS 문법, HTML JSON-LD 정적 검사 및 모바일 팝업 격리 브라우저 테스트 실행
