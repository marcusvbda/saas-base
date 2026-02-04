import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { database } from './connection';

async function dropAllTables() {
	console.log('Dropping all tables...');

	const result = await database.query<{ tablename: string }>(
		`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
	);
	const tables = result.rows ?? [];

	if (tables.length > 0) {
		for (const { tablename } of tables) {
			console.log(`Dropping table: ${tablename}`);
			await database.query(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
		}
		console.log(`Dropped ${tables.length} table(s)`);
	} else {
		console.log('No tables to drop');
	}

	console.log('All tables dropped successfully');
}

async function migrate() {
	const args = process.argv.slice(2);
	const isFresh = args.includes('fresh');

	const result = await database.query<{ current_database: string }>(
		'SELECT current_database() as current_database',
	);
	console.log(
		`Connected to database: ${result.rows[0]?.current_database ?? 'unknown'}`,
	);

	if (isFresh) {
		console.log(
			'Running in FRESH mode - all tables will be dropped and recreated',
		);
		await dropAllTables();
	}

	await database.query(`
		CREATE TABLE IF NOT EXISTS migrations (
			id BIGSERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL UNIQUE,
			executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`);

	const dir = path.join(process.cwd(), 'database/migrations');
	const files = fs.readdirSync(dir).sort();

	const executedResult = await database.query<{ name: string }>(
		'SELECT name FROM migrations',
	);
	const executed = new Set((executedResult.rows ?? []).map((r) => r.name));

	for (const file of files) {
		if (!file.endsWith('.sql')) continue;
		if (!isFresh && executed.has(file)) {
			console.log(`Skipping already executed migration: ${file}`);
			continue;
		}

		const sql = fs.readFileSync(path.join(dir, file), 'utf8');

		console.log(`Running migration: ${file}`);

		const sqlWithoutComments = sql
			.split('\n')
			.filter((line) => !line.trim().startsWith('--'))
			.join('\n');

		const statements = sqlWithoutComments
			.split(';')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];
			if (statement.trim()) {
				try {
					await database.query(statement);
				} catch (error: unknown) {
					const message =
						error instanceof Error ? error.message : String(error);
					console.error(`Error executing statement ${i + 1}:`, message);
					console.error(`Full statement: ${statement}`);
					throw error;
				}
			}
		}

		if (!executed.has(file)) {
			await database.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
		}
	}

	console.log('Migrations complete');
	process.exit(0);
}

migrate().catch((error) => {
	console.error('Migration failed:', error);
	process.exit(1);
});
