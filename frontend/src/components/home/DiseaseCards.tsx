import Link from "next/link";
import Image from "next/image";

const DISEASES = [
	{ title: "Cancer", icon: "/diseases/cancer.svg", topic: "cancer" },
	{ title: "Diabetes", icon: "/diseases/suger.svg", topic: "diabetes" },
	{ title: "Heart", icon: "/diseases/heart.svg", topic: "heart-disease" },
	{ title: "Mental", icon: "/diseases/mental.svg", topic: "mental-health" },
	{ title: "COVID-19", icon: "/diseases/covid.svg", topic: "covid-19" },
	{ title: "HMPV", icon: "/diseases/hmpv.svg", topic: "hmpv" },
];

export function DiseaseCards() {
	return (
		<div className="py-8">
			<h1 className="font-heading mb-16 text-center text-[2.5rem] font-bold max-sm:text-[1.5rem]">
				Diseases
			</h1>

			{/* Cards grid — matches old: 6 per row, beige bg, square, hover lift */}
			<div className="flex flex-wrap justify-center gap-6 max-md:gap-4">
				{DISEASES.map((disease) => (
					<Link
						key={disease.topic}
						href={`/disease?topic=${disease.topic}`}
						className="flex aspect-square cursor-pointer flex-col items-center overflow-hidden rounded-[1rem] p-6 transition-transform duration-200 hover:-translate-y-[5px]"
						style={{
							backgroundColor: "rgb(242, 234, 225)",
							width: "calc((100% / 6) - 1.5rem)",
							minWidth: "120px",
						}}
					>
						<h2 className="font-heading mt-0 overflow-hidden text-ellipsis whitespace-nowrap text-[1.25rem] font-bold max-md:text-[1rem] max-sm:text-[0.75rem]">
							{disease.title}
						</h2>
						<div className="relative mt-auto flex h-[70%] w-full items-center justify-center">
							<Image
								src={disease.icon}
								alt={`${disease.title} icon`}
								fill
								className="object-contain"
								loading="lazy"
							/>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
