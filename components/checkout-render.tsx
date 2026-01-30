'use client';

import { useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useRef } from 'react';

interface IProps {
	clientSecret: string;
	sessionId: string;
}

export default function CheckoutRender({ clientSecret, sessionId }: IProps) {
	const checkoutRef = useRef<HTMLDivElement>(null);

	const deleteCheckoutMutation = useMutation({
		mutationFn: async ({ sessionId: id }: { sessionId: string }) => {
			await fetch('/api/checkout', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					metadata: { sessionId: id },
				}),
			});
		},
	});

	useEffect(() => {
		if (!clientSecret || !checkoutRef.current) return;
		let checkout: any;
		const mountCheckout = async () => {
			const stripe = await loadStripe(
				process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
			);
			if (!stripe) throw new Error('Stripe failed to load');
			checkout = await stripe.initEmbeddedCheckout({
				clientSecret: clientSecret || undefined,
			});
			checkout.mount(checkoutRef.current!);
		};

		mountCheckout();
		return () => {
			checkout?.destroy();
			deleteCheckoutMutation.mutate({ sessionId });
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clientSecret, sessionId]);

	return <div ref={checkoutRef} className="w-full" />;
}
