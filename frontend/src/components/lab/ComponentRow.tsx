"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { TrendingUp, TrendingDown, Info, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeltaColor, calculateDelta } from "@/lib/lab";
import type { LabReportComponent } from "@/types/report";
import type { LabStatus } from "@/lib/lab";

export interface ComponentNote {
	id: string;
	note: string;
	createdAt: string;
	updatedAt: string;
}

interface ComponentRowProps {
	component: LabReportComponent;
	previousComponent?: LabReportComponent;
	comparisonMode: boolean;
	notes: ComponentNote[];
	onComponentSelect: (componentId: string) => void;
	onAddNote: (componentId: string, note: string) => void;
	onEditNote: (componentId: string, noteId: string, note: string) => void;
	onDeleteNote: (componentId: string, noteId: string) => void;
}

// Soft status badge — border + tinted bg, no solid fill
const STATUS_BADGE: Record<string, string> = {
	critical:   "bg-destructive/10 text-destructive border border-destructive/25",
	high:       "bg-warning/10 text-warning border border-warning/25",
	low:        "bg-warning/10 text-warning border border-warning/25",
	borderline: "bg-info/10 text-info border border-info/25",
	normal:     "bg-success/10 text-success border border-success/25",
	unknown:    "bg-border/60 text-muted",
};

// Value chip — very light tint
const VALUE_CHIP: Record<string, string> = {
	critical:   "bg-destructive/8 text-destructive",
	high:       "bg-warning/8 text-warning",
	low:        "bg-warning/8 text-warning",
	borderline: "bg-info/8 text-info",
	normal:     "bg-success/8 text-success",
	unknown:    "bg-border/40 text-muted",
};

