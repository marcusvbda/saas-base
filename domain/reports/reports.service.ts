import { pusher } from '@/lib/pusher';
import { NotFoundError } from '@/domain/errors';
import IntegrationsRepository from '@/domain/integrations/integrations.repository';
import ReportsRepository, { DailyReport } from './reports.repository';

function formatReportDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

type ReportLabels = {
	yesterday: string;
	today: string;
	blockers: string;
	noActivity: string;
	noBlockers: string;
	noActivitySynced: string;
	noIntegration: string;
	addIntegration: string;
	mergedPr: string;
	reviewingPr: string;
	workingOn: string;
};

const reportLabelsByLocale: Record<string, ReportLabels> = {
	en: {
		yesterday: 'Yesterday',
		today: 'Today',
		blockers: 'Blockers',
		noActivity: 'No activity',
		noBlockers: 'No blockers at the moment.',
		noActivitySynced: 'No activity synced',
		noIntegration: 'No repository integration connected',
		addIntegration:
			'Add a GitLab integration in Settings to generate from your activity',
		mergedPr: 'Merged PR',
		reviewingPr: 'Reviewing PR',
		workingOn: 'Working on',
	},
	pt: {
		yesterday: 'Ontem',
		today: 'Hoje',
		blockers: 'Bloqueios',
		noActivity: 'Nenhuma atividade',
		noBlockers: 'Nenhum bloqueio no momento.',
		noActivitySynced: 'Atividade não sincronizada',
		noIntegration: 'Nenhuma integração de repositório conectada',
		addIntegration:
			'Adicione uma integração GitLab em Configurações para gerar a partir da sua atividade',
		mergedPr: 'MR mesclado',
		reviewingPr: 'Revisando MR',
		workingOn: 'Trabalhando em',
	},
};

function getReportLabels(locale: string): ReportLabels {
	return reportLabelsByLocale[locale] ?? reportLabelsByLocale.en;
}

function buildReportSections(
	labels: ReportLabels,
	yesterdayItems: string[],
	todayItems: string[],
	blockers: string[],
): string {
	const lines: string[] = [];
	lines.push(labels.yesterday);
	if (yesterdayItems.length === 0) lines.push(`- ${labels.noActivity}`);
	else yesterdayItems.forEach((s) => lines.push(`- ${s}`));
	lines.push('');
	lines.push(labels.today);
	if (todayItems.length === 0) lines.push(`- ${labels.noActivity}`);
	else todayItems.forEach((s) => lines.push(`- ${s}`));
	lines.push('');
	lines.push(labels.blockers);
	if (blockers.length === 0) lines.push(`- ${labels.noBlockers}`);
	else blockers.forEach((s) => lines.push(`- ${s}`));
	return lines.join('\n');
}

/** project id (string) -> branch names to ignore */
type IgnoredBranchesByProject = Record<string, string[]>;

function isBranchIgnoredForProject(
	ignoredByProject: IgnoredBranchesByProject | null,
	projectId: number,
	branchName: string,
): boolean {
	if (!ignoredByProject) return false;
	const branches = ignoredByProject[String(projectId)];
	return !!branches?.includes(branchName);
}

