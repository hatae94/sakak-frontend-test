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

/**
 * 하이드레이션 완료 여부.
 *
 * 서버 렌더 시점에는 sessionStorage를 읽을 수 없어 로그인한 사용자도 잠시
 * 비로그인으로 보인다. 그 순간을 "비로그인"으로 단정하면 로그인한 사용자가
 * 로그인 화면으로 튕기므로, 확정 전까지는 loading 으로 구분한다.
 */
const neverChanges = () => () => {};

function useIsHydrated(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  userName: string | null;
  status: SessionStatus;
  login: (userName: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, read, getServerSnapshot);
  const isHydrated = useIsHydrated();

  // 확정 전에는 이름을 노출하지 않아 화면이 깜빡이지 않게 한다.
  const userName = isHydrated ? stored : null;
  const status: SessionStatus = !isHydrated
    ? "loading"
    : stored
      ? "authenticated"
      : "unauthenticated";

  const login = useCallback((name: string) => write(name), []);
  const logout = useCallback(() => write(null), []);

  const value = useMemo(
    () => ({ userName, status, login, logout }),
    [userName, status, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession은 SessionProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
