'use client';

import { createContext, useContext, useMemo } from 'react';

export const SystemContext = createContext<any>({
	locale: 'en',
	dictionary: {} as any,
	pathname: '',
});

export const SystemProvider = ({
	children,
	locale,
	dictionary,
	pathname,
}: any) => {
	const contextValue = useMemo(
		() => ({ locale, dictionary, pathname }),
		[locale, dictionary, pathname],
	);

	return (
		<SystemContext.Provider value={contextValue}>
			{children}
		</SystemContext.Provider>
	);
};

export const useSystem = () => {
	return useContext(SystemContext);
};
