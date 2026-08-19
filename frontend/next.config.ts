import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Docker 이미지에 필요한 파일만 담기 위해 standalone 출력을 사용한다.
  output: "standalone",
  // pnpm 워크스페이스 루트를 기준으로 standalone 산출물을 구성한다.
  outputFileTracingRoot: __dirname + "/..",
};

export default nextConfig;
