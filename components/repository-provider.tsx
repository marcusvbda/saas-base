'use client';

import { useMemo, useState } from 'react';
import { GitlabIcon, PlusIcon } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
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

type IntegrationStatus = 'pending' | 'connected' | 'disconnected';

type Integration = {
	id: number;
	user_id: string;
	provider: 'gitlab';
	token: string;
	status: IntegrationStatus;
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
		queryKey: ['integrations'],
		queryFn: () => fetch('/api/integrations').then((res) => res.json()),
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
			queryClient.invalidateQueries({ queryKey: ['integrations'] });
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
			queryClient.invalidateQueries({ queryKey: ['integrations'] });
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
			queryClient.invalidateQueries({ queryKey: ['integrations'] });
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
					<h2 className="text-lg font-semibold">{t('Repository providers')}</h2>
					<p className="text-muted-foreground text-sm">
						{t(
							'Connect your code hosting providers to automatically use data from your repositories.',
						)}
					</p>
				</div>
				{!emptyState && !isLoading && (
					<Button onClick={openCreate}>
						<PlusIcon className="mr-2 h-4 w-4" />
						{t('Add integration')}
					</Button>
				)}
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
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{data?.map((integration, index) => (
						<IntegrationCard
							integration={integration}
							onClick={() => openEdit(integration)}
							key={index}
						/>
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
