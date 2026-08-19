"use client";

import Link from "next/link";
import { useMemo } from "react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Card, EmptyState, STATUS_STYLE } from "@/components/ui/status";
import { evaluateOverview, summarize, type HealthStatus } from "@/lib/candiy/normalize";
import { useCheckup } from "@/lib/store/checkup-context";
import { useSession } from "@/lib/store/session-context";

const SUMMARY_ORDER: { status: HealthStatus; label: string }[] = [
  { status: "normal", label: "정상" },
  { status: "caution", label: "주의" },
  { status: "danger", label: "위험" },
  { status: "unknown", label: "정보 없음" },
];

export default function DashboardPage() {
  const { data } = useCheckup();
  const { userName } = useSession();

  const latest = data?.overviewList?.[0];

  const metrics = useMemo(
    () => (latest ? evaluateOverview(latest, data?.referenceList ?? []) : []),
    [latest, data?.referenceList],
  );
  const counts = useMemo(() => summarize(metrics), [metrics]);

  if (!data) {
    return (
      <EmptyState
        title="조회된 건강검진 결과가 없습니다"
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

  if (!latest) {
    return (
      <EmptyState
        title="표시할 검진 측정값이 없습니다"
        description="조회는 성공했지만 측정 항목(overviewList)이 비어 있습니다. 조회 기간을 넓혀 다시 시도해보세요."
        action={
          <Link
            href="/"
            className="mt-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            다시 조회하기
          </Link>
        }
      />
    );
  }

  const subject = userName ?? data.patientName ?? "회원";

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {subject}님, 최근 건강검진 결과입니다
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            검진일 <span className="font-medium text-slate-900">{latest.checkupDate}</span>
            {latest.evaluation && (
              <>
                {" · "}종합판정{" "}
                <span className="font-medium text-slate-900">{latest.evaluation}</span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/history"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
        >
          전체 검진 이력 보기
        </Link>
      </section>

      <section aria-label="상태 요약">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SUMMARY_ORDER.map(({ status, label }) => (
            <Card key={status} className="flex items-center gap-3">
              <span className={`h-8 w-1.5 rounded-full ${STATUS_STYLE[status].bar}`} aria-hidden />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-semibold tabular-nums">{counts[status]}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="검진 항목별 결과">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">항목별 결과</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </div>
      </section>

      {data.overviewList && data.overviewList.length > 1 && (
        <section aria-label="수치 추이">
          <TrendChart overviews={data.overviewList} />
        </section>
      )}

      <p className="text-xs text-slate-500">
        판정 기준은 국가건강검진 일반 기준을 따르며, 참고치는 공단 응답의 referenceList
        값을 그대로 표시합니다. 실제 진단은 의료기관의 판독 결과를 따르세요.
      </p>
    </div>
  );
}
