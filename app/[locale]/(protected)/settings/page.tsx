'use client';

import { Activity, useEffect, useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import BasePage from '../base-page';
import SettingsSidebar from '@/components/settings-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { useQueryState } from '@/hooks/use-query-state';
import { useSession } from '@/providers/session.provider';
import z from 'zod';
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import SectionSettings from '@/components/section-settings';

export const SettingsSections = ['account', 'general', 'credentials'];
export type ISettingsSection = (typeof SettingsSections)[number];

export default function SettingsPage() {
	const [isClient, setIsClient] = useState(false);
	const { t, locale } = useLocale();
	const { session, setSession } = useSession();
	const [activeSection, setActiveSection] = useQueryState(
		'section',
		SettingsSections,
		'account'
	);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) return null;

	return (
		<BasePage
			breadcrumbItems={[
				{ title: 'Dashboard', url: '/' },
				{ title: t('Settings') },
			]}
			title={t('Settings')}
			description={t(
				'Manage your account settings and set e-mail preferences.'
			)}
		>
			<div className="gap-6 w-full grid grid-cols-1 md:grid-cols-[1fr_4fr]">
				<SettingsSidebar
					activeSection={activeSection as ISettingsSection}
					onSectionChange={
						setActiveSection as (section: ISettingsSection) => void
					}
				/>
				<Card className="w-full space-y-1">
					<CardContent>
						<Activity mode={activeSection === 'account' ? 'visible' : 'hidden'}>
							<SectionSettings
								resource={t('profile')}
								apiPath="/api/auth/profile/data-update"
								validator={() => {
									return z.object({
										name: z
											.string()
											.min(1, t('{field} is required', { field: t('Name') })),
									});
								}}
								initialData={{
									name: session?.user.name || '',
								}}
								onSuccess={({ data }: any) => {
									setSession({
										...session,
										user: {
											...session?.user,
											name: data.name,
										},
									});
								}}
								fields={[
									{
										label: t('Name'),
										name: 'name',
										description: t(
											'This is your display name. It can be your real name or a pseudonym'
										),
										type: 'text',
									},
								]}
							>
								<Field>
									<FieldLabel>
										<FieldTitle>Email</FieldTitle>
									</FieldLabel>
									<FieldContent>
										<Input
											type="email"
											disabled
											className="bg-muted"
											value={session?.user.email}
											readOnly
										/>
										<FieldDescription>
											{t('Your email address cannot be changed')}.
										</FieldDescription>
									</FieldContent>
								</Field>
							</SectionSettings>
						</Activity>
						<Activity mode={activeSection === 'general' ? 'visible' : 'hidden'}>
								<SectionSettings
									resource={t('timezone')}
										apiPath="/api/settings/general-update"
									validator={() => {
										return z.object({
											timezone: z
												.string()
												.min(
													1,
													t('{field} is required', { field: t('Timezone') })
												),
										});
									}}
									initialData={{
										timezone:
											session?.settings?.timezone ||
											Intl.DateTimeFormat().resolvedOptions().timeZone,
									}}
									fields={[
										{
											label: t('Timezone'),
											name: 'timezone',
											type: 'select',
											placeholder: t('Select your timezone'),
											description: (form: any) => {
												if (!form.timezone) return '';
												const tzLocale = ['pt'].includes(locale)
													? 'pt-BR'
													: 'en-US';


												const formattedSelectedTz = new Date().toLocaleString(tzLocale, {
													timeZone: form.timezone,
												});
												return formattedSelectedTz;
											},
											options: Intl.supportedValuesOf('timeZone').map((tz) => ({
												label: tz,
												value: tz,
											})),
										},
									]}
									onSuccess={({ data }: any) => {
										setSession({
											...session,
											user: {
												...session?.user,
												timezone: data.timezone,
											},
										});
									}}
								/>
						</Activity>
						<Activity
							mode={activeSection === 'credentials' ? 'visible' : 'hidden'}
						>
							<SectionSettings
								resource={t('settings')}
								apiPath="/api/auth/profile/password-update"
								validator={(form: any) => {
									return z.object({
										password: z
											.string()
											.min(6, t('Password must be at least 6 characters'))
											.refine((data) => data === form.confirmPassword, {
												path: ['confirmPassword'],
												message: t('Passwords do not match'),
											}),
										confirmPassword: z
											.string()
											.min(6, t('Password must be at least 6 characters')),
									});
								}}
								initialData={{
									password: '',
									confirmPassword: '',
								}}
								fields={[
									{
										label: t('Password'),
										name: 'password',
										placeholder: t('Enter new password'),
										type: 'password',
										description: t(
											'{resource} must be at least {quantity} characters long',
											{
												resource: t('Password'),
												quantity: 6,
											}
										),
									},
									{
										label: t('Confirm Password'),
										name: 'confirmPassword',
										placeholder: t('Confirm new password'),
										type: 'password',
										description: t(
											'{resource} must be at least {quantity} characters long',
											{
												resource: t('Password'),
												quantity: 6,
											}
										),
									},
								]}
							/>
						</Activity>
					</CardContent>
				</Card>
			</div>
		</BasePage>
	);
}
