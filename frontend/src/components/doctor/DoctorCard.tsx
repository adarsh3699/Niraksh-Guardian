"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
	Star,
	MapPin,
	Phone,
	ChevronDown,
	ChevronUp,
	IndianRupee,
	Briefcase,
	Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/types/doctor";

/* ------------------------------------------------------------------ */
/*  Star rating helper                                                */
/* ------------------------------------------------------------------ */

function StarRating({ rating }: { rating: number }) {
	return (
		<div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
			{Array.from({ length: 5 }, (_, i) => (
				<Star
					key={i}
					className={cn(
						"size-3.5",
						i < Math.round(rating) ? "fill-accent text-accent" : "text-border",
					)}
				/>
			))}
			<span className="ml-1 text-xs font-medium text-muted">{rating.toFixed(1)}</span>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  DoctorCard                                                        */
/* ------------------------------------------------------------------ */

interface DoctorCardProps {
	doctor: Doctor;
	/** 0-based position in the relevance-sorted list — used to show "Best Match" ribbon */
	rank?: number;
}

export function DoctorCard({ doctor, rank }: DoctorCardProps) {
	const isTopMatch = rank === 0 && doctor._relevanceScore !== undefined;
	const [expanded, setExpanded] = useState(false);

	const toggle = useCallback(() => setExpanded((prev) => !prev), []);

	return (
		<div
			className={cn(
				"relative flex flex-col overflow-hidden rounded-xl border bg-surface shadow-card transition-shadow hover:shadow-md",
				isTopMatch ? "border-primary ring-1 ring-primary/30" : "border-border",
			)}
		>
			{/* Best Match ribbon */}
			{isTopMatch && (
				<div className="absolute right-0 top-0 z-10 overflow-hidden">
					<div className="bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
						Best Match
					</div>
				</div>
			)}
			{/* Header */}
			<div className="flex items-start gap-3 p-4">
				{/* Avatar / image */}
				<div className="relative size-14 flex-shrink-0 overflow-hidden rounded-full border border-border bg-background">
					{doctor.imageUrl ? (
						<Image
							src={doctor.imageUrl}
							alt={doctor.name}
							fill
							sizes="56px"
							className="object-cover"
						/>
					) : (
						<span className="flex size-full items-center justify-center text-lg font-bold text-primary">
							{doctor.name.charAt(0)}
						</span>
					)}
					{/* Availability dot */}
					<span
						className={cn(
							"absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface",
							doctor.isAvailable ? "bg-green-500" : "bg-gray-400",
						)}
						aria-label={doctor.isAvailable ? "Available" : "Unavailable"}
					/>
				</div>

				{/* Info */}
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-heading text-sm font-bold text-foreground">{doctor.name}</h4>
					<div className="flex flex-wrap items-center gap-1.5">
						<p className="truncate text-xs font-medium text-primary">{doctor.specialization}</p>
						{doctor._isNearby && (
							<span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
								<Navigation className="size-2.5" />
								Near You
							</span>
						)}
					</div>
					{doctor.qualification && (
						<p className="mt-0.5 truncate text-xs text-muted">{doctor.qualification}</p>
					)}
					<StarRating rating={doctor.rating} />
				</div>
			</div>

			{/* Quick stats */}
			<div className="grid grid-cols-3 gap-px border-t border-border bg-border">
				<div className="flex flex-col items-center bg-surface py-2">
					<span className="flex items-center gap-1 text-xs text-muted">
						<Briefcase className="size-3" /> Exp
					</span>
					<span className="text-sm font-semibold text-foreground">{doctor.experienceYears}y</span>
				</div>
				<div className="flex flex-col items-center bg-surface py-2">
					<span className="flex items-center gap-1 text-xs text-muted">
						<IndianRupee className="size-3" /> Fee
					</span>
					<span className="text-sm font-semibold text-foreground">₹{doctor.consultationFee}</span>
				</div>
				<div className="flex flex-col items-center bg-surface px-1 py-2">
					<span className="flex items-center gap-1 text-xs text-muted">
						<MapPin className="size-3" /> Location
					</span>
					<span className="text-center text-sm font-semibold leading-tight text-foreground">
						{doctor.city}, {doctor.state}
					</span>
				</div>
			</div>

			{/* Expandable section */}
			<div className="flex-1 p-4 pt-3">
				{/* Tags / condition chips */}
				{doctor.tags && doctor.tags.length > 0 && (
					<div className="mb-2 flex flex-wrap gap-1">
						{doctor.tags.slice(0, 5).map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary/80"
							>
								{tag}
							</span>
						))}
						{doctor.tags.length > 5 && (
							<span className="inline-flex items-center rounded-full bg-border px-2 py-0.5 text-[10px] font-medium text-muted">
								+{doctor.tags.length - 5} more
							</span>
						)}
					</div>
				)}

				{doctor.bio && (
					<p className={cn("text-xs leading-relaxed text-muted", !expanded && "line-clamp-2")}>
						{doctor.bio}
					</p>
				)}

				{expanded && (
					<div className="mt-3 space-y-1.5 text-xs text-muted">
						<p className="flex items-center gap-1.5">
							<MapPin className="size-3.5 text-primary" />
							{doctor.city}, {doctor.state}
						</p>
						{doctor.phone && (
							<a
								href={`tel:${doctor.phone}`}
								className="flex items-center gap-1.5 text-primary hover:underline"
							>
								<Phone className="size-3.5" />
								{doctor.phone}
							</a>
						)}
						{doctor.contactInfo && <p className="text-muted">{doctor.contactInfo}</p>}
					</div>
				)}
			</div>

			{/* Toggle button */}
			<button
				type="button"
				onClick={toggle}
				className="flex w-full items-center justify-center gap-1 border-t border-border py-2 text-xs font-medium text-muted transition-colors hover:bg-border hover:text-foreground"
			>
				{expanded ? (
					<>
						Less info <ChevronUp className="size-3.5" />
					</>
				) : (
					<>
						More info <ChevronDown className="size-3.5" />
					</>
				)}
			</button>
		</div>
	);
}
