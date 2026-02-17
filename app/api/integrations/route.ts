import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/better-auth/server';
import IntegrationsService from '@/domain/integrations/integrations.service';
import { domainErrorToNextResponse } from '@/lib/domain-error-to-http';
import { z } from 'zod';
import { RepositoryIntegrationType } from '@/domain/integrations/integrations.repository';

const repositoryBodySchema = z.object({
	provider: z.enum(['gitlab']),
	type: z.literal('repository').optional(),
	token: z.string().min(1),
	projects: z.array(z.number()).optional().nullable(),
	ignored_branches: z
		.record(z.string(), z.array(z.string()))
		.optional()
		.nullable(),
});

const aiBodySchema = z.object({
	type: z.literal('ai'),
	base_url: z.string().min(1, 'URL is required'),
	token: z.string().min(1, 'Token is required'),
	model: z.string().optional().nullable(),
});

const postBodySchema = z.union([repositoryBodySchema, aiBodySchema]);

export async function GET(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') as RepositoryIntegrationType | null;
		if (!type || !['repository', 'ai'].includes(type)) {
			return NextResponse.json(
				{
					error: { message: 'Missing or invalid type (use repository or ai)' },
				},
				{ status: 400 },
			);
		}
		const service = new IntegrationsService();
		const items = await service.listUserIntegrationsByType(
			session.user.id,
			type,
		);
		return NextResponse.json(items);
	});
}

export async function POST(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const json = await request.json();
			const parsed = postBodySchema.safeParse(json);
			if (!parsed.success) {
				const msg = parsed.error.issues[0]?.message ?? 'Invalid payload';
				return NextResponse.json({ error: { message: msg } }, { status: 400 });
			}
			const data = parsed.data;
			const isAi = data.type === 'ai';
			if (isAi) {
				const service = new IntegrationsService();
				const existing = await service.listUserIntegrationsByType(
					session.user.id,
					'ai',
				);
				if (existing.length > 0) {
					return NextResponse.json(
						{
							error: {
								message:
									'Only one AI integration is allowed. Edit the existing one.',
							},
						},
						{ status: 409 },
					);
				}
			}
			const createData = isAi
				? {
						provider: 'ai',
						type: 'ai' as const,
						token: data.token,
						base_url: data.base_url.replace(/\/$/, ''),
						model: data.model ?? null,
					}
				: {
						provider: data.provider,
						type: 'repository' as const,
						token: data.token,
						projects: data.projects,
						ignored_branches: data.ignored_branches,
					};
			const service = new IntegrationsService();
			const { id } = await service.createIntegration(
				session.user.id,
				createData,
			);
			if (!isAi) {
				// Execute token validation asynchronously
				service.validateTokenStatus({ id }).catch((error) => {
					console.error('Error validating token status:', error);
				});
			}
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

			const putBodySchema = z.object({
				id: z.number().optional(),
				provider: z.string().optional(),
				token: z.string().optional(),
				projects: z.array(z.number()).optional().nullable(),
				ignored_branches: z
					.record(z.string(), z.array(z.string()))
					.optional()
					.nullable(),
				base_url: z.string().optional().nullable(),
				model: z.string().optional().nullable(),
			});
			const parsed = putBodySchema.safeParse(json);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: { message: 'Invalid payload' } },
					{ status: 400 },
				);
			}

			const { provider, token, projects, ignored_branches, base_url, model } =
				parsed.data;

			const hasUpdate =
				provider !== undefined ||
				token !== undefined ||
				projects !== undefined ||
				ignored_branches !== undefined ||
				base_url !== undefined ||
				model !== undefined;
			if (!hasUpdate) {
				return NextResponse.json(
					{ error: { message: 'Nothing to update' } },
					{ status: 400 },
				);
			}

			const service = new IntegrationsService();
			const existingList = await service.listUserIntegrationsByType(
				session.user.id,
				'repository',
			);
			const isRepoIntegration = existingList.some((i) => i.id === id);
			const updateData: Record<string, unknown> = {};
			if (provider !== undefined) updateData.provider = provider;
			if (token !== undefined) {
				updateData.token = token;
				if (isRepoIntegration) updateData.status = 'pending';
			}
			if (projects !== undefined) updateData.projects = projects;
			if (ignored_branches !== undefined)
				updateData.ignored_branches = ignored_branches;
			if (base_url !== undefined)
				updateData.base_url = base_url?.replace(/\/$/, '') ?? null;
			if (model !== undefined) updateData.model = model ?? null;

			await service.updateIntegration(session.user.id, id, updateData);

			if (token !== undefined && isRepoIntegration) {
				// Execute token validation asynchronously
				service.validateTokenStatus({ id }).catch((error) => {
					console.error('Error validating token status:', error);
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
