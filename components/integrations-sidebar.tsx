'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { useLocale } from '@/hooks/use-locale';
import { GitBranchIcon, FileTextIcon, MessageSquareIcon } from 'lucide-react';
import type { ISettingsSection } from '@/app/[locale]/(protected)/integrations/page';

interface IntegrationsSidebarProps {
	activeSection: ISettingsSection;
	onSectionChange: (section: ISettingsSection) => void;
}

export default function IntegrationsSidebar({
	activeSection,
	onSectionChange,
}: IntegrationsSidebarProps) {
	const { t } = useLocale();
	const sections: Array<{
		id: ISettingsSection;
		label: string;
		icon: React.ComponentType<{ className?: string }>;
	}> = [
		{
			id: 'repository-provider',
			label: t('Repository Provider'),
			icon: GitBranchIcon,
		},
		{
			id: 'task-manager',
			label: t('Task Manager'),
			icon: FileTextIcon,
		},
		{
			id: 'communication-provider',
			label: t('Communication Provider'),
			icon: MessageSquareIcon,
		},
	];

	return (
		<Card className="w-full space-y-1">
			<CardContent>
				{sections.map((section) => {
					const Icon = section.icon;
					const isActive = activeSection === section.id;
					return (
						<button
							key={section.id}
							onClick={() => onSectionChange(section.id)}
							className={cn(
								'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
								isActive
									? 'bg-accent text-accent-foreground'
									: 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
							)}
						>
							<Icon className="h-4 w-4" />
							<span>{section.label}</span>
						</button>
					);
				})}
			</CardContent>
		</Card>
	);
}
