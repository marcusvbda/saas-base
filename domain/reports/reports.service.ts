import { pusher } from '@/lib/pusher';
import { enhanceReportContent } from './enhance-report';
import { NotFoundError, ValidationError } from '@/domain/errors';
import IntegrationsRepository from '@/domain/integrations/integrations.repository';
import ReportsRepository, { DailyReport } from './reports.repository';
import ReportSchedulesRepository, {
	ReportSchedule,
	ReportScheduleInput,
} from './report-schedules.repository';
import {
	ensureRecurringReportsSchedule,
	deleteRecurringReportsSchedule,
} from '@/lib/qstash';

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
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];
const MONTH_ABBR_PT = [
	'jan.',
	'fev.',
	'mar.',
	'abr.',
	'mai.',
	'jun.',
	'jul.',
	'ago.',
	'set.',
	'out.',
	'nov.',
	'dez.',
];

/** Format YYYY-MM-DD as "30 Jan 2026" or "30 jan. 2026" (pt) */
function formatDayDisplay(dayStr: string, locale?: string): string {
	const [y, m, d] = dayStr.slice(0, 10).split('-').map(Number);
	const months = locale === 'pt' ? MONTH_ABBR_PT : MONTH_ABBR_EN;
	const month = months[(m ?? 1) - 1] ?? '';
	return `${d ?? 0} ${month} ${y ?? ''}`.trim();
}

/** All days from fromDate to toDate inclusive (YYYY-MM-DD), chronological */
function getDaysBetween(fromDate: string, toDate: string): string[] {
	const from = fromDate.slice(0, 10);
	const to = toDate.slice(0, 10);
	if (from > to) return [];
	const days: string[] = [];
	const d = new Date(from + 'T12:00:00.000Z');
	const end = new Date(to + 'T12:00:00.000Z');
	while (d <= end) {
		days.push(d.toISOString().slice(0, 10));
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return days;
}

/** Always show the date (e.g. "30 Jan 2026" / "30 jan. 2026"), never "Ontem" / "Hoje" */
function formatDayLabel(dayStr: string, locale?: string): string {
	return formatDayDisplay(dayStr, locale);
}

function buildReportByDayProjectBranch(
	labels: ReportLabels,
	grouped: ReportByDayProjectBranch,
	fromDate: string,
	toDate: string,
	locale?: string,
): string {
	const daysInRange = getDaysBetween(fromDate, toDate).reverse();
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

const MAX_REFS_PER_PROJECT = 50;

async function fetchGitLabReportContent(
	baseUrl: string,
	token: string,
	fromDate: string,
	toDate: string,
	labels: ReportLabels,
	projectIds: number[] | null,
	ignoredBranchesByProject: IgnoredBranchesByProject | null,
	locale?: string,
): Promise<string> {
	const headers = { 'PRIVATE-TOKEN': token };
	const grouped: ReportByDayProjectBranch = new Map();

	const since = fromDate.slice(0, 10) + 'T00:00:00.000Z';
	const until = toDate.slice(0, 10) + 'T23:59:59.999Z';

	const emptyResult = () =>
		buildReportByDayProjectBranch(labels, grouped, fromDate, toDate, locale);

	try {
		const [userRes, projectsRes] = await Promise.all([
			fetch(`${baseUrl}/api/v4/user`, { headers }),
			fetch(`${baseUrl}/api/v4/projects?membership=true&per_page=100`, {
				headers,
			}),
		]);

		if (!userRes.ok) return emptyResult();
		const user = (await userRes.json()) as {
			name: string;
			username?: string;
			email?: string;
		};
		const authorParam = user.username ?? user.email ?? user.name;

		if (!projectsRes.ok) return emptyResult();
		const allProjects = (await projectsRes.json()) as Array<{
			id: number;
			name: string;
		}>;

		const projects =
			projectIds != null && projectIds.length > 0
				? allProjects.filter((p) => projectIds.includes(p.id))
				: allProjects;

		const projectResults = await Promise.all(
			projects.map(async (project) => {
				const commitsRes = await fetch(
					`${baseUrl}/api/v4/projects/${encodeURIComponent(project.id)}/repository/commits?all=true&author=${encodeURIComponent(authorParam)}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&per_page=100`,
					{ headers },
				);
				if (!commitsRes.ok)
					return {
						project,
						commits: [] as Array<{
							id: string;
							title: string;
							committed_date: string;
						}>,
					};
				const commits = (await commitsRes.json()) as Array<{
					id: string;
					title: string;
					committed_date: string;
				}>;
				return { project, commits };
			}),
		);

		await Promise.all(
			projectResults.map(async ({ project, commits }) => {
				const toProcess = commits.slice(0, MAX_REFS_PER_PROJECT);
				const refsResults = await Promise.all(
					toProcess.map(async (c) => {
						const refsRes = await fetch(
							`${baseUrl}/api/v4/projects/${encodeURIComponent(project.id)}/repository/commits/${encodeURIComponent(c.id)}/refs?type=branch`,
							{ headers },
						);
						if (!refsRes.ok) return null;
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
										project.id,
										branchName,
									),
							);
						return branchNames.length > 0
							? {
									day: c.committed_date.slice(0, 10),
									branch: branchNames[0],
									title: c.title,
								}
							: null;
					}),
				);
				for (const r of refsResults) {
					if (r) addToGrouped(grouped, r.day, project.name, r.branch, r.title);
				}
			}),
		);

		return buildReportByDayProjectBranch(
			labels,
			grouped,
			fromDate,
			toDate,
			locale,
		);
	} catch {
		return emptyResult();
	}
}

