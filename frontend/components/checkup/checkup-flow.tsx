"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { confirmAuth, requestAuth } from "@/lib/api/checkup";
import { checkupAuthSchema, type CheckupAuthInput } from "@/lib/candiy/schema";
import {
  LOGIN_TYPE_LABEL,
  TELECOM_LABEL,
  type MultiFactorInfo,
} from "@/lib/candiy/types";
import { useCheckup } from "@/lib/store/checkup-context";
import { Card, ErrorNotice, Spinner } from "@/components/ui/status";

import { AuthWaiting } from "./auth-waiting";

/** 조회 흐름의 단계. 화면 전환은 이 값 하나로 결정된다. */
type Phase = "form" | "waiting" | "done";

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_FORM: CheckupAuthInput = {
  loginTypeLevel: "1",
  legalName: "",
  birthdate: "",
  phoneNo: "",
  telecom: "0",
  startDate: String(CURRENT_YEAR - 9),
  endDate: String(CURRENT_YEAR),
  inquiryType: "0",
};

export function CheckupFlow() {
  const router = useRouter();
  const { setData } = useCheckup();

  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<CheckupAuthInput>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [multiFactor, setMultiFactor] = useState<MultiFactorInfo | null>(null);

  const authMutation = useMutation({
    mutationFn: requestAuth,
    onSuccess: (result) => {
      setMultiFactor(result.data);
      setPhase("waiting");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmAuth,
    onSuccess: (result) => {
      setData(result.data);
      setPhase("done");
      router.push("/dashboard");
    },
  });

  function update<K extends keyof CheckupAuthInput>(key: K, value: CheckupAuthInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = checkupAuthSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".");
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    authMutation.mutate(parsed.data);
  }

  function handleConfirm() {
    if (!multiFactor) return;
    confirmMutation.mutate({ auth: form, multiFactorInfo: multiFactor });
  }

  function handleRestart() {
    setPhase("form");
    setMultiFactor(null);
    authMutation.reset();
    confirmMutation.reset();
  }

  if (phase === "waiting" && multiFactor) {
    return (
      <AuthWaiting
        provider={LOGIN_TYPE_LABEL[form.loginTypeLevel as keyof typeof LOGIN_TYPE_LABEL]}
        isConfirming={confirmMutation.isPending}
        errorMessage={confirmMutation.error?.message ?? null}
        onConfirm={handleConfirm}
        onCancel={handleRestart}
      />
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">건강검진 조회</h2>
          <p className="mt-1 text-sm text-slate-500">
            국민건강보험공단에 등록된 본인의 건강검진 결과를 간편인증으로 조회합니다.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="이름" error={fieldErrors.legalName} htmlFor="legalName">
            <input
              id="legalName"
              value={form.legalName}
              onChange={(e) => update("legalName", e.target.value)}
              autoComplete="name"
              placeholder="홍길동"
              className={inputClass(fieldErrors.legalName)}
            />
          </Field>

          <Field label="생년월일" error={fieldErrors.birthdate} htmlFor="birthdate" hint="YYYYMMDD">
            <input
              id="birthdate"
              value={form.birthdate}
              onChange={(e) => update("birthdate", e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={8}
              placeholder="19900101"
              className={inputClass(fieldErrors.birthdate)}
            />
          </Field>

          <Field label="휴대폰 번호" error={fieldErrors.phoneNo} htmlFor="phoneNo" hint="하이픈 없이">
            <input
              id="phoneNo"
              value={form.phoneNo}
              onChange={(e) => update("phoneNo", e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={11}
              autoComplete="tel"
              placeholder="01012345678"
              className={inputClass(fieldErrors.phoneNo)}
            />
          </Field>

          <Field label="통신사" error={fieldErrors.telecom} htmlFor="telecom">
            <select
              id="telecom"
              value={form.telecom}
              onChange={(e) => update("telecom", e.target.value)}
              className={inputClass(fieldErrors.telecom)}
            >
              {Object.entries(TELECOM_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="인증 수단" error={fieldErrors.loginTypeLevel} htmlFor="loginTypeLevel">
            <select
              id="loginTypeLevel"
              value={form.loginTypeLevel}
              onChange={(e) => update("loginTypeLevel", e.target.value)}
              className={inputClass(fieldErrors.loginTypeLevel)}
            >
              {Object.entries(LOGIN_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="조회 기간" error={fieldErrors.startDate} htmlFor="startDate">
            <div className="flex items-center gap-2">
              <input
                id="startDate"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                maxLength={4}
                className={inputClass(fieldErrors.startDate)}
              />
              <span className="text-slate-400">~</span>
              <input
                aria-label="조회 종료 연도"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                maxLength={4}
                className={inputClass(fieldErrors.endDate)}
              />
            </div>
          </Field>
        </div>

        {authMutation.isError && <ErrorNotice message={authMutation.error.message} />}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={authMutation.isPending}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {authMutation.isPending ? "인증 요청 중…" : "건강검진 조회"}
          </button>
          {authMutation.isPending && <Spinner label="간편인증을 요청하고 있습니다" />}
        </div>

        <p className="text-xs text-slate-500">
          입력한 개인정보는 조회 요청에만 사용되며 서버에 저장되지 않습니다.
        </p>
      </form>
    </Card>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-slate-900/10 ${
    error ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-slate-500"
  }`;
}

function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium">
        {label}
        {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
