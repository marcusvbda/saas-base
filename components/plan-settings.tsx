'use client';

import { useSession } from '@/providers/session.provider';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PlanSelector from './plan-selector';
import { toast } from 'sonner';
import { useLocale } from '@/hooks/use-locale';
import { Sheet, SheetContent } from './ui/sheet';
import { DEFAULT_PLAN } from '@/constants/plans';

const CheckoutRender = dynamic(() => import('./checkout-render'), {
	ssr: false,
});
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

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
	const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setPlan(session?.subscription ?? DEFAULT_PLAN);
		setDetail(session?.subscriptionDetail ?? null);
	}, [session?.subscription, session?.subscriptionDetail]);

	const cancelMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch('/api/auth/subscription', {
				method: 'DELETE',
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error ?? t('Failed to cancel subscription'));
			}
			return data;
		},
		onSuccess: (data) => {
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
			setSession((prev: any) => ({
				...prev,
				subscriptionDetail: newDetail,
			}));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const reactivateMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch('/api/auth/subscription', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reactivate: true }),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error ?? t('Failed to reactivate subscription'));
			}
			return data;
		},
		onSuccess: () => {
			toast.success(t('Subscription reactivated'));
			const newDetail: SubscriptionDetail = detail
				? { ...detail, cancelAtPeriodEnd: false }
				: null;
			setDetail(newDetail);
			setSession((prev: any) => ({
				...prev,
				subscriptionDetail: newDetail,
			}));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const updateSubscriptionMutation = useMutation({
		mutationFn: async ({
			plan: newPlan,
			currency,
		}: {
			plan: string;
			currency: 'BRL' | 'USD';
		}) => {
			const response = await fetch('/api/auth/subscription', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ plan: newPlan, currency }),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error ?? t('Failed to update plan'));
			}
			return data;
		},
		onSuccess: (_, variables) => {
			toast.success(t('Plan updated successfully'));
			setPlan(variables.plan);
			setSession((prev: any) => ({
				...prev,
				subscription: variables.plan,
			}));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const createCheckoutMutation = useMutation({
		mutationFn: async ({
			plan: newPlan,
			currency,
		}: {
			plan: string;
			currency: 'BRL' | 'USD';
		}) => {
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					metadata: {
						resource_type: 'plan_subscription',
						resource_id: `${session?.user.id}|${newPlan}`,
					},
					locale,
					currency,
				}),
			});
			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error(err?.error ?? t('Failed to create checkout session'));
			}
			return response.json();
		},
		onSuccess: (data: { clientSecret?: string; sessionId?: string }) => {
			if (data.clientSecret && data.sessionId) {
				setClientSecret(data.clientSecret);
				setCheckoutSessionId(data.sessionId);
				setIsCheckoutOpen(true);
			}
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleCancelClick = () => {
		const confirmed = window.confirm(
			t('Are you sure you want to {action} your subscription?', {
				action: t('cancel'),
			}),
		);
		if (confirmed) cancelMutation.mutate();
	};

	const handleSelectedPlan = async (newPlan: string) => {
		const currentPlan = session?.subscription;
		if (newPlan === currentPlan) return;

		if (newPlan === 'free') {
			handleCancelClick();
			return;
		}
		const hasPaidSubscription = currentPlan && currentPlan !== 'free';
		const isChangingPaidPlan = hasPaidSubscription && currentPlan !== newPlan;
		const currency = locale === 'pt' ? 'BRL' : 'USD';

		if (isChangingPaidPlan) {
			const confirmed = window.confirm(
				t('Are you sure you want to {action} your subscription?', {
					action: t('change'),
				}),
			);
			if (confirmed) {
				updateSubscriptionMutation.mutate({ plan: newPlan, currency });
			}
			return;
		}
		createCheckoutMutation.mutate({ plan: newPlan, currency });
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
						onClick={() => reactivateMutation.mutate()}
						disabled={reactivateMutation.isPending}
					>
						{reactivateMutation.isPending
							? t('Reactivating…')
							: t('Reactivate subscription')}
					</Button>
				</div>
			)}

			<PlanSelector
				value={plan}
				onChange={(p) => handleSelectedPlan(p)}
				loading={createCheckoutMutation.isPending}
			/>

			{plan !== 'free' && !detail?.cancelAtPeriodEnd && (
				<div className="flex justify-end">
					<Button
						variant="ghost"
						className="text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={handleCancelClick}
						disabled={cancelMutation.isPending}
					>
						{cancelMutation.isPending
							? t('Canceling…')
							: t('Cancel subscription')}
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
					{clientSecret && checkoutSessionId && isCheckoutOpen && (
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
