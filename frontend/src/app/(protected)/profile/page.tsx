import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const ProfileClient = dynamic(() => import("./ProfileClient").then((m) => m.ProfileClient), {
	loading: () => (
		<div className="flex min-h-[60vh] items-center justify-center">
			<Spinner size="lg" className="text-primary" />
		</div>
	),
});

export const metadata: Metadata = generatePageMetadata({
	title: "My Profile",
	description:
		"Manage your personal information, health profile, location, and emergency contacts.",
	path: "/profile",
	noIndex: true,
});

export default function ProfilePage() {
	return <ProfileClient />;
}
