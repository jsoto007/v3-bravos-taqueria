

// next.config.js
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5555';
    return [
      {
        source: '/birds',
        destination: `${backendUrl}/birds`,
      },
    ];
  },
};

module.exports = nextConfig;
