"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { METRIC_DEFS, toNumber } from "@/lib/candiy/normalize";
import type { CheckupOverview } from "@/lib/candiy/types";

/** 추이를 볼 수 있는 항목 — 수치가 연속형인 것만 고른다. */
const TREND_KEYS = [
  "BMI",
  "fastingBloodGlucose",
  "totalCholesterol",
  "LDLCholesterol",
  "triglyceride",
  "AST",
  "ALT",
] as const;

type TrendKey = (typeof TREND_KEYS)[number];

interface Props {
  overviews: CheckupOverview[];
}

/**
 * 연도별 수치 변화를 선 그래프로 보여준다.
 * 검진 기록이 1건뿐이면 추이가 성립하지 않으므로 렌더링하지 않는다.
 */
export function TrendChart({ overviews }: Props) {
  const [selected, setSelected] = useState<TrendKey>("BMI");

  const def = METRIC_DEFS.find((d) => d.key === selected);

  // 그래프는 과거 → 현재 순서가 자연스러우므로 오름차순으로 뒤집는다.
  const points = [...overviews]
    .reverse()
    .map((o) => ({
      date: o.checkupDate?.slice(0, 7) ?? "",
      value: toNumber(o[selected]),
    }))
    .filter((p) => p.value !== null);

  if (points.length < 2) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">수치 추이</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            검진 {points.length}회 기록의 변화입니다.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">항목</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as TrendKey)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
          >
            {TREND_KEYS.map((key) => (
              <option key={key} value={key}>
                {METRIC_DEFS.find((d) => d.key === key)?.label ?? key}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} stroke="#cbd5e1" />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} stroke="#cbd5e1" domain={["auto", "auto"]} />
            <Tooltip
              formatter={(value) => [`${value ?? "-"} ${def?.unit ?? ""}`, def?.label ?? ""]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f172a"
              strokeWidth={2}
              dot={{ r: 4, fill: "#0f172a" }}
              activeDot={{ r: 6 }}
              // React Compiler 환경에서 진입 애니메이션이 완료되지 않아
              // 선 경로가 그려지지 않는 현상이 있어 비활성화한다.
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
