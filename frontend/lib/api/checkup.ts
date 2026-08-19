import type { CheckupAuthInput } from "@/lib/candiy/schema";
import type { CheckupData, MultiFactorInfo } from "@/lib/candiy/types";

/**
 * 브라우저 → 자체 프록시 라우트 호출부.
 * CANDiY를 직접 호출하지 않으므로 API 키가 클라이언트에 노출되지 않는다.
 */

export class CheckupRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "CheckupRequestError";
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CheckupRequestError("네트워크 연결을 확인해주세요.", 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : null) ?? "요청 처리에 실패했습니다.";
    throw new CheckupRequestError(message, response.status);
  }

  return payload as T;
}

export function requestAuth(input: CheckupAuthInput) {
  return postJson<{ status: string; data: MultiFactorInfo }>(
    "/api/checkup/auth",
    input,
  );
}

export function confirmAuth(input: {
  auth: CheckupAuthInput;
  multiFactorInfo: MultiFactorInfo;
  isContinue?: "0" | "1";
}) {
  return postJson<{ status: string; data: CheckupData }>("/api/checkup/confirm", {
    isContinue: "1",
    ...input,
  });
}
