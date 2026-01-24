export default async function SSEServer(
	callback: any,
	eventName: string,
	timeInterval: number = 1000,
): Promise<Response> {
	const encoder = new TextEncoder();
	let interval: NodeJS.Timeout;
	const stream = new ReadableStream({
		async start(controller) {
			const handleEmit = async () => {
				const data = await callback();
				controller.enqueue(
					encoder.encode(
						`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`,
					),
				);
			};
			handleEmit();

			interval = setInterval(() => {
				try {
					handleEmit();
				} catch {
					clearInterval(interval);
				}
			}, timeInterval);
		},
		cancel() {
			clearInterval(interval);
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
}
