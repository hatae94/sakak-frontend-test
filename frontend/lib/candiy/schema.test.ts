import { describe, expect, it } from "vitest";

import { checkupAuthSchema } from "./schema";

const valid = {
  loginTypeLevel: "1",
  legalName: "홍길동",
  birthdate: "19900101",
  phoneNo: "01012345678",
  telecom: "0",
  startDate: "2016",
  endDate: "2026",
};

function fieldErrors(input: Record<string, unknown>) {
  const result = checkupAuthSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((i) => i.path.join("."));
}

describe("checkupAuthSchema", () => {
  it("정상 입력을 통과시킨다", () => {
    expect(checkupAuthSchema.safeParse(valid).success).toBe(true);
  });

  describe("휴대폰 번호", () => {
    it.each(["01012345678", "01112345678", "0111234567", "01912345678"])(
      "%s 를 허용한다",
      (phoneNo) => {
        expect(fieldErrors({ ...valid, phoneNo })).not.toContain("phoneNo");
      },
    );

    it.each(["010-1234-5678", "0201234567", "010123456", "abcdefghijk", ""])(
      "%s 를 거부한다",
      (phoneNo) => {
        expect(fieldErrors({ ...valid, phoneNo })).toContain("phoneNo");
      },
    );
  });

  describe("생년월일", () => {
    it("YYYYMMDD 8자리만 허용한다", () => {
      expect(fieldErrors({ ...valid, birthdate: "19900101" })).not.toContain("birthdate");
      expect(fieldErrors({ ...valid, birthdate: "1990-01-01" })).toContain("birthdate");
      expect(fieldErrors({ ...valid, birthdate: "199001" })).toContain("birthdate");
    });
  });

  describe("조회 기간", () => {
    it("시작 연도가 종료 연도보다 늦으면 거부한다", () => {
      expect(fieldErrors({ ...valid, startDate: "2026", endDate: "2016" })).toContain("startDate");
    });

    it("같은 연도는 허용한다", () => {
      expect(checkupAuthSchema.safeParse({ ...valid, startDate: "2026", endDate: "2026" }).success).toBe(true);
    });
  });

  it("정의되지 않은 인증 수단은 거부한다", () => {
    expect(fieldErrors({ ...valid, loginTypeLevel: "99" })).toContain("loginTypeLevel");
  });

  it("inquiryType 미지정 시 일반조회(0)로 기본값을 채운다", () => {
    const result = checkupAuthSchema.parse(valid);
    expect(result.inquiryType).toBe("0");
  });
});
