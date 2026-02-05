'use client';

import { getPusherClient } from '@/lib/pusher-client';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface IProps {
	eventName: string;
	channelName: string;
	render: (data: any) => ReactNode;
	initialData?: any;
	onChange?: ((data: any) => void) | null;
	/** Called when channel subscription is ready (e.g. to refetch and avoid missing events) */
	onSubscribed?: (() => void) | null;
}

export default function SocketClient({
	eventName,
	channelName,
	render,
	initialData = null,
	onChange = null,
	onSubscribed,
}: IProps) {
	const [data, setData] = useState<any>(initialData);
	const onChangeRef = useRef(onChange);
	const onSubscribedRef = useRef(onSubscribed);
	useEffect(() => {
		onChangeRef.current = onChange;
		onSubscribedRef.current = onSubscribed;
	}, [onChange, onSubscribed]);

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
		const onSubSucceeded = () => {
			onSubscribedRef.current?.();
		};
		channel.bind(eventName, handler);
		channel.bind('pusher:subscription_succeeded', onSubSucceeded);
		return () => {
			channel.unbind(eventName, handler);
			channel.unbind('pusher:subscription_succeeded', onSubSucceeded);
			pusher.unsubscribe(channelName);
		};
	}, [eventName, channelName]);

	return render(data);
}
