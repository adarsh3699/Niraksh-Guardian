const STATS = [
	{
		value: "Gen AI",
		label: "AI Powered",
		sublabel: "latest model",
		color: "#448e94",
		bg: "rgba(68,142,148,0.08)",
	},
	{
		value: "24 / 7",
		label: "Always Available",
		sublabel: "no downtime",
		color: "#3b82f6",
		bg: "rgba(59,130,246,0.08)",
	},
	{
		value: "11",
		label: "Languages",
		sublabel: "including Hindi",
		color: "#7c3aed",
		bg: "rgba(124,58,237,0.08)",
	},
	{
		value: "100%",
		label: "Private & Free",
		sublabel: "zero data sold",
		color: "#059669",
		bg: "rgba(5,150,105,0.08)",
	},
];

export function StatsStrip() {
	return (
		<section
			className="relative my-6 overflow-hidden"
			style={{
				background: "linear-gradient(135deg, #f5fafb 0%, #eef7f8 50%, #f5fafb 100%)",
				borderTop: "1px solid rgba(68,142,148,0.12)",
				borderBottom: "1px solid rgba(68,142,148,0.12)",
			}}
		>
			{/* Subtle dot pattern */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-40"
				style={{
					backgroundImage: "radial-gradient(rgba(68,142,148,0.25) 1px, transparent 1px)",
					backgroundSize: "28px 28px",
				}}
			/>

			<div className="relative px-[5%] py-10">
				<div className="grid grid-cols-4 gap-6 max-md:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-4">
					{STATS.map((stat, i) => (
						<div key={i} className="flex flex-col items-center text-center">
							{/* Colored pill number */}
							<div
								className="mb-3 rounded-[16px] px-5 py-2.5"
								style={{ backgroundColor: stat.bg, border: `1px solid ${stat.color}22` }}
							>
								<span
									className="font-heading text-[2rem] font-bold leading-none tracking-tight max-sm:text-[1.5rem]"
									style={{ color: stat.color }}
								>
									{stat.value}
								</span>
							</div>
							<p className="font-heading text-[0.92rem] font-semibold text-[#111]">{stat.label}</p>
							<p className="mt-0.5 text-[0.75rem] text-[#888]">{stat.sublabel}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
