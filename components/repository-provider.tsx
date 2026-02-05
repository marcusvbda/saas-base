'use client';

import { useMemo, useState, useEffect } from 'react';
import { GitlabIcon, PlusIcon } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	CardContent,
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { EmptyState } from './empty-state';
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from './ui/sheet';

import { toast } from 'sonner';
import { InputPassword } from './ui/input-password';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from './loading';
import SocketClient from './socket-client';
import { Spinner } from './ui/spinner';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';

type IntegrationStatus = 'pending' | 'connected' | 'disconnected';

/** project id (string) -> branch names to ignore */
type IgnoredBranchesByProject = Record<string, string[]>;

type Integration = {
	id: number;
	user_id: string;
	provider: 'gitlab';
	type?: 'repository';
	token: string;
	status: IntegrationStatus;
	projects: number[] | null;
	ignored_branches: IgnoredBranchesByProject | null;
	created_at: string;
	updated_at: string;
};

type Mode = 'create' | 'edit';

export default function RepositoryProvider() {
	const { t } = useLocale();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [mode, setMode] = useState<Mode>('create');
	const [selected, setSelected] = useState<Integration | null>(null);
	const [token, setToken] = useState('');
	const [provider, setProvider] = useState<'gitlab'>('gitlab');
	const { data, isLoading } = useQuery({
		queryKey: ['integrations', 'repository'],
		queryFn: () =>
			fetch('/api/integrations?type=repository').then((res) => res.json()),
		refetchInterval: (query) => {
			const list = query.state.data as Integration[] | undefined;
			const hasPending = list?.some((i) => i.status === 'pending');
			return hasPending ? 4000 : false;
		},
	});
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: async (payload: { provider: 'gitlab'; token: string }) => {
			const res = await fetch('/api/integrations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(json?.error?.message || 'Failed to create integration');
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', 'repository'],
			});
			toast.success(t('Integration created successfully'));
			setToken('');
			setIsDrawerOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message ? t(error.message) : t('Something went wrong'));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (payload: { id: number; token?: string }) => {
			const res = await fetch('/api/integrations', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(json?.error?.message || 'Failed to update integration');
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', 'repository'],
			});
			toast.success(t('Integration updated successfully'));
			setToken('');
			setIsDrawerOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message ? t(error.message) : t('Something went wrong'));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: number) => {
			const res = await fetch('/api/integrations', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id }),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(json?.error?.message || 'Failed to delete integration');
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', 'repository'],
			});
			toast.success(t('Integration deleted successfully'));
			setIsDrawerOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message ? t(error.message) : t('Something went wrong'));
		},
	});

	const isPending =
		createMutation.isPending ||
		updateMutation.isPending ||
		deleteMutation.isPending;

	const openCreate = () => {
		setMode('create');
		setSelected(null);
		setToken('');
		setProvider('gitlab');
		setIsDrawerOpen(true);
	};

	const openEdit = (integration: Integration) => {
		setMode('edit');
		setSelected(integration);
		setToken('');
		setProvider(integration.provider);
		setIsDrawerOpen(true);
	};

	const closeDrawer = () => {
		if (isPending) return;
		setIsDrawerOpen(false);
	};

	const handleSubmit = () => {
		if (!token && mode === 'create') {
			toast.error(t('Token is required'));
			return;
		}
		if (mode === 'create') {
			createMutation.mutate({ provider, token });
			return;
		}
		if (selected) {
			updateMutation.mutate({
				id: selected.id,
				token: token || undefined,
			});
		}
	};

	const handleDelete = () => {
		if (!selected) return;
		const confirmed = window.confirm(
			t('Are you sure you want to {action}?', { action: t('delete') }),
		);
		if (!confirmed) return;
		deleteMutation.mutate(selected.id);
	};

	const emptyState = useMemo(
		() => !isLoading && (!data || data.length === 0),
		[isLoading, data],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold">{t('Repository Provider')}</h2>
					<p className="text-muted-foreground text-sm">
						{t(
							'Connect your code hosting provider to automatically use data from your repositories.',
						)}
					</p>
				</div>
			</div>

			{isLoading && <Loading />}

			{emptyState && (
				<EmptyState
					title={t('No integrations yet')}
					description={t(
						'Start by adding a GitLab integration to connect your repositories.',
					)}
					actionLabel={t('Add your first integration')}
					onAction={openCreate}
					actionIcon={<PlusIcon className="mr-2 h-4 w-4" />}
				/>
			)}

			{!emptyState && (
				<div className="flex flex-col gap-4">
					{data?.map((integration, index) => (
						<div key={index} className="flex flex-col gap-4">
							<IntegrationCard
								integration={integration}
								onClick={() => openEdit(integration)}
							/>
							{integration.status === 'connected' && (
								<IntegrationConfig integration={integration} />
							)}
						</div>
					))}
				</div>
			)}

			<Sheet
				open={isDrawerOpen}
				onOpenChange={(open) => !open && closeDrawer()}
			>
				<SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
					<SheetHeader>
						<SheetTitle>
							{mode === 'create'
								? t('Add GitLab integration')
								: t('Edit GitLab integration')}
						</SheetTitle>
					</SheetHeader>
					<div className="space-y-4 p-4 pt-0">
						<div className="space-y-2">
							<label className="text-sm font-medium">{t('Provider')}</label>
							<Select
								value={provider}
								onValueChange={(value) => setProvider(value as 'gitlab')}
								disabled={mode === 'edit'}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder={t('Select a provider')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="gitlab">GitLab</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								{t('Personal access token')}
							</label>
							<InputPassword
								placeholder={t('Paste your GitLab personal access token')}
								value={token}
								onChange={(e) => setToken(e.target.value)}
							/>
							<p className="text-muted-foreground text-xs">
								{t(
									'We only store this token securely to synchronize your repositories.',
								)}
							</p>
						</div>
					</div>
					<SheetFooter>
						<div className="flex items-center justify-between gap-3">
							{mode === 'edit' && (
								<Button
									variant="ghost"
									className="text-destructive hover:bg-destructive/10 hover:text-destructive"
									onClick={handleDelete}
									disabled={isPending}
								>
									{isPending ? t('Deleting…') : t('Delete integration')}
								</Button>
							)}
							<div className="ml-auto flex items-center gap-2">
								<SheetClose asChild>
									<Button variant="outline" disabled={isPending}>
										{t('Cancel')}
									</Button>
								</SheetClose>
								<Button onClick={handleSubmit} disabled={isPending}>
									{isPending
										? t('Saving…')
										: mode === 'create'
											? t('Connect')
											: t('Save changes')}
								</Button>
							</div>
						</div>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	);
}

