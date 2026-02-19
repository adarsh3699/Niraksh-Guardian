"use client";

import Link from "next/link";

const TOOLS = [
	{
		href: "/prescription",
		accentColor: "#448e94",
		accentBg: "rgba(68,142,148,0.08)",
		accentShadow: "rgba(68,142,148,0.18)",
		tag: "Health Tools",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={1.8}
				className="h-6 w-6"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		),
		label: "Prescription Explainer",
		desc: "Upload or describe your prescription and get plain-language explanations, dosage schedules, and side-effect summaries in seconds.",
		cta: "Explain Now",
	},
	{
		href: "/drug-interaction",
		accentColor: "#ff5657",
		accentBg: "rgba(255,86,87,0.08)",
		accentShadow: "rgba(255,86,87,0.18)",
		tag: "Safety Check",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={1.8}
				className="h-6 w-6"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
				/>
			</svg>
		),
		label: "Drug Interaction Checker",
		desc: "Enter multiple medications and instantly surface dangerous combinations — before you take them.",
		cta: "Check Safety",
	},
	{
		href: "/doctor-suggest",
		accentColor: "#3b82f6",
		accentBg: "rgba(59,130,246,0.08)",
		accentShadow: "rgba(59,130,246,0.18)",
		tag: "Find Care",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={1.8}
				className="h-6 w-6"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
		),
		label: "Doctor Suggestion",
		desc: "Describe your symptoms and get matched with the right specialist near you — powered by AI.",
		cta: "Find Doctor",
	},
	{
		href: "/assistance",
		accentColor: "#f97316",
		accentBg: "rgba(249,115,22,0.08)",
		accentShadow: "rgba(249,115,22,0.18)",
		tag: "AI Powered",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={1.8}
				className="h-6 w-6"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
				/>
			</svg>
		),
		label: "AI Health Assistant",
		desc: "Chat with our AI about symptoms, medicines, and health tips — personalized, private, and always available.",
		cta: "Chat Now",
	},
];

function ToolCard({ tool, colSpan }: { tool: (typeof TOOLS)[0]; colSpan: "2" | "3" }) {
	return (
		<div
			className="group flex flex-col overflow-hidden rounded-[22px] p-7 transition-all duration-300 hover:-translate-y-1 max-lg:col-span-1"
			style={{
				gridColumn: `span ${colSpan}`,
				background: `linear-gradient(145deg, #ffffff 0%, ${tool.accentBg.replace("0.08", "0.04")} 100%)`,
				border: `1px solid ${tool.accentBg.replace("0.08", "0.2")}`,
				boxShadow: `0 2px 0 0 ${tool.accentColor}20, 0 4px 16px rgba(0,0,0,0.05)`,
			}}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLElement).style.boxShadow =
					`0 2px 0 0 ${tool.accentColor}40, 0 12px 32px ${tool.accentShadow}`;
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLElement).style.boxShadow =
					`0 2px 0 0 ${tool.accentColor}20, 0 4px 16px rgba(0,0,0,0.05)`;
			}}
		>
			{/* Tag + icon */}
			<div className="mb-5 flex items-center justify-between">
				<span
					className="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider"
					style={{ backgroundColor: tool.accentBg, color: tool.accentColor }}
				>
					{tool.tag}
				</span>
				<div
					className="flex h-11 w-11 items-center justify-center rounded-[14px]"
					style={{ backgroundColor: tool.accentBg, color: tool.accentColor }}
				>
					{tool.icon}
				</div>
			</div>

			<h3 className="font-heading mb-2.5 text-[1.2rem] font-bold text-[#111]">{tool.label}</h3>
			<p className="flex-1 text-[0.88rem] leading-relaxed text-[#666]">{tool.desc}</p>

			{/* CTA */}
			<div className="mt-6 flex items-center gap-3">
				<Link
					href={tool.href}
					className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[0.83rem] font-semibold text-white no-underline transition-all duration-200 hover:brightness-110 active:scale-95"
					style={{ backgroundColor: tool.accentColor }}
				>
					{tool.cta}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2.5}
						className="h-3.5 w-3.5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
						/>
					</svg>
				</Link>
			</div>
		</div>
	);
}

export function DoMoreCards() {
	return (
		<section className="mb-[80px] mt-16">
			{/* Section heading */}
			<div className="mb-10 flex items-end justify-between max-sm:flex-col max-sm:items-start max-sm:gap-3">
				<div>
					<span
						className="mb-2 inline-block rounded-full px-3.5 py-1 text-[0.72rem] font-semibold uppercase tracking-widest"
						style={{ backgroundColor: "rgba(68,142,148,0.1)", color: "#448e94" }}
					>
						Our Tools
					</span>
					<h2 className="font-heading text-[1.9rem] font-bold text-[#111] max-sm:text-[1.4rem]">
						Health at your fingertips
					</h2>
					<p className="mt-1.5 max-w-[420px] text-[0.9rem] leading-relaxed text-[#666]">
						AI-powered tools for your body, medicines, and care — all in one place.
					</p>
				</div>
				<Link
					href="/doctor-suggest"
					className="shrink-0 rounded-full border border-[#448e94]/30 px-5 py-2.5 text-[0.83rem] font-semibold text-[#448e94] no-underline transition-all hover:bg-[#448e94]/5 max-sm:hidden"
				>
					Explore all tools →
				</Link>
			</div>

			{/* Bento grid */}
			<div className="grid grid-cols-5 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
				<ToolCard tool={TOOLS[0]} colSpan="2" />
				<ToolCard tool={TOOLS[1]} colSpan="3" />
				<ToolCard tool={TOOLS[2]} colSpan="3" />
				<ToolCard tool={TOOLS[3]} colSpan="2" />
			</div>
		</section>
	);
}
