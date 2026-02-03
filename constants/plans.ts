import { Plan } from '@/types/plans';

export const PLANS: Plan[] = [
	{
		id: 'free',
		name: 'Free',
		price: {
			BRL: 0,
			USD: 0,
		},
		features: [
			{
				id: 'free-features',
				label: 'Free features',
			},
		],
		isPopular: false,
	},
	// {
	// 	id: 'basic',
	// 	name: 'Basic',
	// 	price: {
	// 		BRL: 14.99,
	// 		USD: 10,
	// 	},
	// 	features: [
	// 		{
	// 			id: 'essential-features',
	// 			label: 'Essential features',
	// 		},
	// 	],
	// 	isPopular: true,
	// },
	// {
	// 	id: 'pro',
	// 	name: 'Pro',
	// 	price: {
	// 		BRL: 79,
	// 		USD: 25,
	// 	},
	// 	features: [
	// 		{
	// 			id: 'advanced-features',
	// 			label: 'Advanced features',
	// 		},
	// 	],
	// 	isPopular: false,
	// },
];

export const DEFAULT_PLAN = 'free';
