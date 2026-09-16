export type ConsultationMode = "IN_PERSON" | "VIDEO" | "PHONE";
export type AppointmentStatus =
	| "REQUESTED"
	| "CONFIRMED"
	| "RESCHEDULED"
	| "CANCELLED_BY_PATIENT"
	| "CANCELLED_BY_DOCTOR"
	| "COMPLETED"
	| "NO_SHOW";

export interface AppointmentDoctor {
	id: string;
	name: string;
	specialization: string;
	qualification?: string | null;
	city: string;
	state: string;
	consultationFee: number;
	imageUrl?: string | null;
}

export interface Appointment {
	id: string;
	scheduledAt: string;
	durationMinutes: number;
	mode: ConsultationMode;
	status: AppointmentStatus;
	reason?: string | null;
	patientNote?: string | null;
	doctorNote?: string | null;
	doctor?: AppointmentDoctor;
	patient?: { id: string; name: string | null; email: string; gender: string | null };
}

export interface DoctorSlotResponse {
	doctor: { id: string; name: string; consultationModes: ConsultationMode[] };
	date: string;
	slots: string[];
}

export interface DoctorAppointmentResponse {
	appointments: Appointment[];
}

export interface DoctorPatientSummary {
	patient: {
		id: string;
		name: string | null;
		email: string;
		gender: string | null;
		patientHealthProfile?: {
			bloodGroup: string | null;
			allergies: string[];
			chronicConditions: string[];
		} | null;
	};
	expiresAt: string;
	grantedAt: string;
}

export interface DoctorPatientsResponse {
	patients: DoctorPatientSummary[];
}

export interface DoctorMeResponse {
	profile: {
		id: string;
		verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
		verificationNote: string | null;
		displayName: string | null;
		licenseNumber: string | null;
		specialization: string | null;
		qualification: string | null;
		experienceYears: number | null;
		consultationFee: number | null;
		city: string | null;
		state: string | null;
		bio: string | null;
		contactInfo: string | null;
		phone: string | null;
		clinicName: string | null;
		clinicAddress: string | null;
		consultationModes: ConsultationMode[];
		directoryDoctor: AppointmentDoctor | null;
	};
}

export interface PatientRecordResponse {
	appointmentId: string | null;
	patient: {
		id: string;
		name: string | null;
		email: string;
		gender: string | null;
		createdAt: string;
	};
	healthProfile: {
		bloodGroup: string | null;
		allergies: string[];
		chronicConditions: string[];
		healthRiskScore: number;
	} | null;
	labReports: Array<{
		id: string;
		fileName: string;
		overallRisk: string;
		createdAt: string;
		components: Array<{
			componentName: string;
			observedValue: number | null;
			unit: string | null;
			status: string;
		}>;
	}>;
	prescriptionHistory: Array<{ id: string; extractedText: string; createdAt: string }>;
	medicineHistory: Array<{ id: string; medicineName: string | null; createdAt: string }>;
	symptomHistory: Array<{
		id: string;
		symptoms: string[];
		urgencyLevel: string;
		createdAt: string;
	}>;
	doctorPrescriptions: Array<{
		id: string;
		status: string;
		createdAt: string;
		medications: Array<{
			name: string;
			dosage: string | null;
			frequency: string | null;
			duration: string | null;
		}>;
		}>;
	clinicalIntake: ClinicalIntake | null;
	clinicalTimeline: Array<{
		sourceType: string;
		sourceId: string | null;
		eventDate: string;
		title: string;
		summary: string | null;
	}>;
}

export interface ClinicalIntake {
	id: string;
	appointmentId: string | null;
	status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "EXPIRED";
	chiefComplaint: string | null;
	hpi: Record<string, string>;
	ros: Record<string, string>;
	medicationNotes: string | null;
	allergyNotes: string | null;
	summaryDraft: string | null;
	summaryEdited: string | null;
	triageLevel: "ROUTINE" | "URGENT" | "EMERGENCY";
	triageReasons: string[];
	triageMessage: string | null;
	consentGrantedAt: string | null;
	consentRevokedAt: string | null;
	expiresAt: string;
	submittedAt: string | null;
	reviewedAt: string | null;
}
