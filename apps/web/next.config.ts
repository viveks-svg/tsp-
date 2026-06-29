/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    // Strip trailing slash if present to avoid double slashes
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    return [
      {
        source: "/api/:path*",
        destination: `${cleanBackendUrl}/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;