export const IntegrationCard = ({
	integration,
	onClick,
}: {
	integration: Integration;
	onClick: () => void;
}) => {
	const queryClient = useQueryClient();

	const statusLabel = (status: IntegrationStatus) => {
		if (status === 'connected') return t('Connected');
		if (status === 'disconnected') return t('Disconnected');
		return (
			<span className="flex items-center gap-2">
				{t('Pending')} <Spinner className="size-2" />
			</span>
		);
	};

	const statusClasses = (status: IntegrationStatus) => {
		if (status === 'disconnected') {
			return 'border-red-500 text-red-500 bg-red-500/20';
		}
		if (status === 'connected') {
			return 'border-green-500 text-green-500 bg-green-500/20';
		}
		return 'border-border bg-muted text-primary bg-muted';
	};
	const { t } = useLocale();

	return (
		<SocketClient
			eventName="on-integration-status-update"
			channelName={`integration-${integration.id}`}
			initialData={{
				status: integration.status,
			}}
			onChange={(data: any) => {
				queryClient.setQueryData(['integrations', 'repository'], (old: any) => {
					return old.map((item: any) => {
						if (item.id === integration.id) {
							return { ...item, status: data.status };
						}
						return item;
					});
				});
			}}
			onSubscribed={() => {
				queryClient.invalidateQueries({
					queryKey: ['integrations', 'repository'],
				});
			}}
			render={(data: any) => {
				return (
					<Card
						key={integration.id}
						className="cursor-pointer transition hover:border-primary/40 hover:shadow-sm"
						onClick={onClick}
					>
						<CardHeader className="flex-row items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="bg-primary/5 flex h-10 w-10 items-center justify-center rounded-lg">
									<GitlabIcon className="h-5 w-5 text-primary" />
								</div>
								<div>
									<CardTitle className="text-sm">
										{integration?.provider === 'gitlab' && 'GitLab workspace'}
									</CardTitle>
									<CardDescription className="text-xs">
										{['gitlab'].includes(integration?.provider)
											? t('Personal access token')
											: t('Personal access token')}
									</CardDescription>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge className={statusClasses(data.status)}>
									{statusLabel(data.status)}
								</Badge>
							</div>
						</CardHeader>
					</Card>
				);
			}}
		/>
	);
};

