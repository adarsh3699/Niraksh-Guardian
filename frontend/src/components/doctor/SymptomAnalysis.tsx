"use client";

import { useState, useCallback, useRef, useEffect, type FormEvent } from "react";
import { useChatSummary, useSymptomRelationship } from "@/hooks/useDoctors";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import {
	Search,
	ImagePlus,
	X,
	AlertTriangle,
	Stethoscope,
	Home,
	Activity,
	Lightbulb,
	MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SymptomAnalysis as SymptomAnalysisType } from "@/types/doctor";
import { SymptomBreakdown } from "./SymptomBreakdown";
import { SymptomSuggestions } from "./SymptomSuggestions";
import { SymptomRelationshipCard } from "./SymptomRelationshipCard";
import { SymptomInsight } from "./SymptomInsight";

/* ------------------------------------------------------------------ */
/*  Severity badge colors                                             */
/* ------------------------------------------------------------------ */

const SEVERITY_STYLES: Record<string, string> = {
	Mild: "bg-green-100 text-green-800 border-green-200",
	Moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
	Severe: "bg-orange-100 text-orange-800 border-orange-200",
	Emergency: "bg-red-100 text-red-800 border-red-200",
};

const URGENCY_ICONS: Record<string, typeof Home> = {
	"Home Care": Home,
	"Doctor Visit": Stethoscope,
	"Emergency Room": AlertTriangle,
};

/* ------------------------------------------------------------------ */
/*  Analysis result display                                           */
/* ------------------------------------------------------------------ */

