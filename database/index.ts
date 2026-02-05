import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
	process.env.DATABASE_URL ||
	`postgres://${process.env.PG_USER || 'postgres'}:${process.env.PG_PASSWORD || ''}@${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || '5432'}/${process.env.PG_DATABASE || 'db'}`;

const client = postgres(connectionString, {
	max: parseInt(process.env.PG_CONNECTION_LIMIT || '10', 10),
	idle_timeout: 30,
	connect_timeout: 2,
});

export const db = drizzle(client, { schema });

export * from './schema';
