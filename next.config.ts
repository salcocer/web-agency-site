import type { NextConfig } from "next";

// Cache Components are off because Cloudflare Workers (via OpenNext) can't run them yet:
// https://github.com/opennextjs/opennextjs-cloudflare/pull/1318
const nextConfig: NextConfig = {};

export default nextConfig;
