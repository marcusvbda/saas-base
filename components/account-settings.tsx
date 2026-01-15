'use client';

import { useState } from 'react';
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputPassword } from '@/components/ui/input-password';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/providers/session.provider';
import { useLocale } from '@/hooks/use-locale';

export default function AccountSettings() {
	const { t } = useLocale();
	const { session } = useSession();
	const [name, setName] = useState(session?.user.name || '');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const handleUpdateProfile = () => {
		// TODO: Implement profile update
		console.log('Update profile:', { name });
	};

	return (
		<div className="space-y-6">
			<FieldGroup>
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
				<Field>
					<FieldLabel>
						<FieldTitle>{t('Name')}</FieldTitle>
					</FieldLabel>
					<FieldContent>
						<Input
							type="text"
							placeholder={t('Enter your name')}
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<FieldDescription>
							{t(
								'This is your display name. It can be your real name or a pseudonym'
							)}
							.
						</FieldDescription>
					</FieldContent>
				</Field>

				<Separator />

				<div className="space-y-4">
					<div className="space-y-4">
						<Field>
							<FieldLabel>
								<FieldTitle>New Password</FieldTitle>
							</FieldLabel>
							<FieldContent>
								<InputPassword
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Enter new password"
								/>
								<FieldDescription>
									Your password must be at least 6 characters long.
								</FieldDescription>
							</FieldContent>
						</Field>

						<Field>
							<FieldLabel>
								<FieldTitle>Confirm Password</FieldTitle>
							</FieldLabel>
							<FieldContent>
								<InputPassword
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Confirm new password"
								/>
								<FieldDescription>
									Please confirm your new password.
								</FieldDescription>
							</FieldContent>
						</Field>

						<div className="flex gap-2">
							<Button>Update password</Button>
							<Button variant="outline">Cancel</Button>
						</div>
					</div>
				</div>
			</FieldGroup>

			<Separator />

			<div className="flex justify-end">
				<Button onClick={handleUpdateProfile}>Update profile</Button>
			</div>
		</div>
	);
}
