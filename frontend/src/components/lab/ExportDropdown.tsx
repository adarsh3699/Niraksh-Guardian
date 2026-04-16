"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Share2, Printer, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExportFormat = "pdf" | "csv" | "share" | "print";

interface ExportDropdownProps {
	onExport: (format: ExportFormat) => void;
	disabled?: boolean;
	className?: string;
}

const EXPORT_OPTIONS: { format: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
	{ format: "pdf",   label: "Download PDF",  icon: <FileText className="size-4" aria-hidden="true" />, description: "Full report as PDF" },
	{ format: "share", label: "Share link",    icon: <Share2   className="size-4" aria-hidden="true" />, description: "Secure shareable link" },
	{ format: "print", label: "Print",         icon: <Printer  className="size-4" aria-hidden="true" />, description: "Open print dialog" },
	{ format: "csv",   label: "Export CSV",    icon: <Download className="size-4" aria-hidden="true" />, description: "Components as CSV" },
];

export function ExportDropdown({ onExport, disabled = false, className }: ExportDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") { setIsOpen(false); buttonRef.current?.focus(); }
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [isOpen]);

	const handleToggle = useCallback(() => { if (!disabled) setIsOpen((p) => !p); }, [disabled]);
	const handleOptionClick = useCallback((format: ExportFormat) => { setIsOpen(false); onExport(format); }, [onExport]);

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			<button
				ref={buttonRef}
				type="button"
				onClick={handleToggle}
				disabled={disabled}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-label="Export lab report"
				className={cn(
					"inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
					"border-2 border-primary text-primary bg-transparent",
					"hover:bg-primary/10 active:bg-primary/20",
					"transition-all duration-200",
					"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
					"disabled:cursor-not-allowed disabled:opacity-50",
				)}
			>
				<Download className="size-4" aria-hidden="true" />
				<span>Export</span>
				<ChevronDown className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-180")} aria-hidden="true" />
			</button>

			{isOpen && (
				<div
					role="menu"
					aria-label="Export options"
					className={cn(
						"absolute right-0 z-50 mt-2 w-52 rounded-xl",
						"border border-border bg-surface shadow-dropdown",
					)}
				>
					<div className="p-1.5">
						{EXPORT_OPTIONS.map((option) => (
							<button
								key={option.format}
								type="button"
								role="menuitem"
								onClick={() => handleOptionClick(option.format)}
								className={cn(
									"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
									"text-foreground transition-colors duration-150",
									"hover:bg-primary/8 hover:text-primary",
									"focus:bg-primary/8 focus:text-primary focus:outline-none",
								)}
							>
								<span className="text-muted">{option.icon}</span>
								<div className="flex flex-col items-start">
									<span className="font-semibold">{option.label}</span>
									<span className="text-xs text-muted">{option.description}</span>
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
