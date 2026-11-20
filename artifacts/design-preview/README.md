# 디자인 Before / After

저장소 루트에서 `npm run preview:design` 실행 후 <http://localhost:3100>을 여세요. `index.html`을 직접 열어도 사용할 수 있습니다.

- Before: GitHub `main`의 `016a045c5f9db9c2d38ae2fc5998b8b5030ec960` (2026-11-19 원격 확인)
- After: 로컬 `59547c43ed22adcf0ad96acb807376aa7d54dbdc`
- 히어로, 작업 공간, 가이드, 기획 01~06의 9개 화면
- 데스크톱 1440×1000 / 모바일 390×844, 각 버전 총 18장
- 나란히 보기, 슬라이더 겹쳐 보기, 원본 크기 확대, 화면별 링크 공유

실제 두 소스를 각각 실행해서 캡처한 정적 디자인 기록입니다. 앱의 최신 변경이 자동으로 반영되지는 않습니다. 애니메이션은 비교를 위해 정지했고, 개발 도구 표시만 숨겼습니다. 실제 사용자 저장소 대신 동일한 `fixture.json`을 별도의 브라우저 컨텍스트에 주입했습니다. AI 요청은 차단했습니다.

이전 버전의 Google Fonts 다운로드 문제를 피하기 위해 임시 실행본에서만 동일한 Instrument Serif 원본 폰트를 로컬로 불러왔습니다. 화면의 구성, 문구와 스타일은 해당 GitHub 커밋을 사용했습니다. `.design-preview-runtime/`은 비교 촬영용으로만 사용하며 Git, TypeScript 검사와 ESLint 대상에서 제외합니다.

재캡처하려면 Before 소스를 별도 경로에서 3101 포트로, After를 3000 포트로 실행합니다. `scripts/capture-design-preview.mjs`는 Playwright의 Page를 받아 `{ version: "before" | "after", viewport: "desktop" | "mobile" }` 조합별 캡처를 만듭니다. 브라우저 컨텍스트는 매번 닫으며 기존 사용자 데이터를 건드리지 않습니다. 새 기준으로 캡처할 때는 `manifest.json`과 프리뷰의 커밋 표시를 함께 갱신하세요.

새 라이브러리 설치 없이 Node.js 기본 모듈만으로 프리뷰 서버를 실행합니다. `DESIGN_PREVIEW_PORT`로 포트를 변경할 수 있습니다.
