import { db } from '@/database';
import { userSettings } from '@/database/schema';
import { eq } from 'drizzle-orm';

type SettingsData = {
	timezone?: string | null;
	plan?: string | null;
	card_number?: string | null;
	card_holder_name?: string | null;
	card_expiry_month?: string | null;
	card_expiry_year?: string | null;
	card_cvv?: string | null;
};

const ALLOWED_FIELDS = ['timezone'] as const;

export default class SettingsRepository {
	async findSettingsByUserId(userId: string) {
		const rows = await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId))
			.limit(1);
		return rows[0] ?? null;
	}

	async createSettings(userId: string, data: SettingsData) {
		const values: Record<string, unknown> = { userId };
		for (const field of ALLOWED_FIELDS) {
			if (data[field] !== undefined) {
				values[field] = data[field] ?? null;
			}
		}
		await db
			.insert(userSettings)
			.values(values as typeof userSettings.$inferInsert);
	}

	async updateSettings(id: number, data: SettingsData) {
		const updates: Partial<typeof userSettings.$inferInsert> = {};
		for (const field of ALLOWED_FIELDS) {
			if (data[field] !== undefined) {
				(updates as Record<string, unknown>)[field] = data[field] ?? null;
			}
		}
		if (Object.keys(updates).length === 0) return;
		await db.update(userSettings).set(updates).where(eq(userSettings.id, id));
	}
}
