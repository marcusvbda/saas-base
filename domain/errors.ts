/**
 * Domain error taxonomy. API Routes map these to HTTP status and safe messages.
 * @see .cursor/skills/error-taxonomy/SKILL.md
 */
export class ValidationError extends Error {
	readonly code = 'VALIDATION_ERROR';
	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}

export class AuthError extends Error {
	readonly code = 'AUTH_ERROR';
	constructor(message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

export class NotFoundError extends Error {
	readonly code = 'NOT_FOUND';
	constructor(message: string) {
		super(message);
		this.name = 'NotFoundError';
	}
}

export class ConflictError extends Error {
	readonly code = 'CONFLICT';
	constructor(message: string) {
		super(message);
		this.name = 'ConflictError';
	}
}

export class BusinessRuleError extends Error {
	readonly code = 'BUSINESS_RULE';
	constructor(message: string) {
		super(message);
		this.name = 'BusinessRuleError';
	}
}

export class InfrastructureError extends Error {
	readonly code = 'INFRASTRUCTURE';
	constructor(message: string) {
		super(message);
		this.name = 'InfrastructureError';
	}
}

export function isDomainError(
	error: unknown,
): error is
	| ValidationError
	| AuthError
	| NotFoundError
	| ConflictError
	| BusinessRuleError
	| InfrastructureError {
	return (
		error instanceof Error &&
		['ValidationError', 'AuthError', 'NotFoundError', 'ConflictError', 'BusinessRuleError', 'InfrastructureError'].includes(
			error.name,
		)
	);
}
