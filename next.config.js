/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  async redirects() {
    return [];
  },
  typescript: {
    // Vercel'da type-checking'i devre dışı bırak
    ignoreBuildErrors: true,
  },
  eslint: {
    // Vercel'da eslint kontrolünü devre dışı bırak
    ignoreDuringBuilds: true,
  },
  distDir: '.next',
  experimental: {
    esmExternals: true,
  },
  webpack: (config) => {
    // ESModules için yapılandırma
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  }
};

export default nextConfig;