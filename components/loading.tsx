import { cn } from '@/lib/utils';
import { Spinner } from './ui/spinner';

export default function Loading({
	parentClassName,
	spinnerClassName,
}: {
	parentClassName?: string;
	spinnerClassName?: string;
}) {
	return (
		<div className={cn('flex items-center justify-center', parentClassName)}>
			<Spinner
				className={cn('size-10 opacity-20 self-center', spinnerClassName)}
			/>
		</div>
	);
}
