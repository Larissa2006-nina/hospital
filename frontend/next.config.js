/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'BloodLink - Blood Donation Management System',
  }
};

module.exports = nextConfig;
