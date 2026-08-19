import type {
  CheckupData,
  CheckupOverview,
  CheckupReference,
  CheckupResult,
} from "./types";

/**
 * CANDiY 응답 정규화 + 건강상태 판정.
 *
 * 이 모듈이 존재하는 이유는 문서와 실제 응답이 어긋나기 때문이다.
 * 화면 컴포넌트가 그 차이를 알 필요가 없도록 여기서 전부 흡수한다.
 *
 * 알려진 불일치 (과제 안내문 명시):
 *  - resultList[].caseType : 문서 String, 실제 Number
 *  - resultList[].infantsCheckupList / infantsDentalList : 문서에 없으나 응답에 포함(빈 배열)
 */

export type HealthStatus = "normal" | "caution" | "danger" | "unknown";

export const STATUS_LABEL: Record<HealthStatus, string> = {
  normal: "정상",
  caution: "주의",
  danger: "위험",
  unknown: "정보 없음",
};

/** 판정 기준 한 항목. 값이 낮을수록 좋은 항목과 높을수록 좋은 항목을 구분한다. */
interface MetricDef {
  key: keyof CheckupOverview;
  label: string;
  unit: string;
  /** 정상 범위 [최소, 최대] — null이면 해당 방향 제한 없음 */
  normal: [number | null, number | null];
  /** 주의 범위를 벗어나면 위험으로 본다 */
  caution: [number | null, number | null];
  /** 성별에 따라 기준이 다른 항목은 참고 표기만 한다 */
  note?: string;
}

/**
 * 국가건강검진 일반 판정 기준을 따른다.
 * 성별로 기준이 갈리는 항목(혈색소, 감마지티피, 허리둘레)은 응답에 성별이 없어
 * 넓은 쪽 범위를 적용하고 note로 한계를 밝힌다.
 */
export const METRIC_DEFS: MetricDef[] = [
  { key: "BMI", label: "체질량지수", unit: "kg/m²", normal: [18.5, 24.9], caution: [18.5, 29.9] },
  { key: "fastingBloodGlucose", label: "공복혈당", unit: "mg/dL", normal: [null, 99], caution: [null, 125] },
  { key: "totalCholesterol", label: "총콜레스테롤", unit: "mg/dL", normal: [null, 199], caution: [null, 239] },
  { key: "HDLCholesterol", label: "HDL 콜레스테롤", unit: "mg/dL", normal: [60, null], caution: [40, null] },
  { key: "LDLCholesterol", label: "LDL 콜레스테롤", unit: "mg/dL", normal: [null, 129], caution: [null, 159] },
  { key: "triglyceride", label: "중성지방", unit: "mg/dL", normal: [null, 149], caution: [null, 199] },
  { key: "AST", label: "AST(SGOT)", unit: "U/L", normal: [null, 40], caution: [null, 50] },
  { key: "ALT", label: "ALT(SGPT)", unit: "U/L", normal: [null, 40], caution: [null, 50] },
  { key: "yGPT", label: "감마지티피", unit: "U/L", normal: [null, 63], caution: [null, 77], note: "성별 기준 상이 (남 11~63, 여 8~35)" },
  { key: "hemoglobin", label: "혈색소", unit: "g/dL", normal: [12, 16.5], caution: [10, 18], note: "성별 기준 상이 (남 13~16.5, 여 12~15.5)" },
  { key: "serumCreatinine", label: "혈청크레아티닌", unit: "mg/dL", normal: [null, 1.5], caution: [null, 1.7] },
  { key: "GFR", label: "신사구체여과율", unit: "mL/min", normal: [60, null], caution: [45, null] },
];

/** "120/80" 형태의 혈압 문자열을 수축기/이완기로 분리한다. */
export function parseBloodPressure(
  raw: string | undefined,
): { systolic: number; diastolic: number } | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  return { systolic: Number(match[1]), diastolic: Number(match[2]) };
}

/** 혈압은 수축기·이완기 중 나쁜 쪽을 따른다. */
export function evaluateBloodPressure(raw: string | undefined): HealthStatus {
  const bp = parseBloodPressure(raw);
  if (!bp) return "unknown";
  if (bp.systolic >= 140 || bp.diastolic >= 90) return "danger";
  if (bp.systolic >= 120 || bp.diastolic >= 80) return "caution";
  return "normal";
}