const IntegrationConfig = ({ integration }: { integration: Integration }) => {
	const { t } = useLocale();
	const queryClient = useQueryClient();
	const [selectedProjects, setSelectedProjects] = useState<number[]>(
		integration.projects || [],
	);
	const [selectedBranchesByProject, setSelectedBranchesByProject] = useState<
		Record<string, string[]>
	>(() => {
		const raw = integration.ignored_branches;
		if (!raw) return {};
		if (Array.isArray(raw)) return {};
		return { ...raw };
	});
	const [projectFilter, setProjectFilter] = useState('');
	const [debouncedProjectFilter, setDebouncedProjectFilter] = useState('');

	// Debounce for project filter
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedProjectFilter(projectFilter);
		}, 300);
		return () => clearTimeout(timer);
	}, [projectFilter]);

	const { data: projects, isLoading: isLoadingProjects } = useQuery({
		queryKey: ['gitlab-projects', integration.id],
		queryFn: () =>
			fetch(`/api/integrations/${integration.id}/gitlab/projects`).then((res) =>
				res.json(),
			),
	});

	const saveMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch('/api/integrations', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: integration.id,
					projects: selectedProjects.length > 0 ? selectedProjects : null,
					ignored_branches:
						Object.keys(selectedBranchesByProject).length > 0
							? selectedBranchesByProject
							: null,
				}),
			});
			const json = await res.json();
			if (!res.ok || json.error) {
				throw new Error(
					json?.error?.message || 'Failed to update configuration',
				);
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', 'repository'],
			});
			toast.success(t('Configuration saved successfully'));
		},
		onError: (error: Error) => {
			toast.error(error.message ? t(error.message) : t('Something went wrong'));
		},
	});

	const toggleProject = (projectId: number) => {
		const isRemoving = selectedProjects.includes(projectId);
		setSelectedProjects((prev) =>
			isRemoving ? prev.filter((id) => id !== projectId) : [...prev, projectId],
		);
		if (isRemoving) {
			setSelectedBranchesByProject((branches) => {
				const next = { ...branches };
				delete next[String(projectId)];
				return next;
			});
		}
	};

	const toggleBranch = (projectId: number, branchName: string) => {
		const key = String(projectId);
		setSelectedBranchesByProject((prev) => {
			const list = prev[key] || [];
			const nextList = list.includes(branchName)
				? list.filter((name) => name !== branchName)
				: [...list, branchName];
			const next = { ...prev };
			if (nextList.length === 0) delete next[key];
			else next[key] = nextList;
			return next;
		});
	};

	const filteredProjects = useMemo(() => {
		if (!projects) return [];
		if (!debouncedProjectFilter) return projects;
		return (projects as Array<{ path_with_namespace: string }>).filter(
			(project) =>
				project.path_with_namespace
					.toLowerCase()
					.includes(debouncedProjectFilter.toLowerCase()),
		);
	}, [projects, debouncedProjectFilter]);

	return (
		<div className="w-full border-0 mt-8">
			<CardHeader className="p-0">
				<div>
					<CardTitle className="text-sm">{t('Report Configuration')}</CardTitle>
					<CardDescription className="text-xs">
						{t('Select projects and branches to monitor')}
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="space-y-6 p-0">
				<div className="space-y-3 mt-8">
					<div className="flex items-center justify-between">
						<label className="text-sm font-medium">
							{t('Projects to monitor')}
						</label>
						{projects && (projects as any[]).length > 0 && (
							<span className="text-xs text-muted-foreground">
								{selectedProjects.length} {t('selected')}
							</span>
						)}
					</div>

					{isLoadingProjects ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Spinner className="size-4" />
							{t('Loading projects...')}
						</div>
					) : (
						<>
							<Input
								placeholder={t('Filter projects...')}
								value={projectFilter}
								onChange={(e) => setProjectFilter(e.target.value)}
								className="h-9"
							/>
							<div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
								{filteredProjects.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										{projectFilter
											? t('No projects found matching filter')
											: t('No projects found')}
									</p>
								) : (
									filteredProjects.map(
										(project: {
											id: number;
											name: string;
											path_with_namespace: string;
										}) => (
											<div
												key={project.id}
												className="flex items-center space-x-2"
											>
												<Checkbox
													id={`project-${project.id}`}
													checked={selectedProjects.includes(project.id)}
													onCheckedChange={() => toggleProject(project.id)}
												/>
												<label
													htmlFor={`project-${project.id}`}
													className="cursor-pointer text-sm"
												>
													{project.path_with_namespace}
												</label>
											</div>
										),
									)
								)}
							</div>

							{selectedProjects.length > 0 && (
								<div className="space-y-3 mt-8">
									<label className="text-sm font-medium">
										{t('Branches to ignore in reports')}
									</label>
									<div className="space-y-3 mt-2">
										{selectedProjects.map((projectId) => {
											const project = (projects as any[])?.find(
												(p: any) => p.id === projectId,
											);
											return (
												<ProjectBranchCard
													key={projectId}
													integrationId={integration.id}
													projectId={projectId}
													projectName={
														project?.path_with_namespace ??
														`Project ${projectId}`
													}
													selectedBranches={
														selectedBranchesByProject[String(projectId)] || []
													}
													onToggleBranch={(branchName) =>
														toggleBranch(projectId, branchName)
													}
													t={t}
												/>
											);
										})}
									</div>
								</div>
							)}
						</>
					)}
				</div>

				<div className="flex justify-end gap-2 pt-4">
					<Button
						size="sm"
						onClick={() => saveMutation.mutate()}
						disabled={saveMutation.isPending}
					>
						{saveMutation.isPending ? t('Saving...') : t('Save')}
					</Button>
				</div>
			</CardContent>
		</div>
	);
};

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 500;

