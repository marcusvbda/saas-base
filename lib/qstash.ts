import { executeServiceAction } from '@/domain';
import { Client } from '@upstash/qstash';

const qstash = new Client({
	token: process.env.QSTASH_TOKEN!,
});

export interface IBody {
	service: string;
	action: string;
	payload: any;
}

export const publishJson = async (body: IBody) => {
	if (process.env.QUEUE_DRIVER === 'qstash') {
		await qstash.publishJSON({
			url: `${process.env.QSTASH_CALLBACK_URL}/api/webhooks/qstash`,
			body,
		});
		return;
	}

	return await executeServiceAction(body.service, body.action, body.payload);
};
