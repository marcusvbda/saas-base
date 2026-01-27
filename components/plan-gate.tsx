'use client';
import { useLocale } from '@/hooks/use-locale';
import { useSession } from '@/providers/session.provider';
import { PlanType } from '@/types/plans';
import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IProps {
	children: ReactNode;
	allowedPlans: PlanType[] | 'all';
	fallback?: ReactNode;
}

export default function PlanGate({
	children,
	allowedPlans = [],
	fallback = null,
}: IProps) {
	const { session } = useSession();
	const { t, router } = useLocale();
	const currentPlan: PlanType = session?.subscription;

	const planIsAllowed = (plan: PlanType) => {
		if (allowedPlans === 'all') {
			return true;
		}
		return allowedPlans.includes(plan);
	};

	if (!planIsAllowed(currentPlan)) {
		if (fallback) {
			return fallback;
		}

		const handleUpgrade = () => {
			router.push('/settings?section=plan');
		};

		return (
			<div className="flex flex-col items-center justify-center">
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
					<Lock className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="mb-2 text-lg font-semibold">
					{t('Feature restricted to specific plans')}
				</h3>
				<p className="mb-6 max-w-md text-sm text-muted-foreground text-center">
					{t(
						'This feature is not available for your plan. Upgrade your plan to access this feature.',
					)}
				</p>
				<Button onClick={handleUpgrade} size="lg">
					{t('Upgrade Plan')}
				</Button>
			</div>
		);
	}

	return children;
}
