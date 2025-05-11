

// next.config.js
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/birds',
        destination: 'http://localhost:5555/birds',
      },
    ];
  },
};

module.exports = nextConfig;
