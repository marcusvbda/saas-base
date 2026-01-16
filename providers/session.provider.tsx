'use client';

import { useQuery } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useState } from 'react';

export const AuthContext = createContext<any>({ session: null });

export const SessionProvider = ({
	children,
	session: initSession,
}: {
	children: ReactNode;
	session: any;
}) => {
	const [session, setSession] = useState<any>(initSession);
	const { data: userSettings, isPending: isLoadingUserSettings } = useQuery({
		queryKey: ['user-settings', session?.user.id],
		queryFn: () =>
			fetch(`/api/settings`)
				.then((res) => res.json())
				.then((data) => data.data),
		enabled: !!session?.user.id,
	});

	return (
		<AuthContext.Provider
			value={{
				session,
				setSession,
				userSettings: isLoadingUserSettings ? 'loading' : userSettings,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useSession = () => {
	return useContext(AuthContext);
};
