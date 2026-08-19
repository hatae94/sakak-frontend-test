import { describe, expect, it } from "vitest";

import {
  METRIC_DEFS,
  evaluateBloodPressure,
  evaluateMetric,
  evaluateOverview,
  findNormalReference,
  normalizeCheckupData,
  parseBloodPressure,
  summarize,
  toNumber,
} from "./normalize";
import type { CheckupData, CheckupOverview } from "./types";

const metric = (key: string) => {
  const def = METRIC_DEFS.find((d) => d.key === key);
  if (!def) throw new Error(`정의되지 않은 항목: ${key}`);
  return def;
};

describe("toNumber", () => {
  it.each([
    ["23.4", 23.4],
    ["120", 120],
    ["5.1 mg/dL", 5.1],
    ["", null],
    [undefined, null],
    ["정상", null],
  ])("%s -> %s", (input, expected) => {
    expect(toNumber(input as string | undefined)).toBe(expected);
  });
});

describe("parseBloodPressure", () => {
  it("수축기/이완기를 분리한다", () => {
    expect(parseBloodPressure("120/80")).toEqual({ systolic: 120, diastolic: 80 });
  });

  it("공백이 섞여 있어도 파싱한다", () => {
    expect(parseBloodPressure("138 / 88")).toEqual({ systolic: 138, diastolic: 88 });
  });

  it("형식이 아니면 null", () => {
    expect(parseBloodPressure("측정불가")).toBeNull();
    expect(parseBloodPressure(undefined)).toBeNull();
  });
});

describe("evaluateBloodPressure", () => {
  it.each([
    ["110/70", "normal"],
    ["120/75", "caution"],
    ["115/85", "caution"],
    ["145/85", "danger"],
    ["130/95", "danger"],
    ["", "unknown"],
  ])("%s -> %s", (input, expected) => {
    expect(evaluateBloodPressure(input)).toBe(expected);
  });

  it("수축기와 이완기 중 나쁜 쪽을 따른다", () => {
    // 수축기는 정상 범위지만 이완기가 위험 구간
    expect(evaluateBloodPressure("110/95")).toBe("danger");
  });
});

describe("evaluateMetric", () => {
  it("낮을수록 좋은 항목 (공복혈당)", () => {
    const def = metric("fastingBloodGlucose");
    expect(evaluateMetric(def, "90")).toBe("normal");
    expect(evaluateMetric(def, "110")).toBe("caution");
    expect(evaluateMetric(def, "130")).toBe("danger");
  });

  it("높을수록 좋은 항목 (HDL 콜레스테롤)", () => {
    const def = metric("HDLCholesterol");
    expect(evaluateMetric(def, "70")).toBe("normal");
    expect(evaluateMetric(def, "45")).toBe("caution");
    expect(evaluateMetric(def, "30")).toBe("danger");
  });

  it("양방향 범위 항목 (BMI) — 저체중도 정상이 아니다", () => {
    const def = metric("BMI");
    expect(evaluateMetric(def, "22")).toBe("normal");
    expect(evaluateMetric(def, "27")).toBe("caution");
    expect(evaluateMetric(def, "32")).toBe("danger");
    expect(evaluateMetric(def, "16")).toBe("danger");
  });

  it("값이 없으면 unknown", () => {
    expect(evaluateMetric(metric("BMI"), "")).toBe("unknown");
    expect(evaluateMetric(metric("BMI"), undefined)).toBe("unknown");
  });
});

