"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/status";
import { useSession } from "@/lib/store/session-context";

/**
 * 로그인한 사용자만 건강검진 기능(조회/대시보드/이력)에 접근하게 하는 관문.
 *
 * `(protected)` 는 Route Group 이라 URL 에는 나타나지 않는다. 게이트를 이
 * 레이아웃 한 곳에만 두면 하위 페이지들이 각자 로그인 여부를 검사하지 않아도 되고,
 * 나중에 보호 대상 페이지가 늘어도 폴더에 넣기만 하면 된다.
 *
 * status 가 loading 인 동안은 판단을 미룬다. 하이드레이션 전에는 로그인한
 * 사용자도 비로그인으로 보이기 때문이다. (session-context 참고)
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex justify-center py-20">
        <Spinner
          label={
            status === "loading" ? "세션을 확인하고 있습니다" : "로그인 화면으로 이동합니다"
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
