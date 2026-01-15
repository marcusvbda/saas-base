'use client';

import { createContext, useContext } from 'react';

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
	return (
		<SystemContext.Provider value={{ locale, dictionary, pathname }}>
			{children}
		</SystemContext.Provider>
	);
};

export const useSystem = () => {
	return useContext(SystemContext);
};
