import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTABanner() {
	return (
		<section className="mb-16 mt-4">
			<div
				className="relative overflow-hidden rounded-[28px] px-8 py-16 text-center sm:px-14"
				style={{
					background: "linear-gradient(135deg, #1d6b70 0%, #2d8a8f 35%, #448e94 65%, #4da8a0 100%)",
				}}
			>
				{/* Mesh highlights */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(ellipse 60% 70% at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 90% 80%, rgba(255,255,255,0.08) 0%, transparent 60%)",
					}}
				/>
				{/* Dot grid */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 opacity-[0.06]"
					style={{
						backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
						backgroundSize: "22px 22px",
					}}
				/>
				{/* Decorative ring — top-left */}
				<div
					aria-hidden
					className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full"
					style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full"
					style={{ border: "1.5px solid rgba(255,255,255,0.08)" }}
				/>

				<div className="relative z-10">
					{/* Badge */}
					<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[0.8rem] font-medium text-white/90 backdrop-blur-sm">
						<Sparkles className="h-3.5 w-3.5" />
						Free to use · No credit card needed
					</div>

					<h2 className="font-heading text-[2.2rem] font-bold leading-tight text-white sm:text-[2.8rem] max-sm:text-[1.7rem]">
						Take charge of your health today.
					</h2>
					<p className="mx-auto mt-4 max-w-[500px] text-[0.975rem] leading-relaxed text-white/70 sm:text-[1.05rem]">
						Join thousands who get AI-powered health guidance, doctor recommendations, and medicine
						information — all in one place.
					</p>

					<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Link
							href="/register"
							className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-[0.9rem] font-bold text-[#2d7a7f] shadow-[0_4px_20px_rgba(0,0,0,0.15)] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.2)] active:translate-y-0"
						>
							Get Started Free
							<ArrowRight className="h-4 w-4" />
						</Link>
						<Link
							href="/doctor-suggest"
							className="inline-flex h-12 items-center rounded-xl border border-white/30 px-8 text-[0.9rem] font-semibold text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 active:translate-y-0"
						>
							Find a Doctor
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
