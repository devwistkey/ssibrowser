/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      stream: false,
      crypto: false,
      path: false,
      os: false,
    };

    return config;
  },
};

module.exports = nextConfig;
