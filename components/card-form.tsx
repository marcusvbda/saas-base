'use client';

import { useLocale } from '@/hooks/use-locale';
import { Input } from '@/components/ui/input';
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
	FieldTitle,
} from '@/components/ui/field';

interface CardFormProps {
	value: {
		cardNumber?: string;
		cardHolderName?: string;
		cardExpiryMonth?: string;
		cardExpiryYear?: string;
		cardCvv?: string;
	};
	onChange: (value: {
		cardNumber?: string;
		cardHolderName?: string;
		cardExpiryMonth?: string;
		cardExpiryYear?: string;
		cardCvv?: string;
	}) => void;
	errors?: Record<string, string>;
}

export default function CardForm({ value, onChange, errors }: CardFormProps) {
	const { t } = useLocale();

	const formatCardNumber = (input: string) => {
		const cleaned = input.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
		const limited = cleaned.substring(0, 16);
		const parts: string[] = [];

		for (let i = 0; i < limited.length; i += 4) {
			const part = limited.substring(i, i + 4);
			if (part) {
				parts.push(part);
			}
		}

		return parts.join(' ');
	};

	const formatExpiryMonth = (input: string) => {
		const cleaned = input.replace(/[^0-9]/g, '');
		const month = parseInt(cleaned, 10);
		if (month > 12) return '12';
		if (cleaned.length === 1 && month > 1) return `0${month}`;
		return cleaned.substring(0, 2);
	};

	const formatExpiryYear = (input: string) => {
		const cleaned = input.replace(/[^0-9]/g, '');
		return cleaned.substring(0, 4);
	};

	const formatCvv = (input: string) => {
		const cleaned = input.replace(/[^0-9]/g, '');
		return cleaned.substring(0, 4);
	};

	const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatCardNumber(e.target.value);
		onChange({ ...value, cardNumber: formatted });
	};

	const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatExpiryMonth(e.target.value);
		onChange({ ...value, cardExpiryMonth: formatted });
	};

	const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatExpiryYear(e.target.value);
		onChange({ ...value, cardExpiryYear: formatted });
	};

	const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatCvv(e.target.value);
		onChange({ ...value, cardCvv: formatted });
	};

	return (
		<div className="space-y-4">
			<Field>
				<FieldLabel>
					<FieldTitle>{t('Card Number')}</FieldTitle>
				</FieldLabel>
				<FieldContent>
					<Input
						type="text"
						placeholder="0000 0000 0000 0000"
						value={value.cardNumber || ''}
						onChange={handleCardNumberChange}
						maxLength={19}
						aria-invalid={errors?.cardNumber ? 'true' : undefined}
					/>
				</FieldContent>
				<FieldError className="text-red-500 ">
					{Array.isArray(errors?.cardNumber)
						? errors.cardNumber.join('. ')
						: errors?.cardNumber}
				</FieldError>
			</Field>

			<Field>
				<FieldLabel>
					<FieldTitle>{t('Card Holder Name')}</FieldTitle>
				</FieldLabel>
				<FieldContent>
					<Input
						type="text"
						placeholder={t('Enter card holder name')}
						value={value.cardHolderName || ''}
						onChange={(e) =>
							onChange({ ...value, cardHolderName: e.target.value })
						}
						aria-invalid={errors?.cardHolderName ? 'true' : undefined}
					/>
				</FieldContent>
				<FieldError className="text-red-500 ">
					{Array.isArray(errors?.cardHolderName)
						? errors.cardHolderName.join('. ')
						: errors?.cardHolderName}
				</FieldError>
			</Field>

			<div className="grid grid-cols-2 gap-4">
				<Field>
					<FieldLabel>
						<FieldTitle>{t('Expiry Date')}</FieldTitle>
					</FieldLabel>
					<FieldContent>
						<div className="flex gap-2">
							<Input
								type="text"
								placeholder="MM"
								value={value.cardExpiryMonth || ''}
								onChange={handleExpiryMonthChange}
								maxLength={2}
								className="w-20"
								aria-invalid={errors?.cardExpiryMonth ? 'true' : undefined}
							/>
							<span className="self-center">/</span>
							<Input
								type="text"
								placeholder="YYYY"
								value={value.cardExpiryYear || ''}
								onChange={handleExpiryYearChange}
								maxLength={4}
								className="flex-1"
								aria-invalid={errors?.cardExpiryYear ? 'true' : undefined}
							/>
						</div>
					</FieldContent>
					<FieldError className="text-red-500 mt-2 space-y-1">
						{errors?.cardExpiryMonth && (
							<div>
								{Array.isArray(errors.cardExpiryMonth)
									? errors.cardExpiryMonth.join('. ')
									: errors.cardExpiryMonth}
							</div>
						)}
						{errors?.cardExpiryYear && (
							<div>
								{Array.isArray(errors.cardExpiryYear)
									? errors.cardExpiryYear.join('. ')
									: errors.cardExpiryYear}
							</div>
						)}
					</FieldError>
				</Field>

				<Field>
					<FieldLabel>
						<FieldTitle>{t('CVV')}</FieldTitle>
					</FieldLabel>
					<FieldContent>
						<Input
							type="text"
							placeholder="000"
							value={value.cardCvv || ''}
							onChange={handleCvvChange}
							maxLength={4}
							aria-invalid={errors?.cardCvv ? 'true' : undefined}
						/>
					</FieldContent>
					<FieldError className="text-red-500">
						{Array.isArray(errors?.cardCvv)
							? errors.cardCvv.join('. ')
							: errors?.cardCvv}
					</FieldError>
				</Field>
			</div>
		</div>
	);
}
