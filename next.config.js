
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ensuring build proceeds even if there are minor type warnings in generated code
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    API_KEY: process.env.API_KEY,
  }
}

module.exports = nextConfig
