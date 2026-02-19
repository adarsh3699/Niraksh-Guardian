import { ClipboardList, Brain, UserCheck } from "lucide-react";

const STEPS = [
	{
		number: "01",
		icon: ClipboardList,
		title: "Describe Your Symptoms",
		description:
			"Type what you're feeling — headache, fever, chest pain, or anything else. Be as detailed or brief as you like.",
		color: "text-primary",
		bg: "bg-primary/10",
		border: "border-primary/20",
	},
	{
		number: "02",
		icon: Brain,
		title: "AI Analyzes in Seconds",
		description:
			"Our Gemini-powered AI cross-references your symptoms with thousands of conditions and suggests the most likely causes.",
		color: "text-violet-600",
		bg: "bg-violet-50",
		border: "border-violet-200",
	},
	{
		number: "03",
		icon: UserCheck,
		title: "Get Matched to a Specialist",
		description:
			"Receive tailored doctor recommendations by specialty — so you see the right expert without the guesswork.",
		color: "text-emerald-600",
		bg: "bg-emerald-50",
		border: "border-emerald-200",
	},
];

export function HowItWorks() {
	return (
		<section className="mb-[80px] mt-4 py-12">
			{/* Header */}
			<div className="mb-12 text-center">
				<span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
					Simple Process
				</span>
				<h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
					How It Works
				</h2>
				<p className="mt-3 text-base text-muted sm:text-lg">
					From symptom to specialist in three easy steps.
				</p>
			</div>

			{/* Steps */}
			<div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
				{/* Connector line (desktop only) */}
				<div
					aria-hidden
					className="absolute left-[16.66%] right-[16.66%] top-[2.5rem] hidden h-px bg-border md:block"
				/>

				{STEPS.map(({ number, icon: Icon, title, description, color, bg, border }) => (
					<div key={number} className="relative flex flex-col items-center text-center">
						{/* Icon bubble */}
						<div
							className={`relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border-2 ${bg} ${border} shadow-card`}
						>
							<Icon className={`h-8 w-8 ${color}`} />
							{/* Number badge */}
							<span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-white">
								{number}
							</span>
						</div>
						<h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
						<p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>
					</div>
				))}
			</div>
		</section>
	);
}
