'use client';

import { useSession } from '@/providers/session.provider';
import { useState } from 'react';
import PlanSelector from './plan-selector';
import { DEFAULT_PLAN } from '@/constants/plans';
import { toast } from 'sonner';
import { useLocale } from '@/hooks/use-locale';
import { Sheet, SheetContent } from './ui/sheet';
import CheckoutRender from './checkout-render';
import { useSystem } from '@/providers/system.provider';

export default function PlanSettings() {
	const { t } = useLocale();
	const { session, setSession } = useSession();
	const [plan, setPlan] = useState(session?.settings?.plan || DEFAULT_PLAN);
	const { startTransition } = useSystem();
	const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(
		null,
	);

	const definePlan = async (plan: string) => {
		const response = await fetch(`/api/settings/general-update`, {
			method: 'PUT',
			body: JSON.stringify({ plan }),
		});
		await response.json();
		setPlan(plan);
		await setSession({
			...session,
			settings: { ...session?.settings, plan },
		});
	};

	const handleSelectedPlan = (plan: string) => {
		startTransition(async () => {
			if (plan === 'free') {
				return await definePlan(plan);
			}
			const response = await fetch('/api/checkout', {
				method: 'POST',
				body: JSON.stringify({
					metadata: {
						resource_type: 'plan_subscription',
						resource_id: `${session?.user.id}|${plan}`,
					},
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
