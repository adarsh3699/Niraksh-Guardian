"use client";

import useSWR from "swr";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import type {
	DoctorAppointmentResponse,
	DoctorMeResponse,
	DoctorPatientsResponse,
	DoctorSlotResponse,
	PatientRecordResponse,
} from "@/types/appointments";

export function useDoctorMe() {
	return useSWR<DoctorMeResponse>(API_ROUTES.DOCTOR_ME, swrFetcher, { revalidateOnFocus: false });
}

export function useDoctorAppointments(enabled = true) {
	return useSWR<DoctorAppointmentResponse>(enabled ? API_ROUTES.DOCTOR_APPOINTMENTS : null, swrFetcher, {
		revalidateOnFocus: false,
	});
}

export function useDoctorPatients(enabled = true) {
	return useSWR<DoctorPatientsResponse>(enabled ? API_ROUTES.DOCTOR_PATIENTS : null, swrFetcher, {
		revalidateOnFocus: false,
	});
}

export function usePatientRecord(patientId: string) {
	return useSWR<PatientRecordResponse>(
		patientId ? `/api/doctor/patients/${patientId}` : null,
		swrFetcher,
		{ revalidateOnFocus: false },
	);
}

export function useDoctorSlots(doctorId: string, date: string) {
	return useSWR<DoctorSlotResponse>(
		doctorId && date ? API_ROUTES.DOCTOR_SLOTS(doctorId, date) : null,
		swrFetcher,
		{ revalidateOnFocus: false },
	);
}

export async function updateDoctorAppointmentStatus(id: string, body: unknown) {
	return apiClient<{ appointment: unknown }>(`/api/doctor/appointments/${id}/status`, {
		method: "PATCH",
		body,
	});
}

export async function runPrePrescriptionCheck(patientId: string, body: unknown) {
	return apiClient<{
		checkId: string;
		currentMedicines: string[];
		proposedMedicines: string[];
		interactionResult: {
			severity: string;
			riskScore: number;
			tabs: Array<{ title: string; content: string }>;
		};
	}>(`/api/doctor/patients/${patientId}/pre-prescription-check`, { method: "POST", body });
}

export async function issueDoctorPrescription(patientId: string, body: unknown) {
	return apiClient<{ prescription: unknown }>(API_ROUTES.DOCTOR_PATIENT_PRESCRIPTIONS(patientId), {
		method: "POST",
		body,
	});
}
