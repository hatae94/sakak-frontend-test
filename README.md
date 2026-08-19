# SAKAK Software Engineer (Frontend) 기술 과제

두 과제를 하나의 pnpm 워크스페이스로 구성했습니다.

### 배포된 대시보드 → **https://sakak-frontend-test-frontend-gules.vercel.app**

이름을 입력해 로그인하면 조회 화면으로 들어갑니다. 검진 결과 조회는 국민건강보험공단 간편인증을 거치므로 본인 인증이 필요합니다.

---

## 과제 1. 개미수열 (Look and Say Sequence)

n번째 항의 가운데 두 자리를 반환합니다. 문제의 예시 표를 테스트로 먼저 옮기고 구현하는 순서로 진행했습니다.

**→ [algorithm/README.md](./algorithm/README.md)** — 풀이 방식, 복잡도 실측(n=40~62), 도달하지 못한 한계와 검토한 개선 방향

## 과제 2. 개인 맞춤형 건강 분석 대시보드

CANDiY API로 건강검진 결과를 조회해 시각화합니다. 2단계 간편인증, 13개 항목의 상태 판정, 수치 추이 그래프, 검진 이력 리스트를 포함합니다.

**→ [frontend/README.md](./frontend/README.md)** — 실행 방법, 사용 기술, 설계 상 판단(API Key 은닉·로그인 게이트·판정 기준), 개발가이드와 실제 API 응답의 차이

---

## 빠른 시작

```bash
pnpm install     # 저장소 루트에서 1회
pnpm test        # 전체 테스트 (알고리즘 9 + 프론트엔드 59)
```

프론트엔드를 로컬에서 실행하려면 API Key 설정이 필요합니다. [frontend/README.md](./frontend/README.md#실행-방법)를 참고하세요.

## 개발 환경

- Node.js 22+ / pnpm 10
- TypeScript, Vitest (공통)

## 커밋 규칙

Conventional Commits 형식(`<type>(<scope>): <subject>`)을 사용했습니다.

- `type` — `feat` / `fix` / `test` / `refactor` / `docs` / `chore`
- `scope` — `algorithm` / `frontend` / `root`
- 예: `feat(frontend): CANDiY API 연동 레이어 및 프록시 라우트 구현`

작업 단위를 기능별로 나누어 커밋했으며, 본문에 변경 사유와 설계 판단을 남겼습니다.
