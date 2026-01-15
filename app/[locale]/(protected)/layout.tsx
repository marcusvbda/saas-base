import { SessionProvider } from '@/providers/session.provider';
import { requireAuth } from '@/lib/better-auth/server';
import { ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function ProtectedLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await requireAuth();

	return (
		<SessionProvider session={session}>
			<SidebarProvider
				style={
					{
						'--sidebar-width': 'calc(var(--spacing) * 72)',
						'--header-height': 'calc(var(--spacing) * 12)',
					} as React.CSSProperties
				}
			>
				<AppSidebar variant="inset" />
				<SidebarInset>{children}</SidebarInset>
			</SidebarProvider>
		</SessionProvider>
	);
}
