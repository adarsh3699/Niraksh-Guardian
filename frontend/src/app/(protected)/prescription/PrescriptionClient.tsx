"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePrescriptionAnalysis } from "@/hooks/useHealthTools";
import { FileUploadZone } from "@/components/health-tools/FileUploadZone";
import { AnalysisResult, AnalysisResultSkeleton } from "@/components/health-tools/AnalysisResult";
import { Button } from "@/components/ui/Button";
import { FileText, ArrowRight, Pill, RotateCcw, Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  PrescriptionClient                                                 */
/* ------------------------------------------------------------------ */

export function PrescriptionClient() {
	const [files, setFiles] = useState<File[]>([]);
	const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
	const { result, isLoading, error, analyze, reset } = usePrescriptionAnalysis();
	const router = useRouter();

	const handleAnalyze = useCallback(async () => {
		if (files.length === 0) return;
		setSelectedMedicines([]);
		await analyze(files);
	}, [files, analyze]);

	const handleReset = useCallback(() => {
		reset();
		setFiles([]);
		setSelectedMedicines([]);
	}, [reset]);

	/** Toggle a medicine chip on/off */
	const toggleMedicine = useCallback((medicine: string) => {
		setSelectedMedicines((prev) =>
			prev.includes(medicine) ? prev.filter((m) => m !== medicine) : [...prev, medicine],
		);
	}, []);

	/** Navigate based on selection count */
	const handleMedicineAction = useCallback(() => {
		if (selectedMedicines.length === 1) {
			// Single medicine → Medicine Search page
			router.push(`/medicine?name=${encodeURIComponent(selectedMedicines[0])}`);
		} else if (selectedMedicines.length >= 2) {
			// Multiple medicines → Drug Interaction Checker
			const params = selectedMedicines.map(encodeURIComponent).join(",");
			router.push(`/drug-interaction?medicines=${params}`);
		}
	}, [selectedMedicines, router]);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<div className="mb-2 flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
						<FileText className="size-5 text-primary" />
					</div>
					<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
						Prescription Explainer
					</h1>
				</div>
				<p className="text-sm text-muted sm:text-base">
					Upload your prescription images and get a clear explanation of your medicines, dosages,
					and instructions.
				</p>
			</div>

			{/* Upload section */}
			<div className="space-y-6">
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
					<h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
						Upload Prescription Images
					</h2>

					<FileUploadZone
						maxFiles={5}
						onFilesChange={setFiles}
						disabled={isLoading}
						label="Drop prescription images here or click to browse"
					/>

					<div className="mt-4 flex items-center gap-3">
						<Button
							variant="primary"
							size="md"
							onClick={handleAnalyze}
							disabled={files.length === 0 || isLoading}
							loading={isLoading}
						>
							<FileText className="mr-1.5 size-4" />
							Analyze Prescription
						</Button>

						{(result || files.length > 0) && (
							<Button variant="ghost" size="md" onClick={handleReset} disabled={isLoading}>
								<RotateCcw className="mr-1.5 size-4" />
								Clear
							</Button>
						)}
					</div>

					{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
				</div>

				{/* Loading */}
				{isLoading && <AnalysisResultSkeleton />}

				{/* Result */}
				{result && (
					<>
						<AnalysisResult description={result.description} title="Prescription Analysis" />

						{/* Extracted medicines — selectable chips */}
						{result.medicines && result.medicines.length > 0 && (
							<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
								<h3 className="mb-1 font-heading text-base font-bold text-foreground">
									Extracted Medicines
								</h3>
								<p className="mb-4 text-xs text-muted">
									Select medicines to look up details or check interactions
								</p>

								{/* Selectable chips */}
								<div className="mb-4 flex flex-wrap gap-2">
									{result.medicines.map((med) => {
										const isSelected = selectedMedicines.includes(med);
										return (
											<button
												key={med}
												type="button"
												onClick={() => toggleMedicine(med)}
												className={cn(
													"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
													isSelected
														? "border-primary bg-primary/15 text-primary shadow-sm"
														: "border-border bg-background text-muted hover:border-primary/40 hover:text-foreground",
												)}
											>
												<Pill className="size-3" />
												{med}
											</button>
										);
									})}
								</div>

								{/* Dynamic CTA */}
								<Button
									variant="outline"
									size="md"
									onClick={handleMedicineAction}
									disabled={selectedMedicines.length === 0}
								>
									{selectedMedicines.length === 1 ? (
										<>
											<Search className="mr-1.5 size-4" />
											Check Medicine Details
										</>
									) : (
										<>
											<AlertTriangle className="mr-1.5 size-4" />
											Check Drug Interactions
										</>
									)}
									<ArrowRight className="ml-1.5 size-4" />
								</Button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
