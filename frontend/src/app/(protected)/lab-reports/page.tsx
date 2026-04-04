import { redirect } from "next/navigation";

export default function LabReportsPage() {
	redirect("/prescription?mode=lab");
}
