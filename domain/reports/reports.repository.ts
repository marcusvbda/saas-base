import Repository from '@/database/repository';

export type DailyReport = {
	id: number;
	user_id: string;
	report_date: string;
	content: string;
	created_at: string;
	updated_at: string;
};

export type DailyReportInput = {
	report_date: string;
	content: string;
};

export default class ReportsRepository extends Repository {
	private readonly columns =
		'`id`, `user_id`, `report_date`, `content`, `created_at`, `updated_at`';

	async findById(id: number): Promise<DailyReport | null> {
		return this.findOne(
			`SELECT ${this.columns} FROM \`daily_reports\` WHERE \`id\` = :id`,
			{ id },
		) as Promise<DailyReport | null>;
	}

	async findByIdForUser(
		userId: string,
		id: number,
	): Promise<DailyReport | null> {
		return this.findOne(
			`SELECT ${this.columns} FROM \`daily_reports\` WHERE \`user_id\` = :userId AND \`id\` = :id`,
			{ userId, id },
		) as Promise<DailyReport | null>;
	}

	async findByUserAndDate(
		userId: string,
		reportDate: string,
	): Promise<DailyReport | null> {
		return this.findOne(
			`SELECT ${this.columns} FROM \`daily_reports\` WHERE \`user_id\` = :userId AND \`report_date\` = :reportDate`,
			{ userId, reportDate },
		) as Promise<DailyReport | null>;
	}

	async findAllByUserId(userId: string): Promise<DailyReport[]> {
		return this.db
			.execute(
				`SELECT ${this.columns} FROM \`daily_reports\` WHERE \`user_id\` = :userId ORDER BY \`report_date\` DESC`,
				{ userId },
			)
			.then(([rows]: unknown[]) => rows as DailyReport[]);
	}

	async upsert(
		userId: string,
		data: DailyReportInput,
	): Promise<number> {
		const existing = await this.findByUserAndDate(userId, data.report_date);
		if (existing) {
			await this.execute(
				`UPDATE \`daily_reports\` SET \`content\` = :content, \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = :id AND \`user_id\` = :userId`,
				{
					id: existing.id,
					userId,
					content: data.content,
				},
			);
			return existing.id;
		}
		const result = (await this.execute(
			`INSERT INTO \`daily_reports\` (\`user_id\`, \`report_date\`, \`content\`) VALUES (:userId, :reportDate, :content)`,
			{
				userId,
				reportDate: data.report_date,
				content: data.content,
			},
		)) as { insertId?: number };
		return result.insertId ?? 0;
	}

	async updateContent(
		userId: string,
		id: number,
		content: string,
	): Promise<void> {
		await this.execute(
			`UPDATE \`daily_reports\` SET \`content\` = :content, \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = :id AND \`user_id\` = :userId`,
			{ id, userId, content },
		);
	}

	async deleteByIdForUser(userId: string, id: number): Promise<void> {
		await this.execute(
			`DELETE FROM \`daily_reports\` WHERE \`user_id\` = :userId AND \`id\` = :id`,
			{ userId, id },
		);
	}
}
