'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useQueryState(
	key: string,
	validValues: string[],
	defaultValue: string,
) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const state = useMemo(() => {
		const queryValue = searchParams.get(key);
		return validValues.includes(queryValue || '') ? queryValue : defaultValue;
	}, [searchParams, key, validValues, defaultValue]);

	const setState = useCallback(
		(newValue: string | ((prev: string) => string)) => {
			const value =
				typeof newValue === 'function' ? newValue(state!) : newValue;

			if (!validValues.includes(value)) {
				console.warn(
					`Invalid value "${value}" for key "${key}". Valid values are: ${validValues.join(', ')}`,
				);
				return;
			}

			const params = new URLSearchParams(searchParams.toString());
			if (value === defaultValue) {
				params.delete(key);
			} else {
				params.set(key, value);
			}

			const queryString = params.toString();
			const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

			router.replace(newUrl, { scroll: false });
		},
		[key, validValues, defaultValue, state, searchParams, pathname, router],
	);

	return [state, setState] as const;
}
