"use client";

import { useState, useCallback, useEffect, useRef, type ChangeEvent } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DoctorSearchParams } from "@/types/doctor";

/* ------------------------------------------------------------------ */
/*  Specialization options                                            */
/* ------------------------------------------------------------------ */

const SPECIALIZATIONS = [
	"General Physician",
	"Gynecologist",
	"Obstetrician",
	"Dermatologist",
	"Orthopedic Surgeon",
	"Dental Surgeon",
	"Dentist",
	"Periodontist",
	"Cosmetic/Aesthetic Dentist",
	"Sexologist",
	"AYUSH/Homoeopath",
	"Cardiologist",
	"Neurologist",
	"ENT Specialist",
	"Ophthalmologist",
	"Pediatrician",
	"Psychiatrist",
	"Pulmonologist",
	"Gastroenterologist",
	"Urologist",
] as const;

const SORT_OPTIONS = [
	{ value: "rating", label: "Rating" },
	{ value: "experience", label: "Experience" },
	{ value: "fee", label: "Consultation Fee" },
	{ value: "name", label: "Name" },
] as const;

/** Debounce delay for the search input (ms) */
const SEARCH_DEBOUNCE_MS = 400;

/* ------------------------------------------------------------------ */
/*  DebouncedSearchInput — uncontrolled with debounced emit           */
/* ------------------------------------------------------------------ */

interface DebouncedSearchInputProps {
	/** Starting value — only read on mount (use `key` to reinitialise) */
	initialValue: string;
	/** Called after SEARCH_DEBOUNCE_MS of inactivity */
	onDebouncedChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

function DebouncedSearchInput({
	initialValue,
	onDebouncedChange,
	placeholder,
	className,
}: DebouncedSearchInputProps) {
	const [text, setText] = useState(initialValue);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const v = e.target.value;
			setText(v);

			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => {
				onDebouncedChange(v);
			}, SEARCH_DEBOUNCE_MS);
		},
		[onDebouncedChange],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	return (
		<input
			type="text"
			value={text}
			onChange={handleChange}
			placeholder={placeholder}
			className={className}
		/>
	);
}

/* ------------------------------------------------------------------ */
/*  DoctorFilters                                                     */
/* ------------------------------------------------------------------ */

interface DoctorFiltersProps {
	params: DoctorSearchParams;
	onChange: (params: Partial<DoctorSearchParams>) => void;
	onReset?: () => void;
	/** Incrementing key to force-reset the debounced search input */
	searchResetKey?: number;
}

export function DoctorFilters({
	params,
	onChange,
	onReset,
	searchResetKey = 0,
}: DoctorFiltersProps) {
	const handleInput = useCallback(
		(field: keyof DoctorSearchParams) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const raw = e.target.value;
			if (field === "minFee" || field === "maxFee") {
				onChange({ [field]: raw === "" ? undefined : Number(raw), page: 1 });
			} else {
				onChange({ [field]: raw || undefined, page: 1 });
			}
		},
		[onChange],
	);

	const handleSearchDebounced = useCallback(
		(value: string) => {
			onChange({ search: value || undefined, page: 1 });
		},
		[onChange],
	);

	const toggleOrder = useCallback(() => {
		onChange({ order: params.order === "asc" ? "desc" : "asc", page: 1 });
	}, [params.order, onChange]);

	const inputClass = cn(
		"h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground",
		"placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
	);

	return (
		<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="font-heading text-base font-bold text-foreground">Find a Doctor</h3>
				{onReset && (
					<button
						type="button"
						onClick={onReset}
						className="text-xs font-medium text-muted hover:text-foreground hover:underline"
					>
						Reset Filters
					</button>
				)}
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{/* Free-text search — debounced */}
				<div className="relative sm:col-span-2 lg:col-span-4">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
					<DebouncedSearchInput
						key={`search-${searchResetKey}`}
						initialValue={params.search ?? ""}
						onDebouncedChange={handleSearchDebounced}
						placeholder="Search by name, qualification…"
						className={cn(inputClass, "pl-9")}
					/>
				</div>

				{/* Specialization */}
				<select
					value={params.specialization ?? ""}
					onChange={handleInput("specialization")}
					className={cn(inputClass, params.matchTags && "cursor-not-allowed opacity-50")}
					aria-label="Specialization"
					disabled={!!params.matchTags}
				>
					<option value="">All Specializations</option>
					{SPECIALIZATIONS.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>

				{/* City */}
				<input
					type="text"
					value={params.city ?? ""}
					onChange={handleInput("city")}
					placeholder="City"
					className={inputClass}
				/>

				{/* State */}
				<input
					type="text"
					value={params.state ?? ""}
					onChange={handleInput("state")}
					placeholder="State"
					className={inputClass}
				/>

				{/* Sort + order */}
				<div className="flex gap-2">
					<select
						value={params.sortBy ?? "rating"}
						onChange={handleInput("sortBy")}
						className={cn(
							inputClass,
							"flex-1",
							params.matchTags && "cursor-not-allowed opacity-50",
						)}
						aria-label="Sort by"
						disabled={!!params.matchTags}
					>
						{SORT_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={toggleOrder}
						className={cn(
							"flex h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-muted",
							"transition-colors hover:bg-border",
							params.matchTags ? "cursor-not-allowed opacity-50" : "hover:text-foreground",
						)}
						aria-label={`Sort ${params.order === "asc" ? "ascending" : "descending"}`}
						disabled={!!params.matchTags}
					>
						<ArrowUpDown className="size-3.5" />
						{params.order === "asc" ? "ASC" : "DESC"}
					</button>
				</div>

				{/* Fee range */}
				<input
					type="number"
					min={0}
					value={params.minFee ?? ""}
					onChange={handleInput("minFee")}
					placeholder="Min Fee (₹)"
					className={inputClass}
				/>
				<input
					type="number"
					min={0}
					value={params.maxFee ?? ""}
					onChange={handleInput("maxFee")}
					placeholder="Max Fee (₹)"
					className={inputClass}
				/>
			</div>
		</div>
	);
}
