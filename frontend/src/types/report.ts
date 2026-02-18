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
