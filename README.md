# SAKAK Software Engineer (Frontend) 기술 과제

두 과제를 하나의 pnpm 워크스페이스로 구성했습니다.

| 디렉터리 | 과제 | 문서 |
|---|---|---|
| [`algorithm/`](./algorithm) | 1. 개미수열 (Look and Say Sequence) | [algorithm/README.md](./algorithm/README.md) |
| [`frontend/`](./frontend) | 2. 개인 맞춤형 건강 분석 대시보드 | [frontend/README.md](./frontend/README.md) |

## 빠른 시작

```bash
pnpm install     # 저장소 루트에서 1회
pnpm test        # 전체 테스트 (알고리즘 9 + 프론트엔드 28)
```

각 과제의 실행 방법과 설계 설명은 위 표의 개별 README에 있습니다.

## 개발 환경

- Node.js 22+ / pnpm 10
- TypeScript, Vitest (공통)

## 커밋 규칙

Conventional Commits 형식(`<type>(<scope>): <subject>`)을 사용했습니다.

- `type` — `feat` / `fix` / `test` / `refactor` / `docs` / `chore`
- `scope` — `algorithm` / `frontend` / `root`
- 예: `feat(frontend): CANDiY API 연동 레이어 및 프록시 라우트 구현`

작업 단위를 기능별로 나누어 커밋했으며, 본문에 변경 사유와 설계 판단을 남겼습니다.
