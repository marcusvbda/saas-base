import { SiteHeader } from '@/components/site-header';
import { IWithChildren } from '@/types/common';
import IBreadCrumbItem from '@/types/theme';
import { ReactNode } from 'react';

export default function BasePage({
	children,
	breadcrumbItems,
}: IWithChildren & {
	breadcrumbItems?: IBreadCrumbItem[] | undefined;
}): ReactNode {
	return (
		<>
			<SiteHeader
				breadcrumbItems={(breadcrumbItems || []) as IBreadCrumbItem[]}
			/>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					{children}
				</div>
			</div>
		</>
	);
}
