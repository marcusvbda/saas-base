'use client';

import { useSession } from '@/providers/session.provider';
import { useState, useEffect } from 'react';
import PlanSelector from './plan-selector';
import { toast } from 'sonner';
import { useLocale } from '@/hooks/use-locale';
import { Sheet, SheetContent } from './ui/sheet';
import CheckoutRender from './checkout-render';
import { useSystem } from '@/providers/system.provider';
import { DEFAULT_PLAN } from '@/constants/plans';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

type SubscriptionDetail = {
	plan: string;
	status: string;
	cancelAtPeriodEnd: boolean;
	currentPeriodEnd: string | null;
} | null;

export default function PlanSettings() {
	const { t, locale } = useLocale();
	const { session, setSession } = useSession();
	const [plan, setPlan] = useState(session?.subscription ?? DEFAULT_PLAN);
	const [detail, setDetail] = useState<SubscriptionDetail>(
		session?.subscriptionDetail ?? null,
	);
	const { startTransition } = useSystem();
	const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(
		null,
	);
	const [isCanceling, setIsCanceling] = useState(false);
	const [isReactivating, setIsReactivating] = useState(false);

	useEffect(() => {
		setPlan(session?.subscription ?? DEFAULT_PLAN);
		setDetail(session?.subscriptionDetail ?? null);
	}, [session?.subscription, session?.subscriptionDetail]);

	const cancelSubscription = async () => {
		const confirmed = window.confirm(
			t('Are you sure you want to {action} your subscription?', {
				action: t('cancel'),
			}),
		);
		if (!confirmed) return;
		setIsCanceling(true);
		try {
			const response = await fetch(`/api/auth/subscription`, {
				method: 'DELETE',
			});
			const data = await response.json();
			if (!response.ok) {
				toast.error(data?.error ?? t('Failed to cancel subscription'));
				return;
			}
			const periodEnd = data.currentPeriodEnd
				? new Date(data.currentPeriodEnd)
				: null;
			const endStr = periodEnd
				? periodEnd.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					})
				: null;
			toast.success(
				endStr
					? t('Subscription will end on {date}. You keep access until then.', {
							date: endStr,
						})
					: t('Subscription canceled'),
			);
			const newDetail: SubscriptionDetail = {
				plan: plan ?? detail?.plan ?? 'free',
				status: detail?.status ?? 'active',
				cancelAtPeriodEnd: true,
				currentPeriodEnd:
					data.currentPeriodEnd ?? detail?.currentPeriodEnd ?? null,
			};
			setDetail(newDetail);
			await setSession({
				...session,
				subscriptionDetail: newDetail,
			});
		} finally {
			setIsCanceling(false);
		}
	};

	const reactivateSubscription = async () => {
		setIsReactivating(true);
		try {
			const response = await fetch('/api/auth/subscription', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reactivate: true }),
			});
			const data = await response.json();
			if (!response.ok) {
				toast.error(data?.error ?? t('Failed to reactivate subscription'));
				return;
			}
			toast.success(t('Subscription reactivated'));
			const newDetail: SubscriptionDetail = detail
				? { ...detail, cancelAtPeriodEnd: false }
				: null;
			setDetail(newDetail);
			await setSession({
				...session,
				subscriptionDetail: newDetail,
			});
		} finally {
			setIsReactivating(false);
		}
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
		const { clientSecret: secret, sessionId } = await response.json();
		if (secret && sessionId) {
			setClientSecret(secret);
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

	const periodEndFormatted = detail?.currentPeriodEnd
		? new Date(detail.currentPeriodEnd).toLocaleDateString(
				locale === 'pt' ? 'pt-BR' : 'en-US',
				{ year: 'numeric', month: 'long', day: 'numeric' },
			)
		: null;
	const showCancelBanner = Boolean(detail?.cancelAtPeriodEnd);

	return (
		<div className="space-y-6">
			{showCancelBanner && (
				<div
					className={cn(
						'flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
						'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30',
					)}
				>
					<span className="text-sm">
						{periodEndFormatted
							? t(
									'Your subscription will end on {date}. You keep access until then.',
									{ date: periodEndFormatted },
								)
							: t(
									'Your subscription is set to cancel. You keep access until the end of your billing period.',
								)}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={reactivateSubscription}
						disabled={isReactivating}
					>
						{isReactivating ? t('Reactivating…') : t('Reactivate subscription')}
					</Button>
				</div>
			)}

			<PlanSelector value={plan} onChange={(p) => handleSelectedPlan(p)} />

			{plan !== 'free' && !detail?.cancelAtPeriodEnd && (
				<div className="flex justify-end">
					<Button
						variant="ghost"
						className="text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={cancelSubscription}
						disabled={isCanceling}
					>
						{isCanceling ? t('Canceling…') : t('Cancel subscription')}
					</Button>
				</div>
			)}

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
				<SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
					{clientSecret && checkoutSessionId && (
						<CheckoutRender
							clientSecret={clientSecret}
							sessionId={checkoutSessionId}
						/>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
