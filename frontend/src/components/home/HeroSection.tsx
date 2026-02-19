"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function HeroSection() {
	const [symptoms, setSymptoms] = useState("");
	const router = useRouter();

	function handleSearch(e: FormEvent) {
		e.preventDefault();
		const query = symptoms.trim();
		if (!query) return;
		router.push(`/doctor-suggest?symptoms=${encodeURIComponent(query)}`);
	}

	return (
		<div className="flex w-full items-center justify-between py-0" style={{ minHeight: "85vh" }}>
			{/* Left: text content */}
			<div className="max-w-[50%] max-md:max-w-full max-md:text-center">
				<h1 className="font-heading mb-2.5 text-[2.6em] font-bold leading-[50px] max-sm:text-[1.5rem] max-sm:leading-[30px]">
					Find the <span style={{ color: "#ff5657", fontWeight: "bold" }}>best doctor</span> on your
					symptoms.
				</h1>
				<p className="mb-5 text-[1.3em] text-[#333] max-sm:text-base">
					Search for any symptoms or disease.
				</p>

				<form onSubmit={handleSearch} className="flex items-center max-md:mt-5 max-md:flex-col">
					{/* Searchbar */}
					<div
						className="mr-[15px] flex w-full items-center rounded-[10px] border max-md:mr-0"
						style={{ borderColor: "#448e94" }}
					>
						<input
							type="text"
							placeholder="Search Your symptoms here"
							value={symptoms}
							onChange={(e) => setSymptoms(e.target.value)}
							aria-label="Search symptoms"
							className="h-[50px] w-full rounded-[10px] border-none px-[10px] text-base outline-none"
						/>
					</div>
					{/* Search button */}
					<button
						type="submit"
						disabled={!symptoms.trim()}
						className="h-[52px] cursor-pointer rounded-[10px] border-0 px-5 text-[22px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 max-md:mt-2.5 max-md:w-full"
						style={{ backgroundColor: "rgb(223, 137, 52)", whiteSpace: "nowrap" }}
					>
						Search
					</button>
				</form>
			</div>

			{/* Right: professional illustration */}
			<Image
				src="/professionalImg.svg"
				alt="Medical professionals"
				width={500}
				height={500}
				priority
				className="w-[40%] max-md:hidden"
			/>
		</div>
	);
}
