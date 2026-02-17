'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import {
	Copy,
	Pencil,
	ChevronDown,
	RefreshCw,
	FileText,
	Loader2,
	Trash2,
	Sparkles,
} from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { useSession } from '@/providers/session.provider';
import BasePage from '@/app/[locale]/(protected)/base-page';
import { IntegrationCard } from '@/components/repository-provider';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Loading from '@/components/loading';

type Integration = {
	id: number;
	user_id: string;
	provider: string;
	type?: string;
	token: string;
	status: string;
	created_at: string;
	updated_at: string;
};

type DailyReport = {
	id: number;
	user_id: string;
	report_date: string;
	from_date?: string | null;
	content: string;
	status?: 'processing' | 'ready' | 'failed';
	enhanced_at?: string | null;
	created_at: string;
	updated_at: string;
};

/** Normalize report_date from API (ISO or YYYY-MM-DD) to YYYY-MM-DD for comparison */
function reportDateOnly(reportDate: string | undefined): string {
	if (!reportDate) return '';
	const s = reportDate.trim();
	if (s.length >= 10) return s.slice(0, 10);
	return s;
}

function formatReportDate(
	dateStr: string | undefined,
	locale?: string,
): string {
	if (!dateStr) return '';
	const normalized = dateStr.includes('T')
		? dateStr
		: dateStr.slice(0, 10) + 'T12:00:00.000Z';
	const d = new Date(normalized);
	if (Number.isNaN(d.getTime())) return '';
	const localeTag = locale === 'pt' ? 'pt-BR' : 'en-US';
	return d.toLocaleDateString(localeTag, {
		weekday: 'long',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

export default function DashboardContent() {
	const { t, locale, router } = useLocale();
	const { session } = useSession();
	const userId = session?.user?.id;
	const queryClient = useQueryClient();

	const [fromDate, setFromDate] = useState(todayISO);
	const [toDate, setToDate] = useState(todayISO);

	const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
		queryKey: ['integrations', 'repository'],
		queryFn: () =>
			fetch('/api/integrations?type=repository').then((r) => r.json()),
		refetchInterval: (query) => {
			const list = query.state.data as Integration[] | undefined;
			const hasPending = list?.some((i: Integration) => i.status === 'pending');
			return hasPending ? 4000 : false;
		},
	});

	const { data: reports = [], isLoading: reportsLoading } = useQuery({
		queryKey: ['reports'],
		queryFn: () => fetch('/api/reports').then((r) => r.json()),
		refetchInterval: (query) => {
			const data = query.state.data as DailyReport[] | undefined;
			const hasProcessing = data?.some((r) => r.status === 'processing');
			return hasProcessing ? 4000 : false;
		},
	});

	const generateMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'generate',
					from_date: fromDate,
					to_date: toDate,
					locale,
				}),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(json?.error?.message ?? 'Failed to start generation');
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reports'] });
			toast.success(t('Report is being generated. You can close this page.'));
		},
		onError: (err: Error) => {
			toast.error(err.message ? t(err.message) : t('Something went wrong'));
		},
	});

	const regenerateMutation = useMutation({
		mutationFn: async (reportId: number) => {
			const res = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'regenerate',
					report_id: reportId,
					locale,
				}),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(json?.error?.message ?? 'Failed to regenerate');
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reports'] });
			toast.success(t('Report is being regenerated.'));
		},
		onError: (err: Error) => {
			toast.error(err.message ? t(err.message) : t('Something went wrong'));
		},
	});

	const updateContentMutation = useMutation({
		mutationFn: async ({
			id,
			content,
			enhanced,
		}: {
			id: number;
			content: string;
			enhanced?: boolean;
		}) => {
			const res = await fetch('/api/reports', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, content, enhanced }),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(json?.error?.message ?? 'Failed to save');
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reports'] });
			toast.success(t('Draft saved'));
		},
		onError: (err: Error) => {
			toast.error(err.message ? t(err.message) : t('Something went wrong'));
		},
	});

	const [editingId, setEditingId] = useState<number | null>(null);
	const [editedContent, setEditedContent] = useState<string>('');

	const deleteMutation = useMutation({
		mutationFn: async (reportId: number) => {
			const res = await fetch('/api/reports', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: reportId }),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(json?.error?.message ?? 'Failed to delete');
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reports'] });
			toast.success(t('Report deleted'));
		},
		onError: (err: Error) => {
			toast.error(err.message ? t(err.message) : t('Something went wrong'));
		},
	});

	const hasRepositoryIntegration = integrations.length > 0;
	const isIntegrationConnected = integrations.some(
		(i: Integration) => i.status === 'connected',
	);
	const today = todayISO();
	const todayReport = useMemo(
		() =>
			reports.find((r: DailyReport) => reportDateOnly(r.report_date) === today),
		[reports, today],
	);
	const recentReports = useMemo(
		() =>
			reports.filter(
				(r: DailyReport) => reportDateOnly(r.report_date) !== today,
			),
		[reports, today],
	);

	const startEdit = useCallback((report: DailyReport) => {
		setEditingId(report.id);
		setEditedContent(report.content);
	}, []);

	const cancelEdit = useCallback(() => {
		setEditingId(null);
		setEditedContent('');
	}, []);

	const handleSave = useCallback(
		async (report: DailyReport) => {
			if (editingId !== report.id) return;
			await updateContentMutation.mutateAsync({
				id: report.id,
				content: editedContent,
				enhanced: !!report.enhanced_at,
			});
			setEditingId(null);
			setEditedContent('');
		},
		[editingId, editedContent, updateContentMutation],
	);

	const handleCopy = useCallback(
		async (report: DailyReport) => {
			const isEditing = editingId === report.id;
			const contentToCopy = isEditing ? editedContent : report.content;
			const isDirty = isEditing && editedContent !== report.content;

			if (isDirty) {
				await updateContentMutation.mutateAsync({
					id: report.id,
					content: editedContent,
				});
			}
			if (isEditing) {
				setEditingId(null);
				setEditedContent('');
			}
			try {
				await navigator.clipboard.writeText(contentToCopy);
				toast.success(t('Copied to clipboard'));
			} catch {
				toast.error(t('Failed to copy'));
			}
		},
		[editingId, editedContent, updateContentMutation, t],
	);

	const handleRegenerate = useCallback(
		(reportId: number) => {
			regenerateMutation.mutate(reportId);
		},
		[regenerateMutation],
	);

	const handleDelete = useCallback(
		(reportId: number) => {
			if (window.confirm(t('Are you sure you want to delete this report?'))) {
				deleteMutation.mutate(reportId);
			}
		},
		[deleteMutation, t],
	);

	if (integrationsLoading) {
		return (
			<BasePage
				breadcrumbItems={[{ title: t('Dashboard') }]}
				title={t('Dashboard')}
				description={t('Welcome to the dashboard')}
			>
				<Loading />
			</BasePage>
		);
	}

	if (!hasRepositoryIntegration) {
		return (
			<BasePage
				breadcrumbItems={[{ title: t('Dashboard') }]}
				title={t('Dashboard')}
				description={t('Welcome to the dashboard')}
			>
				<EmptyState
					title={t('No repository integration')}
					description={t(
						'Add your repository credentials in Integrations to see your daily reports and connect cards here.',
					)}
					actionLabel={t('Go to Integrations')}
					onAction={() => router.push('/integrations')}
					actionIcon={null}
				/>
			</BasePage>
		);
	}

	return (
		<BasePage
			breadcrumbItems={[{ title: t('Dashboard') }]}
			title={t('Dashboard')}
			description={t('Welcome to the dashboard')}
		>
			<div className="space-y-8">
				{/* Integration cards */}
				<section>
					<h2 className="text-lg font-semibold mb-3">
						{t('Connected integrations')}
					</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{integrations.map((integration: Integration) => (
							<Link
								key={integration.id}
								href={`/${locale}/integrations`}
								className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
							>
								<IntegrationCard
									integration={integration as any}
									onClick={() => {}}
								/>
							</Link>
						))}
					</div>
				</section>

				{/* Generate report */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold">{t("Today's Draft")}</h2>
					<div className="space-y-4">
						{!todayReport && (
							<Card>
								<CardContent>
									<p className="text-muted-foreground text-sm mb-4">
										{t(
											'Generate a report for a period. Choose the start date (From) and end date (To).',
										)}
									</p>
									<div className="flex flex-wrap items-end gap-4">
										<div className="flex flex-col gap-1.5">
											<label
												htmlFor="report-from-date"
												className="text-sm font-medium"
											>
												{t('From')}
											</label>
											<input
												id="report-from-date"
												type="date"
												value={fromDate}
												onChange={(e) =>
													setFromDate(e.target.value.slice(0, 10))
												}
												className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
											/>
										</div>
										<div className="flex flex-col gap-1.5">
											<label
												htmlFor="report-to-date"
												className="text-sm font-medium"
											>
												{t('To')}
											</label>
											<input
												id="report-to-date"
												type="date"
												value={toDate}
												onChange={(e) => setToDate(e.target.value.slice(0, 10))}
												className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
											/>
										</div>
										<Button
											onClick={() => generateMutation.mutate()}
											disabled={
												generateMutation.isPending || !isIntegrationConnected
											}
										>
											{generateMutation.isPending ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													{t('Generating…')}
												</>
											) : (
												<>
													<FileText className="mr-2 h-4 w-4" />
													{t('Generate report')}
												</>
											)}
										</Button>
									</div>
								</CardContent>
							</Card>
						)}
					</div>

					{todayReport && (
						<Card className="bg-muted/50">
							<CardContent>
								<p className="text-muted-foreground text-sm">
									{t(
										"You already have today's report. Use Regenerate or Delete on the card below to create a new one.",
									)}
								</p>
							</CardContent>
						</Card>
					)}

					{reportsLoading && <Loading />}

					{!reportsLoading && !todayReport && (
						<Card>
							<CardContent>
								<p className="text-muted-foreground text-sm">
									{t(
										"You don't have a report for today yet. Use the form above to generate one for a period (e.g. from yesterday to today).",
									)}
								</p>
							</CardContent>
						</Card>
					)}

					{!reportsLoading && todayReport && (
						<ReportCard
							report={todayReport}
							locale={locale}
							editingId={editingId}
							editedContent={editedContent}
							onStartEdit={startEdit}
							onCancelEdit={cancelEdit}
							onSave={handleSave}
							onContentChange={setEditedContent}
							onCopy={handleCopy}
							onRegenerate={handleRegenerate}
							onDelete={handleDelete}
							updatePending={updateContentMutation.isPending}
							regeneratePending={regenerateMutation.isPending}
							deletePending={deleteMutation.isPending}
							canRegenerate={isIntegrationConnected}
							t={t}
						/>
					)}

					{recentReports.length > 0 && (
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">
								{t('Recent reports')}
							</h3>
							<div className="space-y-4">
								{recentReports.map((report: DailyReport) => (
									<ReportCard
										key={report.id}
										report={report}
										locale={locale}
										editingId={editingId}
										editedContent={editedContent}
										onStartEdit={startEdit}
										onCancelEdit={cancelEdit}
										onSave={handleSave}
										onContentChange={setEditedContent}
										onCopy={handleCopy}
										onRegenerate={handleRegenerate}
										onDelete={handleDelete}
										updatePending={updateContentMutation.isPending}
										regeneratePending={regenerateMutation.isPending}
										deletePending={deleteMutation.isPending}
										canRegenerate={isIntegrationConnected}
										t={t}
									/>
								))}
							</div>
						</div>
					)}
				</section>
			</div>
		</BasePage>
	);
}