async function fetchGitLabReportContent(
	baseUrl: string,
	token: string,
	reportDate: string,
	labels: ReportLabels,
	projectIds: number[] | null,
	ignoredBranchesByProject: IgnoredBranchesByProject | null,
): Promise<string> {
	const today = new Date(reportDate);
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStart = yesterday.toISOString().slice(0, 10);
	const yesterdayEnd = yesterday.toISOString().slice(0, 10);
	const todayStart = today.toISOString().slice(0, 10);

	const yesterdayItems: string[] = [];
	const todayItems: string[] = [];
	const blockers: string[] = [];

	try {
		// Build project filter query parameter
		const projectFilter =
			projectIds && projectIds.length > 0
				? projectIds.map((id) => `&project_id=${id}`).join('')
				: '';

		// Merged MRs in the last 2 days (for yesterday)
		const mergedRes = await fetch(
			`${baseUrl}/api/v4/merge_requests?state=merged&scope=assigned_to_me&per_page=100${projectFilter}`,
			{ headers: { 'PRIVATE-TOKEN': token } },
		);
		if (mergedRes.ok) {
			const merged = (await mergedRes.json()) as Array<{
				title: string;
				iid: number;
				merged_at: string | null;
				state: string;
				target_branch: string;
				project_id: number;
			}>;
			for (const mr of merged) {
				if (
					isBranchIgnoredForProject(
						ignoredBranchesByProject,
						mr.project_id,
						mr.target_branch,
					)
				) {
					continue;
				}
				const mergedAt = mr.merged_at?.slice(0, 10);
				if (mergedAt === yesterdayEnd) {
					yesterdayItems.push(`${labels.mergedPr} #${mr.iid} - ${mr.title}`);
				}
			}
		}

		// Opened/updated MRs (for today)
		const openedRes = await fetch(
			`${baseUrl}/api/v4/merge_requests?state=opened&scope=assigned_to_me&per_page=100${projectFilter}`,
			{ headers: { 'PRIVATE-TOKEN': token } },
		);
		if (openedRes.ok) {
			const opened = (await openedRes.json()) as Array<{
				title: string;
				iid: number;
				updated_at: string;
				target_branch: string;
				project_id: number;
			}>;
			for (const mr of opened) {
				if (
					isBranchIgnoredForProject(
						ignoredBranchesByProject,
						mr.project_id,
						mr.target_branch,
					)
				) {
					continue;
				}
				const updatedAt = mr.updated_at.slice(0, 10);
				if (updatedAt === todayStart) {
					todayItems.push(`${labels.reviewingPr} #${mr.iid} - ${mr.title}`);
				}
			}
		}

		// Issues assigned (for today / blockers)
		const issuesRes = await fetch(
			`${baseUrl}/api/v4/issues?scope=assigned_to_me&state=opened&per_page=50${projectFilter}`,
			{ headers: { 'PRIVATE-TOKEN': token } },
		);
		if (issuesRes.ok) {
			const issues = (await issuesRes.json()) as Array<{
				title: string;
				iid: number;
				project_id: number;
			}>;
			for (const issue of issues.slice(0, 3)) {
				todayItems.push(`${labels.workingOn}: "${issue.title}"`);
			}
		}
	} catch {
		// Fallback placeholder
		yesterdayItems.push(labels.noActivitySynced);
		todayItems.push(labels.noActivitySynced);
	}

	return buildReportSections(labels, yesterdayItems, todayItems, blockers);
}

export default class ReportsService {
	constructor(
		private reportsRepo: ReportsRepository = new ReportsRepository(),
		private integrationsRepo: IntegrationsRepository = new IntegrationsRepository(),
	) {}

	async listUserReports(userId: string): Promise<DailyReport[]> {
		return this.reportsRepo.findAllByUserId(userId);
	}

	async getReport(userId: string, id: number): Promise<DailyReport | null> {
		return this.reportsRepo.findByIdForUser(userId, id);
	}

	async updateReportContent(
		userId: string,
		id: number,
		content: string,
	): Promise<void> {
		const existing = await this.reportsRepo.findByIdForUser(userId, id);
		if (!existing) {
			throw new NotFoundError('Report not found');
		}
		await this.reportsRepo.updateContent(userId, id, content);
	}

	async generateReport(payload: {
		userId: string;
		reportDate?: string;
		locale?: string;
	}): Promise<{ report_date: string }> {
		const userId = payload.userId;
		const reportDate = payload.reportDate ?? formatReportDate(new Date());
		const labels = getReportLabels(payload.locale ?? 'en');

		const integrations = await this.integrationsRepo.findAllByUserIdAndType(
			userId,
			'repository',
		);
		const integration = integrations[0];
		if (!integration || integration.provider !== 'gitlab') {
			const content = buildReportSections(
				labels,
				[labels.noIntegration],
				[labels.addIntegration],
				[],
			);
			await this.reportsRepo.upsert(userId, {
				report_date: reportDate,
				content,
			});
			this.triggerReportReady(userId, reportDate);
			return { report_date: reportDate };
		}

		const baseUrl =
			(process.env.GITLAB_API_URL as string) || 'https://gitlab.com';
		const content = await fetchGitLabReportContent(
			baseUrl,
			integration.token,
			reportDate,
			labels,
			integration.projects,
			integration.ignored_branches,
		);
		await this.reportsRepo.upsert(userId, { report_date: reportDate, content });
		this.triggerReportReady(userId, reportDate);
		return { report_date: reportDate };
	}

	async regenerateReport(payload: {
		userId: string;
		reportId: number;
		locale?: string;
	}): Promise<{ report_date: string }> {
		const report = await this.reportsRepo.findByIdForUser(
			payload.userId,
			payload.reportId,
		);
		if (!report) {
			throw new NotFoundError('Report not found');
		}
		return this.generateReport({
			userId: payload.userId,
			reportDate: report.report_date,
			locale: payload.locale,
		});
	}

	async deleteReport(payload: {
		userId: string;
		reportId: number;
	}): Promise<void> {
		const report = await this.reportsRepo.findByIdForUser(
			payload.userId,
			payload.reportId,
		);
		if (!report) {
			throw new NotFoundError('Report not found');
		}
		await this.reportsRepo.deleteByIdForUser(payload.userId, payload.reportId);
	}

	private triggerReportReady(userId: string, reportDate: string): void {
		pusher.trigger(`reports-${userId}`, 'report-ready', {
			report_date: reportDate,
		});
	}
}
