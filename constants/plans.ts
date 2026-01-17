import { Plan } from '@/types/plans';

export const PLANS: Plan[] = [
	{
		id: 'basic',
		name: 'Basic',
		price: {
			BRL: 29,
			USD: 10,
		},
		features: [
			{
				id: 'essential-features',
				label: 'Essential features',
			},
		],
	},
	{
		id: 'pro',
		name: 'Pro',
		price: {
			BRL: 79,
			USD: 25,
		},
		features: [
			{
				id: 'advanced-features',
				label: 'Advanced features',
			},
		],
		isPopular: true,
	},
];

export const DEFAULT_PLAN = 'basic';
