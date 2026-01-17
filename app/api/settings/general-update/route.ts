import SettingsService from '@/domain/settings/settings.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const body = await request.json();
			const { timezone, plan } = body;

			if (!timezone && !plan) {
				return NextResponse.json(
					{ error: { message: 'Timezone or plan is required' } },
					{ status: 400 },
				);
			}

			const updateData: any = {};
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
		} catch (error: any) {
			return NextResponse.json(
				{ error: { message: error.message } },
				{ status: 400 },
			);
		}
	});
}
