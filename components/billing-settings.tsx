'use client';

import { useLocale } from '@/hooks/use-locale';
import { useState, FormEvent, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import z from 'zod';
import CardForm from './card-form';
import { ButtonLoading } from './ui/button-loading';
import { getValidatedParams } from '@/helpers/common';
import { toast } from 'sonner';
import Loading from './loading';

export default function BillingSettings() {
	const { t } = useLocale();
	const queryClient = useQueryClient();

	const { data: billingData, isPending: isLoading } = useQuery({
		queryKey: ['billing-information'],
		queryFn: async () => {
			const response = await fetch('/api/settings/billing-information');
			const result = await response.json();
			if (!response.ok || result.error) {
				throw new Error(
					result.error?.message || 'Failed to fetch billing data',
				);
			}
			return (
				result.data || {
					card_number: '',
					card_holder_name: '',
					card_expiry_month: '',
					card_expiry_year: '',
					card_cvv: '',
				}
			);
		},
	});

	const mutation = useMutation({
		mutationFn: async (payload: any) => {
			const response = await fetch('/api/settings/billing-information', {
				method: 'PUT',
				body: JSON.stringify(payload),
			});
			const result = await response.json();
			if (!response.ok || result.error) {
				throw new Error(result.error?.message || 'Failed to update billing');
			}
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['billing-information'] });
			toast.success(
				t('{resource} updated successfully', {
					resource: t('billing information'),
				}),
			);
		},
	});

	const initialFormData = billingData
		? {
				cardNumber: billingData.card_number || '',
				cardHolderName: billingData.card_holder_name || '',
				cardExpiryMonth: billingData.card_expiry_month || '',
				cardExpiryYear: billingData.card_expiry_year || '',
				cardCvv: billingData.card_cvv || '',
				errors: null,
			}
		: {
				cardNumber: '',
				cardHolderName: '',
				cardExpiryMonth: '',
				cardExpiryYear: '',
				cardCvv: '',
				errors: null,
			};

	const [form, setForm] = useState<any>(initialFormData);

	useEffect(() => {
		if (billingData) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setForm({
				cardNumber: billingData.card_number || '',
				cardHolderName: billingData.card_holder_name || '',
				cardExpiryMonth: billingData.card_expiry_month || '',
				cardExpiryYear: billingData.card_expiry_year || '',
				cardCvv: billingData.card_cvv || '',
				errors: form.errors,
			});
		}
	}, [billingData, form.errors]);

	if (isLoading) {
		return <Loading />;
	}

	const validator = (_formData: any) => {
		return z.object({
			cardNumber: z
				.string()
				.min(1, t('{field} is required', { field: t('Card Number') }))
				.regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, t('Invalid card number format')),
			cardHolderName: z
				.string()
				.min(1, t('{field} is required', { field: t('Card Holder Name') })),
			cardExpiryMonth: z
				.string()
				.min(2, t('{field} is required', { field: t('Expiry Month') }))
				.regex(/^(0[1-9]|1[0-2])$/, t('Invalid month')),
			cardExpiryYear: z
				.string()
				.min(4, t('{field} is required', { field: t('Expiry Year') }))
				.regex(/^\d{4}$/, t('Invalid year')),
			cardCvv: z
				.string()
				.min(3, t('{field} is required', { field: t('CVV') }))
				.regex(/^\d{3,4}$/, t('Invalid CVV')),
		});
	};

	const validateForm = async () => {
		return getValidatedParams(form, validator(form));
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const validatedFields: any = await validateForm();
		if (!validatedFields.success) {
			return setForm({
				...form,
				errors: validatedFields.data,
			});
		}

		const payload = {
			cardNumber: validatedFields.data.cardNumber,
			cardHolderName: validatedFields.data.cardHolderName,
			cardExpiryMonth: validatedFields.data.cardExpiryMonth,
			cardExpiryYear: validatedFields.data.cardExpiryYear,
			cardCvv: validatedFields.data.cardCvv,
		};

		try {
			await mutation.mutateAsync(payload);
			setForm({ ...form, errors: null });
		} catch (error: any) {
			setForm({
				...form,
				errors: { name: error.message },
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<CardForm
				value={{
					cardNumber: form.cardNumber || '',
					cardHolderName: form.cardHolderName || '',
					cardExpiryMonth: form.cardExpiryMonth || '',
					cardExpiryYear: form.cardExpiryYear || '',
					cardCvv: form.cardCvv || '',
				}}
				onChange={(value) => {
					setForm({
						...form,
						cardNumber: value.cardNumber,
						cardHolderName: value.cardHolderName,
						cardExpiryMonth: value.cardExpiryMonth,
						cardExpiryYear: value.cardExpiryYear,
						cardCvv: value.cardCvv,
					});
				}}
				errors={form.errors}
			/>

			<div className="flex justify-end">
				<ButtonLoading isLoading={mutation.isPending} type="submit">
					{t('Update {resource}', { resource: t('billing information') })}
				</ButtonLoading>
			</div>
		</form>
	);
}
