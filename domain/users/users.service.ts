import { NotFoundError } from '@/domain/errors';
import { resend } from '@/lib/resend';
import StripeGateway from '../payments/gateways/stripe';
import UserRepository from './users.repository';
import { hashPassword } from 'better-auth/crypto';
import jwt from 'jsonwebtoken';

export default class UserService {
	private gateway: StripeGateway;
	constructor(private repository: UserRepository = new UserRepository()) {
		this.gateway = new StripeGateway();
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
			throw new NotFoundError('User not found');
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

	async getSubscriptionByUserId(userId: string) {
		return this.repository.getSubscriptionByUserId(userId);
	}

	/**
	 * Returns effective plan (for access) and subscription detail (for UI).
	 * Access = active, or canceled but current_period_end > now.
	 */
	async getSubscriptionForSession(userId: string): Promise<{
		effectivePlan: string;
		subscriptionDetail: {
			plan: string;
			status: string;
			cancelAtPeriodEnd: boolean;
			currentPeriodEnd: Date | null;
		} | null;
	}> {
		const sub = await this.repository.getSubscriptionByUserId(userId);
		const now = new Date();
		const defaultResult = {
			effectivePlan: 'free' as const,
			subscriptionDetail: null as {
				plan: string;
				status: string;
				cancelAtPeriodEnd: boolean;
				currentPeriodEnd: Date | null;
			} | null,
		};
		if (!sub) return defaultResult;

		const status = (sub as { status?: string }).status ?? 'active';
		const cancelAtPeriodEnd = Boolean((sub as { cancel_at_period_end?: number })?.cancel_at_period_end);
		const currentPeriodEnd = (sub as { current_period_end?: Date | null })?.current_period_end
			? new Date((sub as { current_period_end: Date }).current_period_end)
			: null;

		const hasAccess =
			status === 'active' ||
			status === 'trialing' ||
			(status === 'canceled' && currentPeriodEnd != null && currentPeriodEnd > now) ||
			(status === 'past_due');

		const plan = (sub as { plan?: string }).plan ?? 'free';
		const detail = {
			plan,
			status,
			cancelAtPeriodEnd,
			currentPeriodEnd,
		};

		if (!hasAccess) {
			return { ...defaultResult, subscriptionDetail: detail };
		}

		return {
			effectivePlan: plan,
			subscriptionDetail: detail,
		};
	}

	async upsertSubscription(userId: string, data: any) {
		const subscription = await this.repository.getSubscriptionByUserId(userId);
		if (subscription) {
			return await this.repository.updateSubscription(subscription.id, data);
		}
		await this.repository.createSubscription(userId, data);
	}

	/**
	 * Cancel subscription. Default: cancel_at_period_end so user keeps access until period end.
	 * Returns { cancelAtPeriodEnd, currentPeriodEnd } for UI.
	 */
	async cancelSubscription(
		userId: string,
		cancelAtPeriodEnd = true,
	): Promise<{ cancelAtPeriodEnd: boolean; currentPeriodEnd: Date | null } | null> {
		const subscription = await this.getSubscriptionByUserId(userId);
		if (!subscription) return null;
		await this.gateway.cancelSubscription(
			subscription.subscription_id,
			cancelAtPeriodEnd,
		);
		if (cancelAtPeriodEnd) {
			await this.repository.updateSubscription(subscription.id, {
				cancel_at_period_end: true,
			});
		}
		const end = subscription.current_period_end
			? new Date(subscription.current_period_end)
			: null;
		return { cancelAtPeriodEnd, currentPeriodEnd: end };
	}

	async getSubscriptionBySubscriptionId(subscriptionId: string) {
		return this.repository.getSubscriptionBySubscriptionId(subscriptionId);
	}

	async deleteSubscriptionBySubscriptionId(subscriptionId: string) {
		await this.repository.deleteSubscriptionBySubscriptionId(subscriptionId);
	}

	async reactivateSubscription(userId: string): Promise<boolean> {
		const sub = await this.repository.getSubscriptionByUserId(userId);
		if (!sub || !sub.cancel_at_period_end) return false;
		await this.gateway.reactivateSubscription(sub.subscription_id);
		await this.repository.updateSubscription(sub.id, {
			cancel_at_period_end: false,
		});
		return true;
	}

	async updateSubscriptionStatus(userId: string, status: string) {
		const sub = await this.repository.getSubscriptionByUserId(userId);
		if (sub) {
			await this.repository.updateSubscription(sub.id, { status });
		}
	}

	async updateSubscriptionFields(
		subscriptionRowId: number,
		data: {
			status?: string;
			current_period_start?: Date | null;
			current_period_end?: Date | null;
			cancel_at_period_end?: boolean;
		},
	) {
		await this.repository.updateSubscription(subscriptionRowId, data);
	}
}
