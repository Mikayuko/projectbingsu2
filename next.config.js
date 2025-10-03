/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Output standalone for better Vercel deployment
  output: 'standalone',
  
  // Image configuration
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },

  // Ignore backend directory
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: ['**/backend/**', '**/node_modules/**']
    };
    return config;
  },

  // Handle build errors gracefully
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // Experimental features
  experimental: {
    optimizeCss: false,
  },
};

module.exports = nextConfig;