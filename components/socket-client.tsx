'use client';
import Pusher from 'pusher-js';
import { ReactNode, useEffect, useState } from 'react';

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

	useEffect(() => {
		setData(initialData);
	}, [initialData]);

	useEffect(() => {
		const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
			cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
		});

		const channel = pusher.subscribe(channelName);
		channel.bind(eventName, (payload: any) => {
			setData(payload);
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			onChange && onChange(payload);
		});
		return () => {
			channel.unbind(eventName);
			pusher.unsubscribe(channelName);
		};
	}, [eventName, channelName, onChange]);

	return render(data);
}
