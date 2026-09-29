# AGENTS.md

이 저장소에서 작업하는 코딩 에이전트를 위한 규칙.

## 프로젝트 개요

**Workset** (임시 코드네임, 최종 명칭 미정) — 사지방처럼 매번 초기화되는 공용 PC에서, 설치나 저장 없이 짧은 URL 하나로 작업 환경(자주 쓰는 웹앱 묶음)을 복원하는 서비스.

핵심 제약: **사용자는 그 PC에 아무것도 설치할 수 없고, 어떤 설정도 저장되지 않는다.** 확장 프로그램·브라우저 설정 변경·프로필 저장에 의존하는 해법은 전부 무효다.

## 기술 스택

- **프론트엔드(`public/`)**: 순수 HTML/CSS/JavaScript. 빌드 스텝·번들러·의존성 없음. 여기에는 어떤 패키지도 도입하지 않는다.
- **서버(`netlify/functions/`, `netlify/lib/`)**: Netlify Functions(Node). 허용된 의존성은 `@netlify/blobs` **하나뿐**이다. 그 외 의존성·테스트 러너·번들러를 새로 도입하지 말 것.
- `package.json`은 위 서버 의존성 전용이다. 빌드 명령은 없다.
- 배포: Netlify Git 연동 (`main` 푸시 시 자동 배포). publish 디렉터리는 `public/` — 루트의 `package.json`·`node_modules`가 사이트로 배포되지 않게 하기 위함.

## 구조

| 경로 | 역할 |
| --- | --- |
| `public/index.html` | `workset.my` 루트 — 소개, 주소 신청폼(Netlify Forms), 개인정보 안내 |
| `public/launcher.html` | `workset.my/{slug}` — 런처. `netlify.toml`의 `/:slug` 리라이트로 서빙 |
| `public/admin.html` | 관리자 주소 발급·PIN 재설정 (헤더 `x-admin-key`, 환경변수 `ADMIN_KEY`) |
| `netlify/functions/*.mjs` | `/api/sets/:slug`(GET·PUT), `/api/sets/:slug/auth`(POST), `/api/admin/sets`(POST) |
| `netlify/lib/sets.mjs` | 검증·PIN 해시·잠금 로직. 저장소를 인자로 받는 순수 로직 |

## 절대 규칙

### 1. `window.open()` 금지

Chrome은 **사용자 제스처 1회당 자동으로 열리는 창을 1개까지만** 허용한다. 동기 호출이어도 두 번째부터 팝업으로 차단된다. 우회 불가능한 브라우저 정책이며, 이 프로젝트는 이미 이 방식으로 한 번 실패했다 (`public/archive/phase0.html`).

대신 **실제 `<a href target="_blank">` 링크를 사용자가 Ctrl+클릭 / Ctrl+Enter로 여는 방식**을 쓴다. 사용자가 직접 연 링크는 팝업 차단 대상이 아니고, 배경 탭으로 열려 포커스가 현재 페이지에 남는다.

### 2. Ctrl+Enter에 `preventDefault` 금지

걸면 링크가 열리지 않아 기능 자체가 죽는다. 단독 Enter만 선택적으로 차단한다.

### 3. 키 입력 핸들러 필수 가드

```js
if (e.isComposing || e.keyCode === 229) return;  // IME(한글) 조합 중
if (e.repeat) return;                             // 키 리피트
```

한글 입력이 기본 상태인 PC가 많아 IME 가드가 없으면 핵심 동작이 막힌다.

### 4. 클라이언트 상태 저장에 의존하지 않기

`localStorage`·쿠키는 대상 PC가 초기화되면 사라진다. 세션 내 임시 상태에만 `sessionStorage`를 쓰되, **실패해도 앱이 정상 동작해야 한다** (try/catch 필수).

영속 데이터(slug별 앱 목록)는 서버(Netlify Blobs)만 저장한다. 운영(`production` 컨텍스트)만 전역 스토어를 쓰고, 미리보기·브랜치 배포는 배포별 스토어를 쓴다 — 테스트가 실제 데이터를 덮어쓰지 않게 하기 위함이다.

### 4-1. 저장된 URL은 http/https만

저장된 앱 주소는 그대로 `<a href>`가 된다. `javascript:` 등 다른 스킴은 서버에서 거절한다. 공개 조회 API는 PIN 해시·잠금 정보를 절대 응답에 싣지 않는다.

### 5. `public/archive/` 수정 금지

이전 단계의 실험 기록이다. 실패 사례 자체가 의사결정 근거이므로 내용을 고치거나 지우지 않는다.

### 6. 브랜드명 고정하지 않기

`workset`은 임시 코드네임이다. 새 제품명을 지어내거나 확정된 것처럼 쓰지 말 것.

## 작업 방식

- `main` 직접 푸시 금지. 브랜치 + PR로 제출한다.
- 요청되지 않은 리팩터링·스타일 정리·의존성 추가를 하지 않는다.
- 브라우저 실동작 중 Ctrl+Enter 배경 탭, 사지방 PC 동작 등은 사람이 확인해야 한다. 사람이 확인해야 하는 항목은 PR 설명에 체크리스트로 명시한다.

## 디자인 방침

기능은 최대한 단순하게 유지하고, 화면 구조를 복잡하게 만들지 않는다. 현재 단계에서는 색·폰트 실험 없이 여백과 정렬 수준만 정돈한다.
