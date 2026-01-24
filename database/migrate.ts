import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { database } from './connection';

async function dropAllTables() {
	console.log('Dropping all tables...');

	await database.query('SET FOREIGN_KEY_CHECKS = 0');

	try {
		const [tables] = await database.query<any[]>(
			'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()',
		);

		if (tables && tables.length > 0) {
			for (const table of tables) {
				const tableName = table.TABLE_NAME;
				console.log(`Dropping table: ${tableName}`);
				await database.query(`DROP TABLE IF EXISTS \`${tableName}\``);
			}
			console.log(`Dropped ${tables.length} table(s)`);
		} else {
			console.log('No tables to drop');
		}
	} finally {
		await database.query('SET FOREIGN_KEY_CHECKS = 1');
	}

	console.log('All tables dropped successfully');
}

async function migrate() {
	const args = process.argv.slice(2);
	const isFresh = args.includes('fresh');

	const [dbInfo] = await database.query<any[]>('SELECT DATABASE() as db');
	console.log(`Connected to database: ${dbInfo[0]?.db || 'unknown'}`);

	if (isFresh) {
		console.log(
			'Running in FRESH mode - all tables will be dropped and recreated',
		);
		await dropAllTables();
	}

	await database.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

	const dir = path.join(process.cwd(), 'database/migrations');
	const files = fs.readdirSync(dir).sort();

	const [rows] = await database.query('SELECT name FROM migrations');

	const executed = new Set((rows as any[]).map((r) => r.name));

	for (const file of files) {
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
				} catch (error: any) {
					console.error(`Error executing statement ${i + 1}:`, error.message);
					console.error(`Full statement: ${statement}`);
					throw error;
				}
			}
		}

		if (!executed.has(file)) {
			await database.query('INSERT INTO migrations (name) VALUES (?)', [file]);
		}
	}

	console.log('Migrations complete');
	process.exit(0);
}

migrate().catch((error) => {
	console.error('Migration failed:', error);
	process.exit(1);
});
