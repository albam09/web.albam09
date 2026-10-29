# albam09 2026-10-30 URL/관련검색어 후속 점검

## 실제 수정
- 8개 지역의 관련검색어 링크에서 문구·기사 제목이 불일치한 **9건** 정정. 특히 상무지구 후기→풀살롱, 가라오케 위치→야구장 가격처럼 명백히 다른 문서로 연결된 링크 2건을 교체.
- 모든 지역 HTML head에 소스 버전 식별 메타를 추가. 향후 UTM URL과 일반 URL에서 서로 다른 이전 수정본이 나올 때 버전을 비교할 수 있음.
- `_headers`의 `/page/*` HTML 응답에 브라우저 재검증 캐시 정책 추가. 이미지·폰트·기존 CSS·JS 캐시 정책은 그대로 둠.
- `scripts/verify-url-variants.mjs`: 로컬에서는 8개 canonical과 링크 및 버전 마커 검사, 네트워크 허용 환경에서는 `--live`로 UTM 포함/미포함 HTML의 제목·소스 해시를 비교. 버전 차이 발견 시 실패하도록 함.

## UTM 관련 원칙
- 추적 파라미터는 리디렉션을 반드시 발생시켜야 하는 것이 아닙니다. 사용자가 입력한 `?utm_source=chatgpt.com` 주소를 열어도 같은 정적 지역 페이지가 노출되고, HTML은 `https://albam09.com/page/karaoke1/`를 canonical로 선언합니다.
- `?utm_source`를 강제 301로 제거하지 않았습니다. 트래픽 분석용 캠페인 속성이 소실되는 것을 막기 위함입니다.
- 이번 수정은 기존 운영 사이트의 캐시나 배포 상태를 실시간 변경한 것이 **아닙니다**. 다른 HTML이 보이는 원인을 배포 전 단정할 수 없습니다.

## 배포 후 실제 검증 방법
1. ZIP 전체를 사용 중인 배포 소스에 적용한 뒤 Netlify에서 새 Deploy 완료를 확인합니다.
2. 도메인 접속 상태에서 `node scripts/verify-url-variants.mjs --live` 실행. PC에 Node.js가 설치된 환경만 지원.
3. 두 URL의 HTML 버전/내용이 다르면 응답 헤더 `Age`, `ETag`, `Cache-Control`, CDN 배포 ID와 HTML 마커를 대조합니다.
4. Search Console의 URL 검사에서 선언된 canonical과 Google이 선택한 canonical을 비교합니다.

## 보존 항목
원본 64개 업체, 8개 페이지 주소, Supabase 회원·메시지, BBS 및 탐험기 원본 글, 폰트·사진·이미지 비율·메뉴·기존 JS, SEO 태그 기본 내용 유지.
