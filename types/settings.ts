import { ReactNode } from "react";

export interface ISettingsField {
    label?: string;
    name: string;
    description?: string | ((form: any) => string);
    type: 'text' | 'password' | 'select';
    options?: { label: string; value: string }[];
    placeholder?: string;
}

export interface ISettingsSection {
    validator?: any | null;
    initialData?: any;
    apiPath: string;
    resource: string;
    onSuccess?: any;
    method?: 'PUT' | 'POST';
    children?: ReactNode | null;
    fields?: ISettingsField[] | null;
}
