import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { PatientRecordClient } from "./PatientRecordClient";

export const metadata: Metadata = generatePageMetadata({
	title: "Patient Health Record",
	description: "Review an authorized patient's health context, reports, medicines, and trends.",
	path: "/doctor/patients",
	noIndex: true,
});

export default async function PatientRecordPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = await params;
	return <PatientRecordClient patientId={patientId} />;
}
