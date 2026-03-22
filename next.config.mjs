/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["rss-parser"],
  },
};

export default nextConfig;
