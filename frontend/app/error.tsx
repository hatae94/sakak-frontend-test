"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Card } from "@/components/ui/status";

/**
 * 라우트 단위 에러 경계 (Next.js App Router 규약 파일).
 *
 * 조회 요청의 실패는 각 화면에서 메시지로 처리하지만, 렌더링 도중 예상치 못한
 * 에러가 나면 여기서 받는다. 이 파일이 없으면 기본 에러 화면이 그대로 노출된다.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 실제 서비스라면 에러 수집 도구로 전송한다. 최소한 삼키지는 않는다.
    console.error("화면 렌더링 중 처리되지 않은 오류:", error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center gap-4 py-12 text-center">
      <div>
        <p className="text-base font-medium">화면을 표시하지 못했습니다</p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          일시적인 문제일 수 있습니다. 다시 시도해도 같은 화면이 나오면 조회부터 다시
          진행해주세요.
        </p>
      </div>

      {error.digest && (
        <p className="font-mono text-xs text-slate-400">오류 코드 {error.digest}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
        >
          조회 화면으로
        </Link>
      </div>
    </Card>
  );
}
