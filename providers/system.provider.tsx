'use client';

import Loading from '@/components/loading';
import { createContext, useContext, useTransition, useMemo } from 'react';

export const SystemContext = createContext<any>({
	locale: 'en',
	dictionary: {} as any,
	pathname: '',
	isPending: false,
	startTransition: () => {},
});

export const SystemProvider = ({
	children,
	locale,
	dictionary,
	pathname,
}: any) => {
	const [isPending, startTransition] = useTransition();

	const contextValue = useMemo(
		() => ({ locale, dictionary, pathname, isPending, startTransition }),
		[locale, dictionary, pathname, isPending, startTransition],
	);

	return (
		<SystemContext.Provider value={contextValue}>
			{isPending && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
					<div className="pointer-events-auto">
						<Loading />
					</div>
				</div>
			)}
			{children}
		</SystemContext.Provider>
	);
};

export const useSystem = () => {
	return useContext(SystemContext);
};
