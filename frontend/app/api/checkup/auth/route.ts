import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { CandiyApiError, requestCheckupAuth } from "@/lib/candiy/client";
import { checkupAuthSchema } from "@/lib/candiy/schema";
import type { LoginTypeLevel, Telecom } from "@/lib/candiy/types";

export const SESSION_COOKIE = "candiy_session_id";

/**
 * 1차 인증 — 사용자가 입력한 개인정보로 간편인증을 요청한다.
 *
 * CANDiY가 요구하는 `id`(SSO 식별값)는 클라이언트를 신뢰하지 않고 서버에서 발급해
 * httpOnly 쿠키에 보관한다. 2차 요청에서 동일한 값을 재사용해야 하기 때문이다.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const parsed = checkupAuthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "입력값을 확인해주세요.",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? `web-${randomUUID()}`;

  try {
    const result = await requestCheckupAuth({
      ...parsed.data,
      loginTypeLevel: parsed.data.loginTypeLevel as LoginTypeLevel,
      telecom: parsed.data.telecom as Telecom,
      id: sessionId,
    });

    const response = NextResponse.json(result);
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    if (error instanceof CandiyApiError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: "인증 요청에 실패했습니다." }, { status: 500 });
  }
}
