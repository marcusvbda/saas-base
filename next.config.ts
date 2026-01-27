import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: false,
	compress: true,
	poweredByHeader: false,
	env: {
		NEXT_PUBLIC_GOOGLE_ENABLED:
			process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
				? 'true'
				: 'false',
		NEXT_PUBLIC_APPLE_ENABLED:
			process.env.APPLE_CLIENT_ID &&
			process.env.APPLE_CLIENT_SECRET &&
			process.env.APPLE_TEAM_ID &&
			process.env.APPLE_KEY_ID &&
			process.env.APPLE_PRIVATE_KEY
				? 'true'
				: 'false',
	},
	images: {
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},
};

export default nextConfig;
