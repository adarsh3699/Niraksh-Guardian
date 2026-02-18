"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Unhandled error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
			<div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
				<span className="text-3xl">⚠️</span>
			</div>
			<div>
				<h2 className="font-heading text-xl font-bold text-foreground">Something went wrong</h2>
				<p className="mt-2 max-w-md text-sm text-muted">
					An unexpected error occurred. Please try again.
				</p>
			</div>
			<Button onClick={reset} variant="primary" size="md">
				Try Again
			</Button>
		</div>
	);
}
