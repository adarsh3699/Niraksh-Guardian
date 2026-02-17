import { useEffect, useState, useCallback, memo } from "react";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";

import { apiCall } from "../utils";

import { DNA } from "react-loader-spinner";
import captureIcon from "../assets/icons/capture.svg";
import "../styles/medicineSearch.css";

const MedicineSearch = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [uploadedFiles, setUploadedFiles] = useState([]);
	const [selectedFile, setSelectedFile] = useState(null); // Store file but don't upload immediately
	const [description, setDescription] = useState(""); // Store API responsed

	// Initialize Dropzone
	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop: useCallback((acceptedFiles) => {
			const newFile = acceptedFiles[0];
			const fileWithPreview = {
				file: newFile,
				preview: newFile.type.startsWith("image/") ? URL.createObjectURL(newFile) : null,
			};
			setUploadedFiles([fileWithPreview]); // Update UI with selected file
			setSelectedFile(newFile); // Store file for later search
		}, []),
		accept: {
			"image/*": [".jpeg", ".jpg", ".png"],
			"application/pdf": [".pdf"],
		},
		maxSize: 5242880, // 5MB
		noClick: true, // Disable click upload globally
		multiple: false, // Allow only one file at a time
	});

	// Handle search when clicking the button
	const handleSearch = useCallback(async (e) => {
		if (e) e.preventDefault();

		if (!searchQuery && !selectedFile) {
			alert("Please enter a medicine name or upload a file.");
			return;
		}

		setLoading(true);
		// If a file is uploaded, send it to the API
		if (selectedFile) {
			const formData = new FormData();
			formData.append("file", selectedFile);

			try {
				const response = await apiCall("ai/medicine", "POST", formData, true);

				setDescription(response?.data.description); // Set API response

				const matches = response.data?.description.match(/_(.*?)_/g);
				const extractedWords = matches ? matches.map((word) => word.replace(/_/g, "")) : [];

				const localMeds = sessionStorage.getItem("medicine");

				console.log("localMeds", localMeds);
				console.log("extractedWords", extractedWords);

				sessionStorage.setItem("medicine", JSON.stringify([...extractedWords]));
			} catch (error) {
				console.error("Error uploading file:", error);
			} finally {
				setLoading(false);
			}
		} else if (searchQuery) {
			// If no file is uploaded, send the search query to the API
			try {
				const response = await apiCall("ai/medicine", "POST", { name: searchQuery });

				setDescription(response?.data.description); // Set API response

				const localMeds = JSON.parse(sessionStorage.getItem("medicine")) || [];

				if (!localMeds.includes(searchQuery)) {
					localMeds.push(searchQuery);
					sessionStorage.setItem("medicine", JSON.stringify(localMeds));
				}
			} catch (error) {
				console.error("Error searching for medicine:", error);
			} finally {
				setLoading(false);
			}
		} else {
			console.log("No search query or file uploaded");
		}
	}, [searchQuery, selectedFile]);

	const removeFile = useCallback(() => {
		if (uploadedFiles.length > 0 && uploadedFiles[0].preview) {
			URL.revokeObjectURL(uploadedFiles[0].preview);
		}
		setUploadedFiles([]);
		setSelectedFile(null);
		setDescription(""); // Clear description when file is removed
	}, [uploadedFiles]);

	// Auto-search if medicine was passed from PrescriptionExplainer
	useEffect(() => {
		const storedMedicines = sessionStorage.getItem("medicine");
		if (storedMedicines) {
			try {
				const medicineList = JSON.parse(storedMedicines);
				sessionStorage.removeItem("medicine");
				// If there's exactly one medicine, it likely came from PrescriptionExplainer
				if (medicineList.length === 1) {
					const medicineName = medicineList[0];
					setSearchQuery(medicineName);
					
					// Directly search with the medicine name rather than waiting for state update
					setTimeout(() => {
						// Pass medicine name directly to avoid the empty state issue
						const customSearch = async () => {
							try {
								setLoading(true);
								const response = await apiCall("ai/medicine", "POST", { name: medicineName });
								setDescription(response?.data.description);
							} catch (error) {
								console.error("Error searching for medicine:", error);
							} finally {
								setLoading(false);
							}
						};
						customSearch();
					}, 100);
				}
			} catch (error) {
				console.error("Error parsing medicine from sessionStorage:", error);
			}
		}
	}, []);

	useEffect(() => {
		return () => {
			uploadedFiles.forEach((file) => {
				if (file.preview) {
					URL.revokeObjectURL(file.preview);
				}
			});
		};
	}, [uploadedFiles]);

	return (
		<div {...getRootProps()} id="medicineSearch">
			<div className="search-section">
				<h1 className="pageTitle">Medicine Search</h1>
				<p className="pageSubtitle">
					Search for medicines by name or upload an image/PDF to get detailed information.
				</p>
				<form className="searchForm" onSubmit={handleSearch}>
					<div className="searchbar">
						<input
							type="text"
							placeholder="Enter medicine name"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<img
							src={captureIcon}
							className="captureBtn"
							loading="lazy"
							alt="Capture Icon"
							onClick={(e) => {
								e.stopPropagation(); // Prevent triggering dropzone onClick
								open(); // Open file dialog
							}}
						/>
					</div>
					<button
						type="submit"
						className={loading ? "searchBtn searchBtnLoading" : "searchBtn"}
						disabled={loading}
					>
						Search
					</button>
				</form>

				<div
					className={`dropzone-content ${isDragActive ? "active" : ""}`}
					onClick={(e) => {
						e.stopPropagation(); // Prevent triggering dropzone onClick
						open(); // Open file dialog
					}}
				>
					<input {...getInputProps()} />
					{isDragActive ? (
						<p>Drop the files here ...</p>
					) : (
						<p>Drag & drop images/PDFs here, or click the lens icon to select files</p>
					)}
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
								<button className="remove-file" onClick={removeFile} aria-label="Remove file">
									×
								</button>
							</div>
						))}
					</div>
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
			{description && !loading && (
				<div className="medicine-card">
					<h2 className="card-title">Medicine Details</h2>
					<ReactMarkdown className="card-content">{description}</ReactMarkdown>
				</div>
			)}
		</div>
	);
};

export default memo(MedicineSearch);
