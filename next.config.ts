
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  },
};

export default nextConfig;
