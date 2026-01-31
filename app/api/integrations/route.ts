import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/better-auth/server';
import IntegrationsService from '@/domain/integrations/integrations.service';
import { domainErrorToNextResponse } from '@/lib/domain-error-to-http';
import { publishJson } from '@/lib/qstash';
import { z } from 'zod';
import { RepositoryIntegrationType } from '@/domain/integrations/integrations.repository';

const bodySchema = z.object({
	provider: z.enum(['gitlab']),
	token: z.string().min(1),
	projects: z.array(z.number()).optional().nullable(),
	ignored_branches: z
		.record(z.string(), z.array(z.string()))
		.optional()
		.nullable(),
});

export async function GET(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') as 'repository' | null;
		const service = new IntegrationsService();
		const items = await service.listUserIntegrationsByType(
			session.user.id,
			type as RepositoryIntegrationType,
		);
		return NextResponse.json(items);
	});
}

export async function POST(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const json = await request.json();
			const parsed = bodySchema.safeParse(json);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: { message: 'Invalid payload' } },
					{ status: 400 },
				);
			}
			const service = new IntegrationsService();
			const { id } = await service.createIntegration(
				session.user.id,
				parsed.data,
			);
			await publishJson({
				service: 'IntegrationsService',
				action: 'validateTokenStatus',
				payload: { id },
			});

			return NextResponse.json({ data: { success: true } }, { status: 201 });
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}

export async function PUT(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const json = await request.json();
			const id = Number(json.id);
			if (!id || Number.isNaN(id)) {
				return NextResponse.json(
					{ error: { message: 'Invalid id' } },
					{ status: 400 },
				);
			}

			const parsed = bodySchema.partial().safeParse(json);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: { message: 'Invalid payload' } },
					{ status: 400 },
				);
			}

			const { provider, token, projects, ignored_branches } = parsed.data;

			if (!provider && !token && !projects && !ignored_branches) {
				return NextResponse.json(
					{ error: { message: 'Nothing to update' } },
					{ status: 400 },
				);
			}

			const service = new IntegrationsService();
			const updateData: any = {};
			if (provider !== undefined) updateData.provider = provider;
			if (token !== undefined) {
				updateData.token = token;
				updateData.status = 'pending';
			}
			if (projects !== undefined) updateData.projects = projects;
			if (ignored_branches !== undefined)
				updateData.ignored_branches = ignored_branches;

			await service.updateIntegration(session.user.id, id, updateData);

			// Only trigger validation if token was changed
			if (token) {
				await publishJson({
					service: 'IntegrationsService',
					action: 'validateTokenStatus',
					payload: { id },
				});
			}

			return NextResponse.json({ data: { success: true } });
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}

export async function DELETE(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const json = await request.json();
			const id = Number(json.id);
			if (!id || Number.isNaN(id)) {
				return NextResponse.json(
					{ error: { message: 'Invalid id' } },
					{ status: 400 },
				);
			}

			const service = new IntegrationsService();
			await service.deleteIntegration(session.user.id, id);

			return NextResponse.json({ data: { success: true } });
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}
