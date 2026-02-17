import { memo, useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";
import { apiCall } from "../utils";
import { useNavigate } from "react-router-dom";

import { DNA } from "react-loader-spinner";

import "../styles/prescriptionExplainer.css";

const PrescriptionExplainer = () => {
	const navigate = useNavigate();
	const [uploadedFiles, setUploadedFiles] = useState([]);
	const [uploaded, setUploaded] = useState(false);
	const [loading, setLoading] = useState(false);

	const [description, setDescription] = useState("");
	const [medicines, setMedicines] = useState([]);
	const [selectedMedicines, setSelectedMedicines] = useState([]);

	// Load saved prescription data from sessionStorage on initial render
	useEffect(() => {
		const savedDescription = sessionStorage.getItem("prescriptionDescription");
		const savedMedicines = sessionStorage.getItem("prescriptionMedicines");
		const savedSelectedMedicines = sessionStorage.getItem("prescriptionSelectedMedicines");
		
		if (savedDescription) {
			setDescription(savedDescription);
			setUploaded(true);
		}
		
		if (savedMedicines) {
			try {
				setMedicines(JSON.parse(savedMedicines));
			} catch (error) {
				console.error("Error parsing saved medicines:", error);
			}
		}
		
		if (savedSelectedMedicines) {
			try {
				setSelectedMedicines(JSON.parse(savedSelectedMedicines));
			} catch (error) {
				console.error("Error parsing saved selected medicines:", error);
			}
		}
	}, []);

	// Save prescription data to sessionStorage whenever it changes
	useEffect(() => {
		if (description) {
			sessionStorage.setItem("prescriptionDescription", description);
		}
		
		if (medicines.length > 0) {
			sessionStorage.setItem("prescriptionMedicines", JSON.stringify(medicines));
		}
		
		sessionStorage.setItem("prescriptionSelectedMedicines", JSON.stringify(selectedMedicines));
	}, [description, medicines, selectedMedicines]);

	// Memoize the onDrop handler to avoid re-creation on every render
	// Handle file drop
	const onDrop = useCallback((acceptedFiles) => {
		const newFiles = acceptedFiles.map((file) => ({
			file,
			preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
		}));
		setUploadedFiles((prev) => [...prev, ...newFiles]);
	}, []);

	// Memoize the handleUpload function
	const handleSearch = useCallback(async () => {
		if (uploadedFiles.length === 0) return;

		const formData = new FormData();
		uploadedFiles.forEach((fileObj) => formData.append("files", fileObj.file));

		try {
			setLoading(true);
			const response = await apiCall("ai/prescription", "POST", formData, true);

			setDescription(response.data?.description); // Update UI with API response
			setUploaded(true);

			// Extract medicines from the response
			if (response.data?.medicines && Array.isArray(response.data?.medicines)) {
				setMedicines(response.data.medicines);
			} else {
				// Try to extract medicine names from the description using a simple regex pattern
				// This is a fallback in case the API doesn't return structured medicine data
				const medicineRegex = /\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b\s*(?:\d+\s*(?:mg|mcg|g|ml|IU))?/g;
				const medicineMatches = response.data?.description?.match(medicineRegex) || [];
				const uniqueMedicines = [...new Set(medicineMatches)];
				setMedicines(uniqueMedicines);
			}
		} catch (error) {
			console.error("Upload Error:", error);
			alert("Error uploading files. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [uploadedFiles]);

	// Handle medicine selection
	const handleMedicineSelection = (medicine) => {
		setSelectedMedicines((prev) => {
			if (prev.includes(medicine)) {
				return prev.filter((med) => med !== medicine);
			} else {
				return [...prev, medicine];
			}
		});
	};

	// Redirect to Drug Interaction page and medicine search page
	const goToDrugInteraction = () => {
		// If only one medicine is selected, redirect to medicine search page
		if (selectedMedicines.length === 1) {
			// Store the selected medicine in sessionStorage for the search
			sessionStorage.setItem("medicine", JSON.stringify([selectedMedicines[0]]));
			// Navigate to the medicine search page
			navigate("/medicine_search");
			return;
		}

		// For multiple medicines, proceed with drug interaction check
		if (selectedMedicines.length < 2) {
			alert("Please select at least two medicines to check for interactions");
			return;
		}

		// Clean up medicine names before storing
		const cleanedMedicines = selectedMedicines.map((med) => {
			// Remove any dosage information and clean up the name
			const nameOnly = med.split(/\s+\d+\s*(?:mg|mcg|g|ml|IU)/i)[0].trim();
			return nameOnly || med; // Use original if cleaning fails
		});

		// Store selected medicines in sessionStorage to pass to the drug interaction page
		sessionStorage.setItem("selectedMedicines", JSON.stringify(cleanedMedicines));

		// Navigate to the Drug Drug Interaction page
		navigate("/drug-drug-interaction");
	};

	// Memoize the handleReset function
	const handleReset = useCallback(() => {
		setUploadedFiles([]);
		setDescription("");
		setUploaded(false);
		setMedicines([]);
		setSelectedMedicines([]);
		
		// Clear session storage items related to prescription
		sessionStorage.removeItem("prescriptionDescription");
		sessionStorage.removeItem("prescriptionMedicines");
		sessionStorage.removeItem("prescriptionSelectedMedicines");
	}, []);

	const removeFile = (index) => {
		setUploadedFiles((uploadedFiles) => {
			const newFiles = [...uploadedFiles];
			if (newFiles[index].preview) {
				URL.revokeObjectURL(newFiles[index].preview);
			}
			newFiles.splice(index, 1);
			return newFiles;
		});
	};

	// Memoize Dropzone hooks
	const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/jpeg": [],
			"image/png": [],
			"application/pdf": [],
		},
		multiple: true,
		noClick: true, // Disable click upload globally
	});

	return (
		<div id="prescriptionExplainer" {...getRootProps()}>
			<h1 className="pageTitle">Upload and Analyze Your Prescription</h1>
			<p className="pageSubtitle">
				Upload your prescriptions to get detailed medicine information and suggestions.
			</p>

			{/* Dropzone */}
			<div
				className={`dropzone ${isDragActive ? "active" : ""}`}
				onClick={(e) => {
					e.stopPropagation(); // Prevent triggering dropzone onClick
					open(); // Open file dialog
				}}
			>
				<input {...getInputProps()} />
				{isDragActive ? <p>Drop your files here...</p> : <p>Drag & drop files here or click to select them</p>}
			</div>

			{uploadedFiles.length > 0 && (
				<div className="uploaded-files">
					{uploadedFiles.map((file, index) => (
						<div key={index} className="file-preview">
							{file.preview ? (
								<img src={file.preview} width="100px" alt="Preview" />
							) : (
								<>
									<div className="pdf-preview">PDF</div>
									<span className="file-name">{file.file.name}</span>
								</>
							)}
							<button className="remove-file" onClick={() => removeFile(index)} aria-label="Remove file">
								×
							</button>
						</div>
					))}
				</div>
			)}

			{/* Buttons */}
			<div className="button-container">
				{uploaded ? (
					<button className="primary-btn reset-btn" onClick={handleReset}>
						Reset
					</button>
				) : (
					<button
						className="primary-btn upload-btn"
						onClick={handleSearch}
						disabled={uploadedFiles.length === 0 || loading}
					>
						Search
					</button>
				)}
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

			{/* Prescription Details */}
			{description && !loading && (
				<div className="prescription-details">
					<ReactMarkdown className="card-content">{description}</ReactMarkdown>
				</div>
			)}

			{/* Medicine Selection Section */}
			{medicines.length > 0 && !loading && (
				<div className="medicine-interaction-section">
					<h2>Identified Medicines</h2>
					<p>Select medicines to check for drug interactions:</p>

					<div className="medicine-list">
						{medicines.map((medicine, index) => (
							<div
								key={index}
								className={`medicine-item ${selectedMedicines.includes(medicine) ? "selected" : ""}`}
								onClick={() => handleMedicineSelection(medicine)}
							>
								{medicine}
							</div>
						))}
					</div>

					<button
						className="interaction-btn"
						onClick={goToDrugInteraction}
						disabled={selectedMedicines.length < 1}
					>
						{selectedMedicines.length === 1 ? "Check Medicine Details" : "Check Drug Interactions"}
					</button>
				</div>
			)}
		</div>
	);
};

export default memo(PrescriptionExplainer);
