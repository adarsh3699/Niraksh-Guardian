import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		dangerouslyAllowSVG: false,
		contentDispositionType: "attachment",
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		remotePatterns: [
			{ protocol: "https", hostname: "res.cloudinary.com" },
			{ protocol: "https", hostname: "lh3.googleusercontent.com" },
			{ protocol: "https", hostname: "*.1mg.com" },
			{ protocol: "https", hostname: "onemg.gumlet.io" },
			{ protocol: "http", hostname: "localhost", port: "4000" },
		],
	},
	async headers() {
		return [
			{
				source: "/sw.js",
				headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
			},
			{
				source: "/manifest.webmanifest",
				headers: [{ key: "Content-Type", value: "application/manifest+json" }],
			},
		];
	},
};

export default nextConfig;
