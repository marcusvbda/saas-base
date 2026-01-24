'use client';
import { useSystem } from '@/providers/system.provider';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useRef } from 'react';

interface IProps {
	clientSecret: string;
}

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

export default function CheckoutRender({ clientSecret }: IProps) {
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
					body: JSON.stringify({
						metadata: { sessionId: clientSecret },
					}),
				});
			});
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clientSecret]);

	return <div ref={checkoutRef} className="w-full" />;
}
