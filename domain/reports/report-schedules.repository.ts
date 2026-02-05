import { db } from '@/database';
import { reportScheduleRuns, reportSchedules } from '@/database/schema';
import { and, eq } from 'drizzle-orm';

export type ReportSchedule = {
	id: number;
	user_id: string;
	days_of_week: number[];
	times_utc: string[];
	locale: string | null;
	active: boolean;
	created_at: string;
	updated_at: string;
};

export type ReportScheduleInput = {
	days_of_week: number[];
	times_utc: string[];
	locale?: string | null;
	active?: boolean;
};

type ScheduleRow = typeof reportSchedules.$inferSelect;

function toSchedule(row: ScheduleRow): ReportSchedule {
	return {
		id: row.id,
		user_id: row.userId,
		days_of_week: (row.daysOfWeek as number[]) ?? [],
		times_utc: (row.timesUtc as string[]) ?? [],
		locale: row.locale ?? null,
		active: row.active,
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

export default class ReportSchedulesRepository {
	async findAllByUserId(userId: string): Promise<ReportSchedule[]> {
		const rows = await db
			.select()
			.from(reportSchedules)
			.where(eq(reportSchedules.userId, userId));
		return rows.map(toSchedule);
	}

	async findByIdForUser(
		userId: string,
		id: number,
	): Promise<ReportSchedule | null> {
		const rows = await db
			.select()
			.from(reportSchedules)
			.where(
				and(eq(reportSchedules.userId, userId), eq(reportSchedules.id, id)),
			)
			.limit(1);
		return rows[0] ? toSchedule(rows[0]) : null;
	}

	async create(userId: string, input: ReportScheduleInput): Promise<number> {
		const [row] = await db
			.insert(reportSchedules)
			.values({
				userId,
				daysOfWeek: input.days_of_week,
				timesUtc: input.times_utc,
				locale: input.locale ?? null,
				active: input.active ?? true,
			})
			.returning({ id: reportSchedules.id });
		return row?.id ?? 0;
	}

	async update(
		userId: string,
		id: number,
		input: ReportScheduleInput,
	): Promise<void> {
		await db
			.update(reportSchedules)
			.set({
				daysOfWeek: input.days_of_week,
				timesUtc: input.times_utc,
				locale: input.locale ?? null,
				active: input.active ?? true,
				updatedAt: new Date(),
			})
			.where(
				and(eq(reportSchedules.id, id), eq(reportSchedules.userId, userId)),
			);
	}

	async delete(userId: string, id: number): Promise<void> {
		await db
			.delete(reportSchedules)
			.where(
				and(eq(reportSchedules.id, id), eq(reportSchedules.userId, userId)),
			);
	}

	/** All active schedules across all users, for the recurring runner. */
	async findAllActive(): Promise<ReportSchedule[]> {
		const rows = await db
			.select()
			.from(reportSchedules)
			.where(eq(reportSchedules.active, true));
		return rows.map(toSchedule);
	}

	async hasRun(scheduleId: number, scheduledFor: Date): Promise<boolean> {
		const rows = await db
			.select({ id: reportScheduleRuns.id })
			.from(reportScheduleRuns)
			.where(
				and(
					eq(reportScheduleRuns.scheduleId, scheduleId),
					eq(reportScheduleRuns.scheduledFor, scheduledFor),
				),
			)
			.limit(1);
		return !!rows[0];
	}

	async markRun(scheduleId: number, scheduledFor: Date): Promise<void> {
		try {
			await db.insert(reportScheduleRuns).values({
				scheduleId,
				scheduledFor,
			});
		} catch {
			// Unique constraint ensures idempotency; ignore duplicates
		}
	}
}
