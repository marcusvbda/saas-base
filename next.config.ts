import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: false,
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
};

export default nextConfig;
