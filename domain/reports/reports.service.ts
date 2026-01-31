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

/** day (YYYY-MM-DD) -> project name -> branch name -> commit titles */
type ReportByDayProjectBranch = Map<
	string,
	Map<string, Map<string, string[]>>
>;

function buildReportByDayProjectBranch(
	labels: ReportLabels,
	grouped: ReportByDayProjectBranch,
	reportDate?: string,
): string {
	const days = Array.from(grouped.keys()).sort();
	if (days.length === 0) {
		const dayLabel =
			reportDate === formatReportDate(new Date()) ? labels.today : reportDate ?? labels.today;
		return `${dayLabel}\n- ${labels.noActivity}`;
	}
	const lines: string[] = [];
	for (const day of days) {
		const byProject = grouped.get(day)!;
		const dayLabel = day === formatReportDate(new Date()) ? labels.today : day;
		lines.push(dayLabel);
		for (const [projectName, byBranch] of byProject) {
			lines.push(`  ${projectName}`);
			for (const [branchName, commits] of byBranch) {
				lines.push(`    ${branchName}`);
				for (const title of commits) {
					lines.push(`    - ${title}`);
				}
			}
		}
		lines.push('');
	}
	return lines.join('\n').trimEnd();
}

function addToGrouped(
	grouped: ReportByDayProjectBranch,
	day: string,
	projectName: string,
	branchName: string,
	title: string,
): void {
	if (!grouped.has(day)) grouped.set(day, new Map());
	const byProject = grouped.get(day)!;
	if (!byProject.has(projectName)) byProject.set(projectName, new Map());
	const byBranch = byProject.get(projectName)!;
	if (!byBranch.has(branchName)) byBranch.set(branchName, []);
	byBranch.get(branchName)!.push(title);
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
	const headers = { 'PRIVATE-TOKEN': token };
	const grouped: ReportByDayProjectBranch = new Map();

	// Date range: day before reportDate and reportDate (both full days in UTC)
	const reportDay = new Date(reportDate + 'T00:00:00.000Z');
	const dayBefore = new Date(reportDay);
	dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
	const since = dayBefore.toISOString().slice(0, 10) + 'T00:00:00.000Z';
	const until = reportDate + 'T23:59:59.999Z';

	try {
		// Current user for filtering commits by author
		const userRes = await fetch(`${baseUrl}/api/v4/user`, { headers });
		if (!userRes.ok) {
			return buildReportByDayProjectBranch(labels, grouped, reportDate);
		}
		const user = (await userRes.json()) as {
			name: string;
			username?: string;
			email?: string;
		};
		const isAuthor = (authorName: string, authorEmail?: string) =>
			authorName === user.name ||
			(authorEmail != null && authorEmail === user.email);

		// Resolve project IDs to query
		let ids = projectIds ?? [];
		if (ids.length === 0) {
			const projectsRes = await fetch(
				`${baseUrl}/api/v4/projects?membership=true&per_page=100`,
				{ headers },
			);
			if (!projectsRes.ok) {
				return buildReportByDayProjectBranch(labels, grouped, reportDate);
			}
			const projects = (await projectsRes.json()) as Array<{ id: number }>;
			ids = projects.map((p) => p.id);
		}

		for (const projectId of ids) {
			const projectRes = await fetch(
				`${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}`,
				{ headers },
			);
			if (!projectRes.ok) continue;
			const project = (await projectRes.json()) as {
				name: string;
				default_branch: string | null;
			};
			const projectName = project.name;

			// List branches (per project) then commits per branch
			const branchesRes = await fetch(
				`${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/branches?per_page=50`,
				{ headers },
			);
			if (!branchesRes.ok) continue;
			const branches = (await branchesRes.json()) as Array<{ name: string }>;
			for (const { name: branchName } of branches) {
				if (
					isBranchIgnoredForProject(
						ignoredBranchesByProject,
						projectId,
						branchName,
					)
				) {
					continue;
				}
				const commitsRes = await fetch(
					`${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/commits?ref_name=${encodeURIComponent(branchName)}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&per_page=100`,
					{ headers },
				);
				if (!commitsRes.ok) continue;
				const commits = (await commitsRes.json()) as Array<{
					title: string;
					author_name: string;
					author_email?: string;
					committed_date: string;
				}>;
				for (const c of commits) {
					if (!isAuthor(c.author_name, c.author_email)) continue;
					const day = c.committed_date.slice(0, 10);
					addToGrouped(grouped, day, projectName, branchName, c.title);
				}
			}
		}

		return buildReportByDayProjectBranch(labels, grouped, reportDate);
	} catch {
		return buildReportByDayProjectBranch(labels, grouped, reportDate);
	}
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
				status: 'ready',
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
		await this.reportsRepo.upsert(userId, {
			report_date: reportDate,
			content,
			status: 'ready',
		});
		this.triggerReportReady(userId, reportDate);
		return { report_date: reportDate };
	}

	async createReportProcessing(
		userId: string,
		reportDate: string,
	): Promise<{ id: number; report_date: string; status: 'processing' }> {
		const id = await this.reportsRepo.upsert(userId, {
			report_date: reportDate,
			content: '',
			status: 'processing',
		});
		return { id, report_date: reportDate, status: 'processing' };
	}

	async setReportProcessing(
		userId: string,
		reportId: number,
	): Promise<void> {
		const report = await this.reportsRepo.findByIdForUser(userId, reportId);
		if (!report) {
			throw new NotFoundError('Report not found');
		}
		await this.reportsRepo.updateStatus(userId, reportId, 'processing');
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
		// generateReport will upsert with status 'ready' and trigger Pusher
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
