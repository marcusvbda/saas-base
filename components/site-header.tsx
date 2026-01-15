import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from './ui/breadcrumb';
import { LocaleLink } from './locale';
import IBreadCrumbItem from '@/types/theme';
import { Fragment } from 'react';

export function SiteHeader({
	breadcrumbItems,
}: {
	breadcrumbItems: IBreadCrumbItem[];
}) {
	return (
		<header
			className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
			suppressHydrationWarning
		>
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				{breadcrumbItems.length > 0 && (
					<Breadcrumb>
						<BreadcrumbList>
							{breadcrumbItems.map((item: IBreadCrumbItem, index: number) => (
								<Fragment key={`${item.title}-${index}`}>
									<BreadcrumbItem>
										{item.url ? (
											<BreadcrumbLink asChild>
												<LocaleLink href={item.url}>{item.title}</LocaleLink>
											</BreadcrumbLink>
										) : (
											<BreadcrumbPage>{item.title}</BreadcrumbPage>
										)}
									</BreadcrumbItem>
									{index < breadcrumbItems.length - 1 && (
										<BreadcrumbSeparator />
									)}
								</Fragment>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				)}
			</div>
		</header>
	);
}
