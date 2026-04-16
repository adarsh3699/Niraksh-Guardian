"use client";

import { useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import type { LabReportComponent } from "@/types/report";
import { ModalHeader } from "./modal/ModalHeader";
import { AIInsightSection } from "./modal/AIInsightSection";
import { SymptomConnectionsSection } from "./modal/SymptomConnectionsSection";
import { RelatedConditionsSection } from "./modal/RelatedConditionsSection";
import { TrendSection } from "./modal/TrendSection";
import { GuidanceSection } from "./modal/GuidanceSection";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ComponentDetailModalProps {
	component: LabReportComponent | null;
	isOpen: boolean;
	onClose: () => void;
	onSymptomClick: (symptom: string) => void;
	onFindSpecialist: (specialization: string) => void;
	className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/**
 * ComponentDetailModal component
 * 
 * Main modal component that displays comprehensive information about a lab component.
 * Composes all modal sections: ModalHeader, AIInsightSection, SymptomConnectionsSection,
 * RelatedConditionsSection, TrendSection, and GuidanceSection.
 * 
 * Features:
 * - Full-screen overlay on desktop (≥768px)
 * - Bottom sheet (90% viewport height) on mobile (<768px)
 * - Drag handle for mobile swipe-down gesture
 * - Prevents body scroll when open
 * - Closes on Escape key, backdrop click, or close button
 * - Animates with fade-in/scale-up on open, fade-out on close
 * - Supports keyboard navigation and focus trapping
 * 
 * Requirements:
 * - 6.1: Open full-screen modal overlay on component details click
 * - 6.5: Close on Escape key, backdrop click, or close button
 * - 6.6: Prevent body scroll when open
 * - 6.7: Animate with fade-in/scale-up on open, fade-out on close
 * - 9.1: Render as bottom sheet on mobile (<768px)
 * - 9.2: Allow vertical scrolling within bottom sheet
 * - 9.3: Display drag handle on mobile
 * - 9.4: Close on swipe-down gesture
 * - 9.5: Occupy 90% of viewport height on mobile
 */
export function ComponentDetailModal({
	component,
	isOpen,
	onClose,
	onSymptomClick,
	onFindSpecialist,
	className,
}: ComponentDetailModalProps) {
	// Ref to the modal content container for focus trapping
	const modalRef = useRef<HTMLDivElement>(null);
	// Ref to the element that was focused before the modal opened
	const previousFocusRef = useRef<HTMLElement | null>(null);

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}

		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	// Save/restore focus and move focus into modal when it opens
	useEffect(() => {
		if (isOpen) {
			// Save the currently focused element so we can restore it on close
			previousFocusRef.current = document.activeElement as HTMLElement;

			// Move focus to the first focusable element inside the modal
			const frame = requestAnimationFrame(() => {
				if (!modalRef.current) return;
				const focusable = modalRef.current.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				);
				if (focusable.length > 0) {
					focusable[0].focus();
				}
			});
			return () => cancelAnimationFrame(frame);
		} else {
			// Restore focus to the element that was focused before the modal opened
			if (previousFocusRef.current) {
				previousFocusRef.current.focus();
				previousFocusRef.current = null;
			}
		}
	}, [isOpen]);

	// Handle Escape key press and focus trapping
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
				return;
			}

			// Focus trap: keep Tab/Shift+Tab within the modal
			if (event.key === "Tab" && modalRef.current) {
				const focusable = Array.from(
					modalRef.current.querySelectorAll<HTMLElement>(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
					),
				).filter((el) => !el.hasAttribute("disabled"));

				if (focusable.length === 0) return;

				const first = focusable[0];
				const last = focusable[focusable.length - 1];

				if (event.shiftKey) {
					// Shift+Tab: if focus is on first element, wrap to last
					if (document.activeElement === first) {
						event.preventDefault();
						last.focus();
					}
				} else {
					// Tab: if focus is on last element, wrap to first
					if (document.activeElement === last) {
						event.preventDefault();
						first.focus();
					}
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	// Handle backdrop click
	const handleBackdropClick = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			if (event.target === event.currentTarget) {
				onClose();
			}
		},
		[onClose]
	);

	// Handle mobile swipe-down gesture
	const handleTouchStart = useCallback((event: React.TouchEvent) => {
		const touch = event.touches[0];
		const startY = touch.clientY;

		const handleTouchMove = (moveEvent: TouchEvent) => {
			const currentTouch = moveEvent.touches[0];
			const deltaY = currentTouch.clientY - startY;

			// Close if swiped down more than 100px
			if (deltaY > 100) {
				onClose();
				document.removeEventListener("touchmove", handleTouchMove);
			}
		};

		const handleTouchEnd = () => {
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleTouchEnd);
		};

		document.addEventListener("touchmove", handleTouchMove);
		document.addEventListener("touchend", handleTouchEnd);
	}, [onClose]);

	// Don't render if not open or no component
	if (!isOpen || !component) {
		return null;
	}

	return (
		<>
			{/* Backdrop overlay */}
			<div
				className={cn(
					"fixed inset-0 z-50 bg-black/50 backdrop-blur-sm h-full",
					"transition-opacity duration-300",
					isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
				onClick={handleBackdropClick}
				aria-hidden="true"
			/>

			{/* Modal container */}
			<div
				ref={modalRef}
				className={cn(
					"fixed z-50",
					// Desktop: full-screen centered modal
					"md:inset-0 md:flex md:items-center md:justify-center md:p-4",
					// Mobile: bottom sheet
					"max-md:inset-x-0 max-md:bottom-0 max-md:top-[10%]",
					"transition-all duration-300",
					isOpen
						? "opacity-100 scale-100 translate-y-0"
						: "opacity-0 scale-95 translate-y-4 pointer-events-none",
					className,
				)}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				{/* Modal content */}
				<div
					className={cn(
						"relative w-full bg-background shadow-2xl",
						// Desktop: max width with rounded corners
						"md:max-w-4xl md:max-h-[90vh] md:rounded-2xl",
						// Mobile: bottom sheet with top rounded corners
						"max-md:h-full max-md:rounded-t-2xl",
						"flex flex-col overflow-hidden",
					)}
				>
					{/* Mobile drag handle */}
					<div
						className="md:hidden flex items-center justify-center py-3 cursor-grab active:cursor-grabbing"
						onTouchStart={handleTouchStart}
						aria-label="Drag to close"
					>
						<div className="w-12 h-1.5 bg-border rounded-full" />
					</div>

					{/* Scrollable content area */}
					<div className="flex-1 overflow-y-auto">
						{/* Modal header */}
						<ModalHeader component={component} onClose={onClose} />

						{/* Modal sections */}
						<div className="px-6 py-4 space-y-4">
							{/* AI Insight Section */}
							<AIInsightSection component={component} />

							{/* Symptom Connections Section */}
							<SymptomConnectionsSection
								component={component}
								onSymptomClick={onSymptomClick}
							/>

							{/* Related Conditions Section */}
							<RelatedConditionsSection component={component} />

							{/* Trend Section */}
							<TrendSection component={component} />

							{/* Guidance Section */}
							<GuidanceSection
								component={component}
								onFindSpecialist={onFindSpecialist}
							/>
						</div>
					</div>

					{/* Modal footer */}
					<div className="border-t border-border bg-surface px-6 py-4">
						<div className="flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={onClose}
								className={cn(
									"inline-flex items-center justify-center rounded-lg px-4 py-2.5",
									"bg-border text-foreground font-medium text-sm",
									"transition-all duration-200",
									"hover:bg-border/80 hover:shadow-sm",
									"focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
									"active:scale-95",
								)}
								aria-label="Close modal"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
