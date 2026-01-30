import SettingsService from '@/domain/settings/settings.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { domainErrorToNextResponse } from '@/lib/domain-error-to-http';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
	timezone: z.string().optional().nullable(),
	plan: z.string().optional().nullable(),
});

export async function PUT(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const body = await request.json();
			const parsed = bodySchema.safeParse(body);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: { message: 'Invalid payload' } },
					{ status: 400 },
				);
			}
			const { timezone, plan } = parsed.data;
			const updateData: { timezone?: string | null; plan?: string | null } = {};
			if (timezone !== undefined && timezone !== null && timezone !== '') {
				updateData.timezone = timezone;
			}
			if (plan !== undefined && plan !== null && plan !== '') {
				updateData.plan = plan;
			}
			if (Object.keys(updateData).length === 0) {
				return NextResponse.json(
					{ error: { message: 'At least one valid field is required' } },
					{ status: 400 },
				);
			}
			const settingsService = new SettingsService();
			await settingsService.upsertSettings(session.user.id, updateData);
			return NextResponse.json(
				{ data: { success: true, ...updateData } },
				{ status: 200 },
			);
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}
