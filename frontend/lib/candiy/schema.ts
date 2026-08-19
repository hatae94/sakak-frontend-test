import { z } from "zod";

import { INQUIRY_TYPE, LOGIN_TYPE, TELECOM } from "./types";

/**
 * 프록시 라우트와 입력 폼이 공유하는 검증 스키마.
 * CANDiY로 요청을 흘려보내기 전에 형식을 여기서 한 번 걸러낸다.
 */

const loginTypeLevels = Object.values(LOGIN_TYPE) as [string, ...string[]];
const telecoms = Object.values(TELECOM) as [string, ...string[]];

const currentYear = new Date().getFullYear();

export const checkupAuthSchema = z.object({
  loginTypeLevel: z.enum(loginTypeLevels),
  legalName: z
    .string()
    .trim()
    .min(2, "이름을 2자 이상 입력하세요.")
    .max(30, "이름이 너무 깁니다."),
  birthdate: z
    .string()
    .regex(/^\d{8}$/, "생년월일은 YYYYMMDD 8자리로 입력하세요."),
  // 010-1234-5678(11자리) 및 구형 011/016~019(10자리)를 모두 허용한다.
  phoneNo: z
    .string()
    .regex(/^01[016789]\d{7,8}$/, "휴대폰 번호는 하이픈 없이 숫자만 입력하세요."),
  telecom: z.enum(telecoms),
  startDate: z
    .string()
    .regex(/^\d{4}$/, "조회 시작 연도는 4자리여야 합니다.")
    .refine((y) => Number(y) >= 1990 && Number(y) <= currentYear, "조회 가능한 연도가 아닙니다."),
  endDate: z
    .string()
    .regex(/^\d{4}$/, "조회 종료 연도는 4자리여야 합니다.")
    .refine((y) => Number(y) >= 1990 && Number(y) <= currentYear, "조회 가능한 연도가 아닙니다."),
  inquiryType: z.string().optional().default(INQUIRY_TYPE.BASIC),
}).refine((v) => Number(v.startDate) <= Number(v.endDate), {
  message: "조회 시작 연도가 종료 연도보다 늦습니다.",
  path: ["startDate"],
});

export const multiFactorInfoSchema = z.object({
  transactionId: z.string().min(1),
  jobIndex: z.number().int(),
  threadIndex: z.number().int(),
  multiFactorTimestamp: z.number().int(),
});

export const checkupConfirmSchema = z.object({
  auth: checkupAuthSchema,
  multiFactorInfo: multiFactorInfoSchema,
  isContinue: z.enum(["0", "1"]).default("1"),
});

export type CheckupAuthInput = z.infer<typeof checkupAuthSchema>;
export type CheckupConfirmInput = z.infer<typeof checkupConfirmSchema>;
