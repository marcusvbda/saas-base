import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/better-auth/server';
import ReportsService from '@/domain/reports/reports.service';
import { domainErrorToNextResponse } from '@/lib/domain-error-to-http';
import { publishJson } from '@/lib/qstash';
import { z } from 'zod';

function formatReportDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export async function GET() {
	return requireServerAuth(async ({ session }) => {
		const service = new ReportsService();
		const items = await service.listUserReports(session.user.id);
		return NextResponse.json(items);
	});
}

const updateBodySchema = z.object({
	id: z.number().int().positive(),
	content: z.string(),
	enhanced: z.boolean().optional(),
});

const deleteBodySchema = z.object({
	id: z.number().int().positive(),
});

export async function PUT(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const json = await request.json();
			const parsed = updateBodySchema.safeParse(json);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: { message: 'Invalid payload' } },
					{ status: 400 },
				);
			}
			const service = new ReportsService();
			await service.updateReportContent(
				session.user.id,
				parsed.data.id,
				parsed.data.content,
				parsed.data.enhanced,
			);
			return NextResponse.json({ data: { success: true } });
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
			await service.deleteReport({
				userId: session.user.id,
				reportId: parsed.data.id,
			});
			return NextResponse.json({ data: { success: true } });
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}

export async function POST(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const json = await request.json().catch(() => ({}));
			const action = (json.action as string) || 'generate';
			if (action === 'generate') {
				const today = formatReportDate(new Date());
				const yesterday = (() => {
					const d = new Date();
					d.setDate(d.getDate() - 1);
					return formatReportDate(d);
				})();
				const fromDate = (json.from_date as string)?.trim()?.slice(0, 10) || yesterday;
				const toDate = (json.to_date as string)?.trim()?.slice(0, 10) || today;
				const locale = typeof json.locale === 'string' ? json.locale : undefined;
				const service = new ReportsService();
				const report = await service.createReportProcessing(
					session.user.id,
					fromDate,
					toDate,
				);
				await publishJson({
					service: 'ReportsService',
					action: 'generateReport',
					payload: {
						userId: session.user.id,
						from_date: report.from_date,
						to_date: report.report_date,
						locale,
					},
				});
				return NextResponse.json({
					data: {
						id: report.id,
						report_date: report.report_date,
						from_date: report.from_date,
						status: report.status,
					},
				});
			}
			if (action === 'enhance') {
				const reportId = Number(json.report_id);
				if (!reportId || Number.isNaN(reportId)) {
					return NextResponse.json(
						{ error: { message: 'Invalid report_id' } },
						{ status: 400 },
					);
				}
				const subscription = (session as { subscription?: string })
					?.subscription;
				if (subscription !== 'pro') {
					return NextResponse.json(
						{ error: { message: 'Enhance with AI is available on Pro plan' } },
						{ status: 403 },
					);
				}
				const service = new ReportsService();
				const result = await service.enhanceReportWithAI(
					session.user.id,
					reportId,
				);
				return NextResponse.json({ data: result });
			}
			if (action === 'regenerate') {
				const reportId = Number(json.report_id);
				if (!reportId || Number.isNaN(reportId)) {
					return NextResponse.json(
						{ error: { message: 'Invalid report_id' } },
						{ status: 400 },
					);
				}
				const locale = typeof json.locale === 'string' ? json.locale : undefined;
				const service = new ReportsService();
				await service.setReportProcessing(session.user.id, reportId);
				await publishJson({
					service: 'ReportsService',
					action: 'regenerateReport',
					payload: { userId: session.user.id, reportId, locale },
				});
				return NextResponse.json({
					data: { report_id: reportId, status: 'processing' as const },
				});
			}
			return NextResponse.json(
				{ error: { message: 'Invalid action' } },
				{ status: 400 },
			);
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}
