'use client';

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import BasePage from '../base-page';
import Loading from '@/components/loading';

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

export default function CheckoutTestPage() {
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const checkoutRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		async function createCheckoutSession() {
			try {
				const response = await fetch('/api/checkout/create', {
					method: 'POST',
				});

				if (!response.ok) {
					throw new Error('Failed to create checkout session');
				}

				const data = await response.json();
				setClientSecret(data.clientSecret);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error');
			} finally {
				setIsLoading(false);
			}
		}

		createCheckoutSession();
	}, []);

	useEffect(() => {
		if (!clientSecret || !checkoutRef.current) return;

		let checkout: any;

		async function mountCheckout() {
			const stripe = await stripePromise;
			if (!stripe) {
				setError('Stripe failed to load');
				return;
			}

			checkout = await stripe.initEmbeddedCheckout({
				clientSecret: clientSecret || undefined,
			});

			checkout.mount(checkoutRef.current!);
		}

		mountCheckout();

		return () => {
			if (checkout) {
				checkout.destroy();
			}
		};
	}, [clientSecret]);

	return (
		<BasePage title="Checkout Test" description="Test checkout">
			{isLoading && <Loading />}

			{error && (
				<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
					<p className="text-destructive">{error}</p>
				</div>
			)}

			{clientSecret && (
				<div ref={checkoutRef} id="checkout" className="w-full" />
			)}
		</BasePage>
	);
}
