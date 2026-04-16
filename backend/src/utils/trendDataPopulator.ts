/**
 * Trend Data Populator Utility
 *
 * Populates trend data for lab components by fetching historical values
 * from previous reports. This enables trend visualization in the UI.
 */

import prisma from "../db/prisma";

/**
 * Populates trend data for a lab component by querying historical reports.
 *
 * Fetches the last 3-5 observed values for components with the same name
 * from previous reports by the same user, ordered chronologically (oldest to newest).
 *
 * @param componentName - The name of the lab component to fetch trend data for
 * @param userId - The ID of the user whose reports to query
 * @param currentReportId - The ID of the current report (to exclude from historical data)
 * @returns Array of numeric values representing historical observed values (oldest to newest)
 *
 * @example
 * const trend = await populateTrendData("Hemoglobin", "user-123", "report-456");
 * // Returns: [12.5, 13.1, 12.8] (last 3 values in chronological order)
 */
export async function populateTrendData(
	componentName: string,
	userId: string,
	currentReportId: string
): Promise<number[]> {
	try {
		// Query for historical reports (excluding current report)
		// Ordered by createdAt descending to get most recent first
		const historicalReports = await prisma.labReport.findMany({
			where: {
				userId,
				id: { not: currentReportId },
			},
			include: {
				components: {
					where: { componentName },
					select: { observedValue: true },
				},
			},
			orderBy: { createdAt: "desc" },
			take: 5, // Get last 5 reports maximum
		});

		// Extract observed values and filter out nulls
		// Type assertion needed due to Prisma Accelerate extension affecting type inference
		type ReportWithComponent = { components: Array<{ observedValue: number | null }> };
		const values = (historicalReports as unknown as ReportWithComponent[])
			.map((report) => report.components[0]?.observedValue)
			.filter((value): value is number => value !== null && value !== undefined);

		// Reverse to get chronological order (oldest to newest)
		return values.reverse();
	} catch (error) {
		// Log error but don't throw - return empty array as fallback
		console.error(`Failed to populate trend data for ${componentName}:`, error);
		return [];
	}
}

/**
 * Populates trend data for multiple components in batch.
 * More efficient than calling populateTrendData multiple times.
 *
 * @param components - Array of component names to fetch trend data for
 * @param userId - The ID of the user whose reports to query
 * @param currentReportId - The ID of the current report (to exclude from historical data)
 * @returns Map of component names to their trend data arrays
 *
 * @example
 * const trends = await populateTrendDataBatch(
 *   ["Hemoglobin", "Glucose", "Cholesterol"],
 *   "user-123",
 *   "report-456"
 * );
 * // Returns: Map { "Hemoglobin" => [12.5, 13.1], "Glucose" => [95, 98, 102], ... }
 */
export async function populateTrendDataBatch(
	components: string[],
	userId: string,
	currentReportId: string
): Promise<Map<string, number[]>> {
	try {
		// Query for historical reports with all components
		const historicalReports = await prisma.labReport.findMany({
			where: {
				userId,
				id: { not: currentReportId },
			},
			include: {
				components: {
					where: {
						componentName: { in: components },
					},
					select: {
						componentName: true,
						observedValue: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		});

		// Build a map of component name to trend values
		const trendMap = new Map<string, number[]>();

		// Initialize map with empty arrays for all components
		for (const componentName of components) {
			trendMap.set(componentName, []);
		}

		// Process reports in reverse order (oldest to newest)
		// Type assertion needed due to Prisma Accelerate extension affecting type inference
		type HistoricalReport = { components: Array<{ componentName: string; observedValue: number | null }> };
		for (const report of (historicalReports as unknown as HistoricalReport[]).reverse()) {
			for (const component of report.components) {
				const value = component.observedValue;
				if (value !== null && value !== undefined) {
					const existing = trendMap.get(component.componentName) || [];
					trendMap.set(component.componentName, [...existing, value]);
				}
			}
		}

		return trendMap;
	} catch (error) {
		console.error("Failed to populate trend data in batch:", error);
		// Return empty map as fallback
		return new Map();
	}
}
