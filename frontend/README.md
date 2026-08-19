# 개인 맞춤형 건강 분석 대시보드

CANDiY API로 국민건강보험공단 건강검진 결과를 조회하고 시각화하는 프론트엔드입니다.

## 실행 방법

### 1. API Key 발급

[CANDiY 개발자 콘솔](https://developer.candiy.io/user/api-key)에서 회원가입 후 API Key를 발급합니다. (API 권한 전체 체크)

### 2. 환경변수 설정

```bash
cp frontend/.env.example frontend/.env.local
```

`.env.local`에 발급받은 키를 넣습니다.

```
CANDIY_API_KEY=발급받은_키
```

### 3. 개발 서버 실행

```bash
pnpm install              # 저장소 루트에서
pnpm --filter frontend dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 그 밖의 명령

```bash
pnpm --filter frontend build   # 프로덕션 빌드
pnpm --filter frontend test    # 테스트
pnpm --filter frontend lint    # 린트
```

### Docker로 실행

```bash
CANDIY_API_KEY=발급받은_키 docker compose up --build
```

## 사용 기술

| 분류 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) | Route Handler로 API Key를 서버에 은닉 |
| 언어 | TypeScript | |
| 스타일링 | Tailwind CSS v4 | |
| 서버 상태 | TanStack Query | 인증 2단계의 로딩/에러 상태 관리 |
| 검증 | Zod | 폼과 프록시 라우트가 같은 스키마를 공유 |
| 시각화 | Recharts | 검진 수치 추이 |
| 테스트 | Vitest | |

## 주요 기능

### 건강검진 조회 (2단계 인증)

```
입력 폼 → 1차 인증 요청 → 인증 대기(만료 카운트다운) → 2차 추가인증 → 대시보드
```

간편인증 만료 시간(4분 30초)을 화면에 표시하고, 만료 시 재시작을 안내합니다.

### 최근 건강검진 대시보드

- 정상 / 주의 / 위험 / 정보 없음 개수 요약
- 13개 항목별 카드 — 좌측 색상 바 + 상태 배지 + 공단 참고치
- 검진 2회 이상이면 항목별 수치 추이 그래프

### 과거 이력 리스트

검진일 기준 최신순 목록. 검진기관·검진종류·종합판정과 해당 회차의 상태 집계를 함께 표시합니다.

### 부가 기능

Mock 로그인(이름 입력)과 사용자명 맞춤 문구를 제공합니다.

**예시 데이터 모드** — 조회 화면 하단의 "예시 데이터로 보기" 버튼을 누르면 API Key와 간편인증 없이 대시보드·검진 이력 화면을 확인할 수 있습니다. 실제 응답과 동일한 스키마의 가상 수치이며, 정상·주의·위험 세 가지 판정이 모두 나타나도록 구성했습니다.

## 설계 상 판단

### API Key를 서버에 둔 이유

브라우저에서 CANDiY를 직접 호출하면 API Key가 번들과 네트워크 탭에 노출됩니다. Route Handler(`app/api/checkup/*`)를 프록시로 두어 키가 서버 환경변수에만 존재하도록 했습니다. `lib/candiy/client.ts`는 `server-only`를 import 하므로, 실수로 클라이언트에서 참조하면 빌드가 실패합니다.

CANDiY가 요구하는 `id`(SSO 식별값)는 클라이언트를 신뢰하지 않고 서버에서 발급해 httpOnly 쿠키에 보관합니다. 1차와 2차 요청이 같은 값을 써야 하기 때문입니다.

### 문서와 실제 동작의 차이

#### 인증 헤더 이름 (직접 확인)

개발가이드는 API Key를 `api-key` 헤더로 보내라고 안내하지만, **실제 게이트웨이는 `x-api-key`만 인정합니다.** `api-key`로 보내면 요청이 애플리케이션에 닿기 전에 403 Forbidden으로 차단됩니다.

연동이 403으로 막혀 헤더 후보를 하나씩 확인해 찾아냈습니다.

| 헤더 | 결과 |
|---|---|
| `api-key` (문서 안내) | 403 Forbidden |
| `apiKey` | 403 Forbidden |
| `Authorization: Bearer` | 403 Forbidden |
| **`x-api-key`** | **200 OK** |

Base URL도 문서 간 차이가 있습니다. Postman 가이드는 `https://1api.candiy.io`로 안내하지만 해당 호스트는 응답하지 않았고, 검진 API 문서의 `https://api.candiy.io`가 정상 동작했습니다. 환경에 따라 달라질 수 있어 `CANDIY_API_BASE_URL`로 교체 가능하게 했습니다.

#### 응답 필드

과제 안내문에 명시된 항목과, 실제 연동 중 직접 확인한 항목을 함께 정리했습니다. 모두 `lib/candiy/normalize.ts`에서 처리합니다.

| 항목 | 문서 | 실제 | 처리 | 출처 |
|---|---|---|---|---|
| `resultList[].caseType` | String | Number | 문자열로 통일 | 안내문 |
| `resultList[].infantsCheckupList` | 없음 | 빈 배열 | 누락 시 `[]` 보정 | 안내문 |
| `resultList[].infantsDentalList` | 없음 | 빈 배열 | 누락 시 `[]` 보정 | 안내문 |
| `referenceList[].refType` | `정상A` | **`정상(A)`** | 괄호·공백 제거 후 비교 | 직접 확인 |
| `overviewList[].waists` | `waists` | **`waist`** | 두 표기 모두 허용 | 직접 확인 |
| `resultList[].checkupFindings` | 없음 | **존재** (검진 소견) | 타입에 추가 | 직접 확인 |

`refType` 불일치는 실제 조회 후 참고치가 화면에 표시되지 않아 발견했습니다. 문서 표기(`정상A`)로 매칭하고 있었기 때문입니다. 표기가 또 바뀌어도 깨지지 않도록 괄호와 공백을 제거한 뒤 비교하며, 세 가지 표기 변형을 테스트로 고정했습니다.

화면 컴포넌트가 이 차이를 알 필요가 없도록 한 곳에 격리했습니다.

### 건강 상태 판정 기준

응답의 `referenceList`에 공단이 제공하는 정상A / 정상B / 질환의심 참고치가 담겨 있어, 이를 카드에 그대로 표시합니다. 색상 판정은 국가건강검진 일반 기준을 `METRIC_DEFS`에 명시했습니다.

혈압은 수축기·이완기 중 나쁜 쪽을 따릅니다. 성별로 기준이 갈리는 항목(혈색소·감마지티피)은 응답에 성별이 없어 넓은 범위를 적용하고 카드에 그 한계를 표기했습니다.

### 민감정보 취급

조회 결과는 실제 개인 의료정보이므로 localStorage/sessionStorage에 저장하지 않고 React 컨텍스트(메모리)에만 보관합니다. 새로고침하면 사라지며 이때는 조회 화면으로 안내합니다. 서버도 데이터를 저장하지 않고 통과시키기만 합니다.

## 폴더 구조

```
frontend/
├─ app/
│  ├─ api/checkup/auth      1차 인증 프록시
│  ├─ api/checkup/confirm   2차 추가인증 프록시
│  ├─ dashboard             최근 검진 대시보드
│  ├─ history               과거 이력 리스트
│  └─ login                 Mock 로그인
├─ components/
│  ├─ checkup/              조회 플로우 (폼, 인증 대기)
│  ├─ dashboard/            지표 카드, 추이 차트
│  ├─ layout/               헤더
│  └─ ui/                   상태 배지, 카드 등 공통 요소
└─ lib/
   ├─ api/                  브라우저 → 프록시 호출부
   ├─ candiy/               타입, 서버 클라이언트, 스키마, 정규화·판정
   └─ store/                조회 결과 / 로그인 세션 컨텍스트
```

API 통신(`lib/candiy`), 화면 상태(`lib/store`), 표현(`components`)을 분리해 서로의 변경이 전파되지 않도록 했습니다.

## 알려진 제약

- **FREE 등급은 30일간 100회 요청 제한**이 있습니다. 조회 1회에 인증 2회 호출이 소모되므로 개발 중 재시도 정책을 `retry: 0`으로 두었습니다.
- CANDiY 응답 대기 한도가 300초입니다. 서버리스 환경에 배포할 경우 함수 최대 실행 시간이 이보다 짧으면 `CANDIY_TIMEOUT_MS`를 낮춰야 합니다.
- 실제 응답 스키마는 공식 문서([`/docs/nhis/checkup`](https://developer.candiy.io/docs/nhis/checkup/))를 기준으로 타입을 작성했습니다. 문서에 없는 필드가 추가로 내려올 경우 정규화 레이어에서 흡수하도록 설계했습니다.

## 보완하고 싶은 부분

- 컴포넌트 렌더링 테스트(Testing Library)와 프록시 라우트 통합 테스트가 없습니다. 현재는 판정·정규화 로직만 단위 테스트로 덮여 있습니다.
- 검진 항목을 13개로 제한했습니다. 문진 결과(`questionnaire`)와 PDF 원문(`pdfData`)은 화면에 반영하지 않았습니다.
- 성별 정보가 없어 일부 항목의 판정이 보수적입니다. 사용자 입력으로 성별을 받으면 더 정확한 기준을 적용할 수 있습니다.
- 카드의 항목별 색상과 공단의 `evaluation`(종합판정)은 산출 주체가 다릅니다. 색상은 항목별 수치를 국가건강검진 기준에 대입한 결과이고, 종합판정은 공단 자체 판정입니다. 둘이 어긋날 수 있어 종합판정은 대시보드 상단에 원문 그대로 함께 표시합니다.
