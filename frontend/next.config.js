/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Remove hardcoded env override - let .env.production handle this
}

module.exports = nextConfig