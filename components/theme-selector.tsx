'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from '@/providers/theme.provider';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeSelector() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);

	const toggleTheme = () => {
		if (resolvedTheme === 'dark') {
			setTheme('light');
		} else {
			setTheme('dark');
		}
	};

	if (!mounted) {
		return (
			<Button variant="ghost" size="icon" className="h-9 w-9">
				<IconMoon className="h-4 w-4" />
			</Button>
		);
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-9 w-9"
			onClick={toggleTheme}
		>
			{resolvedTheme === 'dark' ? (
				<IconSun className="h-4 w-4" />
			) : (
				<IconMoon className="h-4 w-4" />
			)}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
