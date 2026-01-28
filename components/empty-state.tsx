import { ReactNode } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card';
import { Button } from './ui/button';

type EmptyStateProps = {
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	actionIcon?: ReactNode;
};

export function EmptyState({
	title,
	description,
	actionLabel,
	onAction,
	actionIcon,
}: EmptyStateProps) {
	return (
		<Card className="border-dashed">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			{actionLabel && onAction && (
				<CardContent>
					<Button variant="outline" onClick={onAction}>
						{actionIcon}
						{actionIcon && <span className="mr-2" />}
						{actionLabel}
					</Button>
				</CardContent>
			)}
		</Card>
	);
}

