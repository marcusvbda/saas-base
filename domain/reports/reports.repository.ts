import { db } from '@/database';
import { dailyReports } from '@/database/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

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

function toReport(row: typeof dailyReports.$inferSelect): DailyReport {
	return {
		id: row.id,
		user_id: row.userId,
		report_date: row.reportDate,
		from_date: row.fromDate,
		content: row.content,
		status: row.status as ReportStatus,
		enhanced_at: row.enhancedAt
			? row.enhancedAt instanceof Date
				? row.enhancedAt.toISOString()
				: String(row.enhancedAt)
			: null,
		created_at:
			row.createdAt instanceof Date
				? row.createdAt.toISOString()
				: String(row.createdAt),
		updated_at:
			row.updatedAt instanceof Date
				? row.updatedAt.toISOString()
				: String(row.updatedAt),
	};
}

export default class ReportsRepository {
	async findById(id: number): Promise<DailyReport | null> {
		const rows = await db
			.select()
			.from(dailyReports)
			.where(eq(dailyReports.id, id))
			.limit(1);
		return rows[0] ? toReport(rows[0]) : null;
	}

	async findByIdForUser(
		userId: string,
		id: number,
	): Promise<DailyReport | null> {
		const rows = await db
			.select()
			.from(dailyReports)
			.where(and(eq(dailyReports.userId, userId), eq(dailyReports.id, id)))
			.limit(1);
		return rows[0] ? toReport(rows[0]) : null;
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
		const rows = await db
			.select()
			.from(dailyReports)
			.where(
				and(
					eq(dailyReports.userId, userId),
					eq(dailyReports.reportDate, reportDate),
					eq(dailyReports.fromDate, fromDate),
				),
			)
			.limit(1);
		return rows[0] ? toReport(rows[0]) : null;
	}

	async findAllByUserId(userId: string): Promise<DailyReport[]> {
		const rows = await db
			.select()
			.from(dailyReports)
			.where(eq(dailyReports.userId, userId))
			.orderBy(desc(dailyReports.reportDate));
		return rows.map(toReport);
	}

	async findAllByUserIdAndDateRange(
		userId: string,
		fromDate: string,
		toDate: string,
	): Promise<DailyReport[]> {
		const rows = await db
			.select()
			.from(dailyReports)
			.where(
				and(
					eq(dailyReports.userId, userId),
					gte(dailyReports.reportDate, fromDate),
					lte(dailyReports.reportDate, toDate),
				),
			)
			.orderBy(asc(dailyReports.reportDate));
		return rows.map(toReport);
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
			const updates: Partial<typeof dailyReports.$inferInsert> = {
				content: data.content,
				status: status as 'ready',
				updatedAt: new Date(),
			};
			if (enhanced) {
				updates.enhancedAt = new Date();
			}
			await db
				.update(dailyReports)
				.set(updates)
				.where(
					and(
						eq(dailyReports.id, existing.id),
						eq(dailyReports.userId, userId),
					),
				);
			return existing.id;
		}

		const [row] = await db
			.insert(dailyReports)
			.values({
				userId,
				reportDate: data.report_date,
				fromDate,
				content: data.content,
				status: status as 'ready',
				...(enhanced && { enhancedAt: new Date() }),
			})
			.returning({ id: dailyReports.id });
		return row?.id ?? 0;
	}

	async updateStatus(
		userId: string,
		id: number,
		status: ReportStatus,
	): Promise<void> {
		await db
			.update(dailyReports)
			.set({ status, updatedAt: new Date() })
			.where(and(eq(dailyReports.id, id), eq(dailyReports.userId, userId)));
	}

	async updateContent(
		userId: string,
		id: number,
		content: string,
		enhanced?: boolean,
	): Promise<void> {
		const updates: Partial<typeof dailyReports.$inferInsert> = {
			content,
			updatedAt: new Date(),
		};
		if (enhanced) {
			updates.enhancedAt = new Date();
		}
		await db
			.update(dailyReports)
			.set(updates)
			.where(and(eq(dailyReports.id, id), eq(dailyReports.userId, userId)));
	}

	async deleteByIdForUser(userId: string, id: number): Promise<void> {
		await db
			.delete(dailyReports)
			.where(and(eq(dailyReports.id, id), eq(dailyReports.userId, userId)));
	}
}
