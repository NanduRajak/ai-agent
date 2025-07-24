import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@e2b/code-interpreter"],
  env: {
    E2B_API_KEY: process.env.E2B_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  },
};

export default nextConfig;
