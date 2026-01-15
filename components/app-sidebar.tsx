'use client';

import * as React from 'react';
import {
	IconDashboard,
	IconInnerShadowTop,
	IconSettings,
} from '@tabler/icons-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/nav-user';
import { useLocale } from '@/hooks/use-locale';
import { LocaleLink } from './locale';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { t } = useLocale();

	const data = {
		navMain: {
			[t('Main items')]: [
				{
					title: 'Dashboard',
					url: '',
					icon: IconDashboard,
				},
				// {
				// 	title: 'Lifecycle',
				// 	url: '#',
				// 	icon: IconListDetails,
				// 	items: [
				// 		{
				// 			title: 'Active Proposals',
				// 			url: '#',
				// 		},
				// 		{
				// 			title: 'Archived',
				// 			url: '#',
				// 		},
				// 	],
				// },
				// {
				// 	title: 'Analytics',
				// 	url: '#',
				// 	icon: IconChartBar,
				// },
				// {
				// 	title: 'Projects',
				// 	url: '#',
				// 	icon: IconFolder,
				// },
				// {
				// 	title: 'Team',
				// 	url: '#',
				// 	icon: IconUsers,
				// },
			],
		},
		navSecondary: [
			{
				title: t('Settings'),
				url: '/settings',
				icon: IconSettings,
			},
			// {
			// 	title: 'Get Help',
			// 	url: '#',
			// 	icon: IconHelp,
			// },
			// {
			// 	title: 'Search',
			// 	url: '#',
			// 	icon: IconSearch,
			// },
		],
	};

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<LocaleLink href="">
								<IconInnerShadowTop className="!size-5" />
								<span className="text-base font-semibold">Acme Inc.</span>
							</LocaleLink>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{Object.keys(data.navMain).map((group: any, index: number) => (
					<NavMain key={index} items={data.navMain[group]} title={group} />
				))}
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
