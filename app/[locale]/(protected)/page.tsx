'use client';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import data from './data.json';
import BasePage from './base-page';

export default function DashboardPage() {
	return (
		<BasePage
			breadcrumbItems={[
				{ title: 'Dashboard' },
				// { title: 'Settings', url: '/settings' },
			]}
		>
			<SectionCards />
			<ChartAreaInteractive />
			<DataTable data={data} />
		</BasePage>
	);
}
