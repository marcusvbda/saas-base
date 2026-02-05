import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const connectionString =
	process.env.DATABASE_URL ||
	`postgres://${process.env.PG_USER || 'postgres'}:${process.env.PG_PASSWORD || ''}@${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || '5432'}/${process.env.PG_DATABASE || 'db'}`;

export default defineConfig({
	schema: './database/schema.ts',
	out: './database/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: connectionString,
	},
});