function withinRange(value: number, [min, max]: [number | null, number | null]): boolean {
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

/** 문자열 측정값을 숫자로 바꾼다. 단위나 공백이 섞여 있어도 앞쪽 숫자를 취한다. */
export function toNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const match = String(raw).match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export function evaluateMetric(def: MetricDef, raw: string | undefined): HealthStatus {
  const value = toNumber(raw);
  if (value === null) return "unknown";
  if (withinRange(value, def.normal)) return "normal";
  if (withinRange(value, def.caution)) return "caution";
  return "danger";
}

export interface EvaluatedMetric {
  key: string;
  label: string;
  unit: string;
  raw: string;
  value: number | null;
  status: HealthStatus;
  note?: string;
  /** referenceList에서 가져온 공단 참고치 (있을 때만) */
  reference?: string;
}

/**
 * "정상A" 참고치 행을 찾는다.
 *
 * 문서는 refType을 `정상A`로 적어두었지만 실제 응답은 `정상(A)` 형태로 내려온다.
 * 표기가 또 바뀌어도 깨지지 않도록 괄호·공백을 제거한 뒤 비교한다.
 */
export function findNormalReference(
  references: CheckupReference[],
): CheckupReference | undefined {
  const squash = (s: string) => s.replace(/[()\s]/g, "");
  return (
    references.find((r) => squash(r.refType ?? "") === "정상A") ??
    references.find((r) => squash(r.refType ?? "") === "정상B") ??
    references.find((r) => squash(r.refType ?? "").startsWith("정상"))
  );
}

/** 한 건의 검진 결과를 화면에서 바로 쓸 수 있는 항목 배열로 바꾼다. */
export function evaluateOverview(
  overview: CheckupOverview,
  references: CheckupReference[] = [],
): EvaluatedMetric[] {
  const normalRef = findNormalReference(references);

  const metrics: EvaluatedMetric[] = METRIC_DEFS.map((def) => {
    const raw = overview[def.key];
    return {
      key: def.key,
      label: def.label,
      unit: def.unit,
      raw: typeof raw === "string" ? raw : "",
      value: toNumber(typeof raw === "string" ? raw : undefined),
      status: evaluateMetric(def, typeof raw === "string" ? raw : undefined),
      note: def.note,
      reference: normalRef?.[def.key as keyof CheckupReference] as string | undefined,
    };
  });

  metrics.unshift({
    key: "bloodPressure",
    label: "혈압",
    unit: "mmHg",
    raw: overview.bloodPressure ?? "",
    value: parseBloodPressure(overview.bloodPressure)?.systolic ?? null,
    status: evaluateBloodPressure(overview.bloodPressure),
    reference: normalRef?.bloodPressure,
  });

  return metrics;
}

/** 상태별 개수 — 대시보드 상단 요약에 쓴다. */
export function summarize(metrics: EvaluatedMetric[]): Record<HealthStatus, number> {
  return metrics.reduce(
    (acc, m) => {
      acc[m.status] += 1;
      return acc;
    },
    { normal: 0, caution: 0, danger: 0, unknown: 0 } as Record<HealthStatus, number>,
  );
}

/** 최신 검진이 앞에 오도록 날짜 내림차순 정렬 */
function byDateDesc<T extends { checkupDate?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.checkupDate ?? "").localeCompare(a.checkupDate ?? ""));
}

/**
 * 응답을 화면이 신뢰할 수 있는 형태로 정리한다.
 * - 누락 가능한 배열을 빈 배열로 채운다
 * - caseType을 문자열로 통일한다 (문서 String / 실제 Number)
 * - 검진 이력을 최신순으로 정렬한다
 */
export function normalizeCheckupData(data: CheckupData | undefined | null): CheckupData {
  if (!data) {
    return { patientName: "", overviewList: [], referenceList: [], resultList: [] };
  }

  const resultList: CheckupResult[] = (data.resultList ?? []).map((item) => ({
    ...item,
    caseType: String(item.caseType ?? ""),
    infantsCheckupList: item.infantsCheckupList ?? [],
    infantsDentalList: item.infantsDentalList ?? [],
  }));

  return {
    patientName: data.patientName ?? "",
    overviewList: byDateDesc(data.overviewList ?? []),
    referenceList: data.referenceList ?? [],
    resultList: byDateDesc(resultList),
  };
}
