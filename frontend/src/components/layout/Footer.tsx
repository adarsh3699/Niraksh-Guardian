import Image from "next/image";
import Link from "next/link";
import { Instagram, Github, Linkedin, Phone, Mail, MapPin } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Footer — Server Component                                         */
/*  Beige gradient bg, 4-column grid, matching old frontend           */
/* ------------------------------------------------------------------ */

const QUICK_LINKS = [
	{ label: "Home", href: "/" },
	{ label: "Find Doctor", href: "/doctor-suggest" },
	{ label: "Services", href: "/assistance" },
	{ label: "About", href: "/about" },
];

const SERVICES = [
	{ label: "Symptom Analysis", href: "/doctor-suggest" },
	{ label: "Medicine Info", href: "/medicine" },
	{ label: "Health Assistant", href: "/assistance" },
	{ label: "Prescription", href: "/prescription" },
];

const SOCIALS = [
	{ label: "Instagram", href: "https://instagram.com/adarsh3699", icon: Instagram },
	{ label: "GitHub", href: "https://github.com/adarsh3699", icon: Github },
	{ label: "LinkedIn", href: "https://linkedin.com/in/adarsh3699", icon: Linkedin },
];

export function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer
			className="w-full"
			style={{
				background: "linear-gradient(180deg, #f5f0e6, #f0e2d0)",
				boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
			}}
		>
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1.2fr]">
					{/* ---- Brand ---- */}
					<div>
						<Link href="/" className="flex items-center gap-3">
							<Image
								src="/brandLogo.png"
								alt="Niraksh Guardian Logo"
								width={40}
								height={40}
								className="size-14"
							/>
							<span className="font-heading text-xl font-bold tracking-tight text-primary">
								Niraksh Guardian
							</span>
						</Link>
						<p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
							Your trusted AI-powered health assistant — symptom analysis, medicine info, and
							personalized health recommendations.
						</p>

						{/* Social icons */}
						<div className="mt-5 flex gap-3">
							{SOCIALS.map(({ label, href, icon: Icon }) => (
								<a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={label}
									className="flex size-9 items-center justify-center rounded-full border border-primary/30 text-primary transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-white"
								>
									<Icon className="size-4" />
								</a>
							))}
						</div>
					</div>

					{/* ---- Quick Links ---- */}
					<div>
						<h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
							Quick Links
						</h3>
						<ul className="mt-4 flex flex-col gap-2.5">
							{QUICK_LINKS.map(({ label, href }) => (
								<li key={label}>
									<Link
										href={href}
										className="text-sm text-muted transition-colors hover:text-primary"
									>
										{label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* ---- Services ---- */}
					<div>
						<h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
							Services
						</h3>
						<ul className="mt-4 flex flex-col gap-2.5">
							{SERVICES.map(({ label, href }) => (
								<li key={label}>
									<Link
										href={href}
										className="text-sm text-muted transition-colors hover:text-primary"
									>
										{label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* ---- Contact ---- */}
					<div>
						<h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
							Contact Us
						</h3>
						<ul className="mt-4 flex flex-col gap-3">
							<li className="flex items-start gap-2.5 text-sm text-muted">
								<Phone className="mt-0.5 size-4 shrink-0 text-primary" />
								<span>+91 9470 7564 60</span>
							</li>
							<li className="flex items-start gap-2.5 text-sm text-muted">
								<Mail className="mt-0.5 size-4 shrink-0 text-primary" />
								<a
									href="mailto:adarsh3699@gmail.com"
									className="transition-colors hover:text-primary"
								>
									adarsh3699@gmail.com
								</a>
							</li>
							<li className="flex items-start gap-2.5 text-sm text-muted">
								<MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
								<span>Jalandhar, Punjab, India</span>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Copyright bar */}
			<div className="border-t border-black/10">
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
					<p className="text-center text-xs text-muted">
						&copy; {year} Niraksh Guardian. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
