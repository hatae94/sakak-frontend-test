/**
 * CANDiY API 타입 정의
 *
 * 출처: https://developer.candiy.io/docs/nhis/checkup/
 * 엔드포인트: POST https://api.candiy.io/v1/nhis/checkup
 *
 * 문서와 실제 응답이 다른 부분은 `normalize.ts`에서 흡수한다.
 */

/** 간편인증 로그인 구분 (loginTypeLevel) */
export const LOGIN_TYPE = {
  KAKAO_TALK: "1",
  SAMSUNG_PASS: "3",
  KB_BANK: "4",
  PASS: "5",
  NAVER: "6",
  SHINHAN_BANK: "7",
  TOSS: "8",
  BANKSALAD: "9",
  HANA_BANK: "10",
  NH_MOBILE: "11",
  WOORI_BANK: "12",
  KAKAO_BANK: "13",
} as const;

export type LoginTypeLevel = (typeof LOGIN_TYPE)[keyof typeof LOGIN_TYPE];

export const LOGIN_TYPE_LABEL: Record<LoginTypeLevel, string> = {
  "1": "카카오톡",
  "3": "삼성패스",
  "4": "국민은행",
  "5": "통신사(PASS)",
  "6": "네이버",
  "7": "신한은행",
  "8": "토스",
  "9": "뱅크샐러드",
  "10": "하나은행",
  "11": "NH모바일인증서",
  "12": "우리은행",
  "13": "카카오뱅크",
};

/** 통신사 (telecom) */
export const TELECOM = { SKT: "0", KT: "1", LGU: "2" } as const;
export type Telecom = (typeof TELECOM)[keyof typeof TELECOM];

export const TELECOM_LABEL: Record<Telecom, string> = {
  "0": "SKT",
  "1": "KT",
  "2": "LG U+",
};

/** 조회 구분 (inquiryType) */
export const INQUIRY_TYPE = {
  BASIC: "0",
  DETAIL_WITH_PDF: "1",
  DETAIL_WITH_QUESTIONNAIRE: "3",
  QUESTIONNAIRE_ONLY: "4",
} as const;

/** 1차 인증 요청 — 사용자가 폼에 입력하는 값 */
export interface CheckupAuthRequest {
  /** 사용자 계정 식별용 유일값 (아이디 + UUID 등, 임의 지정) */
  id: string;
  loginTypeLevel: LoginTypeLevel;
  legalName: string;
  /** YYYYMMDD */
  birthdate: string;
  /** 하이픈 없는 숫자만 */
  phoneNo: string;
  telecom: Telecom;
  /** yyyy */
  startDate: string;
  /** yyyy */
  endDate: string;
  inquiryType?: string;
}

/** 1차 인증 응답에 담겨 오는 추가인증 정보 — 2차 요청에 그대로 전달한다 */
export interface MultiFactorInfo {
  transactionId: string;
  jobIndex: number;
  threadIndex: number;
  multiFactorTimestamp: number;
}

/** 2차(추가인증) 요청 = 기본 파라미터 + 추가인증 정보 */
export interface CheckupConfirmRequest extends CheckupAuthRequest {
  /** "0": 취소, "1": 진행 */
  isContinue: "0" | "1";
  multiFactorInfo: MultiFactorInfo;
}

/** 모든 응답이 공유하는 봉투 구조 */
export interface CandiyEnvelope<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}

/** 검진 결과 측정값 한 건 (overviewList 요소) */
export interface CheckupOverview {
  /** yyyy-mm-dd */
  checkupDate: string;
  height: string;
  weight: string;
  /** 문서 표기는 `waists`지만 실제 응답은 단수형 `waist`로 내려온다. 둘 다 허용한다. */
  waists?: string;
  waist?: string;
  BMI: string;
  vision: string;
  hearing: string;
  /** "수축기/이완기" 형식 (예: "120/80") */
  bloodPressure: string;
  proteinuria: string;
  hemoglobin: string;
  fastingBloodGlucose: string;
  totalCholesterol: string;
  HDLCholesterol: string;
  triglyceride: string;
  LDLCholesterol: string;
  serumCreatinine: string;
  GFR: string;
  AST: string;
  ALT: string;
  yGPT: string;
  chestXrayResult: string;
  osteoporosis: string;
  /** 정A, 정B, 주의, 의심, 고∙당, 유질, 일반, 직업, 단순, 휴무 */
  evaluation: string;
}

/**
 * 참고치 한 행 (referenceList 요소).
 * refType 이 "단위" / "정상A" / "정상B" / "질환의심" 등으로 구분되고,
 * 각 측정 항목 키에 해당 구간의 기준 문자열이 담긴다.
 */
export interface CheckupReference
  extends Partial<Omit<CheckupOverview, "checkupDate" | "evaluation">> {
  refType: string;
}

/** 검진 이력 한 건 (resultList 요소) */
export interface CheckupResult {
  /**
   * 문서상 String("0:본인검진")이지만 실제 응답은 Number로 내려온다.
   * (과제 안내문에 명시된 문서-실제 불일치 항목)
   */
  caseType: string | number;
  checkupType: string;
  /** yyyy-mm-dd */
  checkupDate: string;
  organizationName: string;
  /** 문서에 없으나 실제 응답에 포함된다. 검진 소견. */
  checkupFindings?: string;
  /** inquiryType 이 1 또는 3일 때만 채워진다 */
  pdfData?: string;
  questionnaire?: unknown[];
  /** 문서에 없으나 실제 응답에 포함된다. 항상 빈 배열. */
  infantsCheckupList?: unknown[];
  /** 문서에 없으나 실제 응답에 포함된다. 항상 빈 배열. */
  infantsDentalList?: unknown[];
}

/** 최종 조회 결과 (2차 인증 성공 시 data) */
export interface CheckupData {
  patientName: string;
  overviewList?: CheckupOverview[];
  referenceList?: CheckupReference[];
  resultList?: CheckupResult[];
}

export type CheckupAuthResponse = CandiyEnvelope<MultiFactorInfo>;
export type CheckupDataResponse = CandiyEnvelope<CheckupData>;
