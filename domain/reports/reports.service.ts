import { pusher } from '@/lib/pusher';
import { enhanceReportContent } from '@/lib/enhance-report';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import IntegrationsRepository from '@/domain/integrations/integrations.repository';
import ReportsRepository, { DailyReport } from './reports.repository';

function formatReportDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** Normalize to YYYY-MM-DD (report_date from DB may be Date or string) */
function toReportDateString(value: Date | string | undefined): string {
	if (value == null) return formatReportDate(new Date());
	if (value instanceof Date) return formatReportDate(value);
	const s = String(value).trim();
	if (s.length >= 10) return s.slice(0, 10);
	return s || formatReportDate(new Date());
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
type ReportByDayProjectBranch = Map<string, Map<string, Map<string, string[]>>>;

const MONTH_ABBR_EN = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_ABBR_PT = [
	'jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.',
	'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.',
];

/** Format YYYY-MM-DD as "30 Jan 2026" or "30 jan. 2026" (pt) */
function formatDayDisplay(dayStr: string, locale?: string): string {
	const [y, m, d] = dayStr.slice(0, 10).split('-').map(Number);
	const months = locale === 'pt' ? MONTH_ABBR_PT : MONTH_ABBR_EN;
	const month = months[(m ?? 1) - 1] ?? '';
	return `${d ?? 0} ${month} ${y ?? ''}`.trim();
}

function getDaysInRange(reportDate: string): string[] {
	const reportDay = new Date(reportDate + 'T12:00:00.000Z');
	const dayBefore = new Date(reportDay);
	dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
	return [
		dayBefore.toISOString().slice(0, 10),
		reportDate.slice(0, 10),
	].sort();
}

/** Always show the date (e.g. "30 Jan 2026" / "30 jan. 2026"), never "Ontem" / "Hoje" */
function formatDayLabel(dayStr: string, locale?: string): string {
	return formatDayDisplay(dayStr, locale);
}

function buildReportByDayProjectBranch(
	labels: ReportLabels,
	grouped: ReportByDayProjectBranch,
	reportDate?: string,
	locale?: string,
): string {
	const today = formatReportDate(new Date());
	const reportDateStr = reportDate?.slice(0, 10) ?? today;
	const daysInRange = getDaysInRange(reportDateStr);
	const lines: string[] = [];

	for (const day of daysInRange) {
		const dayLabel = formatDayLabel(day, locale);
		lines.push('');
		lines.push(`## ${dayLabel}`);
		lines.push('');

		const byProject = grouped.get(day);
		if (!byProject || byProject.size === 0) {
			lines.push(labels.noActivity);
			lines.push('');
			continue;
		}

		for (const [projectName, byBranch] of byProject) {
			lines.push(`**${projectName}**`);
			lines.push('');
			for (const [branchName, commits] of byBranch) {
				lines.push(`- **${branchName}**`);
				for (const title of commits) {
					lines.push(`  - ${title}`);
				}
				lines.push('');
			}
		}
	}
	return lines.join('\n').trim();
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
	locale?: string,
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
		// Author from token: /user gives username/email used for GitLab "author" filter
		const userRes = await fetch(`${baseUrl}/api/v4/user`, { headers });
		if (!userRes.ok) {
			return buildReportByDayProjectBranch(labels, grouped, reportDate, locale);
		}
		const user = (await userRes.json()) as {
			name: string;
			username?: string;
			email?: string;
		};
		const authorParam = user.username ?? user.email ?? user.name;

		// Resolve project IDs to query
		let ids = projectIds ?? [];
		if (ids.length === 0) {
			const projectsRes = await fetch(
				`${baseUrl}/api/v4/projects?membership=true&per_page=100`,
				{ headers },
			);
			if (!projectsRes.ok) {
				return buildReportByDayProjectBranch(labels, grouped, reportDate, locale);
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
			const project = (await projectRes.json()) as { name: string };
			const projectName = project.name;

			// All commits by this author in the date range (all branches in one call)
			const commitsRes = await fetch(
				`${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/commits?all=true&author=${encodeURIComponent(authorParam)}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&per_page=100`,
				{ headers },
			);
			if (!commitsRes.ok) continue;
			const commits = (await commitsRes.json()) as Array<{
				id: string;
				title: string;
				committed_date: string;
			}>;

			const maxRefsPerProject = 50;
			for (let i = 0; i < Math.min(commits.length, maxRefsPerProject); i++) {
				const c = commits[i];
				const day = c.committed_date.slice(0, 10);
				const refsRes = await fetch(
					`${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/commits/${encodeURIComponent(c.id)}/refs?type=branch`,
					{ headers },
				);
				if (!refsRes.ok) continue;
				const refs = (await refsRes.json()) as Array<{
					type: string;
					name: string;
				}>;
				const branchNames = refs
					.filter((r) => r.type === 'branch')
					.map((r) => r.name)
					.filter(
						(branchName) =>
							!isBranchIgnoredForProject(
								ignoredBranchesByProject,
								projectId,
								branchName,
							),
					);
				if (branchNames.length === 0) continue;
				addToGrouped(grouped, day, projectName, branchNames[0], c.title);
			}
		}

		return buildReportByDayProjectBranch(labels, grouped, reportDate, locale);
	} catch {
		return buildReportByDayProjectBranch(labels, grouped, reportDate, locale);
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
		enhanced?: boolean,
	): Promise<void> {
		const existing = await this.reportsRepo.findByIdForUser(userId, id);
		if (!existing) {
			throw new NotFoundError('Report not found');
		}
		await this.reportsRepo.updateContent(userId, id, content, enhanced);
	}

	async enhanceReportWithAI(
		userId: string,
		reportId: number,
	): Promise<{ content: string }> {
		const report = await this.reportsRepo.findByIdForUser(userId, reportId);
		if (!report) {
			throw new NotFoundError('Report not found');
		}
		if (report.status === 'processing') {
			throw new BusinessRuleError('Report is still processing');
		}
		if (!report.content?.trim()) {
			throw new BusinessRuleError('Report has no content to enhance');
		}
		const content = await enhanceReportContent(report.content);
		return { content };
	}

	async generateReport(payload: {
		userId: string;
		reportDate?: string | Date;
		locale?: string;
	}): Promise<{ report_date: string }> {
		const userId = payload.userId;
		const reportDate = toReportDateString(payload.reportDate);
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
			payload.locale,
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

	async setReportProcessing(userId: string, reportId: number): Promise<void> {
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
		// Use the report's original date so regeneration keeps the same report_date
		const reportDate = toReportDateString(report.report_date);
		return this.generateReport({
			userId: payload.userId,
			reportDate,
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
