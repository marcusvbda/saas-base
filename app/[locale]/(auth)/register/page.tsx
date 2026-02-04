import { redirect } from 'next/navigation';
import RegisterForm from './register-form';

export default async function RegisterPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	if (process.env.CAN_REGISTER !== 'true') {
		const { locale } = await params;
		redirect(`/${locale}/sign-in`);
	}
	return <RegisterForm />;
}