function ReportCard({
	report,
	locale,
	editingId,
	editedContent,
	onStartEdit,
	onCancelEdit,
	onSave,
	onContentChange,
	onCopy,
	onRegenerate,
	onDelete,
	updatePending,
	regeneratePending,
	deletePending,
	canRegenerate = true,
	t,
}: {
	report: DailyReport;
	locale?: string;
	editingId: number | null;
	editedContent: string;
	onStartEdit: (report: DailyReport) => void;
	onCancelEdit: () => void;
	onSave: (report: DailyReport) => void;
	onContentChange: (value: string) => void;
	onCopy: (report: DailyReport) => void;
	onRegenerate: (reportId: number) => void;
	onDelete?: (reportId: number) => void;
	updatePending: boolean;
	regeneratePending: boolean;
	deletePending: boolean;
	canRegenerate?: boolean;
	t: (key: string, params?: Record<string, string>) => string;
}) {
	const isEditing = editingId === report.id;
	const isToday = reportDateOnly(report.report_date) === todayISO();
	const isProcessing = report.status === 'processing';
	const isEnhanced = !!report.enhanced_at;

	return (
		<Card
			className={
				isEnhanced
					? 'border-2 border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
					: undefined
			}
		>
			<CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
				<CardTitle className="text-base flex items-center gap-2 flex-wrap">
					{isToday
						? t("Today's Draft")
						: report.from_date &&
							  reportDateOnly(report.from_date) !==
									reportDateOnly(report.report_date)
							? t('From {from} to {to}', {
									from: formatReportDate(report.from_date, locale),
									to: formatReportDate(report.report_date, locale),
								})
							: formatReportDate(report.report_date, locale)}
					{isProcessing && (
						<span className="inline-flex items-center gap-1.5 text-muted-foreground font-normal text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							{t('Processing…')}
						</span>
					)}
					{isEnhanced && (
						<span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-normal text-xs">
							<Sparkles className="h-3.5 w-3.5" />
							{t('Enhanced with AI')}
						</span>
					)}
				</CardTitle>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								disabled={updatePending || isProcessing}
							>
								<Pencil className="mr-2 h-4 w-4" />
								{t('Edit draft')}
								<ChevronDown className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() =>
									isEditing ? onCancelEdit() : onStartEdit(report)
								}
								disabled={isProcessing}
							>
								{isEditing ? t('Cancel edit') : t('Edit draft')}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onCopy(report)}
								disabled={isProcessing}
							>
								<Copy className="mr-2 h-4 w-4" />
								{t('Copy draft')}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onCopy(report)}
						disabled={updatePending || isProcessing}
					>
						<Copy className="mr-2 h-4 w-4" />
						{t('Copy')}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onRegenerate(report.id)}
						disabled={regeneratePending || isProcessing || !canRegenerate}
					>
						{regeneratePending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="h-4 w-4" />
						)}
						<span className="sr-only">{t('Regenerate')}</span>
					</Button>
					{onDelete && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onDelete(report.id)}
							disabled={deletePending || isProcessing}
							className="text-destructive hover:text-destructive"
						>
							{deletePending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
							<span className="sr-only">{t('Delete report')}</span>
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{isProcessing ? (
					<div className="flex items-center gap-3 text-muted-foreground bg-muted/50 p-4 rounded-md">
						<Loader2 className="h-5 w-5 animate-spin shrink-0" />
						<p className="text-sm">
							{t(
								'Report is being generated. You can close this page; the card will update when ready.',
							)}
						</p>
					</div>
				) : isEditing ? (
					<div className="space-y-2">
						<Textarea
							value={editedContent}
							onChange={(e) => onContentChange(e.target.value)}
							rows={12}
							className="font-mono text-sm"
						/>
						<div className="flex gap-2">
							<Button
								size="sm"
								onClick={() => onSave(report)}
								disabled={updatePending}
							>
								{t('Save')}
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => onCopy(report)}
								disabled={updatePending}
							>
								{t('Save and copy')}
							</Button>
							<Button size="sm" variant="ghost" onClick={onCancelEdit}>
								{t('Cancel')}
							</Button>
						</div>
					</div>
				) : (
					<div className="report-markdown text-muted-foreground bg-muted/50 p-4 rounded-md text-sm [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:first:mt-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:pl-6 [&_ul_ul]:pl-5 [&_li]:my-0.5 [&_li]:leading-relaxed [&_p]:my-2 [&_p]:text-sm">
						<ReactMarkdown>{report.content}</ReactMarkdown>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
