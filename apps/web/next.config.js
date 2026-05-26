/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@revenue-autopilot/ui", "@revenue-autopilot/lib"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

module.exports = nextConfig;
