"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card, ErrorNotice } from "@/components/ui/status";
import { useSession } from "@/lib/store/session-context";

/**
 * Mock 로그인.
 * 실제 인증 서버 없이 이름만 받아 맞춤 문구에 사용한다.
 * 건강검진 조회 자체는 CANDiY 간편인증으로 별도 수행된다.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("이름을 2자 이상 입력해주세요.");
      return;
    }
    setError(null);
    login(trimmed);
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">로그인</h1>
            <p className="mt-1 text-sm text-slate-500">
              데모용 로그인입니다. 입력한 이름은 화면 안내 문구에만 사용되며 서버로
              전송되지 않습니다.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              이름
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="홍길동"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-slate-900/10 ${
                error ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-slate-500"
              }`}
            />
          </div>

          {error && <ErrorNotice message={error} />}

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            로그인
          </button>
        </form>
      </Card>
    </div>
  );
}
