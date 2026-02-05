import {
	pgTable,
	varchar,
	text,
	boolean,
	timestamp,
	serial,
	jsonb,
	date,
	unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
	id: varchar('id', { length: 36 }).primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	emailVerified: boolean('emailVerified').notNull(),
	image: text('image'),
	createdAt: timestamp('createdAt', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updatedAt', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const session = pgTable('session', {
	id: varchar('id', { length: 36 }).primaryKey(),
	expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
	token: varchar('token', { length: 255 }).notNull().unique(),
	createdAt: timestamp('createdAt', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: varchar('userId', { length: 36 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
	id: varchar('id', { length: 36 }).primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: varchar('userId', { length: 36 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: timestamp('accessTokenExpiresAt', {
		withTimezone: true,
	}),
	refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', {
		withTimezone: true,
	}),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('createdAt', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updatedAt', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const verification = pgTable('verification', {
	id: varchar('id', { length: 36 }).primaryKey(),
	identifier: varchar('identifier', { length: 255 }).notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
	createdAt: timestamp('createdAt', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updatedAt', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const userSettings = pgTable('user_settings', {
	id: serial('id').primaryKey(),
	userId: varchar('user_id', { length: 36 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	timezone: varchar('timezone', { length: 255 }),
});

export const checkoutSessions = pgTable('checkout_sessions', {
	id: serial('id').primaryKey(),
	sessionId: varchar('session_id', { length: 255 }).notNull(),
	resourceId: varchar('resource_id', { length: 255 }).notNull(),
	status: varchar('status', { length: 255 }).notNull().default('pending'),
	resourceType: varchar('resource_type', { length: 255 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
	id: serial('id').primaryKey(),
	userId: varchar('user_id', { length: 36 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subscriptionId: varchar('subscription_id', { length: 255 }).notNull(),
	plan: varchar('plan', { length: 255 }).notNull(),
	stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
	status: varchar('status', { length: 64 }).notNull().default('active'),
	currentPeriodStart: timestamp('current_period_start', {
		withTimezone: true,
	}),
	currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
	cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
	id: serial('id').primaryKey(),
	eventId: varchar('event_id', { length: 255 }).notNull().unique(),
	eventType: varchar('event_type', { length: 128 }).notNull(),
	processedAt: timestamp('processed_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const repositoryIntegrations = pgTable('repository_integrations', {
	id: serial('id').primaryKey(),
	userId: varchar('user_id', { length: 36 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	provider: varchar('provider', { length: 50 }).notNull(),
	type: varchar('type', { length: 50 }).notNull().default('repository'),
	token: text('token').notNull(),
	status: varchar('status', { length: 50 }).notNull().default('pending'),
	projects: jsonb('projects'),
	ignoredBranches: jsonb('ignored_branches'),
	baseUrl: varchar('base_url', { length: 500 }),
	model: varchar('model', { length: 100 }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const dailyReports = pgTable(
	'daily_reports',
	{
		id: serial('id').primaryKey(),
		userId: varchar('user_id', { length: 36 })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		reportDate: date('report_date').notNull(),
		fromDate: date('from_date'),
		content: text('content').notNull(),
		status: varchar('status', { length: 20 }).notNull().default('ready'),
		enhancedAt: timestamp('enhanced_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => ({
		userReportFromUnique: unique().on(t.userId, t.reportDate, t.fromDate),
	}),
);

export const userBilling = pgTable('user_billing', {
	id: serial('id').primaryKey(),
	userId: varchar('user_id', { length: 36 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	cardNumber: varchar('card_number', { length: 255 }),
	cardHolderName: varchar('card_holder_name', { length: 255 }),
	cardExpiryMonth: varchar('card_expiry_month', { length: 255 }),
	cardExpiryYear: varchar('card_expiry_year', { length: 255 }),
	cardCvv: varchar('card_cvv', { length: 255 }),
});

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user),
}));
