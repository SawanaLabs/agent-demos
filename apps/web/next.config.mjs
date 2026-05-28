/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["bash-tool"],
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig;
