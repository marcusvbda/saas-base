'use client';

import { useLocale } from '@/hooks/use-locale';
import { useSearchParams } from 'next/navigation';
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
	Suspense,
} from 'react';
import { toast } from 'sonner';

export const AuthContext = createContext<any>({ session: null });

function SessionProviderContent({
	children,
	session: initSession,
}: {
	children: ReactNode;
	session: any;
}) {
	const [session, setSession] = useState<any>(initSession);
	const searchParams = useSearchParams();
	const { t } = useLocale();

	useEffect(() => {
		const message = searchParams.get('message');
		if (message) {
			try {
				const decodedMessage = JSON.parse(decodeURIComponent(message));
				if (decodedMessage.type && decodedMessage.message) {
					toast?.[decodedMessage.type](t(decodedMessage.message));
				}
			} catch (error) {
				console.error(error);
				toast.error(t('Error processing message'));
			} finally {
				const url = new URL(window.location.href);
				url.searchParams.delete('message');
				window.history.replaceState({}, '', url.toString());
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

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
}

export const SessionProvider = ({
	children,
	session: initSession,
}: {
	children: ReactNode;
	session: any;
}) => {
	return (
		<Suspense fallback={null}>
			<SessionProviderContent session={initSession}>
				{children}
			</SessionProviderContent>
		</Suspense>
	);
};

export const useSession = () => {
	return useContext(AuthContext);
};
