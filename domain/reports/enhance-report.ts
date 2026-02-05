import { createChatCompletion, type AIConfig } from '@/lib/open-ai';

const DEFAULT_MODEL = 'gpt-4o-mini';
const MIN_CONTENT_LENGTH = 80;

const PLACEHOLDER_PHRASES = [
	'no activity',
	'no repository integration',
	'nenhuma atividade',
	'nenhuma integração',
	'add your repository',
	'adicione uma integração',
];

function isTrivialContent(content: string): boolean {
	const trimmed = content.trim();
	if (trimmed.length < MIN_CONTENT_LENGTH) return true;
	const lower = trimmed.toLowerCase();
	return PLACEHOLDER_PHRASES.some((p) => lower.includes(p));
}

export type EnhanceMode = 'light' | 'full';

function buildSystemPrompt(locale: string, mode: EnhanceMode): string {
	const langHint =
		locale && locale !== 'en'
			? ` Translate to ${locale} if text is in another language.`
			: '';

	if (mode === 'light') {
		return `Improve this daily work report (Markdown). Fix grammar and typos only. Keep structure (## date, **project**, **branch**, - items) and length. No emojis. Output only the markdown.${langHint}`;
	}
	return `Improve this daily work report (Markdown). Fix grammar/typos. Keep structure (## date, **project**, **branch**, - items). Elaborate briefly on commits only when implied by the message—do not invent. No emojis. Output only the markdown.${langHint}`;
}

export type EnhanceReportAIConfig = {
	baseURL: string;
	token: string;
	model?: string | null;
};

export async function enhanceReportContent(
	content: string,
	aiConfig?: EnhanceReportAIConfig,
	locale?: string,
	mode: EnhanceMode = 'full',
): Promise<string> {
	if (!content?.trim()) return content;
	if (isTrivialContent(content)) return content;

	const config: AIConfig | undefined = aiConfig
		? {
				apiKey: aiConfig.token,
				baseURL: aiConfig.baseURL.replace(/\/$/, ''),
				model: (aiConfig.model?.trim() || DEFAULT_MODEL).replace(
					/^["']|["']$/g,
					'',
				),
			}
		: undefined;

	const systemPrompt = buildSystemPrompt(locale ?? 'en', mode);

	return createChatCompletion(
		[
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content },
		],
		config,
	);
}
