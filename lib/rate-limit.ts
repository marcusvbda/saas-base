/**
 * In-memory rate limiter for sensitive endpoints.
 * For production at scale, replace with Redis-backed rate limiting (e.g. @upstash/ratelimit).
 */

const store = new Map<
	string,
	{ count: number; resetAt: number }
>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // per window

function getKey(identifier: string, prefix: string): string {
	return `${prefix}:${identifier}`;
}

export function checkRateLimit(
	identifier: string,
	prefix: string = 'default',
): { allowed: boolean; retryAfter?: number } {
	const key = getKey(identifier, prefix);
	const now = Date.now();
	const entry = store.get(key);

	if (!entry) {
		store.set(key, { count: 1, resetAt: now + WINDOW_MS });
		return { allowed: true };
	}

	if (now >= entry.resetAt) {
		store.set(key, { count: 1, resetAt: now + WINDOW_MS });
		return { allowed: true };
	}

	entry.count += 1;
	if (entry.count > MAX_REQUESTS) {
		return {
			allowed: false,
			retryAfter: Math.ceil((entry.resetAt - now) / 1000),
		};
	}
	return { allowed: true };
}

export function getClientIdentifier(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}
	const realIp = request.headers.get('x-real-ip');
	if (realIp) return realIp.trim();
	return 'unknown';
}
