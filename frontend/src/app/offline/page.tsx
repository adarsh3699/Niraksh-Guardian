import Link from "next/link";

export default function OfflinePage() {
	return (
		<main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
			<h1 className="text-3xl font-bold text-slate-900">You are offline</h1>
			<p className="mt-4 text-slate-600">
				Internet connection is unavailable right now. Please reconnect and try again.
			</p>
			<Link
				href="/"
				className="mt-8 inline-flex items-center rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
			>
				Go back home
			</Link>
		</main>
	);
}
