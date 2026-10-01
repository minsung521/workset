# Workset

임시 코드네임 `workset`. 매번 초기화되는 공용 PC에서 설치나 로그인 정보 저장 없이, 짧은 주소 하나로 자주 쓰는 웹앱 묶음을 여는 런처입니다.

**배포 URL: https://workset.my** — 각자의 런처는 `https://workset.my/{내주소}`

## 쓰는 법

`workset.my/{내주소}`를 열면 첫 항목에 포커스가 잡혀 있습니다. `Ctrl+Enter`(macOS는 `⌘+Enter`)를 앱 개수만큼 누르면 됩니다.

- 마지막 앞의 항목들은 배경 탭으로 열리고 포커스는 런처에 남습니다.
- 마지막 항목은 현재 탭을 대체해 런처가 자연스럽게 사라집니다. 이때 키캡이 `Enter` 하나로 바뀌는 것이 마지막이라는 신호입니다.
- 단독 Enter는 마지막 항목을 제외하고 차단되며, `Ctrl` 키캡이 흔들려 하나 더 눌러야 한다는 걸 알려줍니다.
- 중간에 자리를 떴다가 돌아오면 이미 연 항목은 완료 상태로 남아 있습니다. 탭을 닫으면 다음 세션은 처음부터 시작합니다.
- 런처 하단의 **목록 편집**에서 PIN을 입력하면 앱을 추가·삭제하고 순서를 바꿀 수 있습니다. 목록은 서버에 저장되어 어느 PC에서든 같게 열립니다.

## 주소 발급

1. 방문자가 루트(`workset.my`)의 신청폼으로 원하는 주소와 이메일을 남깁니다 (Netlify Forms).
2. 관리자가 신청을 확인하고 `workset.my/admin`에서 주소·초기 PIN·앱 목록으로 발급합니다.
3. 발급 안내 메일로 주소와 PIN을 전달합니다. PIN을 잊거나 5회 틀려 잠기면(10분) 관리 페이지에서 재설정합니다.

관리 API는 Netlify 환경변수 `ADMIN_KEY`(24자 이상)가 있어야 동작합니다.

## 진행 상태

| 단계 | 내용 | 결과 |
| --- | --- | --- |
| Phase 0 | 클릭 1회로 `window.open()` 3회 → 3개 탭 동시 오픈 | **FAIL** — Chrome이 제스처 1회당 창 1개만 허용 ([#1](https://github.com/minsung521/workset/issues/1)) |
| Phase 0.5 | `<a>` 링크를 Ctrl+클릭 / Ctrl+Enter로 여는 방식 검증 | **A1~A5 전부 PASS** ([#2](https://github.com/minsung521/workset/issues/2)) |
| Phase 1 | 계측 UI를 걷어낸 실사용 런처 | **PASS** — 7일 중 6일 사용, 마지막 이틀 무의식 실행 |
| Phase 2 | slug별 목록 저장·편집, 주소 신청·발급 | **진행 중** |

## `public/archive/`

이전 단계의 검증 페이지입니다. 실패와 검증 기록 자체가 근거 자료이므로 내용을 수정하지 않고 그대로 둡니다.

- [`public/archive/phase0.html`](public/archive/phase0.html) — Phase 0 팝업 테스트 (`window.open()` 3회, 차단 로그 표시)
- [`public/archive/phase05.html`](public/archive/phase05.html) — Phase 0.5 검증 하네스 (keydown/click/blur 계측 로그, A1~A5 체크)
