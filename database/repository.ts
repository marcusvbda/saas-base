import { database } from '@/database/connection';
import type { Pool, PoolClient } from 'pg';

function toPgQuery(
	query: string,
	values: Record<string, unknown> = {},
): { text: string; values: unknown[] } {
	const backtickQuery = query.replace(/`/g, '"');
	const paramNames: string[] = [];
	const text = backtickQuery.replace(/:(\w+)/g, (_, name) => {
		if (values[name] === undefined && !(name in values)) {
			return `:${name}`;
		}
		const idx = paramNames.indexOf(name);
		if (idx === -1) {
			paramNames.push(name);
			return `$${paramNames.length}`;
		}
		return `$${idx + 1}`;
	});
	const pgValues = paramNames.map((name) => values[name]);
	return { text, values: pgValues };
}

export interface TransactionClient extends PoolClient {
	execute(
		query: string,
		values?: Record<string, unknown>,
	): Promise<{ insertId?: number } | unknown[] | unknown>;
}

export default class Repository {
	constructor(protected db: Pool = database) {
		//
	}

	async execute(query: string, values: Record<string, unknown> = {}) {
		const { text, values: pgValues } = toPgQuery(query, values);
		const result = await this.db.query(text, pgValues);
		if (result.command === 'INSERT' && result.rows?.[0]) {
			const row = result.rows[0] as Record<string, unknown>;
			if ('id' in row && row.id !== undefined) {
				return { insertId: row.id as number };
			}
		}
		if (result.command === 'SELECT' || result.command === 'INSERT') {
			return result.rows?.length ? result.rows : [];
		}
		return result.rows ?? result;
	}

	async transaction<T>(
		callback: (connection: TransactionClient) => Promise<T>,
	): Promise<T> {
		const client = await this.db.connect();
		const connection: TransactionClient = Object.assign(client, {
			execute: async (query: string, values: Record<string, unknown> = {}) => {
				const { text, values: pgValues } = toPgQuery(query, values);
				const result = await client.query(text, pgValues);
				if (result.command === 'INSERT' && result.rows?.[0]) {
					const row = result.rows[0] as Record<string, unknown>;
					if ('id' in row && row.id !== undefined) {
						return { insertId: row.id as number };
					}
				}
				if (result.command === 'SELECT' || result.command === 'INSERT') {
					return result.rows?.length ? result.rows : [];
				}
				return result.rows ?? result;
			},
		});
		try {
			await client.query('BEGIN');
			const result = await callback(connection);
			await client.query('COMMIT');
			return result;
		} catch (error) {
			await client.query('ROLLBACK');
			throw error;
		} finally {
			client.release();
		}
	}

	async findOne(
		query: string,
		values: Record<string, unknown> = {},
		client?: PoolClient,
	): Promise<Record<string, unknown> | null> {
		if (!/^select\b/i.test(query.trim())) {
			throw new Error('findOne method is strictly for SELECT statements.');
		}
		const target = client ?? this.db;
		const { text, values: pgValues } = toPgQuery(query, values);
		const result = await target.query(text, pgValues);
		const rows = result.rows;
		return Array.isArray(rows) && rows.length > 0
			? (rows[0] as Record<string, unknown>)
			: null;
	}

	async findMany(
		query: string,
		values: Record<string, unknown> = {},
		client?: PoolClient,
	): Promise<Record<string, unknown>[]> {
		if (!/^select\b/i.test(query.trim())) {
			throw new Error('findMany method is strictly for SELECT statements.');
		}
		const target = client ?? this.db;
		const { text, values: pgValues } = toPgQuery(query, values);
		const result = await target.query(text, pgValues);
		return Array.isArray(result.rows)
			? (result.rows as Record<string, unknown>[])
			: [];
	}
}
