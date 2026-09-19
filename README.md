# Workset

임시 코드네임 `workset`. 매번 초기화되는 공용 PC에서 설치나 로그인 정보 저장 없이, 짧은 주소 하나로 자주 쓰는 웹앱 묶음을 여는 런처입니다.

**배포 URL: https://myworkset.netlify.app/**

## 쓰는 법

주소를 열면 첫 항목에 포커스가 잡혀 있습니다. `Ctrl+Enter`(macOS는 `⌘+Enter`)를 세 번 누르면 됩니다.

- 앞의 두 항목은 배경 탭으로 열리고 포커스는 런처에 남습니다.
- 마지막 항목은 현재 탭을 대체해 런처가 자연스럽게 사라집니다. 이때 키캡이 `Enter` 하나로 바뀌는 것이 마지막이라는 신호입니다.
- 단독 Enter는 마지막 항목을 제외하고 차단되며, `Ctrl` 키캡이 흔들려 하나 더 눌러야 한다는 걸 알려줍니다.
- 중간에 자리를 떴다가 돌아오면 이미 연 항목은 완료 상태로 남아 있습니다. 탭을 닫으면 다음 세션은 처음부터 시작합니다.

## 진행 상태

| 단계 | 내용 | 결과 |
| --- | --- | --- |
| Phase 0 | 클릭 1회로 `window.open()` 3회 → 3개 탭 동시 오픈 | **FAIL** — Chrome이 제스처 1회당 창 1개만 허용 ([#1](https://github.com/minsung521/workset/issues/1)) |
| Phase 0.5 | `<a>` 링크를 Ctrl+클릭 / Ctrl+Enter로 여는 방식 검증 | **A1~A5 전부 PASS** ([#2](https://github.com/minsung521/workset/issues/2)) |
| Phase 1 | 계측 UI를 걷어낸 실사용 런처 | **진행 중** — 일주일 실사용 검증 |

## `archive/`

이전 단계의 검증 페이지입니다. 실패와 검증 기록 자체가 근거 자료이므로 내용을 수정하지 않고 그대로 둡니다.

- [`archive/phase0.html`](archive/phase0.html) — Phase 0 팝업 테스트 (`window.open()` 3회, 차단 로그 표시)
- [`archive/phase05.html`](archive/phase05.html) — Phase 0.5 검증 하네스 (keydown/click/blur 계측 로그, A1~A5 체크)
