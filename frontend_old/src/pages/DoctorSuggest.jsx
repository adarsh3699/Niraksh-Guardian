import { useState, useEffect, memo } from "react";
import PropTypes from "prop-types";
import { apiCall } from "../utils";

import symptomsToCategory from "../../jsonData/symptoms_to_category.json";

import AYUSHHomoeopath from "../../jsonData/AYUSHHomoeopath.json";
import Cosmetic_Aesthetic_Dentist from "../../jsonData/Cosmetic_Aesthetic_Dentist.json";
import Dental_Surgeon from "../../jsonData/Dental_Surgeon.json";
import Dentist from "../../jsonData/Dentist.json";
import General_Physician from "../../jsonData/General_Physician.json";
import Gynecologist from "../../jsonData/Gynecologist.json";
import Obstetrician from "../../jsonData/Obstetrician.json";
import Orthopedic_surgeon from "../../jsonData/Orthopedic_surgeon.json";
import Dermatologist from "../../jsonData/Dermatologist.json";
import Periodontist from "../../jsonData/Periodontist.json";
import Sexologist from "../../jsonData/Sexologist.json";

import "../styles/doctorSuggest.css";

const DoctoreCategories = {
	AYUSHHomoeopath,
	Cosmetic_Aesthetic_Dentist,
	Dental_Surgeon,
	Dentist,
	General_Physician,
	Gynecologist,
	Obstetrician,
	Orthopedic_surgeon,
	Dermatologist,
	Periodontist,
	Sexologist,
};

