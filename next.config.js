/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '172.30.56.219',
    '10.255.255.254',
  ],
}

module.exports = nextConfig
