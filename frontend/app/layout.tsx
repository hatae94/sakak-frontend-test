import type { Metadata } from "next";
import "./globals.css";

import { AppHeader } from "@/components/layout/app-header";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "건강검진 대시보드",
  description: "국민건강보험공단 건강검진 결과를 조회하고 시각화합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <Providers>
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
