import Repository from '@/database/repository';

export default class JobsRepository extends Repository {
	async createJob(action: string, payload: any, queue: string) {
		return await this.execute(
			'INSERT INTO `jobs` (action, payload, queue) VALUES (:action, :payload, :queue)',
			{ action, payload, queue },
		);
	}

	async findByStatus(status: string, queue: string) {
		return await this.findMany(
			'SELECT * FROM `jobs` WHERE status = :status AND queue = :queue order by created_at asc',
			{
				status,
				queue,
			},
		);
	}

	async updateJob(id: number, data: any) {
		return await this.execute(
			'UPDATE `jobs` SET status = :status, updated_at = now() WHERE id = :id',
			{ id, status: data.status },
		);
	}
}
