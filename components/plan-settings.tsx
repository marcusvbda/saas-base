'use client';

import { useSession } from '@/providers/session.provider';
import { useState } from 'react';
import PlanSelector from './plan-selector';
import { toast } from 'sonner';
import { useLocale } from '@/hooks/use-locale';
import { Sheet, SheetContent } from './ui/sheet';
import CheckoutRender from './checkout-render';
import { useSystem } from '@/providers/system.provider';
import { DEFAULT_PLAN } from '@/constants/plans';

export default function PlanSettings() {
	const { t, locale } = useLocale();
	const { session, setSession } = useSession();
	const [plan, setPlan] = useState(session?.subscription);
	const { startTransition } = useSystem();
	const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(
		null,
	);

	const cancelSubscription = async () => {
		const confirmed = window.confirm(
			t('Are you sure you want to {action} your subscription?', {
				action: t('cancel'),
			}),
		);
		if (!confirmed) return;
		const response = await fetch(`/api/auth/subscription`, {
			method: 'DELETE',
		});
		await response.json();
		toast.success(t('Subscription canceled'));
		setPlan(DEFAULT_PLAN);
		await setSession({
			...session,
			subscription: DEFAULT_PLAN,
		});
	};

	const updateSubscription = async (plan: string, currency: 'BRL' | 'USD') => {
		const confirmed = window.confirm(
			t('Are you sure you want to {action} your subscription?', {
				action: t('change'),
			}),
		);
		if (!confirmed) return;
		const response = await fetch('/api/auth/subscription', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ plan, currency }),
		});
		const data = await response.json();
		if (!response.ok) {
			toast.error(data?.error ?? t('Failed to update plan'));
			return;
		}
		toast.success(t('Plan updated successfully'));
		setPlan(plan);
		await setSession({
			...session,
			subscription: plan,
		});
	};

	const createCheckoutSession = async (
		plan: string,
		currency: 'BRL' | 'USD',
	) => {
		const response = await fetch('/api/checkout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				metadata: {
					resource_type: 'plan_subscription',
					resource_id: `${session?.user.id}|${plan}`,
				},
				locale,
				currency,
			}),
		});
		if (!response.ok) {
			toast.error(t('Failed to create checkout session'));
			return;
		}
		const { clientSecret, sessionId } = await response.json();
		if (clientSecret && sessionId) {
			setClientSecret(clientSecret);
			setCheckoutSessionId(sessionId);
			setIsCheckoutOpen(true);
		}
	};

	const handleSelectedPlan = (plan: string) => {
		startTransition(async () => {
			const currentPlan = session?.subscription;
			if (plan === currentPlan) return;

			if (plan === 'free') {
				return await cancelSubscription();
			}
			const hasPaidSubscription = currentPlan && currentPlan !== 'free';
			const isChangingPaidPlan = hasPaidSubscription && currentPlan !== plan;

			const currency = locale === 'pt' ? 'BRL' : 'USD';
			if (isChangingPaidPlan) {
				await updateSubscription(plan, currency);
				return;
			}

			await createCheckoutSession(plan, currency);
		});
	};

	return (
		<>
			<PlanSelector
				value={plan}
				onChange={(plan) => handleSelectedPlan(plan)}
			/>
			<Sheet
				open={isCheckoutOpen}
				onOpenChange={(open) => {
					setIsCheckoutOpen(open);
					if (!open) {
						setClientSecret(null);
						setCheckoutSessionId(null);
					}
				}}
			>
				<SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
					{clientSecret && checkoutSessionId && (
						<CheckoutRender
							clientSecret={clientSecret}
							sessionId={checkoutSessionId}
						/>
					)}
				</SheetContent>
			</Sheet>
		</>
	);
}