const DoctorSuggest = () => {
	const [category, setCategory] = useState("");
	const [symptoms, setSymptoms] = useState("");
	const [doctors, setDoctors] = useState([]);
	const [fromChat, setFromChat] = useState(false);
	const [fromHomepage, setFromHomepage] = useState(false);
	const [symptomSummary, setSymptomSummary] = useState("");
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisError, setAnalysisError] = useState("");
	const [analysisReasoning, setAnalysisReasoning] = useState("");
	const [recommendedCategories, setRecommendedCategories] = useState([]);

	useEffect(() => {
		// Check for data sources in order of priority

		// 1. Check if we have the AI-generated symptom summary from chat assistant
		const summary = sessionStorage.getItem("symptomSummary");
		if (summary) {
			setSymptoms(summary);
			setSymptomSummary(summary);
			setFromChat(true);
			// Clear the session storage to avoid persisting between visits
			sessionStorage.removeItem("symptomSummary");

			// Use the enhanced semantic analysis instead of simple keyword matching
			analyzeSymptomsSemantically(summary);
			return; // Exit early if we found chat data
		}

		// 2. Check if we have symptoms from home page search
		const homeSearchSymptoms = sessionStorage.getItem("homeSearchSymptoms");
		if (homeSearchSymptoms) {
			setSymptoms(homeSearchSymptoms);
			setFromHomepage(true);
			// Clear the session storage
			sessionStorage.removeItem("homeSearchSymptoms");

			// Analyze the symptoms from home page search
			analyzeSymptomsSemantically(homeSearchSymptoms);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// New function that uses the backend LangChain-based symptom analyzer
	const analyzeSymptomsSemantically = async (symptomText) => {
		setIsAnalyzing(true);
		setAnalysisError("");
		setAnalysisReasoning("");
		setRecommendedCategories([]);

		// Check if the symptom text indicates non-healthcare content
		// Common patterns that suggest non-healthcare conversation
		const nonMedicalKeywords = [
			"just doing time pass",
			"not related to healthcare",
			"not a medical",
			"not medical",
			"no symptoms"
		];

		// Check if any non-medical keyword is found
		const isNonMedical = nonMedicalKeywords.some(keyword => 
			symptomText.toLowerCase().includes(keyword.toLowerCase())
		);

		if (isNonMedical) {
			setIsAnalyzing(false);
			setAnalysisError("This conversation doesn't appear to be healthcare-related. No doctors will be suggested.");
			return;
		}

		try {
			// Call the backend API for semantic analysis using LangChain
			const response = await apiCall("ai/analyze-symptoms", "POST", {
				symptoms: symptomText,
			});

			// If API returns data but categories array is empty with specific reasoning
			if (response?.data?.categories && response.data.categories.length === 0) {
				if (response.data.reasoning && 
					(response.data.reasoning.includes("doesn't appear to be healthcare-related") ||
					 response.data.reasoning.includes("No healthcare concerns"))) {
					setAnalysisError("This conversation doesn't appear to be healthcare-related. No doctors will be suggested.");
					return;
				}
			}

			if (response?.data?.categories && response.data.categories.length > 0) {
				// Use the categories returned from the semantic analysis
				const searchCategories = response.data.categories;
				setRecommendedCategories(searchCategories);

				// Store the reasoning if provided
				if (response.data.reasoning) {
					setAnalysisReasoning(response.data.reasoning);
				}

				fetchDoctorsForCategories(searchCategories);
			} else {
				// Fallback to keyword-based matching if semantic analysis returned no results
				findDoctorWithKeywordMatching(symptomText);
			}
		} catch (error) {
			console.error("Error in semantic symptom analysis:", error);
			setAnalysisError("There was an error analyzing your symptoms. Falling back to basic matching.");
			// Fallback to original method
			findDoctorWithKeywordMatching(symptomText);
		} finally {
			setIsAnalyzing(false);
		}
	};

	// The original keyword-based matching approach (kept as a fallback)
	const findDoctorWithKeywordMatching = (symptomText) => {
		let searchCategories = [];

		// Current approach: simple keyword matching
		for (let symptom in symptomsToCategory) {
			if (symptomText.toLowerCase().includes(symptom.toLowerCase())) {
				searchCategories = symptomsToCategory[symptom] || [];
				break;
			}
		}

		if (searchCategories.length === 0) {
			// Default to General Physician if no specific category found
			searchCategories = ["General_Physician"];
		}

		setRecommendedCategories(searchCategories);
		setAnalysisReasoning("Based on keyword matching in your symptoms.");
		fetchDoctorsForCategories(searchCategories);
	};

	// Extract the common doctor fetching logic into a separate function
	const fetchDoctorsForCategories = (categories) => {
		try {
			const doctorResults = [];
			const categoryPriority = {}; // Map to store priority of each category

			// Assign priority values based on order in the categories array
			categories.forEach((cat, index) => {
				categoryPriority[cat] = index; // Lower index = higher priority
			});

			// Collect doctors from all recommended categories
			categories.forEach((cat) => {
				if (DoctoreCategories[cat]) {
					// Tag each doctor with their category for sorting
					const doctorsWithCategory = DoctoreCategories[cat].map((doc) => ({
						...doc,
						__categoryPriority: categoryPriority[cat], // Add category priority as a metadata field
					}));
					doctorResults.push(...doctorsWithCategory);
				}
			});

			// Sort doctors by:
			// 1. Category priority (primary recommendation first)
			// 2. Experience (high to low)
			// 3. Fee (low to high)
			doctorResults.sort((a, b) => {
				// First sort by category priority
				if (a.__categoryPriority !== b.__categoryPriority) {
					return a.__categoryPriority - b.__categoryPriority;
				}

				// If from same category, sort by experience
				let expA = parseInt(a["Years of Experience"]) || 0;
				let expB = parseInt(b["Years of Experience"]) || 0;
				if (expA !== expB) {
					return expB - expA;
				}

				// If same experience, sort by fee
				let feeA = parseInt(a["Consult Fee"]?.replace("₹", "")) || 0;
				let feeB = parseInt(b["Consult Fee"]?.replace("₹", "")) || 0;
				return feeA - feeB;
			});

			setDoctors(doctorResults);
		} catch (error) {
			console.error("Error loading doctor data:", error);
		}
	};

	const findDoctor = async (e) => {
		e.preventDefault();
		setIsAnalyzing(true);
		setAnalysisError("");
		setAnalysisReasoning("");
		setRecommendedCategories([]);

		// If category is selected directly, use that
		if (category) {
			setRecommendedCategories([category]);
			setAnalysisReasoning("Category selected directly by you.");
			fetchDoctorsForCategories([category]);
			setIsAnalyzing(false);
			return;
		}

		// If symptoms are entered but no category selected, use semantic analysis
		if (symptoms) {
			try {
				// Use the semantic analysis API
				const response = await apiCall("ai/analyze-symptoms", "POST", {
					symptoms: symptoms,
				});

				// If API returns data but categories array is empty with specific reasoning
				if (response?.data?.categories && response.data.categories.length === 0) {
					if (response.data.reasoning && 
						(response.data.reasoning.includes("doesn't appear to be healthcare-related") ||
						 response.data.reasoning.includes("No healthcare concerns"))) {
						setAnalysisError("This conversation doesn't appear to be healthcare-related. No doctors will be suggested.");
						setIsAnalyzing(false);
						return;
					}
				}

				if (response?.data?.categories && response.data.categories.length > 0) {
					setRecommendedCategories(response.data.categories);
					if (response.data.reasoning) {
						setAnalysisReasoning(response.data.reasoning);
					}
					fetchDoctorsForCategories(response.data.categories);
				} else {
					// Fallback to basic matching
					findDoctorWithKeywordMatching(symptoms);
				}
			} catch (error) {
				console.error("Error in semantic analysis:", error);
				setAnalysisError("There was an error analyzing your symptoms. Falling back to basic matching.");
				findDoctorWithKeywordMatching(symptoms);
			}
		} else {
			setDoctors([]);
		}

		setIsAnalyzing(false);
	};

	return (
		<div id="doctorSuggest">
			<form className="container" onSubmit={findDoctor}>
				<h1>Find the Right Doctor</h1>

				<NotificationSection
					fromChat={fromChat}
					fromHomepage={fromHomepage}
					symptoms={symptoms}
					analysisError={analysisError}
					symptomSummary={symptomSummary}
				/>

				<RecommendationsSection
					recommendedCategories={recommendedCategories}
					analysisReasoning={analysisReasoning}
				/>

				<SearchForm
					category={category}
					symptoms={symptoms}
					isAnalyzing={isAnalyzing}
					setCategory={setCategory}
					setSymptoms={setSymptoms}
					doctorCategories={DoctoreCategories}
				/>

				<ResultsSection isAnalyzing={isAnalyzing} doctors={doctors} symptoms={symptoms} category={category} />
			</form>
		</div>
	);
};

// Render a doctor card
const DoctorCard = memo(({ doctor, index }) => {
	const isPrimaryRecommendation = doctor.__categoryPriority === 0 && index < 3;

	return (
		<div className={`doctor-card ${isPrimaryRecommendation ? "primary-recommendation-card" : ""}`}>
			{isPrimaryRecommendation && <div className="recommendation-badge">Top Recommendation</div>}
			<p>
				<strong>{doctor.Name}</strong>
			</p>
			<p>Speciality: {doctor.Speciality}</p>
			<p>Experience: {doctor["Years of Experience"]} years</p>
			<p>Consultation Fee: {doctor["Consult Fee"]}</p>
			{doctor.Location && <p>Location: {doctor.Location}</p>}
		</div>
	);
});

DoctorCard.displayName = "DoctorCard";
DoctorCard.propTypes = {
	doctor: PropTypes.shape({
		Name: PropTypes.string.isRequired,
		Speciality: PropTypes.string.isRequired,
		"Years of Experience": PropTypes.string.isRequired,
		"Consult Fee": PropTypes.string.isRequired,
		Location: PropTypes.string,
		__categoryPriority: PropTypes.number.isRequired,
	}).isRequired,
	index: PropTypes.number.isRequired,
};

// Render notification section
const NotificationSection = memo(({ fromChat, fromHomepage, symptoms, analysisError, symptomSummary }) => {
	// Determine if this is a non-healthcare related conversation
	const isNonHealthcareRelated = analysisError && 
		analysisError.includes("doesn't appear to be healthcare-related");

	return (
		<>
			{fromChat && !isNonHealthcareRelated && (
				<div className="from-chat-notice">
					Recommendations based on AI analysis of your health assistant chat
				</div>
			)}

			{fromHomepage && !isNonHealthcareRelated && (
				<div className="from-homepage-notice">
					Analyzing your search: <strong>{symptoms}</strong>
				</div>
			)}

			{isNonHealthcareRelated ? (
				<div className="analysis-error warning">
					<h3>No Doctor Recommendations Available</h3>
					<p>{analysisError}</p>
					<p>Please use the healthcare assistant for medical queries to get relevant doctor suggestions.</p>
				</div>
			) : analysisError && (
				<div className="analysis-error">{analysisError}</div>
			)}

			{fromChat && symptomSummary && !isNonHealthcareRelated && (
				<div className="symptom-summary">
					<h3>Symptom Analysis:</h3>
					<p>{symptomSummary}</p>
				</div>
			)}
		</>
	);
});

NotificationSection.displayName = "NotificationSection";
NotificationSection.propTypes = {
	fromChat: PropTypes.bool.isRequired,
	fromHomepage: PropTypes.bool.isRequired,
	symptoms: PropTypes.string.isRequired,
	analysisError: PropTypes.string.isRequired,
	symptomSummary: PropTypes.string.isRequired,
};

// Render recommended specialists section
const RecommendationsSection = memo(({ recommendedCategories, analysisReasoning }) => {
	// Don't show recommendations if there are none or if error indicates non-healthcare conversation
	if (recommendedCategories.length === 0) return null;

	return (
		<div className="recommended-specialists">
			<h3>Recommended Specialists:</h3>
			<ul>
				{recommendedCategories.map((cat, index) => (
					<li key={index}>
						{cat.replace(/_/g, " ")}
						{index === 0 && <span className="primary-recommendation">Primary Recommendation</span>}
					</li>
				))}
			</ul>
			{analysisReasoning && (
				<div className="reasoning">
					<h4>Why these specialists are recommended:</h4>
					<p>{analysisReasoning}</p>
				</div>
			)}
		</div>
	);
});

RecommendationsSection.displayName = "RecommendationsSection";
RecommendationsSection.propTypes = {
	recommendedCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
	analysisReasoning: PropTypes.string.isRequired,
};

// Render search form
const SearchForm = memo(({ category, symptoms, isAnalyzing, setCategory, setSymptoms, doctorCategories }) => {
	return (
		<>
			<label>Select Category:</label>
			<select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isAnalyzing}>
				<option value="">Not Sure? Enter Symptoms Below</option>
				{Object.keys(doctorCategories).map((cat) => (
					<option key={cat} value={cat}>
						{cat.replace(/_/g, " ")}
					</option>
				))}
			</select>

			<label>Or Describe Your Symptoms:</label>
			<input
				type="text"
				value={symptoms}
				disabled={category || isAnalyzing}
				onChange={(e) => setSymptoms(e.target.value)}
				placeholder="E.g., 'I have a headache for 3 days with fever'"
			/>
			<button type="submit" disabled={isAnalyzing || (!category && !symptoms)}>
				{isAnalyzing ? "Analyzing Symptoms..." : "Find Doctors"}
			</button>
		</>
	);
});

SearchForm.displayName = "SearchForm";
SearchForm.propTypes = {
	category: PropTypes.string.isRequired,
	symptoms: PropTypes.string.isRequired,
	isAnalyzing: PropTypes.bool.isRequired,
	setCategory: PropTypes.func.isRequired,
	setSymptoms: PropTypes.func.isRequired,
	doctorCategories: PropTypes.object.isRequired,
};

// Render results section
const ResultsSection = memo(({ isAnalyzing, doctors, symptoms, category }) => {
	// Check if there's an error message related to non-healthcare content in the DOM
	const nonHealthcareErrorElement = document.querySelector('.analysis-error.warning');
	const isNonHealthcareRelated = !!nonHealthcareErrorElement;

	if (isNonHealthcareRelated) {
		return null; // Don't show any results for non-healthcare related content
	}

	if (isAnalyzing) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
				<p>Analyzing your symptoms for the best specialist match...</p>
			</div>
		);
	}

	if (doctors.length > 0) {
		return (
			<>
				<h2 className="results-heading">Recommended Doctors</h2>
				<div className="doctor-grid">
					{doctors.map((doctor, index) => (
						<DoctorCard key={index} doctor={doctor} index={index} />
					))}
				</div>
			</>
		);
	}

	if (symptoms || category) {
		return (
			<div className="no-results">
				<p>No doctors found. Try describing your symptoms differently or select another category.</p>
			</div>
		);
	}

	return null;
});

ResultsSection.displayName = "ResultsSection";
ResultsSection.propTypes = {
	isAnalyzing: PropTypes.bool.isRequired,
	doctors: PropTypes.array.isRequired,
	symptoms: PropTypes.string.isRequired,
	category: PropTypes.string.isRequired,
};

export default memo(DoctorSuggest);
