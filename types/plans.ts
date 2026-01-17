export interface PlanFeature {
	id: string;
	label: string;
}

export interface Plan {
	id: string;
	name: string;
	price: {
		BRL: number;
		USD: number;
	};
	features: PlanFeature[];
	isPopular?: boolean;
}
