/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@brand2school/branding"],
  experimental: {
    typedRoutes: true,
    externalDir: true
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "api.brand2school.co.za", pathname: "/uploads/**" }
    ]
  }
};

export default nextConfig;
