"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionState } from "@/hooks/useSessionState";
import { useMedicineAnalysis } from "@/hooks/useHealthTools";
import { FileUploadZone } from "@/components/health-tools/FileUploadZone";
import { AnalysisResult, AnalysisResultSkeleton } from "@/components/health-tools/AnalysisResult";
import { Button } from "@/components/ui/Button";
import { Search, Pill, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  MedicineClient                                                     */
/* ------------------------------------------------------------------ */

export function MedicineClient() {
	const searchParams = useSearchParams();
	const urlName = searchParams.get("name");
	const [name, setName] = useSessionState("ng:medicine:name", urlName ?? "");
	const [files, setFiles] = useState<File[]>([]);
	const { result, isLoading, error, analyze, reset } = useMedicineAnalysis();

	// Auto-search if ?name= is provided and no cached result
	useEffect(() => {
		if (urlName && !result) {
			setName(urlName);
			analyze(urlName);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSubmit = useCallback(
		async (e?: FormEvent) => {
			e?.preventDefault();
			if (!name.trim() && files.length === 0) return;
			await analyze(name || undefined, files[0] ?? undefined);
		},
		[name, files, analyze],
	);

	const handleReset = useCallback(() => {
		reset();
		setName("");
		setFiles([]);
	}, [reset]);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<div className="mb-2 flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
						<Pill className="size-5 text-accent" />
					</div>
					<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
						Medicine Search
					</h1>
				</div>
				<p className="text-sm text-muted sm:text-base">
					Search by medicine name or upload an image to get detailed information about composition,
					uses, side effects, and dosage.
				</p>
			</div>

			<div className="space-y-6">
				{/* Input section */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Text input */}
						<div>
							<label
								htmlFor="medicine-name"
								className="mb-1.5 block text-sm font-medium text-foreground"
							>
								Medicine Name
							</label>
							<input
								id="medicine-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="E.g., Paracetamol, Amoxicillin, Ibuprofen..."
								className={cn(
									"h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground",
									"placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
								)}
								disabled={isLoading}
							/>
						</div>

						{/* Divider */}
						<div className="flex items-center gap-3">
							<div className="h-px flex-1 bg-border" />
							<span className="text-xs font-medium text-muted">OR</span>
							<div className="h-px flex-1 bg-border" />
						</div>

						{/* Image upload */}
						<div>
							<p className="mb-1.5 text-sm font-medium text-foreground">Upload Medicine Image</p>
							<FileUploadZone
								maxFiles={1}
								onFilesChange={setFiles}
								disabled={isLoading}
								label="Drop an image of the medicine or packaging"
							/>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-3">
							<Button
								type="submit"
								variant="primary"
								size="md"
								disabled={(!name.trim() && files.length === 0) || isLoading}
								loading={isLoading}
							>
								<Search className="mr-1.5 size-4" />
								Analyze Medicine
							</Button>

							{(result || name || files.length > 0) && (
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
				{isLoading && <AnalysisResultSkeleton />}

				{/* Result */}
				{result && <AnalysisResult description={result.description} title="Medicine Information" />}
			</div>
		</div>
	);
}
