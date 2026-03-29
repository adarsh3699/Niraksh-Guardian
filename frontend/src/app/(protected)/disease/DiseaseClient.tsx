"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
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
	AlertCircle,
	ShieldCheck,
	Pill,
	HeartPulse,
	ListChecks,
	Globe,
	Activity,
	TriangleAlert,
	ChevronsRight,
	FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ResearchPanel } from "@/components/health-tools/ResearchPanel";

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
		<div className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card sm:p-5">
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

const QUICK_DISEASES = [
	"COVID-19",
	"Dengue",
	"Influenza",
	"Malaria",
	"Chikungunya",
	"Tuberculosis",
];

const RESULT_TABS = [
	{ id: "symptoms", label: "Symptoms", icon: HeartPulse },
	{ id: "causes", label: "Causes", icon: AlertCircle },
	{ id: "prevention", label: "Prevention", icon: ShieldCheck },
	{ id: "treatment", label: "Treatment", icon: Pill },
	{ id: "doctor", label: "Doctor Guidance", icon: ListChecks },
] as const;

type ResultTabId = (typeof RESULT_TABS)[number]["id"];

/* ------------------------------------------------------------------ */
/*  DiseaseClient                                                      */
/* ------------------------------------------------------------------ */

export function DiseaseClient() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const urlTopic = searchParams.get("topic");
	const urlLanguage = searchParams.get("language");
	const [activeTab, setActiveTab] = useState<ResultTabId>("symptoms");
	const [isResearchOpen, setIsResearchOpen] = useState(false);

	const [topic, setTopic] = useSessionState("ng:disease:topic", urlTopic ?? "");
	const [language, setLanguage] = useSessionState("ng:disease:language", urlLanguage ?? "en");
	const { result, isLoading, error, fetchInfo, reset } = useDiseaseInfo();

	const metricCards = useMemo(() => {
		if (!result) return [];

		return [
			{ label: "Symptoms", value: result.symptoms.length.toString(), note: "Reported indicators" },
			{ label: "Key causes", value: result.causes.length.toString(), note: "Primary contributors" },
			{
				label: "Care steps",
				value: result.prevention.length.toString(),
				note: "Prevention guidance",
			},
		];
	}, [result]);

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
			setActiveTab("symptoms");
			await fetchInfo(topic, language);
		},
		[topic, language, fetchInfo],
	);

	const handleReset = useCallback(() => {
		reset();
		setTopic("");
		setLanguage("en");
		setActiveTab("symptoms");
	}, [reset, setTopic, setLanguage]);

	const handleFindDoctors = useCallback(() => {
		if (!result?.name) return;
		router.push(`/symptom-analysis?condition=${encodeURIComponent(result.name)}`);
	}, [result, router]);

	const applyQuickSearch = useCallback(
		(value: string) => {
			setTopic(value);
			void fetchInfo(value, language);
		},
		[fetchInfo, language, setTopic],
	);

	useEffect(() => {
		setIsResearchOpen(false);
	}, [result?.name]);

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<div className="mb-2 flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/12">
						<BookOpen className="size-5 text-primary" />
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
				<div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-[1fr_180px]">
							{/* Topic input */}
							<div>
								<label
									htmlFor="disease-topic"
									className="mb-1.5 block text-sm font-medium text-foreground"
								>
									Disease or Condition
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
									<input
										id="disease-topic"
										type="text"
										value={topic}
										onChange={(e) => setTopic(e.target.value)}
										placeholder="E.g., Diabetes, Migraine, Asthma, COVID-19..."
										className={cn(
											"h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground",
											"placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
										)}
										disabled={isLoading}
										autoFocus
									/>
								</div>
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
						</div>

						{/* Actions */}
						<div className="flex flex-wrap items-center gap-3">
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

						<div className="flex flex-wrap items-center gap-2 pt-1">
							<span className="text-xs text-muted">Trending viral diseases:</span>
							{QUICK_DISEASES.map((disease) => (
								<button
									key={disease}
									type="button"
									onClick={() => applyQuickSearch(disease)}
									disabled={isLoading}
									className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted transition hover:border-primary/40 hover:bg-primary/8 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
								>
									{disease}
								</button>
							))}
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}
					</form>
				</div>

				{/* Loading */}
				{isLoading && (
					<div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12 shadow-card">
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
						<div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
							<div className="h-1 bg-gradient-to-r from-primary via-primary-light to-accent" />
							<div className="p-5 sm:p-6">
								<div className="mb-3 flex flex-wrap items-start justify-between gap-3">
									<h2 className="font-heading text-2xl font-bold text-foreground">{result.name}</h2>
									<span className="inline-flex items-center gap-1 rounded-full bg-destructive/12 px-3 py-1 text-xs font-medium text-destructive">
										<TriangleAlert className="size-3.5" />
										Medical condition insight
									</span>
								</div>
								<div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-p:text-muted-foreground">
									<ReactMarkdown remarkPlugins={[remarkGfm]}>{result.description}</ReactMarkdown>
								</div>

								<div className="mt-5 grid gap-3 sm:grid-cols-3">
									{metricCards.map((metric) => (
										<div
											key={metric.label}
											className="rounded-xl border border-border bg-background px-4 py-3"
										>
											<p className="text-[11px] uppercase tracking-wide text-muted">
												{metric.label}
											</p>
											<p className="mt-1 text-2xl font-semibold text-foreground">{metric.value}</p>
											<p className="text-xs text-primary">{metric.note}</p>
										</div>
									))}
								</div>

								<div className="mt-5 border-b border-border">
									<div className="-mb-px flex flex-wrap gap-2">
										{RESULT_TABS.map((tab) => {
											const Icon = tab.icon;
											const isActive = activeTab === tab.id;
											return (
												<button
													key={tab.id}
													type="button"
													onClick={() => setActiveTab(tab.id)}
													className={cn(
														"inline-flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm transition",
														isActive
															? "border-primary text-primary"
															: "border-transparent text-muted hover:text-foreground",
													)}
												>
													<Icon className="size-4" />
													{tab.label}
												</button>
											);
										})}
									</div>
								</div>

								<div className="mt-4">
									{activeTab === "symptoms" && result.symptoms.length > 0 && (
										<InfoSection icon={HeartPulse} iconColor="text-rose-500" title="Symptoms">
											<ul className="grid gap-2 sm:grid-cols-2">
												{result.symptoms.map((symptom, idx) => (
													<li
														key={idx}
														className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
													>
														<div className="flex items-start gap-2">
															<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-500/70" />
															<span className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-foreground">
																<ReactMarkdown remarkPlugins={[remarkGfm]}>{symptom}</ReactMarkdown>
															</span>
														</div>
													</li>
												))}
											</ul>
										</InfoSection>
									)}

									{activeTab === "causes" && result.causes.length > 0 && (
										<InfoSection icon={AlertCircle} iconColor="text-amber-500" title="Causes">
											<div className="space-y-2.5">
												{result.causes.map((cause, idx) => (
													<div
														key={idx}
														className="rounded-lg border border-border bg-background px-3 py-3"
													>
														<div className="prose prose-sm max-w-none text-muted-foreground prose-p:my-0 prose-strong:text-foreground">
															<ReactMarkdown remarkPlugins={[remarkGfm]}>{cause}</ReactMarkdown>
														</div>
													</div>
												))}
											</div>
										</InfoSection>
									)}

									{activeTab === "prevention" && result.prevention.length > 0 && (
										<InfoSection icon={ShieldCheck} iconColor="text-emerald-500" title="Prevention">
											<ul className="grid gap-2 sm:grid-cols-2">
												{result.prevention.map((prevention, idx) => (
													<li
														key={idx}
														className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
													>
														<div className="flex items-start gap-2">
															<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500/70" />
															<span className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-foreground">
																<ReactMarkdown remarkPlugins={[remarkGfm]}>
																	{prevention}
																</ReactMarkdown>
															</span>
														</div>
													</li>
												))}
											</ul>
										</InfoSection>
									)}

									{activeTab === "treatment" && result.treatment.length > 0 && (
										<InfoSection icon={Pill} iconColor="text-violet-500" title="Treatment Options">
											<ul className="space-y-2">
												{result.treatment.map((treatment, idx) => (
													<li
														key={idx}
														className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
													>
														<div className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-foreground">
															<ReactMarkdown remarkPlugins={[remarkGfm]}>{treatment}</ReactMarkdown>
														</div>
													</li>
												))}
											</ul>
										</InfoSection>
									)}

									{activeTab === "doctor" && result.whenToSeeDoctor && (
										<InfoSection
											icon={ListChecks}
											iconColor="text-sky-500"
											title="When to See a Doctor"
										>
											<div className="prose prose-sm max-w-none text-muted-foreground prose-p:my-0 prose-strong:text-foreground">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>
													{result.whenToSeeDoctor}
												</ReactMarkdown>
											</div>
										</InfoSection>
									)}

									{activeTab === "symptoms" && result.symptoms.length === 0 && (
										<div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
											No symptom details were returned for this query.
										</div>
									)}

									{activeTab === "causes" && result.causes.length === 0 && (
										<div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
											No cause details were returned for this query.
										</div>
									)}

									{activeTab === "prevention" && result.prevention.length === 0 && (
										<div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
											No prevention guidance was returned for this query.
										</div>
									)}

									{activeTab === "treatment" && result.treatment.length === 0 && (
										<div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
											No treatment notes were returned for this query.
										</div>
									)}

									{activeTab === "doctor" && !result.whenToSeeDoctor && (
										<div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
											No doctor guidance was returned for this query.
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-3 pt-1">
							<Button variant="outline" size="md" onClick={() => setIsResearchOpen((v) => !v)}>
								<FlaskConical className="mr-1.5 size-4" />
								View Research Papers
							</Button>

							<Button variant="outline" size="md" onClick={handleFindDoctors}>
								<Stethoscope className="mr-1.5 size-4" />
								Find Related Doctors
								<ChevronsRight className="ml-1.5 size-4" />
							</Button>
						</div>

						{/* Research Papers */}
						<ResearchPanel
							query={result.name}
							hideTriggerButton
							isExternallyOpen={isResearchOpen}
						/>

						<div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
							<div className="mb-1.5 flex items-center gap-2 font-medium text-warning">
								<Activity className="size-4" />
								Medical disclaimer
							</div>
							<p className="text-sm text-foreground/80">
								This information is for general awareness and cannot replace professional medical
								diagnosis or treatment advice.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
