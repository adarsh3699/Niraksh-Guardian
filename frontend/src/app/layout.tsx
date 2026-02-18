import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ToastProvider } from "@/contexts/ToastProvider";
import { GoogleAuthWrapper } from "@/contexts/GoogleAuthWrapper";
import "./globals.css";

const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["600", "700"],
	display: "swap",
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Niraksh Guardian — AI Health Assistant",
	description:
		"AI-powered health assistant for symptom analysis, doctor suggestions, medicine lookup, and prescription analysis.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${poppins.variable} ${inter.variable} antialiased`}>
				<GoogleAuthWrapper>
					<AuthProvider>
						<ToastProvider>{children}</ToastProvider>
					</AuthProvider>
				</GoogleAuthWrapper>
			</body>
		</html>
	);
}
