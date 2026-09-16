import type { ClinicalIntake } from "./appointments";

export type HpiForm = {
	onset: string;
	duration: string;
	severity: string;
	location: string;
	character: string;
	aggravatingFactors: string;
	relievingFactors: string;
	associatedSymptoms: string;
	previousTreatment: string;
};

export type RosForm = {
	general: string;
	respiratory: string;
	cardiac: string;
	gastrointestinal: string;
	neurological: string;
	endocrine: string;
	other: string;
};

export interface ClinicalIntakeResponse {
	intake: ClinicalIntake | null;
}

export interface ClinicalTimelineEntry {
	sourceType: string;
	sourceId: string | null;
	eventDate: string;
	title: string;
	summary: string | null;
}

export interface ClinicalTimelineResponse {
	timeline: ClinicalTimelineEntry[];
}
