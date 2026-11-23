/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@buildmind/shared-types', '@buildmind/ui', '@buildmind/validation'],
};

export default nextConfig;
