import { InfrastructureError } from '@/domain/errors';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are improving a daily work report written in Markdown. The report has sections by date (## date), then project names in bold, then branch names in bold, then bullet lists of commit titles.

Your task:
1. Improve organization and formatting if needed (keep the same structure: ## date, **project**, **branch**, - commits).
2. Fix grammar and typos in commit titles and any other text.
3. You may elaborate slightly on what was done in each commit ONLY using the real information from the commit title and branch name. Do NOT invent or add information that is not implied by the commit message or branch name. If there is not enough information to elaborate without inventing, only fix grammar.
4. Keep the same Markdown style: ## for dates, **bold** for project and branch names, - for list items. No emojis.
5. Output only the improved Markdown, no preamble or explanation.`;

export async function enhanceReportContent(content: string): Promise<string> {
	const apiKey = process.env.OPENAI_API_KEY!;
	if (!apiKey?.trim()) {
		throw new InfrastructureError(
			'OPENAI_API_KEY is not configured. Add it to .env to use Enhance with AI.',
		);
	}
	try {
		const openai = new OpenAI({ apiKey });
		const completion = await openai.chat.completions.create({
			model: process.env.OPENAI_MODEL!,
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content },
			],
		});
		const result = completion.choices[0]?.message?.content?.trim();
		if (!result) {
			throw new InfrastructureError(
				'AI returned an empty response. Try again.',
			);
		}
		return result;
	} catch (err) {
		if (err instanceof InfrastructureError) throw err;
		const message = err instanceof Error ? err.message : String(err);
		if (
			message.includes('API key') ||
			message.includes('invalid') ||
			message.includes('401')
		) {
			throw new InfrastructureError(
				'Invalid OpenAI API key. Check OPENAI_API_KEY in .env.',
			);
		}
		if (message.includes('rate') || message.includes('429')) {
			throw new InfrastructureError(
				'AI rate limit exceeded. Try again in a moment.',
			);
		}
		throw new InfrastructureError(
			'AI service temporarily unavailable. Try again later.',
		);
	}
}
