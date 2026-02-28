"use client";

import { useCallback, useState } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import Image from "next/image";
import { Upload, X, FileImage, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface FileUploadZoneProps {
	/** Maximum number of files allowed (default: 1) */
	maxFiles?: number;
	/** Accepted MIME types (default: images) */
	accept?: Accept;
	/** Max file size in bytes (default: 5MB) */
	maxSize?: number;
	/** Callback when files change */
	onFilesChange: (files: File[]) => void;
	/** Disable the zone */
	disabled?: boolean;
	/** Custom label text */
	label?: string;
}

const DEFAULT_ACCEPT: Accept = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FileUploadZone({
	maxFiles = 1,
	accept = DEFAULT_ACCEPT,
	maxSize = MAX_SIZE,
	onFilesChange,
	disabled = false,
	label = "Drop images here or click to browse",
}: FileUploadZoneProps) {
	const [files, setFiles] = useState<File[]>([]);
	const [previews, setPreviews] = useState<string[]>([]);
	const [rejectionError, setRejectionError] = useState<string | null>(null);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			setRejectionError(null);

			// Limit total files
			const combined = [...files, ...acceptedFiles].slice(0, maxFiles);
			setFiles(combined);
			onFilesChange(combined);

			// Generate previews for new files
			// Note: Create object URLs for all files so we can display/download them,
			// but Next/Image will only work with actual images.
			const newPreviews = combined.map((file) => URL.createObjectURL(file));
			// Revoke old blob URLs
			previews.forEach((p) => URL.revokeObjectURL(p));
			setPreviews(newPreviews);
		},
		[files, maxFiles, onFilesChange, previews],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept,
		maxFiles: maxFiles - files.length,
		maxSize,
		disabled: disabled || files.length >= maxFiles,
		onDropRejected: (rejections) => {
			const firstError = rejections[0]?.errors[0];
			if (firstError?.code === "file-too-large") {
				setRejectionError(
					`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
				);
			} else if (firstError?.code === "file-invalid-type") {
				setRejectionError("Invalid file type. Please upload a supported file format.");
			} else if (firstError?.code === "too-many-files") {
				setRejectionError(`Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed.`);
			} else {
				setRejectionError(firstError?.message ?? "File upload failed.");
			}
		},
	});

	const removeFile = useCallback(
		(index: number) => {
			URL.revokeObjectURL(previews[index]);
			const nextFiles = files.filter((_, i) => i !== index);
			const nextPreviews = previews.filter((_, i) => i !== index);
			setFiles(nextFiles);
			setPreviews(nextPreviews);
			onFilesChange(nextFiles);
			setRejectionError(null);
		},
		[files, previews, onFilesChange],
	);

	const canAddMore = files.length < maxFiles && !disabled;

	return (
		<div className="space-y-3">
			{/* Dropzone */}
			{canAddMore && (
				<div
					{...getRootProps()}
					className={cn(
						"flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
						isDragActive
							? "border-primary bg-primary/5"
							: "border-border bg-background hover:border-primary/50 hover:bg-primary/5",
						disabled && "cursor-not-allowed opacity-50",
					)}
				>
					<input {...getInputProps()} />
					<Upload className={cn("mb-3 size-10", isDragActive ? "text-primary" : "text-muted")} />
					<p className="text-center text-sm font-medium text-foreground">{label}</p>
					<p className="mt-1 text-center text-xs text-muted">
						{maxFiles > 1 ? `Up to ${maxFiles} images` : "Single image"} • Max{" "}
						{Math.round(maxSize / 1024 / 1024)}MB each
					</p>
				</div>
			)}

			{/* Error */}
			{rejectionError && (
				<div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
					<AlertCircle className="size-4 flex-shrink-0" />
					{rejectionError}
				</div>
			)}

			{/* Previews */}
			{previews.length > 0 && (
				<div className="flex flex-wrap gap-3">
					{previews.map((preview, i) => {
						const isPdf = files[i]?.type === "application/pdf";
						return (
							<div
								key={preview}
								className="group relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
							>
								<div className="relative flex size-24 items-center justify-center sm:size-28">
									{isPdf ? (
										<div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
											<div className="rounded-full bg-accent/10 p-2">
												<span className="font-bold text-accent">PDF</span>
											</div>
										</div>
									) : (
										<Image
											src={preview}
											alt={`Upload ${i + 1}`}
											fill
											className="object-cover"
											sizes="112px"
										/>
									)}
								</div>

								{/* File name overlay */}
								<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4">
									<div className="flex items-center gap-1">
										<FileImage className="size-3 text-white/80" />
										<span className="truncate text-[10px] font-medium text-white/90">
											{files[i]?.name}
										</span>
									</div>
								</div>

								{/* Remove button */}
								{!disabled && (
									<button
										type="button"
										onClick={() => removeFile(i)}
										className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
										aria-label={`Remove ${files[i]?.name}`}
									>
										<X className="size-3" />
									</button>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
