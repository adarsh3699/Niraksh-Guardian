import { useEffect, useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";

import { apiCall } from "../utils";

import { DNA } from "react-loader-spinner";
import "../styles/drugDrugInteraction.css";

const DrugDrugInteraction = () => {
	const [medications, setMedications] = useState(["", ""]); // Start with 2 input fields
	const [loading, setLoading] = useState(false);
	const [description, setDescription] = useState("");
	const [isRedirected, setIsRedirected] = useState(false);

	// Maintain stable references to avoid recreating components and losing focus
	const inputRefs = useRef([]);

	// Update a specific medication by index - memoized
	const updateMedication = useCallback((index, value) => {
		setMedications((prevMeds) => {
			const newMeds = [...prevMeds];
			newMeds[index] = value;
			return newMeds;
		});
	}, []);

	// Check drug interactions between medications - memoized
	const checkInteractions = useCallback(async (meds) => {
		if (!meds || meds.length < 2) return;

		// Filter out any empty strings
		const filteredMeds = meds.filter((med) => med && med.trim() !== "");

		if (filteredMeds.length < 2) {
			alert("Please enter at least two medicine names.");
			return;
		}

		const medicinesStr = filteredMeds.join(", ");
		setLoading(true);

		try {
			const response = await apiCall("ai/drug-interaction", "POST", { medicines: medicinesStr });
			setDescription(response?.data.description);
		} catch (error) {
			console.error("Error checking drug interactions:", error);
			alert("Error checking drug interactions. Please try again.");
		} finally {
			setLoading(false);
		}
	}, []);

	// Handle adding a new medication field - memoized
	const handleAddMedication = useCallback(() => {
		setMedications((prevMeds) => [...prevMeds, ""]);
		// Focus will be set on the new field in the next render cycle
		setTimeout(() => {
			const newIndex = medications.length;
			if (inputRefs.current[newIndex]) {
				inputRefs.current[newIndex].focus();
			}
		}, 0);
	}, [medications.length]);

	// Handle checking interactions from the form - memoized
	const handleInteractionCheck = useCallback(
		(e) => {
			e.preventDefault();
			// Send medications to the API
			if (medications.length < 2 || medications[0] === "" || medications[1] === "") {
				return alert("Please enter at least two medicine names.");
			}

			const nonEmptyMedications = medications.filter((med) => med && med.trim() !== "");
			checkInteractions(nonEmptyMedications);
		},
		[medications, checkInteractions]
	);

	// Handle removing a medication - memoized
	const handleRemoveMedication = useCallback(
		(index) => {
			// Don't remove if we only have 2 medications left
			if (medications.length <= 2) {
				updateMedication(index, "");

				// Re-focus the emptied input
				setTimeout(() => {
					if (inputRefs.current[index]) {
						inputRefs.current[index].focus();
					}
				}, 0);
			} else {
				setMedications((prevMeds) => {
					const newMeds = prevMeds.filter((_, idx) => idx !== index);
					return newMeds;
				});

				// Focus previous input after removing
				setTimeout(() => {
					const focusIndex = Math.min(index, medications.length - 2);
					if (inputRefs.current[focusIndex]) {
						inputRefs.current[focusIndex].focus();
					}
				}, 0);
			}
		},
		[medications.length, updateMedication]
	);

	// Handle input change events - memoized
	const handleInputChange = useCallback(
		(index, e) => {
			updateMedication(index, e.target.value);
		},
		[updateMedication]
	);

	useEffect(() => {
		document.title = "Drug Drug Interaction | Niraksh";

		// Check for medicines from sessionStorage (from prescription page)
		const selectedMedicines = sessionStorage.getItem("selectedMedicines");
		if (selectedMedicines) {
			try {
				const parsedMedicines = JSON.parse(selectedMedicines);
				if (Array.isArray(parsedMedicines) && parsedMedicines.length >= 2) {
					console.log("Selected medicines from prescription:", parsedMedicines);
					setMedications(parsedMedicines);
					setIsRedirected(true);
					// Clear sessionStorage after using the data
					sessionStorage.removeItem("selectedMedicines");

					// Auto-check interactions if coming from prescription page
					checkInteractions(parsedMedicines);
				}
			} catch (error) {
				console.error("Error parsing selected medicines:", error);
			}
		} else {
			// Fallback to old localStorage behavior
			try {
				const temp = JSON.parse(localStorage.getItem("medicine") || "null");
				if (temp && Array.isArray(temp) && temp.length > 0) {
					setMedications(temp.length === 1 ? [...temp, ""] : temp);
				}
			} catch (error) {
				console.error("Error parsing medicines from localStorage:", error);
				setMedications(["", ""]);
			}
		}
	}, [checkInteractions]);

	return (
		<div id="drugDrugInteraction">
			<div className="container">
				<h1 className="pageTitle">Drug Drug Interaction Checker</h1>
				<p className="pageSubtitle">
					Enter the names of the medicines you are taking to check drug interactions or side effects with
					other medicines.
				</p>

				{isRedirected && (
					<div className="redirected-message">
						<p>Checking drug interactions for selected medicines from your prescription.</p>
					</div>
				)}

				<form id="interactionForm" onSubmit={handleInteractionCheck}>
					<div id="medicationInputs">
						{medications.map((med, index) => (
							<div key={`med-input-${index}`} className="searchbar">
								<input
									ref={(el) => (inputRefs.current[index] = el)}
									type="text"
									placeholder={`Enter medicine name ${index + 1}`}
									value={med || ""}
									onChange={(e) => handleInputChange(index, e)}
								/>

								<button
									type="button"
									className="removeBtn"
									onClick={() => handleRemoveMedication(index)}
								>
									&times;
								</button>
							</div>
						))}
					</div>
					<div className="button-container">
						<button
							type="button"
							id="addMedication"
							className="primary-btn"
							onClick={handleAddMedication}
							disabled={loading}
						>
							Add Another Medication
						</button>
						<button type="submit" className="search-btn" disabled={loading}>
							Search
						</button>
					</div>
				</form>
			</div>
			<div className="loading-spinner" style={{ textAlign: "center" }}>
				<DNA
					visible={loading}
					height="180"
					width="180"
					ariaLabel="dna-loading"
					wrapperStyle={{}}
					wrapperClass="dna-wrapper"
				/>
			</div>
			{description && !loading && (
				<div className="medicineInteractionDetails">
					<ReactMarkdown className="card-content">{description}</ReactMarkdown>
				</div>
			)}
		</div>
	);
};

export default DrugDrugInteraction;
