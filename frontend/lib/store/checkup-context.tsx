"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { CheckupData } from "@/lib/candiy/types";

/**
 * 조회한 건강검진 데이터를 화면 간에 공유한다.
 *
 * 민감한 개인 의료정보이므로 localStorage/sessionStorage에 저장하지 않고
 * 메모리에만 보관한다. 새로고침하면 사라지며, 이 경우 조회 화면으로 되돌린다.
 */

interface CheckupContextValue {
  data: CheckupData | null;
  setData: (data: CheckupData) => void;
  clear: () => void;
}

const CheckupContext = createContext<CheckupContextValue | null>(null);

export function CheckupProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<CheckupData | null>(null);

  const setData = useCallback((next: CheckupData) => setDataState(next), []);
  const clear = useCallback(() => setDataState(null), []);

  const value = useMemo(() => ({ data, setData, clear }), [data, setData, clear]);

  return <CheckupContext.Provider value={value}>{children}</CheckupContext.Provider>;
}

export function useCheckup(): CheckupContextValue {
  const context = useContext(CheckupContext);
  if (!context) {
    throw new Error("useCheckup은 CheckupProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
