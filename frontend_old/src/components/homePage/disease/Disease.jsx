import React, { memo } from "react";
import "./disease.css";

import cancerImg from "../../../assets/diseases/cancer.svg";
import sugerImg from "../../../assets/diseases/suger.svg";
import heartImg from "../../../assets/diseases/heart.svg";
import mentalImg from "../../../assets/diseases/mental.svg";
import covidImg from "../../../assets/diseases/covid.svg";
import hmpvImg from "../../../assets/diseases/hmpv.svg";

function Diseases() {
	const diseases = [
		{
			title: "Cancer",
			icon: cancerImg,
		},
		{
			title: "Diabetes",
			icon: sugerImg,
		},
		{
			title: "Heart",
			icon: heartImg,
		},
		{
			title: "Mental",
			icon: mentalImg,
		},
		{
			title: "COVID-19",
			icon: covidImg,
		},
		{
			title: "HMPV",
			icon: hmpvImg,
		},
	];

	const handleCardClick = (disease) => {
		console.log(`Clicked on ${disease.title}`);
		// Add navigation or modal opening logic here
	};

	return (
		<div className="diseases-container">
			<h1 className="diseases-title">Diseases</h1>
			<div className="diseases-grid">
				{diseases.map((disease, index) => (
					<div
						key={index}
						className="disease-card"
						onClick={() => handleCardClick(disease)}
						role="button"
						tabIndex={0}
					>
						<h2 className="disease-title">{disease.title}</h2>
						<img src={disease.icon} alt={`${disease.title} icon`} loading="lazy" className="disease-icon" />
					</div>
				))}
			</div>
		</div>
	);
}

export default memo(Diseases);
