import { database } from '@/db/connection';
import { Connection } from 'mysql2/promise';

export default class Repository {
	constructor(protected db: any = database) {
		//
	}

	async execute(query: string, values: any = {}) {
		const [result] = await this.db.execute(query, values);
		return result;
	}

	async transaction(callback: (connection: Connection) => Promise<any>) {
		const connection = await this.db.getConnection();
		try {
			await connection.beginTransaction();
			const [result] = await callback(connection);
			await connection.commit();
			return result;
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	async findOne(query: string, values: Record<string, any> = {}) {
		if (!/^select\b/i.test(query.trim())) {
			throw new Error('findOne method is strictly for SELECT statements.');
		}
		const [rows] = await this.db.execute(query, values);
		return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
	}
}
