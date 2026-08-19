import type { HealthStatus } from "@/lib/candiy/normalize";
import { STATUS_LABEL } from "@/lib/candiy/normalize";

/**
 * 건강 상태 색상 체계.
 * 초록=정상 / 주황=주의 / 빨강=위험 / 회색=판정 불가.
 * 색만으로 구분하지 않도록 항상 텍스트 라벨을 함께 노출한다(접근성).
 */
export const STATUS_STYLE: Record<
  HealthStatus,
  { badge: string; bar: string; dot: string; text: string }
> = {
  normal: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  caution: {
    badge: "bg-amber-50 text-amber-800 ring-amber-600/20",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  danger: {
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    bar: "bg-red-500",
    dot: "bg-red-500",
    text: "text-red-700",
  },
  unknown: {
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    bar: "bg-slate-300",
    dot: "bg-slate-400",
    text: "text-slate-600",
  },
};

export function StatusBadge({ status }: { status: HealthStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-base font-medium">{title}</p>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      {action}
    </Card>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600" role="status">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
        aria-hidden
      />
      {label}
    </div>
  );
}
