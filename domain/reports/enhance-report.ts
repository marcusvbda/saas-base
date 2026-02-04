import { createChatCompletion, type AIConfig } from '@/lib/open-ai';

const DEFAULT_MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are improving a daily work report written in Markdown. The report has sections by date (## date), then project names in bold, then branch names in bold, then bullet lists of commit titles.

Your task:
1. Improve organization and formatting if needed (keep the same structure: ## date, **project**, **branch**, - commits).
2. Fix grammar and typos in commit titles and any other text.
3. You may elaborate slightly on what was done in each commit ONLY using the real information from the commit title and branch name. Do NOT invent or add information that is not implied by the commit message or branch name. If there is not enough information to elaborate without inventing, only fix grammar.
4. Keep the same Markdown style: ## for dates, **bold** for project and branch names, - for list items. No emojis.
5. Output only the improved Markdown, no preamble or explanation.
6. If the text is not in English, translate it to English first.
7. You dont need to translate regular coding exprensions like "fix bug", "add feature", "refactor", "merge", "branch", "bug" and others  etc.
8. First letter must be capitalized.
`;

export type EnhanceReportAIConfig = {
	baseURL: string;
	token: string;
	model?: string | null;
};

export async function enhanceReportContent(
	content: string,
	aiConfig?: EnhanceReportAIConfig,
	locale?: string,
): Promise<string> {
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

	const systemPrompt = `
	    TRANSLATE THE FOLLOWING TEXT TO ${locale}:
	    ${SYSTEM_PROMPT}
	    OUTPUT ONLY THE TRANSLATED TEXT, NO PREAMBLE OR EXPLANATION.
	`;
	return createChatCompletion(
		[
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content },
		],
		config,
	);
}
