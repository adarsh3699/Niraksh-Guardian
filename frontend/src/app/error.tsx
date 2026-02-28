"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Unhandled error:", error);
	}, [error]);

	return (
		<main className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
			<div className="mb-8 flex flex-col items-center gap-6">
				<div className="relative flex size-24 items-center justify-center rounded-3xl bg-destructive/10 sm:size-32">
					<div className="absolute inset-x-0 -bottom-4 mx-auto h-4 w-2/3 rounded-full bg-destructive/20 blur-xl" />
					<AlertCircle className="size-12 text-destructive sm:size-16" />
				</div>

				<div className="max-w-md">
					<h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Something went wrong
					</h1>
					<p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
						We encountered an unexpected error while processing your request. Please try again or
						return to the homepage.
					</p>

					{/* Display error digest if in development (helps with debugging) */}
					{process.env.NODE_ENV === "development" && (
						<div className="mt-6 rounded-lg bg-surface p-4 border border-destructive/20 text-left overflow-hidden">
							<p className="text-xs font-mono text-destructive break-all">
								{error.message || "Unknown error occurred"}
							</p>
						</div>
					)}
				</div>
			</div>

			<div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:gap-4">
				<button
					onClick={() => reset()}
					className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
				>
					<RotateCcw className="size-5" />
					Try Again
				</button>
				<Link
					href="/"
					className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface px-5 py-3 font-semibold text-primary ring-1 ring-inset ring-primary/20 transition-all hover:bg-primary/5 active:scale-95"
				>
					<Home className="size-5" />
					Go Home
				</Link>
			</div>
		</main>
	);
}
