interface LabReportComponent {
	componentName: string;
	observedValue: number | null;
	observedRaw: string | null;
	unit: string | null;
	referenceMin: number | null;
	referenceMax: number | null;
	status: string;
	category: string | null;
}

interface LabReportForCSV {
	components: LabReportComponent[];
}

/**
 * Escapes a CSV field value by wrapping it in quotes if it contains special characters
 */
function escapeCSVField(value: string | number | null): string {
	if (value === null || value === undefined) {
		return "";
	}

	const stringValue = String(value);

	// If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
	if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}

	return stringValue;
}

/**
 * Generates a CSV string for a lab report
 */
export function generateLabReportCSV(report: LabReportForCSV): string {
	// Define CSV headers
	const headers = ["Component", "Observed Value", "Unit", "Reference Min", "Reference Max", "Status", "Category"];

	// Create header row
	const headerRow = headers.join(",");

	// Create data rows
	const dataRows = report.components.map((component) => {
		const row = [
			escapeCSVField(component.componentName),
			escapeCSVField(component.observedRaw || component.observedValue),
			escapeCSVField(component.unit),
			escapeCSVField(component.referenceMin),
			escapeCSVField(component.referenceMax),
			escapeCSVField(component.status),
			escapeCSVField(component.category || "Other"),
		];

		return row.join(",");
	});

	// Combine header and data rows
	return [headerRow, ...dataRows].join("\n");
}
