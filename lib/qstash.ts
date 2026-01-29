import { Client } from '@upstash/qstash';

const qstash = new Client({
	token: process.env.QSTASH_TOKEN!,
});

export const publishJson = async (url: string, body: any) => {
	await qstash.publishJSON({
		url: `${process.env.QSTASH_CALLBACK_URL}/${url}`,
		body,
	});
};

// DISPATCHER
// await publishJson('/api/test/b', { test: 'abc' });

//CALLBACK
// export const POST = verifySignatureAppRouter(async (req: Request) => {
// 	const body = await req.json();
// 	return NextResponse.json({ success: true, body });
// });
