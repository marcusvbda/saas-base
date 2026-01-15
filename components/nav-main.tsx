'use client';

import { type Icon } from '@tabler/icons-react';

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LocaleLink } from './locale';

export function NavMain({
	items,
	title,
}: {
	title: string;
	items: {
		title: string;
		url: string;
		icon?: Icon;
	}[];
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{title}</SidebarGroupLabel>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton tooltip={item.title} asChild>
								<LocaleLink href={item.url}>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
								</LocaleLink>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
