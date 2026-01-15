import {
    createAuthClient
} from "better-auth/react";


export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL,

})

export const {
    signIn,
    signOut,
    signUp,
    useSession,
    verifyEmail,
} = authClient;

export const forgotPassword = (authClient as any).forgotPassword;
export const resetPassword = (authClient as any).resetPassword;