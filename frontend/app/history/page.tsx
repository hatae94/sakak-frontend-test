"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Card, EmptyState, StatusBadge } from "@/components/ui/status";
import { evaluateOverview, summarize } from "@/lib/candiy/normalize";
import type { CheckupOverview } from "@/lib/candiy/types";
import { useCheckup } from "@/lib/store/checkup-context";

export default function HistoryPage() {
  const { data } = useCheckup();

  const overviewByDate = useMemo(() => {
    const map = new Map<string, CheckupOverview>();
    for (const overview of data?.overviewList ?? []) {
      if (overview.checkupDate) map.set(overview.checkupDate, overview);
    }
    return map;
  }, [data?.overviewList]);

  if (!data) {
    return (
      <EmptyState
        title="조회된 검진 이력이 없습니다"
        description="건강검진 결과는 보안을 위해 브라우저 메모리에만 보관되어, 새로고침하면 사라집니다. 조회를 다시 진행해주세요."
        action={
          <Link
            href="/"
            className="mt-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            건강검진 조회하기
          </Link>
        }
      />
    );
  }

  const results = data.resultList ?? [];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">건강검진 이력</h1>
        <p className="mt-2 text-sm text-slate-600">
          {data.patientName || "본인"}님의 검진 기록 {results.length}건을 최신순으로 표시합니다.
        </p>
      </section>

      {results.length === 0 ? (
        <EmptyState
          title="검진 이력이 비어 있습니다"
          description="조회한 기간에 등록된 건강검진 기록이 없습니다. 조회 기간을 넓혀 다시 시도해보세요."
          action={
            <Link
              href="/"
              className="mt-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              다시 조회하기
            </Link>
          }
        />
      ) : (
        <ol className="space-y-3">
          {results.map((result, index) => {
            const overview = overviewByDate.get(result.checkupDate);
            const counts = overview
              ? summarize(evaluateOverview(overview, data.referenceList ?? []))
              : null;

            return (
              <li key={`${result.checkupDate}-${index}`}>
                <Card className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <time
                        dateTime={result.checkupDate}
                        className="text-base font-semibold tabular-nums"
                      >
                        {result.checkupDate}
                      </time>
                      {result.checkupType && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          {result.checkupType}
                        </span>
                      )}
                      {overview?.evaluation && (
                        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs text-white">
                          판정 {overview.evaluation}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {result.organizationName || "검진기관 정보 없음"}
                    </p>
                  </div>

                  {counts ? (
                    <div className="flex items-center gap-2">
                      {counts.danger > 0 && <StatusBadge status="danger" />}
                      {counts.caution > 0 && <StatusBadge status="caution" />}
                      {counts.danger === 0 && counts.caution === 0 && (
                        <StatusBadge status="normal" />
                      )}
                      <span className="text-xs text-slate-500">
                        정상 {counts.normal} · 주의 {counts.caution} · 위험 {counts.danger}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">측정값 없음</span>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
