# Workset — 런치 방식 검증

> ℹ️ Phase 0(팝업 동시 오픈)은 FAIL로 종결됐고([이슈 #1](https://github.com/minsung521/workset/issues/1)), 방식을 바꿔 **Phase 0.5로 재개됨**.

임시 코드네임 `workset`. 매번 초기화되는 공용 PC에서 설치·로그인 없이 자주 쓰는 웹앱 묶음을 한 번에 여는 방식이 실제 브라우저에서 성립하는지 검증하는 실험용 페이지 모음입니다.

---

## Phase 0.5 — Ctrl+Enter 런치 시퀀스 (진행 중)

`window.open()`을 버리고 실제 `<a>` 링크를 Ctrl+클릭 / Ctrl+Enter로 여는 방식. 브라우저가 "사용자가 링크를 연 것"으로 취급하므로 팝업 차단 대상이 아니고, 배경 탭으로 열려 포커스가 페이지에 남는다는 전제를 검증합니다.

- 파일: `phase05.html`
- 배포 URL: https://myworkset.netlify.app/phase05.html

### 검증할 가정

| # | 가정 | 깨졌을 때 |
| --- | --- | --- |
| A1 | Ctrl+클릭으로 연 링크는 팝업 차단을 받지 않는다 | 방향 전체 재검토 |
| A2 | Ctrl+클릭 시 포커스가 현재 페이지에 남는다 | 연속 실행 불가 |
| A3 | 링크에 포커스를 둔 상태의 Ctrl+Enter가 Ctrl+클릭과 동일하게 동작한다 | 키보드 플로우 포기 |
| A4 | 스크립트로 다음 링크에 포커스를 옮겨도 A3가 계속 유효하다 | 자동 포커스 이동 포기 |
| A5 | 사지방 Chrome에서 A1~A4가 동일하게 동작한다 | 환경별 분기 필요 |

A3·A4가 핵심입니다. 이 둘이 성립해야 "키 3번"이라는 UX가 가능합니다.

### 테스트 방법

1. 배포 URL을 순정 Chrome에서 엽니다. 첫 번째 링크에 자동으로 포커스가 잡힙니다.
2. `Ctrl+Enter`(macOS는 `⌘+Enter`) 또는 `Ctrl+클릭`으로 하나씩 실행합니다. 실행하면 다음 링크로 포커스가 넘어갑니다.
3. 단독 Enter는 마지막 항목을 제외하고 차단되며, Ctrl 키캡이 흔들립니다.
4. 마지막 항목은 새 탭이 아니라 현재 탭을 대체합니다.
5. 화면 하단 로그 패널에서 keydown / click / window blur·focus 기록을 확인하고, A1~A5를 PASS/FAIL로 체크한 뒤 `결과 복사`로 이슈에 붙여넣습니다.

검증 결과는 [이슈 #2](https://github.com/minsung521/workset/issues/2)에 기록합니다.

---

## Phase 0 — 팝업 동시 오픈 (종결: FAIL)

클릭/엔터 1회로 `window.open()`을 3회 호출해 3개 탭을 동시에 여는 방식을 검증했습니다. Chrome이 사용자 제스처 1회당 자동으로 열리는 창을 1개까지만 허용하기 때문에 첫 번째만 열리고 나머지는 차단됐습니다. 상세 결과는 [이슈 #1](https://github.com/minsung521/workset/issues/1) 참고.

- 파일: `index.html` (실패 기록 자체가 근거 자료이므로 보존)
- 배포 URL: https://myworkset.netlify.app/
