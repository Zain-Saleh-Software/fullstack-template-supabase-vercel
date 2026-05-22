import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseWsUrl = supabaseUrl.replace(/^http/, "ws");

const connectSrc = `connect-src 'self' https://*.supabase.co wss://*.supabase.co${supabaseUrl ? ` ${supabaseUrl} ${supabaseWsUrl}` : ""}`;
const imgSrc = `img-src 'self' data: blob: https:${supabaseUrl ? ` ${supabaseUrl}` : ""}`;

const cspValue = `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; ${imgSrc}; font-src 'self' data:; ${connectSrc}; frame-ancestors 'none'`;

const nextConfig: NextConfig = {
  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspValue,
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Image optimization for Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Strict mode for catching bugs
  reactStrictMode: true,

  // Powered-by header leaks server info
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
