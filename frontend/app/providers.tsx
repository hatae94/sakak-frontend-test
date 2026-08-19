"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { CheckupProvider } from "@/lib/store/checkup-context";
import { SessionProvider } from "@/lib/store/session-context";

export function Providers({ children }: { children: React.ReactNode }) {
  // 요청당 하나의 QueryClient — 사용자 간 캐시 공유를 방지한다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
          // 조회 1회당 FREE 등급 할당량이 소모되므로 변이는 재시도하지 않는다.
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CheckupProvider>{children}</CheckupProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
