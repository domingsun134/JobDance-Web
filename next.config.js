/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add empty turbopack config to silence the error
  // The webpack config below is still needed for Supabase compatibility
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Fix for Supabase bundling issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig


