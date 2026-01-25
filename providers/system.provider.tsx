'use client';

import Loading from '@/components/loading';
import { createContext, useContext, useTransition } from 'react';

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
	const [isPending, startTransition] = useTransition();

	return (
		<SystemContext.Provider
			value={{ locale, dictionary, pathname, isPending, startTransition }}
		>
			{isPending && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/20 z-100 cursor-progress">
					<Loading />
				</div>
			)}
			{children}
		</SystemContext.Provider>
	);
};

export const useSystem = () => {
	return useContext(SystemContext);
};
