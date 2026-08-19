"use client";

import Link from "next/link";

import { CheckupFlow } from "@/components/checkup/checkup-flow";
import { Card } from "@/components/ui/status";
import { useCheckup } from "@/lib/store/checkup-context";
import { useSession } from "@/lib/store/session-context";

export default function HomePage() {
  const { userName } = useSession();
  const { data } = useCheckup();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          {userName ? `${userName}님, 건강검진 결과를 확인해보세요` : "건강검진 결과 조회"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          최근 10년간의 국민건강보험공단 건강검진 기록을 불러와 한눈에 보여드립니다.
        </p>
      </section>

      {data && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-emerald-200 bg-emerald-50">
          <div className="text-sm text-emerald-900">
            <span className="font-medium">{data.patientName || "본인"}</span>님의 검진 결과가
            준비되어 있습니다. ({data.resultList?.length ?? 0}건)
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              대시보드 보기
            </Link>
            <Link
              href="/history"
              className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              검진 이력
            </Link>
          </div>
        </Card>
      )}

      <CheckupFlow />
    </div>
  );
}
