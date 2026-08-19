import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { CandiyApiError, confirmCheckupAuth } from "@/lib/candiy/client";
import { checkupConfirmSchema } from "@/lib/candiy/schema";
import { normalizeCheckupData } from "@/lib/candiy/normalize";
import type { LoginTypeLevel, Telecom } from "@/lib/candiy/types";

import { SESSION_COOKIE } from "../auth/route";

/**
 * 2차(추가인증) — 사용자가 간편인증을 마친 뒤 호출한다.
 *
 * 1차 요청과 동일한 기본 파라미터에 `multiFactorInfo`를 더해 재전송해야 하므로,
 * 클라이언트는 1차 때 쓴 입력값과 응답받은 추가인증 정보를 함께 보낸다.
 * `id`만은 서버 쿠키에서 복원해 1차와 동일한 값을 보장한다.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const parsed = checkupConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "추가인증 요청 형식이 올바르지 않습니다.",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json(
      { message: "인증 세션이 만료되었습니다. 처음부터 다시 시도해주세요." },
      { status: 440 },
    );
  }

  const { auth, multiFactorInfo, isContinue } = parsed.data;

  try {
    const result = await confirmCheckupAuth({
      ...auth,
      loginTypeLevel: auth.loginTypeLevel as LoginTypeLevel,
      telecom: auth.telecom as Telecom,
      id: sessionId,
      isContinue,
      multiFactorInfo,
    });

    return NextResponse.json({
      status: result.status,
      data: normalizeCheckupData(result.data),
    });
  } catch (error) {
    if (error instanceof CandiyApiError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: "건강검진 정보 조회에 실패했습니다." }, { status: 500 });
  }
}
