import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "ziocbqlkqsbchmjbfdcm.supabase.co" },
      // Allow any https image (for user-uploaded logo/banner URLs)
      { protocol: "https", hostname: "**" },
    ],
  },
  // Do NOT set output:'export' or output:'standalone' — Vercel handles this
  // Make env vars available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
};

export default nextConfig;