const ProjectBranchCard = ({
	integrationId,
	projectId,
	projectName,
	selectedBranches,
	onToggleBranch,
	t,
}: {
	integrationId: number;
	projectId: number;
	projectName: string;
	selectedBranches: string[];
	onToggleBranch: (branchName: string) => void;
	t: (key: string) => string;
}) => {
	const [searchInput, setSearchInput] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	// Debounce 500ms for branch search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchInput);
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data: branches, isLoading: isLoadingBranches } = useQuery({
		queryKey: ['gitlab-branches', integrationId, projectId, debouncedSearch],
		queryFn: () =>
			fetch(
				`/api/integrations/${integrationId}/gitlab/branches?projectId=${projectId}&search=${encodeURIComponent(debouncedSearch)}`,
			).then((res) => res.json()),
		enabled: debouncedSearch.trim().length >= MIN_SEARCH_LENGTH,
	});

	const canSearch = debouncedSearch.trim().length >= MIN_SEARCH_LENGTH;

	return (
		<Card className="bg-muted/30">
			<CardHeader className="pb-3">
				<CardTitle className="text-xs font-medium">{projectName}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<Input
					placeholder={t('Search branches (min 2 characters)...')}
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					className="h-8 text-sm"
				/>
				{!canSearch ? (
					<p className="text-xs text-muted-foreground p-2">
						{t('Type at least 2 characters to search branches')}
					</p>
				) : isLoadingBranches ? (
					<div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
						<Spinner className="size-4" />
						{t('Loading branches...')}
					</div>
				) : (
					<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border bg-background p-2">
						{!branches?.length ? (
							<p className="text-xs text-muted-foreground p-2">
								{t('No branches found matching filter')}
							</p>
						) : (
							branches.map((branch: { name: string }) => (
								<div
									key={branch.name}
									className="flex items-center space-x-2 px-1"
								>
									<Checkbox
										id={`branch-${projectId}-${branch.name}`}
										checked={selectedBranches.includes(branch.name)}
										onCheckedChange={() => onToggleBranch(branch.name)}
									/>
									<label
										htmlFor={`branch-${projectId}-${branch.name}`}
										className="cursor-pointer text-xs flex-1"
									>
										{branch.name}
									</label>
								</div>
							))
						)}
					</div>
				)}
				{selectedBranches.length > 0 && (
					<div className="space-y-2 rounded-md border-t pt-3">
						<p className="text-xs font-medium text-muted-foreground">
							{t('Selected branches to ignore')}
						</p>
						<div className="flex flex-wrap gap-2">
							{selectedBranches.map((name) => (
								<Badge
									key={name}
									variant="secondary"
									className="cursor-pointer gap-1 pr-1 hover:bg-destructive/20"
									onClick={() => onToggleBranch(name)}
								>
									{name}
									<span className="ml-0.5 hover:text-destructive" aria-hidden>
										×
									</span>
								</Badge>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
