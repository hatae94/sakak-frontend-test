"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

/**
 * Mock 로그인 세션.
 *
 * 실제 인증 서버 없이 사용자명만 보관해 맞춤 문구에 사용한다.
 * 건강검진 데이터와 달리 민감정보가 아니므로 새로고침 유지를 위해 sessionStorage를 쓴다.
 *
 * sessionStorage는 React 외부 저장소이므로 useSyncExternalStore로 구독한다.
 * (effect 안에서 setState 하면 렌더가 연쇄되고 SSR 프리렌더와도 어긋난다.)
 */

const STORAGE_KEY = "candiy_mock_user";

const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // 프라이빗 모드 등 접근 불가 — 비로그인으로 취급한다
    return null;
  }
}

function write(value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // 저장에 실패해도 구독자에게는 알려 화면 상태는 일치시킨다
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // 다른 탭에서의 변경도 반영한다
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** 서버 렌더 시점에는 항상 비로그인 상태로 시작한다. */
function getServerSnapshot(): string | null {
  return null;
}

interface SessionContextValue {
  userName: string | null;
  login: (userName: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const userName = useSyncExternalStore(subscribe, read, getServerSnapshot);

  const login = useCallback((name: string) => write(name), []);
  const logout = useCallback(() => write(null), []);

  const value = useMemo(() => ({ userName, login, logout }), [userName, login, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession은 SessionProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
