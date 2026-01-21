import { resend } from '@/lib/resend';
import UserRepository from './users.repository';
import { hashPassword } from 'better-auth/crypto';
import jwt from 'jsonwebtoken';

export default class UserService {
	constructor(private repository: UserRepository = new UserRepository()) {
		//
	}

	async sendVerificationEmail(email: string, url: string) {
		await resend.emails.send({
			from: process.env.RESEND_FROM_EMAIL!,
			to: email,
			subject: 'Verify your email',
			html: `URL : ${url}`,
		});
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

		// Transação para garantir atomicidade: update + delete devem ser atômicos
		await this.repository.transaction(async (connection) => {
			await connection.execute(
				"UPDATE `account` SET `password` = :password, `updatedAt` = CURRENT_TIMESTAMP(3) WHERE `userId` = :userId AND `providerId` = 'credential'",
				{ password: hashedPassword, userId },
			);
			await connection.execute(
				'DELETE FROM `verification` WHERE `value` = :token',
				{ token },
			);
		});

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
		const payload = jwt.verify(token, process.env.AUTH_SECRET as string) as {
			email: string;
		};
		const user = await this.repository.findByEmail(payload.email);
		if (!user) {
			throw new Error('User not found');
		}
		await this.repository.verifyUserById(user.id);
	}

	async updateUserData(userId: string, data: { name?: string }) {
		return await this.repository.updateUserData(userId, data);
	}

	async getBillingByUserId(userId: string) {
		return this.repository.findBillingByUserId(userId);
	}

	async upsertBilling(userId: string, data: any) {
		const billing = await this.repository.findBillingByUserId(userId);
		if (billing) {
			return await this.repository.updateBilling(billing.id, data);
		}
		await this.repository.createBilling(userId, data);
	}
}
