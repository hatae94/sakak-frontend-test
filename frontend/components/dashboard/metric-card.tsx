import type { EvaluatedMetric } from "@/lib/candiy/normalize";
import { STATUS_STYLE, StatusBadge } from "@/components/ui/status";

/**
 * 측정 항목 한 개를 카드로 보여준다.
 * 색상만으로 상태를 전달하지 않도록 배지 텍스트와 참고치를 함께 노출한다.
 */
export function MetricCard({ metric }: { metric: EvaluatedMetric }) {
  const style = STATUS_STYLE[metric.status];
  const hasValue = metric.raw.trim().length > 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`absolute inset-y-0 left-0 w-1 ${style.bar}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-600">{metric.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {hasValue ? metric.raw : "—"}
            {hasValue && (
              <span className="ml-1 text-sm font-normal text-slate-400">{metric.unit}</span>
            )}
          </p>
        </div>
        <StatusBadge status={metric.status} />
      </div>

      {(metric.reference || metric.note) && (
        <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 pl-2 text-xs text-slate-500">
          {metric.reference && (
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-slate-400">참고치</dt>
              <dd className="truncate">{metric.reference}</dd>
            </div>
          )}
          {metric.note && (
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-slate-400">유의</dt>
              <dd>{metric.note}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
