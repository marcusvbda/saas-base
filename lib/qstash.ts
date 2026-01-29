import { Client } from '@upstash/qstash';

const qstash = new Client({
	token: process.env.QSTASH_TOKEN!,
});

export interface IBody {
	service: string;
	action: string;
	payload: any;
}

export const publishJson = async (url: string, body: IBody) => {
	await qstash.publishJSON({
		url: `${process.env.QSTASH_CALLBACK_URL}/${url}`,
		body,
	});
};

// DISPATCHER EXAMPLE
// await publishJson('/api/webhooks/qstash', {
// 	service: 'IntegrationsService',
// 	action: 'validateTokenStatus',
// 	payload: { id: '123', token: '1234567890' },
// });
