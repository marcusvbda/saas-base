'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useQueryState(
	key: string,
	validValues: string[],
	defaultValue: string,
) {
	const searchParams = useSearchParams();
	const gotQuery = searchParams.get(key) || '';
	const initialSection = validValues.includes(gotQuery)
		? gotQuery
		: defaultValue;
	const [state, setState] = useState<string>(initialSection);

	useEffect(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.get(key) !== state) {
			url.searchParams.set(key, state);
			window.history.replaceState({}, '', url.toString());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);

	return [state, setState];
}
