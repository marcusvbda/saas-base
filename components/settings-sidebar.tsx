'use client';

import { IconSettings, IconShield, IconCreditCard } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { ISettingsSection } from '@/app/[locale]/(protected)/settings/page';
import { LockIcon } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface SettingsSidebarProps {
	activeSection: ISettingsSection;
	onSectionChange: (section: ISettingsSection) => void;
}

export default function SettingsSidebar({
	activeSection,
	onSectionChange,
}: SettingsSidebarProps) {
	const { t } = useLocale();
	const sections: Array<{
		id: ISettingsSection;
		label: string;
		icon: React.ComponentType<{ className?: string }>;
	}> = [
		{ id: 'account', label: t('Account'), icon: IconShield },
		{ id: 'general', label: t('General'), icon: IconSettings },
		{ id: 'plan', label: t('Plan'), icon: IconCreditCard },
		{ id: 'credentials', label: t('Credentials'), icon: LockIcon },
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
