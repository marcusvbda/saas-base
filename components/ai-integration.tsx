'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Sparkles, PlusIcon } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { InputPassword } from './ui/input-password';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from './loading';

const createFormSchema = z.object({
	base_url: z.string().min(1, 'URL is required'),
	token: z.string().min(1, 'Token is required'),
	model: z.string().min(1, 'Model is required'),
});

const editFormSchema = z.object({
	base_url: z.string().min(1, 'URL is required'),
	token: z.string().optional(),
	model: z.string().min(1, 'Model is required'),
});

type AIIntegrationItem = {
	id: number;
	user_id: string;
	provider: string;
	type: 'ai';
	token: string;
	status: string;
	base_url: string | null;
	model: string | null;
	created_at: string;
	updated_at: string;
};

type Mode = 'create' | 'edit';

export default function AIIntegration() {
	const { t } = useLocale();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [mode, setMode] = useState<Mode>('create');
	const [selected, setSelected] = useState<AIIntegrationItem | null>(null);
	const [url, setUrl] = useState('');
	const [token, setToken] = useState('');
	const [model, setModel] = useState('');

	const { data, isLoading } = useQuery({
		queryKey: ['integrations', 'ai'],
		queryFn: () => fetch('/api/integrations?type=ai').then((res) => res.json()),
	});
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: async (payload: {
			type: 'ai';
			base_url: string;
			token: string;
			model?: string | null;
		}) => {
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
			queryClient.invalidateQueries({ queryKey: ['integrations', 'ai'] });
			toast.success(t('AI integration created successfully'));
			resetForm();
			setIsDrawerOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message ? t(error.message) : t('Something went wrong'));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (payload: {
			id: number;
			base_url?: string;
			token?: string;
			model?: string | null;
		}) => {
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
			queryClient.invalidateQueries({ queryKey: ['integrations', 'ai'] });
			toast.success(t('AI integration updated successfully'));
			resetForm();
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
			queryClient.invalidateQueries({ queryKey: ['integrations', 'ai'] });
			toast.success(t('AI integration deleted successfully'));
			setIsDrawerOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message ? t(error.message) : t('Something went wrong'));
		},
	});

	function resetForm() {
		setSelected(null);
		setUrl('');
		setToken('');
		setModel('');
	}

	const isPending =
		createMutation.isPending ||
		updateMutation.isPending ||
		deleteMutation.isPending;

	const openCreate = () => {
		setMode('create');
		resetForm();
		setIsDrawerOpen(true);
	};

	const openEdit = (integration: AIIntegrationItem) => {
		setMode('edit');
		setSelected(integration);
		setUrl(integration.base_url || '');
		setToken('');
		setModel(integration.model || '');
		setIsDrawerOpen(true);
	};

	const closeDrawer = () => {
		if (isPending) return;
		setIsDrawerOpen(false);
	};

	const handleSubmit = () => {
		const raw = {
			base_url: url.trim(),
			token,
			model: model.trim(),
		};
		if (mode === 'create') {
			const parsed = createFormSchema.safeParse(raw);
			if (!parsed.success) {
				const msg = parsed.error.issues[0]?.message ?? 'Invalid form';
				toast.error(t(msg));
				return;
			}
			createMutation.mutate({
				type: 'ai',
				base_url: parsed.data.base_url,
				token: parsed.data.token,
				model: parsed.data.model,
			});
			return;
		}
		if (!selected) return;
		const parsed = editFormSchema.safeParse(raw);
		if (!parsed.success) {
			const msg = parsed.error.issues[0]?.message ?? 'Invalid form';
			toast.error(t(msg));
			return;
		}
		updateMutation.mutate({
			id: selected.id,
			base_url: parsed.data.base_url,
			token: parsed.data.token || undefined,
			model: parsed.data.model,
		});
	};

	const handleDelete = () => {
		if (!selected) return;
		const confirmed = window.confirm(
			t('Are you sure you want to {action}?', { action: t('delete') }),
		);
		if (confirmed) deleteMutation.mutate(selected.id);
	};

	const list = Array.isArray(data) ? data : [];
	const emptyState = !isLoading && list.length === 0;

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold">{t('AI')}</h2>
				<p className="text-muted-foreground text-sm">
					{t(
						'Configure an AI provider (OpenAI-compatible API) to use Enhance with AI on your reports.',
					)}
				</p>
			</div>

			{isLoading && <Loading />}

			{emptyState && (
				<EmptyState
					title={t('No AI integration yet')}
					description={t(
						'Add an AI integration with API URL and token to enable Enhance with AI.',
					)}
					actionLabel={t('Add AI integration')}
					onAction={openCreate}
					actionIcon={<PlusIcon className="mr-2 h-4 w-4" />}
				/>
			)}

			{!emptyState && list[0] && (
				<Card
					className="cursor-pointer transition hover:border-primary/40 hover:shadow-sm"
					onClick={() => openEdit(list[0])}
				>
					<CardHeader className="flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="bg-primary/5 flex h-10 w-10 items-center justify-center rounded-lg">
								<Sparkles className="h-5 w-5 text-primary" />
							</div>
							<div>
								<CardTitle className="text-sm">
									{t('Model')}: {(list[0] as AIIntegrationItem).model}
								</CardTitle>
								<CardDescription className="text-xs font-mono truncate max-w-md">
									{(list[0] as AIIntegrationItem).base_url || '—'}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
				</Card>
			)}

			<Sheet
				open={isDrawerOpen}
				onOpenChange={(open) => !open && closeDrawer()}
			>
				<SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
					<SheetHeader>
						<SheetTitle>
							{mode === 'create'
								? t('Add AI integration')
								: t('Edit AI integration')}
						</SheetTitle>
					</SheetHeader>
					<div className="space-y-4 p-4 pt-0">
						<div className="space-y-2">
							<label className="text-sm font-medium">{t('API URL')}</label>
							<Input
								placeholder={t('https://api.openai.com/v1')}
								value={url}
								onChange={(e) => setUrl(e.target.value)}
							/>
							<p className="text-muted-foreground text-xs">
								{t('OpenAI-compatible API base URL (e.g. OpenAI, OpenRouter).')}
							</p>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">{t('API key')}</label>
							<InputPassword
								placeholder={
									mode === 'edit'
										? t('Leave blank to keep current')
										: t('Paste your API key')
								}
								value={token}
								onChange={(e) => setToken(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">{t('Model')}</label>
							<Input value={model} onChange={(e) => setModel(e.target.value)} />
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
											? t('Add')
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
