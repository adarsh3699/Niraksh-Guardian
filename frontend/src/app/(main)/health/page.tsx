"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Clock3, Database, RefreshCw, ServerCrash, ShieldCheck } from "lucide-react";

type ServiceCheck = {
	status: string;
	latency?: number;
	error?: string;
};

type HealthResponse = {
	status: string;
	uptime: number;
	timestamp: string;
	checks: Record<string, ServiceCheck>;
	auth?: {
		startedAt: string;
		refresh: {
			attempted: number;
			succeeded: number;
			failed: number;
			failedByCode: Record<string, number>;
		};
	};
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const POLL_INTERVAL_MS = 15000;

const formatUptime = (seconds: number): string => {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
	if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
	return `${mins}m ${secs}s`;
};

export default function HealthPage() {
	const [data, setData] = useState<HealthResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const fetchHealth = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/health`, {
				cache: "no-store",
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(`Health check failed (${response.status})`);
			}

			const payload = (await response.json()) as HealthResponse;
			setData(payload);
			setError(null);
			setLastUpdated(new Date().toISOString());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to load health metrics");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchHealth();
		const intervalId = setInterval(() => {
			void fetchHealth();
		}, POLL_INTERVAL_MS);

		return () => clearInterval(intervalId);
	}, [fetchHealth]);

	const successRate = useMemo(() => {
		const refresh = data?.auth?.refresh;
		if (!refresh || refresh.attempted === 0) return 100;
		return Math.round((refresh.succeeded / refresh.attempted) * 100);
	}, [data]);

	const handleManualRefresh = useCallback(async () => {
		if (isRefreshing) return;
		setIsRefreshing(true);
		try {
			await fetchHealth();
		} finally {
			setIsRefreshing(false);
		}
	}, [fetchHealth, isRefreshing]);

	return (
		<section className="min-h-screen bg-background py-10 sm:py-14">
			<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mb-8 flex flex-wrap items-start justify-between gap-4">
					<div>
						<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
							<Activity className="size-3.5" />
							System Health
						</div>
						<h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
							Health & Auth Metrics
						</h1>
						<p className="mt-2 text-sm text-muted sm:text-base">
							Live status from backend checks and authentication refresh telemetry.
						</p>
					</div>
					<button
						onClick={() => void handleManualRefresh()}
						disabled={isRefreshing}
						aria-busy={isRefreshing}
						className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-light disabled:cursor-not-allowed disabled:opacity-70"
					>
						<RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
						{isRefreshing ? "Refreshing..." : "Refresh Now"}
					</button>
				</div>

				{loading && !data ? (
					<div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
						Loading health metrics...
					</div>
				) : null}

				{error ? (
					<div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						Error: {error}
					</div>
				) : null}

				{data ? (
					<>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="rounded-2xl border border-border bg-surface p-5">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted">Overall</p>
								<p className="mt-2 text-2xl font-bold text-foreground">{data.status}</p>
							</div>
							<div className="rounded-2xl border border-border bg-surface p-5">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted">Uptime</p>
								<p className="mt-2 text-2xl font-bold text-foreground">
									{formatUptime(data.uptime)}
								</p>
							</div>
							<div className="rounded-2xl border border-border bg-surface p-5">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted">
									Refresh Success
								</p>
								<p className="mt-2 text-2xl font-bold text-foreground">{successRate}%</p>
							</div>
							<div className="rounded-2xl border border-border bg-surface p-5">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted">
									Last Updated
								</p>
								<p className="mt-2 text-sm font-medium text-foreground">
									{lastUpdated ? new Date(lastUpdated).toLocaleString() : "-"}
								</p>
							</div>
						</div>

						<div className="mt-6 grid gap-6 lg:grid-cols-2">
							<div className="rounded-2xl border border-border bg-surface p-6">
								<div className="mb-4 flex items-center gap-2 text-foreground">
									<Database className="size-5 text-primary" />
									<h2 className="font-heading text-lg font-bold">Service Checks</h2>
								</div>
								<div className="space-y-3">
									{Object.entries(data.checks).map(([name, check]) => (
										<div key={name} className="rounded-xl border border-border bg-background p-4">
											<div className="flex items-center justify-between gap-3">
												<p className="font-semibold text-foreground capitalize">{name}</p>
												<span
													className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
														check.status === "healthy"
															? "bg-green-100 text-green-700"
															: "bg-red-100 text-red-700"
													}`}
												>
													{check.status}
												</span>
											</div>
											<div className="mt-2 flex items-center gap-2 text-sm text-muted">
												<Clock3 className="size-4" />
												Latency: {check.latency ?? "-"} ms
											</div>
											{check.error ? (
												<p className="mt-2 flex items-center gap-2 text-sm text-red-600">
													<ServerCrash className="size-4" />
													{check.error}
												</p>
											) : null}
										</div>
									))}
								</div>
							</div>

							<div className="rounded-2xl border border-border bg-surface p-6">
								<div className="mb-4 flex items-center gap-2 text-foreground">
									<ShieldCheck className="size-5 text-primary" />
									<h2 className="font-heading text-lg font-bold">Auth Refresh Metrics</h2>
								</div>

								{data.auth ? (
									<>
										<div className="grid grid-cols-3 gap-3">
											<div className="rounded-xl border border-border bg-background p-3 text-center">
												<p className="text-xs text-muted">Attempted</p>
												<p className="text-xl font-bold text-foreground">
													{data.auth.refresh.attempted}
												</p>
											</div>
											<div className="rounded-xl border border-border bg-background p-3 text-center">
												<p className="text-xs text-muted">Succeeded</p>
												<p className="text-xl font-bold text-green-700">
													{data.auth.refresh.succeeded}
												</p>
											</div>
											<div className="rounded-xl border border-border bg-background p-3 text-center">
												<p className="text-xs text-muted">Failed</p>
												<p className="text-xl font-bold text-red-700">{data.auth.refresh.failed}</p>
											</div>
										</div>

										<div className="mt-4 rounded-xl border border-border bg-background p-4">
											<p className="text-sm font-semibold text-foreground">Failures By Reason</p>
											<div className="mt-3 space-y-2 text-sm">
												{Object.entries(data.auth.refresh.failedByCode).map(([code, count]) => (
													<div key={code} className="flex items-center justify-between">
														<span className="text-muted">{code}</span>
														<span className="font-semibold text-foreground">{count}</span>
													</div>
												))}
											</div>
										</div>

										<p className="mt-4 text-xs text-muted">
											Metrics started at: {new Date(data.auth.startedAt).toLocaleString()}
										</p>
									</>
								) : (
									<p className="text-sm text-muted">No auth metrics available.</p>
								)}
							</div>
						</div>

						<p className="mt-6 text-xs text-muted">
							Backend timestamp: {new Date(data.timestamp).toLocaleString()} | Auto-refresh every{" "}
							{POLL_INTERVAL_MS / 1000}s
						</p>
					</>
				) : null}
			</div>
		</section>
	);
}
