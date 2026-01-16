'use client';

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

	return (
		<AuthContext.Provider
			value={{
				session,
				setSession,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useSession = () => {
	return useContext(AuthContext);
};
