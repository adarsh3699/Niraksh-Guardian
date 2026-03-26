"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
	return (
		<main className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
			<div className="mb-8 flex flex-col items-center gap-6">
				{/* Branded Illustration Area */}
				<div className="relative flex size-32 items-center justify-center rounded-3xl bg-primary/10 sm:size-40">
					<div className="absolute inset-x-0 -bottom-4 mx-auto h-4 w-2/3 rounded-full bg-primary/20 blur-xl" />
					<span className="font-heading text-6xl font-black text-primary sm:text-7xl">404</span>
				</div>

				<div className="max-w-md">
					<h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Page Not Found
					</h1>
					<p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
						We couldn&apos;t find the page you were looking for. The link might be broken, or the
						page may have been removed or renamed.
					</p>
				</div>
			</div>

			<div className="mb-12 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:gap-4">
				<Link
					href="/"
					className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
				>
					<Home className="size-5" />
					Go Home
				</Link>
				<button
					onClick={() => window.history.back()}
					className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface px-5 py-3 font-semibold text-primary ring-1 ring-inset ring-primary/20 transition-all hover:bg-primary/5 active:scale-95"
				>
					<ArrowLeft className="size-5" />
					Go Back
				</button>
			</div>

			{/* Search Suggestion */}
			<div className="w-full max-w-md rounded-2xl bg-surface p-6 ring-1 ring-border shadow-sm">
				<h3 className="mb-4 font-heading text-sm font-semibold text-muted uppercase tracking-wider">
					Looking for something specific?
				</h3>
				<ul className="flex flex-col gap-3 text-left">
					<li>
						<Link
							href="/symptom-analysis"
							className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-primary/5"
						>
							<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
								<Search className="size-4" />
							</div>
							<span className="font-medium text-foreground group-hover:text-primary transition-colors">
								Find a doctor
							</span>
						</Link>
					</li>
					<li>
						<Link
							href="/niraksh-ai"
							className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-primary/5"
						>
							<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
								<Search className="size-4" />
							</div>
							<span className="font-medium text-foreground group-hover:text-primary transition-colors">
								Chat with AI Assistant
							</span>
						</Link>
					</li>
				</ul>
			</div>
		</main>
	);
}
