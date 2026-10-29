# albam09 URL별 서로 다른 소개문 — 원인 조사·조치 결론 (2026-10-30)

## 조사 대상
- 기본 URL: https://albam09.com/page/karaoke1/
- 추적 URL: https://albam09.com/page/karaoke1/?utm_source=chatgpt.com

## 확인된 사실
1. 웹 수집본의 상단 소개문은 두 주소에서 다릅니다. 기본 URL의 문구 `상무지구에서 노래방과 가라오케를 찾는다면`은 보관된 `albam09_20261030_INDEX_TITLE_3_KEYWORDS_ADDED.zip`과 일치합니다. UTM URL의 문구 `치평동은 상무지구의 중심 상권입니다`는 더 나중에 생성된 `albam09_20261030_REGION_GUIDES_LANDMARK_PARKING_FULL.zip`과 일치합니다.
2. 두 보관본 모두 `rel=canonical` 주소는 `https://albam09.com/page/karaoke1/`입니다. `_redirects`에는 UTM 값을 보고 다른 HTML로 보내는 규칙이 없으며 `netlify.toml`에는 각 지역의 정적 index.html이 있습니다.
3. 점검한 JS에서 UTM 파라미터로 지역 소개문을 바꾸는 로직은 발견되지 않았습니다. query 처리 코드는 로그인 반환주소, 팝업 미리보기, 게시글 ID 등에 사용됩니다.
4. Netlify 공식 문서에 따르면 일반 정적 파일은 변경 배포 시 CDN 캐시가 무효화되며 브라우저 `Cache-Control` 기본값은 `public, max-age=0, must-revalidate`입니다. 따라서 `utm_source` 자체 때문에 서로 다른 버전의 정적 페이지를 제공하는 동작은 정상 기대값이 아닙니다.

## 조사 결론 — 확정된 부분과 불확실한 부분
**확정**: 서로 다른 페이지 버전의 내용이 웹 수집본에 남아 있습니다. `utm_source`는 별도의 새 페이지를 요구하거나 강제 리디렉션을 발생시키지 않습니다. 표준 canonical 설정도 일치합니다.

**현재로서는 확정할 수 없음**: 실제 동일 시각 운영 CDN이 URL별로 다른 HTML을 반환한다는 사실. 사용한 웹 수집 결과는 HTTP 원문·ETag·Cache-Status·Age를 제공하지 않으며, 외부 HTTP 환경에서도 DNS 접근이 차단됐습니다. 그러므로 "Netlify 캐시가 고장났다"고 단정하지 않습니다.

**가장 타당한 1차 진단**: 웹 수집 시스템이 URL별로 서로 다른 시점의 수정본을 저장했거나, 두 요청 시점 사이에 배포가 달라졌을 가능성. 실제 CDN/배포 분기는 동일 시각 `GET` 응답 해시와 응답 헤더 대조 이후에만 확정합니다.

## 권고·수정
- **현행 `karaoke1/` 주소 유지, 강제 301 UTM 제거 금지**: 전환 추적 파라미터와 연결을 무의미하게 변경할 이유가 없습니다.
- 각 지역 HTML에 **릴리스 마커**를 추가해 배포 버전 식별 가능하게 했습니다.
- 페이지 HTML은 다시 검증하도록 `_headers`에 명시적 `Cache-Control: public, max-age=0, must-revalidate`를 선언했습니다. **이는 Netlify 정적 페이지의 기본 브라우저 캐시 정책과 동일하므로, CDN 문제를 해결했다고 주장하지 않습니다.**
- `scripts/verify-url-variants.mjs` 및 `VERIFY_URL_WINDOWS.ps1`로 운영 서버의 **기본/UTM URL HTML 해시·릴리스·ETag·Cache-Status·Age**를 비교할 수 있게 했습니다. ZIP 파일의 로컬 검사는 통과했으며 실제 운영 응답은 배포 전·접근 제한 때문에 미검증입니다.
- 지역 키워드 영역에서 제목과 기사 주제가 어긋난 내부 링크 **9건을 정정**했습니다.

## 배포 후 분기별 최종 조치
- **두 요청의 SHA-256 값과 릴리스 마커가 같음**: 서버 문제는 재현되지 않음. 이전 크롤러 스냅샷 차이로 판단하고 추가 리디렉션이나 캐시 강제 비우기 불필요.
- **서로 다름**: Netlify Deploys에서 생산 배포 ID·배포 시간·도메인 연결을 확인하고 응답 헤더 `ETag`, `Age`, `Cache-Status`, `X-Nf-Request-Id`를 대조. 엣지 함수/프록시, Service Worker, 외부 CDN 경유 여부를 조사한 뒤, 운영 배포를 단일 버전으로 재배포하고 필요한 경우 캐시 무효화.
- **둘 다 같은 구버전**: 최신 ZIP이 아직 운영 서버에 배포되지 않은 상태. 배포 소스/브랜치와 실제 production publish 경로부터 검증.

운영 서버 또는 Netlify 설정을 사용자 승인 없이 변경하지 않았습니다.
