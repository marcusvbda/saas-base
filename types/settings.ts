import { ReactNode, ComponentType } from 'react';
import type { z } from 'zod';

export type SettingsUpdateInput = {
	timezone?: string | null;
	plan?: string | null;
	card_number?: string | null;
	card_holder_name?: string | null;
	card_expiry_month?: string | null;
	card_expiry_year?: string | null;
	card_cvv?: string | null;
};

export interface ISettingsField {
	label?: string;
	name: string;
	description?: string | ((form: Record<string, unknown>) => string);
	type: 'text' | 'password' | 'select' | 'custom';
	options?: { label: string; value: string }[];
	placeholder?: string;
	component?: ComponentType<{
		value: string;
		onChange: (value: string) => void;
	}>;
}

/** Payload returned to onSuccess after a successful settings API call */
export type SettingsSuccessPayload = Record<string, unknown>;

export type SettingsOnSuccessCallback = (args: {
	data: SettingsSuccessPayload;
	form?: Record<string, unknown>;
	setForm?: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
}) => void;

/** Validator is a function that returns a Zod schema (or null) for the form */
export type SettingsValidator = (
	form?: Record<string, unknown>,
) => z.ZodType<Record<string, unknown>> | null;

export interface ISettingsSection {
	validator?: SettingsValidator | null;
	initialData?: Record<string, unknown>;
	apiPath: string;
	resource: string;
	onSuccess?: SettingsOnSuccessCallback;
	method?: 'PUT' | 'POST';
	children?: ReactNode | null;
	fields?: ISettingsField[] | null;
}
