import Repository from '@/database/repository';

export type ReportStatus = 'processing' | 'ready' | 'failed';

export type DailyReport = {
	id: number;
	user_id: string;
	report_date: string;
	from_date: string | null;
	content: string;
	status: ReportStatus;
	enhanced_at: string | null;
	created_at: string;
	updated_at: string;
};

export type DailyReportInput = {
	report_date: string;
	from_date?: string | null;
	content: string;
	status?: ReportStatus;
	enhanced?: boolean;
};

export default class ReportsRepository extends Repository {
	private readonly columns =
		'`id`, `user_id`, `report_date`, `from_date`, `content`, `status`, `enhanced_at`, `created_at`, `updated_at`';

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
		return this.findByUserAndReportAndFrom(userId, reportDate, reportDate);
	}

	async findByUserAndReportAndFrom(
		userId: string,
		reportDate: string,
		fromDate: string,
	): Promise<DailyReport | null> {
		return this.findOne(
			`SELECT ${this.columns} FROM \`daily_reports\` WHERE \`user_id\` = :userId AND \`report_date\` = :reportDate AND \`from_date\` = :fromDate`,
			{ userId, reportDate, fromDate },
		) as Promise<DailyReport | null>;
	}

	async findAllByUserId(userId: string): Promise<DailyReport[]> {
		return this.findMany(
			`SELECT ${this.columns} FROM \`daily_reports\` WHERE \`user_id\` = :userId ORDER BY \`report_date\` DESC`,
			{ userId },
		) as Promise<DailyReport[]>;
	}

	async findAllByUserIdAndDateRange(
		userId: string,
		fromDate: string,
		toDate: string,
	): Promise<DailyReport[]> {
		return this.findMany(
			`SELECT ${this.columns} FROM \`daily_reports\` WHERE \`user_id\` = :userId AND \`report_date\` >= :fromDate AND \`report_date\` <= :toDate ORDER BY \`report_date\` ASC`,
			{ userId, fromDate, toDate },
		) as Promise<DailyReport[]>;
	}

	async upsert(userId: string, data: DailyReportInput): Promise<number> {
		const status = data.status ?? 'ready';
		const fromDate = data.from_date ?? data.report_date;
		const existing = await this.findByUserAndReportAndFrom(
			userId,
			data.report_date,
			fromDate,
		);
		const enhanced = data.enhanced ?? false;
		if (existing) {
			if (enhanced) {
				await this.execute(
					`UPDATE \`daily_reports\` SET \`content\` = :content, \`status\` = :status, \`enhanced_at\` = CURRENT_TIMESTAMP, \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = :id AND \`user_id\` = :userId`,
					{
						id: existing.id,
						userId,
						content: data.content,
						status,
					},
				);
			} else {
				await this.execute(
					`UPDATE \`daily_reports\` SET \`content\` = :content, \`status\` = :status, \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = :id AND \`user_id\` = :userId`,
					{
						id: existing.id,
						userId,
						content: data.content,
						status,
					},
				);
			}
			return existing.id;
		}
		const insertColumns = enhanced
			? '`user_id`, `report_date`, `from_date`, `content`, `status`, `enhanced_at`'
			: '`user_id`, `report_date`, `from_date`, `content`, `status`';
		const insertValues = enhanced
			? ':userId, :reportDate, :fromDate, :content, :status, CURRENT_TIMESTAMP'
			: ':userId, :reportDate, :fromDate, :content, :status';
		const result = (await this.execute(
			`INSERT INTO \`daily_reports\` (${insertColumns}) VALUES (${insertValues}) RETURNING id`,
			{
				userId,
				reportDate: data.report_date,
				fromDate,
				content: data.content,
				status,
			},
		)) as { insertId?: number };
		return result.insertId ?? 0;
	}

	async updateStatus(
		userId: string,
		id: number,
		status: ReportStatus,
	): Promise<void> {
		await this.execute(
			`UPDATE \`daily_reports\` SET \`status\` = :status, \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = :id AND \`user_id\` = :userId`,
			{ id, userId, status },
		);
	}

	async updateContent(
		userId: string,
		id: number,
		content: string,
		enhanced?: boolean,
	): Promise<void> {
		if (enhanced) {
			await this.execute(
				`UPDATE \`daily_reports\` SET \`content\` = :content, \`enhanced_at\` = CURRENT_TIMESTAMP, \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = :id AND \`user_id\` = :userId`,
				{ id, userId, content },
			);
		} else {
			await this.execute(
				`UPDATE \`daily_reports\` SET \`content\` = :content, \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = :id AND \`user_id\` = :userId`,
				{ id, userId, content },
			);
		}
	}

	async deleteByIdForUser(userId: string, id: number): Promise<void> {
		await this.execute(
			`DELETE FROM \`daily_reports\` WHERE \`user_id\` = :userId AND \`id\` = :id`,
			{ userId, id },
		);
	}
}
