'use client';

import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;

export function getPusherClient(): Pusher | null {
	const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
	const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'us2';

	if (typeof key === 'undefined') return null;

	if (!pusherInstance) {
		pusherInstance = new Pusher(key, { cluster });
	}
	return pusherInstance;
}
