# 팝업 전체 코드 교차 점검 (2026-10-27)

- 기준: ARTICLE_SCHEMA_URL_FIXED 전체 ZIP (기존 기사 구조화 데이터 수정 포함)
- 조사: index.html, css/index-coupon-popup.css, js/index-coupon-popup.js 및 팝업 호출과 저장 조건
- 직접 확인된 버그: 팝업 JS가 `/` 또는 `/index.html` 외의 주소에서 무조건 종료하여 Windows file:// 경로에서는 표시되지 않음
- 모바일에서 숨겨질 수 있는 원인: 오늘 그만보기 localStorage / cookie (사용자 선택에 따른 정상 숨김)
- 레이아웃 위험: 작은 모바일 CSS overflow:hidden이 컨텐츠 일부 잘라내기 가능
- 수정: 홈에서만 포함된 JS의 pathname 차단 삭제; 모바일 자연 높이 + 화면 크기에 따른 zoom 보정; JS/CSS 캐시버전 갱신
- 테스트: URL 끝 `?showCoupon=1` 로 오늘 그만보기를 무시하고 팝업만 미리보기 가능. 정상 접속은 종전처럼 오늘 그만보기 유지.
- 기존 서비스: Supabase 설정, 기사, canonical, SEO, 지역 컨텐츠, 이미지 변경하지 않음
- 참고: 외부 사이트 배포 및 실제 휴대전화 GUI 검증은 별도로 필요
