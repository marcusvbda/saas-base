'use client';

import { FormEvent, useState } from 'react';
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/hooks/use-locale';
import { getValidatedParams } from '@/helpers/common';
import { toast } from 'sonner';
import {
	ISettingsSection,
	ISettingsField,
	type SettingsSuccessPayload,
} from '@/types/settings';
import { InputPassword } from './ui/input-password';
import {
	Select,
	SelectContent,
	SelectTrigger,
	SelectValue,
	SelectItem,
} from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { Button } from './ui/button';

export default function SectionSettings({
	validator = null,
	initialData = {},
	apiPath,
	resource,
	onSuccess,
	children = null,
	method = 'PUT',
	fields = null,
}: ISettingsSection) {
	const { t } = useLocale();
	const [form, setForm] = useState<Record<string, unknown>>({
		...initialData,
		errors: null,
	});

	const updateMutation = useMutation({
		mutationFn: async ({
			path,
			method: m,
			payload,
		}: {
			path: string;
			method: string;
			payload: Record<string, unknown>;
		}) => {
			const response = await fetch(path, {
				method: m,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const result = await response.json();
			if (!response.ok || result.error) {
				throw new Error(result.error?.message ?? 'Request failed');
			}
			return { data: payload, result };
		},
		onSuccess: (_, variables) => {
			toast.success(t('{resource} updated successfully', { resource }));
			setForm((prev) => ({ ...prev, errors: null } as Record<string, unknown>));
			onSuccess?.({
				data: variables.payload as SettingsSuccessPayload,
				form,
				setForm,
			});
		},
		onError: (error: Error) => {
			setForm((prev) => ({
				...prev,
				errors: { name: t(error.message) },
			}));
		},
	});

	const validateForm = async () => {
		const schema = validator?.(form);
		if (!schema) return { success: true, data: form };
		return getValidatedParams(form, schema);
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const validatedFields = await validateForm();
		if (!validatedFields.success) {
			setForm((prev: any) => ({
				...prev,
				errors: validatedFields.data,
			}));
			return;
		}
		updateMutation.mutate({
			path: apiPath,
			method,
			payload: validatedFields.data,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<FieldGroup>
				{children}
				{(fields || []).map((field: ISettingsField) => (
					<Field key={field.name}>
						{field.label && (
							<FieldLabel>
								<FieldTitle>{field.label}</FieldTitle>
							</FieldLabel>
						)}
						<FieldContent>
							{['text'].includes(field?.type || '') && (
								<Input
									className="w-full"
									type={field.type}
									placeholder={field?.placeholder}
									value={String(form[field.name] ?? '')}
									onChange={(e) =>
										setForm({ ...form, [field.name]: e.target.value })
									}
									aria-invalid={form.errors?.[field.name] ? 'true' : undefined}
								/>
							)}
							{['password'].includes(field?.type || '') && (
								<InputPassword
									className="w-full"
									value={String(form[field.name] ?? '')}
									onChange={(e) =>
										setForm({ ...form, [field.name]: e.target.value })
									}
								/>
							)}
							{['select'].includes(field?.type || '') && (
								<Select
									value={String(form[field.name] ?? '')}
									onValueChange={(value) =>
										setForm({ ...form, [field.name]: value })
									}
									aria-invalid={form.errors?.[field.name] ? 'true' : undefined}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={field?.placeholder} />
									</SelectTrigger>
									<SelectContent>
										{(field?.options || []).map(
											(option: { label: string; value: string }) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							)}
							{['custom'].includes(field?.type || '') &&
								field?.component &&
								(() => {
									const CustomComponent = field.component;
									return (
										<CustomComponent
											value={String(form[field.name] ?? '')}
											onChange={(value) =>
												setForm({ ...form, [field.name]: value })
											}
										/>
									);
								})()}
						</FieldContent>
						<FieldError className="text-red-500 ">
							{form.errors?.[field.name]}
						</FieldError>
						{field?.description && (
							<FieldDescription>
								{typeof field?.description === 'function'
									? field?.description(form)
									: field?.description}
							</FieldDescription>
						)}
					</Field>
				))}
			</FieldGroup>

			<div className="flex justify-end">
				<Button disabled={updateMutation.isPending} type="submit">
					{updateMutation.isPending
						? t('Updating…')
						: t('Update {resource}', { resource })}
				</Button>
			</div>
		</form>
	);
}
