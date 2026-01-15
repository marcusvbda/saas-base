import { useSession } from '@/providers/session.provider';
import { Avatar, AvatarFallback } from './ui/avatar';

export default function UserAvatar() {
	const { session } = useSession();
	const userAvatarFallback = (
		session?.user?.name?.slice(0, 2) || 'US'
	).toUpperCase();

	return (
		<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
			<Avatar className="h-8 w-8 rounded-lg">
				{/* <AvatarImage
										src={session?.user?.image}
										alt={session?.user?.name}
									/> */}
				<AvatarFallback className="rounded-lg">
					{userAvatarFallback}
				</AvatarFallback>
			</Avatar>
			<div className="grid flex-1 text-left text-sm leading-tight">
				<span className="truncate font-medium">{session?.user?.name}</span>
				<span className="text-muted-foreground truncate text-xs">
					{session?.user?.email}
				</span>
			</div>
		</div>
	);
}
