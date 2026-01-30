import { NextResponse } from 'next/server';
import {
	isDomainError,
	ValidationError,
	AuthError,
	NotFoundError,
	ConflictError,
	BusinessRuleError,
	InfrastructureError,
} from '@/domain/errors';

export type HttpErrorResponse = {
	status: number;
	body: { error: { message: string } };
};

/**
 * Maps domain errors to HTTP status and safe client messages.
 * Never leaks internal details (e.g. stack or raw error.message).
 */
export function domainErrorToHttp(error: unknown): HttpErrorResponse {
	if (!isDomainError(error)) {
		return {
			status: 500,
			body: { error: { message: 'Something went wrong' } },
		};
	}
	if (error instanceof ValidationError) {
		return { status: 400, body: { error: { message: 'Invalid request' } } };
	}
	if (error instanceof AuthError) {
		return { status: 401, body: { error: { message: 'Unauthorized' } } };
	}
	if (error instanceof NotFoundError) {
		return { status: 404, body: { error: { message: 'Not found' } } };
	}
	if (error instanceof ConflictError) {
		return { status: 409, body: { error: { message: 'Conflict' } } };
	}
	if (error instanceof BusinessRuleError) {
		return { status: 400, body: { error: { message: error.message } } };
	}
	if (error instanceof InfrastructureError) {
		return {
			status: 503,
			body: { error: { message: 'Service temporarily unavailable' } },
		};
	}
	return { status: 500, body: { error: { message: 'Something went wrong' } } };
}

export function domainErrorToNextResponse(error: unknown): NextResponse {
	const { status, body } = domainErrorToHttp(error);
	return NextResponse.json(body, { status });
}
