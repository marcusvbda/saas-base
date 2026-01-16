import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server";

export async function getSession() {
    const headersList = await headers()
    const session = await auth.api.getSession({
        headers: headersList as any,
    })

    return session
}

export async function requireAuth() {
    const session = await getSession()

    if (!session?.user) {
        const headersList = await headers();
        const redirectPath = headersList.get("x-pathname") || "/";
        return redirect(`/sign-in?redirect=${encodeURIComponent(redirectPath)}`);
    }

    return session
}

export async function requireServerAuth(callback: any): Promise<any> {
    const session = await getSession();

    if (!session?.user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
    return callback?.({ session });
}
