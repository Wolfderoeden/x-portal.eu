import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const privateHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "private, no-store" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ];

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          ...privateHeaders,
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/account/:path*",
        headers: [
          ...privateHeaders,
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: privateHeaders,
      },
    ];
  },
};

export default nextConfig;
