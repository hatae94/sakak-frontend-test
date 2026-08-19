# 개인 맞춤형 건강 분석 대시보드

CANDiY API로 국민건강보험공단 건강검진 결과를 조회하고 시각화하는 프론트엔드입니다.

## 실행 방법

[CANDiY 개발자 콘솔](https://developer.candiy.io/user/api-key)에서 API Key를 발급받습니다(권한 전체 체크).

```bash
cp frontend/.env.example frontend/.env.local   # CANDIY_API_KEY 에 발급받은 키 입력
pnpm install
pnpm --filter frontend dev
```

http://localhost:3000 에서 확인할 수 있습니다.
`dev` 대신 `build` / `test` / `lint` 도 같은 방식으로 실행합니다.

Docker로 실행하려면 저장소 루트에서:

```bash
CANDIY_API_KEY=발급받은_키 docker compose up --build
```

## 사용 기술

| 분류 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) | Route Handler로 API Key를 서버에 은닉 |
| 서버 상태 | TanStack Query | 2단계 인증의 로딩/에러 상태 관리 |
| 검증 | Zod | 폼과 프록시 라우트가 같은 스키마를 공유 |
| 시각화 | Recharts | 검진 수치 추이 |
| 언어 / 스타일링 | TypeScript, Tailwind CSS v4 | 과제 요구사항 |
| 테스트 | Vitest | |

## 주요 기능

**로그인 (Mock)**

건강검진 기능은 로그인해야 접근할 수 있습니다. 비로그인 상태로 `/dashboard` 등에 직접 들어오면 로그인 화면으로 보냅니다. 로그인한 이름은 화면 맞춤 문구에 사용합니다.

**건강검진 조회 (2단계 인증)**

```
로그인 → 입력 폼 → 1차 인증 → 인증 대기(만료 카운트다운) → 2차 추가인증 → 대시보드
```

간편인증 만료 시간(4분 30초)을 화면에 표시하고, 만료되면 재시작을 안내합니다.

**최근 건강검진 대시보드**

정상 / 주의 / 위험 개수 요약과 13개 항목별 카드를 보여줍니다. 카드에는 색상 바, 상태 배지, 공단 참고치가 함께 표시됩니다. 검진 기록이 2회 이상이면 항목별 수치 추이 그래프가 추가됩니다.

**과거 이력 리스트**

검진일 기준 최신순 목록입니다. 검진기관, 검진종류, 종합판정과 해당 회차의 상태 집계를 함께 표시합니다.

## 설계 상 판단

### 로그인 게이트를 한 곳에 둔 이유

보호가 필요한 페이지를 Route Group `app/(protected)/`로 묶고, 그 레이아웃에서만 로그인 여부를 검사합니다. 페이지마다 같은 검사를 반복하지 않아도 되고, 보호 대상이 늘어도 폴더에 넣기만 하면 됩니다. Route Group은 URL에 나타나지 않아 경로는 `/`, `/dashboard`, `/history` 그대로입니다.

세션 상태에는 `authenticated` / `unauthenticated` 외에 `loading`을 두었습니다. 서버 렌더 시점에는 `sessionStorage`를 읽을 수 없어 로그인한 사용자도 잠시 비로그인으로 보이는데, 그 순간을 비로그인으로 단정하면 새로고침할 때마다 로그인 화면으로 튕기기 때문입니다.

### API Key를 서버에 둔 이유

브라우저에서 CANDiY를 직접 호출하면 API Key가 번들과 네트워크 탭에 노출됩니다. Route Handler(`app/api/checkup/*`)를 프록시로 두어 키가 서버 환경변수에만 존재하도록 했고, `lib/candiy/client.ts`는 `server-only`를 import 하므로 실수로 클라이언트에서 참조하면 빌드가 실패합니다.

CANDiY가 요구하는 `id`(SSO 식별값)도 클라이언트를 신뢰하지 않고 서버에서 발급해 httpOnly 쿠키에 보관합니다. 1차와 2차 요청이 같은 값을 써야 하기 때문입니다.

### 문서와 실제 동작의 차이

연동이 403 Forbidden으로 막혀 헤더 후보를 하나씩 확인한 결과, **개발가이드가 안내하는 `api-key`는 거부되고 `x-api-key`만 동작**했습니다.

| 헤더 | 결과 |
|---|---|
| `api-key` (문서 안내) | 403 Forbidden |
| `apiKey` | 403 Forbidden |
| `Authorization: Bearer` | 403 Forbidden |
| `x-api-key` | 200 OK |

