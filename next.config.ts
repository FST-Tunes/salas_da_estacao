import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node serverless runtime (Vercel default) — not Edge — to stay portable.
  reactStrictMode: true,
};

export default nextConfig;
