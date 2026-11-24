import type { NextConfig } from "next";

// Cache Components are off because Cloudflare Workers (via OpenNext) can't run them yet:
// https://github.com/opennextjs/opennextjs-cloudflare/pull/1318
const nextConfig: NextConfig = {
  async redirects() {
    return [
      // www.kata-studio.app is attached to the Worker in wrangler.jsonc; send it to the root domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.kata-studio.app" }],
        destination: "https://kata-studio.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
