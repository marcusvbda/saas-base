"use client"
import { useSession } from "@/providers/session.provider"
import { signOut } from "@/lib/better-auth/auth-client"
import { useTransition } from "react"
import { useLocale } from "@/hooks/locale"

export default function DashboardPage() {
    const { session } = useSession()
    const [isPending, startTransition] = useTransition()

    const { router } = useLocale()

    const handleLogout = () => {
        startTransition(async () => {
            await signOut()
            router.push("/sign-in")
        })
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <div className="mx-auto max-w-4xl px-4 py-16">
                <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
                                Dashboard
                            </h1>
                            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                                Bem-vindo, {session.user.email}!
                            </p>
                        </div>
                        <button
                            disabled={isPending}
                            onClick={handleLogout}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isPending ? "Saindo..." : "Sair"}
                        </button>
                    </div>

                    <div className="rounded-md bg-zinc-50 p-6 dark:bg-zinc-800">
                        <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
                            Informações da Sessão
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-600 dark:text-zinc-400">Email:</span>
                                <span className="font-medium text-black dark:text-zinc-50">
                                    {session.user.email}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600 dark:text-zinc-400">ID:</span>
                                <span className="font-medium text-black dark:text-zinc-50">
                                    {session.user.id}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Esta é uma página protegida. Apenas usuários autenticados podem acessá-la.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
