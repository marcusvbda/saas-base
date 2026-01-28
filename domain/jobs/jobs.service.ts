import JobsRepository from './jobs.repository';

export default class JobsService {
	constructor(private repository: JobsRepository = new JobsRepository()) {
		//
	}

	async processJob(job: any) {
		try {
			const { action, payload } = job;
			const [service, method] = action.split('|');
			const serviceClass = await import(`@/domain/${service}.ts`).then(
				(module) => module.default,
			);
			const serviceInstance = new serviceClass();

			await serviceInstance[method](JSON.parse(payload));
			await this.completedJob(job.id);
		} catch {
			await this.failedJob(job.id);
		}
	}

	async findPendingJobs(queue: string) {
		return await this.repository.findByStatus('pending', queue);
	}

	async completedJob(id: number) {
		return await this.repository.updateJob(id, { status: 'completed' });
	}

	async failedJob(id: number) {
		return await this.repository.updateJob(id, { status: 'failed' });
	}

	async createJob(action: string, payload: any, queue = 'default') {
		return await this.repository.createJob(action, payload, queue);
	}
}
