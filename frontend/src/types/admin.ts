import type { ConsultationMode } from "@/types/appointments";

export type DoctorVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface DoctorApplication {
	id: string;
	verificationStatus: DoctorVerificationStatus;
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
	createdAt: string;
	user: { id: string; name: string | null; email: string; createdAt: string; isActive: boolean };
	directoryDoctor: {
		id: string;
		name: string;
		specialization: string;
		isAvailable: boolean;
	} | null;
}

export interface DoctorApplicationsResponse {
	applications: DoctorApplication[];
}
