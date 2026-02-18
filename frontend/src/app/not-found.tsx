import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
			<div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
				<span className="text-4xl font-bold text-primary">404</span>
			</div>
			<div>
				<h2 className="font-heading text-xl font-bold text-foreground">Page Not Found</h2>
				<p className="mt-2 max-w-md text-sm text-muted">
					The page you&apos;re looking for doesn&apos;t exist or has been moved.
				</p>
			</div>
			<Link
				href="/"
				className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
			>
				Go Home
			</Link>
		</div>
	);
}
