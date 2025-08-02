import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add the images configuration here
  images: {
    // This is the list of allowed external domains for images
    // You should add "placehold.co" to fix the error.
    // Add any other domains you might use in the future as well.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '**',
      },
    ],
  },
  /* other config options can go here */
};

export default nextConfig;
