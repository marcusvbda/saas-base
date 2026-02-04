'use client';

import { getPusherClient } from '@/lib/pusher-client';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface IProps {
	eventName: string;
	channelName: string;
	render: (data: any) => ReactNode;
	initialData?: any;
	onChange?: ((data: any) => void) | null;
}

export default function SocketClient({
	eventName,
	channelName,
	render,
	initialData = null,
	onChange = null,
}: IProps) {
	const [data, setData] = useState<any>(initialData);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		setData(initialData);
	}, [initialData]);

	useEffect(() => {
		const pusher = getPusherClient();
		if (!pusher) return;

		const channel = pusher.subscribe(channelName);
		const handler = (payload: any) => {
			setData(payload);
			onChangeRef.current?.(payload);
		};
		channel.bind(eventName, handler);
		return () => {
			channel.unbind(eventName, handler);
			pusher.unsubscribe(channelName);
		};
	}, [eventName, channelName]);

	return render(data);
}
