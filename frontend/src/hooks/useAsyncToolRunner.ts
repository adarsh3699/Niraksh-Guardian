"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

export interface AsyncToolOptions {
	clearResultBeforeRun?: boolean;
}

export function useAsyncToolRunner<T>(setResult: Dispatch<SetStateAction<T | null>>) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const run = useCallback(
		async (
			operation: () => Promise<T>,
			defaultErrorMessage: string,
			options: AsyncToolOptions = {},
		): Promise<T | null> => {
			if (options.clearResultBeforeRun) {
				setResult(null);
			}

			setIsLoading(true);
			setError(null);

			try {
				const response = await operation();
				setResult(response);
				return response;
			} catch (err) {
				const message = err instanceof Error ? err.message : defaultErrorMessage;
				setError(message);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[setResult],
	);

	const resetError = useCallback(() => {
		setError(null);
	}, []);

	return {
		isLoading,
		error,
		run,
		resetError,
	};
}