export function ComponentRow({
	component,
	previousComponent,
	comparisonMode,
	notes,
	onComponentSelect,
	onAddNote,
	onEditNote,
	onDeleteNote,
}: ComponentRowProps) {
	const [isAddingNote, setIsAddingNote] = useState(false);
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
	const [noteInput, setNoteInput] = useState("");

	const status = component.status as LabStatus;
	const delta = comparisonMode && previousComponent
		? calculateDelta(component.observedValue, previousComponent.observedValue)
		: null;
	const deltaColors = delta ? getDeltaColor(delta.direction, status) : null;

	const handleNoteSubmit = useCallback(() => {
		if (!noteInput.trim()) return;
		if (editingNoteId) {
			onEditNote(component.id, editingNoteId, noteInput.trim());
			setEditingNoteId(null);
		} else {
			onAddNote(component.id, noteInput.trim());
			setIsAddingNote(false);
		}
		setNoteInput("");
	}, [noteInput, editingNoteId, component.id, onAddNote, onEditNote]);

	const handleNoteKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") { e.preventDefault(); handleNoteSubmit(); }
			else if (e.key === "Escape") { setIsAddingNote(false); setEditingNoteId(null); setNoteInput(""); }
		},
		[handleNoteSubmit],
	);

	const badgeClass = STATUS_BADGE[component.status] ?? STATUS_BADGE.unknown;
	const chipClass = VALUE_CHIP[component.status] ?? VALUE_CHIP.unknown;

	return (
		<>
			{/* Data row — <tr> with <td> for perfect column alignment */}
			<tr className="group border-b border-border last:border-b-0 hover:bg-primary/[0.018] transition-colors duration-100">
				{/* Component name — 30% */}
				<td className="px-4 py-3 align-middle">
					<span className="text-sm font-medium text-foreground">{component.componentName}</span>
				</td>

				{/* Observed value — 18% */}
				<td className="px-4 py-3 align-middle">
					<span className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums whitespace-nowrap", chipClass)}>
						{component.observedRaw || component.observedValue?.toFixed(2) || "—"}
						{component.unit && (
							<span className="text-[10px] font-normal opacity-70">{component.unit}</span>
						)}
						{delta && deltaColors && delta.direction !== "stable" && (
							<span className={cn("flex items-center gap-0.5", deltaColors.text)}>
								{delta.direction === "up"
									? <TrendingUp className="size-3" aria-hidden="true" />
									: <TrendingDown className="size-3" aria-hidden="true" />
								}
								<span className="text-[10px] font-bold">{Math.abs(delta.percentage).toFixed(0)}%</span>
							</span>
						)}
					</span>
				</td>

				{/* Min ref — 12% right-aligned */}
				<td className="px-4 py-3 align-middle text-right">
					<span className="text-sm text-muted tabular-nums whitespace-nowrap">
						{component.referenceMin?.toFixed(2) ?? "—"}
					</span>
				</td>

				{/* Max ref — 12% right-aligned */}
				<td className="px-4 py-3 align-middle text-right">
					<span className="text-sm text-muted tabular-nums whitespace-nowrap">
						{component.referenceMax?.toFixed(2) ?? "—"}
					</span>
				</td>

				{/* Status — 13% centered */}
				<td className="px-4 py-3 align-middle text-center">
					<span className={cn("inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", badgeClass)}>
						{component.status.charAt(0).toUpperCase() + component.status.slice(1)}
					</span>
				</td>

				{/* Actions — 15% centered */}
				<td className="px-4 py-3 align-middle">
					<div className="flex items-center justify-center gap-1">
						<button
							type="button"
							onClick={() => onComponentSelect(component.id)}
							className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/8 text-primary hover:bg-primary/15 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary whitespace-nowrap"
							aria-label={`View details for ${component.componentName}`}
						>
							<Info className="size-3 shrink-0" aria-hidden="true" />
							Details
						</button>
						<button
							type="button"
							onClick={() => { setIsAddingNote(true); setEditingNoteId(null); setNoteInput(""); }}
							disabled={isAddingNote || editingNoteId !== null}
							className="rounded-full p-1.5 text-muted hover:text-primary hover:bg-primary/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							aria-label={`Add note for ${component.componentName}`}
						>
							<Pencil className="size-3.5" aria-hidden="true" />
						</button>
					</div>
				</td>
			</tr>

			{/* Inline note input row */}
			{isAddingNote && (
				<tr className="border-b border-border bg-background/60">
					<td colSpan={6} className="px-4 py-2.5">
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={noteInput}
								onChange={(e) => setNoteInput(e.target.value)}
								onKeyDown={handleNoteKeyDown}
								placeholder="Add a note..."
								autoFocus
								className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								aria-label="Note input"
							/>
							<button type="button" onClick={handleNoteSubmit} disabled={!noteInput.trim()} className="rounded-full px-3 py-2 text-xs font-semibold bg-primary text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap" aria-label="Save note">Save</button>
							<button type="button" onClick={() => { setIsAddingNote(false); setNoteInput(""); }} className="rounded-full px-3 py-2 text-xs font-semibold border border-border text-muted hover:bg-border transition-colors whitespace-nowrap" aria-label="Cancel">Cancel</button>
						</div>
					</td>
				</tr>
			)}

			{/* Saved notes rows */}
			{notes.map((note) => (
				<tr key={note.id} className="border-b border-border bg-background/40">
					<td colSpan={6} className="px-4 py-2">
						{editingNoteId === note.id ? (
							<div className="flex items-center gap-2">
								<input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyDown={handleNoteKeyDown} autoFocus className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Edit note" />
								<button type="button" onClick={handleNoteSubmit} disabled={!noteInput.trim()} className="rounded-full px-3 py-1.5 text-xs font-semibold bg-primary text-white hover:brightness-110 disabled:opacity-50 transition-all whitespace-nowrap" aria-label="Save changes">Save</button>
								<button type="button" onClick={() => { setEditingNoteId(null); setNoteInput(""); }} className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border text-muted hover:bg-border transition-colors whitespace-nowrap" aria-label="Cancel">Cancel</button>
							</div>
						) : (
							<div className="flex items-center justify-between gap-3">
								<p className="text-sm text-muted">{note.note}</p>
								<div className="flex items-center gap-1 shrink-0">
									<button type="button" onClick={() => { setEditingNoteId(note.id); setNoteInput(note.note); setIsAddingNote(false); }} className="rounded-full p-1 text-muted hover:text-primary hover:bg-primary/8 transition-colors" aria-label="Edit note"><Pencil className="size-3.5" /></button>
									<button type="button" onClick={() => onDeleteNote(component.id, note.id)} className="rounded-full p-1 text-muted hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="Delete note"><Trash2 className="size-3.5" /></button>
								</div>
							</div>
						)}
					</td>
				</tr>
			))}
		</>
	);
}
