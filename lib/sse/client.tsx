'use client';
import { ReactNode, useEffect, useState } from 'react';

interface IProps {
	eventName: string;
	route: string;
	render: (data: any) => ReactNode;
	initialData?: any;
}

export default function SSEClient({
	eventName,
	route,
	render,
	initialData = null,
}: IProps) {
	const [data, setData] = useState<any>(initialData);

	useEffect(() => {
		const eventSource = new EventSource(route);

		eventSource.addEventListener(eventName, (event) => {
			const parsedData = JSON.parse(event.data);
			setData(parsedData);
		});

		return () => eventSource.close();
	}, [eventName, route]);

	return render(data);
}
