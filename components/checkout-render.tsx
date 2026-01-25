'use client';
import SSEClient from '@/lib/sse/client';
import { useSystem } from '@/providers/system.provider';
import { loadStripe } from '@stripe/stripe-js';
import { notFound } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface IProps {
	clientSecret: string;
	sessionId: string;
}

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

export default function CheckoutRender({ clientSecret, sessionId }: IProps) {
	const checkoutRef = useRef<HTMLDivElement>(null);
	const { startTransition } = useSystem();

	useEffect(() => {
		if (!clientSecret || !checkoutRef.current) return;
		let checkout: any;
		const mountCheckout = async () => {
			const stripe = await stripePromise;
			if (!stripe) throw new Error('Stripe failed to load');
			checkout = await stripe.initEmbeddedCheckout({
				clientSecret: clientSecret || undefined,
			});
			checkout.mount(checkoutRef.current!);
		};

		mountCheckout();
		return () => {
			checkout?.destroy();
			startTransition(async () => {
				await fetch('/api/checkout', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'same-origin',
					body: JSON.stringify({
						metadata: { sessionId },
					}),
				});
			});
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clientSecret, sessionId]);

	return (
		<SSEClient
			eventName={`check-checkout-session-${sessionId}`}
			route={`/api/checkout?sessionId=${sessionId}`}
			initialData={{
				session_id: sessionId,
			}}
			render={(data: any) => {
				if (!data?.session_id) {
					return notFound();
				}
				return <div ref={checkoutRef} className="w-full" />;
			}}
		/>
	);
}
