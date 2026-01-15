import { betterAuth } from "better-auth"
import { database } from "@/lib/db/connection"
import UserService from "@/domain/user/user.service";

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        enabled: true,
        sendOnSignUp: true,
        autoSignInAfterVerification: false,
        callbackURL: "/verify-email",
        sendVerificationEmail: async ({ user, url }) => {
           await (new UserService()).sendVerificationEmail(user.email, url);
        },
    },
    forgotPassword: {
        enabled: true,
        callbackURL: "/update-password",
        sendResetEmail: async ({ user, url }) => {
            const userService = new UserService();
            const emailExists = await userService.validateEmailExists(user.email);
            if (emailExists) {
                await userService.sendPasswordResetEmail(user.email, url);
            }
        },
    },
    database,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    basePath: "/api/auth",
})