import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState<boolean>(() => {
		if (typeof window === 'undefined') return false;
		return window.innerWidth < MOBILE_BREAKPOINT;
	});

	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		
		// Set initial value
		setIsMobile(mql.matches);

		const onChange = (event: MediaQueryListEvent) => {
			setIsMobile(event.matches);
		};

		// Modern browsers
		if (mql.addEventListener) {
			mql.addEventListener('change', onChange);
			return () => mql.removeEventListener('change', onChange);
		} else {
			// Fallback for older browsers
			mql.addListener(onChange);
			return () => mql.removeListener(onChange);
		}
	}, []);

	return isMobile;
}
