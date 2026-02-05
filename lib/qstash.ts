import { executeServiceAction } from '@/domain';
import { Client } from '@upstash/qstash';

const qstash = new Client({
	token: process.env.QSTASH_TOKEN!,
});

export interface IBody {
	service: string;
	action: string;
	payload: unknown;
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

/**
 * Garante que exista um único schedule global no QStash que
 * chama ReportsService.runRecurringReports periodicamente.
 *
 * - É criado pela própria aplicação (via UI), não manualmente no painel.
 * - Idempotente: se já existir um schedule com mesmo destination+cron, não cria outro.
 */
export const ensureRecurringReportsSchedule = async () => {
	if (process.env.QUEUE_DRIVER !== 'qstash') return;
	if (!process.env.QSTASH_CALLBACK_URL) return;

	const destination = `${process.env.QSTASH_CALLBACK_URL}/api/webhooks/qstash`;
	const cron = '* * * * *'; // a cada minuto em UTC
	const body: IBody = {
		service: 'ReportsService',
		action: 'runRecurringReports',
		payload: {},
	};

	try {
		// Tolerante a mudanças na forma como o SDK retorna a lista
		const list: any = (await (qstash as any).schedules?.list?.()) ?? [];
		const schedules: any[] = Array.isArray(list?.schedules)
			? list.schedules
			: Array.isArray(list)
				? list
				: [];

		const existing = schedules.find(
			(s) => s?.destination === destination && s?.cron === cron,
		);
		if (existing) return;

		await (qstash as any).schedules?.create?.({
			destination,
			cron,
			body: JSON.stringify(body),
		});
	} catch {
		// Falha em criar o schedule global não deve quebrar o fluxo HTTP do usuário.
		// Idealmente, adicionar logging/observabilidade aqui.
	}
};

/**
 * Remove o schedule global de relatórios recorrentes no QStash, caso exista.
 *
 * Usado quando não há mais nenhum agendamento ativo no banco.
 */
export const deleteRecurringReportsSchedule = async () => {
	if (process.env.QUEUE_DRIVER !== 'qstash') return;
	if (!process.env.QSTASH_CALLBACK_URL) return;

	const destination = `${process.env.QSTASH_CALLBACK_URL}/api/webhooks/qstash`;
	const cron = '* * * * *'; // deve bater com o usado em ensureRecurringReportsSchedule

	try {
		const list: any = (await (qstash as any).schedules?.list?.()) ?? [];
		const schedules: any[] = Array.isArray(list?.schedules)
			? list.schedules
			: Array.isArray(list)
				? list
				: [];

		const existing = schedules.find(
			(s) => s?.destination === destination && s?.cron === cron,
		);
		if (!existing) return;

		// O SDK espera um scheduleId (string). Tentamos campos comuns de forma tolerante.
		const scheduleId: string | undefined =
			existing.scheduleId ?? existing.id ?? existing.schedule ?? existing.name;

		if (!scheduleId) return;

		await (qstash as any).schedules?.delete?.(scheduleId);
	} catch {
		// Falha em remover o schedule global não deve quebrar o fluxo HTTP do usuário.
		// Idealmente, adicionar logging/observabilidade aqui.
	}
};
