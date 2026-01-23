import PaymentsRepository from './payments.repository';

export default class PaymentsService {
	constructor(
		private repository: PaymentsRepository = new PaymentsRepository(),
	) {
		//
	}
}
