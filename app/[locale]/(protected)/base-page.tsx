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
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
						{children}
					</div>
				</div>
			</div>
		</>
	);
}