export default class ReportsService {
	constructor(
		private reportsRepo: ReportsRepository = new ReportsRepository(),
		private integrationsRepo: IntegrationsRepository = new IntegrationsRepository(),
		private schedulesRepo: ReportSchedulesRepository = new ReportSchedulesRepository(),
	) {}

	async listUserReports(userId: string): Promise<DailyReport[]> {
		return this.reportsRepo.findAllByUserId(userId);
	}

	async listUserReportsByDateRange(
		userId: string,
		fromDate: string,
		toDate: string,
	): Promise<DailyReport[]> {
		return this.reportsRepo.findAllByUserIdAndDateRange(
			userId,
			fromDate,
			toDate,
		);
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

	async generateReport(payload: {
		userId: string;
		from_date?: string | Date;
		to_date?: string | Date;
		locale?: string;
	}): Promise<{ report_date: string; from_date: string }> {
		const userId = payload.userId;
		const toDate = toReportDateString(payload.to_date);
		const fromDate =
			payload.from_date != null
				? toReportDateString(payload.from_date)
				: toDate;
		const effectiveFrom = fromDate <= toDate ? fromDate : toDate;
		const effectiveTo = fromDate <= toDate ? toDate : fromDate;
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
				report_date: effectiveTo,
				from_date: effectiveFrom,
				content,
				status: 'ready',
			});
			this.triggerReportReady(userId, effectiveTo);
			return { report_date: effectiveTo, from_date: effectiveFrom };
		}

		const baseUrl =
			(process.env.GITLAB_API_URL as string) || 'https://gitlab.com';
		let content = await fetchGitLabReportContent(
			baseUrl,
			integration.token,
			effectiveFrom,
			effectiveTo,
			labels,
			integration.projects,
			integration.ignored_branches,
			payload.locale,
		);

		let enhanced = false;
		if (content?.trim()) {
			const aiIntegration =
				await this.integrationsRepo.findFirstByUserIdAndType(userId, 'ai');
			if (aiIntegration?.base_url?.trim() && aiIntegration.token?.trim()) {
				try {
					content = await enhanceReportContent(
						content,
						{
							baseURL: aiIntegration.base_url,
							token: aiIntegration.token,
							model: aiIntegration.model,
						},
						payload.locale,
					);
					enhanced = true;
				} catch {
					// Keep raw content if AI enhance fails
				}
			}
		}

		await this.reportsRepo.upsert(userId, {
			report_date: effectiveTo,
			from_date: effectiveFrom,
			content,
			status: 'ready',
			enhanced,
		});
		this.triggerReportReady(userId, effectiveTo);
		return { report_date: effectiveTo, from_date: effectiveFrom };
	}

	async createReportProcessing(
		userId: string,
		fromDate: string,
		toDate: string,
	): Promise<{
		id: number;
		report_date: string;
		from_date: string;
		status: 'processing';
	}> {
		const effectiveFrom = fromDate <= toDate ? fromDate : toDate;
		const effectiveTo = fromDate <= toDate ? toDate : fromDate;
		const id = await this.reportsRepo.upsert(userId, {
			report_date: effectiveTo,
			from_date: effectiveFrom,
			content: '',
			status: 'processing',
		});
		return {
			id,
			report_date: effectiveTo,
			from_date: effectiveFrom,
			status: 'processing',
		};
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
	}): Promise<{ report_date: string; from_date: string }> {
		const report = await this.reportsRepo.findByIdForUser(
			payload.userId,
			payload.reportId,
		);
		if (!report) {
			throw new NotFoundError('Report not found');
		}
		const fromDate = toReportDateString(report.from_date ?? report.report_date);
		const toDate = toReportDateString(report.report_date);
		return this.generateReport({
			userId: payload.userId,
			from_date: fromDate,
			to_date: toDate,
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

	// -------------------------------------------------------------------------
	// Recurring report schedules
	// -------------------------------------------------------------------------

	async listUserReportSchedules(userId: string): Promise<ReportSchedule[]> {
		return this.schedulesRepo.findAllByUserId(userId);
	}

	async saveUserReportSchedule(payload: {
		userId: string;
		id?: number;
		days_of_week: number[];
		times_utc: string[];
		locale?: string;
		active?: boolean;
	}): Promise<{ id: number }> {
		const { userId, id, days_of_week, times_utc, locale, active } = payload;

		if (!days_of_week?.length) {
			throw new ValidationError('At least one day of week is required');
		}
		if (!times_utc?.length) {
			throw new ValidationError('At least one time is required');
		}

		const normalizedDays = Array.from(
			new Set(
				days_of_week.map((d) => {
					if (d < 0 || d > 6 || !Number.isInteger(d)) {
						throw new ValidationError('Invalid day of week');
					}
					return d;
				}),
			),
		).sort();

		// Horários sempre em UTC no formato HH:MM, 00–23
		const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
		const normalizedTimes = Array.from(
			new Set(
				times_utc.map((t) => {
					const trimmed = t.trim();
					if (!timeRegex.test(trimmed)) {
						throw new ValidationError('Invalid time format, expected HH:MM');
					}
					return trimmed;
				}),
			),
		).sort();

		const input: ReportScheduleInput = {
			days_of_week: normalizedDays,
			times_utc: normalizedTimes,
			locale,
			active,
		};

		if (id) {
			const existing = await this.schedulesRepo.findByIdForUser(userId, id);
			if (!existing) {
				throw new NotFoundError('Schedule not found');
			}
			await this.schedulesRepo.update(userId, id, input);
			// Após qualquer alteração, sincroniza o schedule global no QStash
			// com o estado atual (se existe pelo menos um agendamento ativo ou não).
			await this.syncGlobalRecurringScheduleToggle();
			return { id };
		}

		const newId = await this.schedulesRepo.create(userId, input);
		// Mesmo para novos schedules (ativos ou não), sincroniza o schedule global.
		await this.syncGlobalRecurringScheduleToggle();
		return { id: newId };
	}

	async deleteUserReportSchedule(payload: {
		userId: string;
		scheduleId: number;
	}): Promise<void> {
		const existing = await this.schedulesRepo.findByIdForUser(
			payload.userId,
			payload.scheduleId,
		);
		if (!existing) {
			throw new NotFoundError('Schedule not found');
		}
		await this.schedulesRepo.delete(payload.userId, payload.scheduleId);
		// Se o usuário removeu um agendamento, verifica se ainda existem
		// schedules ativos; se não houver, remove o schedule global do QStash.
		await this.syncGlobalRecurringScheduleToggle();
	}

	/**
	 * Executado pelo QStash (ou outro scheduler) para gerar automaticamente
	 * os relatórios conforme as recorrências do banco.
	 *
	 * Importante: horários são interpretados em UTC.
	 */
	async runRecurringReports(payload?: {
		now?: string | Date;
	}): Promise<{ processed: number }> {
		const now = payload?.now ? new Date(payload.now) : new Date();
		if (Number.isNaN(now.getTime())) {
			throw new ValidationError('Invalid now value');
		}

		// Normaliza para o minuto atual (sem segundos/milisegundos)
		const current = new Date(
			Date.UTC(
				now.getUTCFullYear(),
				now.getUTCMonth(),
				now.getUTCDate(),
				now.getUTCHours(),
				now.getUTCMinutes(),
				0,
				0,
			),
		);

		const weekday = current.getUTCDay(); // 0-6
		const timeStr = current.toISOString().slice(11, 16); // HH:MM

		const schedules = await this.schedulesRepo.findAllActive();
		let processed = 0;

		for (const schedule of schedules) {
			if (!schedule.days_of_week.includes(weekday)) continue;
			if (!schedule.times_utc.includes(timeStr)) continue;

			const scheduledFor = current;
			const alreadyRan = await this.schedulesRepo.hasRun(
				schedule.id,
				scheduledFor,
			);
			if (alreadyRan) continue;

			// Define o range padrão: de ontem até hoje (como no POST /api/reports action=generate)
			const to = scheduledFor;
			const toDate = to.toISOString().slice(0, 10);
			const from = new Date(to);
			from.setUTCDate(from.getUTCDate() - 1);
			const fromDate = from.toISOString().slice(0, 10);

			await this.generateReport({
				userId: schedule.user_id,
				from_date: fromDate,
				to_date: toDate,
				locale: schedule.locale ?? undefined,
			});

			await this.schedulesRepo.markRun(schedule.id, scheduledFor);
			processed += 1;
		}

		return { processed };
	}

	private triggerReportReady(userId: string, reportDate: string): void {
		pusher.trigger(`reports-${userId}`, 'report-ready', {
			report_date: reportDate,
		});
	}

	/**
	 * Garante que o schedule global do QStash reflita o estado atual dos
	 * agendamentos no banco:
	 *
	 * - Se existe pelo menos um schedule ativo -> garante que o schedule global exista.
	 * - Se não existe nenhum schedule ativo -> remove o schedule global, se existir.
	 */
	private async syncGlobalRecurringScheduleToggle(): Promise<void> {
		const active = await this.schedulesRepo.findAllActive();
		if (active.length > 0) {
			await ensureRecurringReportsSchedule();
		} else {
			await deleteRecurringReportsSchedule();
		}
	}
}
