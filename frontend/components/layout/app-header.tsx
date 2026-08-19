"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCheckup } from "@/lib/store/checkup-context";
import { useSession } from "@/lib/store/session-context";

const NAV = [
  { href: "/", label: "조회" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/history", label: "검진 이력" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { userName, logout } = useSession();
  const { data, clear } = useCheckup();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          건강검진 대시보드
        </Link>

        <nav className="flex items-center gap-1" aria-label="주요 메뉴">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {data && (
            <button
              type="button"
              onClick={clear}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100"
            >
              조회 결과 지우기
            </button>
          )}
          {userName ? (
            <>
              <span className="hidden text-slate-600 sm:inline">{userName}님</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
