import { SessionProvider } from "@/providers/session.provider"
import { requireAuth } from "@/lib/better-auth/server"
import { ReactNode } from "react"

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
    const session = await requireAuth()

    return <SessionProvider session={session}>{children}</SessionProvider>
}