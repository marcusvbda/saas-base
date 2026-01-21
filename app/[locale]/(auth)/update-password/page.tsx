import UserService from '@/domain/users/users.service';
import { notFound } from 'next/navigation';
import ClientPage from './client-page';

export default async function UpdatePasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ token: string }>;
}) {
	const params = await searchParams;
	const token = encodeURIComponent(params.token);
	const userService = new UserService();
	const isValid = await userService.updatePasswordTokenIsValid(token);
	if (!isValid) return notFound();

	return <ClientPage token={token} />;
}
