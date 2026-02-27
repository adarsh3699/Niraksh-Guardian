"use client";

import { useCallback, useEffect, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSessionState } from "@/hooks/useSessionState";
import { useDiseaseInfo } from "@/hooks/useHealthTools";
import { CHAT_LANGUAGES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
	BookOpen,
	Search,
	RotateCcw,
	Stethoscope,
	ArrowRight,
	AlertCircle,
	ShieldCheck,
	Pill,
	HeartPulse,
	ListChecks,
	Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ------------------------------------------------------------------ */
/*  Section card helper                                                */
/* ------------------------------------------------------------------ */

interface InfoSectionProps {
	icon: React.ElementType;
	iconColor: string;
	title: string;
	children: React.ReactNode;
}

function InfoSection({ icon: Icon, iconColor, title, children }: InfoSectionProps) {
	return (
		<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
			<div className="mb-3 flex items-center gap-2.5">
				<div className={cn("rounded-lg p-2", iconColor.replace("text-", "bg-") + "/10")}>
					<Icon className={cn("size-4", iconColor)} />
				</div>
				<h3 className="font-heading text-sm font-bold text-foreground sm:text-base">{title}</h3>
			</div>
			{children}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  DiseaseClient                                                      */
/* ------------------------------------------------------------------ */

export function DiseaseClient() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const urlTopic = searchParams.get("topic");
	const urlLanguage = searchParams.get("language");

	const [topic, setTopic] = useSessionState("ng:disease:topic", urlTopic ?? "");
	const [language, setLanguage] = useSessionState("ng:disease:language", urlLanguage ?? "en");
	const { result, isLoading, error, fetchInfo, reset } = useDiseaseInfo();

	// Auto-fetch if arriving with ?topic= and no cached result
	useEffect(() => {
		if (urlTopic && !result) {
			setTopic(urlTopic);
			if (urlLanguage) setLanguage(urlLanguage);
			fetchInfo(urlTopic, urlLanguage ?? "en");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSubmit = useCallback(
		async (e?: FormEvent) => {
			e?.preventDefault();
			if (!topic.trim()) return;
			await fetchInfo(topic, language);
		},
		[topic, language, fetchInfo],
	);

	const handleReset = useCallback(() => {
		reset();
		setTopic("");
		setLanguage("en");
	}, [reset, setTopic, setLanguage]);

	const handleFindDoctors = useCallback(() => {
		if (!result?.name) return;
		router.push(`/doctor-suggest?condition=${encodeURIComponent(result.name)}`);
	}, [result, router]);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<div className="mb-2 flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10">
						<BookOpen className="size-5 text-cyan-500" />
					</div>
					<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
						Disease Information
					</h1>
				</div>
				<p className="text-sm text-muted sm:text-base">
					Search for any disease or health condition to get AI-powered information about symptoms,
					causes, prevention, and treatment.
				</p>
			</div>

			<div className="space-y-6">
				{/* Search form */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Topic input */}
						<div>
							<label
								htmlFor="disease-topic"
								className="mb-1.5 block text-sm font-medium text-foreground"
							>
								Disease or Condition
							</label>
							<input
								id="disease-topic"
								type="text"
								value={topic}
								onChange={(e) => setTopic(e.target.value)}
								placeholder="E.g., Diabetes, Migraine, Asthma, COVID-19..."
								className={cn(
									"h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground",
									"placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
								)}
								disabled={isLoading}
								autoFocus
							/>
						</div>

						{/* Language selector */}
						<div>
							<label
								htmlFor="disease-language"
								className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"
							>
								<Globe className="size-3.5 text-muted" />
								Language
							</label>
							<select
								id="disease-language"
								value={language}
								onChange={(e) => setLanguage(e.target.value)}
								className={cn(
									"h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground",
									"focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
								)}
								disabled={isLoading}
							>
								{CHAT_LANGUAGES.map((lang) => (
									<option key={lang.code} value={lang.code}>
										{lang.label}
									</option>
								))}
							</select>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-3">
							<Button
								type="submit"
								variant="primary"
								size="md"
								disabled={!topic.trim() || isLoading}
								loading={isLoading}
							>
								<Search className="mr-1.5 size-4" />
								Get Info
							</Button>

							{(result || topic) && (
								<Button
									type="button"
									variant="ghost"
									size="md"
									onClick={handleReset}
									disabled={isLoading}
								>
									<RotateCcw className="mr-1.5 size-4" />
									Clear
								</Button>
							)}
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}
					</form>
				</div>

				{/* Loading */}
				{isLoading && (
					<div className="flex items-center justify-center rounded-xl border border-border bg-surface p-12 shadow-card">
						<div className="flex flex-col items-center gap-3">
							<Spinner size="lg" className="text-primary" />
							<p className="text-sm text-muted">Fetching disease information…</p>
						</div>
					</div>
				)}

				{/* Result */}
				{result && !isLoading && (
					<div className="space-y-4">
						{/* Disease name + description */}
						<div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-card sm:p-6">
							<h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
								{result.name}
							</h2>
							<div className="prose prose-sm mt-2 max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-p:text-muted-foreground">
								<ReactMarkdown remarkPlugins={[remarkGfm]}>{result.description}</ReactMarkdown>
							</div>
						</div>

						{/* Symptoms */}
						{result.symptoms.length > 0 && (
							<InfoSection icon={HeartPulse} iconColor="text-rose-500" title="Symptoms">
								<ul className="space-y-1.5">
									{result.symptoms.map((s, i) => (
										<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-500/60" />
											<span className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-foreground">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>{s}</ReactMarkdown>
											</span>
										</li>
									))}
								</ul>
							</InfoSection>
						)}

						{/* Causes */}
						{result.causes.length > 0 && (
							<InfoSection icon={AlertCircle} iconColor="text-amber-500" title="Causes">
								<ul className="space-y-1.5">
									{result.causes.map((c, i) => (
										<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500/60" />
											<span className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-foreground">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>{c}</ReactMarkdown>
											</span>
										</li>
									))}
								</ul>
							</InfoSection>
						)}

						{/* Prevention */}
						{result.prevention.length > 0 && (
							<InfoSection icon={ShieldCheck} iconColor="text-emerald-500" title="Prevention">
								<ul className="space-y-1.5">
									{result.prevention.map((p, i) => (
										<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500/60" />
											<span className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-foreground">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>{p}</ReactMarkdown>
											</span>
										</li>
									))}
								</ul>
							</InfoSection>
						)}

						{/* Treatment */}
						{result.treatment.length > 0 && (
							<InfoSection icon={Pill} iconColor="text-purple-500" title="Treatment Options">
								<ul className="space-y-1.5">
									{result.treatment.map((t, i) => (
										<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-purple-500/60" />
											<span className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-foreground">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>{t}</ReactMarkdown>
											</span>
										</li>
									))}
								</ul>
							</InfoSection>
						)}

						{/* When to See a Doctor */}
						{result.whenToSeeDoctor && (
							<InfoSection icon={ListChecks} iconColor="text-blue-500" title="When to See a Doctor">
								<div className="prose prose-sm max-w-none text-muted-foreground prose-p:my-0 prose-strong:text-foreground">
									<ReactMarkdown remarkPlugins={[remarkGfm]}>
										{result.whenToSeeDoctor}
									</ReactMarkdown>
								</div>
							</InfoSection>
						)}

						{/* Find Doctors CTA */}
						<div className="pt-2">
							<Button variant="outline" size="md" onClick={handleFindDoctors}>
								<Stethoscope className="mr-1.5 size-4" />
								Find Related Doctors
								<ArrowRight className="ml-1.5 size-4" />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
