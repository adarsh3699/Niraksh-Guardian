import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ToastProvider } from "@/contexts/ToastProvider";
import { GoogleAuthWrapper } from "@/contexts/GoogleAuthWrapper";
import { SITE_CONFIG } from "@/lib/seo";
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

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: SITE_CONFIG.themeColor,
};

export const metadata: Metadata = {
	title: {
		default: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
		template: `%s | ${SITE_CONFIG.name}`,
	},
	description: SITE_CONFIG.description,
	keywords: SITE_CONFIG.keywords,
	authors: SITE_CONFIG.authors,
	creator: SITE_CONFIG.creator,
	metadataBase: new URL(SITE_CONFIG.url),
	openGraph: {
		type: SITE_CONFIG.openGraph.type,
		locale: SITE_CONFIG.openGraph.locale,
		siteName: SITE_CONFIG.openGraph.siteName,
		title: SITE_CONFIG.openGraph.title,
		description: SITE_CONFIG.openGraph.description,
	},
	twitter: {
		card: SITE_CONFIG.twitter.card,
		title: SITE_CONFIG.twitter.title,
		description: SITE_CONFIG.twitter.description,
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="dns-prefetch" href="https://niraksh-guardian-api.vercel.app" />
				<link
					rel="preconnect"
					href="https://niraksh-guardian-api.vercel.app"
					crossOrigin="anonymous"
				/>
			</head>
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
