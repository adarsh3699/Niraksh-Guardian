import Image from "next/image";

interface AuthIllustrationPanelProps {
	/** Heading text — supports JSX for line breaks / gradient spans */
	heading?: React.ReactNode;
	/** Subtitle text */
	subtitle?: string;
	/** Show social proof element instead of abstract mockup */
	socialProof?: boolean;
}

export function AuthIllustrationPanel({
	heading = "Your AI Health Guardian",
	subtitle = "Experience the future of personal healthcare with professional tools at your fingertips.",
	socialProof = false,
}: AuthIllustrationPanelProps) {
	return (
		<div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#3a8085] via-primary to-primary-light p-12 lg:flex">
			{/* Animated ambient glows */}
			<div className="absolute -left-24 top-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-white/8 blur-[120px]" />
			<div
				className="absolute -right-24 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-primary-light/15 blur-[100px]"
				style={{ animationDelay: "1s" }}
			/>
			<div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5 blur-[80px]" />

			{/* Subtle dot grid overlay */}
			<div className="medical-pattern absolute inset-0 opacity-30" />

			<div className="relative z-10 flex max-w-md flex-col items-center text-center">
				{/* Branding */}
				<div className="mb-8 flex items-center gap-3">
					<div className="flex size-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg shadow-black/10">
						<Image
							src="/brandLogo.png"
							alt="Niraksh Guardian Logo"
							width={48}
							height={48}
							className="size-full object-contain"
						/>
					</div>
					<span className="font-heading text-3xl font-bold tracking-tight text-white">
						Niraksh Guardian
					</span>
				</div>

				{/* Heading & subtitle */}
				<h1 className="mb-6 font-heading text-4xl font-bold leading-tight text-white">{heading}</h1>
				<p className="text-lg leading-relaxed text-white/70">{subtitle}</p>

				{/* Decorative element */}
				{socialProof ? (
					<div className="mt-16 flex w-full max-w-sm flex-col items-center gap-5">
						<div className="flex items-center gap-4">
							<div className="flex -space-x-3">
								<div className="size-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-white/40 to-white/10" />
								<div className="size-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-primary-light/60 to-white/10" />
								<div className="size-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-white/30 to-primary-light/40" />
							</div>
							<p className="text-sm text-white/60">
								<span className="font-semibold text-white">Trusted</span> by thousands of users
							</p>
						</div>
						<div className="flex gap-1">
							{[...Array(5)].map((_, i) => (
								<svg
									key={i}
									className="size-4 text-yellow-300"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							))}
						</div>
					</div>
				) : (
					<div className="mt-16 flex h-52 w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/10 backdrop-blur-md">
						<div className="w-full space-y-4">
							<div className="h-2.5 w-3/4 rounded-full bg-white/20" />
							<div className="h-2.5 w-full rounded-full bg-white/12" />
							<div className="h-2.5 w-1/2 rounded-full bg-white/16" />
							<div className="h-2.5 w-2/3 rounded-full bg-white/8" />
						</div>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="absolute bottom-8 left-0 right-0 text-center text-xs text-white/40">
				&copy; {new Date().getFullYear()} Niraksh Guardian. All rights reserved.
			</div>
		</div>
	);
}
