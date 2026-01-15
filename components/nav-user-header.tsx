'use client';

import { IconLogout, IconSettings } from '@tabler/icons-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/hooks/use-locale';
import { useSession } from '@/providers/session.provider';
import { Button } from '@/components/ui/button';
import UserAvatar from './user-avatar';

export function NavUserHeader() {
	const { router, t } = useLocale();
	const { session } = useSession();
	const userAvatarFallback = (
		session?.user?.name?.slice(0, 2) || 'US'
	).toUpperCase();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-9 w-9 rounded-full">
					<Avatar className="h-9 w-9">
						{/* <AvatarImage src={session?.user?.image} alt={session?.user?.name} /> */}
						<AvatarFallback>{userAvatarFallback}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56 rounded-lg"
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<UserAvatar />
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => router.push('/settings')}>
					<IconSettings className="mr-2 h-4 w-4" />
					<span>{t('Settings')}</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => router.push('/sign-in')}>
					<IconLogout className="mr-2 h-4 w-4" />
					<span>{t('Log out')}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
