'use client';
import Pusher from 'pusher-js';
import { ReactNode, useEffect, useState } from 'react';

interface IProps {
	eventName: string;
	channelName: string;
	render: (data: any) => ReactNode;
	initialData?: any;
}

export default function SocketClient({
	eventName,
	channelName,
	render,
	initialData = null,
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
		});
		return () => {
			channel.unbind(eventName);
			pusher.unsubscribe(channelName);
		};
	}, [eventName, channelName]);

	return render(data);
}