function AnalysisResult({
	result,
	onFindDoctors,
}: {
	result: SymptomAnalysisType;
	onFindDoctors: (specialists: string[]) => void;
}) {
	const UrgencyIcon = URGENCY_ICONS[result.urgency] ?? Activity;
	const specialists = result.recommendedSpecialists ?? [];

	return (
		<div className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
			<h3 className="font-heading text-lg font-bold text-foreground">Analysis Result</h3>

			{/* Severity + Urgency badges */}
			<div className="flex flex-wrap gap-2">
				<span
					className={cn(
						"inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
						SEVERITY_STYLES[result.severity] ?? "bg-gray-100 text-gray-800",
					)}
				>
					{result.severity} Severity
				</span>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
					<UrgencyIcon className="size-3.5" />
					{result.urgency}
				</span>
			</div>

			{/* Possible conditions */}
			{result.possibleConditions.length > 0 && (
				<div>
					<h4 className="mb-1.5 text-sm font-semibold text-foreground">Possible Conditions</h4>
					<ul className="space-y-1 pl-4">
						{result.possibleConditions.map((condition) => (
							<li key={condition} className="list-disc text-sm text-muted">
								{condition}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Recommended specialist */}
			<div className="rounded-lg bg-primary/5 px-3 py-2">
				<div className="mb-1.5 flex items-center gap-2">
					<Stethoscope className="size-4 text-primary" />
					<span className="text-sm font-medium text-foreground">Recommended specialist</span>
				</div>
				<div className="flex flex-wrap gap-1.5">
					{specialists.map((spec) => (
						<span
							key={spec}
							className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
						>
							{spec}
						</span>
					))}
				</div>
			</div>

			{/* Home remedies */}
			{result.homeRemedies.length > 0 && (
				<div>
					<h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
						<Lightbulb className="size-4 text-accent" />
						Home Remedies
					</h4>
					<ul className="space-y-1 pl-4">
						{result.homeRemedies.map((remedy) => (
							<li key={remedy} className="list-disc text-sm text-muted">
								{remedy}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Reasoning */}
			{result.reasoning && (
				<div>
					<h4 className="mb-1 text-sm font-semibold text-foreground">Assessment</h4>
					<p className="text-sm leading-relaxed text-muted">{result.reasoning}</p>
				</div>
			)}

			{/* Find doctors CTA — one button per matched specialist */}
			<div className="flex flex-wrap gap-2">
				{specialists.map((spec, idx) => (
					<Button
						key={spec}
						variant={idx === 0 ? "primary" : "outline"}
						size="md"
						onClick={() => onFindDoctors([spec])}
						className="flex-shrink-0"
					>
						<Stethoscope className="mr-1.5 size-4" />
						Find a {spec}
					</Button>
				))}
				{specialists.length > 1 && (
					<Button
						variant="ghost"
						size="md"
						onClick={() => onFindDoctors(specialists)}
						className="flex-shrink-0 border border-border"
					>
						<Stethoscope className="mr-1.5 size-4" />
						Find All Specialists
					</Button>
				)}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Chat summary section                                              */
/* ------------------------------------------------------------------ */

function ChatSummarySection({
	chatId,
	onSummaryReady,
}: {
	chatId: string;
	onSummaryReady: (summaryText: string) => void;
}) {
	const { summary, isSummarizing, error, summarize } = useChatSummary();
	const hasTriggered = useRef(false);

	// Auto-summarize on mount — no manual button needed
	useEffect(() => {
		if (!hasTriggered.current) {
			hasTriggered.current = true;
			summarize(chatId);
		}
	}, [chatId, summarize]);

	// When summary arrives, propagate to parent for auto-fill
	useEffect(() => {
		if (summary?.status === "success" && summary.summary) {
			onSummaryReady(summary.summary);
		}
	}, [summary, onSummaryReady]);

	return (
		<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
			<div className="mb-3 flex items-center gap-2">
				<MessageSquare className="size-5 text-info" />
				<h3 className="font-heading text-base font-bold text-foreground">Chat Symptom Summary</h3>
			</div>

			{isSummarizing ? (
				<div className="flex items-center gap-2 text-sm text-muted">
					<div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					Analyzing your conversation...
				</div>
			) : error ? (
				<div className="space-y-2">
					<p className="text-sm text-destructive">{error}</p>
					<Button variant="outline" size="sm" onClick={() => summarize(chatId)}>
						Retry
					</Button>
				</div>
			) : summary?.status === "success" ? (
				<div className="rounded-lg bg-info/5 p-3">
					<p className="text-sm leading-relaxed text-foreground">{summary.summary}</p>
				</div>
			) : summary?.status === "non_medical" ? (
				<div className="rounded-lg bg-yellow-50 p-3">
					<p className="text-sm text-yellow-800">
						This conversation has no medical content to summarize.
					</p>
				</div>
			) : null}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  SymptomAnalysis — main component                                  */
/* ------------------------------------------------------------------ */

interface SymptomAnalysisProps {
	chatId?: string | null;
	initialSymptoms?: string;
	/** @deprecated Pre-loaded result no longer needed — unified hook handles session */
	initialResult?: SymptomAnalysisType | null;
	/** If true, auto-submit analysis on mount (e.g. coming from chat with pre-computed summary) */
	autoAnalyze?: boolean;
	/** Called with an array of matched specialists (usually 1, can be multiple) */
	onSpecialistFound: (specialists: string[]) => void;
	/** Called when analysis completes — passes the full result for parent use (e.g. matchTags) */
	onAnalysisComplete?: (result: SymptomAnalysisType) => void;
}

export function SymptomAnalysis({
	chatId,
	initialSymptoms,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	initialResult: _initialResult,
	autoAnalyze = false,
	onSpecialistFound,
	onAnalysisComplete,
}: SymptomAnalysisProps) {
	const [symptoms, setSymptoms] = useState(initialSymptoms ?? "");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const autoSubmitted = useRef(false);

	// Single unified hook — backend returns both SRI + legacy analysis
	const {
		result: sriResult,
		isAnalyzing,
		error,
		analyze: sriAnalyze,
		reset,
	} = useSymptomRelationship();

	// Notify parent with legacy analysis data (for matchTags etc.) — does NOT trigger doctor search
	useEffect(() => {
		if (sriResult?.analysis) {
			onAnalysisComplete?.(sriResult.analysis);
		}
	}, [sriResult, onAnalysisComplete]);

	// When user clicks a suggestion chip — only update the textarea.
	// User must click "Analyze Symptoms" to trigger a new analysis.
	const handleSuggestionSelect = useCallback(
		(symptom: string) => {
			// Don't add if already present (case-insensitive check)
			const alreadyPresent = symptoms
				.split(/[,\n]+/)
				.map((s) => s.trim().toLowerCase())
				.includes(symptom.toLowerCase());
			if (alreadyPresent) return;

			setSymptoms((prev) => (prev.trim() ? `${prev}, ${symptom}` : symptom));
		},
		[symptoms],
	);

	// Unified submit — single endpoint does everything
	const handleSubmit = useCallback(
		async (e?: FormEvent) => {
			e?.preventDefault();
			if (!symptoms.trim() && !image) return; // Allow image-only analysis
			await sriAnalyze(symptoms, image || undefined);
		},
		[symptoms, image, sriAnalyze],
	);

	// When chatId summary fills the symptoms, auto-submit
	const handleSummaryReady = useCallback((summaryText: string) => {
		setSymptoms(summaryText);
	}, []);

	// Auto-submit when autoAnalyze or chatId summary fills symptoms
	useEffect(() => {
		if ((autoAnalyze || chatId) && symptoms && !autoSubmitted.current && !sriResult && !isAnalyzing) {
			autoSubmitted.current = true;
			handleSubmit();
		}
	}, [autoAnalyze, chatId, symptoms, sriResult, isAnalyzing, handleSubmit]);

	const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
		setImage(file);
		const reader = new FileReader();
		reader.onload = (ev) => setImagePreview(ev.target?.result as string);
		reader.readAsDataURL(file);
		e.target.value = "";
	}, []);

	const removeImage = useCallback(() => {
		setImage(null);
		setImagePreview(null);
	}, []);

	const handleReset = useCallback(() => {
		reset();
		setSymptoms("");
		removeImage();
	}, [reset, removeImage]);

	return (
		<div className="space-y-4">
			{/* Chat summary (if navigated from a chat) */}
			{chatId && <ChatSummarySection chatId={chatId} onSummaryReady={handleSummaryReady} />}

			{/* Symptom input card */}
			<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
				<h3 className="mb-3 font-heading text-lg font-bold text-foreground">
					Describe Your Symptoms
				</h3>

				<form onSubmit={handleSubmit} className="space-y-3">
					<textarea
						value={symptoms}
						onChange={(e) => setSymptoms(e.target.value)}
						placeholder="E.g., headache for 3 days, mild fever, body aches..."
						rows={3}
						className={cn(
							"w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground",
							"placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
						)}
						disabled={isAnalyzing}
					/>

					{/* Image preview */}
					{imagePreview && (
						<div className="inline-flex items-start gap-2">
							<div className="relative size-16 overflow-hidden rounded-lg border border-border">
								<Image src={imagePreview} alt="Symptom image" fill className="object-cover" />
							</div>
							<button
								type="button"
								onClick={removeImage}
								className="rounded-full bg-destructive/10 p-1 text-destructive hover:bg-destructive/20"
								aria-label="Remove image"
							>
								<X className="size-3.5" />
							</button>
						</div>
					)}

					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="submit"
							variant="primary"
							size="md"
							disabled={!symptoms.trim() || isAnalyzing}
							loading={isAnalyzing}
						>
							<Search className="mr-1.5 size-4" />
							Analyze Symptoms
						</Button>

						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={isAnalyzing}
							className="rounded-lg border border-border p-2.5 text-muted transition-colors hover:bg-border hover:text-foreground disabled:opacity-50"
							aria-label="Attach image"
						>
							<ImagePlus className="size-5" />
						</button>

						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageSelect}
							className="hidden"
							aria-hidden="true"
						/>

						{sriResult && (
							<Button type="button" variant="ghost" size="md" onClick={handleReset}>
								Clear
							</Button>
						)}
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}
				</form>
			</div>

			{/* When < 2 symptoms → show suggestions + legacy analysis */}
			{sriResult?.needMoreInfo === true && sriResult.suggestedSymptoms && sriResult.message && (
				<SymptomSuggestions
					symptoms={sriResult.symptoms}
					message={sriResult.message}
					suggestedSymptoms={sriResult.suggestedSymptoms}
					onSelect={handleSuggestionSelect}
				/>
			)}

			{/* When ≥ 2 symptoms → show deep SRI analysis */}
			{sriResult?.needMoreInfo === false && (
				<div className="space-y-4">
					<SymptomBreakdown symptoms={sriResult.symptoms} />
					{sriResult.relationship && <SymptomRelationshipCard relationship={sriResult.relationship} />}
					{sriResult.insight && <SymptomInsight insight={sriResult.insight} />}
				</div>
			)}

			{/* Legacy analysis result — always shows from the same response */}
			{sriResult?.analysis && <AnalysisResult result={sriResult.analysis} onFindDoctors={onSpecialistFound} />}
		</div>
	);
}
