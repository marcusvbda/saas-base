'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
	return null;
}

function setCookie(name: string, value: string, days = 365) {
	if (typeof document === 'undefined') return;
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getSystemTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
}

export function ThemeProvider({
	children,
	defaultTheme = 'system',
}: {
	children: React.ReactNode;
	defaultTheme?: Theme;
}) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === 'undefined') return defaultTheme;
		const cookieTheme = getCookie('theme') as Theme | null;
		return cookieTheme || defaultTheme;
	});

	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
		if (typeof window === 'undefined') return 'light';
		const cookieTheme = getCookie('theme') as Theme | null;
		if (cookieTheme === 'dark' || cookieTheme === 'light') {
			return cookieTheme;
		}
		return getSystemTheme();
	});

	useEffect(() => {
		const root = document.documentElement;
		const actualTheme =
			theme === 'system' ? getSystemTheme() : (theme as 'light' | 'dark');

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setResolvedTheme(actualTheme);

		if (actualTheme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}, [theme]);

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			if (theme === 'system') {
				const newTheme = mediaQuery.matches ? 'dark' : 'light';
				setResolvedTheme(newTheme);
				document.documentElement.classList.toggle('dark', newTheme === 'dark');
			}
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		setCookie('theme', newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
