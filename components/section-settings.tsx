'use client';

import { FormEvent, useState, useTransition } from 'react';
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
import { ButtonLoading } from './ui/button-loading';
import { getValidatedParams } from '@/helpers/common';
import { toast } from 'sonner';
import { ISettingsSection, ISettingsField } from '@/types/settings';
import { InputPassword } from './ui/input-password';
import {
	Select,
	SelectContent,
	SelectTrigger,
	SelectValue,
	SelectItem,
} from '@/components/ui/select';

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
	const [isPending, startTransition] = useTransition();
	const [form, setForm] = useState<any>({
		...initialData,
		errors: null,
	});

	const validateForm = async () => {
		return getValidatedParams(form, validator && validator(form));
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		startTransition(async () => {
			const validatedFields: any = await validateForm();
			if (!validatedFields.success) {
				return setForm({
					...form,
					errors: validatedFields.data,
				});
			}

			const payload = {
				...validatedFields.data,
			};

			const response = await fetch(apiPath, {
				method,
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			if (!response.ok || result.error) {
				return setForm({
					...form,
					errors: { name: result.error?.message },
				});
			}

			toast.success(t('{resource} updated successfully', { resource }));

			setForm({ ...form, errors: null });

			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			onSuccess && onSuccess({ data: validatedFields.data, form, setForm });
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
									value={form[field.name]}
									onChange={(e) =>
										setForm({ ...form, [field.name]: e.target.value })
									}
									aria-invalid={form.errors?.[field.name] ? 'true' : undefined}
								/>
							)}
							{['password'].includes(field?.type || '') && (
								<InputPassword
									className="w-full"
									value={form[field.name]}
									onChange={(e) =>
										setForm({ ...form, [field.name]: e.target.value })
									}
								/>
							)}
							{['select'].includes(field?.type || '') && (
								<Select
									value={form[field.name]}
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
						</FieldContent>
						<FieldError className="text-red-500 mt-2">
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
				<ButtonLoading isLoading={isPending} type="submit">
					{t('Update {resource}', { resource })}
				</ButtonLoading>
			</div>
		</form>
	);
}
