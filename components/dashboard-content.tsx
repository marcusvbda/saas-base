'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Pusher from 'pusher-js';
import Link from 'next/link';
import {
	Copy,
	Pencil,
	ChevronDown,
	RefreshCw,
	FileText,
	Loader2,
	Trash2,
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
	content: string;
	created_at: string;
	updated_at: string;
};

function formatReportDate(dateStr: string): string {
	const d = new Date(dateStr + 'Z');
	return d.toLocaleDateString(undefined, {
		weekday: 'long',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

function useReportReadySubscription(userId: string | undefined) {
	const queryClient = useQueryClient();
	useEffect(() => {
		if (!userId || typeof process.env.NEXT_PUBLIC_PUSHER_KEY === 'undefined')
			return;
		const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
			cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'us2',
		});
		const channel = pusher.subscribe(`reports-${userId}`);
		const handler = () => {
			queryClient.invalidateQueries({ queryKey: ['reports'] });
		};
		channel.bind('report-ready', handler);
		return () => {
			channel.unbind('report-ready', handler);
			pusher.unsubscribe(`reports-${userId}`);
		};
	}, [userId, queryClient]);
}

export default function DashboardContent() {
	const { t, locale, router } = useLocale();
	const { session } = useSession();
	const userId = session?.user?.id;
	const queryClient = useQueryClient();

	const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
		queryKey: ['integrations', 'repository'],
		queryFn: () =>
			fetch('/api/integrations?type=repository').then((r) => r.json()),
	});

	const { data: reports = [], isLoading: reportsLoading } = useQuery({
		queryKey: ['reports'],
		queryFn: () => fetch('/api/reports').then((r) => r.json()),
	});

	useReportReadySubscription(userId);

	const generateMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'generate', locale }),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(json?.error?.message ?? 'Failed to start generation');
			}
			return json;
		},
		onSuccess: () => {
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
		mutationFn: async ({ id, content }: { id: number; content: string }) => {
			const res = await fetch('/api/reports', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, content }),
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
	const today = todayISO();
	const todayReport = useMemo(
		() => reports.find((r: DailyReport) => r.report_date === today),
		[reports, today],
	);
	const recentReports = useMemo(
		() => reports.filter((r: DailyReport) => r.report_date !== today),
		[reports, today],
	);

	const [editingId, setEditingId] = useState<number | null>(null);
	const [editedContent, setEditedContent] = useState<string>('');

	const startEdit = useCallback((report: DailyReport) => {
		setEditingId(report.id);
		setEditedContent(report.content);
	}, []);

	const cancelEdit = useCallback(() => {
		setEditingId(null);
		setEditedContent('');
	}, []);

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
			deleteMutation.mutate(reportId);
		},
		[deleteMutation],
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
				<div className="mt-4">
					<Button
						variant="outline"
						onClick={() => router.push('/integrations')}
					>
						{t('Go to Integrations')}
					</Button>
				</div>
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

				{/* Today's Draft & Reports */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold">{t("Today's Draft")}</h2>

					{reportsLoading && <Loading />}

					{!reportsLoading && !todayReport && (
						<Card>
							<CardContent>
								<p className="text-muted-foreground text-sm mb-4">
									{t(
										"You don't have a report for today yet. Generate one to get started.",
									)}
								</p>
								<Button
									onClick={() => generateMutation.mutate()}
									disabled={generateMutation.isPending}
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
							</CardContent>
						</Card>
					)}

					{!reportsLoading && todayReport && (
						<ReportCard
							report={todayReport}
							editingId={editingId}
							editedContent={editedContent}
							onStartEdit={startEdit}
							onCancelEdit={cancelEdit}
							onContentChange={setEditedContent}
							onCopy={handleCopy}
							onRegenerate={handleRegenerate}
							onDelete={undefined}
							updatePending={updateContentMutation.isPending}
							regeneratePending={regenerateMutation.isPending}
							deletePending={deleteMutation.isPending}
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
										editingId={editingId}
										editedContent={editedContent}
										onStartEdit={startEdit}
										onCancelEdit={cancelEdit}
										onContentChange={setEditedContent}
										onCopy={handleCopy}
										onRegenerate={handleRegenerate}
										onDelete={handleDelete}
										updatePending={updateContentMutation.isPending}
										regeneratePending={regenerateMutation.isPending}
										deletePending={deleteMutation.isPending}
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
	editingId,
	editedContent,
	onStartEdit,
	onCancelEdit,
	onContentChange,
	onCopy,
	onRegenerate,
	onDelete,
	updatePending,
	regeneratePending,
	deletePending,
	t,
}: {
	report: DailyReport;
	editingId: number | null;
	editedContent: string;
	onStartEdit: (report: DailyReport) => void;
	onCancelEdit: () => void;
	onContentChange: (value: string) => void;
	onCopy: (report: DailyReport) => void;
	onRegenerate: (reportId: number) => void;
	onDelete?: (reportId: number) => void;
	updatePending: boolean;
	regeneratePending: boolean;
	deletePending: boolean;
	t: (key: string) => string;
}) {
	const isEditing = editingId === report.id;
	const isToday = report.report_date === todayISO();

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
				<CardTitle className="text-base">
					{isToday ? t("Today's Draft") : formatReportDate(report.report_date)}
				</CardTitle>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" disabled={updatePending}>
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
							>
								{isEditing ? t('Cancel edit') : t('Edit draft')}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onCopy(report)}>
								<Copy className="mr-2 h-4 w-4" />
								{t('Copy draft')}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onCopy(report)}
						disabled={updatePending}
					>
						<Copy className="mr-2 h-4 w-4" />
						{t('Copy')}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onRegenerate(report.id)}
						disabled={regeneratePending}
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
							disabled={deletePending}
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
				{isEditing ? (
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
					<pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
						{report.content}
					</pre>
				)}
			</CardContent>
		</Card>
	);
}
