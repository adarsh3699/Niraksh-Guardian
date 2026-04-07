type RefreshFailureCode =
	| "missing_token"
	| "invalid_request"
	| "invalid_jwt"
	| "invalid_payload"
	| "token_not_found"
	| "rotation_conflict"
	| "unexpected_error";

type AuthMetrics = {
	startedAt: string;
	refresh: {
		attempted: number;
		succeeded: number;
		failed: number;
		failedByCode: Record<RefreshFailureCode, number>;
	};
};

const metrics: AuthMetrics = {
	startedAt: new Date().toISOString(),
	refresh: {
		attempted: 0,
		succeeded: 0,
		failed: 0,
		failedByCode: {
			missing_token: 0,
			invalid_request: 0,
			invalid_jwt: 0,
			invalid_payload: 0,
			token_not_found: 0,
			rotation_conflict: 0,
			unexpected_error: 0,
		},
	},
};

export const recordRefreshAttempt = () => {
	metrics.refresh.attempted += 1;
};

export const recordRefreshSuccess = () => {
	metrics.refresh.succeeded += 1;
};

export const recordRefreshFailure = (code: RefreshFailureCode) => {
	metrics.refresh.failed += 1;
	metrics.refresh.failedByCode[code] += 1;
};

export const getAuthMetricsSnapshot = () => {
	return {
		startedAt: metrics.startedAt,
		refresh: {
			attempted: metrics.refresh.attempted,
			succeeded: metrics.refresh.succeeded,
			failed: metrics.refresh.failed,
			failedByCode: { ...metrics.refresh.failedByCode },
		},
	};
};
