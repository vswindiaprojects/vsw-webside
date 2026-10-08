const backendUrl = (process.env.API_BACKEND_URL || 'http://127.0.0.1:5001').replace(/\/$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
        { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
      ],
    }
  },
}

export default nextConfig
