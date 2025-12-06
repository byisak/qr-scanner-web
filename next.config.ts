import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 모드에서 원격 접속 허용
  experimental: {
    // @ts-ignore - allowedDevOrigins는 Next.js 16에서 사용 가능
    allowedDevOrigins: ['*'],
  },
};

export default nextConfig;