describe("normalizeCheckupData", () => {
  it("caseType이 Number로 와도 문자열로 통일한다 (문서-실제 불일치)", () => {
    const raw = {
      patientName: "홍길동",
      resultList: [
        { caseType: 0, checkupType: "일반", checkupDate: "2024-03-01", organizationName: "A의원" },
      ],
    } as unknown as CheckupData;

    const result = normalizeCheckupData(raw);
    expect(result.resultList?.[0].caseType).toBe("0");
    expect(typeof result.resultList?.[0].caseType).toBe("string");
  });

  it("문서에 없는 infants 배열이 없어도 빈 배열로 채운다", () => {
    const raw = {
      patientName: "홍길동",
      resultList: [{ caseType: "0", checkupType: "일반", checkupDate: "2024-03-01", organizationName: "A의원" }],
    } as unknown as CheckupData;

    const result = normalizeCheckupData(raw);
    expect(result.resultList?.[0].infantsCheckupList).toEqual([]);
    expect(result.resultList?.[0].infantsDentalList).toEqual([]);
  });

  it("검진 기록을 최신순으로 정렬한다", () => {
    const raw = {
      patientName: "홍길동",
      overviewList: [
        { checkupDate: "2021-05-10" },
        { checkupDate: "2024-03-01" },
        { checkupDate: "2022-08-20" },
      ],
      resultList: [
        { caseType: 0, checkupDate: "2021-05-10" },
        { caseType: 0, checkupDate: "2024-03-01" },
      ],
    } as unknown as CheckupData;

    const result = normalizeCheckupData(raw);
    expect(result.overviewList?.map((o) => o.checkupDate)).toEqual([
      "2024-03-01",
      "2022-08-20",
      "2021-05-10",
    ]);
    expect(result.resultList?.[0].checkupDate).toBe("2024-03-01");
  });

  it("응답이 비어 있어도 빈 구조를 반환한다", () => {
    expect(normalizeCheckupData(null)).toEqual({
      patientName: "",
      overviewList: [],
      referenceList: [],
      resultList: [],
    });
  });

  it("배열 필드가 누락돼도 접근 가능한 형태를 보장한다", () => {
    const result = normalizeCheckupData({ patientName: "홍길동" } as CheckupData);
    expect(result.overviewList).toEqual([]);
    expect(result.resultList).toEqual([]);
  });
});

describe("findNormalReference", () => {
  // 문서는 refType을 "정상A"로 적어두었으나 실제 응답은 "정상(A)"로 내려온다.
  it.each(["정상(A)", "정상A", "정상 (A)"])("%s 표기를 모두 인식한다", (refType) => {
    expect(findNormalReference([{ refType }])?.refType).toBe(refType);
  });

  it("실제 응답의 refType 집합에서 정상(A) 행을 고른다", () => {
    const list = [
      { refType: "단위" },
      { refType: "정상(A)", BMI: "18.5-24.9" },
      { refType: "정상(B)" },
      { refType: "질환의심" },
    ];
    expect(findNormalReference(list)?.BMI).toBe("18.5-24.9");
  });

  it("정상(A)가 없으면 정상(B)로 대체한다", () => {
    const list = [{ refType: "단위" }, { refType: "정상(B)", BMI: "25-29.9" }];
    expect(findNormalReference(list)?.BMI).toBe("25-29.9");
  });

  it("정상 계열이 없으면 undefined", () => {
    expect(findNormalReference([{ refType: "단위" }, { refType: "질환의심" }])).toBeUndefined();
  });
});

describe("evaluateOverview / summarize", () => {
  const overview = {
    checkupDate: "2024-03-01",
    bloodPressure: "150/95",
    BMI: "22.0",
    fastingBloodGlucose: "180",
    totalCholesterol: "210",
    HDLCholesterol: "65",
    LDLCholesterol: "",
  } as unknown as CheckupOverview;

  it("혈압을 첫 항목으로 포함한다", () => {
    const metrics = evaluateOverview(overview);
    expect(metrics[0].key).toBe("bloodPressure");
    expect(metrics[0].status).toBe("danger");
  });

  it("참고치가 있으면 항목에 붙여준다", () => {
    const metrics = evaluateOverview(overview, [
      { refType: "정상(A)", BMI: "18.5-24.9" },
    ]);
    expect(metrics.find((m) => m.key === "BMI")?.reference).toBe("18.5-24.9");
  });

  it("상태별 개수를 집계한다", () => {
    const counts = summarize(evaluateOverview(overview));
    expect(counts.danger).toBeGreaterThanOrEqual(2); // 혈압, 공복혈당
    expect(counts.normal).toBeGreaterThanOrEqual(2); // BMI, HDL
    expect(counts.unknown).toBeGreaterThanOrEqual(1); // 측정값 없는 항목
  });
});
