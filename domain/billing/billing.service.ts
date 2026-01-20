import BillingRepository from './billing.repository';

export default class BillingService {
	constructor(private repository: BillingRepository = new BillingRepository()) {
		//
	}

	async getBillingByUserId(userId: string) {
		return this.repository.findBillingByUserId(userId);
	}

	async upsertBilling(userId: string, data: any) {
		const billing = await this.repository.findBillingByUserId(userId);
		if (billing) {
			return await this.repository.updateBilling(billing.id, data);
		}
		await this.repository.createBilling(userId, data);
	}
}
