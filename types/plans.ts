export interface PlanFeature {
	id: string;
	label: string;
}

export type PlanType = 'free' | 'basic' | 'pro';

export interface Plan {
	id: PlanType;
	name: string;
	price: {
		BRL: number;
		USD: number;
	};
	features: PlanFeature[];
	isPopular?: boolean;
}
