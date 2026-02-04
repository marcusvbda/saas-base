import { Pool } from 'pg';

const poolConfig = {
	host: process.env.PG_HOST || 'localhost',
	port: parseInt(process.env.PG_PORT || '5432'),
	user: process.env.PG_USER || 'postgres',
	password: process.env.PG_PASSWORD || '',
	database: process.env.PG_DATABASE || 'db',
	max: parseInt(process.env.PG_CONNECTION_LIMIT || '10'),
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
};

export const database: Pool = new Pool(
	process.env.DATABASE_URL
		? { connectionString: process.env.DATABASE_URL }
		: poolConfig,
);

if (typeof process !== 'undefined') {
	const shutdown = async () => {
		try {
			await database?.end();
		} catch {
			//
		}
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}
