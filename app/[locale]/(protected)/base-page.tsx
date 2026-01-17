import { SiteHeader } from '@/components/site-header';
import { IWithChildren } from '@/types/common';
import IBreadCrumbItem from '@/types/theme';
import { ReactNode } from 'react';

export default function BasePage({
	children,
	breadcrumbItems,
	title,
	description,
}: IWithChildren & {
	breadcrumbItems?: IBreadCrumbItem[] | undefined;
	title?: string;
	description?: string;
}): ReactNode {
	return (
		<>
			<SiteHeader
				breadcrumbItems={(breadcrumbItems || []) as IBreadCrumbItem[]}
			/>
			<div className="flex flex-1 flex-col bg-muted/40">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
						{(title || description) && (
							<div>
								{title && <h1 className="text-3xl font-bold">{title}</h1>}
								{description && (
									<p className="text-muted-foreground ">{description}</p>
								)}
							</div>
						)}
						{children}
					</div>
				</div>
			</div>
		</>
	);
}
