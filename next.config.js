/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    // Ensure RN packages are transpiled
    'react-native',
    '@rnmapbox/maps'
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web'
    };
    return config;
  }
};

module.exports = nextConfig;
