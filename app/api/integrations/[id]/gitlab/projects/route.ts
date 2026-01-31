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

			const service = new IntegrationsService();
			const projects = await service.fetchGitLabProjects(
				integrationId,
				session.user.id,
			);
			return NextResponse.json(projects);
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}
