"use client";

import { useEffect, useState } from "react";

import { Card, ErrorNotice, Spinner } from "@/components/ui/status";

/** 간편인증 만료 시간 — 개발가이드 명시값(4분 30초). */
const EXPIRY_SECONDS = 270;

interface Props {
  provider: string;
  isConfirming: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 1차 인증 요청 후, 사용자가 인증 앱에서 승인하기를 기다리는 화면.
 * 남은 시간을 표시해 만료 전에 확인 버튼을 누르도록 유도한다.
 */
export function AuthWaiting({
  provider,
  isConfirming,
  errorMessage,
  onConfirm,
  onCancel,
}: Props) {
  const [remaining, setRemaining] = useState(EXPIRY_SECONDS);

  useEffect(() => {
    if (isConfirming) return;
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isConfirming]);

  const expired = remaining === 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">인증을 완료해주세요</h2>
        <p className="mt-1 text-sm text-slate-500">
          <span className="font-medium text-slate-700">{provider}</span> 앱으로 인증 요청을
          보냈습니다. 앱에서 인증을 마친 뒤 아래 버튼을 눌러주세요.
        </p>
      </div>

      <ol className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <li>1. 휴대폰에서 {provider} 앱을 엽니다.</li>
        <li>2. 도착한 인증 요청을 승인합니다.</li>
        <li>3. 이 화면으로 돌아와 &ldquo;인증 완료&rdquo;를 누릅니다.</li>
      </ol>

      <div
        className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
          expired
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        <span>{expired ? "인증 유효 시간이 만료되었습니다" : "남은 인증 시간"}</span>
        <span
          className={`font-mono text-base tabular-nums ${expired ? "text-red-700" : "text-slate-900"}`}
          aria-live="polite"
        >
          {minutes}:{seconds}
        </span>
      </div>

      {errorMessage && <ErrorNotice message={errorMessage} />}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming || expired}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isConfirming ? "조회 중…" : "인증 완료"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          {expired ? "처음부터 다시" : "취소"}
        </button>
        {isConfirming && <Spinner label="검진 결과를 불러오는 중입니다" />}
      </div>
    </Card>
  );
}
