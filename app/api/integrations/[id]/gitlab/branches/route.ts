import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/better-auth/server';
import IntegrationsService from '@/domain/integrations/integrations.service';
import { domainErrorToNextResponse } from '@/lib/domain-error-to-http';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	return requireServerAuth(async ({ session }) => {
		try {
			const { id } = await params;
			const integrationId = Number(id);
			if (!integrationId || Number.isNaN(integrationId)) {
				return NextResponse.json(
					{ error: { message: 'Invalid integration id' } },
					{ status: 400 },
				);
			}

			const { searchParams } = new URL(request.url);
			const projectId = searchParams.get('projectId');
			const search = searchParams.get('search') ?? undefined;
			if (!projectId) {
				return NextResponse.json(
					{ error: { message: 'projectId is required' } },
					{ status: 400 },
				);
			}

			const service = new IntegrationsService();
			const branches = await service.fetchGitLabBranches(
				integrationId,
				session.user.id,
				Number(projectId),
				search,
			);
			return NextResponse.json(branches);
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}
