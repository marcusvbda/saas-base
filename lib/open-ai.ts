import { InfrastructureError } from '@/domain/errors';
import OpenAI from 'openai';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

export type ChatMessage =
	| { role: 'system'; content: string }
	| { role: 'user'; content: string }
	| { role: 'assistant'; content: string };

function getConfig(): {
	apiKey: string;
	baseURL: string;
	model: string;
} {
	const apiKey = process.env.AI_API_KEY?.trim();
	if (!apiKey) {
		throw new InfrastructureError(
			'AI_API_KEY is not configured. Add it to .env to use AI features.',
		);
	}
	const baseURL = process.env.AI_BASE_URL?.trim() || DEFAULT_BASE_URL;
	const rawModel = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
	const model = rawModel.replace(/^["']|["']$/g, '');
	return { apiKey, baseURL, model };
}

export type AIConfig = {
	apiKey: string;
	baseURL: string;
	model: string;
};

const COMPLETION_TIMEOUT_MS = 120_000;
const clientCache = new Map<string, OpenAI>();

function clientCacheKey(config: AIConfig): string {
	return `${config.baseURL}:${config.model}:${config.apiKey.slice(0, 8)}`;
}

function getClient(config: AIConfig): OpenAI {
	const key = clientCacheKey(config);
	let client = clientCache.get(key);
	if (!client) {
		const isOpenRouter = config.baseURL.includes('openrouter.ai');
		client = new OpenAI({
			apiKey: config.apiKey,
			baseURL: config.baseURL,
			...(isOpenRouter && {
				defaultHeaders: {
					'HTTP-Referer':
						process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
				},
			}),
		});
		clientCache.set(key, client);
	}
	return client;
}

async function createChatCompletionWithConfig(
	messages: ChatMessage[],
	config: AIConfig,
): Promise<string> {
	try {
		const client = getClient(config);
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			COMPLETION_TIMEOUT_MS,
		);
		const completion = await client.chat.completions.create(
			{
				model: config.model,
				messages: messages.map((m) => ({ role: m.role, content: m.content })),
			},
			{ signal: controller.signal },
		);
		clearTimeout(timeoutId);
		const result = completion.choices[0]?.message?.content?.trim();
		if (!result) {
			throw new InfrastructureError(
				'AI returned an empty response. Try again.',
			);
		}
		return result;
	} catch (err) {
		if (err instanceof InfrastructureError) throw err;
		if (err instanceof Error && err.name === 'AbortError') {
			throw new InfrastructureError(
				'AI request timed out. The report may be too long; try again or use a shorter report.',
			);
		}
		if (process.env.NODE_ENV !== 'production') {
			console.error('[open-ai]', err);
		}
		const message = err instanceof Error ? err.message : String(err);
		const messageLower = message.toLowerCase();
		if (
			messageLower.includes('api key') ||
			messageLower.includes('invalid') ||
			messageLower.includes('401')
		) {
			throw new InfrastructureError(
				'Invalid AI API key. Check your AI integration settings.',
			);
		}
		if (messageLower.includes('rate') || messageLower.includes('429')) {
			throw new InfrastructureError(
				'AI rate limit exceeded. Try again in a moment.',
			);
		}
		if (
			messageLower.includes('404') ||
			(messageLower.includes('model') && messageLower.includes('not found'))
		) {
			const hint =
				process.env.NODE_ENV !== 'production' && config.model
					? ` Value sent: ${config.model}`
					: '';
			throw new InfrastructureError(
				`The AI provider returned "model not found". Check the model in your AI integration.${hint}`,
			);
		}
		throw new InfrastructureError(
			'AI service temporarily unavailable. Try again later.',
		);
	}
}

/**
 * Creates a chat completion using OpenAI-compatible API (OpenAI, OpenRouter, etc.).
 * When config is provided (e.g. from user's AI integration), uses it; otherwise env vars.
 * Config: AI_API_KEY, AI_BASE_URL (optional), AI_MODEL (optional).
 */
export async function createChatCompletion(
	messages: ChatMessage[],
	config?: AIConfig,
): Promise<string> {
	const resolved = config ?? getConfig();
	return createChatCompletionWithConfig(messages, resolved);
}