Base URL도 문서마다 달랐습니다. Postman 가이드의 `1api.candiy.io`는 응답하지 않았고 검진 API 문서의 `api.candiy.io`가 동작해서, 환경에 따라 바꿀 수 있도록 `CANDIY_API_BASE_URL`로 분리했습니다.

응답 필드도 문서와 어긋나는 항목이 있어 `lib/candiy/normalize.ts` 한 곳에서 흡수합니다.

| 항목 | 문서 | 실제 | 출처 |
|---|---|---|---|
| `resultList[].caseType` | String | Number | 안내문 |
| `resultList[].infantsCheckupList` | 없음 | 빈 배열 | 안내문 |
| `resultList[].infantsDentalList` | 없음 | 빈 배열 | 안내문 |
| `referenceList[].refType` | `정상A` | `정상(A)` | 직접 확인 |
| `overviewList[].waists` | `waists` | `waist` | 직접 확인 |
| `resultList[].checkupFindings` | 없음 | 존재 | 직접 확인 |

`refType` 차이는 실제 조회 후 참고치가 화면에 나오지 않아 발견했습니다. 표기가 또 바뀌어도 깨지지 않도록 괄호와 공백을 제거한 뒤 비교하며, 표기 변형 세 가지를 테스트로 고정했습니다.

### 건강 상태 판정 기준

응답의 `referenceList`에 공단이 제공하는 정상A / 정상B / 질환의심 참고치가 담겨 있어 이를 카드에 그대로 표시합니다. 색상 판정 기준은 국가건강검진 일반 기준을 `METRIC_DEFS`에 명시했습니다.

혈압은 수축기와 이완기 중 나쁜 쪽을 따릅니다. 성별로 기준이 갈리는 항목(혈색소, 감마지티피)은 응답에 성별이 없어 넓은 범위를 적용하고 카드에 그 한계를 표기했습니다.

### 민감정보 취급

조회 결과는 실제 개인 의료정보이므로 localStorage나 sessionStorage에 저장하지 않고 React 컨텍스트(메모리)에만 보관합니다. 새로고침하면 사라지며 이때는 조회 화면으로 안내합니다. 서버도 데이터를 저장하지 않고 통과시키기만 합니다.

## 폴더 구조

```
frontend/
├─ app/
│  ├─ (protected)/          로그인 필수 구간 — layout.tsx 가 게이트
│  │  ├─ page.tsx           건강검진 조회
│  │  ├─ dashboard          최근 검진 대시보드
│  │  └─ history            과거 이력 리스트
│  ├─ api/checkup/          1차·2차 인증 프록시
│  ├─ login                 Mock 로그인 (공개)
│  └─ error.tsx             라우트 에러 경계
├─ components/              화면 단위 컴포넌트 (checkup, dashboard, layout, ui)
└─ lib/
   ├─ api/                  브라우저에서 프록시를 호출하는 부분
   ├─ candiy/               타입, 서버 클라이언트, 스키마, 정규화·판정
   └─ store/                조회 결과 / 로그인 세션 컨텍스트
```

API 통신(`lib/candiy`), 화면 상태(`lib/store`), 표현(`components`)을 분리해 한쪽 변경이 다른 쪽으로 번지지 않도록 했습니다.

## 알려진 제약

- FREE 등급은 30일간 100회 요청 제한이 있습니다. 조회 1회에 인증 2회가 소모되므로 재시도 정책을 `retry: 0`으로 두었습니다.
- CANDiY 응답 대기 한도가 300초입니다. 서버리스 환경의 함수 실행 시간이 이보다 짧으면 `CANDIY_TIMEOUT_MS`를 낮춰야 합니다.
- 카드의 항목별 색상과 공단의 종합판정(`evaluation`)은 산출 주체가 다릅니다. 둘이 어긋날 수 있어 종합판정은 대시보드 상단에 원문 그대로 함께 표시합니다.

## 보완하고 싶은 부분

- 컴포넌트 렌더링 테스트와 프록시 라우트 통합 테스트가 없습니다. 현재는 판정·정규화 로직만 단위 테스트로 덮여 있습니다.
- 검진 항목을 13개로 제한했고, 문진 결과(`questionnaire`)와 PDF 원문(`pdfData`)은 화면에 반영하지 않았습니다.
- 성별 정보가 없어 일부 항목의 판정이 보수적입니다. 사용자에게 성별을 입력받으면 더 정확한 기준을 적용할 수 있습니다.
