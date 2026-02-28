import { Metadata } from "next";
import { ShieldCheck, HeartPulse, Cpu, Github, Linkedin, Mail } from "lucide-react";

export const metadata: Metadata = {
	title: "About Us | Niraksh Guardian",
	description:
		"Learn more about Niraksh Guardian, our mission to democratize healthcare using AI, and the technology behind our platform.",
};

const TECH_STACK = [
	{ name: "Next.js 15", desc: "React Framework", icon: "🌐" },
	{ name: "React 19", desc: "UI Library", icon: "⚛️" },
	{ name: "Tailwind CSS v4", desc: "Styling Engine", icon: "🎨" },
	{ name: "TypeScript", desc: "Type Safety", icon: "📘" },
	{ name: "Gemini AI", desc: "Medical AI Engine", icon: "🧠" },
	{ name: "Prisma ORM", desc: "Database Access", icon: "🗄️" },
	{ name: "PostgreSQL", desc: "Primary Database", icon: "🐘" },
	{ name: "Cloudinary", desc: "Media Storage", icon: "☁️" },
];

export default function AboutPage() {
	return (
		<main className="flex min-h-screen flex-col bg-background">
			{/* Hero Section */}
			<section className="relative overflow-hidden bg-surface py-20 sm:py-32">
				{/* Background mesh */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(68,142,148,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(92,179,167,0.08),transparent_50%)]" />
				</div>

				<div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl text-center">
						<div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
							Our Mission
						</div>
						<h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
							Democratizing Access to <br className="hidden sm:block" />
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
								Intelligent Healthcare
							</span>
						</h1>
						<p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
							Niraksh Guardian is an AI-powered health assistant designed to make medical
							information, symptom analysis, and prescription understanding accessible to everyone,
							regardless of location or background.
						</p>
					</div>
				</div>
			</section>

			{/* Core Values / Features */}
			<section className="py-20 sm:py-32">
				<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
						{/* Value 1 */}
						<div className="flex flex-col gap-4 rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-border transition-all hover:shadow-md">
							<div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<HeartPulse className="size-7" />
							</div>
							<h3 className="font-heading text-xl font-bold text-foreground">Patient-Centric</h3>
							<p className="text-muted leading-relaxed">
								We believe patients should have complete transparency and understanding of their
								health data, prescriptions, and potential conditions before seeing a doctor.
							</p>
						</div>

						{/* Value 2 */}
						<div className="flex flex-col gap-4 rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-border transition-all hover:shadow-md">
							<div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Cpu className="size-7" />
							</div>
							<h3 className="font-heading text-xl font-bold text-foreground">
								AI-Powered Insights
							</h3>
							<p className="text-muted leading-relaxed">
								By leveraging state-of-multimodal AI, we provide instant, accurate, and safe
								preliminary health insights based on your unique symptoms and history.
							</p>
						</div>

						{/* Value 3 */}
						<div className="flex flex-col gap-4 rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-border transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
							<div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<ShieldCheck className="size-7" />
							</div>
							<h3 className="font-heading text-xl font-bold text-foreground">Privacy First</h3>
							<p className="text-muted leading-relaxed">
								Your health data is highly sensitive. Niraksh Guardian operates with strict data
								privacy principles, ensuring your medical history remains yours alone.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Tech Stack */}
			<section className="bg-surface py-20 sm:py-32">
				<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
							Built with Modern Technology
						</h2>
						<p className="mt-4 text-lg text-muted">
							Our platform is engineered for speed, reliability, and scale using the bleeding edge
							of web technology.
						</p>
					</div>

					<div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
						{TECH_STACK.map((tech) => (
							<div
								key={tech.name}
								className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-6 text-center transition-transform hover:-translate-y-1 hover:shadow-sm"
							>
								<span className="text-3xl">{tech.icon}</span>
								<h4 className="mt-2 font-heading font-semibold text-foreground">{tech.name}</h4>
								<p className="text-xs text-muted">{tech.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Team / Contact */}
			<section className="py-20 sm:py-32">
				<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="overflow-hidden rounded-3xl bg-primary px-6 py-16 sm:p-20 lg:p-24 relative">
						{/* Abstract background shapes */}
						<div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
						<div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-black/10 blur-3xl" />

						<div className="relative z-10 mx-auto max-w-2xl text-center">
							<h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
								Meet the Creator
							</h2>
							<p className="mt-6 text-lg leading-relaxed text-white/70">
								Niraksh Guardian is developed and maintained by <b>Team Niraksh</b>, led by{" "}
								<b>Adarsh Suman</b>, a passionate software engineer dedicated to using AI for social
								good.
							</p>

							<div className="mt-10 flex flex-wrap items-center justify-center gap-4">
								<a
									href="https://github.com/adarsh3699"
									target="_blank"
									rel="noopener noreferrer"
									className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-primary transition-all hover:scale-105 hover:bg-gray-50"
								>
									<Github className="size-5" />
									GitHub
								</a>
								<a
									href="https://linkedin.com/in/adarsh3699"
									target="_blank"
									rel="noopener noreferrer"
									className="group flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-semibold text-white transition-all hover:bg-white/20"
								>
									<Linkedin className="size-5" />
									LinkedIn
								</a>
								<a
									href="mailto:adarsh3699@gmail.com"
									className="group flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-semibold text-white transition-all hover:bg-white/20"
								>
									<Mail className="size-5" />
									Email
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
