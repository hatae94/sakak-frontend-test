import path from "node:path";

import type { NextConfig } from "next";

/**
 * standalone 출력은 Docker 로 self-host 할 때 필요한 최소 파일만 담기 위한 설정이다.
 * Vercel 은 자체 빌드 파이프라인으로 파일 추적을 처리하므로 standalone 을 켜면
 * 산출물 구조가 어긋나 빌드가 실패한다. 배포 대상에 따라 나눈다.
 */
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(isVercel
    ? {}
    : {
        output: "standalone",
        // pnpm 워크스페이스 루트를 기준으로 의존성을 추적한다.
        outputFileTracingRoot: path.join(__dirname, ".."),
      }),
};

export default nextConfig;
