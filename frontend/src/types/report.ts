/* ------------------------------------------------------------------ */
/*  Health Report types                                               */
/* ------------------------------------------------------------------ */

export interface HealthReport {
	id: string;
	reportUrl: string;
	createdAt: string;
}

/** `GET /api/reports/health-summary` response. */
export interface GenerateReportResponse {
	message: string;
	reportUrl: string;
}

export interface LabReportListItem {
	id: string;
	fileName: string;
	fileUrl: string;
	overallRisk: "low" | "moderate" | "high" | string;
	abnormalCount: number;
	totalCount: number;
	createdAt: string;
}

export interface LabReportComponent {
	id: string;
	componentName: string;
	observedValue: number | null;
	observedRaw: string | null;
	unit: string | null;
	referenceMin: number | null;
	referenceMax: number | null;
	status: "low" | "normal" | "high" | "unknown" | string;
	effectSummary: string | null;
	riskTag: string | null;
	confidence: number | null;
	sourceSnippet: string | null;
	createdAt: string;
}

export interface LabReportDetail {
	id: string;
	fileName: string;
	fileUrl: string;
	mimeType: string;
	extractedText: string | null;
	overallSummary: string | null;
	overallRisk: "low" | "moderate" | "high" | string;
	abnormalCount: number;
	totalCount: number;
	createdAt: string;
	components: LabReportComponent[];
}

export interface AnalyzeLabReportResponse {
	message: string;
	jobId: string;
	status: "queued" | "processing";
}

export interface LabReportJobStatusResponse {
	jobId: string;
	status: "queued" | "processing" | "completed" | "failed";
	reportId: string | null;
	error: string | null;
	createdAt: string;
	updatedAt: string;
}
