import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./heroSection.css";

import professional from "../../../assets/professionalImg.svg";
// import captureIcon from "../../../assets/icons/capture.svg";

const HeroSection = () => {
	const [symptomInput, setSymptomInput] = useState("");
	const navigate = useNavigate();

	const handleSearch = (e) => {
		e.preventDefault();
		if (symptomInput.trim()) {
			// Store the symptom query in sessionStorage for the DoctorSuggest page
			sessionStorage.setItem("homeSearchSymptoms", symptomInput.trim());
			// Navigate to the doctor suggest page
			navigate("/doctor_suggest");
		}
	};

	return (
		<div className="hero-section">
			<div className="text-content">
				<h1 className="hero-title">
					Find the <span className="emergency-call">best doctor</span> on your symptoms.
				</h1>
				<p className="hero_desc">Search for any symptoms or disease.</p>
				<form className="searchArea" onSubmit={handleSearch}>
					<div className="searchbar">
						<input
							type="text"
							placeholder="Search Your symptoms here"
							value={symptomInput}
							onChange={(e) => setSymptomInput(e.target.value)}
						/>
						{/* <img src={captureIcon} className="captureBtn" loading="lazy" alt="Capture Icon" /> */}
					</div>
					<button type="submit" className="searchBtn" disabled={!symptomInput.trim()}>
						Search
					</button>
				</form>
			</div>
			{/* <div className="image-content"> */}
			<img src={professional} className="professional_image" loading="lazy" alt="Medical professionals" />
			{/* </div> */}
		</div>
	);
};

export default memo(HeroSection);
