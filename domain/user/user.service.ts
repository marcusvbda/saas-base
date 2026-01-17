import { resend } from '@/lib/resend';
import UserRepository from './user.repository';
import { hashPassword } from 'better-auth/crypto';
import jwt from 'jsonwebtoken';

export default class UserService {
	constructor(private repository: UserRepository = new UserRepository()) {
		//
	}

	async sendVerificationEmail(email: string, url: string) {
		try {
			await resend.emails.send({
				from: process.env.RESEND_FROM_EMAIL!,
				to: email,
				subject: 'Verify your email',
				html: `URL : ${url}`,
			});
		} catch (error) {
			throw error;
		}
	}

	async sendPasswordResetEmail(email: string) {
		const user = await this.repository.findByEmail(email);
		if (!user) return;
		const token = globalThis.crypto.randomUUID();
		await this.repository.createUserVerification(user.id, token);
		const baseURL =
			process.env.BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			'http://localhost:3000';
		const url = `${baseURL}/update-password?token=${token}`;
		await resend.emails.send({
			from: process.env.RESEND_FROM_EMAIL!,
			to: user.email,
			subject: 'Reset your password',
			html: `URL : ${url}`,
		});
	}

	async updatePasswordTokenIsValid(token: string) {
		const result = await this.repository.findPasswordVerificationToken(token);
		return !!result;
	}

	async updatePasswordByToken(token: string, newPassword: string) {
		const verification =
			await this.repository.findPasswordVerificationToken(token);
		if (!verification) return false;
		const userId = verification.identifier.replace('reset-password:', '');
		const user = await this.repository.findById(userId);
		if (!user) return false;
		const hashedPassword = await hashPassword(newPassword);
		await this.repository.updatePassword(userId, hashedPassword);
		await this.repository.deletePasswordVerificationToken(token);
		return true;
	}

	async updatePassword(userId: string, password: string) {
		const user = await this.repository.findById(userId);
		if (!user) return false;
		const hashedPassword = await hashPassword(password);
		await this.repository.updatePassword(userId, hashedPassword);
		return true;
	}

	async verifyEmailByToken(token: string) {
		const payload = jwt.verify(token, process.env.AUTH_SECRET as string);
		const user = await this.repository.findByEmail(payload.email);
		await this.repository.verifyUserById(user.id);
	}

	async updateUserData(userId: string, data: any) {
		return await this.repository.updateUserData(userId, data);
	}
}
