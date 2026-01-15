import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { IWithChildren } from '@/types/common';
import { ComponentProps } from 'react';

export function ButtonLoading({
	children,
	isLoading,
	...props
}: IWithChildren & { isLoading: boolean } & ComponentProps<typeof Button>) {
	return (
		<Button {...props} disabled={isLoading}>
			{isLoading ? <Spinner /> : null}
			{children}
		</Button>
	);
}
