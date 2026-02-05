import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/better-auth/server';
import ReportsService from '@/domain/reports/reports.service';
import { domainErrorToNextResponse } from '@/lib/domain-error-to-http';
import { z } from 'zod';

const scheduleBodySchema = z.object({
	id: z.number().int().positive().optional(),
	days_of_week: z.array(z.number().int().min(0).max(6)).nonempty(),
	times_utc: z.array(z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/)).nonempty(),
	locale: z.string().min(2).max(10).optional(),
	active: z.boolean().optional(),
});

const deleteBodySchema = z.object({
	id: z.number().int().positive(),
});

export async function GET() {
	return requireServerAuth(async ({ session }) => {
		const service = new ReportsService();
		const items = await service.listUserReportSchedules(session.user.id);
		return NextResponse.json(items);
	});
}

export async function POST(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const json = await request.json().catch(() => ({}));
			const parsed = scheduleBodySchema.safeParse(json);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: { message: 'Invalid payload' } },
					{ status: 400 },
				);
			}
			const service = new ReportsService();
			const result = await service.saveUserReportSchedule({
				userId: session.user.id,
				...parsed.data,
			});
			return NextResponse.json({ data: result });
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}

export async function DELETE(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const json = await request.json().catch(() => ({}));
			const parsed = deleteBodySchema.safeParse(json);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: { message: 'Invalid payload' } },
					{ status: 400 },
				);
			}
			const service = new ReportsService();
			await service.deleteUserReportSchedule({
				userId: session.user.id,
				scheduleId: parsed.data.id,
			});
			return NextResponse.json({ data: { success: true } });
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}
