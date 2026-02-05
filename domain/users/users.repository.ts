import { db } from '@/database';
import {
	user,
	account,
	verification,
	userSubscriptions,
	userBilling,
} from '@/database/schema';
import { eq, and, sql } from 'drizzle-orm';

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

type BillingData = {
	card_number?: string | null;
	card_holder_name?: string | null;
	card_expiry_month?: string | null;
	card_expiry_year?: string | null;
	card_cvv?: string | null;
};

export default class UserRepository {
	async findById(id: string) {
		const rows = await db.select().from(user).where(eq(user.id, id)).limit(1);
		return rows[0] ?? null;
	}

	async findByEmail(email: string) {
		const rows = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.limit(1);
		return rows[0] ?? null;
	}

	async updatePassword(
		userId: string,
		hashedPassword: string,
		tx?: TransactionClient,
	) {
		const target = (tx ?? db) as typeof db;
		await target
			.update(account)
			.set({
				password: hashedPassword,
				updatedAt: new Date(),
			})
			.where(
				and(eq(account.userId, userId), eq(account.providerId, 'credential')),
			);
	}

	async createUserVerification(userId: string, token: string) {
		await db.insert(verification).values({
			id: crypto.randomUUID(),
			identifier: `reset-password:${userId}`,
			value: token,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});
	}

	async findPasswordVerificationToken(token: string) {
		const rows = await db
			.select()
			.from(verification)
			.where(
				and(
					eq(verification.value, token),
					sql`${verification.expiresAt} > NOW()`,
				),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	async deletePasswordVerificationToken(token: string, tx?: TransactionClient) {
		const target = (tx ?? db) as typeof db;
		await target.delete(verification).where(eq(verification.value, token));
	}

	async verifyUserById(userId: string) {
		await db
			.update(user)
			.set({ emailVerified: true })
			.where(eq(user.id, userId));
	}

	async updateUserData(userId: string, data: { name?: string }) {
		if (!data.name) return;
		await db.update(user).set({ name: data.name }).where(eq(user.id, userId));
	}

	async findBillingByUserId(userId: string) {
		const rows = await db
			.select()
			.from(userBilling)
			.where(eq(userBilling.userId, userId))
			.limit(1);
		return rows[0] ?? null;
	}

	async createBilling(userId: string, data: BillingData) {
		const allowedFields = [
			'cardNumber',
			'cardHolderName',
			'cardExpiryMonth',
			'cardExpiryYear',
			'cardCvv',
		] as const;
		const values: Record<string, unknown> = {
			userId,
			cardNumber: data.card_number ?? null,
			cardHolderName: data.card_holder_name ?? null,
			cardExpiryMonth: data.card_expiry_month ?? null,
			cardExpiryYear: data.card_expiry_year ?? null,
			cardCvv: data.card_cvv ?? null,
		};
		await db
			.insert(userBilling)
			.values(values as typeof userBilling.$inferInsert);
	}

	async updateBilling(id: number, data: BillingData) {
		const updates: Partial<typeof userBilling.$inferInsert> = {};
		if (data.card_number !== undefined) updates.cardNumber = data.card_number;
		if (data.card_holder_name !== undefined)
			updates.cardHolderName = data.card_holder_name;
		if (data.card_expiry_month !== undefined)
			updates.cardExpiryMonth = data.card_expiry_month;
		if (data.card_expiry_year !== undefined)
			updates.cardExpiryYear = data.card_expiry_year;
		if (data.card_cvv !== undefined) updates.cardCvv = data.card_cvv;
		if (Object.keys(updates).length === 0) return;
		await db.update(userBilling).set(updates).where(eq(userBilling.id, id));
	}

	async getSubscriptionByUserId(userId: string) {
		const rows = await db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.userId, userId))
			.orderBy(sql`${userSubscriptions.updatedAt} DESC`)
			.limit(1);
		return rows[0] ?? null;
	}

	async getSubscriptionBySubscriptionId(subscriptionId: string) {
		const rows = await db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.subscriptionId, subscriptionId))
			.limit(1);
		return rows[0] ?? null;
	}

	async deleteSubscriptionBySubscriptionId(subscriptionId: string) {
		await db
			.delete(userSubscriptions)
			.where(eq(userSubscriptions.subscriptionId, subscriptionId));
	}

	async createSubscription(
		userId: string,
		data: {
			plan: string;
			subscription_id: string;
			stripe_customer_id?: string | null;
			status?: string;
			current_period_start?: Date | null;
			current_period_end?: Date | null;
			cancel_at_period_end?: boolean;
		},
	) {
		await db.insert(userSubscriptions).values({
			userId,
			plan: data.plan,
			subscriptionId: data.subscription_id,
			stripeCustomerId: data.stripe_customer_id ?? null,
			status: (data.status ?? 'active') as 'active',
			currentPeriodStart: data.current_period_start ?? null,
			currentPeriodEnd: data.current_period_end ?? null,
			cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
		});
	}

	async updateSubscription(
		id: number,
		data: {
			plan?: string;
			subscription_id?: string;
			stripe_customer_id?: string | null;
			status?: string;
			current_period_start?: Date | null;
			current_period_end?: Date | null;
			cancel_at_period_end?: boolean;
		},
	) {
		const updates: Partial<typeof userSubscriptions.$inferInsert> = {};
		if (data.plan !== undefined) updates.plan = data.plan;
		if (data.subscription_id !== undefined)
			updates.subscriptionId = data.subscription_id;
		if (data.stripe_customer_id !== undefined)
			updates.stripeCustomerId = data.stripe_customer_id;
		if (data.status !== undefined) updates.status = data.status as 'active';
		if (data.current_period_start !== undefined)
			updates.currentPeriodStart = data.current_period_start;
		if (data.current_period_end !== undefined)
			updates.currentPeriodEnd = data.current_period_end;
		if (data.cancel_at_period_end !== undefined)
			updates.cancelAtPeriodEnd = data.cancel_at_period_end;
		if (Object.keys(updates).length === 0) return;
		updates.updatedAt = new Date();
		await db
			.update(userSubscriptions)
			.set(updates)
			.where(eq(userSubscriptions.id, id));
	}

	async transaction<T>(
		callback: (tx: TransactionClient) => Promise<T>,
	): Promise<T> {
		return db.transaction(callback);
	}
}
