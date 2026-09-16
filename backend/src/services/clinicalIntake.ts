import type { z } from "zod";
import type { hpiSchema, rosSchema } from "../validators/clinicalIntake.schema";

export type HpiInput = z.infer<typeof hpiSchema>;
export type RosInput = z.infer<typeof rosSchema>;

export type TriageResult = {
	level: "ROUTINE" | "URGENT" | "EMERGENCY";
	reasons: string[];
	message: string;
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export function evaluateTriage(chiefComplaint: string, hpi: HpiInput, ros: RosInput): TriageResult {
	const text = normalize([chiefComplaint, ...Object.values(hpi), ...Object.values(ros)].join(" "));

	const emergencyRules: Array<[RegExp, string]> = [
		[
			/severe chest pain|crushing chest pain|chest pain.*breathless|breathless.*chest pain/,
			"Severe or pressure-like chest pain with breathing difficulty",
		],
		[
			/difficulty breathing|cannot breathe|unable to breathe|severe breathlessness|blue lips/,
			"Severe breathing difficulty",
		],
		[
			/sudden weakness|face droop|slurred speech|one side.*weak|stroke symptoms/,
			"Sudden symptoms that may need urgent stroke assessment",
		],
		[/unconscious|not responding|seizure|convulsion/, "Loss of consciousness or seizure-like symptoms"],
		[/heavy bleeding|uncontrolled bleeding|vomiting blood|blood in stool/, "Heavy or uncontrolled bleeding"],
	];
	const urgentRules: Array<[RegExp, string]> = [
		[/suicid|self[- ]harm|want to die/, "Immediate mental health safety concern"],
		[/persistent vomiting|unable to keep fluids/, "Persistent vomiting or inability to keep fluids down"],
		[/very high fever|high fever.*confusion|fever.*stiff neck/, "High-risk fever symptoms"],
		[/severe pain|worst pain|rapidly worsening/, "Severe or rapidly worsening symptoms"],
		[/very low sugar|very high sugar|hypoglycemia|hyperglycemia.*confusion/, "Concerning blood sugar symptoms"],
	];

	const emergencyReasons = emergencyRules.filter(([pattern]) => pattern.test(text)).map(([, reason]) => reason);
	if (emergencyReasons.length > 0) {
		return {
			level: "EMERGENCY",
			reasons: Array.from(new Set(emergencyReasons)),
			message: "Please seek emergency medical care now. Do not wait for a routine appointment.",
		};
	}

	const urgentReasons = urgentRules.filter(([pattern]) => pattern.test(text)).map(([, reason]) => reason);
	if (urgentReasons.length > 0) {
		return {
			level: "URGENT",
			reasons: Array.from(new Set(urgentReasons)),
			message: "Please contact a clinician promptly. If symptoms worsen, use emergency services.",
		};
	}

	return {
		level: "ROUTINE",
		reasons: [],
		message: "No configured red-flag phrase was detected. A clinician should still review your information.",
	};
}

const present = (label: string, value: string | undefined) => (value?.trim() ? `${label}: ${value.trim()}` : "");

export function buildFallbackClinicalSummary(input: {
	chiefComplaint: string;
	hpi: HpiInput;
	ros: RosInput;
	medicationNotes?: string;
	allergyNotes?: string;
}) {
	const hpiLines = [
		present("Onset", input.hpi.onset),
		present("Duration", input.hpi.duration),
		present("Severity", input.hpi.severity),
		present("Location", input.hpi.location),
		present("Character", input.hpi.character),
		present("Aggravating factors", input.hpi.aggravatingFactors),
		present("Relieving factors", input.hpi.relievingFactors),
		present("Associated symptoms", input.hpi.associatedSymptoms),
		present("Previous treatment", input.hpi.previousTreatment),
	].filter(Boolean);
	const rosLines = Object.entries(input.ros)
		.map(([system, value]) => present(system.replace(/([A-Z])/g, " $1"), value))
		.filter(Boolean);

	return [
		`Chief complaint: ${input.chiefComplaint.trim()}`,
		hpiLines.length
			? `History of present illness: ${hpiLines.join("; ")}`
			: "History of present illness: Not provided.",
		rosLines.length ? `Review of systems: ${rosLines.join("; ")}` : "Review of systems: Not provided.",
		present("Current medicines", input.medicationNotes) || "Current medicines: Not provided.",
		present("Allergies", input.allergyNotes) || "Allergies: Not provided.",
		"This is an AI-assisted intake draft for clinician review, not a diagnosis.",
	].join("\n\n");
}

export function timelinePreview(value: string | null | undefined, max = 240) {
	const text = value?.replace(/\s+/g, " ").trim() ?? "";
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function extractDocumentDate(value: string | null | undefined): Date | null {
	if (!value) return null;
	const isoOrSlash = value.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
	if (isoOrSlash) {
		const date = new Date(Date.UTC(Number(isoOrSlash[1]), Number(isoOrSlash[2]) - 1, Number(isoOrSlash[3])));
		return Number.isNaN(date.getTime()) ? null : date;
	}
	const dayFirst = value.match(/\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/);
	if (dayFirst) {
		const date = new Date(Date.UTC(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1])));
		return Number.isNaN(date.getTime()) ? null : date;
	}
	return null;
}
