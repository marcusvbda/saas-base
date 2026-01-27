import { betterAuth } from 'better-auth';
import { database } from '@/database/connection';
import { customSession } from 'better-auth/plugins';
import UserService from '@/domain/users/users.service';
import SettingsService from '@/domain/settings/settings.service';
import { DEFAULT_PLAN } from '@/constants/plans';

const baseURL =
	process.env.BETTER_AUTH_URL ||
	process.env.NEXT_PUBLIC_APP_URL ||
	'http://localhost:3000';

export const auth = betterAuth({
	plugins: [
		customSession(async ({ user, session }) => {
			const settingsService = new SettingsService();
			const userService = new UserService();
			const { effectivePlan, subscriptionDetail } =
				await userService.getSubscriptionForSession(user.id);
			const settings = await settingsService.getSettingsByUserId(user.id);

			return {
				user,
				settings,
				session,
				subscription: effectivePlan || DEFAULT_PLAN,
				subscriptionDetail: subscriptionDetail
					? {
							plan: subscriptionDetail.plan,
							status: subscriptionDetail.status,
							cancelAtPeriodEnd: subscriptionDetail.cancelAtPeriodEnd,
							currentPeriodEnd: subscriptionDetail.currentPeriodEnd?.toISOString() ?? null,
						}
					: null,
			};
		}),
	],
	session: {
		cookieCache: {
			enabled: false,
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
	},
	emailVerification: {
		enabled: true,
		sendOnSignUp: true,
		autoSignInAfterVerification: false,
		callbackURL: '/verify-email',
		sendVerificationEmail: async ({ user, url }) => {
			await new UserService().sendVerificationEmail(user.email, url);
		},
	},
	forgotPassword: {
		enabled: true,
		callbackURL: '/update-password',
		sendResetEmail: async ({ user, url }) => {
			const userService = new UserService();
			const emailExists = await userService.validateEmailExists(user.email);
			if (emailExists) {
				await userService.sendPasswordResetEmail(user.email, url);
			}
		},
	},
	socialProviders: {
		google:
			process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
				? {
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					}
				: undefined,
		apple:
			process.env.APPLE_CLIENT_ID &&
			process.env.APPLE_CLIENT_SECRET &&
			process.env.APPLE_TEAM_ID &&
			process.env.APPLE_KEY_ID &&
			process.env.APPLE_PRIVATE_KEY
				? {
						clientId: process.env.APPLE_CLIENT_ID,
						clientSecret: process.env.APPLE_CLIENT_SECRET,
						teamId: process.env.APPLE_TEAM_ID,
						keyId: process.env.APPLE_KEY_ID,
						privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
					}
				: undefined,
	},
	database,
	baseURL,
	basePath: '/api/auth',
});
