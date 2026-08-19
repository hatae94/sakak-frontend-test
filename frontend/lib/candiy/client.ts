import "server-only";

import type {
  CheckupAuthRequest,
  CheckupAuthResponse,
  CheckupConfirmRequest,
  CheckupDataResponse,
} from "./types";

/**
 * CANDiY API 서버 전용 클라이언트.
 *
 * API 키가 브라우저로 새어나가지 않도록 이 모듈은 서버에서만 import 한다.
 * (`server-only` 패키지가 클라이언트 번들에 포함될 경우 빌드를 실패시킨다.)
 */

const BASE_URL = process.env.CANDIY_API_BASE_URL ?? "https://api.candiy.io";
const CHECKUP_PATH = "/v1/nhis/checkup";

/**
 * 간편인증 만료(4분 30초)보다 약간 길게 잡되, 서버리스 실행 한도를 넘지 않도록 제한한다.
 * 배포 환경의 함수 최대 실행 시간이 더 짧다면 CANDIY_TIMEOUT_MS 로 낮춰야 한다.
 */
const TIMEOUT_MS = Number(process.env.CANDIY_TIMEOUT_MS ?? 290_000);

/** CANDiY API 호출 실패를 나타내는 에러. 상태 코드와 원본 응답을 함께 보존한다. */
export class CandiyApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = "CandiyApiError";
  }
}

function requireApiKey(): string {
  const apiKey = process.env.CANDIY_API_KEY;
  if (!apiKey) {
    throw new CandiyApiError(
      "CANDIY_API_KEY 환경변수가 설정되지 않았습니다. frontend/.env.local 을 확인하세요.",
      500,
    );
  }
  return apiKey;
}

async function postCheckup<T>(body: unknown): Promise<T> {
  const apiKey = requireApiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${CHECKUP_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();
    let payload: unknown;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      throw new CandiyApiError(
        "CANDiY 응답을 JSON으로 해석하지 못했습니다.",
        response.status,
        text.slice(0, 500),
      );
    }

    if (!response.ok) {
      throw new CandiyApiError(
        extractMessage(payload) ?? `CANDiY 요청이 실패했습니다 (HTTP ${response.status})`,
        response.status,
        payload,
      );
    }

    const envelope = payload as { status?: string };
    if (envelope?.status === "error") {
      throw new CandiyApiError(
        extractMessage(payload) ?? "CANDiY가 오류 상태를 반환했습니다.",
        502,
        payload,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof CandiyApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CandiyApiError(
        `응답 대기 시간(${Math.round(TIMEOUT_MS / 1000)}초)을 초과했습니다.`,
        504,
      );
    }
    throw new CandiyApiError(
      error instanceof Error ? error.message : "CANDiY 호출 중 알 수 없는 오류가 발생했습니다.",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}

function extractMessage(payload: unknown): string | undefined {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["message", "errMsg", "error", "detail"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return undefined;
}

/** 1차 인증 — 간편인증 요청을 보내고 추가인증 정보를 받는다. */
export function requestCheckupAuth(
  request: CheckupAuthRequest,
): Promise<CheckupAuthResponse> {
  return postCheckup<CheckupAuthResponse>(request);
}

/** 2차(추가인증) — 사용자가 인증을 마친 뒤 호출하면 검진 데이터를 받는다. */
export function confirmCheckupAuth(
  request: CheckupConfirmRequest,
): Promise<CheckupDataResponse> {
  return postCheckup<CheckupDataResponse>(request);
}
