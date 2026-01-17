'use client';

import { useLocale } from '@/hooks/use-locale';
import { PLANS } from '@/constants/plans';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Plan } from '@/types/plans';
import { formatPrice } from '@/helpers/money';

interface PlanSelectorProps {
	value: string;
	onChange: (value: string) => void;
}

export default function PlanSelector({ value, onChange }: PlanSelectorProps) {
	const { t, locale } = useLocale();

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{PLANS.map((plan: Plan) => {
				const isSelected = value === plan.id;
				const isPopular = plan.isPopular;

				return (
					<Card
						key={plan.id}
						className={cn(
							'relative flex flex-col cursor-pointer transition-all hover:shadow-md',
							isSelected ? 'border-primary border-2' : 'border',
						)}
						onClick={(e) => {
							e.preventDefault();
							onChange(plan.id);
						}}
					>
						{isPopular && (
							<Badge
								className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground"
								variant="default"
							>
								{t('Most Popular')}
							</Badge>
						)}
						<CardContent className="flex flex-col gap-4 pt-6 h-full">
							<div className="space-y-2">
								<h3 className="text-2xl font-bold">
									{t(plan.name as any) || plan.name}
								</h3>
								<div className="flex items-baseline gap-1">
									<span className="text-3xl font-bold">
										{formatPrice(plan.price, locale)}
									</span>
									<span className="text-muted-foreground">/ {t('month')}</span>
								</div>
							</div>

							<ul className="space-y-2 flex-1">
								{plan.features.map((feature, index) => (
									<li
										key={`${feature.id}-${index}`}
										className="flex items-center gap-2"
									>
										<CheckIcon className="h-5 w-5 text-green-500 shrink-0" />
										<span className="text-sm">
											{t(feature.label as any) || feature.label}
										</span>
									</li>
								))}
							</ul>

							<Button
								type="button"
								variant={isSelected ? 'default' : 'outline'}
								className="w-full mt-auto"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onChange(plan.id);
								}}
							>
								{isSelected ? t('Choose Plan') : t('Select')}
							</Button>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
