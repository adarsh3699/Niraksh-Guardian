"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function NirakshAIError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[NirakshAI Error]", error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
			<div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
				<AlertTriangle className="size-7 text-destructive" />
			</div>
			<h2 className="font-heading text-lg font-bold text-foreground">Something went wrong</h2>
			<p className="max-w-sm text-sm text-muted">
				Niraksh AI encountered an error. Please try again.
			</p>
			<Button variant="primary" size="md" onClick={reset}>
				Try Again
			</Button>
		</div>
	);
}
