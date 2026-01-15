'use client';

import { SocialLoginButtons } from './social-login-buttons';

export function SocialLoginProvider() {
	const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true';
	const hasApple = process.env.NEXT_PUBLIC_APPLE_ENABLED === 'true';

	return <SocialLoginButtons hasGoogle={hasGoogle} hasApple={hasApple} />;
}
