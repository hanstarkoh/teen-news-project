import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // sharp는 플랫폼별 네이티브 바이너리를 쓰는 모듈이라, 번들러가 건드리지 않고
  // 서버 런타임이 node_modules에서 직접 require하도록 둡니다.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
